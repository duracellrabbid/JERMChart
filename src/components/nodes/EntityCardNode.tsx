import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Director, EntityNodeData } from '../../types/structure';
import { getEntityTypeColor, getStatusDotClass } from '../../utils/entityStyle';
import { useStructureStore } from '../../store/useStructureStore';
import { Building2, User, Landmark, ShieldCheck } from 'lucide-react';

interface DirectorItemRowProps {
  dir: Director;
  isTargeted: boolean;
  onToggle: (name: string) => void;
}

const DirectorItemRow: React.FC<DirectorItemRowProps> = ({ dir, isTargeted, onToggle }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(dir.name);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggle(dir.name);
        }
      }}
      className={`flex items-center justify-between text-xs px-2 py-0.5 rounded transition-colors cursor-pointer ${
        isTargeted
          ? 'bg-amber-200 text-amber-900 font-semibold'
          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70'
      }`}
      title="Click to spotlight this director across all entities"
    >
      <div className="flex items-center gap-1 truncate">
        {dir.isCorporate ? (
          <Landmark className="w-3 h-3 text-sky-600 flex-shrink-0" />
        ) : (
          <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
        )}
        <span className="truncate text-[10px]">{dir.name}</span>
      </div>

      {dir.isResident && (
        <span
          title="Resident Director"
          className="ml-1 text-[8px] px-1 bg-emerald-100 text-emerald-700 font-bold rounded"
        >
          RES
        </span>
      )}
    </div>
  );
};

interface ShapeNodeProps {
  id: string;
  entity: EntityNodeData;
  isSelected: boolean;
  containsHighlightedDirector: boolean;
  isDimmed: boolean;
  highlightedDirector: string | null;
  onSelect: () => void;
  onToggleDirector: (name: string) => void;
}

const TrustTriangleCard: React.FC<ShapeNodeProps> = ({
  entity,
  isSelected,
  containsHighlightedDirector,
  isDimmed,
  highlightedDirector,
  onSelect,
  onToggleDirector,
}) => {
  const colors = getEntityTypeColor(entity.type);
  const statusDot = getStatusDotClass(entity.status);

  return (
    <div
      data-testid="trust-triangle-card-node"
      onClick={onSelect}
      className={`relative w-[260px] h-[220px] transition-all duration-150 cursor-pointer flex flex-col items-center justify-between p-2 pt-3 text-center ${
        isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''
      } ${
        containsHighlightedDirector ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      <svg
        className="triangle-shape-bg absolute inset-0 w-full h-full pointer-events-none drop-shadow-md overflow-visible -z-10"
        viewBox="0 0 260 220"
        preserveAspectRatio="none"
      >
        <polygon
          points="130,4 256,216 4,216"
          fill="#ffffff"
          stroke={isSelected ? '#38bdf8' : containsHighlightedDirector ? '#f59e0b' : '#fbbf24'}
          strokeWidth={isSelected || containsHighlightedDirector ? '3' : '2'}
          strokeLinejoin="round"
        />
      </svg>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ top: 0, left: '50%' }}
      />

      <div className="flex flex-col items-center w-full max-w-[200px] mt-2">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span
            className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${colors.badgeBg} ${colors.badgeText}`}
          >
            {entity.type}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
            <span className="font-medium">{entity.status}</span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 text-xs leading-tight break-words line-clamp-2">
          {entity.name}
        </h3>

        <div className="mt-0.5 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <span className="font-medium text-slate-600 truncate max-w-[120px]">
            {entity.jurisdiction}
          </span>
          {entity.registrationNumber && (
            <span className="font-mono text-[9px] text-slate-400">
              {entity.registrationNumber}
            </span>
          )}
        </div>
      </div>

      <div className="w-[210px] bg-slate-50/90 rounded p-1.5 text-left border border-slate-200/60 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Building2 className="w-2.5 h-2.5" /> Directors ({entity.directors?.length ?? 0})
          </span>
        </div>

        <div className="space-y-0.5 max-h-[50px] overflow-y-auto">
          {(entity.directors?.length ?? 0) === 0 ? (
            <div className="text-[10px] italic text-slate-400 text-center">No directors recorded</div>
          ) : (
            entity.directors?.map((dir) => (
              <DirectorItemRow
                key={dir.id}
                dir={dir}
                isTargeted={highlightedDirector === dir.name}
                onToggle={onToggleDirector}
              />
            ))
          )}
        </div>

        {entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0 && (
          <div className="mt-1 pt-1 border-t border-slate-200/60 text-[9px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
            <span className="truncate font-medium">
              {entity.ubosOrBeneficiaries[0]}
              {entity.ubosOrBeneficiaries.length > 1 ? ` +${entity.ubosOrBeneficiaries.length - 1}` : ''}
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ bottom: 0, left: '50%' }}
      />
    </div>
  );
};

