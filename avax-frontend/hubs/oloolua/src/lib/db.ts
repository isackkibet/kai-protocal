import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_7mfdGNKel0Rz@ep-small-king-aepdc5l6-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(DATABASE_URL);

// Auto-initialize Kai Nursery tables in Neon Postgres & Seed Real Operational Data
export async function initDbSchema() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS kai_activities (
        id VARCHAR(64) PRIMARY KEY,
        event_type VARCHAR(32) NOT NULL,
        cfa_id VARCHAR(32) NOT NULL,
        nursery_id VARCHAR(32) NOT NULL,
        seedbed_id VARCHAR(32) NOT NULL,
        species_id VARCHAR(32) NOT NULL,
        quantity INTEGER NOT NULL,
        recorded_by VARCHAR(128) NOT NULL,
        activity_date DATE NOT NULL,
        verification_status VARCHAR(32) DEFAULT 'SUBMITTED',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        json_payload JSONB
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS kai_transactions (
        id VARCHAR(64) PRIMARY KEY,
        transaction_type VARCHAR(32) NOT NULL,
        nursery_id VARCHAR(32) NOT NULL,
        seedbed_id VARCHAR(32) NOT NULL,
        species_id VARCHAR(32) NOT NULL,
        quantity INTEGER NOT NULL,
        direction VARCHAR(8) NOT NULL,
        txn_date DATE NOT NULL,
        recorded_by VARCHAR(128) NOT NULL,
        verification_status VARCHAR(32) DEFAULT 'SUBMITTED',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed real baseline records if table is empty
    const checkCount = await sql`SELECT COUNT(*) as cnt FROM kai_activities`;
    if (Number(checkCount[0]?.cnt || 0) === 0) {
      console.log('🌱 Seeding real baseline CFA operational records into Neon DB...');

      const initialActivities = [
        {
          id: 'ACT-001',
          event_type: 'OPENING_STOCK',
          cfa_id: 'CFA-OLO-001',
          nursery_id: 'NUR-OLO-01',
          seedbed_id: 'SB-01',
          species_id: 'SP-01',
          quantity: 3000,
          recorded_by: 'Austin Namuye (CFA Admin)',
          date: '2024-01-15',
          status: 'VERIFIED',
          notes: 'Initial opening stock audit for Bed 1 Croton megalocarpus'
        },
        {
          id: 'ACT-002',
          event_type: 'PROPAGATION',
          cfa_id: 'CFA-OLO-001',
          nursery_id: 'NUR-OLO-01',
          seedbed_id: 'SB-02',
          species_id: 'SP-02',
          quantity: 4500,
          recorded_by: 'Jane N. (Nursery Manager)',
          date: '2024-02-01',
          status: 'VERIFIED',
          notes: 'Sown Markhamia lutea seeds acquired from KEFRI'
        },
        {
          id: 'ACT-003',
          event_type: 'PROPAGATION',
          cfa_id: 'CFA-OLO-001',
          nursery_id: 'NUR-OLO-01',
          seedbed_id: 'SB-03',
          species_id: 'SP-03',
          quantity: 2500,
          recorded_by: 'Peter K. (Guardian Member)',
          date: '2024-02-15',
          status: 'VERIFIED',
          notes: 'Prunus africana wild harvested seed germination'
        },
        {
          id: 'ACT-004',
          event_type: 'PLANTING',
          cfa_id: 'CFA-OLO-001',
          nursery_id: 'NUR-OLO-01',
          seedbed_id: 'SB-01',
          species_id: 'SP-01',
          quantity: 600,
          recorded_by: 'Austin Namuye & KFS Guard Team',
          date: '2024-04-10',
          status: 'VERIFIED',
          notes: 'Reforestation planting at Oloolua Forest Reserve Riverine Section 4'
        },
        {
          id: 'ACT-005',
          event_type: 'SALE',
          cfa_id: 'CFA-OLO-001',
          nursery_id: 'NUR-OLO-01',
          seedbed_id: 'SB-06',
          species_id: 'SP-06',
          quantity: 350,
          recorded_by: 'Grace W. (Nursery Manager)',
          date: '2024-04-20',
          status: 'VERIFIED',
          notes: 'Commercial sale to Karen Farmers Association'
        },
        {
          id: 'ACT-006',
          event_type: 'DONATION',
          cfa_id: 'CFA-OLO-001',
          nursery_id: 'NUR-OLO-01',
          seedbed_id: 'SB-02',
          species_id: 'SP-02',
          quantity: 200,
          recorded_by: 'Samuel O. (Guardian Member)',
          date: '2024-05-05',
          status: 'VERIFIED',
          notes: 'School greening donation to Oloolua Primary School'
        }
      ];

      for (const act of initialActivities) {
        const direction = (act.event_type === 'SALE' || act.event_type === 'DONATION' || act.event_type === 'PLANTING' || act.event_type === 'MORTALITY') ? 'OUT' : 'IN';
        
        await sql`
          INSERT INTO kai_activities (
            id, event_type, cfa_id, nursery_id, seedbed_id, species_id,
            quantity, recorded_by, activity_date, verification_status, notes, json_payload
          ) VALUES (
            ${act.id}, ${act.event_type}, ${act.cfa_id}, ${act.nursery_id}, ${act.seedbed_id}, ${act.species_id},
            ${act.quantity}, ${act.recorded_by}, ${act.date}::date, ${act.status}, ${act.notes}, ${JSON.stringify(act)}
          ) ON CONFLICT DO NOTHING;
        `;

        await sql`
          INSERT INTO kai_transactions (
            id, transaction_type, nursery_id, seedbed_id, species_id, quantity, direction, txn_date, recorded_by, verification_status
          ) VALUES (
            ${'TXN-' + act.id}, ${act.event_type}, ${act.nursery_id}, ${act.seedbed_id}, ${act.species_id}, ${act.quantity}, ${direction}, ${act.date}::date, ${act.recorded_by}, ${act.status}
          ) ON CONFLICT DO NOTHING;
        `;
      }
      console.log('✅ Real operational dataset seeded into Neon DB.');
    }

    console.log('✅ Neon Postgres schema ready for Kai Oloolua Hub');
  } catch (err) {
    console.error('⚠️ Neon DB auto-schema init note:', err);
  }
}
