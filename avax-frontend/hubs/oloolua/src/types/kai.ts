// Data Models according to Kai Conservation Information Hub PRD (MVP v1)

export type UserRole = 'cfa_admin' | 'nursery_manager' | 'nursery_member' | 'verifier' | 'kai_admin';

export type ActivityType = 
  | 'PROPAGATION' 
  | 'SEED_COLLECTION' 
  | 'SOWING' 
  | 'GERMINATION'
  | 'PRICKING_OUT'
  | 'POTTING'
  | 'WATERING'
  | 'WEEDING'
  | 'PEST_MANAGEMENT'
  | 'FERTILIZATION'
  | 'HARDENING'
  | 'SEEDLING_MOVEMENT'
  | 'SALE' 
  | 'DONATION' 
  | 'TRANSFER' 
  | 'PLANTING' 
  | 'MORTALITY'
  | 'OTHER';

export type TransactionType = 
  | 'OPENING_STOCK'
  | 'PROPAGATION'
  | 'PURCHASE_ACQUISITION'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'SALE'
  | 'DONATION'
  | 'PLANTING'
  | 'MORTALITY'
  | 'ADJUSTMENT'
  | 'RETURN';

export type VerificationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'VERIFIED' 
  | 'NEEDS_CORRECTION' 
  | 'REJECTED' 
  | 'DISPUTED';

export interface CFA {
  id: string;
  name: string;
  registrationNumber: string;
  country: string;
  county: string;
  subCounty: string;
  ward: string;
  community: string;
  description: string;
  mission: string;
  contactEmail: string;
  contactPhone: string;
  gpsBoundary?: string;
  logoUrl?: string;
  establishmentDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'CFA_ONLY' | 'PARTNER' | 'PRIVATE';
}

export interface Nursery {
  id: string;
  cfaId: string;
  name: string;
  county: string;
  subCounty: string;
  ward: string;
  community: string;
  physicalLocation: string;
  gpsCoordinates?: { lat: number; lng: number };
  managerName: string;
  managerContact: string;
  establishmentDate: string;
  nurseryType: 'COMMUNITY' | 'PRIVATE' | 'INSTITUTIONAL' | 'GOVERNMENT';
  waterSource: string;
  approximateCapacity: number;
  seedbedCount: number;
  operatingStatus: 'PLANNED' | 'ACTIVE' | 'TEMPORARILY_INACTIVE' | 'CLOSED' | 'ARCHIVED';
  notes?: string;
  photoUrl?: string;
}

export interface Seedbed {
  id: string;
  nurseryId: string;
  nameNumber: string;
  establishmentDate: string;
  capacity: number;
  propagationMethod: string;
  status: 'PLANNED' | 'ACTIVE' | 'FULL' | 'MAINTENANCE' | 'INACTIVE';
  assignedManager?: string;
  notes?: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  localName: string;
  category: 'INDIGENOUS' | 'EXOTIC' | 'FRUIT' | 'TIMBER' | 'AGROFORESTRY' | 'RESTORATION';
  growthNotes?: string;
  imageUrl?: string;
  activeStatus: boolean;
}

export interface SeedBatch {
  id: string;
  nurseryId: string;
  speciesId: string;
  seedSource: string;
  collectionLocation: string;
  collectionDate: string;
  acquiredDate: string;
  quantityAcquired: number;
  treatmentMethod?: string;
  storageLocation?: string;
  responsibleUser: string;
  status: 'RECEIVED' | 'IN_STORAGE' | 'SOWN' | 'IN_PRODUCTION' | 'DISTRIBUTED' | 'EXHAUSTED' | 'DISCARDED';
}

export interface InventoryTransaction {
  id: string;
  transactionType: TransactionType;
  nurseryId: string;
  seedbedId: string;
  speciesId: string;
  seedBatchId?: string;
  quantity: number; // Positive integer
  direction: 'IN' | 'OUT' | 'ADJUSTMENT';
  date: string; // ISO date
  source: string;
  destination?: string;
  relatedActivityId?: string;
  recordedBy: string;
  notes?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface ConservationActivity {
  id: string;
  eventType: ActivityType;
  cfaId: string;
  nurseryId: string;
  seedbedId: string;
  seedBatchId?: string;
  speciesId: string;
  quantity: number;
  date: string;
  recordedBy: string;
  notes?: string;
  gpsLocation?: { lat: number; lng: number };
  photoUrls?: string[];
  programId?: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlantingEvent {
  id: string;
  cfaId: string;
  nurseryId: string;
  speciesId: string;
  quantityPlanted: number;
  plantingSite: string;
  gpsCoordinates?: { lat: number; lng: number };
  responsibleGroup: string;
  landownerAuthority?: string;
  weatherNotes?: string;
  lastMonitoringDate?: string;
  verificationStatus: VerificationStatus;
  date: string;
}

export interface SurvivalObservation {
  id: string;
  plantingEventId: string;
  date: string;
  observer: string;
  numberAssessed: number;
  numberSurviving: number;
  numberDead: number;
  numberMissing: number;
  causeOfLoss?: string;
  survivalRatePercent: number; // (numberSurviving / numberAssessed) * 100
  photoUrls?: string[];
  notes?: string;
}

export interface NurseryMetrics {
  currentStock: number;
  speciesCount: number;
  activeSeedbeds: number;
  propagatedTotal: number;
  plantedTotal: number;
  soldTotal: number;
  donatedTotal: number;
  mortalityTotal: number;
  survivalRatePercent: number;
}
