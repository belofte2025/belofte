/*
  Warnings:

  - You are about to drop the column `name` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `Companyname` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suppliername` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UserName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "name",
ADD COLUMN     "Companyname" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "name",
ADD COLUMN     "customerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "name",
ADD COLUMN     "suppliername" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "UserName" TEXT NOT NULL;
