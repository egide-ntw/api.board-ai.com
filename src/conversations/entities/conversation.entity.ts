import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';
import { EntityHelper } from 'src/utils/entity-helper';

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

@Entity('conversations')
export class Conversation extends EntityHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  context: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @Column({ type: 'int', default: 3, name: 'max_rounds' })
  maxRounds: number;

  @Column({ type: 'int', default: 0, name: 'current_round' })
  currentRound: number;

  @Column({ type: 'jsonb', nullable: true, name: 'active_personas' })
  activePersonas: string[];

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'current_speaker' })
  currentSpeaker: string | null;

  @Column({ type: 'int', default: 0, name: 'turn_index' })
  turnIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
