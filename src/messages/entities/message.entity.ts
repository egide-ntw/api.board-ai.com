import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { EntityHelper } from 'src/utils/entity-helper';

export enum MessageRole {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export enum AgentType {
  MARKETING = 'marketing',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  LEGAL = 'legal',
  FINANCE = 'finance',
  PM = 'pm',
  UX = 'ux',
  QA = 'qa',
}

@Entity('messages')
export class Message extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column({
    type: 'enum',
    enum: AgentType,
    nullable: true,
    name: 'agent_type',
  })
  agentType: AgentType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0, name: 'round_number' })
  roundNumber: number;

  @Column({ type: 'jsonb', nullable: true, name: 'structured_output' })
  structuredOutput: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Attachment, (attachment) => attachment.message)
  attachments: Attachment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
