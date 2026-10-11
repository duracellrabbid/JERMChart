import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AssociatedParty, EntityNodeData } from '../../types/structure';
import { getEntityTypeColor, getStatusDotClass, getRoleBadgeStyle } from '../../utils/entityStyle';
import { calculateTrustDimensions, SUBSIDIARY_CARD_SIZE, SUBSIDIARY_CARD_HEIGHT } from '../../utils/layoutEngine';
import { useStructureStore } from '../../store/useStructureStore';
import { User, Landmark, ShieldCheck } from 'lucide-react';

export interface SatelliteNodeData extends Record<string, unknown> {
  id: string;
  parentEntityId: string;
  role: string;
  parties: AssociatedParty[];
  side: 'left' | 'right';
  computedWidth?: number;
  computedHeight?: number;
}

interface ShapeNodeProps {
  id: string;
  entity: EntityNodeData;
  computedWidth?: number;
  computedHeight?: number;
  isSelected: boolean;
  containsHighlightedParty: boolean;
  isDimmed: boolean;
  onSelect: () => void;
}

const TrustTriangleCard: React.FC<ShapeNodeProps> = ({
  entity,
  computedWidth,
  computedHeight,
  isSelected,
  containsHighlightedParty,
  isDimmed,
  onSelect,
}) => {
  const statusDot = getStatusDotClass(entity.status);
  const dims = (computedWidth && computedHeight)
    ? { width: computedWidth, height: computedHeight }
    : calculateTrustDimensions(entity);

  const { width, height } = dims;
  const strokePadding = 6;
  const points = `${width / 2},${strokePadding} ${width - strokePadding},${height - strokePadding} ${strokePadding},${height - strokePadding}`;

  return (
    <div
      data-testid="trust-triangle-card-node"
      onClick={onSelect}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`relative transition-all duration-150 cursor-pointer flex flex-col items-center justify-between text-center select-none ${
        isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''
      } ${
        containsHighlightedParty ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      <svg
        className="triangle-shape-bg absolute inset-0 w-full h-full pointer-events-none drop-shadow-md overflow-visible -z-10"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <polygon
          points={points}
          fill="#ffffff"
          stroke={isSelected ? '#38bdf8' : '#f59e0b'}
          strokeWidth={isSelected || containsHighlightedParty ? '3' : '2'}
          strokeLinejoin="round"
        />
        <polygon
          points={`${width / 2},6 ${width / 2 + 18},34 ${width / 2 - 18},34`}
          fill="#fef3c7"
          opacity="0.75"
        />
      </svg>

      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ top: 0, left: '50%' }}
      />
      {/* Exact boundary handles positioned on triangle sloped borders at y = 50% (height / 2) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="!w-2.5 !h-2.5 !bg-slate-700 !border-2 !border-white"
        style={{
          top: '50%',
          left: `${Math.round(width / 2 - ((height / 2 - strokePadding) / (height - 2 * strokePadding)) * (width / 2 - strokePadding))}px`,
        }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        className="!w-2.5 !h-2.5 !bg-slate-700 !border-2 !border-white"
        style={{
          top: '50%',
          left: `${Math.round(width / 2 + ((height / 2 - strokePadding) / (height - 2 * strokePadding)) * (width / 2 - strokePadding))}px`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-between pt-7 pb-4 px-4 text-center">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs mb-1">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <div className="px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-200 text-amber-900 flex items-center justify-center">
            <span className="text-[8px] font-bold tracking-wider uppercase">
              {entity.type}
            </span>
          </div>
        </div>

        <div style={{ maxWidth: `${Math.min(190, Math.floor(width * 0.58))}px` }} className="my-auto px-1 flex flex-col items-center">
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50/80 border border-amber-200/60 text-slate-700 text-[8px] mb-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} />
            <span className="font-medium">{entity.status}</span>
          </div>

          <h3
            className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug break-words line-clamp-3"
            title={entity.name}
          >
            {entity.name}
          </h3>

          <div className="mt-1 text-[10px] text-slate-600 font-medium truncate mx-auto">
            {entity.jurisdiction}
          </div>
          {entity.registrationNumber && (
            <div className="font-mono text-[8px] text-slate-400 mt-0.5">
              {entity.registrationNumber}
            </div>
          )}
        </div>

        {entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0 && (
          <div className="mt-1 pt-1 border-t border-amber-200/40 text-[9px] text-slate-600 flex items-center justify-center gap-1 max-w-[200px] truncate">
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
        id="bottom-out"
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ bottom: 0, left: '50%' }}
      />
    </div>
  );
};

const SubsidiarySquareCard: React.FC<ShapeNodeProps> = ({
  entity,
  computedHeight,
  isSelected,
  containsHighlightedParty,
  isDimmed,
  onSelect,
}) => {
  const colors = getEntityTypeColor(entity.type);
  const statusDot = getStatusDotClass(entity.status);
  const height = computedHeight ?? SUBSIDIARY_CARD_HEIGHT;

  return (
    <div
      data-testid="subsidiary-card-node"
      onClick={onSelect}
      style={{ width: `${SUBSIDIARY_CARD_SIZE}px`, height: `${height}px` }}
      className={`relative w-[220px] rounded-lg bg-white shadow-md border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between overflow-hidden ${
        colors.border
      } ${isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''} ${
        containsHighlightedParty ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="!w-2.5 !h-2.5 !bg-slate-700 !border-2 !border-white"
        style={{ top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        className="!w-2.5 !h-2.5 !bg-slate-700 !border-2 !border-white"
        style={{ top: '50%' }}
      />

      <div className={`h-1.5 w-full ${colors.accentBar}`} />

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
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

          <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-3 break-words">
            {entity.name}
          </h3>

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-medium text-slate-600 truncate max-w-[120px]">
              {entity.jurisdiction}
            </span>
            {entity.registrationNumber && (
              <span className="font-mono text-[9px] text-slate-400 truncate max-w-[80px]">
                {entity.registrationNumber}
              </span>
            )}
          </div>
        </div>

        {entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0 && (
          <div className="mt-2 pt-1 border-t border-slate-100 text-[9px] text-slate-500 flex items-center gap-1">
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
        id="bottom-out"
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />
    </div>
  );
};

export const BankCircleCard: React.FC<ShapeNodeProps> = ({
  entity,
  isSelected,
  containsHighlightedParty,
  isDimmed,
  onSelect,
}) => {
  const statusDot = getStatusDotClass(entity.status);

  return (
    <div
      data-testid="bank-circle-card-node"
      onClick={onSelect}
      style={{ width: '180px', height: '180px' }}
      className={`relative w-[180px] h-[180px] rounded-full bg-white shadow-md border-2 border-cyan-500 transition-all duration-150 cursor-pointer flex flex-col items-center justify-center p-3 text-center select-none ${
        isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 shadow-lg' : ''
      } ${
        containsHighlightedParty ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top-in"
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ top: 0, left: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="!w-2.5 !h-2.5 !bg-slate-700 !border-2 !border-white"
        style={{ top: '50%', left: 0 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-in"
        className="!w-2.5 !h-2.5 !bg-slate-700 !border-2 !border-white"
        style={{ top: '50%', right: 0 }}
      />

      <div className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 mb-1">
        <Landmark className="w-4 h-4" />
      </div>

      <div className="px-1.5 py-0.5 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-900 text-[8px] font-bold uppercase tracking-wider mb-1">
        Bank
      </div>

      <h3 className="font-bold text-slate-900 text-xs leading-tight line-clamp-2 px-1 max-w-[150px] break-words" title={entity.name}>
        {entity.name}
      </h3>

      <div className="mt-1 text-[9px] text-slate-500 font-medium truncate max-w-[130px]">
        {entity.jurisdiction}
      </div>

      <div className="mt-1 flex items-center gap-1 text-[8px] text-slate-500">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} />
        <span>{entity.status}</span>
        {entity.registrationNumber && (
          <span className="font-mono text-slate-400">· {entity.registrationNumber}</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-out"
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
        style={{ bottom: 0, left: '50%' }}
      />
    </div>
  );
};

export interface SatelliteRoleCardProps {
  id?: string;
  data: SatelliteNodeData | Record<string, unknown>;
  selected?: boolean;
}

export const SatelliteRoleCard = memo(({ data, selected }: SatelliteRoleCardProps) => {
  const satData = data as unknown as SatelliteNodeData;
  const highlightedParty = useStructureStore((state) => state.highlightedParty);
  const setHighlightedParty = useStructureStore((state) => state.setHighlightedParty);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);

  const roleStyle = getRoleBadgeStyle(satData.role);
  const parties = satData.parties || [];
  const isLeft = satData.side === 'left';

  const containsHighlighted = parties.some((p) => p.name === highlightedParty);
  const isDimmed = Boolean(highlightedParty && !containsHighlighted);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (satData.parentEntityId) {
      setSelectedEntityId(satData.parentEntityId);
    }
  };

  const handleToggle = (partyName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHighlightedParty(highlightedParty === partyName ? null : partyName);
  };

  return (
    <div
      data-testid="satellite-role-card"
      onClick={handleClick}
      className={`relative rounded-md bg-white border shadow-sm p-2 text-left cursor-pointer transition-all duration-150 min-w-[140px] max-w-[180px] ${
        roleStyle.border
      } ${selected ? 'ring-2 ring-sky-400 shadow-md' : ''} ${
        containsHighlighted ? 'ring-2 ring-amber-500 shadow-md scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      {isLeft ? (
        <Handle
          type="source"
          position={Position.Right}
          id="right-out"
          className="!w-2 !h-2 !bg-slate-700 !border !border-white"
          style={{ top: '50%' }}
        />
      ) : (
        <Handle
          type="source"
          position={Position.Left}
          id="left-out"
          className="!w-2 !h-2 !bg-slate-700 !border !border-white"
          style={{ top: '50%' }}
        />
      )}

      <div className="flex items-center justify-between gap-1 mb-1 border-b border-slate-100 pb-1">
        <span
          className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${roleStyle.bg} ${roleStyle.text}`}
        >
          {satData.role}
        </span>
        <span className="text-[8px] text-slate-400 font-medium">
          {parties.length}
        </span>
      </div>

      <div className="space-y-1">
        {parties.map((p) => {
          const isTargeted = highlightedParty === p.name;
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={(e) => handleToggle(p.name, e)}
              className={`flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded transition cursor-pointer ${
                isTargeted
                  ? 'bg-amber-100 text-amber-900 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 truncate">
                {p.isCorporate ? (
                  <Landmark className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />
                ) : (
                  <User className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                )}
                <span className="truncate">{p.name}</span>
              </div>
              {p.isResident && (
                <span className="ml-1 text-[7px] px-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">
                  RES
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const EntityCardNode = memo(({ id, data, selected }: NodeProps) => {
  const entityData = data as unknown as EntityNodeData & {
    computedWidth?: number;
    computedHeight?: number;
    isSatelliteRoleNode?: boolean;
    satelliteData?: SatelliteNodeData;
  };

  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const highlightedParty = useStructureStore((state) => state.highlightedParty);

  if (entityData.isSatelliteRoleNode && entityData.satelliteData) {
    return <SatelliteRoleCard id={id} data={entityData.satelliteData} selected={selected} />;
  }

  const isSelected = selected || selectedEntityId === id;
  const containsHighlightedParty = Boolean(
    highlightedParty && entityData.associatedParties?.some((p) => p.name === highlightedParty)
  );
  const isDimmed = Boolean(highlightedParty && !containsHighlightedParty);

  const handleSelect = () => {
    setSelectedEntityId(id);
  };

  const commonProps: ShapeNodeProps = {
    id,
    entity: entityData,
    computedWidth: entityData.computedWidth,
    computedHeight: entityData.computedHeight,
    isSelected,
    containsHighlightedParty,
    isDimmed,
    onSelect: handleSelect,
  };

  if (entityData.type === 'Bank') {
    return <BankCircleCard {...commonProps} />;
  }

  if (entityData.type === 'Trust' || entityData.type === 'Trust Company') {
    return <TrustTriangleCard {...commonProps} />;
  }

  return <SubsidiarySquareCard {...commonProps} />;
});