const SubsidiarySquareCard: React.FC<ShapeNodeProps> = ({
  entity,
  isSelected,
  containsHighlightedDirector,
  isDimmed,
  highlightedDirector,
  onSelect,
  onToggleDirector,
}) => {
  const colors = getEntityTypeColor(entity.type);
  const statusDot = getStatusDotClass(entity.status);

  return (
    <div
      data-testid="subsidiary-card-node"
      onClick={onSelect}
      className={`relative w-[220px] h-[220px] rounded-lg bg-white shadow-md border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden ${
        colors.border
      } ${isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''} ${
        containsHighlightedDirector ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />

      <div className={`h-1.5 w-full ${colors.accentBar}`} />

      <div className="p-2.5 pb-1 border-b border-slate-100">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full ${colors.badgeBg} ${colors.badgeText}`}
          >
            {entity.type}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
            <span className="font-medium">{entity.status}</span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-2 break-words">
          {entity.name}
        </h3>

        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-medium text-slate-600 truncate max-w-[110px]">
            {entity.jurisdiction}
          </span>
          {entity.registrationNumber && (
            <span className="font-mono text-[9px] text-slate-400">
              {entity.registrationNumber}
            </span>
          )}
        </div>
      </div>

      <div className="p-2 pt-1.5 bg-slate-50/70 flex-1 min-h-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" /> Directors ({entity.directors?.length ?? 0})
            </span>
          </div>

          <div className="space-y-1 max-h-[64px] overflow-y-auto">
            {(entity.directors?.length ?? 0) === 0 ? (
              <div className="text-[10px] italic text-slate-400">No directors recorded</div>
            ) : (
              entity.directors?.map((dir) => (
                <DirectorItemRow
                  key={dir.id}
                  dir={dir}
                  isTargeted={highlightedDirector === dir.name}
                  onToggle={onToggleDirector}
                />
              ))
            )}
          </div>
        </div>

        {entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0 && (
          <div className="mt-1 pt-1 border-t border-slate-200/60 text-[9px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
            <span className="truncate font-medium">
              {entity.ubosOrBeneficiaries[0]}
              {entity.ubosOrBeneficiaries.length > 1 ? ` +${entity.ubosOrBeneficiaries.length - 1}` : ''}
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />
    </div>
  );
};

export const EntityCardNode = memo(({ id, data, selected }: NodeProps) => {
  const entity = data as unknown as EntityNodeData;

  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const highlightedDirector = useStructureStore((state) => state.highlightedDirector);
  const setHighlightedDirector = useStructureStore((state) => state.setHighlightedDirector);

  const isSelected = selected || selectedEntityId === id;
  const containsHighlightedDirector = Boolean(
    highlightedDirector && entity.directors?.some((d) => d.name === highlightedDirector)
  );
  const isDimmed = Boolean(highlightedDirector && !containsHighlightedDirector);

  const handleToggleDirector = (dirName: string) => {
    setHighlightedDirector(highlightedDirector === dirName ? null : dirName);
  };

  const handleSelect = () => {
    setSelectedEntityId(id);
  };

  const isTriangular = entity.type === 'Trust' || entity.type === 'Trust Company';

  if (isTriangular) {
    return (
      <TrustTriangleCard
        id={id}
        entity={entity}
        isSelected={isSelected}
        containsHighlightedDirector={containsHighlightedDirector}
        isDimmed={isDimmed}
        highlightedDirector={highlightedDirector}
        onSelect={handleSelect}
        onToggleDirector={handleToggleDirector}
      />
    );
  }

  return (
    <SubsidiarySquareCard
      id={id}
      entity={entity}
      isSelected={isSelected}
      containsHighlightedDirector={containsHighlightedDirector}
      isDimmed={isDimmed}
      highlightedDirector={highlightedDirector}
      onSelect={handleSelect}
      onToggleDirector={handleToggleDirector}
    />
  );
});
