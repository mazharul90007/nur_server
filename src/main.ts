import 'dotenv/config';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** Vercel Functions: allow longer cold starts (DB / Prisma). */
export const maxDuration = 60;

function corsOrigins(): string | string[] {
  const url = process.env.FRONTEND_URL;
  const base = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  if (url?.trim()) {
    return [...base, url.trim()];
  }
  return base;
}

async function createNestExpressApp(): Promise<express.Express> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
  });
  await app.init();
  return expressApp;
}

const isVercel = process.env.VERCEL === '1';

async function bootstrapLocal(): Promise<void> {
  const expressApp = await createNestExpressApp();
  const port = Number(process.env.PORT) || 4000;
  expressApp.listen(port);
}

if (!isVercel) {
  void bootstrapLocal();
}

let cachedApp: express.Express;

/** Vercel invokes this with Node `req` / `res` (not AWS Lambda events). */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!cachedApp) {
    cachedApp = await createNestExpressApp();
  }
  cachedApp(req, res);
}
