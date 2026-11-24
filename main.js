/**
 * Jumanji: The Last Decision - Main Game Controller & UI Glue
 * Manages video intro, character selection carousel, HUD state sync,
 * interactive dialogue typewriter, ending choices, and audio toggling.
 */

import { JumanjiGame } from './game.js';
import { CHARACTERS } from './characters.js';
import { soundEngine } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new JumanjiGame(canvas);

  // Screen Elements
  const screenIntro = document.getElementById('screen-intro');
  const screenTitle = document.getElementById('screen-title');
  const screenSelect = document.getElementById('screen-select');
  const screenEnding = document.getElementById('screen-ending');
  const screenGameOver = document.getElementById('screen-gameover');
  const gameHud = document.getElementById('game-hud');
  const cinematicBars = document.getElementById('cinematic-bars');

  // Video Intro Elements
  const introVideo = document.getElementById('intro-video');
  const btnSkipIntro = document.getElementById('btn-skip-intro');
  const btnIntroMute = document.getElementById('btn-intro-mute');

  // Title Screen Elements
  const btnToCharSelect = document.getElementById('btn-to-char-select');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');

  // Character Select Elements
  const charsGrid = document.getElementById('chars-grid');
  const btnConfirmAvatar = document.getElementById('btn-confirm-avatar');
  const btnBackToTitle = document.getElementById('btn-back-to-title');

  // HUD Elements
  const hudAvatar = document.getElementById('hud-avatar');
  const hudCharName = document.getElementById('hud-char-name');
  const hudHpBar = document.getElementById('hud-hp-bar');
  const hudHpVal = document.getElementById('hud-hp-val');
  const hudStamBar = document.getElementById('hud-stam-bar');
  const hudObjectiveText = document.getElementById('hud-objective-text');
  const hudGlyphCount = document.getElementById('hud-glyph-count');
  const hudToast = document.getElementById('hud-toast');
  const hudAbilityBtn = document.getElementById('hud-ability-btn');
  const hudAbilityName = document.getElementById('hud-ability-name');
  const hudAbilityCd = document.getElementById('hud-ability-cd');
  const btnHudAudio = document.getElementById('btn-hud-audio');
  const btnHudRestart = document.getElementById('btn-hud-restart');

  // Dialogue Modal Elements
  const dialogueModal = document.getElementById('dialogue-modal');
  const dialoguePortrait = document.getElementById('dialogue-portrait');
  const dialogueSpeaker = document.getElementById('dialogue-speaker');
  const dialogueText = document.getElementById('dialogue-text');
  const dialogueOptions = document.getElementById('dialogue-options');

  // Decision Modal Elements
  const decisionModal = document.getElementById('decision-modal');
  const decisionCards = document.querySelectorAll('.decision-card');

  // Ending Screen Elements
  const endingTitle = document.getElementById('ending-title');
  const endingSubtitle = document.getElementById('ending-subtitle');
  const endingAvatar = document.getElementById('ending-avatar');
  const endingReflection = document.getElementById('ending-reflection');
  const endingQuote = document.getElementById('ending-quote');
  const statEndAvatar = document.getElementById('stat-end-avatar');
  const statEndGlyphs = document.getElementById('stat-end-glyphs');
  const statEndLives = document.getElementById('stat-end-lives');
  const statEndGuardian = document.getElementById('stat-end-guardian');
  const btnEndingReplay = document.getElementById('btn-ending-replay');
  const btnGameOverRestart = document.getElementById('btn-gameover-restart');

  let selectedCharKey = 'bravestone';
  let toastTimeout = null;
  let typewriterInterval = null;

  // --- SCREEN SWITCHER ---
  function showScreen(targetScreen) {
    [screenIntro, screenTitle, screenSelect, screenEnding, screenGameOver].forEach(s => {
      s.classList.remove('screen--active');
    });
    if (targetScreen) {
      targetScreen.classList.add('screen--active');
    }
  }

  // --- 1. INTRO VIDEO HANDLING ---
  function initVideoIntro() {
    introVideo.muted = true; // Required for reliable autoplay in modern browsers
    const playPromise = introVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked: user can click skip or play
      });
    }

    introVideo.addEventListener('ended', () => {
      finishIntro();
    });

    btnSkipIntro.addEventListener('click', () => {
      soundEngine.init();
      soundEngine.playSfx('click');
      finishIntro();
    });

    btnIntroMute.addEventListener('click', () => {
      introVideo.muted = !introVideo.muted;
      btnIntroMute.textContent = introVideo.muted ? "🔊 UNMUTE" : "🔇 MUTE";
    });
  }

  function finishIntro() {
    introVideo.pause();
    showScreen(screenTitle);
  }

  initVideoIntro();

  // --- 2. TITLE SCREEN ---
  btnToCharSelect.addEventListener('click', () => {
    soundEngine.init();
    soundEngine.playSfx('click');
    showScreen(screenSelect);
  });

  btnAudioToggle.addEventListener('click', () => {
    soundEngine.init();
    const muted = soundEngine.toggleMute();
    btnAudioToggle.textContent = muted ? "🔇 AUDIO: OFF" : "🔊 AUDIO: ON";
  });

  // --- 3. CHARACTER SELECTION SCREEN ---
  function populateCharacterCards() {
    charsGrid.innerHTML = '';
    const charKeys = Object.keys(CHARACTERS);

    charKeys.forEach(key => {
      const char = CHARACTERS[key];
      const card = document.createElement('div');
      card.className = `char-card ${key === selectedCharKey ? 'char-card--selected' : ''}`;
      card.dataset.charId = key;

      card.innerHTML = `
        <div class="char-avatar-crop" style="background-position: ${char.spritePos};"></div>
        <div class="char-name">${char.name}</div>
        <div class="char-actor">${char.actor}</div>
        <div class="char-role-badge">${char.title}</div>
      `;

      card.addEventListener('click', () => {
        selectedCharKey = key;
        soundEngine.playSfx('click');
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('char-card--selected'));
        card.classList.add('char-card--selected');
        updateCharacterDetailDossier(char);
      });

      charsGrid.appendChild(card);
    });

    updateCharacterDetailDossier(CHARACTERS[selectedCharKey]);
  }

  function updateCharacterDetailDossier(char) {
    document.getElementById('detail-name').textContent = char.name;
    document.getElementById('detail-title').textContent = `${char.title} (Played by ${char.actor})`;
    document.getElementById('detail-desc').textContent = char.bio;

    // Ability
    document.getElementById('detail-ability-name').textContent = char.ability.name;
    document.getElementById('detail-ability-desc').textContent = char.ability.desc;

    // Stats
    document.getElementById('stat-health-val').textContent = char.stats.health;
    document.getElementById('stat-health-fill').style.width = `${(char.stats.health / 140) * 100}%`;

    document.getElementById('stat-speed-val').textContent = char.stats.speed;
    document.getElementById('stat-speed-fill').style.width = `${(char.stats.speed / 10) * 100}%`;

    document.getElementById('stat-strength-val').textContent = char.stats.strength;
    document.getElementById('stat-strength-fill').style.width = `${char.stats.strength}%`;

    document.getElementById('stat-intellect-val').textContent = char.stats.intellect;
    document.getElementById('stat-intellect-fill').style.width = `${char.stats.intellect}%`;

    document.getElementById('stat-stealth-val').textContent = char.stats.stealth;
    document.getElementById('stat-stealth-fill').style.width = `${char.stats.stealth}%`;

    // Strengths
    const strengthsUl = document.getElementById('detail-strengths');
    strengthsUl.innerHTML = '';
    char.strengths.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      strengthsUl.appendChild(li);
    });

    // Weaknesses
    const weaknessesUl = document.getElementById('detail-weaknesses');
    weaknessesUl.innerHTML = '';
    char.weaknesses.forEach(w => {
      const li = document.createElement('li');
      li.textContent = w;
      weaknessesUl.appendChild(li);
    });
  }

  populateCharacterCards();

  btnBackToTitle.addEventListener('click', () => {
    soundEngine.playSfx('click');
    showScreen(screenTitle);
  });

  btnConfirmAvatar.addEventListener('click', () => {
    soundEngine.init();
    soundEngine.playSfx('pickup');

    // Setup game avatar
    game.setPlayerCharacter(selectedCharKey);
    const char = CHARACTERS[selectedCharKey];

    // Update HUD
    hudAvatar.style.backgroundPosition = char.spritePos;
    hudCharName.textContent = char.name;
    hudAbilityName.textContent = char.ability.name.split(' ')[0];
    updateLivesHUD(game.lives);
    updateHealthHUD(game.health, game.maxHealth);

    // Transition screens
    showScreen(null); // Hide menu screens
    gameHud.style.display = 'flex';
    cinematicBars.style.display = 'block';

    // Cinematic Intro Flyover
    game.playIntroFlyover(() => {
      cinematicBars.style.display = 'none';
      showToast(`Welcome to Jumanji, ${char.name}! [WASD] to explore.`);
    });
  });

  // --- 4. HUD EVENT HOOKS ---
  function updateHealthHUD(hp, maxHp) {
    const pct = Math.max(0, (hp / maxHp) * 100);
    hudHpBar.style.width = `${pct}%`;
    hudHpVal.textContent = Math.round(hp);
  }

  function updateLivesHUD(lives) {
    for (let i = 1; i <= 3; i++) {
      const tattoo = document.getElementById(`tattoo-${i}`);
      if (tattoo) {
        if (i <= lives) {
          tattoo.classList.remove('tattoo-bar--lost');
        } else {
          tattoo.classList.add('tattoo-bar--lost');
        }
      }
    }
  }

  function showToast(msg) {
    if (toastTimeout) clearTimeout(toastTimeout);
    hudToast.textContent = msg;
    hudToast.classList.add('hud-toast--active');
    toastTimeout = setTimeout(() => {
      hudToast.classList.remove('hud-toast--active');
    }, 3800);
  }

  game.onNotification = (msg) => showToast(msg);
  game.onHealthChange = (hp, max) => updateHealthHUD(hp, max);
  game.onLivesChange = (lives) => updateLivesHUD(lives);
  game.onGlyphCollected = (cur, total) => {
    hudGlyphCount.textContent = `${cur} / ${total}`;
  };

  // Ability Button in HUD click
  hudAbilityBtn.addEventListener('click', () => {
    game.triggerSpecialAbility();
  });

  // HUD Audio Toggle
  btnHudAudio.addEventListener('click', () => {
    const muted = soundEngine.toggleMute();
    btnHudAudio.textContent = muted ? "🔇" : "🔊";
  });

  // HUD Restart Button
  btnHudRestart.addEventListener('click', () => {
    restartGame();
  });

  // --- 5. REAL-TIME HUD STATUS LOOP ---
  function updateHUDLoop() {
    requestAnimationFrame(updateHUDLoop);

    if (game.state === 'PLAYING') {
      // Stamina Bar
      const stamPct = (game.stamina / game.maxStamina) * 100;
      hudStamBar.style.width = `${stamPct}%`;

      // Objective Text
      hudObjectiveText.textContent = game.questObjective;

      // Special Ability Cooldown
      if (game.abilityCooldown > 0) {
        hudAbilityCd.style.display = 'flex';
        hudAbilityCd.textContent = Math.ceil(game.abilityCooldown);
      } else {
        hudAbilityCd.style.display = 'none';
      }
    }
  }
  requestAnimationFrame(updateHUDLoop);

  // --- 6. DIALOGUE SYSTEM ---
  game.onDialogueTrigger = (data) => {
    dialogueModal.style.display = 'flex';
    dialogueSpeaker.textContent = data.speaker;
    dialoguePortrait.style.backgroundPosition = '0% 0%'; // Nigel

    // Typewriter effect
    if (typewriterInterval) clearInterval(typewriterInterval);
    dialogueText.textContent = '';
    let charIdx = 0;
    const fullText = data.text;

    typewriterInterval = setInterval(() => {
      if (charIdx < fullText.length) {
        dialogueText.textContent += fullText[charIdx];
        if (charIdx % 3 === 0) soundEngine.playSfx('dialogue');
        charIdx++;
      } else {
        clearInterval(typewriterInterval);
      }
    }, 25);

    // Options
    dialogueOptions.innerHTML = '';
    data.replyOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        soundEngine.playSfx('click');
        if (opt.next === 'mission') {
          dialogueText.textContent = "Nigel: \"The Sun Altar at the temple apex is sealed by three ancient rune pillars. Align the runes or use your unique abilities to unlock the sanctum! Beware the Jade Guardian patrolling the courtyard!\"";
          dialogueOptions.innerHTML = `
            <button class="dialogue-opt-btn" id="btn-dialogue-close">Let's do this! (Begin Mission)</button>
          `;
          document.getElementById('btn-dialogue-close').addEventListener('click', () => {
            dialogueModal.style.display = 'none';
            game.state = 'PLAYING';
            showToast("Mission Started: Align the Rune Pillars or use [Q] Ability!");
          });
        } else {
          dialogueText.textContent = "Nigel: \"Remember the three rules of Jumanji: You have 3 lives (check your wrist tattoos), each avatar possesses distinct mastery, and the fate of reality rests on The Last Decision!\"";
          dialogueOptions.innerHTML = `
            <button class="dialogue-opt-btn" id="btn-dialogue-close2">Understood, Nigel!</button>
          `;
          document.getElementById('btn-dialogue-close2').addEventListener('click', () => {
            dialogueModal.style.display = 'none';
            game.state = 'PLAYING';
          });
        }
      });
      dialogueOptions.appendChild(btn);
    });
  };

  // --- 7. THE LAST DECISION & ENDINGS ---
  game.onDecisionTrigger = () => {
    decisionModal.style.display = 'flex';
  };

  decisionCards.forEach(card => {
    card.addEventListener('click', () => {
      const choice = card.dataset.choice;
      decisionModal.style.display = 'none';
      cinematicBars.style.display = 'block';

      // Play dramatic cinematic ending sequence
      game.playEndingCinematic(choice, (charEnding) => {
        cinematicBars.style.display = 'none';
        showEndingScreen(choice, charEnding);
      });
    });
  });

  function showEndingScreen(choice, charEnding) {
    gameHud.style.display = 'none';
    showScreen(screenEnding);

    const char = CHARACTERS[selectedCharKey];
    endingTitle.textContent = charEnding.title.toUpperCase();
    endingSubtitle.textContent = charEnding.subtitle;
    endingAvatar.style.backgroundPosition = char.spritePos;
    endingReflection.textContent = charEnding.reflection;
    endingQuote.textContent = charEnding.quote;

    statEndAvatar.textContent = char.name;
    statEndGlyphs.textContent = `${game.collectedGlyphs} / ${game.totalGlyphs}`;
    statEndLives.textContent = `${game.lives} / 3`;
    statEndGuardian.textContent = game.guardianPacified ? 'Pacified (Companion)' : (game.guardianStunTimer > 0 ? 'Defeated' : 'Bypassed');
  }

  // --- 8. GAME OVER & REPLAY ---
  game.onGameOver = () => {
    gameHud.style.display = 'none';
    showScreen(screenGameOver);
    soundEngine.stopDrums();
  };

  btnGameOverRestart.addEventListener('click', () => {
    restartGame();
  });

  btnEndingReplay.addEventListener('click', () => {
    restartGame();
  });

  function restartGame() {
    dialogueModal.style.display = 'none';
    decisionModal.style.display = 'none';
    cinematicBars.style.display = 'none';
    gameHud.style.display = 'none';

    // Reset game state
    game.lives = 3;
    game.health = 100;
    game.collectedGlyphs = 0;
    game.gateUnlocked = false;
    game.crackedWallBroken = false;
    game.guardianPacified = false;
    game.guardianStunTimer = 0;
    game.stealthTimer = 0;
    game.sunPillars.forEach(p => { p.solved = false; p.currentAngle = (p.id * 90) % 360; });
    game.questObjective = "Speak with Nigel Billingsley at the Temple Gate";
    hudGlyphCount.textContent = "0 / 3";

    soundEngine.stopDrums();
    showScreen(screenSelect);
  }
});
