import { describe, it, expect } from 'vitest';
import { getEntityTypeColor, getStatusDotClass } from './entityStyle';
import { EntityType, EntityStatus } from '../types/structure';

describe('entityStyle utils', () => {
  describe('getEntityTypeColor', () => {
    it('returns amber colors for Trust', () => {
      const colors = getEntityTypeColor('Trust');
      expect(colors.border).toBe('border-amber-400');
      expect(colors.badgeBg).toBe('bg-amber-100');
      expect(colors.badgeText).toBe('text-amber-800');
      expect(colors.accentBar).toBe('bg-amber-500');
    });

    it('returns sky colors for Holding Company', () => {
      const colors = getEntityTypeColor('Holding Company');
      expect(colors.border).toBe('border-sky-500');
      expect(colors.badgeBg).toBe('bg-sky-100');
      expect(colors.badgeText).toBe('text-sky-800');
      expect(colors.accentBar).toBe('bg-sky-600');
    });

    it('returns emerald colors for Operating Company', () => {
      const colors = getEntityTypeColor('Operating Company');
      expect(colors.border).toBe('border-emerald-500');
      expect(colors.badgeBg).toBe('bg-emerald-100');
      expect(colors.badgeText).toBe('text-emerald-800');
      expect(colors.accentBar).toBe('bg-emerald-600');
    });

    it('returns indigo colors for Foundation', () => {
      const colors = getEntityTypeColor('Foundation');
      expect(colors.border).toBe('border-indigo-400');
      expect(colors.badgeBg).toBe('bg-indigo-100');
      expect(colors.badgeText).toBe('text-indigo-800');
      expect(colors.accentBar).toBe('bg-indigo-600');
    });

    it('returns purple colors for LLC and Partnership', () => {
      const llc = getEntityTypeColor('LLC');
      expect(llc.border).toBe('border-purple-400');
      expect(llc.badgeBg).toBe('bg-purple-100');
      expect(llc.badgeText).toBe('text-purple-800');
      expect(llc.accentBar).toBe('bg-purple-600');

      const partnership = getEntityTypeColor('Partnership');
      expect(partnership.border).toBe('border-purple-400');
    });

    it('returns slate colors for Individual and default', () => {
      const colors = getEntityTypeColor('Individual');
      expect(colors.border).toBe('border-slate-300');
      expect(colors.badgeBg).toBe('bg-slate-100');
      expect(colors.badgeText).toBe('text-slate-800');
      expect(colors.accentBar).toBe('bg-slate-500');

      const defaultColors = getEntityTypeColor('Unknown' as EntityType);
      expect(defaultColors.border).toBe('border-slate-300');
    });
  });

  describe('getStatusDotClass', () => {
    it('returns bg-emerald-500 for Active', () => {
      expect(getStatusDotClass('Active')).toBe('bg-emerald-500');
    });

    it('returns bg-amber-400 for Dormant', () => {
      expect(getStatusDotClass('Dormant')).toBe('bg-amber-400');
    });

    it('returns bg-rose-500 for In Liquidation', () => {
      expect(getStatusDotClass('In Liquidation')).toBe('bg-rose-500');
    });

    it('returns bg-sky-400 for Nominee', () => {
      expect(getStatusDotClass('Nominee')).toBe('bg-sky-400');
    });

    it('returns bg-slate-300 for unknown status', () => {
      expect(getStatusDotClass('Unknown' as EntityStatus)).toBe('bg-slate-300');
    });
  });
});
