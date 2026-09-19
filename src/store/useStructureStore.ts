import { create } from 'zustand';
import {
  ChartMetadata,
  Director,
  EntityNodeData,
  OwnershipEdgeData,
  SiblingSortCriteria,
  TrustStructureChart,
} from '../types/structure';
import { sampleTrustStructure } from '../data/sampleStructure';

export interface StructureState {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
  selectedEntityId: string | null;
  highlightedDirector: string | null;
  sortCriteria: SiblingSortCriteria;

  // Actions
  setMetadata: (meta: Partial<ChartMetadata>) => void;
  setSelectedEntityId: (id: string | null) => void;
  setHighlightedDirector: (directorName: string | null) => void;
  setSortCriteria: (criteria: SiblingSortCriteria) => void;

  // Entity mutations
  addEntity: (entity: Omit<EntityNodeData, 'id'>, parentId?: string, ownershipPct?: number) => EntityNodeData;
  updateEntity: (id: string, updates: Partial<EntityNodeData>) => void;
  deleteEntity: (id: string) => void;

  // Director mutations
  addDirector: (entityId: string, director: Omit<Director, 'id'>) => void;
  removeDirector: (entityId: string, directorId: string) => void;

  // Relationship mutations
  addRelationship: (rel: Omit<OwnershipEdgeData, 'id'>) => void;
  updateRelationship: (id: string, updates: Partial<OwnershipEdgeData>) => void;
  deleteRelationship: (id: string) => void;

  // Full state import/export
  loadStructure: (chart: TrustStructureChart) => void;
  resetToSample: () => void;
}

export const useStructureStore = create<StructureState>((set) => ({
  metadata: { ...sampleTrustStructure.metadata },
  entities: [...sampleTrustStructure.entities],
  relationships: [...sampleTrustStructure.relationships],
  selectedEntityId: null,
  highlightedDirector: null,
  sortCriteria: 'alphabetical',

  setMetadata: (meta) =>
    set((state) => ({ metadata: { ...state.metadata, ...meta } })),

  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setHighlightedDirector: (directorName) => set({ highlightedDirector: directorName }),
  setSortCriteria: (criteria) => set({ sortCriteria: criteria }),

  addEntity: (entityData, parentId, ownershipPct = 100) => {
    const newId = `entity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEntity: EntityNodeData = {
      ...entityData,
      id: newId,
      directors: entityData.directors || [],
      ubosOrBeneficiaries: entityData.ubosOrBeneficiaries || [],
    };

    set((state) => {
      const nextEntities = [...state.entities, newEntity];
      let nextRels = state.relationships;
      if (parentId) {
        nextRels = [
          ...nextRels,
          {
            id: `rel-${parentId}-${newId}`,
            source: parentId,
            target: newId,
            ownershipPercentage: ownershipPct,
            shareClass: 'Ordinary Shares',
          },
        ];
      }
      return { entities: nextEntities, relationships: nextRels, selectedEntityId: newId };
    });

    return newEntity;
  },

  updateEntity: (id, updates) =>
    set((state) => ({
      entities: state.entities.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEntity: (id) =>
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relationships: state.relationships.filter((r) => r.source !== id && r.target !== id),
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    })),

  addDirector: (entityId, director) =>
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        const newDir: Director = {
          ...director,
          id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        };
        return { ...e, directors: [...e.directors, newDir] };
      }),
    })),

  removeDirector: (entityId, directorId) =>
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        return { ...e, directors: e.directors.filter((d) => d.id !== directorId) };
      }),
    })),

  addRelationship: (rel) =>
    set((state) => {
      // Avoid duplicate edges between same pair
      const exists = state.relationships.some((r) => r.source === rel.source && r.target === rel.target);
      if (exists) return state;
      const newRel: OwnershipEdgeData = {
        ...rel,
        id: `rel-${rel.source}-${rel.target}-${Date.now()}`,
      };
      return { relationships: [...state.relationships, newRel] };
    }),

  updateRelationship: (id, updates) =>
    set((state) => ({
      relationships: state.relationships.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  deleteRelationship: (id) =>
    set((state) => ({
      relationships: state.relationships.filter((r) => r.id !== id),
    })),

  loadStructure: (chart) =>
    set({
      metadata: { ...chart.metadata },
      entities: [...chart.entities],
      relationships: [...chart.relationships],
      selectedEntityId: null,
      highlightedDirector: null,
    }),

  resetToSample: () =>
    set({
      metadata: { ...sampleTrustStructure.metadata },
      entities: [...sampleTrustStructure.entities],
      relationships: [...sampleTrustStructure.relationships],
      selectedEntityId: null,
      highlightedDirector: null,
    }),
}));
