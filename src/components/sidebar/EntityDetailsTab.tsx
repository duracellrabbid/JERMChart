import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { EntityType, EntityStatus, AssociatedRole } from '../../types/structure';
import { Trash2, UserPlus } from 'lucide-react';
import { getRoleBadgeStyle } from '../../utils/entityStyle';

const ENTITY_TYPES: EntityType[] = [
  'Trust',
  'Trust Company',
  'Holding Company',
  'Operating Company',
  'LLC',
  'Foundation',
  'Partnership',
  'Individual',
  'Bank',
];

const COMMON_ROLES: AssociatedRole[] = [
  'Director',
  'Enforcer',
  'Settlor',
  'Protector',
  'Beneficiary',
  'Asset Contributor',
  'Authorised Signatory',
  'Fund Manager',
  'Trustee',
];

const ENTITY_STATUSES: EntityStatus[] = ['Active', 'Dormant', 'In Liquidation', 'Nominee'];

const COMMON_JURISDICTIONS = [
  'BVI',
  'Cayman Islands',
  'Channel Islands (Jersey)',
  'Channel Islands (Guernsey)',
  'Singapore',
  'Hong Kong',
  'Delaware, USA',
  'United Kingdom',
  'Switzerland',
  'Cook Islands',
  'Marshall Islands',
  'Liechtenstein',
];

export const EntityDetailsTab: React.FC = () => {
  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const entities = useStructureStore((state) => state.entities);
  const updateEntity = useStructureStore((state) => state.updateEntity);
  const addAssociatedParty = useStructureStore((state) => state.addAssociatedParty);
  const removeAssociatedParty = useStructureStore((state) => state.removeAssociatedParty);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);

  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyRole, setNewPartyRole] = useState<string>('Director');
  const [isCorporate, setIsCorporate] = useState(false);
  const [isResident, setIsResident] = useState(false);

  const entity = entities.find((e) => e.id === selectedEntityId);

  if (!entity) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Select an entity from the canvas or outliner to edit its details and associated parties.
      </div>
    );
  }

  const parties = entity.associatedParties || [];

  const handleAddPartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    addAssociatedParty(entity.id, {
      name: newPartyName.trim(),
      role: newPartyRole.trim() || 'Director',
      isCorporate,
      isResident,
    });
    setNewPartyName('');
    setIsCorporate(false);
    setIsResident(false);
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 text-xs">
      {/* Name */}
      <div>
        <label className="block font-medium text-slate-700 mb-1">Entity Name</label>
        <input
          type="text"
          value={entity.name}
          disabled={isReadOnly}
          onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 font-medium disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </div>

      {/* Type & Status */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Entity Type</label>
          <select
            value={entity.type}
            disabled={isReadOnly}
            onChange={(e) => updateEntity(entity.id, { type: e.target.value as EntityType })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Status</label>
          <select
            value={entity.status}
            disabled={isReadOnly}
            onChange={(e) => updateEntity(entity.id, { status: e.target.value as EntityStatus })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {ENTITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jurisdiction */}
      <div>
        <label className="block font-medium text-slate-700 mb-1">Jurisdiction</label>
        <input
          type="text"
          list="jurisdictions-list"
          value={entity.jurisdiction}
          disabled={isReadOnly}
          onChange={(e) => updateEntity(entity.id, { jurisdiction: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
        <datalist id="jurisdictions-list">
          {COMMON_JURISDICTIONS.map((j) => (
            <option key={j} value={j} />
          ))}
        </datalist>
      </div>

      {/* Registration & Tax Number */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Registration / Reg No</label>
          <input
            type="text"
            value={entity.registrationNumber || ''}
            disabled={isReadOnly}
            onChange={(e) => updateEntity(entity.id, { registrationNumber: e.target.value })}
            placeholder="e.g. BVI-BC-123"
            className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-tabular text-[11px] tracking-tight disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Tax ID / TIN</label>
          <input
            type="text"
            value={entity.taxId || ''}
            disabled={isReadOnly}
            onChange={(e) => updateEntity(entity.id, { taxId: e.target.value })}
            placeholder="Optional"
            className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-tabular text-[11px] tracking-tight disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Associated Parties Manager */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block font-semibold text-slate-800 mb-2">
          Associated Parties ({parties.length})
        </label>

        <div className="space-y-1.5 mb-3">
          {parties.map((p) => {
            const roleStyle = getRoleBadgeStyle(p.role);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px]"
              >
                <div className="truncate flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text} border ${roleStyle.border}`}>
                    {p.role}
                  </span>
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <span className="text-slate-400 text-[10px]">
                    ({p.isCorporate ? 'Corp' : 'Indiv'}
                    {p.isResident ? ', Res' : ''})
                  </span>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => removeAssociatedParty(entity.id, p.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title={`Remove ${p.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Associated Party Form */}
        {!isReadOnly && (
          <form onSubmit={handleAddPartySubmit} className="p-2 bg-slate-50 border border-slate-200 rounded space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="Party Name"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
              />
              <input
                type="text"
                list="common-roles-list"
                placeholder="Role (e.g. Director)"
                value={newPartyRole}
                onChange={(e) => setNewPartyRole(e.target.value)}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
              />
              <datalist id="common-roles-list">
                {COMMON_ROLES.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCorporate}
                  onChange={(e) => setIsCorporate(e.target.checked)}
                />
                Corporate
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                />
                Resident
              </label>
            </div>
            <button
              type="submit"
              className="w-full py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Add Associated Party
            </button>
          </form>
        )}
      </div>

      {/* Notes */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block font-medium text-slate-700 mb-1">Notes / Legal Specifics</label>
        <textarea
          rows={2}
          value={entity.notes || ''}
          disabled={isReadOnly}
          onChange={(e) => updateEntity(entity.id, { notes: e.target.value })}
          placeholder="e.g. Settlor, protector, or governing trust deed dates"
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-[11px] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};
