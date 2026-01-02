import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSpeakerTurnToConversations1767310000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'current_speaker',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'conversations',
      new TableColumn({
        name: 'turn_index',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('conversations', 'turn_index');
    await queryRunner.dropColumn('conversations', 'current_speaker');
  }
}
