export type Article = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  time: string;
  type: 'article';
};

export const defaultArticles: Article[] = [
  {
    id: "circular-economy-water",
    title: "Circular Economy and Water reuse around Lake Victoria",
    category: "Sustainability",
    author: "Victor Bwire and Marvin Bwire",
    time: "8 min read",
    type: "article",
    image: "/images/circular_economy_nile.png",
    excerpt: "Lake Victoria is Africa’s largest freshwater lake. The lake supports over 40 million people living in 3 countries and its source is the River Nile.",
    content: `Lake Victoria is Africa’s largest freshwater lake. The lake supports over 40 million people living in 3 countries (Kenya, Tanzania & Uganda) and its source is the River Nile. The lake and its resources fuel the economies of Kenya, Tanzania and Uganda. According to the Nile Basin Initiative, the lake and its catchment provide 90 percent of the region’s water supply for major urban centers like Kampala, Kigali, Mwanza, and Kisumu.

The region's inhabitants rely on the lake for all aspects of their lives, including fishing, agriculture, and industrial applications. However, Earthzine notes that the increasing population has negatively impacted water quality through agricultural and industrial runoff and sewage. Furthermore, the invasive water hyacinth is blocking fishing access and providing breeding grounds for disease carrying mosquitoes and snails.

As indicated in the Nile Basin Initiative’s technical reports on water resource management, in Nile basin countries such as Kenya, water shortage is already a challenge and will become severe in the near future. As such countries have been advised to put measures in place to help tackle this. Such measures include water reusing and adopting a circular economy in the Nile basin regions.

Around the lake basin, circular economy is mainly achieved through water recycling and reuse. This is through wastewater treatment and management, Irrigation farming, Biogas production, hydropower production and water purification and consumption.

According to Eng. Moses Jura from KIWASCO, Climate change, water hyacinth and rise of water levels in the lake have been the major hindrances and as such led to the company’s inability to effectively provide water to Kisumu residents.

Along with drinking water, the lake also provides water for irrigation schemes around the region where rice farming has mainly thrived amidst other crops such as soya beans, maize, tomatoes, and vegetables. The irrigation schemes pump water from the lake and excess water is pumped back into the lake.

Public and Private Irrigation schemes in the Kenyan Nile basin include West Kano, Ahero and Bunyala irrigation schemes. According to the Nile Basin water resource atlas 2016 - 2022, the total annual average irrigation demand is estimated at about 367 million cubic meters. The actual water use is estimated to be 307 million cubic meters.

Countries globally being signatories to the SDG 12 are embracing interventions to ensure sustainable use of resources including water to improve the living standards of their people while at the same time ensuring future generations will not be starved of these resources.`
  },
  {
    id: "access-to-information",
    title: "Access to Information, transparency missing in the power sector",
    category: "Energy",
    author: "Endrian Lupia",
    time: "6 min read",
    type: "article",
    image: "/images/power_sector.png",
    excerpt: "Kenya faces a depressing power future even as the country boasts of several power sources ranging from solar, geothermal, wind, among other energy sources.",
    content: `Kenya faces a depressing power future even as the country boasts of several power sources ranging from solar, geothermal, wind, among other energy sources. Information attributed to the Kenya Power and Lighting Company (KPLC) indicates that electricity demand increased over the last two years, way ahead of the installed capacity for supply-while the country has increased the capacity of the national grid, consumption has doubled over the same period, with no plans to deal with the situation soon.

While attracting foreign investment in the energy sector has been a recurring theme in the country, the gap between ambition and action remains big as seen in the monopoly status of KPLC, inertia by policy makers to review the place of power purchasing agreements from independent power producers and the energy sector opening on sharing data to enable data-based planning. The absence of clear directives and easily accessible data suggests a system lacking values and one where business thrives only through connections.

With an energy generation mix that is 80% renewable, Kenya should be a leader on the global energy stage, exporting more than it imports and positioning itself as a major player in the energy market. Yet, this industry, with all its potential, remains inaccessible to many.

Universal access to clean, reliable, modern, affordable and sustainable energy in Kenya has been bogged down by corruption in the sector, secret negotiation of power purchase agreements, non-disclosure of electricity price per unit kilo watt hour, low voltage and blackouts.

My experience with the energy sectors in Canada and Kenya reveals a stark contrast in the flow of information, transparency and public trust. In Canada, the Department of Environment and Natural Resources and the Independent Electricity System Operator (IESO) in Ontario maintain open, accessible websites with detailed, easily navigable information on energy prices, incentives, regulatory policies, and sustainability goals.

KPLC’s lack of transparency starkly contrasts with Canada’s IESO. While IESO routinely publishes data on its power generation costs, partnerships and consumer demand management strategies, KPLC has historically been opaque about these areas. The public has no clear understanding into the debt repayment obligations tied to Kenya's energy imports or the precise financial terms KPLC has with Independent Power Producers (IPPs). Information related to carbon credits, climate goals and power sector opportunities, such as solar farms or biogas plants, remains limited or inaccessible. 

Furthermore, KPLC’s electricity billing model is often convoluted, with vague explanations that attribute high prices to external factors like fluctuating oil prices or geopolitical tensions. A more transparent approach, one that breaks down the influence of debt obligations, fuel costs and operational inefficiencies on consumer billing, would not only clarify billing details but also allow citizens to understand the structural challenges the sector faces. 

KPLC should openly disclose its dealings, from the prices it pays to independent power producers to the terms it offers small energy producers for selling excess electricity back to the national grid. Rural electrification should not require bribes to reach marginalized communities. Public transparency should be the standard—not something achieved only through parliamentary inquiries.`
  },
  {
    id: "blue-economy-potential",
    title: "Blue Economy potential in Nile Basin not fully exploited",
    category: "Environment",
    author: "Victor Bwire",
    time: "5 min read",
    type: "article",
    image: "/images/blue_economy.png",
    excerpt: "Countries in the Nile basin have a window of opportunity to adopt and implement sustainable development paths by embracing a transboundary approach.",
    content: `Countries in the Nile basin have a window of opportunity to adopt and implement sustainable development paths by embracing a transboundary approach in terms of environmental security, human well-being and increased joint cross border investments. There are already inter-governmental bodies and policies to guide such ventures for the mutual benefit for the inhabitants, despite our different political situations.

A more joint approach to making choices for the region on infrastructure, energy, climate change and food production among others will shape the opportunities and options for the region.

Development experts have posited that the region’s future depends on the ability of the individual countries to rise above limited nationalistic interests and mobilize natural resources and investments in a sustainable manner and that it’s only through well planned utilization of these resources in the context of existing regional policies and frameworks. Several feasibility studies by bodies such as the Nile Basin Initiative show the potential in the region, through joint transboundary investments.

According to NBI, the hydropower potential in the Nile Basin exceeds 20 gigawatts (GW) with countries in the basin depending on hydropower to varying degrees, with Burundi, DR Congo, Ethiopia, and Uganda reliant on it for 80 percent or more of their power. The Nile Basin remains the only region on the African continent without a functional regional power grid. 

The volumes of power traded amongst Nile countries are inadequate, unreliable, and expensive. Accordingly, electricity consumption in the region is among the lowest in the world. Urban areas are significantly better served than rural areas, where the bulk of the population remains dependent on biomass energy sources, with associated negative impacts on the environment.

NBI and her subsidiary investment instruments such the as the Nile Equatorial Lakes Subsidiary Action Program Coordination Unit (NELSAP-CU) take largely about the potential in the regions blue economy, and clearly acknowledging that there are new opportunities for uses of the marine resources, including proper water management and utilization policies and programmes but such interventions must minimise the risks that come with the investment in such resources and increase benefits to the local communities.

A lot for focus is some regions countries on blue economy utilization focuses on the coastal economies at the expense of the vast opportunities in the riverine economies in the Nile basin. Just for example, there was too much focus and attention on the border dispute with Somalia, that the attention given to the conflict in Migingo Island in Lake Victoria. Or evening the county feeling pressured to sign the treat establishing the Nile River Basin Commission, that will provide the much-needed political will for the proper development of the region.

On the blue economy development focus, many of the countries building blocks are anchored on increasing profits for value chains and producers, improve environment: economic efficiency, low carbon development, investing in natural capital and ecosystem services and efficient markets that internalize all social and environmental costs.`
  },
  {
    id: "cop28-discussions",
    title: "COP28 on Climate Change discussions in Dubai, won't be business as usual",
    category: "Climate",
    author: "Victor Bwire",
    time: "5 min read",
    type: "article",
    image: "/images/cop28_climate.png",
    excerpt: "Conversations, framing and narratives around climate change are rapidly changing, as the reality dawns on many that past rhetoric has not helped much.",
    content: `Conversations, framing and narratives around climate change are rapidly changing, as the reality dawns on many that past rhetoric has not helped much and the political, economic, and social effects continue biting.

COP28 is happening in Dubai when many countries including the East African region are experiencing big weather changes that have seen heavy rains leading toe massive flooding and the related loss of lives, displacement of people, destruction of property, livestock, and crops.

East African countries just like other African countries are experiencing the adverse impact of climate change, a situation that is likely to continue as seen through severe flooding, frequent and prolonged drought, declining crop yields, loss of livestock and decreased water availability. That’s why an African led position and solution-based approach is very welcome.

During the Africa Climate Change week in Nairobi recently, Kenya led other African countries in calling for shifting the global debate and framing the climate change crisis away from a division between the Global North and the Global South, and adopting a more collaborative and collective action that allows each country and region to contribute what it has.

Africa is ready to contribute to global decarbonization efforts by leveraging its abundant resources, including renewable energy, critical minerals, agricultural potential, and natural capital. By harnessing these assets, Africa can drive its own green growth and support global renewable energy needs.

A leading think tank on climate changes issue; Power Shift Africa, recently released a report titled Africa’s Agenda for COP28; which calls for urgent practical and honest intervention at COP28 to combat the escalating climate crisis. The report urges a strong response at COP28 to address the unique challenges of the current climate emergency.

Mohamed Adow, Founder and Executive Director, Power Shift Africa notes that it has never been more vital for African nations to work together and unite our collective voice at the COP28 climate summit and implores African leaders to push rich countries deliver on their promise of climate finance.`
  },
  {
    id: "disaster-preparedness",
    title: "Counties need practical and functional disaster preparedness policies",
    category: "Governance",
    author: "Victor Bwire",
    time: "4 min read",
    type: "article",
    image: "/images/disaster_preparedness.png",
    excerpt: "Once more, the failure to properly harvest water across the country and put in place disaster preparedness mechanisms is punishing people.",
    content: `Once more, the failure to properly harvest water across the country and put in place disaster preparedness mechanisms is punishing people. In flood prone counties such as Busia, that perennially experience floods, a functional disaster preparedness team and strategy under the Governor’s office that easily marshal resources and action is mandatory. 

The County leadership must reactivate the disaster response mechanisms away from the donation of simple items to the communities affected, for its not small as it has always been. Attention must shift the affected people, their lives in camps and related in addition to thinking about repairing infrastructure.

The destruction of the Ruambwa and Mudembi Rice Irrigation schemes in Bunyala North in Budalangi Constituency is very devastating to the communities- that has bearing on the food security and economic empowerment. The response from the counties has been rather slow and wanting.

Evidently, the level of preparedness to deal with the disaster in the county has appeared weak if not non-existent. The local leaders must use the convening of the national assemblies to bring this matter to national attention and call for action.

Remember its also planting time in the region thus emergency interventions including on dealing with livestock diseases and feeding, farming and seed planting, storage facilities, emergency medical supplies, and overall disaster management system and rapid response to risks/outbreaks are needed urgently.

Already, Budalangi sub county has recorded destruction of foot bridges and roads in paralyzing the transport sector, floods have devastated villages and landing beaches slums destruction of health facilities, contaminated water sources, increased stagnant water ponds, among other destructions.

The areas around the lake have yet to recover from the Lake Victoria backflows of 2020- the happened when the spill gateways in the Uganda based dams saw increased back flows in the rivers draining into Lake Victoria. The back flows and increased water levels, led to beaches along the lake being submerged while lowlands are experiencing floods.

Its important that plans are shared on how in addition to moving the affected people to dry areas, the national and county governments plan to assist in opening drainage and water pathways to allow movement of water from homes, provision of temporary moveable toilets, and supply of water treatment chemicals.`
  },
  {
    id: "nile-river-commission",
    title: "Process to establish Nile River Basin Commission should be finalised",
    category: "Governance",
    author: "Victor Bwire",
    time: "6 min read",
    type: "article",
    image: "/images/nile_governance.png",
    excerpt: "Mistrust, emotional attachment and what appears extreme nationalism by countries in the Nile Basin will continue denying inhabitants benefits.",
    content: `Mistrust, emotional attachment and what appears extreme nationalism by countries in the Nile Basin will continue denying the inhabitants access to the benefits of this God given resource. Residents will continue facing challenges including those associated with adverse effects of climate change because of unending hydro diplomacy wars within the capitals in the region. 

Cairo and Khartoum have been the most extreme in their approach to the access, control and use the Nile basin resources, to the detriment of the process of ensuring peaceful transboundary cooperation and development of the region.

Huge multibillion projects are going on across the borders with very promising results for the residents, including power projects, water dams, climate change mitigation and adaptation interventions that have big economic potential and wealth creation for the region.

Under the Cooperative Framework Agreement, it was envisaged that the River Nile Basin Commission shall be established to act as a forum for co-operation and a clearinghouse for the planned measures that could cause any harm to other riparian states. The Nile Basin Initiative has been working around clock as a platform for peace and sustainable use of the water resources.

Dr. Eng Isaac Alukwe notes that once established, the commission will guide and promote integrated management, sustainable development, and harmonious utilization of the water resources of the Nile Basin, as well as their conservation and protection for the benefit of present and future generations.

The Commission shall serve as an institutional framework for cooperation among Nile Basin States in the use, development, protection, conservation and management of the Nile River Basin and its waters. Each Nile Basin State shall establish or designate a National Nile Focal Point Institution.

The Regional Rusumo Falls Hydroelectric Project located at the Rusumo Falls at the Tanzania and Rwanda border is a case study of what joint cooperation can achieve. The 80 MW power plant will supply power to Gitega in Burundi, Kigali in Rwanda, and Nyakanazi in Tanzania as part of a transboundary program.

Hopefully, Kenya will see reason in signing the framework agreement soon, so that we change the situation of people in the Lake Victoria basin, which currently has the one of the highest poverty rates globally. The 13 Counties from the Lake Victoria Regional Economic block will be big beneficiaries from the transboundary development support.`
  }
];

