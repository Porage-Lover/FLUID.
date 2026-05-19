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

## 2026-04-04 - [Prevent SSRF in OAuth Gateway Resolution]
**Vulnerability:** The backend endpoint `api/scrape.ts` extracted an `oauthorize_uri` directly from an upstream JSON response and immediately performed an HTTP GET request to it without validation. This created a Server-Side Request Forgery (SSRF) vulnerability.
**Learning:** Blindly trusting and requesting URLs provided by external data sources (even seemingly trusted upstream APIs) can allow attackers to pivot through the server to access internal network resources or metadata endpoints (like AWS IMDS or Vercel internal services).
**Prevention:** Always strictly validate and sanitize URLs before passing them to HTTP clients (e.g., Axios). Enforce a strict domain allowlist (e.g., `startsWith('https://academia.srmist.edu.in/')`) to guarantee the server only communicates with the intended target.

## 2026-04-07 - [Prevent Sensitive API Payload Caching]
**Vulnerability:** Backend API `api/scrape.ts` returning sensitive student data (attendance, marks) lacked strict cache prevention headers, allowing browsers and intermediate Vercel edge proxies to potentially cache the cleartext JSON payload.
**Learning:** Even when requests are over HTTPS and require authentication (or credentials in body), omitting cache headers on responses containing PII can lead to data leakage if devices are shared or edge proxies are misconfigured.
**Prevention:** Always explicitly set `Cache-Control: no-store`, `Pragma: no-cache`, and `Surrogate-Control: no-store` headers on serverless endpoints returning sensitive user data.

## 2026-04-21 - [Prevent SSRF Bypass via Embedded Credentials]
**Vulnerability:** The backend endpoint `api/scrape.ts` validated the `oauthorize_uri` for Server-Side Request Forgery (SSRF) using `.startsWith('https://academia.srmist.edu.in/')`. This allowed an attacker to bypass the check by providing a URL with embedded credentials, e.g., `https://academia.srmist.edu.in@evil.com`, causing the server to request a malicious target.
**Learning:** String-matching methods like `.startsWith()` are insufficient for URL validation, as they do not account for the standard structure of URLs, such as basic authentication parameters, which can completely alter the actual destination host.
**Prevention:** Always use the native `URL` constructor to reliably parse URLs and strictly validate the `protocol` and `hostname` properties to verify the exact intended destination.

## 2024-05-24 - [Enforce Strict Domain Validation on Credentials]
**Vulnerability:** The backend `api/scrape.ts` allowed any email domain to be used for authentication.
**Learning:** Missing domain validation on user credentials allows attackers to bypass frontend UI checks and potentially abuse the backend API as an open proxy for third-party SSO.
**Prevention:** Always enforce strict domain validation on user credentials directly at the API gateway layer, using `.toLowerCase().endsWith()` for case-insensitive checks.

## 2026-04-21 - [Prevent PII Leakage in Logs]
**Vulnerability:** The backend endpoint `api/scrape.ts` was writing substrings of the sensitive user identifier (`regNo`) into application error logs when validation failed.
**Learning:** Even partial substrings of Personally Identifiable Information (PII) or credentials must never be written to logs, as aggregating this metadata across systems can reconstruct identities and violate data protection regulations.
**Prevention:** Always omit user identifiers from log metadata entirely. Ensure verification via tools like `grep` on logging calls (e.g., `logger.error`, `console.log`) to confirm PII isolation.

## 2026-04-21 - [Secure Random Number Generation for Session Obfuscation]
**Vulnerability:** The application used `Math.random()` as a fallback for generating `sessionKey` in `src/utils/security.ts` when `crypto.randomUUID` was unavailable.
**Learning:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG). Using it for security-sensitive operations (even casual obfuscation like XORing session data) makes the generated key highly predictable and vulnerable to attacks, compromising the underlying data.
**Prevention:** Always use a CSPRNG like `crypto.getRandomValues()` as a fallback if `crypto.randomUUID()` is missing. Never rely on `Math.random()` for any form of data encryption, obfuscation, or session key generation.

## 2024-05-24 - [Prevent Credential Leakage in Axios Error Logs]
**Vulnerability:** The frontend `src/pages/Login.tsx` was logging the raw Axios error object (`e`) to the console upon authentication failure. Since the original request payload included the user's plaintext password, it was exposed within the `e.config.data` property of the error object.
**Learning:** Default error objects from HTTP clients like Axios often attach the full request configuration (including headers and body payloads) to the error instance for debugging purposes, inadvertently leaking sensitive credentials to client-side logs.
**Prevention:** Never log raw error objects from HTTP clients if the request payload contains PII or credentials. Always destructure or explicitly log safe properties like `e.message` or `e.response?.status` instead.

## 2026-05-19 - [Fix Vulnerable Transitive Dependencies]
**Vulnerability:** Transitive dependencies `ws` and `brace-expansion` had known vulnerabilities (Uninitialized memory disclosure and DoS via large numeric range).
**Learning:** Global package updates might not always resolve deeply nested transitive vulnerabilities within third-party lockfiles. Using version-bound `pnpm.overrides` ensures explicit dependency patch requirements are forced across all importers.
**Prevention:** Use `pnpm audit` as a standard CI/CD pre-flight check and employ scoped `pnpm.overrides` to forcefully upgrade unsafe transitive boundaries when upstream maintainers lag.
