# Journal Backend Workflow (JPA + Excel + User Tracking)

## What is implemented

- Journal persistence with nested graph:
  - `Journal`
  - `Author`
  - `UniversityAffiliation`
  - `ResearchAffiliation`
  - `Attachment`
- Automatic `submittedBy` population from authenticated context (`Principal` or `X-Username`/`X-User` header)
- Workflow status lifecycle via `JournalStatus`
- Audit fields on `Journal`: `createdAt`, `updatedAt`
- Backend unit calculation logic aligned to UNIVEN claim rules
- DHET Excel export (`.xlsx`) with one row per author
- Filtering support: `year`, `status`, `facultyId`
- Per-user export: `mine=true`

## API

Base path supports both:

- `/api/journals`
- `/api/journal` (legacy compatibility)

### Save

- `POST /api/journals`
- `PUT /api/journals/{id}`

### Read

- `GET /api/journals/{id}`
- `GET /api/journals?year=2025&status=DRAFT&facultyId=1`

### Workflow status transition

- `PATCH /api/journals/{id}/status`

Request body:

```json
{
  "status": "SUBMITTED"
}
```

### Duplicate check

- `GET /api/journals/exists?title=...&issn=...`

### Excel export

- `GET /api/journals/export`
- `GET /api/journals/export?mine=true`

## Try it locally

```powershell
Set-Location "C:\Users\Muthuhadini.Ramavhun\IdeaProjects\research_output"
.\mvnw.cmd -DskipTests compile
.\mvnw.cmd spring-boot:run
```

For user tracking in environments without full Spring Security, pass header:

- `X-Username: your.username`

