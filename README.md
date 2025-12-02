# AgentCare Back Office

Staff back office dashboard for managing service operations.

## Features

- Service request management & scheduling
- Customer management & lookup
- Employee/technician management
- Property & asset management
- Invoice & payment tracking
- Reports & analytics
- Multi-language support (English/Arabic)
- Dark mode support

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Context
- **API Client:** Fetch API with custom hooks

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Running ac-ten-api backend (port 4001)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env

# 3. Configure .env (see below)

# 4. Start development server
pnpm dev
```

The app will be available at http://localhost:3002

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4001/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `AgentCare Back Office` |

**Important:** Never commit `.env` to git. Only `.env.example` should be tracked.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (port 3002) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (admin)/         # Admin dashboard pages
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── employees/
│   │   ├── requests/
│   │   ├── invoices/
│   │   └── settings/
│   ├── (auth)/          # Authentication pages
│   └── layout.tsx
├── components/          # Reusable UI components
│   ├── ui/              # Base UI components
│   └── ...
├── contexts/            # React Context providers
│   ├── AuthContext.tsx
│   ├── LanguageContext.tsx
│   └── ThemeContext.tsx
├── lib/                 # Utilities and API client
│   └── api.ts
└── types/               # TypeScript type definitions
```

## Default Login Credentials

After seeding the database via ac-ten-api:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fixitbh.com | admin123 |
| Manager | manager@fixitbh.com | manager123 |
| Technician | tech1@fixitbh.com | tech123 |

## Related Repositories

| Repo | Port | Description |
|------|------|-------------|
| ac-ten-api | 4001 | Tenant API (required) |
| ac-ten-bo-ai | 8004 | Back Office AI chatbot |
| ac-ten-por | 3001 | Customer portal |

## License

Proprietary - All rights reserved.
