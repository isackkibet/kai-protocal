'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import RecordActivityModal from '@/components/RecordActivityModal';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { INITIAL_SPECIES, INITIAL_SEEDBEDS, INITIAL_TRANSACTIONS, calculateNurseryMetrics } from '@/services/kaiLedger';

const NURSERY_SPECIES_CATALOGUE = [
  {
    name: 'Silver Oak · Silky Oak',
    sci: 'Grevillea robusta A.Cunn. ex R.Br. · Proteaceae',
    categories: ['medicinal', 'timber', 'ornamental'],
    img: '/assets/images/silver.jpeg',
    tags: ['Medicinal', 'Timber', 'Ornamental'],
    uses: [
      { title: '🌿 Traditional Medicine', text: 'Documented Kenyan uses (Kakamega Forest) include treatment of sore throat, earache, chest complaints, flu, and toothache. Bark and leaf extracts show anti-inflammatory and hepatoprotective properties in pharmacological studies.' },
      { title: '🪵 Timber & Craft', text: 'Valued for furniture, cabinetry, plywood, and turnery. Attractive, durable wood used for decorative paneling and musical instruments.' },
    ],
    eco: '🌱 Excellent coffee-shade tree and erosion-control species in highland agroforestry systems. Note: not nitrogen-fixing. Native to SE Queensland–NE New South Wales, Australia.',
  },
  {
    name: 'Doum Palm · Thika Palm',
    sci: 'Hyphaene compressa H.Wendl. · Arecaceae',
    categories: ['food', 'medicinal', 'fodder', 'timber'],
    img: '/assets/images/thika_palm.jpg',
    tags: ['Food', 'Medicinal', 'Fibre'],
    uses: [
      { title: '🧺 Handicrafts & Construction', text: 'Leaves woven into baskets, mats, brooms, and roofing thatch. The trunk provides building poles, beehives, and cabinet-making material. A true multipurpose palm of the ASALs.' },
      { title: '🍎 Food & Nutrition', text: 'Fibrous fruit pulp is edible and sweet, often chewed or made into beverages during dry seasons.' },
    ],
    eco: '🐘 Fruits consumed by elephants and baboons — critical for seed dispersal and ecosystem services.',
  },
  {
    name: 'African Cherry · Red Stinkwood',
    sci: 'Prunus africana (Hook.f.) Kalkman · Rosaceae',
    categories: ['medicinal', 'timber'],
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Prunus_africana_MS_3588.jpg/330px-Prunus_africana_MS_3588.jpg',
    tags: ['Medicinal', 'Timber', 'Conservation'],
    uses: [
      { title: '💊 Critical Medicinal Tree', text: 'Bark extract (marketed as "pygeum") is globally recognised for treating benign prostatic hyperplasia (BPH). Used for generations in African traditional medicine; also shows anti-inflammatory, antimicrobial, and hepatoprotective activities in pharmacological research.' },
      { title: '🪵 Durable Timber', text: 'Hard, heavy heartwood with a distinctive reddish-brown colour; used for construction, flooring, and tool handles.' },
    ],
    eco: '⚠️ IUCN Red List: Vulnerable (VU). Bark over-harvesting for the herbal market is the primary threat. Nursery propagation is essential — Oloolua CFA plays a direct conservation role.',
  },
  {
    name: 'Avocado',
    sci: 'Persea americana Mill. · Lauraceae',
    categories: ['food', 'medicinal', 'timber'],
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Persea_americana_fruit_2.JPG/330px-Persea_americana_fruit_2.JPG',
    tags: ['Superfood', 'Medicinal', 'Cosmetic'],
    uses: [
      { title: '🥑 Nutritional Powerhouse', text: 'Rich in monounsaturated fats (primarily oleic acid), potassium, magnesium, and bioactive polyphenols supporting cardiovascular health.' },
      { title: '🧴 Medicinal & Cosmetic Uses', text: 'Leaf and seed extracts used in traditional medicine for skin infections and digestive disorders. Avocado oil is valued in skincare and hair products.' },
    ],
    eco: '💚 Key agroforestry species — widely intercropped with coffee in Kenyan highlands, providing canopy shade and a high-value cash fruit.',
  },
  {
    name: 'Matomoko · Common Wild Fig',
    sci: 'Ficus thonningii Blume · Moraceae',
    categories: ['medicinal', 'fodder', 'ornamental'],
    img: 'https://imgs.search.brave.com/jPfzsb_v6uibUBuLSwzLPmrVFz0JAyTuUyzCqQy2bDA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93d3cu/c2VsaW5hd2FtdWNp/aS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMTQvMDgvbWF0/b21va28uanBn',
    tags: ['Fodder', 'Medicinal', 'Shade'],
    uses: [
      { title: '🐐 Fodder & Livestock Feed', text: 'Leaves and young figs are excellent dry-season fodder. Research shows inclusion of F. thonningii leaves can replace commercial concentrate in goat diets.' },
      { title: '💊 Bark & Latex Medicine', text: 'Bark decoction used for colds, sore throat, and dysentery. Latex applied topically for wound healing.' },
    ],
    eco: '🌿 Ideal live fence, soil stabiliser, and shade tree. Fig fruits support birds and frugivorous wildlife, enhancing forest biodiversity.',
  },
  {
    name: 'Markhamia · Nile Tulip Tree',
    sci: 'Markhamia lutea (Benth.) K.Schum. · Bignoniaceae',
    categories: ['medicinal', 'timber', 'ornamental'],
    img: '/assets/images/makhamia.jpg',
    tags: ['Timber', 'Medicinal', 'Bee Forage'],
    uses: [
      { title: '🪵 Versatile Timber', text: 'Light but durable wood used for light construction, furniture, tool handles, and beehives. Fast-growing; well-suited to agroforestry boundary planting.' },
      { title: '💊 Traditional Remedies', text: 'Root bark used for anaemia, diarrhoea, and back pain. Leaf preparations applied for rheumatic complaints.' },
      { title: '🐝 Ornamental & Bee Forage', text: 'Vivid yellow trumpet-shaped flowers are highly attractive to bees — an important species for honey production.' },
    ],
    eco: '🐝 Highly visited by bees from our beekeeping project, supporting both pollination and forest honey yields.',
  },
  {
    name: 'Acacia (Vachellia)',
    sci: 'Vachellia spp. (formerly Acacia) · Fabaceae',
    categories: ['medicinal', 'timber', 'fodder'],
    img: '/assets/images/acacia.jpeg',
    tags: ['Gum', 'Fodder', 'Tannin'],
    uses: [
      { title: '🌱 Edible Gum & Fodder', text: 'Pods and leaves are highly palatable livestock fodder. Gum arabic has food-grade and pharmaceutical applications.' },
      { title: '💊 Medicinal Bark', text: 'Bark decoction used for diarrhoea, gingivitis, and skin irritation. Applied as an astringent and for wound healing.' },
      { title: '🪵 Dense Timber & Fuelwood', text: 'Extremely hard, dense wood prized for furniture, carving, and high-quality firewood and charcoal.' },
    ],
    eco: '🌍 Nitrogen-fixing root nodules improve soil fertility. African species are classified as Vachellia or Senegalia.',
  },
  {
    name: 'African Olive · Mutamaiyu',
    sci: 'Olea europaea subsp. cuspidata · Oleaceae',
    categories: ['medicinal', 'timber', 'ornamental'],
    img: '/assets/images/olea.jpeg',
    tags: ['Sacred Tree', 'Medicinal', 'Hardwood'],
    uses: [
      { title: '🪵 Premium Hardwood', text: 'Extremely durable, fine-grained, termite-resistant wood used for high-end carving, turnery, and long-lasting fence posts.' },
      { title: '💊 Ethnobotanical Medicine', text: 'Bark and leaves used traditionally as tonics, astringents, and remedies for fevers, chest complaints, and tooth hygiene.' },
    ],
    eco: '🌳 Keystone indigenous dry highland forest tree that provides rich nesting sites and supports local avian biodiversity.',
  },
  {
    name: 'Teclea · Small Fruited Teclea',
    sci: 'Teclea nobilis Del. · Rutaceae',
    categories: ['medicinal'],
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Vepris_lanceolata_-_White_Ironwood_Tree_-_South_Africa_22.jpg/330px-Vepris_lanceolata_-_White_Ironwood_Tree_-_South_Africa_22.jpg',
    tags: ['Analgesic', 'Antipyretic', 'Anti-inflammatory'],
    uses: [
      { title: '💊 Potent Medicinal Tree', text: 'Leaves, bark, and roots used across East Africa to treat malaria, rheumatism, arthritis, pneumonia, cough, fever, and headache.' },
      { title: '🌡️ Traditional Applications', text: 'Leaf decoction taken for chest pain and as an anthelmintic. Root infusions used for stomach-ache and backache.' },
    ],
    eco: '🧪 Pharmacological studies confirm analgesic activity and low acute toxicity at therapeutic doses.',
  },
  {
    name: 'Chestnut',
    sci: 'Castanea spp. · Fagaceae',
    categories: ['food', 'medicinal', 'timber'],
    img: '/assets/images/chestnut.jpg',
    tags: ['Edible Nut', 'Timber', 'Astringent'],
    uses: [
      { title: '🍽️ Nutritious Staple', text: 'Nuts are rich in complex carbohydrates and low in fat. Eaten roasted, boiled, or ground into gluten-free flour.' },
      { title: '🪵 Durable Timber', text: 'Naturally rot-resistant due to high tannin content; used for fencing posts, furniture, and outdoor construction.' },
    ],
    eco: '🌰 Great canopy provider and multi-use agroforestry specimen.',
  },
  {
    name: 'Drypetes',
    sci: 'Drypetes spp. · Putranjivaceae',
    categories: ['medicinal'],
    img: '/assets/images/drypetes.jpg',
    tags: ['Ethnomedicine', 'Pest Control', 'Forest Flora'],
    uses: [
      { title: '💊 Ethnomedicine & Ritual Use', text: 'Used across Africa to treat fevers, insect bites, and as a general restorative. Root and stem bark protect stored grain from pest insects.' },
      { title: '🌱 Antifungal Activity', text: 'Stem bark extracts show antifungal activity including against Candida strains in in-vitro studies.' },
    ],
    eco: '⚠️ Several Drypetes species contain potent bioactive compounds — traditional use requires expert guidance.',
  },
  {
    name: 'Croton · Musine',
    sci: 'Croton megalocarpus Hutch. · Euphorbiaceae',
    categories: ['medicinal', 'timber'],
    img: '/assets/images/croton.jpeg',
    tags: ['Biofuel', 'Medicinal', 'Mulch'],
    uses: [
      { title: '🛢️ Biodiesel & Animal Feed', text: 'Seeds contain 30–40% oil suitable for biodiesel. Residual seed cake contains 25–30% protein used as poultry and livestock feed supplement.' },
      { title: '💊 Traditional Healing', text: 'Bark decoction used against intestinal worms, whooping cough, pneumonia, malaria, and stomach ailments.' },
      { title: '🌿 Mulch & Soil Health', text: 'High-nitrogen leaves make excellent mulch for crops, especially coffee. Fast-growing pioneer species ideal for forest restoration and carbon sequestration.' },
    ],
    eco: '🌱 Fast-growing indigenous pioneer tree capturing an estimated 400 kg CO₂ over its lifespan.',
  },
  {
    name: 'Toothbrush Tree · Miswak',
    sci: 'Salvadora persica L. · Salvadoraceae',
    categories: ['medicinal'],
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Peelo_10.jpg/330px-Peelo_10.jpg',
    tags: ['Oral Hygiene', 'Antibacterial', 'Traditional'],
    uses: [
      { title: '🪥 Natural Toothbrush', text: 'Twigs (miswak/siwak) used for centuries as a natural toothbrush with documented antibacterial, antiplaque, and anti-gingivitis properties.' },
      { title: '💊 Systemic Medicine', text: 'Root decoctions used for spleen conditions and stomach complaints. Leaves applied for cough and asthma.' },
    ],
    eco: '🌿 Natural oral hygiene tool rich in fluoride, silica, and salvadorine.',
  },
  {
    name: 'East African Greenheart · Muthiga',
    sci: 'Warburgia ugandensis Sprague · Canellaceae',
    categories: ['medicinal', 'timber'],
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Uganda_Greenheart_imported_from_iNaturalist_photo_153670805_on_24_June_2024.jpg/330px-Uganda_Greenheart_imported_from_iNaturalist_photo_153670805_on_24_June_2024.jpg',
    tags: ['Anti-malarial', 'Antifungal', 'Timber'],
    uses: [
      { title: '💊 Highly Valued Medicinal Tree', text: 'Bark and root extracts used for pneumonia, asthma, malaria, candidiasis, and skin infections. Peppery-bitter taste from drimane sesquiterpenes (warburganal, mukaadial).' },
      { title: '🪵 Fragrant Timber & Resin', text: 'Yellow-green heartwood, fragrant and resistant to insect attack. Resin used as glue for tool handles.' },
    ],
    eco: '⚠️ Endangered by wild overharvesting — active nursery propagation at Oloolua safeguards wild genetics.',
  },
  {
    name: 'Jackfruit',
    sci: 'Artocarpus heterophyllus Lam. · Moraceae',
    categories: ['food', 'medicinal', 'timber'],
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/The_jackfruit_is_holding_on_to_the_tree.jpg/330px-The_jackfruit_is_holding_on_to_the_tree.jpg',
    tags: ['Giant Fruit', 'Timber', 'Antioxidant'],
    uses: [
      { title: '🍈 World\'s Largest Tree Fruit', text: 'Nutritious pulp rich in carbohydrates, vitamins A, B, and C, and minerals. Seeds are boiled or roasted as snacks.' },
      { title: '🪵 Durable Timber', text: 'Heartwood is naturally termite-resistant and valued for furniture and musical instruments.' },
    ],
    eco: '🌳 Abundant fruit yield provides food resilience for surrounding agroforestry households.',
  },
  {
    name: 'Sisal',
    sci: 'Agave sisalana Perrine · Asparagaceae',
    categories: ['ornamental'],
    img: '/assets/images/sisal.jpg',
    tags: ['Hard Fibre', 'Ornamental', 'Erosion Control'],
    uses: [
      { title: '🧵 Natural Fibre Industry', text: 'Primary source of hard natural fibre for rope, twine, and handicrafts. Resists saltwater corrosion.' },
      { title: '🎨 Soil & Slope Stabilisation', text: 'Architectural succulent used for live fencing and preventing soil erosion in degraded areas.' },
    ],
    eco: '♻️ 100% biodegradable natural fibre supporting circular economy and green enterprise.',
  },
];

