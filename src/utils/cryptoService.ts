import { TrustStructureChart } from '../types/structure';

export interface EncryptedChartEnvelope {
  format: 'jermchart-encrypted';
  version: number;
  kdf: {
    algorithm: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string; // Base64
  };
  cipher: {
    algorithm: 'AES-GCM';
    iv: string; // Base64
    data: string; // Base64
  };
}

export const MIN_KDF_ITERATIONS = 1;
export const MAX_KDF_ITERATIONS = 1_000_000;

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isEncryptedEnvelope(data: unknown): data is EncryptedChartEnvelope {
  if (!data || typeof data !== 'object') return false;
  const env = data as Partial<EncryptedChartEnvelope>;
  return (
    env.format === 'jermchart-encrypted' &&
    typeof env.version === 'number' &&
    typeof env.kdf?.iterations === 'number' &&
    env.kdf.iterations >= MIN_KDF_ITERATIONS &&
    env.kdf.iterations <= MAX_KDF_ITERATIONS &&
    typeof env.kdf?.salt === 'string' &&
    typeof env.cipher?.iv === 'string' &&
    typeof env.cipher?.data === 'string'
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptChart(
  chart: TrustStructureChart,
  password: string
): Promise<string> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKeyFromPassword(password, salt, iterations);
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(JSON.stringify(chart));

  const cipherBytes = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintextBytes
  );

  const envelope: EncryptedChartEnvelope = {
    format: 'jermchart-encrypted',
    version: 1,
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
      salt: arrayBufferToBase64(salt),
    },
    cipher: {
      algorithm: 'AES-GCM',
      iv: arrayBufferToBase64(iv),
      data: arrayBufferToBase64(cipherBytes),
    },
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptChart(
  encryptedJson: string,
  password: string
): Promise<TrustStructureChart> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(encryptedJson);
  } catch (err) {
    throw new Error('Invalid encrypted file format', { cause: err });
  }

  if (!isEncryptedEnvelope(envelope)) {
    throw new Error('Invalid encrypted file format');
  }

  try {
    const salt = new Uint8Array(base64ToArrayBuffer(envelope.kdf.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(envelope.cipher.iv));
    const cipherBuffer = base64ToArrayBuffer(envelope.cipher.data);

    const key = await deriveKeyFromPassword(password, salt, envelope.kdf.iterations);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    const chart = JSON.parse(jsonString) as TrustStructureChart;

    if (!chart || !Array.isArray(chart.entities) || !Array.isArray(chart.relationships)) {
      throw new Error('Decrypted content is not a valid chart');
    }

    return chart;
  } catch (err) {
    if (err instanceof Error && err.message === 'Decrypted content is not a valid chart') {
      throw err;
    }
    throw new Error('Invalid password or corrupted file', { cause: err });
  }
}
