// AES-256-GCM encryption for sensitive data at rest (API keys, secrets)

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -hex 32');
  }
  // Key should be 64 hex chars = 32 bytes
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns: base64 encoded string in format: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * Input: iv:authTag:ciphertext format
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    // Not encrypted (legacy plain text), return as-is
    return encryptedData;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // If decryption fails, it might be plain text (legacy data)
    return encryptedData;
  }
}

/**
 * Check if a string appears to be encrypted (has iv:authTag:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  // Check if all parts are valid hex strings
  return parts.every(part => /^[0-9a-f]+$/i.test(part));
}

/**
 * Encrypt a value only if it's not already encrypted
 */
export function encryptIfNeeded(value: string): string {
  if (isEncrypted(value)) return value;
  return encrypt(value);
}

/**
 * Mask a sensitive value for display (show only last 4 chars)
 */
export function maskSecret(value: string): string {
  if (!value || value.length < 8) return '****';
  // If encrypted, decrypt first then mask
  const plain = isEncrypted(value) ? decrypt(value) : value;
  return '****' + plain.slice(-4);
}
