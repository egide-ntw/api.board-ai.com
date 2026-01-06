import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity('attachments')
export class Attachment extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', length: 100, name: 'file_type' })
  fileType: string;

  @Column({ type: 'bigint', name: 'file_size' })
  fileSize: number;

  @Column({ type: 'text', name: 'storage_path' })
  storagePath: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'storage_provider' })
  storageProvider: string;

  @Column({ type: 'text', nullable: true, name: 'public_url' })
  publicUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
