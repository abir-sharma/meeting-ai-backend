import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

import { Meeting, MeetingDocument, MeetingStatus } from './entities/meeting.entity';
import { MeetingSpeakerSegment, MeetingSpeakerSegmentDocument } from 'src/meeting-speaker-segment/entities/meeting-speaker-segment.entity';
import { S3Service } from 'src/common/s3/s3.service';
import axios from 'axios';
import FormData from 'form-data';
import { VoiceProfile, VoiceProfileDocument } from 'src/voice-profiles/entities/voice-profile.entity';
import { EventsGateway } from 'src/websocket/events.gateway';
import { QUEUE_MEETINGS, JOB_PROCESS_MEETING } from 'src/queue/queue.constants';

@Injectable()
export class MeetingsService {

  constructor(
    @InjectModel(Meeting.name)
    private readonly meetingModel:
      Model<MeetingDocument>,

    @InjectModel(MeetingSpeakerSegment.name)
    private readonly segmentModel:
      Model<MeetingSpeakerSegmentDocument>,

    private readonly s3Service: S3Service,

    @InjectModel(VoiceProfile.name)
    private readonly voiceProfileModel: Model<VoiceProfileDocument>,

    @InjectQueue(QUEUE_MEETINGS)
    private readonly meetingsQueue: Queue,

    private readonly eventsGateway: EventsGateway,
  ) { }

