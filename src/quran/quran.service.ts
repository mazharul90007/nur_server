import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TranslationEdition } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MIN_SEARCH_LEN = 2;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class QuranService {
  constructor(private readonly prisma: PrismaService) {}

  //=============Get Surahs=============
  listSurahs() {
    return this.prisma.surah.findMany({
      orderBy: { number: 'asc' },
    });
  }

  //=============Get Editions=============
  listEditions() {
    return this.prisma.translationEdition.findMany({
      orderBy: { id: 'asc' },
    });
  }

  //=============Get Ayahs=============
  async getAyahs(
    surahNumber: number,
    editionId?: number,
    editionCode?: string,
  ) {
    const surah = await this.prisma.surah.findUnique({
      where: { number: surahNumber },
    });
    if (!surah) {
      throw new NotFoundException('Surah not found');
    }

    const edition = await this.resolveEdition(editionId, editionCode);

    const ayahs = await this.prisma.ayah.findMany({
      where: { surahNumber },
      orderBy: { numberInSurah: 'asc' },
      include: {
        translations: {
          where: { editionId: edition.id },
          take: 1,
        },
      },
    });

    return {
      surah,
      edition,
      ayahs: ayahs.map((a) => ({
        numberInSurah: a.numberInSurah,
        textArabic: a.textArabic,
        bismillah: a.bismillah,
        translation: a.translations[0]?.text ?? null,
      })),
    };
  }

  //=============Search Ayahs=============
  async searchAyahs(
    q: string,
    editionId?: number,
    editionCode?: string,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  ) {
    const trimmed = q.trim();
    if (trimmed.length < MIN_SEARCH_LEN) {
      throw new BadRequestException(
        `Search query must be at least ${MIN_SEARCH_LEN} characters`,
      );
    }

    const edition = await this.resolveEdition(editionId, editionCode);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;

    const where = {
      editionId: edition.id,
      text: { contains: trimmed, mode: 'insensitive' as const },
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.ayahTranslation.count({ where }),
      this.prisma.ayahTranslation.findMany({
        where,
        include: {
          ayah: { include: { surah: true } },
        },
        orderBy: [
          { ayah: { surahNumber: 'asc' } },
          { ayah: { numberInSurah: 'asc' } },
        ],
        skip,
        take: safeLimit,
      }),
    ]);

    return {
      edition,
      results: rows.map((row) => ({
        surahNumber: row.ayah.surahNumber,
        numberInSurah: row.ayah.numberInSurah,
        textArabic: row.ayah.textArabic,
        translation: row.text,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  private async resolveEdition(
    editionId?: number,
    editionCode?: string,
  ): Promise<TranslationEdition> {
    if (editionId != null) {
      const e = await this.prisma.translationEdition.findUnique({
        where: { id: editionId },
      });
      if (!e) throw new NotFoundException('Translation edition not found');
      return e;
    }
    if (editionCode) {
      const e = await this.prisma.translationEdition.findUnique({
        where: { code: editionCode },
      });
      if (!e) throw new NotFoundException('Translation edition not found');
      return e;
    }
    const e = await this.prisma.translationEdition.findFirst({
      orderBy: { id: 'asc' },
    });
    if (!e) {
      throw new NotFoundException('No translation editions configured');
    }
    return e;
  }
}
