import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, UserCheck, ArrowUpDown } from 'lucide-react';

export type ConnectionKind = 'entity-to-entity' | 'person-to-entity';

export interface PendingConnectionInfo {
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  connectionKind: ConnectionKind;
}

export type EntityConnectionResult = {
  connectionKind: 'entity-to-entity';
  sourceId: string;
  targetId: string;
  ownershipPercentage: number;
  shareClass: string;
  isCrossLink: boolean;
};

export type PersonConnectionResult = {
  connectionKind: 'person-to-entity';
  role: string;
  isResident: boolean;
  isCorporate: boolean;
};

export type ConnectionQuickPickerResult = EntityConnectionResult | PersonConnectionResult;

export interface ConnectionQuickPickerProps {
  connection: PendingConnectionInfo;
  position: { x: number; y: number };
  onConfirm: (result: ConnectionQuickPickerResult) => void;
  onCancel: () => void;
}

const SHARE_CLASSES = ['Ordinary Shares', 'Preference Shares', 'Non-Voting Shares', 'Class A Shares', 'Class B Shares'];
const ROLES = ['Director', 'Settlor', 'Protector', 'Enforcer', 'Beneficiary', 'Authorised Signatory', 'Fund Manager'];

export const ConnectionQuickPicker: React.FC<ConnectionQuickPickerProps> = ({
  connection,
  position,
  onConfirm,
  onCancel,
}) => {
  const [ownershipPct, setOwnershipPct] = useState<number>(100);
  const [shareClass, setShareClass] = useState<string>('Ordinary Shares');
  const [isCrossLink, setIsCrossLink] = useState<boolean>(false);

  const [sourceId, setSourceId] = useState<string>(connection.sourceId);
  const [sourceName, setSourceName] = useState<string>(connection.sourceName);
  const [targetId, setTargetId] = useState<string>(connection.targetId);
  const [targetName, setTargetName] = useState<string>(connection.targetName);

  const [role, setRole] = useState<string>('Director');
  const [isResident, setIsResident] = useState<boolean>(false);
  const [isCorporate, setIsCorporate] = useState<boolean>(false);

  useEffect(() => {
    setSourceId(connection.sourceId);
    setSourceName(connection.sourceName);
    setTargetId(connection.targetId);
    setTargetName(connection.targetName);
  }, [connection]);

  const handleSwapDirection = () => {
    setSourceId(targetId);
    setSourceName(targetName);
    setTargetId(sourceId);
    setTargetName(sourceName);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleEntitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      connectionKind: 'entity-to-entity',
      sourceId,
      targetId,
      ownershipPercentage: ownershipPct,
      shareClass,
      isCrossLink,
    });
  };

  const handlePersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      connectionKind: 'person-to-entity',
      role,
      isResident,
      isCorporate,
    });
  };

  const modalLeft = Math.min(Math.max(16, position.x - 140), Math.max(16, window.innerWidth - 320));
  const modalTop = Math.min(Math.max(16, position.y - 120), Math.max(16, window.innerHeight - 340));

  return (
    <div
      role="dialog"
      aria-label={connection.connectionKind === 'entity-to-entity' ? 'Connect Ownership' : 'Assign Fiduciary Role'}
      style={{
        top: modalTop,
        left: modalLeft,
      }}
      className="absolute z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-xs select-none"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          {connection.connectionKind === 'entity-to-entity' ? (
            <>
              <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Connect Ownership</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Assign Fiduciary Role</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
          <div className="text-slate-700 font-semibold truncate" title={sourceName}>
            {sourceName}
          </div>
          <div className="text-slate-400 text-[10px]">▼ connects to</div>
          <div className="text-slate-700 font-semibold truncate" title={targetName}>
            {targetName}
          </div>
        </div>
        {connection.connectionKind === 'entity-to-entity' && (
          <button
            type="button"
            onClick={handleSwapDirection}
            title="Swap Direction"
            aria-label="Swap Direction"
            className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-slate-600 bg-white hover:bg-slate-100 hover:text-sky-600 border border-slate-200 rounded-md transition flex items-center gap-1 shadow-2xs"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Swap</span>
          </button>
        )}
      </div>

      {connection.connectionKind === 'entity-to-entity' ? (
        <form onSubmit={handleEntitySubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Ownership Percentage
            </label>
            <div className="flex items-center gap-1 mb-1.5">
              <button
                type="button"
                onClick={() => setOwnershipPct(100)}
                className={`flex-1 py-1 text-xs font-semibold rounded border transition ${
                  ownershipPct === 100
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setOwnershipPct(50)}
                className={`flex-1 py-1 text-xs font-semibold rounded border transition ${
                  ownershipPct === 50
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                50%
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="custom-pct" className="text-[10px] text-slate-500">Custom %:</label>
              <input
                id="custom-pct"
                type="number"
                min="0"
                max="100"
                value={ownershipPct}
                onChange={(e) => setOwnershipPct(Number(e.target.value))}
                className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-medium"
              />
            </div>
          </div>

          <div>
            <label htmlFor="share-class" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Share Class
            </label>
            <select
              id="share-class"
              value={shareClass}
              onChange={(e) => setShareClass(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
            >
              {SHARE_CLASSES.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <input
              id="cross-link"
              type="checkbox"
              checked={isCrossLink}
              onChange={(e) => setIsCrossLink(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="cross-link" className="text-[10px] text-slate-600">
              Cross-link / Secondary parent
            </label>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded shadow-sm"
            >
              Establish Link
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePersonSubmit} className="space-y-3">
          <div>
            <label htmlFor="role-select" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Appointed Role
            </label>
            <select
              id="role-select"
              data-testid="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              <input
                id="is-resident"
                type="checkbox"
                checked={isResident}
                onChange={(e) => setIsResident(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="is-resident" className="text-[11px] text-slate-600">
                Resident Fiduciary ('RES')
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="is-corporate"
                type="checkbox"
                checked={isCorporate}
                onChange={(e) => setIsCorporate(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="is-corporate" className="text-[11px] text-slate-600">
                Corporate Nominee
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded shadow-sm"
            >
              Assign Role
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
