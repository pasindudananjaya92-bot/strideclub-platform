import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'strideclub-default-secure-vault-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plain text string into a hex payload (iv:tag:encryptedData)
 */
export function encryptData(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted hex string
 */
export function decryptData(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      // Fallback for non-iv legacy strings
      return cipherText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '***';
  }
}

/**
 * Helper to mask sensitive keys for client display (e.g. "sk_live_...9a8f")
 */
export function maskKey(plainKey: string): string {
  if (!plainKey) return '';
  if (plainKey.length <= 8) return '••••••••';
  const start = plainKey.slice(0, 4);
  const end = plainKey.slice(-4);
  return `${start}••••••••${end}`;
}
