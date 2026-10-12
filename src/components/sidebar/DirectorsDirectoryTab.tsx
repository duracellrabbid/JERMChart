import React, { useMemo } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { User, Landmark } from 'lucide-react';
import { getRoleBadgeStyle } from '../../utils/entityStyle';

export const DirectorsDirectoryTab: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const highlightedParty = useStructureStore((state) => state.highlightedParty);
  const setHighlightedParty = useStructureStore((state) => state.setHighlightedParty);

  const partiesSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        isCorporate: boolean;
        roles: string[];
        entities: { id: string; name: string; role: string }[];
      }
    >();

    entities.forEach((entity) => {
      (entity.associatedParties || []).forEach((party) => {
        const existing = map.get(party.name) || {
          name: party.name,
          isCorporate: Boolean(party.isCorporate),
          roles: [],
          entities: [],
        };
        const role = party.role || 'Director';
        if (!existing.roles.includes(role)) {
          existing.roles.push(role);
        }
        existing.entities.push({ id: entity.id, name: entity.name, role });
        map.set(party.name, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entities]);

  return (
    <div className="space-y-3 text-xs">
      <div className="text-slate-500 text-[11px]">
        Click any associated party below to highlight and track all their roles and entities across the chart.
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {partiesSummary.length === 0 ? (
          <div className="text-center text-slate-400 py-4 italic">No associated parties recorded.</div>
        ) : (
          partiesSummary.map((item) => {
            const isHighlighted = highlightedParty === item.name;
            const primaryRole = item.roles[0];
            const badgeStyle = getRoleBadgeStyle(primaryRole);

            return (
              <div
                key={item.name}
                onClick={() => setHighlightedParty(isHighlighted ? null : item.name)}
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${badgeStyle.bg} ${badgeStyle.text}`}>
                      {item.roles.join(', ')}
                    </span>
                    <span className="font-tabular text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold" title={`${item.entities.length} entities`}>
                      {item.entities.length}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[11px] text-slate-500 truncate leading-snug">
                  Entities: {item.entities.map((e) => `${e.name} (${e.role})`).join('; ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
