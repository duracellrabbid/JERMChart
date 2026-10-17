#!/usr/bin/env node

/**
 * Standalone AI Connection & Multimodal Vision Diagnostics Script
 *
 * Usage:
 *   node scripts/test-ai-connection.mjs [API_KEY] [--model=gemini-3.8-flash]
 *
 * Environment variables:
 *   GEMINI_API_KEY (used if no CLI argument is provided)
 */

import { GoogleGenAI } from '@google/genai';

// 1x1 transparent PNG data URI base64 payload for testing Vision OCR input
const DUMMY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function parseCliArgs() {
  const args = process.argv.slice(2);
  let apiKey = '';
  let model = 'gemini-3.8-flash';

  for (const arg of args) {
    if (arg.startsWith('--model=')) {
      model = arg.slice('--model='.length).trim() || model;
    } else if (!arg.startsWith('--') && !apiKey) {
      apiKey = arg.trim();
    }
  }

  if (!apiKey) {
    apiKey = (process.env.GEMINI_API_KEY || '').trim();
  }

  return { apiKey, model };
}

function extractErrorMessage(error) {
  if (!error) return 'Network error';

  let raw = '';
  if (typeof error === 'string') {
    raw = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    raw = String(error.message || '');
  }

  if (!raw.trim()) return 'Network error';

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.error && typeof parsed.error.message === 'string') {
      return parsed.error.message;
    }
  } catch {
    // raw string
  }

  return raw;
}

async function runDiagnostics() {
  const { apiKey, model } = parseCliArgs();

  console.log('\n======================================================');
  console.log('       JERMChart AI Vision Connection Diagnostics       ');
  console.log('======================================================\n');

  if (!apiKey) {
    console.error('❌ Error: No API key provided.');
    console.error('Usage:');
    console.error('  node scripts/test-ai-connection.mjs <API_KEY> [--model=<model-id>]');
    console.error('Or set the GEMINI_API_KEY environment variable:\n');
    console.error('  $env:GEMINI_API_KEY="your_api_key"; npm run test:ai\n');
    process.exit(1);
  }

  const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : '****';
  console.log(`[Config] Target Model: ${model}`);
  console.log(`[Config] API Key:      ${maskedKey}`);
  console.log('------------------------------------------------------\n');

  const ai = new GoogleGenAI({ apiKey });

  // Phase 1: Basic Text Ping (Authentication & Model Handshake)
  process.stdout.write('[Phase 1/2] Testing API Authentication & Model Ping... ');
  const t0 = Date.now();
  try {
    const pingResponse = await ai.models.generateContent({
      model,
      contents: 'Ping',
    });
    const tPing = Date.now() - t0;
    const text = pingResponse.text ? pingResponse.text.trim().replace(/\n/g, ' ') : 'OK';
    console.log(`✅ SUCCESS (${tPing}ms)`);
    console.log(`            Response: "${text.slice(0, 60)}"`);
  } catch (err) {
    const tPing = Date.now() - t0;
    console.log(`❌ FAILED (${tPing}ms)`);
    console.error(`\nDiagnostic Error Details:`);
    console.error(`  ${extractErrorMessage(err)}\n`);
    process.exit(1);
  }

  // Phase 2: Multimodal Vision OCR Capability Test
  process.stdout.write('[Phase 2/2] Testing Multimodal Vision (Inline Image)... ');
  const t1 = Date.now();
  try {
    const visionResponse = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: DUMMY_PNG_BASE64,
          },
        },
        { text: 'Describe what you see in this image in one brief sentence.' },
      ],
    });
    const tVision = Date.now() - t1;
    const visionText = visionResponse.text ? visionResponse.text.trim().replace(/\n/g, ' ') : 'Image accepted';
    console.log(`✅ SUCCESS (${tVision}ms)`);
    console.log(`            Response: "${visionText.slice(0, 80)}"`);
  } catch (err) {
    const tVision = Date.now() - t1;
    console.log(`❌ FAILED (${tVision}ms)`);
    console.error(`\nVision Multimodal Error Details:`);
    console.error(`  ${extractErrorMessage(err)}\n`);
    process.exit(1);
  }

  console.log('\n------------------------------------------------------');
  console.log('🎉 All connection tests passed! AI Vision is operational.');
  console.log('======================================================\n');
}

runDiagnostics();
