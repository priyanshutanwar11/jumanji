/**
 * Jumanji: The Last Decision - Main Game Controller & UI Glue (5-Level Campaign)
 * Manages video intro, character & level selection, localStorage save/load,
 * HUD state sync, inventory, boss bar, level transitions, and 3 endings.
 */

import { JumanjiGame, PERK_POOL } from './game.js';
import { CHARACTERS } from './characters.js';
import { LEVELS } from './levels.js';
import { soundEngine } from './audio.js';

const SAVE_KEY = 'jumanji_campaign_save_v2';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new JumanjiGame(canvas);

  // Screens
  const screenIntro = document.getElementById('screen-intro');
  const screenTitle = document.getElementById('screen-title');
  const screenSelect = document.getElementById('screen-select');
  const screenEnding = document.getElementById('screen-ending');
  const screenGameOver = document.getElementById('screen-gameover');
  const gameHud = document.getElementById('game-hud');
  const cinematicBars = document.getElementById('cinematic-bars');

  // Video Intro
  const introVideo = document.getElementById('intro-video');
  const btnSkipIntro = document.getElementById('btn-skip-intro');
  const btnIntroMute = document.getElementById('btn-intro-mute');

  // Title & Select
  const btnToCharSelect = document.getElementById('btn-to-char-select');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const charsGrid = document.getElementById('chars-grid');
  const levelSelectBar = document.getElementById('level-select-bar');
  const btnConfirmAvatar = document.getElementById('btn-confirm-avatar');
  const btnBackToTitle = document.getElementById('btn-back-to-title');

  // HUD
  const hudAvatar = document.getElementById('hud-avatar');
  const hudCharName = document.getElementById('hud-char-name');
  const hudHpBar = document.getElementById('hud-hp-bar');
  const hudHpVal = document.getElementById('hud-hp-val');
  const hudStamBar = document.getElementById('hud-stam-bar');
  const hudLevelBadge = document.getElementById('hud-level-badge');
  const hudObjectiveText = document.getElementById('hud-objective-text');
  const hudScore = document.getElementById('hud-score');
  const hudCoins = document.getElementById('hud-coins');
  const hudToast = document.getElementById('hud-toast');
  const hudBossBar = document.getElementById('hud-boss-bar');
  const hudBossFill = document.getElementById('hud-boss-fill');
  const hudCombo = document.getElementById('hud-combo');
  const hudInteractPill = document.getElementById('hud-interact-pill');
  const hudInteractLabel = document.getElementById('hud-interact-label');
  const damageVignette = document.getElementById('damage-vignette');
  const floatingPopups = document.getElementById('floating-popups');
  const minimapCanvas = document.getElementById('minimap-canvas');
  const minimapCtx = minimapCanvas.getContext('2d');
  const hudAvatarCardBtn = document.getElementById('hud-avatar-card-btn');
  const chestCardModal = document.getElementById('chest-card-modal');
  const levelStoryBanner = document.getElementById('level-story-banner');
  const storyLevelTitle = document.getElementById('story-level-title');
  const storyLevelDesc = document.getElementById('story-level-desc');

  const hudAttackBtn = document.getElementById('hud-attack-btn');
  const hudAbilityBtn = document.getElementById('hud-ability-btn');
  const hudAbilityName = document.getElementById('hud-ability-name');
  const hudAbilityCd = document.getElementById('hud-ability-cd');
  const btnHudAudio = document.getElementById('btn-hud-audio');
  const btnHudRestart = document.getElementById('btn-hud-restart');

  // Inventory
  const invBerry = document.getElementById('inv-berry');
  const invSpeed = document.getElementById('inv-speed');
  const invShield = document.getElementById('inv-shield');
  const invBerryCount = document.getElementById('inv-berry-count');
  const invSpeedCount = document.getElementById('inv-speed-count');
  const invShieldCount = document.getElementById('inv-shield-count');
  const invKeyCount = document.getElementById('inv-key-count');

  // Modals
  const dialogueModal = document.getElementById('dialogue-modal');
  const dialoguePortrait = document.getElementById('dialogue-portrait');
  const dialogueSpeaker = document.getElementById('dialogue-speaker');
  const dialogueText = document.getElementById('dialogue-text');
  const dialogueOptions = document.getElementById('dialogue-options');

  const levelCompleteModal = document.getElementById('level-complete-modal');
  const lcTitle = document.getElementById('lc-title');
  const lcSubtitle = document.getElementById('lc-subtitle');
  const lcScore = document.getElementById('lc-score');
  const lcCoins = document.getElementById('lc-coins');
  const lcRank = document.getElementById('lc-rank');
  const btnNextLevel = document.getElementById('btn-next-level');

  const decisionModal = document.getElementById('decision-modal');
  const decisionCards = document.querySelectorAll('.decision-card');

  // Ending & Game Over
  const endingTitle = document.getElementById('ending-title');
  const endingSubtitle = document.getElementById('ending-subtitle');
  const endingAvatar = document.getElementById('ending-avatar');
  const endingReflection = document.getElementById('ending-reflection');
  const endingQuote = document.getElementById('ending-quote');
  const statEndAvatar = document.getElementById('stat-end-avatar');
  const statEndScore = document.getElementById('stat-end-score');
  const statEndCoins = document.getElementById('stat-end-coins');
  const statEndLives = document.getElementById('stat-end-lives');
  const btnEndingReplay = document.getElementById('btn-ending-replay');
  const btnGameOverRestart = document.getElementById('btn-gameover-restart');

  let selectedCharKey = 'bravestone';
  let selectedStartLevel = 1;
  let toastTimeout = null;
  let typewriterInterval = null;

  // --- SAVE / LOAD PROGRESS ---
  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.unlockedLevel) game.unlockedLevel = Math.min(5, Math.max(1, data.unlockedLevel));
        if (data.selectedChar && CHARACTERS[data.selectedChar]) selectedCharKey = data.selectedChar;
        if (data.highScore) game.highScore = data.highScore;
      }
    } catch (e) { /* ignore storage errors */ }
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        unlockedLevel: game.unlockedLevel,
        selectedChar: selectedCharKey,
        highScore: Math.max(game.highScore || 0, game.score)
      }));
    } catch (e) { /* ignore */ }
  }

  loadProgress();

  function showScreen(targetScreen) {
    [screenIntro, screenTitle, screenSelect, screenEnding, screenGameOver].forEach(s => {
      s.classList.remove('screen--active');
    });
    if (targetScreen) targetScreen.classList.add('screen--active');
  }

  // --- 1. INTRO VIDEO ---
  function initVideoIntro() {
    introVideo.muted = true;
    const playPromise = introVideo.play();
    if (playPromise !== undefined) playPromise.catch(() => {});

    introVideo.addEventListener('ended', finishIntro);
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
    renderLevelSelectBar();
    showScreen(screenSelect);
  });

  btnAudioToggle.addEventListener('click', () => {
    soundEngine.init();
    const muted = soundEngine.toggleMute();
    btnAudioToggle.textContent = muted ? "🔇 AUDIO: OFF" : "🔊 AUDIO: ON";
  });

  // --- 3. CHARACTER & LEVEL SELECTION ---
  function populateCharacterCards() {
    charsGrid.innerHTML = '';
    Object.keys(CHARACTERS).forEach(key => {
      const char = CHARACTERS[key];
      const card = document.createElement('div');
      card.className = `char-card ${key === selectedCharKey ? 'char-card--selected' : ''}`;
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
    document.getElementById('detail-ability-name').textContent = char.ability.name;
    document.getElementById('detail-ability-desc').textContent = char.ability.desc;

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

    const strengthsUl = document.getElementById('detail-strengths');
    strengthsUl.innerHTML = '';
    char.strengths.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      strengthsUl.appendChild(li);
    });

    const weaknessesUl = document.getElementById('detail-weaknesses');
    weaknessesUl.innerHTML = '';
    char.weaknesses.forEach(w => {
      const li = document.createElement('li');
      li.textContent = w;
      weaknessesUl.appendChild(li);
    });
  }

  function renderLevelSelectBar() {
    levelSelectBar.innerHTML = '';
    LEVELS.forEach(lvl => {
      const btn = document.createElement('button');
      const locked = lvl.id > game.unlockedLevel;
      btn.className = `lvl-pill ${lvl.id === selectedStartLevel ? 'lvl-pill--active' : ''}`;
      btn.disabled = locked;
      btn.textContent = locked ? `🔒 Lvl ${lvl.id}` : `Lvl ${lvl.id}: ${lvl.name.split(': ')[1]}`;
      btn.addEventListener('click', () => {
        selectedStartLevel = lvl.id;
        soundEngine.playSfx('click');
        renderLevelSelectBar();
      });
      levelSelectBar.appendChild(btn);
    });
  }

  populateCharacterCards();
  renderLevelSelectBar();

  btnBackToTitle.addEventListener('click', () => {
    soundEngine.playSfx('click');
    showScreen(screenTitle);
  });

  btnConfirmAvatar.addEventListener('click', () => {
    soundEngine.init();
    soundEngine.playSfx('pickup');
    saveProgress();

    game.lives = 3;
    game.score = 0;
    game.coins = 0;
    game.xp = 0;
    game.xpToNext = 100;
    game.matchLevel = 1;
    game.perks.clear();
    game.inventory = { berries: 1, speedElixir: 1, shieldCharm: 0, keys: 0 };
    hudXpFill.style.width = '0%';
    hudXpLevel.textContent = 'Level 1';

    game.setPlayerCharacter(selectedCharKey);
    startLevelSequence(selectedStartLevel);
  });

  function startLevelSequence(levelNum) {
    const char = CHARACTERS[selectedCharKey];
    game.loadLevel(levelNum);

    hudAvatar.style.backgroundPosition = char.spritePos;
    hudCharName.textContent = char.name;
    hudAbilityName.textContent = char.ability.name.split(' ')[0];
    updateLivesHUD(game.lives);
    updateHealthHUD(game.health, game.maxHealth);
    updateInventoryHUD(game.inventory);
    updateScoreHUD(game.score, game.coins);

    showScreen(null);
    gameHud.style.display = 'flex';
    cinematicBars.style.display = 'block';

    // Show Story Intro Banner during flyover
    const lvlCfg = LEVELS[levelNum - 1];
    storyLevelTitle.textContent = lvlCfg.name.toUpperCase();
    storyLevelDesc.textContent = lvlCfg.storyIntro;
    levelStoryBanner.style.display = 'block';

    game.playIntroFlyover(() => {
      cinematicBars.style.display = 'none';
      levelStoryBanner.style.display = 'none';
      showToast(`${lvlCfg.name} — ${lvlCfg.subtitle}`);
    });
  }

  // --- 4. HUD SYNC ---
  function updateHealthHUD(hp, maxHp) {
    hudHpBar.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
    hudHpVal.textContent = Math.round(hp);
  }

  function updateLivesHUD(lives) {
    for (let i = 1; i <= 3; i++) {
      const t = document.getElementById(`tattoo-${i}`);
      if (t) t.classList.toggle('tattoo-bar--lost', i > lives);
    }
  }

  function updateInventoryHUD(inv) {
    invBerryCount.textContent = inv.berries;
    invSpeedCount.textContent = inv.speedElixir;
    invShieldCount.textContent = inv.shieldCharm;
    invKeyCount.textContent = inv.keys;
  }

  function updateScoreHUD(score, coins) {
    hudScore.textContent = score;
    hudCoins.textContent = coins;
  }

  function showToast(msg) {
    if (toastTimeout) clearTimeout(toastTimeout);
    hudToast.textContent = msg;
    hudToast.classList.add('hud-toast--active');
    toastTimeout = setTimeout(() => hudToast.classList.remove('hud-toast--active'), 3600);
  }

  game.onNotification = showToast;
  game.onHealthChange = (hp, maxHp) => {
    updateHealthHUD(hp, maxHp);
    damageVignette.classList.toggle('damage-vignette--danger', hp > 0 && hp <= maxHp * 0.3);
  };
  game.onLivesChange = (lives) => {
    updateLivesHUD(lives);
    if (lives === 1) showToast("FINAL LIFE! Stay sharp!");
  };
  game.onInventoryChange = updateInventoryHUD;
  game.onScoreChange = updateScoreHUD;
  game.onSaveProgress = saveProgress;

  game.onDamageFlash = () => {
    damageVignette.classList.add('damage-vignette--flash');
    setTimeout(() => damageVignette.classList.remove('damage-vignette--flash'), 220);
  };

  game.onComboChange = (combo) => {
    if (combo > 1) {
      hudCombo.style.display = 'block';
      hudCombo.textContent = `x${combo} COMBO!`;
    } else {
      hudCombo.style.display = 'none';
    }
  };

  game.onInteractHint = (label) => {
    if (label) {
      hudInteractPill.style.display = 'block';
      hudInteractLabel.textContent = label;
    } else {
      hudInteractPill.style.display = 'none';
    }
  };

  game.onFloatingPopup = (text, color) => {
    const el = document.createElement('div');
    el.className = 'float-pop';
    el.textContent = text;
    el.style.color = color || '#ffe58f';
    el.style.left = `${46 + Math.random() * 8}%`;
    el.style.top = `${42 + Math.random() * 6}%`;
    floatingPopups.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };

  // Holographic Jumanji Chest Card ([TAB])
  function toggleChestCard() {
    const isOpen = chestCardModal.style.display === 'flex';
    if (isOpen) {
      chestCardModal.style.display = 'none';
    } else if (game.state === 'PLAYING') {
      const char = CHARACTERS[selectedCharKey];
      document.getElementById('holo-name').textContent = char.name;
      const strUl = document.getElementById('holo-strengths');
      strUl.innerHTML = char.strengths.map(s => `<li>✦ ${s}</li>`).join('');
      const weakUl = document.getElementById('holo-weaknesses');
      weakUl.innerHTML = char.weaknesses.map(w => `<li>✖ ${w}</li>`).join('');
      chestCardModal.style.display = 'flex';
      soundEngine.playSfx('click');
    }
  }

  hudAvatarCardBtn.addEventListener('click', toggleChestCard);
  chestCardModal.addEventListener('click', () => { chestCardModal.style.display = 'none'; });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab' && (game.state === 'PLAYING' || chestCardModal.style.display === 'flex')) {
      e.preventDefault();
      toggleChestCard();
    }
  });

  game.onLevelChange = (cfg) => {
    hudLevelBadge.textContent = `${cfg.name} • ${cfg.subtitle}`;
  };

  game.onBossUpdate = (boss) => {
    if (boss && !boss.defeated) {
      hudBossBar.style.display = 'block';
      hudBossFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    } else {
      hudBossBar.style.display = 'none';
    }
  };

  const hudLeaderboard = document.getElementById('hud-leaderboard');
  const hudKillfeed = document.getElementById('hud-killfeed');
  const hudXpFill = document.getElementById('hud-xp-fill');
  const hudXpLevel = document.getElementById('hud-xp-level');
  const virtualJoystick = document.getElementById('virtual-joystick');
  const joystickKnob = document.getElementById('joystick-knob');
  const perkModal = document.getElementById('perk-modal');
  const perkCards = document.getElementById('perk-cards');

  // Virtual Joystick Controller
  let joyActive = false;
  function updateJoystick(clientX, clientY) {
    const rect = virtualJoystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const maxR = rect.width / 2 - 18;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    game.joystickVec.x = dx / maxR;
    game.joystickVec.y = dy / maxR;
  }
  virtualJoystick.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    joyActive = true;
    virtualJoystick.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  });
  virtualJoystick.addEventListener('pointermove', (e) => {
    if (joyActive) updateJoystick(e.clientX, e.clientY);
  });
  const resetJoystick = () => {
    joyActive = false;
    joystickKnob.style.transform = 'translate(0px, 0px)';
    game.joystickVec.x = 0;
    game.joystickVec.y = 0;
  };
  virtualJoystick.addEventListener('pointerup', resetJoystick);
  virtualJoystick.addEventListener('pointercancel', resetJoystick);

  // XP & Level-Up Perk Picker
  game.onXPChange = (xp, xpToNext, lvl) => {
    hudXpFill.style.width = `${Math.min(100, (xp / xpToNext) * 100)}%`;
    hudXpLevel.textContent = `Level ${lvl}`;
  };

  game.onMatchLevelUp = (lvl) => {
    game.state = 'DIALOGUE';
    const choices = [...PERK_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
    perkCards.innerHTML = '';
    choices.forEach(p => {
      const card = document.createElement('div');
      card.className = 'decision-card';
      card.innerHTML = `
        <div class="decision-card-icon">${p.icon}</div>
        <h3 class="decision-card-title">${p.name}</h3>
        <p class="decision-card-desc">${p.desc}</p>
        <button class="btn btn--secondary" type="button">SELECT</button>
      `;
      card.addEventListener('click', () => {
        game.applyPerk(p.id);
        perkModal.style.display = 'none';
        game.state = 'PLAYING';
        soundEngine.playSfx('pickup');
      });
      perkCards.appendChild(card);
    });
    perkModal.style.display = 'flex';
  };

  game.onKillFeed = (killer, victim, bullseye) => {
    const item = document.createElement('div');
    item.className = 'kf-item';
    item.textContent = `${killer} 🪓 ${victim}${bullseye ? ' (BULLSEYE!)' : ''}`;
    hudKillfeed.prepend(item);
    while (hudKillfeed.children.length > 4) hudKillfeed.lastChild.remove();
    setTimeout(() => item.remove(), 4000);
  };

  // HUD Buttons
  hudAttackBtn.addEventListener('click', (e) => { e.stopPropagation(); game.throwAxe(); });
  hudAbilityBtn.addEventListener('click', () => game.triggerSpecialAbility());
  invBerry.addEventListener('click', () => game.useInventoryItem('berries'));
  invSpeed.addEventListener('click', () => game.useInventoryItem('speedElixir'));
  invShield.addEventListener('click', () => game.useInventoryItem('shieldCharm'));

  btnHudAudio.addEventListener('click', () => {
    const muted = soundEngine.toggleMute();
    btnHudAudio.textContent = muted ? "🔇" : "🔊";
  });

  btnHudRestart.addEventListener('click', returnToSelectMenu);

  // Real-time HUD & Emerald Radar Minimap Loop
  function drawMinimap() {
    const data = game.getRadarData();
    if (!data) return;
    const ctx = minimapCtx;
    const w = 112, h = 112, cx = 56, cy = 56, scale = 1.45;
    ctx.clearRect(0, 0, w, h);

    // Radar rings
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.16)';
    ctx.lineWidth = 1;
    [20, 40].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });

    const plot = (wx, wz, color, size) => {
      const dx = (wx - data.px) * scale;
      const dz = (wz - data.pz) * scale;
      const x = cx + dx, y = cy + dz;
      if (x < 6 || x > w - 6 || y < 6 || y > h - 6) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    data.collectibles.forEach(c => plot(c.x, c.z, c.type === 'coin' ? '#ffd700' : '#00ff9d', 2.4));
    data.checkpoints.forEach(cp => plot(cp.x, cp.z, cp.active ? '#38bdf8' : '#94a3b8', 3.2));
    data.enemies.forEach(e => plot(e.x, e.z, '#ff3b5c', 3.5));
    if (data.boss) plot(data.boss.x, data.boss.z, '#ff0055', 5.5);
    if (data.goal) plot(data.goal.x, data.goal.z, data.goal.active ? '#00ff9d' : '#94a3b8', 4.5);

    // Player Arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateHUDLoop() {
    requestAnimationFrame(updateHUDLoop);
    if (game.state === 'PLAYING') {
      hudStamBar.style.width = `${(game.stamina / game.maxStamina) * 100}%`;
      hudObjectiveText.textContent = game.questObjective;
      if (game.abilityCooldown > 0) {
        hudAbilityCd.style.display = 'flex';
        hudAbilityCd.textContent = Math.ceil(game.abilityCooldown);
      } else {
        hudAbilityCd.style.display = 'none';
      }
      drawMinimap();
      if (Math.random() < 0.12) {
        const lb = game.getLeaderboard();
        hudLeaderboard.innerHTML = lb.map((r, idx) =>
          `<div class="lb-row ${r.isPlayer ? 'lb-row--player' : ''}"><span>#${idx + 1} ${r.name}</span><span>${r.score}</span></div>`
        ).join('');
      }
    }
  }
  requestAnimationFrame(updateHUDLoop);

  // --- 5. DIALOGUE ---
  game.onDialogueTrigger = (data) => {
    dialogueModal.style.display = 'flex';
    dialogueSpeaker.textContent = data.speaker;
    dialoguePortrait.style.backgroundPosition = '0% 0%';

    if (typewriterInterval) clearInterval(typewriterInterval);
    dialogueText.textContent = '';
    let i = 0;
    typewriterInterval = setInterval(() => {
      if (i < data.text.length) {
        dialogueText.textContent += data.text[i++];
        if (i % 3 === 0) soundEngine.playSfx('dialogue');
      } else {
        clearInterval(typewriterInterval);
      }
    }, 22);

    dialogueOptions.innerHTML = '';
    data.replyOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        soundEngine.playSfx('click');
        if (opt.next === 'mission') {
          dialogueText.textContent = "Nigel: \"Gather the 3 Emerald Sun Crystals scattered through the jungle, watch out for stalkers, and enter the Exit Portal!\"";
        } else {
          dialogueText.textContent = "Nigel: \"You have 3 lives (wrist tattoos). Use [F] to strike, [Q] for your Special Power, and [1][2][3] for items!\"";
        }
        dialogueOptions.innerHTML = `<button class="dialogue-opt-btn" id="btn-dlg-close">Got it! (Continue)</button>`;
        document.getElementById('btn-dlg-close').addEventListener('click', () => {
          dialogueModal.style.display = 'none';
          game.state = 'PLAYING';
        });
      });
      dialogueOptions.appendChild(btn);
    });
  };

  // --- 6. LEVEL COMPLETE TRANSITION ---
  game.onLevelComplete = (lvlNum, score, coins) => {
    saveProgress();
    lcTitle.textContent = `LEVEL ${lvlNum} COMPLETE!`;
    lcSubtitle.textContent = LEVELS[lvlNum - 1].subtitle;
    lcScore.textContent = score;
    lcCoins.textContent = coins;
    lcRank.textContent = game.lives === 3 ? 'S' : (game.lives === 2 ? 'A' : 'B');
    levelCompleteModal.style.display = 'flex';
  };

  btnNextLevel.addEventListener('click', () => {
    soundEngine.playSfx('click');
    levelCompleteModal.style.display = 'none';
    const nextLvl = game.currentLevel + 1;
    if (nextLvl <= 5) {
      startLevelSequence(nextLvl);
    }
  });

  // --- 7. THE LAST DECISION & ENDINGS ---
  game.onDecisionTrigger = () => {
    decisionModal.style.display = 'flex';
  };

  decisionCards.forEach(card => {
    card.addEventListener('click', () => {
      const choice = card.dataset.choice;
      decisionModal.style.display = 'none';
      cinematicBars.style.display = 'block';
      game.playEndingCinematic(choice, (charEnding) => {
        cinematicBars.style.display = 'none';
        showEndingScreen(charEnding);
      });
    });
  });

  function showEndingScreen(charEnding) {
    saveProgress();
    gameHud.style.display = 'none';
    showScreen(screenEnding);

    const char = CHARACTERS[selectedCharKey];
    endingTitle.textContent = charEnding.title.toUpperCase();
    endingSubtitle.textContent = charEnding.subtitle;
    endingAvatar.style.backgroundPosition = char.spritePos;
    endingReflection.textContent = charEnding.reflection;
    endingQuote.textContent = charEnding.quote;

    statEndAvatar.textContent = char.name;
    statEndScore.textContent = game.score;
    statEndCoins.textContent = game.coins;
    statEndLives.textContent = `${game.lives} / 3`;
  }

  // --- 8. GAME OVER & MENU RETURN ---
  game.onGameOver = () => {
    gameHud.style.display = 'none';
    showScreen(screenGameOver);
    soundEngine.stopDrums();
  };

  btnGameOverRestart.addEventListener('click', returnToSelectMenu);
  btnEndingReplay.addEventListener('click', returnToSelectMenu);

  function returnToSelectMenu() {
    dialogueModal.style.display = 'none';
    decisionModal.style.display = 'none';
    levelCompleteModal.style.display = 'none';
    perkModal.style.display = 'none';
    levelStoryBanner.style.display = 'none';
    cinematicBars.style.display = 'none';
    gameHud.style.display = 'none';
    hudBossBar.style.display = 'none';
    soundEngine.stopDrums();
    renderLevelSelectBar();
    showScreen(screenSelect);
  }
});
