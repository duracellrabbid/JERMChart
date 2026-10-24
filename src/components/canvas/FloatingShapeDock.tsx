import React from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { EntityType } from '../../types/structure';
import { Landmark, Building2, Building, CircleDot, User } from 'lucide-react';

export type ShapeDragPayload =
  | { kind: 'entity'; type: EntityType }
  | { kind: 'person'; role: string };

export interface FloatingShapeDockProps {
  onAddShape?: (payload: ShapeDragPayload) => void;
}

interface ShapeItemConfig {
  id: string;
  label: string;
  payload: ShapeDragPayload;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const SHAPE_ITEMS: ShapeItemConfig[] = [
  {
    id: 'trust',
    label: 'Trust',
    payload: { kind: 'entity', type: 'Trust' },
    icon: Landmark,
    colorClass: 'text-amber-700 hover:bg-amber-50 border-amber-200',
  },
  {
    id: 'holdco',
    label: 'HoldCo',
    payload: { kind: 'entity', type: 'Holding Company' },
    icon: Building2,
    colorClass: 'text-sky-700 hover:bg-sky-50 border-sky-200',
  },
  {
    id: 'opco',
    label: 'OpCo',
    payload: { kind: 'entity', type: 'Operating Company' },
    icon: Building,
    colorClass: 'text-emerald-700 hover:bg-emerald-50 border-emerald-200',
  },
  {
    id: 'bank',
    label: 'Bank',
    payload: { kind: 'entity', type: 'Bank' },
    icon: CircleDot,
    colorClass: 'text-cyan-700 hover:bg-cyan-50 border-cyan-200',
  },
  {
    id: 'person',
    label: 'Person',
    payload: { kind: 'person', role: 'Director' },
    icon: User,
    colorClass: 'text-purple-700 hover:bg-purple-50 border-purple-200',
  },
];

export const FloatingShapeDock: React.FC<FloatingShapeDockProps> = ({ onAddShape }) => {
  const isReadOnly = useStructureStore((state) => state.isReadOnly);
  const isExportMode = useStructureStore((state) => state.isExportMode);

  if (isReadOnly || isExportMode) {
    return null;
  }

  const handleDragStart = (e: React.DragEvent, payload: ShapeDragPayload) => {
    e.dataTransfer.setData('application/jermchart-shape', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (payload: ShapeDragPayload) => {
    if (onAddShape) {
      onAddShape(payload);
    }
  };

  return (
    <div
      data-testid="floating-shape-dock"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-full shadow-lg py-1 px-2.5 flex items-center gap-1.5 select-none transition-all"
    >
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
        Palette
      </span>
      <div className="h-4 w-px bg-slate-200" />
      {SHAPE_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, item.payload)}
            onClick={() => handleClick(item.payload)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition cursor-grab active:cursor-grabbing ${item.colorClass}`}
            title={`Drag onto canvas or click to add ${item.label}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
