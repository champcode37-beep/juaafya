# Jua Afya - Enterprise Clinic Management SaaS (v4)

## Project Overview
**Jua Afya** is a comprehensive, enterprise-grade clinic management system designed to streamline healthcare operations. It features real-time integrations for messaging, payments, AI assistance, and robust patient management.

- **Version**: 1.4.10
- **Framework**: React 19 + Vite 6
- **Language**: TypeScript 5

## Tech Stack

### Frontend
- **Core**: React 19, TypeScript, Vite
- **UI Framework**: Tailwind CSS 4, Radix UI, Lucide Icons
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Forms & Validation**: React Hook Form, Zod
- **Visualization**: Recharts
- **Routing**: React Router DOM 7

### Backend & Infrastructure
- **Backend-as-a-Service**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI Integration**: Google GenAI (Gemini), Vercel AI SDK (@modelcontextprotocol/sdk)
- **Hosting/Deployment**: Netlify, Vercel
- **Analytics**: Vercel Analytics, Vercel Speed Insights

## Key Features
- **Multi-Tenant Architecture**: Supports multiple clinics with strict data isolation.
- **Role-Based Access Control (RBAC)**: Granular permissions for SuperAdmin, Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Tech, etc.
- **Patient Management**: Registration, Queue Management, Visit Tracking (Vitals, Diagnosis, Prescription).
- **Pharmacy & Inventory**: Stock tracking, batch numbers, expiry dates, supplier management.
- **Communication**: Integrated Bulk SMS and WhatsApp Agent (Mobiwave/Twilio integration).
- **AI Capabilities**: Chatbot, AI-assisted diagnosis/suggestions (Gemini).
- **Reporting**: Financial and operational reports.

## Project Structure

```
/
├── components/          # UI Components
│   ├── admin/           # Admin-specific components
│   ├── appointments/    # Scheduling components
│   ├── auth/            # Authentication forms
│   ├── dashboard/       # Dashboard widgets
│   ├── inventory/       # Pharmacy/Stock management
│   ├── patients/        # Patient lists and forms
│   ├── ui/              # Reusable UI primitives (Radix/Tailwind)
│   └── ...
├── hooks/               # Custom React Hooks
│   ├── useEnterpriseAuth.ts # Auth & Profile management
│   ├── usePatients.ts   # Patient data fetching
│   ├── useVisits.ts     # Visit management
│   └── ...
├── lib/                 # Utilities and Core Logic
│   ├── supabase/        # Supabase client configuration
│   ├── rbac.ts          # Role-Based Access Control logic
│   ├── multitenancy.ts  # Multi-tenant data isolation
│   └── ...
├── pages/               # Application Routes/Pages
├── services/            # API & Business Logic Services
│   ├── authService.ts
│   ├── db.ts
│   ├── patientService.ts
│   └── ...
├── scripts/             # SQL Migrations & Setup Scripts
├── store/               # Zustand Store (Global State)
├── types/               # TypeScript Type Definitions
└── supabase/            # Supabase Functions & Config
```

## Database Schema (Key Tables)
Based on `types/database.ts` and `scripts/`:

- **clinics**: Stores clinic details, subscription plan, and settings.
- **users**: Clinic staff accounts linked to clinics.
- **patients**: Patient demographics and history.
- **visits**: Clinical visits, including stage (triage, consultation, etc.), vitals, and diagnosis.
- **appointments**: Scheduled events.
- **inventory_items**: Pharmacy stock.
- **transactions**: Financial records.

## Environment Variables
Required environment variables for local development (`.env.local`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_ALLOW_DEMO_MODE`

## Recent Issues (Log Analysis)
Based on provided logs:

1. **Supabase 400 Errors**:
   - `visits` query failing: `Failed to load resource: the server responded with a status of 400`.
   - `patients` query failing: `Failed to load resource: the server responded with a status of 400`.
   - **Possible Cause**: Malformed query parameters, RLS policy violations, or schema mismatches in the `select` clause.

2. **Patient Creation Failure**:
   - `createPatient error Object`
   - `addPatient error Error: Failed to create patient`
   - **Context**: `db.ts:30:27` and `index.ts:357:31`.

3. **Authentication**:
   - Auth flow is working: `Auth state changed: SIGNED_IN`, `Profile loaded`.

4. **Analytics**:
   - Vercel Analytics and Speed Insights are running in debug mode.
