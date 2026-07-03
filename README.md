# Portfolio Site

Full-stack developer portfolio — dark theme, purple accent, code-editor hero, project cards, tech stack, and a contact form.

- **Backend:** ASP.NET Core Minimal API (.NET 9) — serves profile, stats, projects, skills, and accepts contact messages.
- **Frontend:** Vite + React + TypeScript + Tailwind CSS.

## Run

Open two terminals.

### 1. Backend (port 5257)

```bash
cd backend/PortfolioApi
dotnet run --launch-profile http
```

API endpoints:
- `GET  /api/profile`
- `GET  /api/stats`
- `GET  /api/projects` (`?featured=true` to filter)
- `GET  /api/projects/{id}`
- `GET  /api/skills`
- `POST /api/contact` — body `{ name, email, message }`

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

The frontend reads the API base URL from `frontend/.env` (`VITE_API_URL`), defaulting to `http://localhost:5257`.

## Customize

All placeholder content lives in `backend/PortfolioApi/Data/PortfolioData.cs` — edit the profile, stats, projects, and skills there. No frontend changes needed.
