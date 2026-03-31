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

## 2024-05-24 - [Input Validation and Security Headers]
**Vulnerability:** Missing input validation in `api/scrape.ts` could allow arbitrary payload types (e.g. arrays or objects instead of strings) or excessively long strings to be passed. This causes backend `TypeError` crashes or potential Denial of Service (DoS). Additionally, the application lacked standard HTTP security headers, leaving it open to clickjacking and MIME-sniffing attacks.
**Learning:** Blindly destructuring `req.body` and executing string methods like `.includes()` or `.length` without type checking causes 500 crashes when unexpected inputs are supplied. Also, deploying apps without security headers leaves them susceptible to easily mitigated web vulnerabilities.
**Prevention:** Always validate both the presence and explicit type (`typeof === 'string'`) of expected input parameters. Implement sensible length limits for credentials. Furthermore, enforce basic HTTP security headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`) at the proxy or infrastructure level (like `vercel.json`).

## 2024-05-24 - [CSRF and Resource Exhaustion Prevention]
**Vulnerability:** The backend endpoint `api/scrape.ts` lacked a Content-Type check, meaning it could be vulnerable to simple-request CSRF attacks via automated HTML form submissions if authentication relied strictly on ambient credentials (like cookies). Furthermore, external HTTP calls lacked an explicit timeout, leaving serverless instances vulnerable to hangs and resource exhaustion attacks (Denial of Service) if the upstream target stalled.
**Learning:** Accepting generic or unspecified content types allows attackers to orchestrate cross-site requests that bypass CORS preflights. Omitting connection timeouts in cloud environments can quickly drain billing and compute limits.
**Prevention:** Always enforce a strict `Content-Type: application/json` check for API endpoints expecting JSON payloads. Set reasonable `timeout` values (e.g. 15s) for all outbound HTTP requests made within serverless environments.

## 2024-05-24 - [Input Sanitization and Serverless Security Limits]
**Vulnerability:** The authentication payload allowed arbitrary special characters within `regNo` variables. This could lead to malformed downstream requests, path traversal, or potential NoSQL/injection vectors if that ID propagates. Also, attempting to implement in-memory rate limiting within Vercel serverless functions provides "security theater" since rapid instance destruction clears the internal tracking map, offering false protection.
**Learning:** Input sanitization using regular expressions (`^[a-zA-Z0-9.@_-]+$`) is a mandatory defense-in-depth practice to lock down request shapes to absolute explicit bounds. Furthermore, security mechanisms like rate-limiting must be implemented statelessly across serverless nodes (e.g., using Redis) rather than as local in-memory variables.
**Prevention:** Always enforce strict character set validation on user credentials directly at the API gateway layer to prevent malformed string injections. Do not attempt to rely on ephemeral in-memory variables for critical security features in a distributed cloud environment.

## 2024-05-24 - [Fix IDOR in Caching Layer]
**Vulnerability:** Insecure Direct Object Reference (IDOR) where the backend used the plaintext user email (`regNo`) as the primary cache ID in Supabase. Because the frontend fetched this data using an `anon` key passing the email via `localStorage`, an attacker could easily change their local `academia_id` to any other student's email and access their sensitive academic data without re-authenticating.
**Learning:** Never use guessable, deterministic identifiers (like emails or sequential IDs) for data access checks when row-level security or authorization depends solely on client-provided IDs.
**Prevention:** Use cryptographically secure, unguessable identifiers. In this case, creating an HMAC-SHA256 hash of the email using a secure server-side secret (`SUPABASE_SERVICE_ROLE_KEY`) ensures that only authenticated users holding the specific capability token (`secureId`) can access their data.

## 2024-05-24 - [Insecure Session Termination / Cache Wiping]
**Vulnerability:** The application's logout functionality only cleared the authentication token (`academia_id`) from `localStorage`, but left behind sensitive cached academic data (`academia_cache` containing attendance, marks, and timetable).
**Learning:** Incomplete session termination on shared or public devices can allow subsequent users to view the previous user's sensitive data by inspecting local storage or if the frontend optimistically loads cached state before re-authenticating.
**Prevention:** Ensure that all sensitive data, including caches and temporary state, is explicitly wiped from client-side storage mechanisms (like `localStorage`, `sessionStorage`, or IndexedDB) during the logout process.

## 2024-05-24 - [Remove Stack Trace & Error Message Leakage]
**Vulnerability:** Found `error.stack` details being sent back to the client previously, and now `error.stack` and raw `error.message` being logged internally in `api/scrape.ts` when exceptions occurred. This could leak database connection strings or Base64 DOM dumps to the server logs.
**Learning:** Logging full stack traces and raw error messages from external dependencies (like Supabase or Axios) internally can expose sensitive credentials, URLs, or inner system workings to log management systems.
**Prevention:** Sanitize errors before logging them. Omit `error.stack` entirely, and strictly avoid logging raw `error.message` strings directly, instead using safe fallbacks (like `error.name` or generic sanitized strings) to prevent Database Connection String / Configuration leakage.