  // ---------------------------------------------------------------------------
  // PRODUCER: accept the upload, persist the meeting, enqueue the heavy work,
  // and return immediately so the HTTP request is not blocked on the Python
  // service / transcription.
  // ---------------------------------------------------------------------------
  async processMeeting(
    data: {
      deviceId: string;
      createdBy: string;
      startTime: Date;
      endTime: Date;
    },
    file: any,
  ) {
    try {

      const {
        deviceId,
        createdBy,
        startTime,
        endTime,
      } = data;

      // Upload meeting audio to Contabo
      const uploadedAudio =
        await this.s3Service.uploadFile({
          file,
          folder: 'meetings',
        });

      // Create the meeting in PROCESSING state
      const meeting =
        await this.meetingModel.create({
          deviceId,
          createdBy,
          audioUrl: uploadedAudio.url,
          audioKey: uploadedAudio.key,
          transcript: '',
          summary: '',
          status: MeetingStatus.PROCESSING,
          startTime,
          endTime,
        });

      // Enqueue background job (only ids/keys travel through Redis)
      await this.meetingsQueue.add(
        JOB_PROCESS_MEETING,
        { meetingId: meeting._id.toString() },
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
        meetingId: meeting._id,
        status: meeting.status,
        message: 'Meeting queued for processing',
      };

    } catch (error: any) {

      throw new InternalServerErrorException(
        error?.response?.data ||
        error.message,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // CONSUMER: executed by the BullMQ worker. Does the slow Python-service work
  // and pushes the result to the client over WebSocket when done.
  // ---------------------------------------------------------------------------
  async handleProcessMeetingJob(meetingId: string) {

    const meeting = await this.meetingModel.findById(meetingId);

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    try {

      // Re-fetch the audio uploaded by the producer
      const audioBuffer =
        await this.s3Service.getFileBuffer(meeting.audioKey);

      const filename =
        meeting.audioKey.split('/').pop() || 'meeting.wav';

      // Build the list of known speakers (only fully-enrolled profiles)
      const voiceProfiles =
        await this.voiceProfileModel.find();

      const enrolledProfiles = voiceProfiles.filter(
        (p) =>
          Array.isArray(p.voiceEmbedding) &&
          p.voiceEmbedding.length > 0,
      );

      // speakerId (= the userId we send to the AI service) -> enrolled name.
      // Used to fill speakerName from the DB when persisting segments, so a
      // matched segment shows the person's name and never the raw id.
      const nameByUserId = new Map<string, string>();
      for (const profile of enrolledProfiles) {
        if (profile.userId) {
          nameByUserId.set(String(profile.userId), profile.name);
        }
      }

      const speakers = enrolledProfiles.map((profile) => ({
        userId: profile.userId,
        // Send the name too so the AI service can echo it back directly.
        name: profile.name,
        embedding: profile.voiceEmbedding,
      }));

      // Send to the Python AI service
      const formData = new FormData();
      
      formData.append('file', audioBuffer, { filename });

      formData.append(
        'speakers',
        JSON.stringify(speakers),
        { contentType: 'application/json' },
      );
      
      const aiResponse = await axios.post(
        `${process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000'}/process-meeting`,
        formData,
        {
          headers: formData.getHeaders(),
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const aiData = aiResponse.data;

      // Update the meeting
      meeting.transcript = aiData.transcript || '';
      meeting.summary = aiData.summary || '';
      meeting.status = MeetingStatus.COMPLETED;

      await meeting.save();

      // Persist speaker segments
      if (aiData.segments && Array.isArray(aiData.segments)) {

        const segments = aiData.segments.map((segment: any) => {
          // Matched segment -> look the enrolled name up by speakerId from the
          // DB (authoritative). Unmatched segment (speakerId null) keeps the
          // AI service's "Speaker A/B/..." label.
          const resolvedName = segment.speakerId
            ? nameByUserId.get(String(segment.speakerId))
            : null;

          return {
            meetingId: meeting._id,
            speakerId: segment.speakerId || null,
            speakerName: resolvedName || segment.speakerName || null,
            confidence: segment.confidence ?? null,
            startTime: segment.startTime,
            endTime: segment.endTime,
            text: segment.text,
          };
        });

        await this.segmentModel.insertMany(segments);
      }

      // Notify the client
      this.eventsGateway.emitMeetingUpdate(meetingId, {
        meetingId,
        status: MeetingStatus.COMPLETED,
        transcript: meeting.transcript,
        summary: meeting.summary,
        segments: aiData.segments || [],
      });

      return {
        meetingId,
        status: MeetingStatus.COMPLETED,
        segmentsCount: aiData.segments?.length || 0,
      };

    } catch (error: any) {

      const reason =
        error?.response?.data?.detail ||
        error?.response?.data ||
        error.message ||
        'Processing failed';

      meeting.status = MeetingStatus.FAILED;
      meeting.error =
        typeof reason === 'string' ? reason : JSON.stringify(reason);
      await meeting.save();

      this.eventsGateway.emitMeetingUpdate(meetingId, {
        meetingId,
        status: MeetingStatus.FAILED,
        error: meeting.error,
      });

      // Re-throw so BullMQ records the failure and applies retry/backoff
      throw error;
    }
  }

  async create(
    createMeetingDto: CreateMeetingDto,
    file: any,
  ) {

    try {

      // -----------------------------------
      // 1. upload audio to contabo
      // -----------------------------------

      const uploadedFile =
        await this.s3Service.uploadFile({
          file,
          folder: 'meetings',
        });

      // -----------------------------------
      // 2. create meeting initially
      // -----------------------------------

      const meeting = await this.meetingModel.create({
        ...createMeetingDto,
        audioUrl: uploadedFile.url,
        status: 'PROCESSING',
      });

      const formData = new FormData();

      formData.append(
        'file',
        file.buffer,
        {
          filename: file.originalname,
          contentType: file.mimetype,
        },
      );
      // -----------------------------------
      // 3. call python ai service
      // -----------------------------------
      const aiResponse = await axios.post(
        `${process.env.PYTHON_SERVICE_URL}/transcribe`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      // -----------------------------------
      // 4. update meeting
      // -----------------------------------

      meeting.transcript =
        aiResponse.data.transcript || '';

      meeting.summary =
        aiResponse.data.summary || '';

      meeting.status = MeetingStatus.COMPLETED;

      await meeting.save();

      // -----------------------------------
      // 5. create speaker segments
      // -----------------------------------

      const segments =
        aiResponse.data.segments || [];

      for (const segment of segments) {

        await this.segmentModel.create({
          meetingId: meeting._id,

          speakerId:
            segment.speakerId || null,

          startTime: segment.startTime,

          endTime: segment.endTime,

          text: segment.text,
        });
      }

      return meeting;

    } catch (error: any) {

      if (error.code === 11000) {

        throw new ConflictException(
          'Meeting already exists',
        );
      }

      throw new InternalServerErrorException(
        error?.response?.data ||
        error.message,
      );
    }
  }

  async findAll() {

    return this.meetingModel
      .find()
      .populate('deviceId', 'deviceId name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

  }

  async findOne(id: string) {

    const meeting = await this.meetingModel
      .findById(id)
      .populate('deviceId', 'deviceId name')
      .populate('createdBy', 'name email');

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  // Lightweight status check for polling clients.
  async getStatus(id: string) {

    const meeting = await this.meetingModel
      .findById(id)
      .select('status error transcript summary');

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return {
      meetingId: meeting._id,
      status: meeting.status,
      error: meeting.error || null,
      hasTranscript: !!meeting.transcript,
    };
  }

  // How many jobs are currently waiting / running / done / failed.
  async getQueueStats() {
    const counts = await this.meetingsQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    return { queue: QUEUE_MEETINGS, counts };
  }

  async update(id: string, updateMeetingDto: UpdateMeetingDto) {

    try {

      const meeting = await this.meetingModel
        .findByIdAndUpdate(id, updateMeetingDto, {
          new: true,
          runValidators: true,
        });

      if (!meeting) {
        throw new NotFoundException('Meeting not found');
      }

      return meeting;

    } catch (error: any) {

      if (error.code === 11000) {
        throw new ConflictException('Duplicate meeting data');
      }

      throw error;
    }
  }

  async remove(id: string) {

    const meeting = await this.meetingModel.findByIdAndDelete(id);

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return {
      message: 'Meeting deleted successfully',
    };
  }

  async processAudio(meetingId: string, audio: any) {

    console.log("Processing audio for meeting:", meetingId)

  }

}
