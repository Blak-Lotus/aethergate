/**
 * clickerLogic.js
 * Full Aether Clicker game logic — UMD for Node.js + browser.
 *
 * Node.js:  const cl = require('./game-logic/clickerLogic');
 * Browser:  <script src="game-logic/clickerLogic.js"></script>
 *           then use window.ClickerLogic
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ClickerLogic = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ── Upgrade definitions ────────────────────── */
  const UPGRADES = [
    { id: 'focus',    name: 'Energy Focus',   desc: '×2 per click',        cost: 50,   type: 'multiplier', factor: 2 },
    { id: 'auto1',    name: 'Auto Pulse',      desc: '+1 energy/sec',       cost: 200,  type: 'auto',       value: 1 },
    { id: 'surge',    name: 'Surge Field',     desc: '×3 per click',        cost: 500,  type: 'multiplier', factor: 3 },
    { id: 'auto2',    name: 'Vortex Core',     desc: '+5 energy/sec',       cost: 1200, type: 'auto',       value: 5 },
    { id: 'hyper',    name: 'Hyper Node',      desc: '×10 per click',       cost: 5000, type: 'multiplier', factor: 10 },
    { id: 'quantum',  name: 'Quantum Lattice', desc: '+25 energy/sec',      cost: 20000,type: 'auto',       value: 25 },
    { id: 'nexus',    name: 'Aether Nexus',    desc: '×50 per click',       cost: 80000,type: 'multiplier', factor: 50 },
  ];

  /* ── Boss definitions ───────────────────────── */
  function bossForLevel(level) {
    return {
      name:   `Void Titan L${level}`,
      maxHp:  level * 250,
      hp:     level * 250,
      reward: level * 600,
    };
  }

  /* ── XP required for next level ─────────────── */
  function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.55, level - 1));
  }

  /* ── Create a fresh player state ─────────────── */
  function createNewPlayer() {
    return {
      energy:       0,
      totalClicks:  0,
      perClick:     1,
      autoRate:     0,
      level:        1,
      xp:           0,
      xpMax:        xpForLevel(1),
      bossesDefeated: 0,
      prestige:     0,
      upgrades:     {},      // id → true when purchased
      bossActive:   false,
      boss:         null,
      lastSave:     Date.now(),
    };
  }

  /* ── Apply a click ───────────────────────────── */
  function applyClick(player) {
    const prestigeBonus = 1 + player.prestige * 0.5;
    const gained        = Math.ceil(player.perClick * prestigeBonus);
    player.energy      += gained;
    player.totalClicks += 1;

    const xpGain = Math.max(1, Math.ceil(gained * 0.08));
    player.xp   += xpGain;

    // Damage boss if active
    let bossKilled = false;
    if (player.bossActive && player.boss) {
      player.boss.hp = Math.max(0, player.boss.hp - gained);
      if (player.boss.hp <= 0) {
        bossKilled = true;
        player.energy       += player.boss.reward;
        player.bossesDefeated++;
        player.bossActive    = false;
        player.boss          = null;
      }
    }

    const { levelled, newBoss } = checkLevelUp(player);

    return { gained, xpGain, levelled, newBoss, bossKilled };
  }

  /* ── Apply one auto-tick (call every second) ─── */
  function applyAutoTick(player) {
    if (player.autoRate <= 0) return 0;
    const prestigeBonus = 1 + player.prestige * 0.5;
    const gained        = player.autoRate * prestigeBonus;
    player.energy      += gained;
    player.xp          += Math.max(1, Math.ceil(gained * 0.04));
    checkLevelUp(player);
    return gained;
  }

  /* ── Level-up check (mutates player) ─────────── */
  function checkLevelUp(player) {
    let levelled = false;
    let newBoss  = null;

    while (player.xp >= player.xpMax) {
      player.xp    -= player.xpMax;
      player.level += 1;
      player.xpMax  = xpForLevel(player.level);
      levelled      = true;

      // Boss every 5 levels
      if (player.level % 5 === 0 && !player.bossActive) {
        newBoss           = bossForLevel(player.level);
        player.boss       = newBoss;
        player.bossActive = true;
      }
    }

    return { levelled, newBoss };
  }

  /* ── Purchase an upgrade ─────────────────────── */
  function purchaseUpgrade(player, upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId);
    if (!upg)                          return { success: false, reason: 'Unknown upgrade' };
    if (player.upgrades[upgradeId])    return { success: false, reason: 'Already owned' };
    if (player.energy < upg.cost)      return { success: false, reason: 'Not enough energy' };

    player.energy -= upg.cost;
    player.upgrades[upgradeId] = true;

    if (upg.type === 'multiplier') {
      player.perClick *= upg.factor;
    } else if (upg.type === 'auto') {
      player.autoRate += upg.value;
    }

    return { success: true, upgrade: upg };
  }

  /* ── Prestige (reset with permanent bonus) ───── */
  function prestige(player) {
    if (player.level < 10) {
      return { success: false, reason: 'Need at least level 10 to prestige' };
    }
    const newPrestige = player.prestige + 1;
    const fresh       = createNewPlayer();
    fresh.prestige    = newPrestige;
    return { success: true, player: fresh };
  }

  /* ── Format large numbers ────────────────────── */
  function fmt(n) {
    n = Math.floor(n);
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9)  return (n / 1e9 ).toFixed(1) + 'B';
    if (n >= 1e6)  return (n / 1e6 ).toFixed(1) + 'M';
    if (n >= 1e3)  return (n / 1e3 ).toFixed(1) + 'K';
    return n.toString();
  }

  /* ── Public API ──────────────────────────────── */
  return {
    UPGRADES,
    createNewPlayer,
    applyClick,
    applyAutoTick,
    checkLevelUp,
    purchaseUpgrade,
    prestige,
    xpForLevel,
    bossForLevel,
    fmt,
  };
}));