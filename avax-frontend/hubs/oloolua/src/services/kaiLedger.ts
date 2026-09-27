import { 
  CFA, 
  Nursery, 
  Seedbed, 
  Species, 
  SeedBatch, 
  InventoryTransaction, 
  ConservationActivity, 
  PlantingEvent, 
  SurvivalObservation, 
  NurseryMetrics 
} from '../types/kai';

// Default initial data for Oloolua Youth Guardians CFA
export const INITIAL_CFA: CFA = {
  id: 'CFA-OLO-001',
  name: 'Oloolua Youth Guardians CFA',
  registrationNumber: 'CFA/KJD/2021/089',
  country: 'Kenya',
  county: 'Kajiado',
  subCounty: 'Kajiado North',
  ward: 'Oloolua',
  community: 'Oloolua Forest Neighborhood Community',
  description: 'Community Forest Association Youth Group committed to indigenous tree propagation, restoration of Oloolua Forest reserve, agroforestry, and youth conservation education.',
  mission: 'To preserve and restore the biological diversity of Oloolua Forest while empowering local youth through sustainable conservation enterprises.',
  contactEmail: 'info@olooluayouthguardians.org',
  contactPhone: '+254 712 345 678',
  establishmentDate: '2021-03-15',
  status: 'ACTIVE',
  visibility: 'PUBLIC'
};

export const INITIAL_NURSERIES: Nursery[] = [
  {
    id: 'NUR-OLO-01',
    cfaId: 'CFA-OLO-001',
    name: 'Oloolua Main Youth Nursery',
    county: 'Kajiado',
    subCounty: 'Kajiado North',
    ward: 'Oloolua',
    community: 'Oloolua Forest Station',
    physicalLocation: 'Near Oloolua Forest Gate, Karen/Ngong Border',
    gpsCoordinates: { lat: -1.3582, lng: 36.7091 },
    managerName: 'Austin Namuye & Youth Committee',
    managerContact: '+254 722 987 654',
    establishmentDate: '2021-05-10',
    nurseryType: 'COMMUNITY',
    waterSource: 'Oloolua Stream & Rainwater Harvesting',
    approximateCapacity: 25000,
    seedbedCount: 8,
    operatingStatus: 'ACTIVE',
    notes: 'Primary propagation site for indigenous restoration trees and agroforestry species.',
    photoUrl: '/assets/images/seedling1.jpeg'
  }
];

