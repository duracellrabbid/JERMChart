import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { EntityNodeData } from '../../types/structure';
import { getEntityTypeColor, getStatusDotClass } from '../../utils/entityStyle';
import { useStructureStore } from '../../store/useStructureStore';
import { Building2, User, Landmark, ShieldCheck } from 'lucide-react';

export const EntityCardNode = memo(({ id, data, selected }: NodeProps) => {
  const entity = data as unknown as EntityNodeData;
  const colors = getEntityTypeColor(entity.type);
  const statusDot = getStatusDotClass(entity.status);

  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const highlightedDirector = useStructureStore((state) => state.highlightedDirector);
  const setHighlightedDirector = useStructureStore((state) => state.setHighlightedDirector);

  const isSelected = selected || selectedEntityId === id;
  const containsHighlightedDirector =
    highlightedDirector && entity.directors.some((d) => d.name === highlightedDirector);
  const isDimmed = highlightedDirector && !containsHighlightedDirector;

  return (
    <div
      onClick={() => setSelectedEntityId(id)}
      className={`relative w-[280px] rounded-lg bg-white shadow-md border-2 transition-all duration-150 cursor-pointer ${
        colors.border
      } ${isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''} ${
        containsHighlightedDirector ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      {/* Top Handle for Parent Inflow */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />

      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full rounded-t-sm ${colors.accentBar}`} />

      {/* Card Header */}
      <div className="p-3 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${colors.badgeBg} ${colors.badgeText}`}
          >
            {entity.type}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
            <span className="text-[11px] font-medium">{entity.status}</span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug break-words">
          {entity.name}
        </h3>

        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-slate-600 truncate max-w-[150px]">
            {entity.jurisdiction}
          </span>
          {entity.registrationNumber && (
            <span className="font-mono text-[10px] text-slate-400">
              {entity.registrationNumber}
            </span>
          )}
        </div>
      </div>

      {/* Directors Section */}
      <div className="p-3 pt-2 bg-slate-50/70 rounded-b-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Directors ({entity.directors.length})
          </span>
        </div>

        <div className="space-y-1">
          {entity.directors.length === 0 ? (
            <div className="text-[11px] italic text-slate-400">No directors recorded</div>
          ) : (
            entity.directors.map((dir) => {
              const isTargeted = highlightedDirector === dir.name;
              return (
                <div
                  key={dir.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightedDirector(isTargeted ? null : dir.name);
                  }}
                  className={`flex items-center justify-between text-xs px-2 py-1 rounded transition-colors ${
                    isTargeted
                      ? 'bg-amber-200 text-amber-900 font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                  }`}
                  title="Click to spotlight this director across all entities"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {dir.isCorporate ? (
                      <Landmark className="w-3 h-3 text-sky-600 flex-shrink-0" />
                    ) : (
                      <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate text-[11px]">{dir.name}</span>
                  </div>

                  {dir.isResident && (
                    <span
                      title="Resident Director"
                      className="ml-1 text-[9px] px-1 bg-emerald-100 text-emerald-700 font-bold rounded"
                    >
                      RES
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* UBO / Settlor badge if present */}
        {entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-600 flex-shrink-0" />
            <span className="truncate font-medium">
              {entity.ubosOrBeneficiaries[0]}
              {entity.ubosOrBeneficiaries.length > 1 ? ` +${entity.ubosOrBeneficiaries.length - 1}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Handle for Child Outflow */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />
    </div>
  );
});
