import { test } from 'node:test';
import assert from 'node:assert';
import { encryptData, decryptData } from './security.ts';

test('encryptData and decryptData', () => {
  const original = JSON.stringify({ user: "test", id: 123 });
  const encrypted = encryptData(original);
  assert.notStrictEqual(encrypted, original);
  const decrypted = decryptData(encrypted);
  assert.strictEqual(decrypted, original);
});

test('encryptData and decryptData with specific environment variable', async () => {
  process.env.VITE_OBFUSCATION_KEY = 'test_key';
  // Dynamically import to pick up the env var
  const { encryptData: dynamicEncrypt, decryptData: dynamicDecrypt } = await import('./security.ts?v=' + Date.now());
  const original = JSON.stringify({ user: "test2", id: 456 });
  const encrypted = dynamicEncrypt(original);
  assert.notStrictEqual(encrypted, original);
  const decrypted = dynamicDecrypt(encrypted);
  assert.strictEqual(decrypted, original);
  delete process.env.VITE_OBFUSCATION_KEY;
});
