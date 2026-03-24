## 2024-05-24 - [Remove Hardcoded Secrets]
**Vulnerability:** Found hardcoded `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `src/lib/supabaseClient.ts` and `api/scrape.ts`.
**Learning:** Hardcoded secrets in code pose a critical security risk as they can be easily exposed if the repository is made public or accessed by unauthorized individuals.
**Prevention:** Always use environment variables for sensitive configuration data and ensure they are not committed to version control.

## 2024-05-24 - [Secure Cache Upsert]
**Vulnerability:** Insecure Cache Upsert / Potential Cache Poisoning in `api/scrape.ts`. The backend was using an anonymous key to upsert data, which would require overly permissive RLS policies if not handled correctly.
**Learning:** Using the `service_role` key in backend serverless functions allows for secure, privileged operations (bypassing RLS) while keeping client-side (frontend) access restricted via RLS.
**Prevention:** Use the Supabase `service_role` key for backend operations that need to bypass RLS, and ensure that the frontend only uses the `anon` key with appropriately restrictive RLS policies.

## 2024-05-24 - [Remove Stack Trace Leakage]
**Vulnerability:** Found `error.stack` details being sent back to the client in the JSON response of `api/scrape.ts` when an exception occurred.
**Learning:** Sending full stack traces to the client exposes internal architectural details and potentially sensitive variables to users or malicious actors.
**Prevention:** Always log the full error stack internally (e.g., using `console.error`), but return a generic, safe error message to the client without the `stack` or `trace` details.
