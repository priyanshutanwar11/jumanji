/**
 * Jumanji: The Last Decision - Character Data Definitions
 * 6 Unique playable avatars with distinct backstories, stats, 3D visual styles,
 * abilities, dialogues, and ending conclusions.
 */

export const CHARACTERS = {
  bravestone: {
    id: 'bravestone',
    name: 'Dr. Smolder Bravestone',
    actor: 'Dwayne Johnson',
    title: 'Fearless Archaeologist & Leader',
    bio: 'Renowned international explorer, archaeologist, and superhuman adventurer. Built like a brick fortress, Dr. Bravestone fears nothing except being unable to protect his team.',
    spritePos: '0% 0%', // top-left
    themeColor: '#e07a2c',
    stats: {
      health: 120,
      speed: 7.2,
      strength: 95,
      intellect: 80,
      stealth: 40
    },
    strengths: ['Smoldering Intensity', 'Superhuman Strength', 'Boomerang Master', 'Climbing Prowess'],
    weaknesses: ['None (Literally impervious)'],
    ability: {
      id: 'smash',
      name: 'Smoldering Smash',
      key: 'Q',
      desc: 'Channel raw muscular power to ground-pound. Shatters heavy cracked stone barriers and stuns nearby enemies for 4s.',
      cooldown: 8,
      sound: 'smash'
    },
    modelConfig: {
      height: 2.1,
      width: 0.95,
      shirtColor: 0xc4a47c,     // khaki explorer shirt
      pantsColor: 0x4a3b2c,     // dark cargo pants
      skinColor: 0xd2996c,      // tan skin
      vestColor: 0x5a422a,      // leather harness
      hasHat: false,
      hasBackpack: false,
      hasGlasses: false,
      hairStyle: 'bald'
    },
    dialogue: {
      greeting: "Smolder mode activated. Stay close, stay sharp, and don't touch any glowing skulls.",
      nigel: "Ah, Dr. Bravestone! The bravest explorer in all Jumanji! The Sun Temple's guardian has awakened, and only someone with your sheer brawn can withstand its fury.",
      replyNigel: "Nigel, consider it handled. We recover the Falcon Jewel, restore balance, and get everyone home.",
      guardian: "Big cat. Very angry. Let's see if your stone claws can break through raw smolder!",
      puzzle: "Ancient rune dials? I could figure out the symbols... or I could just smash that crumbling side gate open with my Smash ability [Q]!",
      clue: "A Falcon feather etched into stone. The ancients hid the jewel's core frequency here.",
      decisionPrompt: "The fate of Jumanji hangs on this altar. A leader makes the hard call."
    },
    endings: {
      guardian: {
        title: "The Eternal Guardian",
        subtitle: "Dr. Bravestone Seals The Wild",
        reflection: "Dr. Bravestone places the Falcon Jewel high into the mountain sanctuary. The celestial seal slams shut, stabilizing the dimensions. Bravestone chooses to remain as the immortal protector of Jumanji, watching over the untamed realm so our world can sleep peacefully.",
        quote: "\"A true hero doesn't flee when duty calls. Jumanji is safe on my watch.\""
      },
      conquer: {
        title: "The Smoldering Warlord",
        subtitle: "Dr. Bravestone Claims Primordial Might",
        reflection: "Clasping the Falcon Jewel into his chest, Bravestone harnesses the jewel's raw cosmic magic. The jungle bends to his absolute will; volcanoes rise and beasts bow. Dr. Smolder Bravestone becomes the invincible Emperor of Jumanji, sovereign of an untamed empire.",
        quote: "\"No more games. From this day forth, the jungle bows to the strongest.\""
      },
      melder: {
        title: "The Boundary Breaker",
        subtitle: "Bravestone Shatters The Game",
        reflection: "With a thunderous strike, Bravestone fractures the Falcon Jewel. Reality unravels and reweaves: the digital realm of Jumanji spills into the real world. Skyscrapers are blanketed in majestic ancient vines, and humanity steps into a thrilling new golden age of adventure alongside Bravestone.",
        quote: "\"Why live in a mundane world when we can turn the whole planet into an adventure?\""
      }
    }
  },

  oberon: {
    id: 'oberon',
    name: 'Prof. Shelly Oberon',
    actor: 'Jack Black',
    title: 'Cryptographer & Cartographer',
    bio: 'Genius professor of cartography, archaeology, and ancient languages. Not built for running or desert heat, but his encyclopedic intellect unravels any puzzle or trap instantly.',
    spritePos: '50% 0%', // top-center
    themeColor: '#4ea8de',
    stats: {
      health: 90,
      speed: 6.0,
      strength: 45,
      intellect: 98,
      stealth: 55
    },
    strengths: ['Cartography Master', 'Ancient Cryptography', 'Paleontology', 'Geometry Sight'],
    weaknesses: ['Low Endurance', 'Sun / Heat Fatigue', 'Cake'],
    ability: {
      id: 'decrypt',
      name: 'Glyph Decryption',
      key: 'Q',
      desc: 'Decode ancient runes in a flash. Instantly reveals secrets, deciphers puzzle pillars, and exposes enemy weak spots.',
      cooldown: 7,
      sound: 'decrypt'
    },
    modelConfig: {
      height: 1.8,
      width: 0.9,
      shirtColor: 0x486b4a,     // green safari jacket
      pantsColor: 0x8a7b63,     // khaki trousers
      skinColor: 0xf0c8a0,
      vestColor: 0x33442a,
      hasHat: true,             // winter fur flap hat
      hatType: 'trapper',
      hatColor: 0x3a483a,
      hasBackpack: false,
      hasSatchel: true,
      hasGlasses: true,
      hairStyle: 'beard'
    },
    dialogue: {
      greeting: "Oh great, humidity, bugs, and mystical curses. Where is my iced chai latte?",
      nigel: "Professor Oberon! Jumanji's ancient ciphers are melting down! Your cartographic brilliance is our only hope to align the Sun Altar!",
      replyNigel: "Calm down Nigel, and don't panic. Give me five minutes with these hieroglyphic dials and I'll have the whole temple unlocked.",
      guardian: "That is a Panthera Cursus, extinct for three millennia! Magnificent! Also please don't eat my face!",
      puzzle: "Look at the geometrical symmetry on these three rune pillars! With my Glyph Decryption [Q], I can align the frequencies effortlessly without guessing!",
      clue: "Fascinating! A bilingual Incan-Babylonian transcription describing the Falcon Jewel's harmonic matrix.",
      decisionPrompt: "The metaphysical equation of the Falcon Jewel... our choice will permanently alter the space-time fabric."
    },
    endings: {
      guardian: {
        title: "The Grand Archivist",
        subtitle: "Prof. Oberon Restores The Ancient Matrix",
        reflection: "Using precise geometric calibrations, Professor Oberon inserts the Falcon Jewel into the celestial cradle. The temporal anomalies vanish. Shelly documents the entire history of Jumanji in his leather notebook, publishing a monumental thesis that bridges mathematical theory and dimensional physics.",
        quote: "\"Mathematics never lies. The universe is once again in harmonic equilibrium!\""
      },
      conquer: {
        title: "The Omniscient Architect",
        subtitle: "Prof. Oberon Transcends Mortality",
        reflection: "Shelly Oberon absorbs the cosmic knowledge of the Jewel, expanding his consciousness across every leaf, stone, and animal in Jumanji. He reshapes the game into an intellectual utopia of ancient wonders, where riddles guard infinite treasures.",
        quote: "\"I see the source code of reality itself... and honestly, the syntax is exquisite.\""
      },
      melder: {
        title: "The Universal Scholar",
        subtitle: "Prof. Oberon Connects Both Realities",
        reflection: "Oberon recalibrates the Falcon Jewel to fuse Jumanji's magic directly into the World Wide Web. Video games and historical ruins seamlessly integrate with human technology, ushering in an era of boundless discovery and mystery.",
        quote: "\"Class is now in session for the entire human race. Open your textbooks to page one!\""
      }
    }
  },

  seaplane: {
    id: 'seaplane',
    name: "Jefferson 'Seaplane' McDonough",
    actor: 'Nick Jonas',
    title: 'Ace Aviator & Daredevil',
    bio: 'Charismatic combat pilot stranded in Jumanji for decades. Cool under pressure, master of aerial tactics and emergency flare flares.',
    spritePos: '100% 0%', // top-right
    themeColor: '#e63946',
    stats: {
      health: 105,
      speed: 7.6,
      strength: 70,
      intellect: 75,
      stealth: 65
    },
    strengths: ['Piloting Ace', 'Acrobatic Reflexes', 'Flare Gun Expert', 'Tactical Improvisation'],
    weaknesses: ['Mosquito Bites (Fatal)', 'Lack of Modern Intel'],
    ability: {
      id: 'flare',
      name: 'Signal Flare & Dash',
      key: 'Q',
      desc: 'Fire a blazing magnesium flare that blinds enemies, reveals hidden paths, and grants a sudden burst of dashing speed.',
      cooldown: 6,
      sound: 'flare'
    },
    modelConfig: {
      height: 1.95,
      width: 0.82,
      shirtColor: 0x4a3224,     // leather aviator jacket
      pantsColor: 0x2e3532,     // dark trousers
      skinColor: 0xdec0a2,
      vestColor: 0x7c4f34,
      hasHat: true,
      hatType: 'aviator',
      hatColor: 0x3d271d,
      hasBackpack: false,
      hasGlasses: true,         // aviator goggles
      hairStyle: 'neat'
    },
    dialogue: {
      greeting: "Engines hot, goggles down. Time to finish this flight and get back home.",
      nigel: "Captain McDonough! We need your nerves of steel. The temple sanctuary is engulfed in dark mystical storms!",
      replyNigel: "Copy that, Nigel. I've dodged anti-aircraft fire and cursed vultures. We're flying straight to the target.",
      guardian: "Contact at 12 o'clock! Pop a flare in its eyes and take the high ground!",
      puzzle: "Those rune beacons need an ignition spark. A high-yield magnesium flare [Q] can ignite the sun reflector in seconds!",
      clue: "An aviator compass reading off the charts. The Falcon Jewel acts as a magnetic vortex.",
      decisionPrompt: "Approaching the final waypoint. Time to make the call that brings us back to base."
    },
    endings: {
      guardian: {
        title: "The Sky Patrol",
        subtitle: "Seaplane McDonough Restores The Horizon",
        reflection: "Seaplane mounts the Falcon Jewel onto the highest mountain pinnacle. The storm clouds part, revealing crystalline blue skies. Free of the curse, Seaplane takes to the air in his restored biplane, flying forever as the valiant guardian angel of the Jumanji skies.",
        quote: "\"Clear skies and a full tank. We finally completed the mission, team.\""
      },
      conquer: {
        title: "The Storm Sovereign",
        subtitle: "Seaplane Commands The Skies",
        reflection: "Absorbing the Jewel's celestial fire, Seaplane commands the winds, thunder, and lightning of Jumanji. He builds a fleet of mystical sky-galleons that patrol the heavens, establishing an unshakeable realm of freedom above the clouds.",
        quote: "\"No more crash landings. Up here, we rule the weather and the stars.\""
      },
      melder: {
        title: "The Dimensional Navigator",
        subtitle: "Seaplane Opens The Skyways",
        reflection: "Shattering the dimensional barrier, Seaplane creates an open skyway between Jumanji and the modern world. Airplanes and mythical creatures now share the upper atmosphere, uniting adventurers from across the cosmos.",
        quote: "\"Pack your bags, everyone. The sky is no longer the limit!\""
      }
    }
  },

  finbar: {
    id: 'finbar',
    name: "Franklin 'Mouse' Finbar",
    actor: 'Kevin Hart',
    title: 'Zoologist & Weapons Valet',
    bio: 'Brilliant zoologist with an encyclopedia of animal instincts and a bottomless backpack of survival gear. Never stops complaining, but his animal kinship can befriend the deadliest predators.',
    spritePos: '0% 100%', // bottom-left
    themeColor: '#52b788',
    stats: {
      health: 85,
      speed: 6.8,
      strength: 40,
      intellect: 85,
      stealth: 70
    },
    strengths: ['Zoology Expert', 'Beast Communication', 'Weapons Bag Valet', 'Eagle Eye'],
    weaknesses: ['Cake (Instant Detonation)', 'Low Physical Strength', 'Speed'],
    ability: {
      id: 'whisper',
      name: 'Beast Whisper',
      key: 'Q',
      desc: 'Play ancient calming frequencies that soothe ferocious beasts, turning the temple guardian peaceful, and uncovering hidden animal clues.',
      cooldown: 8,
      sound: 'whisper'
    },
    modelConfig: {
      height: 1.65,
      width: 0.78,
      shirtColor: 0x82775a,     // khaki ranger shirt
      pantsColor: 0x474032,     // ranger shorts
      skinColor: 0x7a4b2a,      // dark skin
      vestColor: 0xb53526,      // bright red neck scarf
      hasHat: true,             // safari bucket hat
      hatType: 'bucket',
      hatColor: 0xc4b28d,
      hasBackpack: true,        // giant backpack
      backpackColor: 0x5a4a35,
      hasGlasses: false,
      hairStyle: 'short'
    },
    dialogue: {
      greeting: "Why am I always carrying everybody's heavy backpacks?! And if anybody offers me cake, I will scream!",
      nigel: "Franklin Finbar! The legendary beasts of the Sun Sanctuary are agitated by the curse! Only a zoologist can soothe them!",
      replyNigel: "Yeah yeah, 'soothe them'—while they try to bite my head off! Fine, let me get my zoology notes ready.",
      guardian: "Look at those jaw muscles! That is an apex predator! Don't shoot! I'll talk to him with my Beast Whisper [Q]!",
      puzzle: "Wait a second, these carvings aren't runes, they're animal trail signs! The temple monkeys marked the exact sequence!",
      clue: "Guano and bird markings. The Falcon Jewel has been revered by predator birds for ten centuries.",
      decisionPrompt: "Look at all the animals looking at us... whatever we decide, we can't let their home get destroyed!"
    },
    endings: {
      guardian: {
        title: "The Animal Sovereign",
        subtitle: "Mouse Finbar Heals The Wilds",
        reflection: "Finbar carefully returns the Falcon Jewel to the mountain nest. A wave of emerald tranquility sweeps over Jumanji. Every beast from rhinos to jaguars bows in gratitude. Franklin becomes the beloved protector and spokesman for all creatures of the jungle.",
        quote: "\"See? You don't have to punch everything! Sometimes you just gotta have a little conversation!\""
      },
      conquer: {
        title: "The King of Beasts",
        subtitle: "Finbar Commands The Great Stampede",
        reflection: "Claiming the Falcon Jewel's primal power, Finbar unites all animals into an invincible army of nature. No poacher, villain, or dark sorcerer will ever threaten Jumanji again under his watchful, loud-mouthed rule.",
        quote: "\"Who said the little guy with the backpack can't run the whole jungle? Call me King Finbar!\""
      },
      melder: {
        title: "The Wildlife Emancipator",
        subtitle: "Finbar Welcomes The World to Nature",
        reflection: "Finbar breaks the boundary, letting Jumanji's wondrous creatures roam freely in Earth's protected national parks. Humanity rediscovers a profound harmony with nature, guided by Finbar's bestselling zoological treaties.",
        quote: "\"Nature is free, the animals are happy, and nobody ever gave me cake. Perfect ending!\""
      }
    }
  },

  ruby: {
    id: 'ruby',
    name: 'Ruby Roundhouse',
    actor: 'Karen Gillan',
    title: 'Martial Artist & "Killer of Men"',
    bio: 'World-class martial arts master and commando acrobat. Specializes in dance-fighting, capoeira, karate, and nunchucks. Lethal, agile, and utterly relentless.',
    spritePos: '50% 100%', // bottom-center
    themeColor: '#ff0054',
    stats: {
      health: 110,
      speed: 8.5,
      strength: 85,
      intellect: 75,
      stealth: 80
    },
    strengths: ['Dance Fighting Master', 'Karate & Jujitsu', 'Acrobatic Wall-Run', 'Nunchucks'],
    weaknesses: ['Venom (Susceptible)'],
    ability: {
      id: 'kick',
      name: 'Dance Fighting Whirlwind',
      key: 'Q',
      desc: 'Execute a lightning-fast spinning martial arts combo. Smashes multiple obstacles, knocks out enemies, and triggers high aerial switches.',
      cooldown: 5,
      sound: 'kick'
    },
    modelConfig: {
      height: 1.88,
      width: 0.76,
      shirtColor: 0x9e1b32,     // crimson crop top
      pantsColor: 0x3d4834,     // green camo combat shorts
      skinColor: 0xf3cfba,
      vestColor: 0x222222,      // black harness belts
      hasHat: false,
      hasBackpack: false,
      hasGlasses: false,
      hairStyle: 'redPigtails', // auburn / ginger braids
      hairColor: 0xb84224
    },
    dialogue: {
      greeting: "Why am I wearing short-shorts in the jungle? Whatever. Cue the music, let's kick some butt.",
      nigel: "Ruby Roundhouse! The temple guards have sealed the sanctum with enchanted battle mechanisms!",
      replyNigel: "Enchanted or not, Nigel, nothing stands in the way of a good rhythm and a flying spin-kick.",
      guardian: "Impressive reflexes, cat. But you haven't seen a Capoeira roundhouse kick yet!",
      puzzle: "These three pressure pillars are synchronized to a rhythm! A Whirlwind Dance Combo [Q] will trigger all three at once!",
      clue: "Ancient martial stances carved into the temple pillars. The ancients danced to open the jewel chamber.",
      decisionPrompt: "We didn't fight our way through this entire temple just to back down now. Let's make the winning move."
    },
    endings: {
      guardian: {
        title: "The Champion of Balance",
        subtitle: "Ruby Roundhouse Protects The Sanctuary",
        reflection: "With breathtaking acrobatics, Ruby leaps to the highest temple perch and sets the Falcon Jewel in place. The sacred sanctuary radiates with eternal light. Ruby establishes an ancient dojo atop the ruins, training the next generation of guardians.",
        quote: "\"Balance is restored. And we did it with style, rhythm, and precision.\""
      },
      conquer: {
        title: "The Martial Empress",
        subtitle: "Ruby Ascends as Queen of Warriors",
        reflection: "Ruby draws the Jewel's kinetic magic into her combat stances. She becomes an unstoppable force of nature, unmatched in martial prowess across all dimensions, leading Jumanji's warrior tribes into glory.",
        quote: "\"Nobody tells the Killer of Men what she can or cannot accomplish. The throne is mine.\""
      },
      melder: {
        title: "The Liberation Fighter",
        subtitle: "Ruby Frees Every Trapped Soul",
        reflection: "Ruby shatters the jewel with a pinpoint kick, collapsing the barrier between game and reality. Trapped avatars and humans are reunited in the real world, celebrated as legendary heroes of both realms.",
        quote: "\"No more cages. Every player, every soul, is finally free to live their own story.\""
      }
    }
  },

  ming: {
    id: 'ming',
    name: 'Ming Fleetfoot',
    actor: 'Awkwafina',
    title: 'Master Thief & Cat Burglar',
    bio: 'World-renowned burglar and lockpick specialist. Silent as a shadow, quick-fingered, and capable of bypassing any mechanical trap or security lock in existence.',
    spritePos: '100% 100%', // bottom-right
    themeColor: '#7209b7',
    stats: {
      health: 95,
      speed: 8.2,
      strength: 55,
      intellect: 88,
      stealth: 98
    },
    strengths: ['Master Lockpicking', 'Pickpocketing', 'Silent Cat Burglar', 'Shadow Invisibility'],
    weaknesses: ['Pollen (Severe Allergic Reaction)'],
    ability: {
      id: 'lockpick',
      name: 'Shadow Cloak & Pick',
      key: 'Q',
      desc: 'Vanish into the shadows for 5s and pick any locked gate or puzzle mechanism instantly without needing keys or clues.',
      cooldown: 6,
      sound: 'lockpick'
    },
    modelConfig: {
      height: 1.72,
      width: 0.74,
      shirtColor: 0x1f1f2e,     // dark stealth coat
      pantsColor: 0x181822,
      skinColor: 0xf5d6bd,
      vestColor: 0x3a2c47,
      hasHat: false,
      hasBackpack: false,
      hasCloak: true,           // hooded cloak
      cloakColor: 0x241d33,
      hasGlasses: false,
      hairStyle: 'topknot',
      hairColor: 0x111111
    },
    dialogue: {
      greeting: "Alright, keep your hands off my pockets and stay out of my line of sight. Let's do this heist.",
      nigel: "Ming Fleetfoot! The Sun Vault is sealed with seven locks forged by the ancient sun-priests!",
      replyNigel: "Seven locks? That's child's play, Nigel. I broke out of the Cairo royal vault with a paperclip.",
      guardian: "Whoa, kitty got big claws. Good thing you can't bite what you can't see!",
      puzzle: "Puzzles? Puzzles are for amateurs who don't know how to pick a lock. One touch of my Shadow Pick [Q] and that gate swings right open.",
      clue: "A hidden keyhole behind the vines. The ancients thought they were so clever.",
      decisionPrompt: "The ultimate treasure of Jumanji is right in front of us. Biggest score of my life."
    },
    endings: {
      guardian: {
        title: "The Phantom Sentinel",
        subtitle: "Ming Fleetfoot Safekeeps The Secret",
        reflection: "Ming uses her master craft to lock the Falcon Jewel deep inside the impenetrable mountain vault, resetting the tumbler combinations to an impossible sequence. Jumanji is sealed against greedy warlords forever, with Ming as its silent shadow keeper.",
        quote: "\"If nobody can steal it, nobody can abuse it. The vault is locked for good.\""
      },
      conquer: {
        title: "The Queen of Shadows",
        subtitle: "Ming Steals The Infinite Realm",
        reflection: "Ming slips the Falcon Jewel into her pocket, claiming its reality-warping power. She rules the shadows of Jumanji, possessing infinite wealth, unseen treasures, and absolute phantom dominance over the realm.",
        quote: "\"They called it a sacred relic. I call it the greatest heist in dimensional history!\""
      },
      melder: {
        title: "The Robin Hood of Worlds",
        subtitle: "Ming Distributes The Magic",
        reflection: "Ming shatters the jewel into a million glittering shards, scattering the magic across both the digital and real worlds. Wonder, joy, and miraculous luck are unlocked for every living person across the globe.",
        quote: "\"Steal from the gods, give to the world. Now that's what I call a clean getaway.\""
      }
    }
  }
};
