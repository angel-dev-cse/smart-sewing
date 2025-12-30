-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "model" TEXT;

-- AlterTable
ALTER TABLE "ShopTagCounter" ALTER COLUMN "updatedAt" DROP DEFAULT;
