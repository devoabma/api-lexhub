/*
  Warnings:

  - You are about to drop the column `cpf` on the `lawyers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "lawyers_cpf_key";

-- AlterTable
ALTER TABLE "lawyers" DROP COLUMN "cpf";
