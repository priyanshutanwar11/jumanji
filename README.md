# JUMANJI: THE LAST DECISION 🕹️🌿
### A 3D RPG Adventure of Mystery, Choices, and Survival

*The sacred Falcon Jewel of the Sun is unstable, fracturing reality between Jumanji and our world. Step into the avatar of one of 6 legendary heroes, brave the Sun Temple ruins, overcome the Cursed Jade Guardian, and make The Last Decision.*

---

## 🌟 Key Features

1. **Cinematic Introduction**:
   - Plays the authentic Jumanji opening sequence (`jumanji_intro.mp4`) with skip option and audio toggles.
   - Dynamic 3D flyover camera introducing the ancient Sun Temple ruins and Nigel Billingsley.

2. **6 Unique Playable Characters (from *Jumanji: The Next Level*)**:
   - **Dr. Smolder Bravestone**: Superhuman strength, fearless explorer. Special Ability: *Smoldering Smash* (shatters heavy stone walls, stuns enemies).
   - **Prof. Shelly Oberon**: Genius cryptographer and cartographer. Special Ability: *Glyph Decryption* (instantly decodes ancient rune locks).
   - **Jefferson 'Seaplane' McDonough**: Ace aviator and daredevil. Special Ability: *Signal Flare & Dash* (blinds guardian, granting speed surges).
   - **Franklin 'Mouse' Finbar**: Zoologist and valet. Special Ability: *Beast Whisper* (pacifies the deadly guardian predator into a peaceful companion).
   - **Ruby Roundhouse**: Martial artist & "Killer of Men". Special Ability: *Dance Fighting Whirlwind* (rapid spin-kicks that strike all switches and defeat enemies).
   - **Ming Fleetfoot**: Master cat burglar and thief. Special Ability: *Shadow Cloak & Pick* (invisibility and instant mechanical lockpicking).

3. **Compact Explorable 3D Level**:
   - Built with **Three.js** (WebGL).
   - Stepped pyramid temple, mossy stone pillars, tropical palm trees, ferns, flaming torches, reflective sacred water pool, destructible secret passages, and the floating Falcon Jewel.

4. **Dynamic AI Obstacle: The Cursed Jade Guardian**:
   - Ancient predator beast with patrol routes, realistic vision cone, alert states (`?` and `!`), and chase mechanics.
   - Overcome via combat, stealth, blinding flares, stunning smashes, or animal whisper pacification!

5. **Puzzles & Collectibles**:
   - **The Sun Altar Rune Lock**: 3 rotating celestial cylinders that can be manually aligned or bypassed with character special abilities.
   - **3 Falcon Glyphs** and **Healing Jumanji Berries** hidden throughout the ruins.

6. **Character-Influenced Dialogue**:
   - Interactive conversation with Nigel Billingsley featuring typewriter effects, sound chimes, and character-specific replies.

7. **Multiple Climactic Endings**:
   - **Ending 1: The Guardian's Oath (Restore & Protect)** — Return the Jewel to the mountain roost, sealing the curse forever.
   - **Ending 2: The Conqueror's Ascension (Claim the Power)** — Seize the primordial magic, becoming the eternal ruler of Jumanji.
   - **Ending 3: The World Melder (Shatter the Boundary)** — Break the jewel, merging the digital game reality with the real world.
   - Each ending features choreographed cinematic camera pans, custom narrative reflections, and unique character epilogue quotes.

8. **Dynamic Sound Engine (Web Audio API)**:
   - Polyrhythmic tribal Jumanji drums that intensify during pursuit or boss encounters.
   - Footstep sounds, jumps, ability audio, guardian roars, dialogue blips, and victorious fanfares.

---

## 🎮 Controls

| Action | Key / Input |
|---|---|
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Sprint** | Hold `Shift` (uses Stamina) |
| **Jump** | `Spacebar` |
| **Interact / Talk / Rotate** | `E` |
| **Special Ability** | `Q` or Click HUD Ability Button |
| **Camera Orbit** | Click & Drag Mouse / Touchpad |
| **Camera Zoom** | Mouse Scroll Wheel |

---

## 🚀 How to Run Locally

Because this game uses standard ES modules (`import * as THREE from './three.module.js'`) and HTML5 video streaming, run it with any local HTTP server:

```bash
# Option 1: npx serve
npx serve .

# Option 2: Python built-in server
python -m http.server 8000

# Option 3: Node http-server
npx http-server -p 8000
```

Then open `http://localhost:8000` (or the port displayed in your terminal) in any modern web browser (Chrome, Edge, Firefox, Safari).
