import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuranModule } from './quran/quran.module';

@Module({
  imports: [PrismaModule, QuranModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
