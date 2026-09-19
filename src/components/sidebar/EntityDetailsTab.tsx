import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { EntityType, EntityStatus } from '../../types/structure';
import { Trash2, UserPlus } from 'lucide-react';

const ENTITY_TYPES: EntityType[] = [
  'Trust',
  'Holding Company',
  'Operating Company',
  'LLC',
  'Foundation',
  'Partnership',
  'Individual',
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
  const addDirector = useStructureStore((state) => state.addDirector);
  const removeDirector = useStructureStore((state) => state.removeDirector);

  const [newDirectorName, setNewDirectorName] = useState('');
  const [isCorporate, setIsCorporate] = useState(false);
  const [isResident, setIsResident] = useState(false);

  const entity = entities.find((e) => e.id === selectedEntityId);

  if (!entity) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Select an entity from the canvas or outliner to edit its details and directors.
      </div>
    );
  }

  const handleAddDirectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectorName.trim()) return;
    addDirector(entity.id, {
      name: newDirectorName.trim(),
      isCorporate,
      isResident,
    });
    setNewDirectorName('');
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
          onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 font-medium"
        />
      </div>

      {/* Type & Status */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Entity Type</label>
          <select
            value={entity.type}
            onChange={(e) => updateEntity(entity.id, { type: e.target.value as EntityType })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
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
            onChange={(e) => updateEntity(entity.id, { status: e.target.value as EntityStatus })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
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
          onChange={(e) => updateEntity(entity.id, { jurisdiction: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
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
            onChange={(e) => updateEntity(entity.id, { registrationNumber: e.target.value })}
            placeholder="e.g. BVI-BC-123"
            className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Tax ID / TIN</label>
          <input
            type="text"
            value={entity.taxId || ''}
            onChange={(e) => updateEntity(entity.id, { taxId: e.target.value })}
            placeholder="Optional"
            className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
          />
        </div>
      </div>

      {/* Directors Manager */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block font-semibold text-slate-800 mb-2">
          Board of Directors ({entity.directors.length})
        </label>

        <div className="space-y-1.5 mb-3">
          {entity.directors.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px]"
            >
              <div className="truncate">
                <span className="font-medium text-slate-800">{d.name}</span>
                <span className="ml-1 text-slate-400">
                  ({d.isCorporate ? 'Corporate' : 'Individual'}
                  {d.isResident ? ', Resident' : ''})
                </span>
              </div>
              <button
                onClick={() => removeDirector(entity.id, d.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title={`Remove ${d.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Director Form */}
        <form onSubmit={handleAddDirectorSubmit} className="p-2 bg-slate-50 border border-slate-200 rounded space-y-2">
          <input
            type="text"
            placeholder="New Director or Trustee Name"
            value={newDirectorName}
            onChange={(e) => setNewDirectorName(e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
          />
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
              Resident Director
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs flex items-center justify-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> Add to Board
          </button>
        </form>
      </div>

      {/* Notes */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block font-medium text-slate-700 mb-1">Notes / Legal Specifics</label>
        <textarea
          rows={2}
          value={entity.notes || ''}
          onChange={(e) => updateEntity(entity.id, { notes: e.target.value })}
          placeholder="e.g. Settlor, protector, or governing trust deed dates"
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-[11px]"
        />
      </div>
    </div>
  );
};
