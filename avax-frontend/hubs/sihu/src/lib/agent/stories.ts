// Sango Interactive Storytelling Knowledge Base
// These stories bring the Lake Victoria Basin ecosystem to life

export interface StorySegment {
  id: string;
  title: string;
  content: string;
  mood: "inspiring" | "educational" | "urgent" | "hopeful" | "mysterious";
  topic: "green-economy" | "blue-economy" | "basin-health" | "community" | "blockchain";
  followUpQuestions: string[];
}

export const sangoStories: StorySegment[] = [
  {
    id: "welcome",
    title: "The Keeper of Two Worlds",
    content: `Welcome to Sango — where the forests whisper to the lake, and the lake sings back to the sky.

I am your guide to the Lake Victoria Basin, a vast cradle of life where over 40 million people share their destiny with ancient waters and timeless trees. Here, the Nzoia River carries secrets from the Mau Forest to these shores. The papyrus sways like guardians of a sacred pact between land and water.

This basin is not just geography — it is a living story written in the language of rain, roots, and ripples. Would you like to hear how the green canopy protects the blue depths? Or shall I tell you of the guardians — the communities who have become stewards of this magnificent web of life?`,
    mood: "mysterious",
    topic: "basin-health",
    followUpQuestions: [
      "Tell me about the green economy",
      "What is the blue economy?",
      "How do communities protect the basin?",
      "What is Sango's blockchain solution?"
    ]
  },
  {
    id: "green-economy-intro",
    title: "The Emerald Guardians",
    content: `Picture this: At dawn, when the mist still clings to the Mau Forest, a Community Forest Association member named Miriam checks her beehives. The honey she will harvest carries more than sweetness — it carries the story of a forest that breathes.

Miriam is part of the Green Economy — a web of life that stretches from the treetops to your table. When she plants an indigenous tree, she is not just adding wood to the world. She is stitching the sky to the soil. That tree will drink carbon dioxide like a thirsty traveler, exhaling oxygen into the breath of future generations.

But here's the miracle: In the Lake Victoria Basin, every tree planted upstream becomes a guardian of the lake downstream. The roots hold the soil, preventing it from bleeding into the waters with every rain. The canopy catches the deluge, releasing it slowly — a gentle pulse instead of a destructive rush.

Communities like Miriam's have planted millions of trees. They've restored wetlands, protected breeding grounds, and maintained the delicate balance that keeps the Nile Perch swimming and the papyrus standing. Yet their work has been invisible — until now.`,
    mood: "inspiring",
    topic: "green-economy",
    followUpQuestions: [
      "How does tree planting help the lake?",
      "What is basin health mining?",
      "How do communities earn rewards?",
      "Tell me about the blue economy"
    ]
  },
  {
    id: "blue-economy-intro",
    title: "The Sapphire Heart",
    content: `Lake Victoria — Sango, the vast eye of Africa — is the world's second-largest freshwater lake. But numbers cannot capture its soul. When the sun rises over these waters, turning them from indigo to gold, you understand why 30 million people call this basin home.

The Blue Economy here is not an abstract concept. It is the fisherman casting his net at dawn, knowing the papyrus beds are the nursery where fingerlings become the Nile Perch that feed nations. It is the woman harvesting reeds sustainably, her hands guided by generations of wisdom about which stems to take and which to leave for the fish.

The lake and the land are one body with two hearts. When a farmer plants trees on the Nzoia River basin, the water runs clearer into the lake. When wetlands are restored, they filter the runoff like nature's kidneys. When communities protect breeding grounds, the fish return in abundance.

But this blue heart has been aching. Pollution, overfishing, and climate shifts have tested its resilience. Now, a new chapter begins — one where every community member can become a guardian, rewarded for protecting the waters that have always sustained them.`,
    mood: "hopeful",
    topic: "blue-economy",
    followUpQuestions: [
      "How is lake health monitored?",
      "What is basin health mining?",
      "How do fishing communities benefit?",
      "How can I participate?"
    ]
  },
  {
    id: "basin-health-mining",
    title: "Mining Life, Not Gold",
    content: `Imagine if you could "mine" not by digging into the earth, but by observing and protecting it. Welcome to Basin Health Mining — a revolutionary way where your smartphone becomes a tool for ecological stewardship.

Here is how the magic works: A community member named Ochieng walks to a designated monitoring point along the shore. He holds up his phone and captures the water clarity. He notes the birds he sees. He measures rainfall from a simple gauge. This data — this attention to the living world — becomes valuable.

Two neighbors verify his observations. AI checks for authenticity, ensuring the GPS matches, the photo is fresh, and the data is real. Then, something extraordinary happens: The Sango smart contract mints new ecological tokens and deposits them directly into Ochieng's digital wallet.

These tokens represent real, verified ecological impact. They are backed by carbon sequestered, water quality improved, hectares of wetland restored. And they are tradeable — connecting community guardians directly to global markets hungry for verified environmental goods.

The more Ochieng observes, the more he earns. The more he earns, the more he protects. It is a virtuous cycle where stewardship becomes prosperity, and prosperity fuels even greater care for the basin we all share.`,
    mood: "inspiring",
    topic: "basin-health",
    followUpQuestions: [
      "How much can I earn?",
      "What data do I need to collect?",
      "How is the data verified?",
      "What are the tokens used for?"
    ]
  },
  {
    id: "verification-story",
    title: "The Chain of Trust",
    content: `In the village of Lwanda, a tree-planting group has just registered their 500th seedling on the blockchain. This is not just a record — it is a promise made visible to the world.

The verification begins with a community leader staking a small amount of native currency, saying "I believe in this work." Then the peer verification network awakens. Members from other community groups travel to Lwanda, armed with smartphones and integrity. They photograph the seedlings, verify the GPS coordinates, confirm the species.

The AI guardian watches too, scanning for duplication, GPS spoofing, image authenticity. Only when both human peers and artificial intelligence agree does the smart contract advance the tree's status: Registered → Active → Verified Milestone → Fully Validated.

And then — the digital twin is born. An NFT minted on Avalanche containing the complete history: species data, location coordinates, every verification timestamp, calculated carbon sequestration. This is not just a token. It is proof of life, proof of work, proof that somewhere in Kenya, a forest is growing because humans chose to care.

This proof can be sold to carbon markets. It can be traded as a verified ecological asset. And the rewards flow back — 60% to the planter, 30% to the verifiers, 10% to the community treasury for shared infrastructure like nursery upgrades and boat maintenance.`,
    mood: "hopeful",
    topic: "blockchain",
    followUpQuestions: [
      "What is a digital twin?",
      "How does the blockchain work?",
      "What are carbon credits?",
      "How are rewards distributed?"
    ]
  },
  {
    id: "community-guardians",
    title: "Voices of the Basin",
    content: `Meet the guardians. They are not wearing capes — they are wearing gumboots and carrying smartphones. They are grandmothers who know which herbs grow where the soil is richest. They are young people who have learned to code blockchain transactions alongside their traditional ecological knowledge.

In the fishing cooperatives of Dunga Beach, members now monitor water quality weekly. They understand that the turbidity of today predicts the fish stocks of tomorrow. When they submit their data, they are not just earning tokens — they are writing the medical chart of a lake that 30 million people depend upon.

In the Community Forest Associations of Kakamega, elders teach the youth which trees hold the most carbon, which roots drink the deepest, which canopies shelter the rarest birds. This knowledge — once locked in oral tradition — is now being recorded, verified, and valued by global markets.

The Sango system recognizes that indigenous wisdom and blockchain technology are not opposites. They are allies. The elder who knows that planting markhamia lutea stabilizes riverbanks is now able to prove that value to a carbon registry in Switzerland. The fisherman who protects breeding grounds can demonstrate that impact to an impact investor in New York.

This is the new story of the Lake Victoria Basin: Local knowledge, global reach. Ancient wisdom, modern verification. Community action, world markets.`,
    mood: "inspiring",
    topic: "community",
    followUpQuestions: [
      "How can my community join?",
      "What traditional knowledge is valued?",
      "How are elders involved?",
      "What training is available?"
    ]
  },
  {
    id: "dual-chain",
    title: "Two Chains, One Truth",
    content: `Sango dances across two blockchains, each playing its perfect role in this ecological symphony.

On Avalanche, the C-Chain moves with sub-second finality and fees so low that a community member can afford to verify a tree planting. Here lives the Proof-of-Stewardship layer — where high-frequency, low-value verification events occur constantly. Every photo of a growing seedling, every water quality reading, every wetland restoration milestone is registered here, validated through peer confirmation and AI-assisted integrity checks.

Then, like a great river flowing to the sea, the verified data travels to Hedera. This carbon-negative network, with its enterprise-grade security and predictable micro-fees, becomes the Asset and Trust Layer. Here, the Hedera Guardian awakens — an open-source platform that transforms verified ecological data into carbon credits and ecosystem assets with auditable provenance.

When a corporation wants to offset its footprint, it can buy a credit that carries an immutable chain of custody back to the specific GPS coordinate and community steward who created it. When an impact investor seeks returns, they can fund tokenized community assets — future harvests, fishing cooperatives, even land titles — knowing the blockchain guarantees transparency.

This dual-chain architecture ensures that a farmer in Busia and a CEO in Berlin can participate in the same verified ecosystem, bound by cryptographic truth rather than paperwork and promises.`,
    mood: "educational",
    topic: "blockchain",
    followUpQuestions: [
      "What is Avalanche?",
      "What is Hedera?",
      "How do the chains connect?",
      "What are the benefits?"
    ]
  },
  {
    id: "impact-escalation",
    title: "The Guardian's Call",
    content: `Sometimes, the most valuable observation is the one that warns of danger. This is the story of the Guardian Bonus — Sango's way of ensuring that threats to the basin are caught early and addressed swiftly.

Imagine Ochieng, our community monitor, notices something wrong. The water near his monitoring point has turned an unnatural color. Dead fish float at the surface. He takes photos, records the GPS, and submits an urgent report.

The AI guardian immediately flags this as a high-priority alert. The peer validators confirm the observation with urgency. The smart contract recognizes this not as routine basin health mining, but as impact escalation — data that reveals a significant environmental concern.

Ochieng receives a Guardian Bonus — a larger token allocation funded by the ecosystem treasury. But more importantly, an automatic alert flows to the Lake Victoria Basin Commission and relevant environmental authorities. The pollution source can be identified, the damage contained, the ecosystem protected.

This system transforms every community member into an early warning network. The thousands of eyes watching the basin daily become thousands of guardians, rewarded not just for documenting health, but for sounding the alarm when that health is threatened.

In the old story, communities suffered in silence as their waters were polluted. In the Sango story, they are empowered, connected, and valued as the frontline defenders of Africa's greatest lake.`,
    mood: "urgent",
    topic: "basin-health",
    followUpQuestions: [
      "What triggers a Guardian Bonus?",
      "Who receives the alerts?",
      "How quickly is action taken?",
      "Can I report pollution anonymously?"
    ]
  },
  {
    id: "future-vision",
    title: "The Basin Reimagined",
    content: `Close your eyes and imagine the Lake Victoria Basin in 2035. The Sango network has woven a web of stewardship that spans forests and waters, communities and markets, tradition and technology.

In this future, every tree planted upstream is tracked, verified, and valued. The carbon it captures is sold to global markets, and the revenue flows directly to the community that nurtured it. Every water quality reading contributes to a real-time health dashboard that guides policy and investment.

The fishing cooperatives no longer overfish in desperation. They steward the breeding grounds because blockchain-verified sustainable practices earn them more than destructive extraction ever could. The papyrus wetlands — once drained for agriculture — are now valued as the kidney filters and fish nurseries they truly are, restored by communities who profit from their ecological function.

Elders teach youth using both oral tradition and digital tools. The knowledge of which plants heal, which trees stabilize, which practices sustain — all recorded, verified, and respected as the intellectual property of indigenous communities.

And somewhere in a classroom in Nairobi, a student learns about climate solutions by watching real-time data flow from Sango monitors across the basin. She sees that environmental protection is not sacrifice — it is opportunity. She dreams of becoming a guardian herself.

This is the world Sango is building: Where stewardship is prosperity. Where protection is profitable. Where the guardians of land and lake finally receive their due, and the basin that sustains 40 million people thrives for generations to come.`,
    mood: "hopeful",
    topic: "basin-health",
    followUpQuestions: [
      "How can I get involved?",
      "What is the roadmap?",
      "How do I start monitoring?",
      "What partnerships are planned?"
    ]
  }
];

