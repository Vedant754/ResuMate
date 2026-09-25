# Resumate

AI Resume Roaster is a full-stack resume optimization application that helps candidates upload a PDF resume, inspect its ATS readiness, compare it with a target job description, apply AI-generated bullet rewrites, and track improvement across immutable resume versions.

The project is organized as a Vite/React client and a Node.js/Express API backed by MongoDB. Google Gemini provides structured resume parsing and AI analysis. Prometheus-compatible metrics and a small monitoring API are included for operational visibility.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [Application Workflow](#application-workflow)
- [API Reference](#api-reference)
- [Monitoring](#monitoring)
- [Seed Data](#seed-data)
- [Project Structure](#project-structure)
- [Security and Operational Notes](#security-and-operational-notes)
- [Testing and Quality](#testing-and-quality)
- [Known Limitations](#known-limitations)

## Features

- Email/password registration and login with an HTTP-only JWT cookie session.
- PDF resume upload with a 5 MB file-size limit and PDF MIME-type validation.
- Text extraction from text-based PDFs.
- Gemini-assisted structured parsing into basics, summary, experience, education, skills, projects, certifications, languages, and interests.
- ATS analysis with:
  - Overall score from 0 to 100.
  - Keyword, formatting, impact, and clarity score breakdowns.
  - Prioritized issues and suggested fixes.
  - Resume strengths and evidence.
  - Bullet rewrites that preserve the original meaning.
  - Present and missing keyword lists.
- Job-description matching using a resume PDF, target role, and pasted job description.
- Immutable resume version history with upload and rewrite versions.
- Selective or full application of AI bullet rewrites to create a new version.
- Word-level and line-level diffs between resume versions.
- Dashboard KPIs, ATS score evolution, recent activity, resume history, and version summaries.
- Insights for score trends, frequent issues, present/missing keywords, and per-resume performance.
- PDF resume export in the client using `@react-pdf/renderer`.
- Prometheus metrics for HTTP requests, MongoDB operations, Gemini requests, errors, latency, and token usage.
- Client error reporting through the monitoring endpoint.
- Light/dark application theming and responsive React UI.

## Architecture

```text
Browser
  |
  | React Router + TanStack Query + Axios
  v
Vite client :5173
  | /api proxy during development
  v
Express API :8000 (recommended development port)
  |
  +--> MongoDB
  +--> Google Gemini API
  +--> Prometheus scrape endpoint (/metrics)
```

### Request and data flow

1. A signed-in user uploads a PDF to `POST /api/resumes`.
2. The API extracts text in memory and creates resume V1.
3. Gemini optionally parses the extracted text into structured sections.
4. The user requests an analysis for a selected version.
5. Gemini returns schema-constrained JSON, which is validated with Zod and stored as an `Analysis` document.
6. The user can select AI rewrites. Applying them creates a child `ResumeVersion`; the original version remains unchanged.
7. Dashboard, insights, history, and diff endpoints derive views from resumes, versions, and analyses.

## Technology Stack

### Client

- React 19
- Vite 8
- React Router 7
- TanStack Query 5
- Axios
- Tailwind CSS 4 with the Vite plugin
- Framer Motion
- Recharts
- Lucide React
- React Dropzone
- `@react-pdf/renderer`

### Server

- Node.js 20 or newer
- Express 5
- MongoDB with Mongoose 9
- Google Gemini via `@google/genai`
- Zod request and AI-response validation
- `pdf-parse` PDF text extraction
- JWT, HTTP-only cookies, and bcrypt password hashing
- Multer in-memory uploads
- Prometheus metrics with `prom-client`
- Morgan request logging in development

## Prerequisites

- Node.js 20 or newer.
- npm.
- A running MongoDB instance or MongoDB Atlas database.
- A Google Gemini API key for parsing and analysis features.
- Optional: Docker Desktop for the Prometheus service in `docker-compose.yml`.

## Getting Started

### 1. Configure the server

Create `server/.env`:

```dotenv
NODE_ENV=development
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/ai_resume
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
COOKIE_NAME=arr_token
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
MONITORING_TOKEN=change-this-for-protected-monitoring
```

`MONGO_URI` and `JWT_SECRET` are required. The server exits during startup when either is missing. `GEMINI_API_KEY` is optional for server startup, but resume parsing and AI analysis return an error when it is not configured.

### 2. Install dependencies

From the repository root:

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Start the API

```bash
cd server
npm run dev
```

The recommended development configuration starts the API at `http://localhost:8000`, which matches the Vite development proxy.

### 4. Start the client

In a second terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

### Port note

The server code defaults to port `5000`, while `client/vite.config.js` proxies `/api` to port `8000`. Set `PORT=8000` in `server/.env` for the documented setup, or update the Vite proxy when using another API port.

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime environment. Production changes cookie security and monitoring behavior. |
| `PORT` | No | `5000` | Express API port. Use `8000` with the current Vite proxy. |
| `MONGO_URI` | Yes | None | MongoDB connection string. |
| `JWT_SECRET` | Yes | None | Secret used to sign and verify session JWTs. |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration value accepted by `jsonwebtoken`. |
| `COOKIE_NAME` | No | `arr_token` | Name of the HTTP-only authentication cookie. |
| `CLIENT_ORIGIN` | No | `http://localhost:5173,http://localhost:5174` | Comma-separated client origins retained by server configuration. |
| `GEMINI_API_KEY` | Recommended | Empty | Google Gemini API key. Required for AI parsing and analysis. |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model used by parser and analysis services. |
| `MONITORING_TOKEN` | Recommended | Empty | Token expected in `x-monitoring-token` for protected monitoring snapshots. |

Do not commit `server/.env`. The server `.gitignore` excludes environment files.

## Available Commands

### Client

Run from `client/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 5173. |
| `npm run build` | Create a production client build in `client/dist`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint across the client. |

### Server

Run from `server/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with Nodemon. |
| `npm start` | Start the API with Node.js. |
| `npm run seed` | Replace the demo user's data with rich sample resumes, versions, and analyses. |

## Application Workflow

### Authentication

Public routes are the landing page, login, and registration. The protected application shell redirects unauthenticated users to `/login`. Successful registration and login issue a JWT in an HTTP-only cookie. The client restores the session through `GET /api/auth/me`.

### Resume analysis

Resume uploads accept one PDF file up to 5 MB. The API extracts readable text and rejects empty or likely scanned/image-only documents. The analysis service requests JSON from Gemini using a response schema, validates the result with Zod, and stores model and token metadata with the analysis.

### Job-description matching

The job-description workflow accepts a resume PDF, a required target role, and a job-description string up to 30,000 characters. It returns a role-specific ATS score, five strengths, matching keywords, missing keywords, and a summary. This result is returned to the client and is not persisted as a normal resume analysis.

### Versions and rewrites

Every upload creates V1. Applying one or more generated bullet rewrites creates a new version with a parent-version reference. The original raw text and parsed sections remain available. Diff requests support `words` and `lines` modes.

## API Reference

The API is mounted under `/api`. Authenticated endpoints require the `arr_token` cookie, or the configured `COOKIE_NAME` value.

### Public endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Return API uptime, timestamp, and MongoDB connection state. |
| `POST` | `/api/auth/register` | Create a user and start a session. |
| `POST` | `/api/auth/login` | Authenticate a user and start a session. |
| `POST` | `/api/auth/logout` | Clear the session cookie. |
| `POST` | `/api/monitoring/client-events` | Accept a client monitoring event. |
| `GET` | `/metrics` | Return Prometheus metrics in the registry content type. |

### Authenticated endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Return the current user. |
| `PATCH` | `/api/auth/profile` | Update the current user's name. |
| `PATCH` | `/api/auth/password` | Change the current user's password. |
| `POST` | `/api/resumes` | Upload a PDF and create resume V1. |
| `GET` | `/api/resumes` | List the current user's resumes. |
| `GET` | `/api/resumes/:id` | Get resume metadata and version summaries. |
| `GET` | `/api/resumes/:id/versions/:versionId` | Get a complete version, including raw text. |
| `DELETE` | `/api/resumes/:id` | Delete a resume, its versions, and its analyses. |
| `POST` | `/api/resumes/:id/analyze` | Analyze a resume version with Gemini. |
| `GET` | `/api/resumes/:id/analyses` | List analyses for a resume. |
| `GET` | `/api/resumes/:id/versions/:versionId/analysis` | Get the latest analysis for a version. |
| `POST` | `/api/resumes/:id/rewrite` | Apply selected or all rewrites and create a child version. |
| `GET` | `/api/resumes/:id/diff` | Compare two versions using word or line diffs. |
| `POST` | `/api/job-description` | Compare a resume PDF with a job description. |
| `GET` | `/api/dashboard` | Return dashboard totals, KPIs, score series, and activity. |
| `GET` | `/api/insights` | Return score trends, issue frequency, keywords, and resume performance. |
| `GET` | `/api/versions` | Return version history across the user's resumes. |
| `GET` | `/api/history` | Return upload, analysis, and rewrite events. |

### Monitoring endpoint

`GET /api/monitoring` returns a monitoring snapshot containing database state, Gemini availability/model, and recorded server/client error information. In production, `MONITORING_TOKEN` must be configured. When configured, send it as:

```http
x-monitoring-token: your-monitoring-token
```

## Monitoring

The server exposes metrics for:

- HTTP request totals and durations.
- MongoDB status, operation totals, operation durations, and errors.
- Gemini request totals, errors, durations, and token counts.
- Default Node.js process metrics.

Start the bundled Prometheus container from the repository root:

```bash
docker compose up -d prom-server
```

Prometheus is available at `http://localhost:9090`. The current `server/prometheus-config.yml` contains a sample network target and has the API scrape job commented out. For local API metrics, enable and adapt the `resume-api` target to the host and port where the server is running, commonly `host.docker.internal:8000` from Docker Desktop.

## Seed Data

The seed script creates a demo account and populated resume history for local UI development:

```bash
cd server
npm run seed
```

Demo credentials defined in `server/scripts/seed.js`:

```text
Email:    alex@timetoprogram.com
Password: Test@1234
```

The script is deliberately destructive for that demo user: it clears the user's existing resumes, versions, and analyses before reseeding. Use it only against a development database.

## Project Structure

```text
.
├── client/
│   ├── src/
│   │   ├── api/             Axios API wrappers
│   │   ├── components/      Landing, dashboard, analysis, export, and UI components
│   │   ├── context/         Auth, theme, and UI providers
│   │   ├── hooks/           Data-fetching hooks
│   │   ├── lib/             Mock data, telemetry, and utilities
│   │   ├── pages/           Public and protected route pages
│   │   ├── App.jsx          Provider composition and router host
│   │   └── routes.jsx       Browser route definitions
│   ├── vite.config.js       Vite, Tailwind, alias, and API proxy configuration
│   └── package.json         Client scripts and dependencies
├── server/
│   ├── src/
│   │   ├── config/          Environment and MongoDB connection setup
│   │   ├── middleware/      Auth, validation, uploads, rate limits, and monitoring
│   │   ├── models/          User, resume, version, and analysis schemas
│   │   ├── routes/          HTTP route modules
│   │   ├── services/        Gemini, PDF, structured parsing, diff, and monitoring logic
│   │   ├── utils/            Errors, async handlers, and JWT helpers
│   │   ├── metrics.js        Prometheus metric definitions
│   │   └── server.js         Express application and startup
│   ├── scripts/seed.js       Development demo-data generator
│   └── package.json           Server scripts and dependencies
├── docker-compose.yml         Prometheus service definition
└── README.md
```

## Security and Operational Notes

- Passwords are stored as bcrypt hashes; the plaintext password is never serialized by the user model.
- Authentication tokens are HTTP-only cookies. Production cookies use `secure: true` and `sameSite: "none"`, so HTTPS and compatible cross-origin deployment are required.
- Request bodies are limited to 1 MB; uploaded PDFs are held in memory and limited to 5 MB.
- Authentication attempts are limited to 30 per IP per 15 minutes.
- Analysis requests are limited to 5 per user/IP per minute.
- Request schemas and Gemini responses are validated with Zod.
- Resume ownership is checked before reading, modifying, or deleting resume data.
- Configure a strong, unique `JWT_SECRET` and a protected `MONITORING_TOKEN` before deployment.
- Review CORS configuration before production deployment. The current Express setup reflects the request origin while allowing credentials, which is convenient for development but broad for a production security boundary.
- Gemini receives extracted resume text and job-description text. Treat those inputs as personal data and configure provider, retention, and access policies accordingly.

## Testing and Quality

There is currently no automated test script or test suite declared in either package. The available baseline checks are:

```bash
cd client
npm run lint
npm run build

cd ../server
npm start
```

Before production use, add API tests for authentication, ownership isolation, PDF validation, analysis persistence, rewrite branching, diff behavior, rate limits, and monitoring access. Add client tests for protected routing, upload states, analysis rendering, version selection, and export behavior.

## Known Limitations

- Scanned/image-only PDFs are rejected because the current parser extracts text rather than running OCR.
- PDF files are processed in memory and are not stored as original uploads.
- Gemini is required for structured parsing and analysis; there is no local AI fallback.
- Job-description analysis is returned immediately and is not persisted to the analysis history model.
- Dashboard export totals are currently hard-coded to zero in the API response.
- The bundled Prometheus configuration contains a private-network sample target and requires editing before it represents a local deployment.
- The application and MongoDB are not included as Docker Compose services; Compose currently starts Prometheus only.
- The Vite development proxy and server default port differ; use `PORT=8000` or update the proxy as described above.

## License

The server package currently declares the ISC license. No repository-level license file is present; confirm the intended distribution license before publishing the project.
