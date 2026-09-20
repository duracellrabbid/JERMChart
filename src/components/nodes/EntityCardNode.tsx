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
  const statusDot = getStatusDotClass(entity.status);

  return (
    <div
      data-testid="trust-triangle-card-node"
      onClick={onSelect}
      className={`relative w-[340px] h-[280px] transition-all duration-150 cursor-pointer flex flex-col items-center justify-between text-center select-none ${
        isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''
      } ${
        containsHighlightedDirector ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      <svg
        className="triangle-shape-bg absolute inset-0 w-full h-full pointer-events-none drop-shadow-md overflow-visible -z-10"
        viewBox="0 0 340 280"
        preserveAspectRatio="none"
      >
        <polygon
          points="170,6 332,274 8,274"
          fill="#ffffff"
          stroke={isSelected ? '#38bdf8' : containsHighlightedDirector ? '#f59e0b' : '#f59e0b'}
          strokeWidth={isSelected || containsHighlightedDirector ? '3' : '2'}
          strokeLinejoin="round"
        />
        <polygon points="170,6 188,34 152,34" fill="#fef3c7" opacity="0.75" />
      </svg>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ top: 0, left: '50%' }}
      />

      {/* Internal Content formatted with positive clearance from diagonal borders */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pt-6 pb-3 px-4 text-center">
        {/* Top: Icon & Type Badge */}
        <div className="flex flex-col items-center mt-1">
          <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-1 shadow-xs">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/90 border border-amber-200 text-amber-900 max-w-[105px]">
            <span className="text-[8px] font-bold tracking-wider uppercase">
              {entity.type}
            </span>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} />
            <span className="text-[9px] font-medium text-slate-600">{entity.status}</span>
          </div>
        </div>

        {/* Middle: Full Name & Jurisdiction */}
        <div className="max-w-[155px] my-auto">
          <h3
            className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug break-words line-clamp-3"
            title={entity.name}
          >
            {entity.name}
          </h3>

          <div className="mt-1 text-[10px] text-slate-600 font-medium truncate max-w-[145px] mx-auto">
            {entity.jurisdiction}
          </div>
          {entity.registrationNumber && (
            <div className="font-mono text-[8px] text-slate-400 mt-0.5">
              {entity.registrationNumber}
            </div>
          )}
        </div>

        {/* Bottom Base: Directors & Beneficiaries in Wide Area */}
        <div className="w-[230px] max-w-[240px] flex flex-col items-center pt-1.5 border-t border-amber-200/70 mb-1">
          <div className="flex items-center justify-between w-full mb-1 px-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" /> Directors ({entity.directors?.length ?? 0})
            </span>
          </div>

          <div className="w-full space-y-0.5 max-h-[56px] overflow-y-auto px-0.5">
            {(entity.directors?.length ?? 0) === 0 ? (
              <div className="text-[9px] italic text-slate-400 text-center py-0.5">
                No directors recorded
              </div>
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
            <div className="mt-1 pt-0.5 border-t border-amber-200/40 text-[9px] text-slate-600 flex items-center justify-center gap-1 max-w-[210px] truncate">
              <ShieldCheck className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
              <span className="truncate font-medium">
                {entity.ubosOrBeneficiaries[0]}
                {entity.ubosOrBeneficiaries.length > 1 ? ` +${entity.ubosOrBeneficiaries.length - 1}` : ''}
              </span>
            </div>
          )}
        </div>
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
