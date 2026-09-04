-- Run this ONCE in Supabase → SQL Editor for the production database.
-- This is not a Prisma migration — it's a manual DB hardening step.
--
-- Why: Prisma connects as the `postgres` role via the pooler, which bypasses RLS.
-- Supabase's built-in Data API (PostgREST) uses the `anon` / `authenticated` roles.
-- Without RLS, anyone with the anon key can read our User table (including bcrypt
-- hashes and reset tokens) through PostgREST.
--
-- With RLS enabled and NO policies, PostgREST returns nothing to anon/authenticated,
-- while Prisma continues to work unchanged.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Deny-all is the default when RLS is on with no policies.
-- Verify no policies exist:
-- SELECT * FROM pg_policies WHERE tablename = 'User';

-- Also: revoke direct table access from anon/authenticated as belt-and-suspenders.
REVOKE ALL ON public."User" FROM anon, authenticated;
