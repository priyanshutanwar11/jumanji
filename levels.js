/**
 * Jumanji: The Last Decision - 5-Level Campaign Definitions
 * Connects all 5 levels into one continuous adventure-survival storyline.
 */

export const LEVELS = [
  {
    id: 1,
    name: "Level 1: Enter the Jungle",
    subtitle: "The Emerald Awakening",
    storyIntro: "You awaken inside the untamed heart of Jumanji! Cross the twin river bridges, step on the 2 Sun & Moon Pressure Pads, and gather 3 Emerald Sun Crystals to open the Portal.",
    objective: "Step on 2 Pressure Pads & Collect 3 Crystals",
    skyColor: 0x1a3829,
    fogColor: 0x1f4230,
    fogDensity: 0.014,
    sunColor: 0xfff3cf,
    sunIntensity: 1.8,
    groundColor: 0x2d5434,
    pathColor: 0x6e7869,
    drumIntensity: 1,
    portalPos: { x: 0, z: -48 },
    requiredCrystals: 3,
    requiredKeys: 0
  },
  {
    id: 2,
    name: "Level 2: The Hidden Temple",
    subtitle: "Vault of Ancient Ciphers",
    storyIntro: "Beyond the jungle lies a sunken stone labyrinth! Pull the 2 Ancient Temple Levers, align the 3 Rune Pillars, and find 2 Golden Temple Keys to escape!",
    objective: "Pull 2 Levers, Align 3 Runes & Find 2 Keys",
    skyColor: 0x13242b,
    fogColor: 0x162b33,
    fogDensity: 0.018,
    sunColor: 0xaad4ff,
    sunIntensity: 1.3,
    groundColor: 0x2a3630,
    pathColor: 0x4f5952,
    drumIntensity: 1,
    portalPos: { x: 0, z: -52 },
    requiredCrystals: 0,
    requiredKeys: 2
  },
  {
    id: 3,
    name: "Level 3: The Wild Hunt",
    subtitle: "Twilight Predator Ridge",
    storyIntro: "Twilight falls over Twin-Canyon Ridge! Activate the 3 Crystal Pedestals in glowing sequence (1→2→3), awaken 2 Spirit Totems, and gather 4 Survival Relics!",
    objective: "Solve Sequence (0/3), 2 Totems & 4 Relics",
    skyColor: 0x261a2e,
    fogColor: 0x2e1f38,
    fogDensity: 0.017,
    sunColor: 0xffb088,
    sunIntensity: 1.4,
    groundColor: 0x3b3328,
    pathColor: 0x5c5042,
    drumIntensity: 2,
    portalPos: { x: 0, z: -54 },
    requiredCrystals: 4,
    requiredKeys: 0
  },
  {
    id: 4,
    name: "Level 4: Enemy Territory",
    subtitle: "The Obsidian Fortress",
    storyIntro: "You stand before the Volcanic Obsidian Citadel! Cross the 3 lava bridges, sabotage 3 Signal Beacons, shut down 2 Power Valves, and align 2 Obsidian Ciphers!",
    objective: "Sabotage 3 Beacons, 2 Valves & 2 Ciphers",
    skyColor: 0x291212,
    fogColor: 0x331614,
    fogDensity: 0.016,
    sunColor: 0xff7744,
    sunIntensity: 1.6,
    groundColor: 0x262022,
    pathColor: 0x3d3235,
    drumIntensity: 2,
    portalPos: { x: 0, z: -55 },
    requiredCrystals: 3, // 3 beacons
    requiredKeys: 0
  },
  {
    id: 5,
    name: "Level 5: The Final Escape",
    subtitle: "Summit of the Falcon Jewel",
    storyIntro: "At the storm-swept summit, activate the 2 Elemental Seal Pillars to shatter the Shadow Colossus's armor, defeat the Boss, and claim the Falcon Jewel!",
    objective: "Activate 2 Seals, Defeat Boss & Claim Jewel",
    skyColor: 0x0d1b2a,
    fogColor: 0x13263a,
    fogDensity: 0.013,
    sunColor: 0x00ffaa,
    sunIntensity: 1.7,
    groundColor: 0x243038,
    pathColor: 0x45525c,
    drumIntensity: 3,
    portalPos: { x: 0, z: -50 },
    requiredCrystals: 0,
    requiredKeys: 0
  }
];
