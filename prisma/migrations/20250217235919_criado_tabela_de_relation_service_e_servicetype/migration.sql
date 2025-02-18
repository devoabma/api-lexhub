/*
  Warnings:

  - You are about to drop the column `types` on the `services` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tokens" DROP CONSTRAINT "tokens_agent_id_fkey";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "types";

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_service_types" (
    "service_id" TEXT NOT NULL,
    "service_type_id" TEXT NOT NULL,

    CONSTRAINT "service_service_types_pkey" PRIMARY KEY ("service_id","service_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_types_name_key" ON "service_types"("name");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_service_types" ADD CONSTRAINT "service_service_types_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_service_types" ADD CONSTRAINT "service_service_types_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
