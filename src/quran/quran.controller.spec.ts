import { Test, TestingModule } from '@nestjs/testing';
import { QuranController } from './quran.controller';
import { QuranService } from './quran.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

describe('QuranController', () => {
  let controller: QuranController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuranController],
      providers: [
        {
          provide: QuranService,
          useValue: {
            listSurahs: jest.fn(),
            listEditions: jest.fn(),
            getAyahs: jest.fn(),
            searchAyahs: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<QuranController>(QuranController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
