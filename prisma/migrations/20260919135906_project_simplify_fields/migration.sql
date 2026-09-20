/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `fullDescription` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `ProjectParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_locationId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectParticipant" DROP CONSTRAINT "ProjectParticipant_memberId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectParticipant" DROP CONSTRAINT "ProjectParticipant_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "categoryId",
DROP COLUMN "endTime",
DROP COLUMN "fullDescription",
DROP COLUMN "locationId",
DROP COLUMN "startTime";

-- DropTable
DROP TABLE "ProjectParticipant";
