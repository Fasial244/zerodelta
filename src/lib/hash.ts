/**
 * Secure flag hashing utility using SHA-256
 * Uses Web Crypto API for client-side hashing
 */

export async function hashFlag(input: string, salt: string): Promise<string> {
  const saltedInput = salt + input;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedInput);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify if a submitted flag hash matches the stored hash
 */
export function verifyHash(submittedHash: string, storedHash: string): boolean {
  return submittedHash.toLowerCase() === storedHash.toLowerCase();
}
