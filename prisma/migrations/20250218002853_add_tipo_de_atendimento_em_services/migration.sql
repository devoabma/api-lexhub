/*
  Warnings:

  - Added the required column `assistance` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssistanceTypes" AS ENUM ('PERSONALLY', 'REMOTE');

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "assistance" "AssistanceTypes" NOT NULL;