export type Podcast = {
  id: string;
  title: string;
  episode: string;
  duration: string;
  image: string;
  type: 'podcast';
};

export const defaultPodcasts: Podcast[] = [
  { id: "p1", title: "Busia Today Podcast", episode: "Episode 1: Local News Roundup", duration: "45 min", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80", type: 'podcast' as const },
  { id: "p2", title: "Lake Victoria Basin Insights", episode: "Episode 12: Climate Resilience", duration: "30 min", image: "https://images.unsplash.com/photo-1516280440502-62dbdece4a44?w=400&q=80", type: 'podcast' as const },
];

export const defaultTicker = [
  { id: "t1", text: "Action to enhance climate change resilience needs to transcend COP28 narratives" },
  { id: "t2", text: "Process to establish Nile River Basin Commission should be finalised" },
  { id: "t3", text: "Improving disaster preparedness and response needs strategic orientation" },
  { id: "t4", text: "Nurturing the blue economy for sustainable development in the region" }
];

export type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  description: string;
  type: 'event';
};

export const defaultEvents: Event[] = [
  { id: "e1", title: "World Rivers Day", date: "September 24, 2026", location: "Kisumu, Kenya", image: "https://images.unsplash.com/photo-1595844784400-d85c493ecb05?w=400&q=80", description: "A celebration of the world's waterways.", type: 'event' },
  { id: "e2", title: "Lake Victoria Basin Symposium", date: "October 10, 2026", location: "Mwanza, Tanzania", image: "https://images.unsplash.com/photo-1516280440502-62dbdece4a44?w=400&q=80", description: "Discussions on the climate resilience.", type: 'event' }
];