// Storytelling response templates for different contexts
export const storytellingTemplates = {
  opening: [
    "Let me tell you a story about {topic}...",
    "Picture this: {scenario}",
    "Imagine walking through {location} at {time}...",
    "There's a tale whispered by the {element} that I think you'd like to hear..."
  ],
  
  transition: [
    "But here's where it gets interesting...",
    "And then, something extraordinary happened...",
    "What makes this story matter is...",
    "The twist in this tale is..."
  ],
  
  closing: [
    "And that is how {subject} became {outcome}.",
    "This is the story of {topic} — still being written by people like you.",
    "The chapter continues, and you could be part of it.",
    "That is the power of {concept} in action."
  ],
  
  invitation: [
    "Would you like to hear more about {topic}?",
    "Shall I tell you what happens next?",
    "There's another part of this story — shall I continue?",
    "Which thread of this tale interests you most?"
  ]
};

// Helper to get stories by topic
export function getStoriesByTopic(topic: StorySegment["topic"]): StorySegment[] {
  return sangoStories.filter(story => story.topic === topic);
}

// Helper to get a story by ID
export function getStoryById(id: string): StorySegment | undefined {
  return sangoStories.find(story => story.id === id);
}

// Helper to suggest follow-up based on user intent
export function suggestStoryFollowUp(currentStoryId: string, userMessage: string): string | null {
  const story = getStoryById(currentStoryId);
  if (!story) return null;
  
  // Simple keyword matching to suggest relevant follow-ups
  const message = userMessage.toLowerCase();
  
  for (const question of story.followUpQuestions) {
    const questionLower = question.toLowerCase();
    // Check for topic overlap
    const keywords = questionLower.split(/\s+/);
    const matchCount = keywords.filter(kw => message.includes(kw.replace(/[^a-z]/g, ""))).length;
    if (matchCount > 0) return question;
  }
  
  // Return random follow-up if no match
  return story.followUpQuestions[0];
}
