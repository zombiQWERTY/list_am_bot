import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1761270618957 implements MigrationInterface {
    name = 'Init1761270618957'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "core"."delivery" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "subscriptionId" integer NOT NULL, "listingId" character varying(500) NOT NULL, "deliveredAt" TIMESTAMP NOT NULL DEFAULT now(), "messageId" character varying(100), CONSTRAINT "PK_ffad7bf84e68716cd9af89003b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_679b8f04200d6d4a175a849403" ON "core"."delivery" ("subscriptionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e1a5374a7f5c51edf274fc1548" ON "core"."delivery" ("userId") `);
        await queryRunner.query(`CREATE TABLE "core"."user" ("id" SERIAL NOT NULL, "telegramUserId" bigint NOT NULL, "username" character varying, "language" character varying NOT NULL DEFAULT 'ru', "isPaused" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_01729d9465105fe07244458a523" UNIQUE ("telegramUserId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "core"."subscription" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "query" character varying(500) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a0ce0007cfcc8e6ee405d0272f" ON "core"."subscription" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_cc906b4bc892b048f1b654d2aa" ON "core"."subscription" ("userId") `);
        await queryRunner.query(`CREATE TABLE "core"."seen_listing" ("id" SERIAL NOT NULL, "subscriptionId" integer NOT NULL, "listingId" character varying(500) NOT NULL, "firstSeenAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_20fa00dbd3d83e248cba7a0a1b9" UNIQUE ("subscriptionId", "listingId"), CONSTRAINT "PK_63e8d0abf7ad267fcb83a9fcb4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bd8126e5780e6bf44654b7bac8" ON "core"."seen_listing" ("subscriptionId") `);
        await queryRunner.query(`CREATE TABLE "core"."metric" ("id" SERIAL NOT NULL, "type" character varying(50) NOT NULL, "value" numeric(10,2) NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d24c075ea2926dd32bd1c534ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0379f156fe80692ca161179ef8" ON "core"."metric" ("type", "created_at") `);
        await queryRunner.query(`ALTER TABLE "core"."delivery" ADD CONSTRAINT "FK_e1a5374a7f5c51edf274fc15483" FOREIGN KEY ("userId") REFERENCES "core"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."subscription" ADD CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0" FOREIGN KEY ("userId") REFERENCES "core"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "core"."seen_listing" ADD CONSTRAINT "FK_bd8126e5780e6bf44654b7bac8e" FOREIGN KEY ("subscriptionId") REFERENCES "core"."subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."seen_listing" DROP CONSTRAINT "FK_bd8126e5780e6bf44654b7bac8e"`);
        await queryRunner.query(`ALTER TABLE "core"."subscription" DROP CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0"`);
        await queryRunner.query(`ALTER TABLE "core"."delivery" DROP CONSTRAINT "FK_e1a5374a7f5c51edf274fc15483"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_0379f156fe80692ca161179ef8"`);
        await queryRunner.query(`DROP TABLE "core"."metric"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_bd8126e5780e6bf44654b7bac8"`);
        await queryRunner.query(`DROP TABLE "core"."seen_listing"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_cc906b4bc892b048f1b654d2aa"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_a0ce0007cfcc8e6ee405d0272f"`);
        await queryRunner.query(`DROP TABLE "core"."subscription"`);
        await queryRunner.query(`DROP TABLE "core"."user"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_e1a5374a7f5c51edf274fc1548"`);
        await queryRunner.query(`DROP INDEX "core"."IDX_679b8f04200d6d4a175a849403"`);
        await queryRunner.query(`DROP TABLE "core"."delivery"`);
    }

}
