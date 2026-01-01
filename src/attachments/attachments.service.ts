import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
    private configService: ConfigService,
  ) {}

  async create(
    file: Express.Multer.File,
    messageId?: string,
  ): Promise<Attachment> {
    const fileDriver = this.configService.get('file.driver');
    
    // For local storage
    const storagePath = `uploads/${Date.now()}-${file.originalname}`;
    const publicUrl = `${this.configService.get('app.apiPrefix')}/attachments/${storagePath}`;

    const attachment = this.attachmentsRepository.create({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storagePath,
      storageProvider: fileDriver,
      publicUrl,
      metadata: {
        encoding: file.encoding,
      },
    });

    return this.attachmentsRepository.save(attachment);
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async findByMessage(messageId: string): Promise<Attachment[]> {
    return this.attachmentsRepository.find({
      where: { message: { id: messageId } },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: string): Promise<void> {
    const attachment = await this.findOne(id);
    await this.attachmentsRepository.remove(attachment);
    // TODO: Delete file from storage
  }
}
