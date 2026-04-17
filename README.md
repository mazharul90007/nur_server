<p align="center">
  <strong style="font-size: 1.5rem;">نور</strong>
</p>

<p align="center"><strong>NUR SERVER</strong></p>

<p align="center">A production-ready NestJS API for the Nur Quran reader — surah metadata, ayah text, multiple translation editions, and full-text search backed by PostgreSQL and Prisma.</p>

🌐 **Frontend Live URL:** [https://nur-frontend-beta.vercel.app](https://nur-frontend-beta.vercel.app/)  
🌐 **Backend Live URL:** [https://nur-server.vercel.app](https://nur-server.vercel.app/)  
📂 **Frontend GitHub:** [github.com/mazharul90007/nur_frontend](https://github.com/mazharul90007/nur_frontend)  
📂 **Backend GitHub:** [github.com/mazharul90007/nur_server](https://github.com/mazharul90007/nur_server)

---

## Features

### Quran content API

- **List all surahs** — numbers, Arabic and English names, revelation place, verse counts.
- **Ayahs by surah** — Arabic text with optional **translation edition** (`edition` or `editionId` query).
- **Translation editions** — discover available translation codes for the reader UI.
- **Search** — paginated search across ayahs with optional edition filter.

### Platform and delivery

- **NestJS** on **Express**, with **CORS** configured for your web app (`FRONTEND_URL` + local dev origins).
- **PostgreSQL** via **Prisma** — relational model for surahs, ayahs, editions, and per-edition translations.
- **Serverless-ready** — default export handler for platforms such as **Vercel** (cold-start friendly bootstrap).
- **Health-style root route** — `GET /` returns a short welcome string.

### Data loading

- **Prisma seed** loads Quran assets from JSON under `data/quran_assets` (Arabic Indo-Pak style text, surah metadata, translations). Configure `QURAN_ASSETS_DIR` if assets live outside the default path.

---

## Technology stack

| Area      | Choice                                       |
| --------- | -------------------------------------------- |
| Runtime   | **Node.js**                                  |
| Framework | **NestJS** (v11)                             |
| HTTP      | **Express** (via `@nestjs/platform-express`) |
| Language  | **TypeScript**                               |
| Database  | **PostgreSQL**                               |
| ORM       | **Prisma** (v7)                              |
| Driver    | **pg** + `@prisma/adapter-pg`                |
| Config    | **dotenv**                                   |

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** or **pnpm**
- **PostgreSQL** instance (local or hosted)
- **Git**

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/mazharul90007/nur_server.git
cd nur_server
npm install
```

### 2. Environment

Copy `example.env` to `.env` and set at least:

```env
# Required — PostgreSQL connection for Prisma
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

# Optional — allowed CORS origin for your deployed frontend (local URLs are included by default)
# FRONTEND_URL=https://nur-frontend-beta.vercel.app

# Optional — custom folder for seed JSON assets (defaults to ./data/quran_assets)
# QURAN_ASSETS_DIR=/absolute/path/to/quran_assets
```

### 3. Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Ensure seed JSON files are present under `data/quran_assets` (or your `QURAN_ASSETS_DIR`) as expected by `prisma/seed.ts`.

### 4. Run locally

Development (watch mode):

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

Default URL: **http://localhost:4000** (or `PORT` from `.env`).

---

### Root

| Method | Path | Description     |
| ------ | ---- | --------------- |
| `GET`  | `/`  | Welcome message |

### Quran (`/quran`)

| Method | Path                               | Description                                                                 |
| ------ | ---------------------------------- | --------------------------------------------------------------------------- |
| `GET`  | `/quran/surahs`                    | List all surahs                                                             |
| `GET`  | `/quran/editions`                  | List translation editions                                                   |
| `GET`  | `/quran/surahs/:surahNumber/ayahs` | Ayahs for a surah. Query: `edition` (code), `editionId` (numeric id)        |
| `GET`  | `/quran/search`                    | Search ayahs. Query: `q`, `page`, `limit`, optional `edition` / `editionId` |

**Examples**

```http
GET /quran/surahs
GET /quran/surahs/1/ayahs?edition=en.sahih
GET /quran/search?q=mercy&page=1&limit=20
```

---

## Data model overview

- **Surah** — chapter metadata (primary key: surah number).
- **Ayah** — Arabic text per surah + verse; unique `(surahNumber, numberInSurah)`.
- **TranslationEdition** — translation product (code, language, name).
- **AyahTranslation** — translation text per ayah + edition.

---

## Scripts

| Script                | Purpose                    |
| --------------------- | -------------------------- |
| `npm run start:dev`   | Nest dev server with watch |
| `npm run build`       | Compile to `dist/`         |
| `npm run start:prod`  | Run `node dist/main`       |
| `npm run db:generate` | `prisma generate`          |
| `npm run db:migrate`  | `prisma migrate dev`       |
| `npm run db:seed`     | `prisma db seed`           |
| `npm run lint`        | ESLint                     |
| `npm run test`        | Unit tests                 |

---

## License

See `package.json` (project is marked **private** / **UNLICENSED** unless you add a public license).

---

## Author

**Mazharul Islam Sourabh**

---

## Contributing

Forks and pull requests are welcome. For larger changes, open an issue first to agree on scope.

---

## Support

Open an issue in the repository or contact the maintainer.
