/*
  Warnings:

  - You are about to drop the column `Companyname` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `UserName` on the `User` table. All the data in the column will be lost.
  - Added the required column `companyName` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "Companyname",
ADD COLUMN     "companyName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "UserName",
ADD COLUMN     "userName" TEXT NOT NULL;
