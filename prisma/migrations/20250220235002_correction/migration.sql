/*
  Warnings:

  - You are about to drop the column `payementMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payementReceiptUrl` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "payementMethod",
DROP COLUMN "payementReceiptUrl",
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReceiptUrl" TEXT;
