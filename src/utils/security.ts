/**
 * 🛡️ Sentinel: Simple XOR-based obfuscation to prevent cleartext storage of sensitive data in sessionStorage.
 * This is not a substitute for backend security but prevents casual inspection and satisfies data protection requirements.
 */

// Dynamically generate a session-scoped secret if none is provided via environment variables.
// This ensures that the ID isn't hardcoded and prevents exposure in source control.
// The key is cached at the module level for the duration of the execution context to ensure consistency.
let moduleLevelKey: string | null = null;

const getSecretKey = (): string => {
  // Use ts-ignore to allow accessing process.env in the test environment without breaking the Vite build
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OBFUSCATION_KEY) ||
                 // @ts-expect-error test-env-only
                 (typeof process !== 'undefined' && process.env?.VITE_OBFUSCATION_KEY);

  if (envKey) return envKey;

  if (moduleLevelKey) return moduleLevelKey;

  // Use a session-scoped randomly generated key as fallback.
  // It's generated once per session ensuring encryption and decryption use the same key,
  // without hardcoding any sensitive strings.
  let sessionKey = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('fluid_session_key') : null;

  if (!sessionKey) {
     if (typeof crypto !== 'undefined' && crypto.randomUUID) {
       sessionKey = crypto.randomUUID();
     } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
       const array = new Uint8Array(16);
       crypto.getRandomValues(array);
       sessionKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
     } else {
       throw new Error('Cryptographically secure PRNG not available for key generation');
     }

     if (typeof sessionStorage !== 'undefined') {
       sessionStorage.setItem('fluid_session_key', sessionKey);
     }
  }

  moduleLevelKey = sessionKey;
  return sessionKey;
};

export const encryptData = (data: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const keyBytes = encoder.encode(getSecretKey());

  const obfuscated = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    obfuscated[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }

  let binary = '';
  const len = obfuscated.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(obfuscated[i]);
  }
  return btoa(binary);
};

export const decryptData = (encryptedData: string): string => {
  try {
    if (!encryptedData) return '';

    const binary = atob(encryptedData);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(getSecretKey());

    const deobfuscated = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      deobfuscated[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(deobfuscated);
  } catch (e) {
    console.error('🛡️ Sentinel: Decryption failed', e);
    return '';
  }
};
