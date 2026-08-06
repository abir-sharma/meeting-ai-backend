import axios from 'axios';
import FormData from 'form-data';

import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import {
  VoiceProfile,
  VoiceProfileDocument,
  VoiceProfileStatus,
} from './entities/voice-profile.entity';

import { CreateVoiceProfileDto } from './dto/create-voice-profile.dto';

import { S3Service } from 'src/common/s3/s3.service';
import { RegisterVoiceDto } from './dto/register-voice-profile.dto';
import { EventsGateway } from 'src/websocket/events.gateway';
import {
  QUEUE_VOICE_PROFILES,
  JOB_REGISTER_VOICE,
} from 'src/queue/queue.constants';

@Injectable()
export class VoiceProfilesService {
  constructor(
    @InjectModel(VoiceProfile.name)
    private readonly voiceProfileModel: Model<VoiceProfileDocument>,

    private readonly s3Service: S3Service,

    @InjectQueue(QUEUE_VOICE_PROFILES)
    private readonly voiceQueue: Queue,

    private readonly eventsGateway: EventsGateway,
  ) { }

  // ---------------------------------------------------------------------------
  // PRODUCER: store the audio + a placeholder profile, enqueue embedding work,
  // and return right away.
  // ---------------------------------------------------------------------------
  async registerVoice(
    dto: RegisterVoiceDto,
    file: any,
  ) {
    try {

      // 1. Upload audio to Contabo
      const uploadedFile =
        await this.s3Service.uploadFile({
          file,
          folder: 'voice-profiles',
        });

      // 2. Create the profile in PROCESSING state (embedding filled later)
      const profile =
        await this.voiceProfileModel.create({
          ...dto,
          audioUrl: uploadedFile.url,
          audioKey: uploadedFile.key,
          voiceEmbedding: [],
          status: VoiceProfileStatus.PROCESSING,
        });

      // 3. Enqueue the embedding job
      await this.voiceQueue.add(
        JOB_REGISTER_VOICE,
        { profileId: profile._id.toString() },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          // Keep recent completed jobs visible in Bull Board (last 100,
          // or anything from the past 24h) instead of deleting on success.
          removeOnComplete: { count: 100, age: 24 * 3600 },
          removeOnFail: false,
        },
      );

      return {
        id: profile._id,
        status: profile.status,
        message: 'Voice profile queued for processing',
      };

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException(
          'Voice profile already exists',
        );
      }

      throw new InternalServerErrorException(
        error?.response?.data ||
        error.message,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // CONSUMER: executed by the BullMQ worker.
  // ---------------------------------------------------------------------------
  async handleRegisterVoiceJob(profileId: string) {

    const profile = await this.voiceProfileModel.findById(profileId);

    if (!profile) {
      throw new NotFoundException('Voice profile not found');
    }

    try {

      // Re-fetch the enrollment audio
      const audioBuffer =
        await this.s3Service.getFileBuffer(profile.audioKey);
      const filename =
        profile.audioKey.split('/').pop() || 'voice.wav';
      // Send audio to the Python service
      const formData = new FormData();

      formData.append('file', audioBuffer, { filename });
      const pythonResponse = await axios.post(
        `${process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000'}/register-embedding`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const embedding = pythonResponse.data.embedding;

      if (!embedding) {
        throw new BadRequestException(
          'Voice embedding generation failed',
        );
      }

      profile.voiceEmbedding = embedding;
      profile.status = VoiceProfileStatus.COMPLETED;
      await profile.save();

      this.eventsGateway.emitVoiceProfileUpdate(profileId, {
        id: profileId,
        // name: profile.name,
        status: VoiceProfileStatus.COMPLETED,
        embeddingSize: embedding.length,
      });

      return {
        id: profileId,
        status: VoiceProfileStatus.COMPLETED,
        embeddingSize: embedding.length,
      };

    } catch (error: any) {

      // FastAPI returns validation/guard errors as { detail: "..." }
      const reason =
        error?.response?.data?.detail ||
        error?.response?.data ||
        error.message ||
        'Processing failed';

      profile.status = VoiceProfileStatus.FAILED;
      profile.error =
        typeof reason === 'string' ? reason : JSON.stringify(reason);
      await profile.save();

      this.eventsGateway.emitVoiceProfileUpdate(profileId, {
        id: profileId,
        status: VoiceProfileStatus.FAILED,
        error: profile.error,
      });

      throw error;
    }
  }

  async findAll() {
    return this.voiceProfileModel.find().sort({
      createdAt: -1,
    });
  }

  async findOne(id: string) {

    const profile =
      await this.voiceProfileModel.findById(id);

    if (!profile) {
      throw new NotFoundException(
        'Voice profile not found',
      );
    }

    return profile;
  }

  // Lightweight status check for polling clients.
  async getStatus(id: string) {

    const profile =
      await this.voiceProfileModel
        .findById(id)
        .select('name status error voiceEmbedding');

    if (!profile) {
      throw new NotFoundException(
        'Voice profile not found',
      );
    }

    return {
      id: profile._id,
      // name: profile.name,
      status: profile.status,
      error: profile.error || null,
      embeddingSize: profile.voiceEmbedding?.length || 0,
    };
  }

  // How many jobs are currently waiting / running / done / failed.
  async getQueueStats() {
    const counts = await this.voiceQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    return { queue: QUEUE_VOICE_PROFILES, counts };
  }

  async remove(id: string) {

    const profile =
      await this.voiceProfileModel.findByIdAndDelete(id);

    if (!profile) {
      throw new NotFoundException(
        'Voice profile not found',
      );
    }

    return {
      message:
        'Voice profile deleted successfully',
    };
  }
}
