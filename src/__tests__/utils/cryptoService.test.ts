import { describe, it, expect } from 'vitest';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  isEncryptedEnvelope,
  deriveKeyFromPassword,
  encryptChart,
  decryptChart,
  EncryptedChartEnvelope,
  MIN_KDF_ITERATIONS,
  MAX_KDF_ITERATIONS,
} from '../../utils/cryptoService';
import { TrustStructureChart } from '../../types/structure';

const mockChart: TrustStructureChart = {
  metadata: {
    chartTitle: 'Alpha Family Trust',
    clientReference: 'REF-001',
    effectiveDate: '2026-10-31',
    confidentialityNotice: 'CONFIDENTIAL',
  },
  entities: [
    {
      id: 'entity-1',
      name: 'Alpha Holdings Ltd',
      type: 'Holding Company',
      jurisdiction: 'Singapore',
      status: 'Active',
      associatedParties: [],
    },
  ],
  relationships: [],
};

describe('cryptoService', () => {
  it('correctly encodes and decodes base64 buffers for Uint8Array and ArrayBuffer', () => {
    const bytes = new Uint8Array([1, 2, 3, 255, 0, 128]);
    const b64FromUint8 = arrayBufferToBase64(bytes);
    const decoded1 = new Uint8Array(base64ToArrayBuffer(b64FromUint8));
    expect(decoded1).toEqual(bytes);

    // Test passing ArrayBuffer directly
    const b64FromArrayBuffer = arrayBufferToBase64(bytes.buffer);
    const decoded2 = new Uint8Array(base64ToArrayBuffer(b64FromArrayBuffer));
    expect(decoded2).toEqual(bytes);
  });

  it('efficiently encodes large buffers (>64KB) to base64 and roundtrips with base64ToArrayBuffer', () => {
    const largeBuffer = new Uint8Array(100 * 1024);
    for (let i = 0; i < largeBuffer.length; i++) {
      largeBuffer[i] = i % 256;
    }
    const b64 = arrayBufferToBase64(largeBuffer);
    const restored = new Uint8Array(base64ToArrayBuffer(b64));
    expect(restored.length).toBe(largeBuffer.length);
    expect(restored[500]).toBe(500 % 256);
    expect(restored[65536]).toBe(65536 % 256);
  });

  it('validates encrypted chart envelope structure', () => {
    expect(isEncryptedEnvelope(null)).toBe(false);
    expect(isEncryptedEnvelope(undefined)).toBe(false);
    expect(isEncryptedEnvelope(123)).toBe(false);
    expect(isEncryptedEnvelope('string')).toBe(false);
    expect(isEncryptedEnvelope({})).toBe(false);
    expect(isEncryptedEnvelope({ format: 'other' })).toBe(false);
    expect(isEncryptedEnvelope({ format: 'jermchart-encrypted' })).toBe(false);
    expect(isEncryptedEnvelope({ format: 'jermchart-encrypted', version: '1' })).toBe(false);
    expect(isEncryptedEnvelope({ format: 'jermchart-encrypted', version: 1, kdf: {} })).toBe(false);
    expect(
      isEncryptedEnvelope({
        format: 'jermchart-encrypted',
        version: 1,
        kdf: { salt: 'c2FsdA==' },
        cipher: {},
      })
    ).toBe(false);
    expect(
      isEncryptedEnvelope({
        format: 'jermchart-encrypted',
        version: 1,
        kdf: { salt: 'c2FsdA==' },
        cipher: { iv: 'aXY=' },
      })
    ).toBe(false);

    const validEnvelope: EncryptedChartEnvelope = {
      format: 'jermchart-encrypted',
      version: 1,
      kdf: {
        algorithm: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 100000,
        salt: 'c2FsdA==',
      },
      cipher: {
        algorithm: 'AES-GCM',
        iv: 'aXY=',
        data: 'ZGF0YQ==',
      },
    };
    expect(isEncryptedEnvelope(validEnvelope)).toBe(true);
  });

  it('derives key with default and custom iterations', async () => {
    const salt = new Uint8Array(16);
    const keyDefault = await deriveKeyFromPassword('testPassword', salt);
    expect(keyDefault).toBeDefined();
    expect(keyDefault.algorithm.name).toBe('AES-GCM');

    const keyCustom = await deriveKeyFromPassword('testPassword', salt, 50000);
    expect(keyCustom).toBeDefined();
  });

  it('encrypts and successfully decrypts a chart with the correct password', async () => {
    const password = 'SuperSecretPassword123!';
    const encryptedString = await encryptChart(mockChart, password);

    const parsedEnvelope = JSON.parse(encryptedString);
    expect(isEncryptedEnvelope(parsedEnvelope)).toBe(true);
    expect(parsedEnvelope.format).toBe('jermchart-encrypted');
    expect(parsedEnvelope.version).toBe(1);
    expect(parsedEnvelope.kdf.algorithm).toBe('PBKDF2');
    expect(parsedEnvelope.cipher.algorithm).toBe('AES-GCM');

    const decryptedChart = await decryptChart(encryptedString, password);
    expect(decryptedChart).toEqual(mockChart);
  });

  it('throws an error when decrypting with an incorrect password', async () => {
    const password = 'CorrectPassword123!';
    const wrongPassword = 'WrongPassword456!';
    const encryptedString = await encryptChart(mockChart, password);

    await expect(decryptChart(encryptedString, wrongPassword)).rejects.toThrow(
      'Invalid password or corrupted file'
    );
  });

  it('throws an error when decrypting malformed or tampered payload', async () => {
    const password = 'Password123!';
    const encryptedString = await encryptChart(mockChart, password);
    const envelope = JSON.parse(encryptedString);

    // Tamper with ciphertext
    envelope.cipher.data = arrayBufferToBase64(new Uint8Array([9, 9, 9, 9]));
    const tamperedString = JSON.stringify(envelope);

    await expect(decryptChart(tamperedString, password)).rejects.toThrow(
      'Invalid password or corrupted file'
    );
  });

  it('throws when payload is not valid JSON or not a valid encrypted envelope', async () => {
    await expect(decryptChart('invalid-json{{{', 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );
    await expect(decryptChart('{"foo": "bar"}', 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );
  });

  it('enforces safe bounds on KDF iterations (between 1 and 1,000,000)', async () => {
    expect(MIN_KDF_ITERATIONS).toBe(1);
    expect(MAX_KDF_ITERATIONS).toBe(1_000_000);

    const baseValidEnvelope = {
      format: 'jermchart-encrypted',
      version: 1,
      kdf: {
        algorithm: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 100000,
        salt: 'c2FsdA==',
      },
      cipher: {
        algorithm: 'AES-GCM',
        iv: 'aXY=',
        data: 'ZGF0YQ==',
      },
    };

    // Valid bounds
    expect(
      isEncryptedEnvelope({
        ...baseValidEnvelope,
        kdf: { ...baseValidEnvelope.kdf, iterations: 1 },
      })
    ).toBe(true);
    expect(
      isEncryptedEnvelope({
        ...baseValidEnvelope,
        kdf: { ...baseValidEnvelope.kdf, iterations: 1_000_000 },
      })
    ).toBe(true);

    // Excessive iterations (> 1,000,000)
    const excessive = {
      ...baseValidEnvelope,
      kdf: { ...baseValidEnvelope.kdf, iterations: 1_000_001 },
    };
    expect(isEncryptedEnvelope(excessive)).toBe(false);
    await expect(decryptChart(JSON.stringify(excessive), 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );

    // Zero or negative iterations
    const zero = {
      ...baseValidEnvelope,
      kdf: { ...baseValidEnvelope.kdf, iterations: 0 },
    };
    expect(isEncryptedEnvelope(zero)).toBe(false);
    await expect(decryptChart(JSON.stringify(zero), 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );

    const negative = {
      ...baseValidEnvelope,
      kdf: { ...baseValidEnvelope.kdf, iterations: -100 },
    };
    expect(isEncryptedEnvelope(negative)).toBe(false);
    await expect(decryptChart(JSON.stringify(negative), 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );

    // Non-numeric or missing iterations
    const missing = {
      ...baseValidEnvelope,
      kdf: { algorithm: 'PBKDF2', hash: 'SHA-256', salt: 'c2FsdA==' },
    };
    expect(isEncryptedEnvelope(missing)).toBe(false);
    await expect(decryptChart(JSON.stringify(missing), 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );

    const nonNumeric = {
      ...baseValidEnvelope,
      kdf: { ...baseValidEnvelope.kdf, iterations: '100000' as unknown as number },
    };
    expect(isEncryptedEnvelope(nonNumeric)).toBe(false);
    await expect(decryptChart(JSON.stringify(nonNumeric), 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );
  });

  it('throws when password is empty or whitespace only', async () => {
    await expect(encryptChart(mockChart, '')).rejects.toThrow('Password cannot be empty');
    await expect(encryptChart(mockChart, '   ')).rejects.toThrow('Password cannot be empty');
    await expect(decryptChart('{}', '')).rejects.toThrow('Password cannot be empty');
    await expect(decryptChart('{}', '   ')).rejects.toThrow('Password cannot be empty');
  });

  it('throws when decrypted content is not a valid chart', async () => {
    const password = 'ValidPassword123!';
    // Encrypt something that is valid JSON but not a TrustStructureChart
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const iterations = 100000;
    const key = await deriveKeyFromPassword(password, salt, iterations);

    const invalidContent = JSON.stringify({ notA: 'chart' });
    const plaintextBytes = new TextEncoder().encode(invalidContent);
    const cipherBytes = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintextBytes
    );

    const fakeEnvelope: EncryptedChartEnvelope = {
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

    await expect(decryptChart(JSON.stringify(fakeEnvelope), password)).rejects.toThrow(
      'Decrypted content is not a valid chart'
    );
  });
});
