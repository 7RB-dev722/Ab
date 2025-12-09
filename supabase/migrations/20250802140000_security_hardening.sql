/*
  # Security Hardening
  Enable pg_leaked_password extension to resolve security advisory.

  ## Query Description:
  Enables the pg_leaked_password extension which checks passwords against a list of leaked passwords.
  This helps prevent users from using compromised passwords.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

CREATE EXTENSION IF NOT EXISTS "pg_leaked_password";
