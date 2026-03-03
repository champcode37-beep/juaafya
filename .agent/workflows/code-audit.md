---
description: Complete code, workflow, and system-wide audit for JuaAfya EMR/HMS
---

# JuaAfya System-Wide Code Audit Workflow

This workflow provides a repeatable, structured audit process for the JuaAfya v4 codebase.

## 1. Prerequisites Check
Ensure node_modules exist and dependencies are installed:
```
npm install
```

## 2. TypeScript Compilation Check (Zero-Error Target)
Run with strict mode to catch all type errors:
```
npx tsc --noEmit 2>&1 | Out-File tsc_errors.txt
```
Review the output file. **Zero errors is the acceptance criterion.**

## 3. Build Verification
Verify the prod build completes without warnings:
```
npm run build 2>&1 | Out-File build_output.txt
```
Check for warnings in `build_output.txt`. Bundle chunk sizes must stay below 800KB.

## 4. Dependency Audit
Check for known vulnerabilities:
```
npm audit --audit-level=moderate
```

## 5. Code Quality Checklist (Manual)

### 5a. React Rules of Hooks
- [ ] No hooks used conditionally (after early returns) — searched with: `grep -r "useEffect\|useState\|useCallback\|useMemo\|useRef" App.tsx`
- [ ] No hooks called inside loops or conditional statements

### 5b. TypeScript Type Safety
- [ ] No `@ts-ignore` or `as any` except where strictly necessary and documented
- [ ] All component props interfaces are fully typed (no `any` in public APIs)
- [ ] All Supabase queries use the typed Database schema from `types/supabase.ts`

### 5c. RBAC / Security
- [ ] All new views are registered in `lib/rbac.ts -> viewAccessMap`
- [ ] Permission checks use `lib/permissions.ts -> hasPermission` via `lib/roleMapper.ts -> canCurrentUser`
- [ ] No hardcoded role strings — always import from `types/enterprise.ts`

### 5d. Multitenancy (Clinic Isolation)
- [ ] All database queries include `clinic_id` filter where applicable
- [ ] Super Admin exceptions are explicitly allowed (not accidentally open)
- [ ] RLS policies enforced at the database level (Supabase)

### 5e. Auth Flow
- [ ] `useEnterpriseAuth` is the single source of truth for auth state
- [ ] `AppLayout.tsx` syncs to Zustand store — no other auth sync exists
- [ ] `App.tsx` legacy entry point does NOT call hooks conditionally
- [ ] No duplicate `supabase.auth.signOut()` calls on logout

### 5f. State Management (Zustand Store)
- [ ] `fetchData` is throttled (30s) and deduplicated to prevent parallel calls
- [ ] `clearAuth` clears all user-specific state from the store
- [ ] Patient/Visit/Inventory mutations always update both DB and local state

### 5g. Performance
- [ ] All heavy components are `React.memo()`-wrapped: `PatientRow`, `PatientDetailModal`, `PatientFormModal`
- [ ] `useMemo` for expensive computed lists (filtered patients, paginated lists)
- [ ] `useCallback` for all handlers passed as props to memoized children
- [ ] Lazy loading is used for all page-level components in `router.tsx`
- [ ] Bundle chunks are properly split (see `vite.config.ts -> manualChunks`)

### 5h. Data Integrity
- [ ] Patient deletion is permission-gated (`patients.delete`)
- [ ] Vitals updates save both to DB and local state
- [ ] Visit history notes use date-stamped entries

### 5i. UI/UX Consistency
- [ ] Dark mode classes present on all new UI elements
- [ ] Responsive breakpoints used: `sm:`, `md:`, `lg:` prefixes
- [ ] `no-print` class applied to all interactive UI elements
- [ ] Toast notifications fired on all async operations (success/error)
- [ ] Loading states shown for all async operations

## 6. Known Issues Registry
Track recurring issues here after each audit:

| Issue | File | Status | Fixed In |
|-------|------|--------|----------|
| `chronicConditions` not in `Patient` type | `BulkImportPatients.tsx:124` | Fixed | Audit #1 |
| Hook called conditionally in `App.tsx` | `App.tsx:213` | Fixed | Audit #1 |
| `getSupabase` import not re-exported | `supabaseClient.ts` | Fixed | Audit #1 |
| `formData` missing `id` field type | `PatientList.tsx:151` | Fixed | Audit #1 |

## 7. Database Schema Consistency Check
Manually compare `types/supabase.ts` against the actual Supabase table definitions:
- `clinics` table has `slug`, `owner_id`, `logo_url`, `plan`, `plan_seats`, `status`, `trial_ends_at`, `settings`, `metadata` columns NOT in the TypeScript type — **update `types/supabase.ts`**
- `users` table is referenced in queries but not in `types/supabase.ts` — **add it**

## 8. Sign-off
- [ ] All TypeScript errors resolved
- [ ] Build passes without errors
- [ ] Manual checklist 5a-5i complete
- [ ] Issues registry updated
