import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBoardTables1767301725413 implements MigrationInterface {
    name = 'CreateBoardTables1767301725413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying, "password" character varying, "provider" character varying NOT NULL DEFAULT 'email', "socialId" character varying, "firstName" character varying, "lastName" character varying, "profilePic" character varying, "hash" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "dailyUploadLimit" integer DEFAULT '4', "dailyDownloadLimit" integer DEFAULT '4', "roleId" uuid, "statusId" uuid, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9bd2fe7a8e694dedc4ec2f666f" ON "user" ("socialId") `);
        await queryRunner.query(`CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON "user" ("firstName") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON "user" ("lastName") `);
        await queryRunner.query(`CREATE INDEX "IDX_1926226647a575924b402b4151" ON "user" ("profilePic") `);
        await queryRunner.query(`CREATE INDEX "IDX_e282acb94d2e3aec10f480e4f6" ON "user" ("hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_35787e355fd1c380228605228f" ON "user" ("dailyUploadLimit") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad3e499fa38504d9d4faa627c9" ON "user" ("dailyDownloadLimit") `);
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_name" character varying(255) NOT NULL, "file_type" character varying(100) NOT NULL, "file_size" bigint NOT NULL, "storage_path" text NOT NULL, "storage_provider" character varying(20), "public_url" text, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "message_id" uuid, CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_role_enum" AS ENUM('user', 'agent', 'system')`);
        await queryRunner.query(`CREATE TYPE "public"."messages_agent_type_enum" AS ENUM('marketing', 'developer', 'designer', 'legal', 'finance')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."messages_role_enum" NOT NULL, "agent_type" "public"."messages_agent_type_enum", "content" text NOT NULL, "round_number" integer NOT NULL DEFAULT '0', "structured_output" jsonb, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "conversation_id" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."conversations_status_enum" AS ENUM('active', 'archived', 'completed')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255), "context" text, "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'active', "max_rounds" integer NOT NULL DEFAULT '3', "current_round" integer NOT NULL DEFAULT '0', "active_personas" jsonb, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "session_analytics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_tokens" integer NOT NULL DEFAULT '0', "prompt_tokens" integer NOT NULL DEFAULT '0', "completion_tokens" integer NOT NULL DEFAULT '0', "estimated_cost" numeric(10,4) NOT NULL DEFAULT '0', "message_count" integer NOT NULL DEFAULT '0', "rounds_completed" integer NOT NULL DEFAULT '0', "agent_participation" jsonb, "session_duration_seconds" integer, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "conversation_id" uuid, CONSTRAINT "PK_e3de20fb45304e7da9c83ba7941" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forgot" ("id" SERIAL NOT NULL, "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" integer, CONSTRAINT "PK_087959f5bb89da4ce3d763eab75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_df507d27b0fb20cd5f7bef9b9a" ON "forgot" ("hash") `);
        await queryRunner.query(`CREATE TABLE "personas" ("id" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "system_prompt" text NOT NULL, "color" character varying(50) NOT NULL, "icon" character varying(100), "capabilities" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_714aa5d028f8f3e6645e971cecd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_dc18daa696860586ba4667a9d31" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_623e10eec51ada466c5038979e3" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_3a9ae579e61e81cc0e989afeb4a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_analytics" ADD CONSTRAINT "FK_ac2eab653f160124ea08880ff85" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forgot" ADD CONSTRAINT "FK_31f3c80de0525250f31e23a9b83" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forgot" DROP CONSTRAINT "FK_31f3c80de0525250f31e23a9b83"`);
        await queryRunner.query(`ALTER TABLE "session_analytics" DROP CONSTRAINT "FK_ac2eab653f160124ea08880ff85"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_3a9ae579e61e81cc0e989afeb4a"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_623e10eec51ada466c5038979e3"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_dc18daa696860586ba4667a9d31"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`DROP TABLE "personas"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_df507d27b0fb20cd5f7bef9b9a"`);
        await queryRunner.query(`DROP TABLE "forgot"`);
        await queryRunner.query(`DROP TABLE "session_analytics"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_agent_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."messages_role_enum"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad3e499fa38504d9d4faa627c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_35787e355fd1c380228605228f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e282acb94d2e3aec10f480e4f6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1926226647a575924b402b4151"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0e1b4ecdca13b177e2e3a0613"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58e4dbff0e1a32a9bdc861bb29"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bd2fe7a8e694dedc4ec2f666f"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "status"`);
        await queryRunner.query(`DROP TABLE "role"`);
    }

}
