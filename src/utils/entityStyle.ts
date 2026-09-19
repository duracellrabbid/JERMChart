import { EntityType, EntityStatus } from '../types/structure';

export function getEntityTypeColor(type: EntityType): {
  border: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
} {
  switch (type) {
    case 'Trust':
    case 'Trust Company':
      return {
        border: 'border-amber-400',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        accentBar: 'bg-amber-500',
      };
    case 'Holding Company':
      return {
        border: 'border-sky-500',
        badgeBg: 'bg-sky-100',
        badgeText: 'text-sky-800',
        accentBar: 'bg-sky-600',
      };
    case 'Operating Company':
      return {
        border: 'border-emerald-500',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        accentBar: 'bg-emerald-600',
      };
    case 'Foundation':
      return {
        border: 'border-indigo-400',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-800',
        accentBar: 'bg-indigo-600',
      };
    case 'LLC':
    case 'Partnership':
      return {
        border: 'border-purple-400',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-800',
        accentBar: 'bg-purple-600',
      };
    case 'Individual':
    default:
      return {
        border: 'border-slate-300',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-800',
        accentBar: 'bg-slate-500',
      };
  }
}

export function getStatusDotClass(status: EntityStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500';
    case 'Dormant':
      return 'bg-amber-400';
    case 'In Liquidation':
      return 'bg-rose-500';
    case 'Nominee':
      return 'bg-sky-400';
    default:
      return 'bg-slate-300';
  }
}
