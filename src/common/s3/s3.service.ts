import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {

  private readonly s3: S3Client;

  constructor() {

    this.s3 = new S3Client({
      region: process.env.CONTABO_REGION,

      endpoint: process.env.CONTABO_ENDPOINT,

      forcePathStyle: true,

      credentials: {
        accessKeyId:
          process.env.CONTABO_ACCESS_KEY!,

        secretAccessKey:
          process.env.CONTABO_SECRET_KEY!,
      },
    });
  }

  async uploadFile({
    file,
    folder,
  }: {
    file: any;
    folder: string;
  }) {

    try {

      const key =
        `${folder}/${Date.now()}-${file.originalname}`;

      const command = new PutObjectCommand({
        Bucket: process.env.CONTABO_BUCKET,

        Key: key,

        Body: file.buffer,

        ContentType: file.mimetype,
      });

      await this.s3.send(command);

      const url =
        `${process.env.CONTABO_ENDPOINT}/${process.env.CONTABO_BUCKET}/${key}`;

      return {
        key,
        url,
      };

    } catch (error: any) {

      throw new InternalServerErrorException(
        error.message,
      );
    }
  }

  // Download an object back into a Buffer. Used by background workers
  // that need the original audio after the HTTP request has returned.
  // Reads via the S3 client (with credentials) so it works even when the
  // bucket objects are private.
  async getFileBuffer(key: string): Promise<Buffer> {

    try {

      const command = new GetObjectCommand({
        Bucket: process.env.CONTABO_BUCKET,
        Key: key,
      });

      const response = await this.s3.send(command);

      const stream = response.Body as NodeJS.ReadableStream;

      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
        );
      }

      return Buffer.concat(chunks);

    } catch (error: any) {

      throw new InternalServerErrorException(
        error.message,
      );
    }
  }
}