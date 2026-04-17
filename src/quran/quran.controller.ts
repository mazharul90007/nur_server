import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  Param,
} from '@nestjs/common';
import { QuranService } from './quran.service';

@Controller('quran')
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  //=============Get Editions=============
  @Get('editions')
  listEditions() {
    return this.quranService.listEditions();
  }

  //=============Get Surahs=============
  @Get('surahs')
  listSurahs() {
    return this.quranService.listSurahs();
  }

  //
  @Get('surahs/:surahNumber/ayahs')
  getAyahs(
    @Param('surahNumber', ParseIntPipe) surahNumber: number,
    @Query('editionId') editionId?: string,
    @Query('edition') edition?: string,
  ) {
    let id: number | undefined;
    if (editionId != null && editionId !== '') {
      const n = Number(editionId);
      if (!Number.isInteger(n) || n < 1) {
        throw new BadRequestException('Invalid editionId');
      }
      id = n;
    }
    return this.quranService.getAyahs(surahNumber, id, edition);
  }

  //=============Search Ayahs=============
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('editionId') editionId?: string,
    @Query('edition') edition?: string,
  ) {
    let id: number | undefined;
    if (editionId != null && editionId !== '') {
      const n = Number(editionId);
      if (!Number.isInteger(n) || n < 1) {
        throw new BadRequestException('Invalid editionId');
      }
      id = n;
    }
    return this.quranService.searchAyahs(q ?? '', id, edition, page, limit);
  }
}
