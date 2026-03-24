# DFRNT Recruitment Portal

A recruitment/applicant portal for managing courier onboarding — built with .NET 10 + React 19, deployed on Railway with PostgreSQL.

## Features

- **Applicant Portal** — Multi-step application form, document upload, quiz, status check
- **Admin Dashboard** — Recruitment pipeline (kanban/list), document verification, quiz builder
- **Document Management** — Configurable document types, upload, verify/reject, expiry tracking
- **Quiz System** — Build quizzes, multiple question types, auto-grading

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10, ASP.NET Core, EF Core |
| Database | PostgreSQL (Npgsql) |
| Frontend | React 19, Vite 6, Tailwind CSS 4, Zustand |
| Deployment | Docker → Railway |

## Development

### Prerequisites
- .NET 10 SDK
- Node.js 22+
- PostgreSQL

### Backend
```bash
cd DfrntRecruitment.Api
dotnet restore
dotnet run
```

### Frontend
```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the .NET backend at `localhost:5000`.

## Deployment (Railway)

1. Connect GitHub repo to Railway
2. Railway auto-detects the Dockerfile
3. Link a PostgreSQL service — `DATABASE_URL` is set automatically
4. Deploy 🚀

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Railway sets this) |
| `ASPNETCORE_URLS` | Server binding (default: `http://+:8080`) |

## Project Structure

```
├── DfrntRecruitment.Api/    # .NET API
│   ├── Controllers/         # API endpoints
│   ├── Core/Domain/         # Entities + DbContext
│   ├── Services/            # Business logic
│   └── Middleware/           # Error handling
├── src/                     # React frontend
│   ├── components/          # UI components
│   ├── lib/api.ts          # API client
│   └── store.ts            # Zustand state
├── Dockerfile               # Multi-stage build
└── Migrations/              # SQL reference scripts
```

## Notes

- .NET 10 is in preview as of March 2026. If `sdk:10.0-preview` images aren't available, update Dockerfile to use `9.0` and change target framework to `net9.0`.
- Auth is currently hardcoded (admin/dfrnt2026!) — replace with proper JWT before production.
- Will eventually migrate to SQL Server when joining the DFRNT platform.
