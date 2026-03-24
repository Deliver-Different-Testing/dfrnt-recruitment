# DFRNT Recruitment Portal

## Stack
- **Backend:** .NET 10 (C#), ASP.NET Core, EF Core with Npgsql (PostgreSQL)
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, Zustand, React Router 7
- **Database:** PostgreSQL (Railway)
- **Deployment:** Docker → Railway

## Architecture
- Single deployment: .NET serves the React SPA from wwwroot
- Frontend built by Vite, output copied to wwwroot during Docker build
- EF Core auto-creates schema on startup (EnsureCreated)
- Connection string from `DATABASE_URL` env var (Railway convention)

## Key Paths
- API controllers: `DfrntRecruitment.Api/Controllers/`
- Entities: `DfrntRecruitment.Api/Core/Domain/Entities/`
- DbContext: `DfrntRecruitment.Api/Core/Domain/AppDbContext.cs`
- Frontend source: `src/`
- API client: `src/lib/api.ts`
- State: `src/store.ts`

## Conventions
- Controllers return `Ok(new { ... })` with camelCase JSON
- Enums stored as strings in DB
- All dates are UTC
- Auth is basic (hardcoded admin for now) — replace with proper JWT later

## Future Migration
- Will migrate to SQL Server when joining DFRNT platform
- EF Core abstracts the DB provider — switch Npgsql → SqlServer
