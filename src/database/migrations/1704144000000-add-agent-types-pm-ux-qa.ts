import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds pm, ux, qa values to messages_agent_type_enum
export class AddAgentTypesPmUxQa1704144000000 implements MigrationInterface {
  name = 'AddAgentTypesPmUxQa1704144000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TYPE \"messages_agent_type_enum\" ADD VALUE IF NOT EXISTS 'pm'",
    );
    await queryRunner.query(
      "ALTER TYPE \"messages_agent_type_enum\" ADD VALUE IF NOT EXISTS 'ux'",
    );
    await queryRunner.query(
      "ALTER TYPE \"messages_agent_type_enum\" ADD VALUE IF NOT EXISTS 'qa'",
    );
  }

  public async down(): Promise<void> {
    // No-op: dropping enum values requires type recreation; intentionally left empty.
    return Promise.resolve();
  }
}
