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
    case 'Bank':
      return {
        border: 'border-cyan-500',
        badgeBg: 'bg-cyan-100',
        badgeText: 'text-cyan-800',
        accentBar: 'bg-cyan-600',
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

export function getRoleBadgeStyle(role: string): { bg: string; text: string; border: string } {
  const normalized = (role || '').trim().toLowerCase();
  switch (normalized) {
    case 'director':
    case 'directors':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    case 'settlor':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'protector':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'enforcer':
    case 'enforcers':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'fund manager':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'asset contributor':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'authorised signatory':
    case 'authorized signatory':
    case 'authorised signatories':
    case 'authorized signatories':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    case 'trustee':
    case 'trustees':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' };
    case 'beneficiary':
    case 'beneficiaries':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
