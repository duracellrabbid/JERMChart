export type EntityType = 
  | 'Trust' 
  | 'Holding Company' 
  | 'Operating Company' 
  | 'LLC' 
  | 'Foundation' 
  | 'Partnership' 
  | 'Individual';

export type EntityStatus = 'Active' | 'Dormant' | 'In Liquidation' | 'Nominee';

export type SiblingSortCriteria = 'alphabetical' | 'ownership' | 'jurisdiction' | 'manual';

export interface Director {
  id: string;
  name: string;
  isCorporate: boolean;
  appointmentDate?: string;
  isResident?: boolean;
}

export interface EntityNodeData {
  id: string;
  name: string;
  type: EntityType;
  jurisdiction: string;
  registrationNumber?: string;
  taxId?: string;
  status: EntityStatus;
  directors: Director[];
  ubosOrBeneficiaries?: string[];
  notes?: string;
}

export interface OwnershipEdgeData {
  id: string;
  source: string;
  target: string;
  ownershipPercentage?: number;
  shareClass?: string;
  isCrossLink?: boolean;
}

export interface ChartMetadata {
  chartTitle: string;
  clientReference?: string;
  effectiveDate: string;
  confidentialityNotice: string;
}

export interface TrustStructureChart {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
}