export const INITIAL_SEEDBEDS: Seedbed[] = [
  { id: 'SB-01', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 1 - Croton Bed', establishmentDate: '2024-01-10', capacity: 3000, propagationMethod: 'Potting Seeds', status: 'ACTIVE', assignedManager: 'Kevin M.' },
  { id: 'SB-02', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 2 - Markhamia Bed', establishmentDate: '2024-01-15', capacity: 3000, propagationMethod: 'Bare Root / Potting', status: 'ACTIVE', assignedManager: 'Jane N.' },
  { id: 'SB-03', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 3 - Prunus Africana', establishmentDate: '2024-02-01', capacity: 2500, propagationMethod: 'Seed Germination', status: 'ACTIVE', assignedManager: 'Peter K.' },
  { id: 'SB-04', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 4 - Acacia & Podocarpus', establishmentDate: '2024-02-10', capacity: 2000, propagationMethod: 'Direct Sowing', status: 'ACTIVE', assignedManager: 'Mercy A.' },
  { id: 'SB-05', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 5 - Indigenous Wild Fruits', establishmentDate: '2024-03-05', capacity: 2000, propagationMethod: 'Cuttings & Seeds', status: 'FULL', assignedManager: 'Samuel O.' },
  { id: 'SB-06', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 6 - Agroforestry & Fruits', establishmentDate: '2024-03-20', capacity: 4000, propagationMethod: 'Potting Grafted', status: 'ACTIVE', assignedManager: 'Grace W.' },
  { id: 'SB-07', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 7 - Hardening Bed A', establishmentDate: '2024-04-01', capacity: 5000, propagationMethod: 'Hardening Under Shade', status: 'ACTIVE', assignedManager: 'Austin N.' },
  { id: 'SB-08', nurseryId: 'NUR-OLO-01', nameNumber: 'Bed 8 - Hardening Bed B', establishmentDate: '2024-04-15', capacity: 3500, propagationMethod: 'Sun Exposure Prep', status: 'ACTIVE', assignedManager: 'David K.' }
];

export const INITIAL_SPECIES: Species[] = [
  { id: 'SP-01', commonName: 'Broad-leaved Croton', scientificName: 'Croton megalocarpus', localName: 'Mukinduri / Mukunya', category: 'INDIGENOUS', growthNotes: 'Fast-growing indigenous canopy tree, great for fuel and canopy restoration.', activeStatus: true },
  { id: 'SP-02', commonName: 'Markhamia / Nile Tulip', scientificName: 'Markhamia lutea', localName: 'Muu / Siala', category: 'INDIGENOUS', growthNotes: 'High value timber and ornamental indigenous tree.', activeStatus: true },
  { id: 'SP-03', commonName: 'African Cherry', scientificName: 'Prunus africana', localName: 'Muiri / Tendu', category: 'RESTORATION', growthNotes: 'Medicinal bark, threatened indigenous highland species.', activeStatus: true },
  { id: 'SP-04', commonName: 'East African Yellowwood', scientificName: 'Podocarpus falcatus', localName: 'Musengera', category: 'INDIGENOUS', growthNotes: 'Slow-growing premium hardwood indigenous forest tree.', activeStatus: true },
  { id: 'SP-05', commonName: 'Whistling Thorn Acacia', scientificName: 'Vachellia drepanolobium', localName: 'Echaru', category: 'INDIGENOUS', growthNotes: 'Nitrogen-fixing acacia suitable for buffer zone restoration.', activeStatus: true },
  { id: 'SP-06', commonName: 'Avocado (Hass Grafted)', scientificName: 'Persea americana', localName: 'Avocado', category: 'FRUIT', growthNotes: 'High yield food security & income generator for buffer farmers.', activeStatus: true },
  { id: 'SP-07', commonName: 'African Olive', scientificName: 'Olea africana', localName: 'Mutamaiyu', category: 'INDIGENOUS', growthNotes: 'Extremely durable indigenous wood, sacred conservation tree.', activeStatus: true }
];

export const INITIAL_SEED_BATCHES: SeedBatch[] = [
  { id: 'BAT-2024-001', nurseryId: 'NUR-OLO-01', speciesId: 'SP-01', seedSource: 'Oloolua Mother Trees', collectionLocation: 'Oloolua Forest Zone B', collectionDate: '2024-01-05', acquiredDate: '2024-01-05', quantityAcquired: 15000, status: 'IN_PRODUCTION', responsibleUser: 'Kevin M.' },
  { id: 'BAT-2024-002', nurseryId: 'NUR-OLO-01', speciesId: 'SP-02', seedSource: 'KEFRI Seeds Station', collectionLocation: 'Muguga Nursery', collectionDate: '2024-01-12', acquiredDate: '2024-01-14', quantityAcquired: 10000, status: 'IN_PRODUCTION', responsibleUser: 'Jane N.' },
  { id: 'BAT-2024-003', nurseryId: 'NUR-OLO-01', speciesId: 'SP-03', seedSource: 'Wild Harvested', collectionLocation: 'Ngong Hills Forest Reserve', collectionDate: '2024-01-28', acquiredDate: '2024-01-29', quantityAcquired: 5000, status: 'IN_PRODUCTION', responsibleUser: 'Peter K.' }
];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  { id: 'TXN-001', transactionType: 'OPENING_STOCK', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-01', speciesId: 'SP-01', seedBatchId: 'BAT-2024-001', quantity: 3000, direction: 'IN', date: '2024-01-15', source: 'INITIAL_AUDIT', recordedBy: 'Austin N.', verificationStatus: 'VERIFIED', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'TXN-002', transactionType: 'PROPAGATION', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-02', speciesId: 'SP-02', seedBatchId: 'BAT-2024-002', quantity: 4500, direction: 'IN', date: '2024-02-01', source: 'NURSERY_PROPAGATION', recordedBy: 'Jane N.', verificationStatus: 'VERIFIED', createdAt: '2024-02-01T11:30:00Z' },
  { id: 'TXN-003', transactionType: 'PROPAGATION', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-03', speciesId: 'SP-03', seedBatchId: 'BAT-2024-003', quantity: 2500, direction: 'IN', date: '2024-02-15', source: 'NURSERY_PROPAGATION', recordedBy: 'Peter K.', verificationStatus: 'VERIFIED', createdAt: '2024-02-15T09:15:00Z' },
  { id: 'TXN-004', transactionType: 'PROPAGATION', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-04', speciesId: 'SP-04', quantity: 2000, direction: 'IN', date: '2024-03-01', source: 'NURSERY_PROPAGATION', recordedBy: 'Mercy A.', verificationStatus: 'VERIFIED', createdAt: '2024-03-01T14:20:00Z' },
  { id: 'TXN-005', transactionType: 'PLANTING', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-01', speciesId: 'SP-01', quantity: 600, direction: 'OUT', date: '2024-04-10', source: 'REFORESTATION_EVENT_1', destination: 'Oloolua Forest Riverine Buffer', recordedBy: 'Austin N.', verificationStatus: 'VERIFIED', createdAt: '2024-04-10T16:00:00Z' },
  { id: 'TXN-006', transactionType: 'SALE', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-06', speciesId: 'SP-06', quantity: 350, direction: 'OUT', date: '2024-04-20', source: 'COMMUNITY_SALE', destination: 'Karen Local Farmers Association', recordedBy: 'Grace W.', verificationStatus: 'VERIFIED', createdAt: '2024-04-20T12:00:00Z' },
  { id: 'TXN-007', transactionType: 'DONATION', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-02', speciesId: 'SP-02', quantity: 200, direction: 'OUT', date: '2024-05-05', source: 'SCHOOL_GREENING', destination: 'Oloolua Primary School', recordedBy: 'Samuel O.', verificationStatus: 'VERIFIED', createdAt: '2024-05-05T10:00:00Z' },
  { id: 'TXN-008', transactionType: 'MORTALITY', nurseryId: 'NUR-OLO-01', seedbedId: 'SB-03', speciesId: 'SP-03', quantity: 120, direction: 'OUT', date: '2024-05-18', source: 'DRY_SPELL_HEAT', recordedBy: 'Peter K.', notes: 'Extreme dry spell before shade cloth installation', verificationStatus: 'VERIFIED', createdAt: '2024-05-18T15:30:00Z' }
];

export const INITIAL_PLANTING_EVENTS: PlantingEvent[] = [
  {
    id: 'PL-001',
    cfaId: 'CFA-OLO-001',
    nurseryId: 'NUR-OLO-01',
    speciesId: 'SP-01',
    quantityPlanted: 600,
    plantingSite: 'Oloolua Forest Reserve Riverine Section 4',
    gpsCoordinates: { lat: -1.3590, lng: 36.7105 },
    responsibleGroup: 'Oloolua Youth Guardians & KFS Forest Guard Team',
    landownerAuthority: 'Kenya Forest Service (KFS)',
    weatherNotes: 'Planted during early rainy season, high soil moisture.',
    lastMonitoringDate: '2024-08-15',
    verificationStatus: 'VERIFIED',
    date: '2024-04-10'
  }
];

export const INITIAL_SURVIVAL_OBSERVATIONS: SurvivalObservation[] = [
  {
    id: 'SURV-001',
    plantingEventId: 'PL-001',
    date: '2024-08-15',
    observer: 'Austin Namuye',
    numberAssessed: 600,
    numberSurviving: 568,
    numberDead: 22,
    numberMissing: 10,
    causeOfLoss: 'Minor wild herbivore browsing on un-fenced saplings',
    survivalRatePercent: 94.7,
    notes: 'Excellent canopy growth on Croton trees after 4 months.'
  }
];

// Helper to compute live Nursery Metrics per Kai PRD Section 8.1
export function calculateNurseryMetrics(transactions: InventoryTransaction[]): NurseryMetrics {
  let currentStock = 0;
  let propagatedTotal = 0;
  let plantedTotal = 0;
  let soldTotal = 0;
  let donatedTotal = 0;
  let mortalityTotal = 0;

  const speciesSet = new Set<string>();

  transactions.forEach(t => {
    speciesSet.add(t.speciesId);

    if (t.transactionType === 'OPENING_STOCK' || t.transactionType === 'PROPAGATION' || t.transactionType === 'PURCHASE_ACQUISITION' || t.transactionType === 'TRANSFER_IN') {
      currentStock += t.quantity;
    } else if (t.direction === 'OUT') {
      currentStock = Math.max(0, currentStock - t.quantity);
    } else if (t.transactionType === 'ADJUSTMENT') {
      currentStock += t.quantity; // positive or negative
    }

    if (t.transactionType === 'PROPAGATION' || t.transactionType === 'OPENING_STOCK') {
      propagatedTotal += t.quantity;
    } else if (t.transactionType === 'PLANTING') {
      plantedTotal += t.quantity;
    } else if (t.transactionType === 'SALE') {
      soldTotal += t.quantity;
    } else if (t.transactionType === 'DONATION') {
      donatedTotal += t.quantity;
    } else if (t.transactionType === 'MORTALITY') {
      mortalityTotal += t.quantity;
    }
  });

  return {
    currentStock,
    speciesCount: speciesSet.size,
    activeSeedbeds: INITIAL_SEEDBEDS.filter(s => s.status === 'ACTIVE' || s.status === 'FULL').length,
    propagatedTotal,
    plantedTotal,
    soldTotal,
    donatedTotal,
    mortalityTotal,
    survivalRatePercent: 94.7
  };
}
