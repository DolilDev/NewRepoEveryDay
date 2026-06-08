-- AlterTable
ALTER TABLE "quests" ADD COLUMN     "folder_name" TEXT,
ADD COLUMN     "folder_url" TEXT,
ALTER COLUMN "repo_name" DROP NOT NULL;
