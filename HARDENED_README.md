# GuardianCam Enterprise - 10/10 Hardened Security Layer

This is the first official hardened security package for GuardianCam Enterprise.

## What's Included

- `supabase_schema_hardened.sql` — Production-grade multi-tenant schema with proper RLS
- `src/middleware.ts` — Locked down API protection (no bypass)
- `src/lib/rbac.ts` — Role-based access control foundation (owner/admin/operator/viewer)
- `SECURITY_HARDENING_GUIDE.md` — Exact steps to integrate

## Goal

Take the excellent 9.5/10 codebase to a true **10/10 production-ready** state before any customer deployment.

## How to Use

1. Read `SECURITY_HARDENING_GUIDE.md`
2. Apply the schema changes in Supabase
3. Replace the middleware and add the RBAC helper
4. Test thoroughly
5. Reply "security phase 1 integrated" for the next hardening module

This is the foundation. More modules (DB hardening, full RBAC on routes, audit triggers, etc.) are coming in the next packages.

---
Built for production. No shortcuts.
