import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUserOptional1767307200000 implements MigrationInterface {
  name = 'MakeUserOptional1767307200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "user_id" SET NOT NULL`,
    );
  }
}
