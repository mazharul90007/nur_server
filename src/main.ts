import 'dotenv/config';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** Vercel Functions: allow longer cold starts (DB / Prisma). */
export const maxDuration = 60;

/** Local dev + default deployed frontend (README live URL). Add more via comma-separated FRONTEND_URL. */
function corsOrigins(): string[] {
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://nur-frontend-beta.vercel.app',
  ];
  const raw = process.env.FRONTEND_URL;
  if (!raw?.trim()) return defaults;
  const extra = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...defaults, ...extra])];
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
