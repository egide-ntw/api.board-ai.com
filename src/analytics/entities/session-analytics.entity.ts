import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity('session_analytics')
export class SessionAnalytics extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ type: 'int', default: 0, name: 'total_tokens' })
  totalTokens: number;

  @Column({ type: 'int', default: 0, name: 'prompt_tokens' })
  promptTokens: number;

  @Column({ type: 'int', default: 0, name: 'completion_tokens' })
  completionTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0, name: 'estimated_cost' })
  estimatedCost: number;

  @Column({ type: 'int', default: 0, name: 'message_count' })
  messageCount: number;

  @Column({ type: 'int', default: 0, name: 'rounds_completed' })
  roundsCompleted: number;

  @Column({ type: 'jsonb', nullable: true, name: 'agent_participation' })
  agentParticipation: Record<string, number>;

  @Column({ type: 'int', nullable: true, name: 'session_duration_seconds' })
  sessionDurationSeconds: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
