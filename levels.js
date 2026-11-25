/**
 * Jumanji: The Last Decision - 5-Level Campaign Definitions
 * Connects all 5 levels into one continuous adventure-survival storyline.
 */

export const LEVELS = [
  {
    id: 1,
    name: "Level 1: Enter the Jungle",
    subtitle: "The Emerald Awakening",
    storyIntro: "You awaken inside the untamed heart of Jumanji! Wild Jaguars, Hippos, and Cobras prowl the riverbanks. Gather the 3 Emerald Sun Crystals and cross the bridge to the Exit Portal.",
    objective: "Collect 3 Emerald Crystals (0/3)",
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
    storyIntro: "Beyond the gate lies the sunken Sun Temple. Deadly spike traps guard the stone halls. Find the 2 Golden Temple Keys, align the 3 Rune Pillars, and claim the Sacred Map!",
    objective: "Find 2 Temple Keys & Align the 3 Rune Pillars",
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
    storyIntro: "Night falls over Predator Ridge. A pack of Cursed Jade Jaguars hunts in the mist. Survive the ambush, collect 4 Survival Relics, and reach the Canyon Sanctuary!",
    objective: "Survive the Hunt & Collect 4 Survival Relics (0/4)",
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
    storyIntro: "You have reached Van Pelt's Obsidian Outpost. Heavily armored Sentinels patrol the volcanic bridges. Sabotage all 3 Dark Signal Beacons to bring down the Fortress Barrier!",
    objective: "Sabotage 3 Dark Signal Beacons (0/3)",
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
    storyIntro: "At the storm-swept summit stands the Shadow Colossus guarding the Falcon Jewel. Defeat the Boss, recover the sacred treasure, and make The Last Decision to escape Jumanji!",
    objective: "Defeat the Shadow Colossus & Claim the Falcon Jewel",
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
