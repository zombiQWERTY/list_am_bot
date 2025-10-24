import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUrlSub1761332760937 implements MigrationInterface {
    name = 'AddUrlSub1761332760937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."subscription" ADD "name" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "core"."subscription" ADD "type" character varying(10) NOT NULL DEFAULT 'query'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."subscription" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "core"."subscription" DROP COLUMN "name"`);
    }

}
