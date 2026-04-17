import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { QuranService } from './quran.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

describe('QuranService', () => {
  let service: QuranService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuranService,
        {
          provide: PrismaService,
          useValue: {
            surah: { findMany: jest.fn(), findUnique: jest.fn() },
            translationEdition: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            ayah: { findMany: jest.fn() },
            ayahTranslation: { count: jest.fn(), findMany: jest.fn() },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuranService>(QuranService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
