/*
  Warnings:

  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReceiptUrl` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentMethod",
DROP COLUMN "paymentReceiptUrl",
ADD COLUMN     "payementMethod" TEXT,
ADD COLUMN     "payementReceiptUrl" TEXT;