export default function SeedlingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const metrics = calculateNurseryMetrics(INITIAL_TRANSACTIONS);

  const filteredSpecies = NURSERY_SPECIES_CATALOGUE.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.categories.includes(activeFilter);
  });

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation onOpenRecordActivity={() => setIsModalOpen(true)} />

      <section className="bg-[#122b1f] border-b border-[#e4c878]/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="text-[#e4c878] font-bold text-xs uppercase tracking-widest">Nursery Operations</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Seedlings & Seedbeds</h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Oloolua Main Nursery capacity, seedbed allocation, and verified botanical species catalogue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-colors flex items-center gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Record Activity</span>
            </button>

            <Link
              href="/portal?tab=ledger"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2"
            >
              <span>View Kai Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 space-y-12 flex-1 w-full">
        {/* Nursery Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#122b1f] border border-[#e4c878]/20">
            <div className="text-xs text-gray-400">Total Live Stock</div>
            <div className="text-2xl font-black text-white">{metrics.currentStock.toLocaleString()}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#122b1f] border border-[#e4c878]/20">
            <div className="text-xs text-gray-400">Nursery Capacity</div>
            <div className="text-2xl font-black text-[#e4c878]">25,000</div>
          </div>

          <div className="p-4 rounded-xl bg-[#122b1f] border border-[#e4c878]/20">
            <div className="text-xs text-gray-400">Active Seedbeds</div>
            <div className="text-2xl font-black text-emerald-400">{INITIAL_SEEDBEDS.length}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#122b1f] border border-[#e4c878]/20">
            <div className="text-xs text-gray-400">Catalogued Species</div>
            <div className="text-2xl font-black text-white">{NURSERY_SPECIES_CATALOGUE.length}</div>
          </div>
        </div>

        {/* Seedbeds Table */}
        <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-4">
          <h3 className="text-xl font-bold text-white">Nursery Seedbed Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Bed ID</th>
                  <th className="py-2.5 px-3">Bed Name / Number</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Manager</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {INITIAL_SEEDBEDS.map((bed) => (
                  <tr key={bed.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-emerald-300">{bed.id}</td>
                    <td className="py-3 px-3 font-bold text-white">{bed.nameNumber}</td>
                    <td className="py-3 px-3 text-gray-300">{bed.propagationMethod}</td>
                    <td className="py-3 px-3 font-bold text-[#e4c878]">{bed.capacity.toLocaleString()}</td>
                    <td className="py-3 px-3 text-gray-300">{bed.assignedManager}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {bed.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nursery Species Catalogue */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Nursery Species Profiles</h2>
              <p className="text-xs text-gray-300">
                Verified indigenous and agroforestry species propagated by Oloolua Youth Guardians CFA.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `🌿 All (${NURSERY_SPECIES_CATALOGUE.length})` },
                { id: 'medicinal', label: '💊 Medicinal' },
                { id: 'timber', label: '🪵 Timber' },
                { id: 'food', label: '🍎 Food' },
                { id: 'ornamental', label: '🎨 Ornamental' },
                { id: 'fodder', label: '🐐 Fodder' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === f.id
                      ? 'bg-[#e4c878] text-neutral-950 shadow'
                      : 'bg-[#122b1f] text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecies.map((sp, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 overflow-hidden flex flex-col hover:border-[#e4c878]/50 transition-all group"
              >
                <div className="relative h-48 w-full overflow-hidden bg-black/40">
                  <img
                    src={sp.img}
                    alt={sp.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1">
                    {sp.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0b1c14]/80 backdrop-blur-sm text-[#e4c878] border border-[#e4c878]/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#e4c878] transition-colors">
                      {sp.name}
                    </h3>
                    <p className="text-[11px] font-mono text-emerald-300/80 italic mb-3">
                      {sp.sci}
                    </p>

                    <div className="space-y-2.5 text-xs text-gray-300">
                      {sp.uses.map((u, uIdx) => (
                        <div key={uIdx} className="space-y-0.5">
                          <span className="font-semibold text-[#e4c878]">{u.title}</span>
                          <p className="text-[11px] text-gray-300 leading-relaxed">{u.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {sp.eco && (
                    <div className="pt-3 border-t border-white/10 text-[11px] text-emerald-200/90 italic leading-relaxed">
                      {sp.eco}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RecordActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        speciesList={INITIAL_SPECIES}
        seedbedList={INITIAL_SEEDBEDS}
        onAddActivity={() => {}}
      />
    </div>
  );
}
