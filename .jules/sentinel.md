## 2025-10-13 - [HIGH] Fix Axios redirect-based SSRF via fetch adapter
**Vulnerability:** Axios fetch adapter silently ignores maxRedirects: 0, allowing redirect-based SSRF.
**Learning:** Even when maxRedirects is set to 0, underlying adapters like fetch may not honor it, causing silent bypasses that can lead to SSRF if unhandled redirects occur to internal services.
**Prevention:** Regularly audit and upgrade core networking dependencies (like Axios) and ensure specific features (like maxRedirects) are enforced correctly across all environments and adapters.
