import React, { useMemo } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { User, Landmark } from 'lucide-react';

export const DirectorsDirectoryTab: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const highlightedDirector = useStructureStore((state) => state.highlightedDirector);
  const setHighlightedDirector = useStructureStore((state) => state.setHighlightedDirector);

  const directorsSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        isCorporate: boolean;
        entities: { id: string; name: string }[];
      }
    >();

    entities.forEach((entity) => {
      entity.directors.forEach((dir) => {
        const existing = map.get(dir.name) || {
          name: dir.name,
          isCorporate: dir.isCorporate,
          entities: [],
        };
        existing.entities.push({ id: entity.id, name: entity.name });
        map.set(dir.name, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entities]);

  return (
    <div className="space-y-3 text-xs">
      <div className="text-slate-500 text-[11px]">
        Click any director below to highlight and track all their directorships across the chart.
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {directorsSummary.length === 0 ? (
          <div className="text-center text-slate-400 py-4 italic">No directors recorded.</div>
        ) : (
          directorsSummary.map((item) => {
            const isHighlighted = highlightedDirector === item.name;
            return (
              <div
                key={item.name}
                onClick={() => setHighlightedDirector(isHighlighted ? null : item.name)}
                className={`p-2 rounded-lg border cursor-pointer transition ${
                  isHighlighted
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    {item.isCorporate ? (
                      <Landmark className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
                    {item.entities.length}
                  </span>
                </div>

                <div className="mt-1 text-[10px] text-slate-500 truncate">
                  Boards: {item.entities.map((e) => e.name).join(', ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
