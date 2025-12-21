-- AlterEnum
ALTER TYPE "PartyType" ADD VALUE 'BOTH';

-- AlterTable
ALTER TABLE "Party" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
