import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1790337956317 implements MigrationInterface {
  name = 'Init1790337956317';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "balance_logs" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "action" character varying NOT NULL, "amount" bigint NOT NULL, "idempotencyKey" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_5afff991a6d4849269dc8198a7a" UNIQUE ("idempotencyKey"), CONSTRAINT "PK_4f7db16f3b30d1051124a781be9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "balance" bigint NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "balance_logs" ADD CONSTRAINT "FK_1287aae13483dfe17cdf95ac7fa" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "balance_logs" DROP CONSTRAINT "FK_1287aae13483dfe17cdf95ac7fa"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "balance_logs"`);
  }
}
