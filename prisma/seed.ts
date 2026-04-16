/**
 * Loads: Indo-Pak Nastaleeq Arabic (indopak-nastaleeq.json), surah metadata
 * (quran-metadata-surah-name.json), translations from *-simple.json (keys "surah:ayah", { t }).
 * Respect each source's license. Arabic script: Indo-Pak / publisher terms apply.
 */
import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';

const ASSETS_DIR = process.env.QURAN_ASSETS_DIR
  ? path.resolve(process.env.QURAN_ASSETS_DIR)
  : path.resolve(process.cwd(), 'data/quran_assets');

const ARABIC_INDO_PAK_FILE = 'indopak-nastaleeq.json';

type IndopakVerse = { surah: number; ayah: number; text: string };

/** Group verses by surah; ayahs sorted by ayah number. */
function loadIndopakArabicJson(filePath: string): Map<number, IndopakVerse[]> {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<
    string,
    { surah: number; ayah: number; text: string }
  >;
  const bySurah = new Map<number, IndopakVerse[]>();
  for (const v of Object.values(raw)) {
    const list = bySurah.get(v.surah) ?? [];
    list.push({ surah: v.surah, ayah: v.ayah, text: v.text });
    bySurah.set(v.surah, list);
  }
  for (const [, rows] of bySurah) {
    rows.sort((a, b) => a.ayah - b.ayah);
  }
  return bySurah;
}

type MetaSurah = {
  id: number;
  name: string;
  name_simple: string;
  name_arabic: string;
  revelation_order: number;
  revelation_place: string;
  verses_count: number;
  bismillah_pre: boolean;
};

function loadSurahMetadata(filePath: string): Map<number, MetaSurah> {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<
    string,
    MetaSurah
  >;
  const map = new Map<number, MetaSurah>();
  for (const [k, v] of Object.entries(raw)) {
    map.set(Number(k), v);
  }
  return map;
}

function parseVerseKey(key: string): { surah: number; ayah: number } {
  const i = key.indexOf(':');
  if (i === -1) {
    throw new Error(`Bad verse key: ${key}`);
  }
  return {
    surah: Number(key.slice(0, i)),
    ayah: Number(key.slice(i + 1)),
  };
}

type SimpleTranslationFile = Record<string, { t?: string }>;

function loadSimpleTranslationJson(
  filePath: string,
): Array<{ surah: number; ayah: number; text: string }> {
  const j = JSON.parse(
    fs.readFileSync(filePath, 'utf8'),
  ) as SimpleTranslationFile;
  const rows: Array<{ surah: number; ayah: number; text: string }> = [];
  for (const [key, val] of Object.entries(j)) {
    const { surah, ayah } = parseVerseKey(key);
    const text = String(val?.t ?? '');
    rows.push({ surah, ayah, text });
  }
  rows.sort((a, b) =>
    a.surah !== b.surah ? a.surah - b.surah : a.ayah - b.ayah || 0,
  );
  return rows;
}

const TRANSLATION_JSON_FILES: Array<{
  file: string;
  code: string;
  language: string;
  name: string;
}> = [
  {
    file: 'en-sahih-international-simple.json',
    code: 'en.sahih-international',
    language: 'en',
    name: 'Saheeh International',
  },
  {
    file: 'bn-sheikh-mujibur-rahman-simple.json',
    code: 'bn.mujibur-rahman',
    language: 'bn',
    name: 'Sheikh Mujibur Rahman',
  },
  {
    file: 'dr-abu-bakr-muhammad-zakaria-simple.json',
    code: 'bn.zakaria',
    language: 'bn',
    name: 'Dr. Abu Bakr Muhammad Zakaria',
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  const arabicPath = path.join(ASSETS_DIR, ARABIC_INDO_PAK_FILE);
  const metaPath = path.join(ASSETS_DIR, 'quran-metadata-surah-name.json');
  if (!fs.existsSync(arabicPath)) {
    throw new Error(`Arabic file not found: ${arabicPath}`);
  }
  if (!fs.existsSync(metaPath)) {
    throw new Error(`Metadata file not found: ${metaPath}`);
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const arabicBySurah = loadIndopakArabicJson(arabicPath);
    const metaByNumber = loadSurahMetadata(metaPath);

    await prisma.$transaction([
      prisma.ayahTranslation.deleteMany(),
      prisma.ayah.deleteMany(),
      prisma.translationEdition.deleteMany(),
      prisma.surah.deleteMany(),
    ]);

    const BATCH = 500;

    for (let n = 1; n <= 114; n++) {
      const m = metaByNumber.get(n);
      if (!m) {
        throw new Error(`Missing metadata for surah ${n}`);
      }
      await prisma.surah.create({
        data: {
          number: n,
          nameArabic: m.name_arabic,
          nameEnglish: m.name_simple,
          nameEnglishLong: m.name,
          revelationPlace: m.revelation_place,
          revelationOrder: m.revelation_order,
          versesCount: m.verses_count,
          bismillahPre: m.bismillah_pre,
        },
      });

      const ayahs = arabicBySurah.get(n);
      if (!ayahs || ayahs.length !== m.verses_count) {
        throw new Error(
          `Surah ${n}: expected ${m.verses_count} ayahs in ${ARABIC_INDO_PAK_FILE}, got ${ayahs?.length ?? 0}`,
        );
      }

      for (let j = 0; j < ayahs.length; j += BATCH) {
        const chunk = ayahs.slice(j, j + BATCH);
        await prisma.ayah.createMany({
          data: chunk.map((a) => ({
            surahNumber: n,
            numberInSurah: a.ayah,
            textArabic: a.text,
            bismillah: null,
          })),
        });
      }
    }

    const ayahRows = await prisma.ayah.findMany({
      select: { id: true, surahNumber: true, numberInSurah: true },
    });
    const ayahKey = (surah: number, ayah: number) => `${surah}:${ayah}`;
    const ayahIdByKey = new Map(
      ayahRows.map((r) => [ayahKey(r.surahNumber, r.numberInSurah), r.id]),
    );

    for (const meta of TRANSLATION_JSON_FILES) {
      const tPath = path.join(ASSETS_DIR, meta.file);
      if (!fs.existsSync(tPath)) {
        console.warn(`Skip missing translation file: ${tPath}`);
        continue;
      }

      const edition = await prisma.translationEdition.create({
        data: {
          code: meta.code,
          language: meta.language,
          name: meta.name,
        },
      });

      const verses = loadSimpleTranslationJson(tPath);
      const rows: { ayahId: number; editionId: number; text: string }[] = [];

      for (const v of verses) {
        const id = ayahIdByKey.get(ayahKey(v.surah, v.ayah));
        if (id == null) {
          console.warn(
            `No ayah for translation ${meta.code} ${v.surah}:${v.ayah}`,
          );
          continue;
        }
        rows.push({
          ayahId: id,
          editionId: edition.id,
          text: v.text,
        });
      }

      for (let k = 0; k < rows.length; k += BATCH) {
        await prisma.ayahTranslation.createMany({
          data: rows.slice(k, k + BATCH),
        });
      }

      console.log(`Loaded translation ${meta.code}: ${rows.length} verses`);
    }

    const counts = {
      surahs: await prisma.surah.count(),
      ayahs: await prisma.ayah.count(),
      editions: await prisma.translationEdition.count(),
      translations: await prisma.ayahTranslation.count(),
    };
    console.log('Quran seed complete:', counts);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
