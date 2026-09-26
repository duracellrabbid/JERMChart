import { describe, it, expect } from 'vitest';
import { trimTrailingSlashes, trimLeadingSlashes, joinUrl } from '../../utils/urlUtils';

describe('urlUtils', () => {
  describe('trimTrailingSlashes', () => {
    it('strips single and multiple trailing slashes', () => {
      expect(trimTrailingSlashes('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1');
      expect(trimTrailingSlashes('https://api.openai.com/v1///')).toBe('https://api.openai.com/v1');
      expect(trimTrailingSlashes('https://api.openai.com/v1')).toBe('https://api.openai.com/v1');
    });

    it('handles empty strings, whitespace, and root slashes', () => {
      expect(trimTrailingSlashes('')).toBe('');
      expect(trimTrailingSlashes('   ')).toBe('');
      expect(trimTrailingSlashes('///')).toBe('');
      expect(trimTrailingSlashes('  https://api.openai.com/v1/  ')).toBe('https://api.openai.com/v1');
    });

    it('preserves internal slashes in paths', () => {
      expect(trimTrailingSlashes('https://example.com/api/v2/')).toBe('https://example.com/api/v2');
      expect(trimTrailingSlashes('/a/b/c//')).toBe('/a/b/c');
    });
  });

  describe('trimLeadingSlashes', () => {
    it('strips single and multiple leading slashes', () => {
      expect(trimLeadingSlashes('/chat/completions')).toBe('chat/completions');
      expect(trimLeadingSlashes('///chat/completions')).toBe('chat/completions');
      expect(trimLeadingSlashes('chat/completions')).toBe('chat/completions');
    });

    it('handles empty strings and whitespace', () => {
      expect(trimLeadingSlashes('')).toBe('');
      expect(trimLeadingSlashes('   ')).toBe('');
      expect(trimLeadingSlashes('///')).toBe('');
    });
  });

  describe('joinUrl', () => {
    it('joins base URL and endpoint path with a single slash', () => {
      expect(joinUrl('https://api.openai.com/v1', 'chat/completions')).toBe(
        'https://api.openai.com/v1/chat/completions'
      );
      expect(joinUrl('https://api.openai.com/v1/', '/chat/completions')).toBe(
        'https://api.openai.com/v1/chat/completions'
      );
      expect(joinUrl('https://api.openai.com/v1///', '///chat/completions')).toBe(
        'https://api.openai.com/v1/chat/completions'
      );
    });

    it('handles root or empty paths', () => {
      expect(joinUrl('https://api.openai.com/v1', '')).toBe('https://api.openai.com/v1');
      expect(joinUrl('', '/chat/completions')).toBe('/chat/completions');
      expect(joinUrl('', '')).toBe('');
    });
  });
});
