-- CreateTable
CREATE TABLE "Surah" (
    "number" INTEGER NOT NULL,
    "nameArabic" TEXT NOT NULL,

    CONSTRAINT "Surah_pkey" PRIMARY KEY ("number")
);

-- CreateTable
CREATE TABLE "Ayah" (
    "id" SERIAL NOT NULL,
    "surahNumber" INTEGER NOT NULL,
    "numberInSurah" INTEGER NOT NULL,
    "textArabic" TEXT NOT NULL,
    "bismillah" TEXT,

    CONSTRAINT "Ayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationEdition" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TranslationEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyahTranslation" (
    "id" SERIAL NOT NULL,
    "ayahId" INTEGER NOT NULL,
    "editionId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "AyahTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ayah_surahNumber_idx" ON "Ayah"("surahNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ayah_surahNumber_numberInSurah_key" ON "Ayah"("surahNumber", "numberInSurah");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationEdition_code_key" ON "TranslationEdition"("code");

-- CreateIndex
CREATE INDEX "AyahTranslation_editionId_idx" ON "AyahTranslation"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "AyahTranslation_ayahId_editionId_key" ON "AyahTranslation"("ayahId", "editionId");

-- AddForeignKey
ALTER TABLE "Ayah" ADD CONSTRAINT "Ayah_surahNumber_fkey" FOREIGN KEY ("surahNumber") REFERENCES "Surah"("number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahTranslation" ADD CONSTRAINT "AyahTranslation_ayahId_fkey" FOREIGN KEY ("ayahId") REFERENCES "Ayah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyahTranslation" ADD CONSTRAINT "AyahTranslation_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "TranslationEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
