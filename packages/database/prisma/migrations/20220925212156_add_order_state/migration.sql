-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('Init', 'Dead', 'PaidFor', 'Unconfirmed', 'Confirmed', 'Cancelled', 'Refunded', 'Delivered');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "state" "OrderState" NOT NULL DEFAULT 'Init';
