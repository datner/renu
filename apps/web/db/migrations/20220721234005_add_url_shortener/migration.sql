-- CreateTable
CREATE TABLE "ShortenedUrl" (
    "slug" TEXT NOT NULL,
    "destination" TEXT NOT NULL,

    CONSTRAINT "ShortenedUrl_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortenedUrl_slug_key" ON "ShortenedUrl"("slug");
