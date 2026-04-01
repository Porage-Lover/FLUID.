/**
 * 🛡️ Sentinel: Simple XOR-based obfuscation to prevent cleartext storage of sensitive data in sessionStorage.
 * This is not a substitute for backend security but prevents casual inspection and satisfies data protection requirements.
 */

const SECRET_KEY = 'fluid_security_layer';

export const encryptData = (data: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const keyBytes = encoder.encode(SECRET_KEY);

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
    const keyBytes = encoder.encode(SECRET_KEY);

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
