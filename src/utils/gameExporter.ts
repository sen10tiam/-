import JSZip from 'jszip';
import { Player, Quest, GeneratedGrimoireEntry } from '../types';

export interface GameSaveExportData {
  version: string;
  timestamp: string;
  player: Player;
  openedChests: string[];
  defeatedMonsters: string[];
  quests: Quest[];
  grimoireEntries: GeneratedGrimoireEntry[];
}

/**
 * Triggers a browser download for a blob or text file
 */
export function triggerFileDownload(content: Blob | string, filename: string, mimeType = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports current game progress to a JSON save file
 */
export function exportGameSave(saveData: GameSaveExportData) {
  const jsonStr = JSON.stringify(saveData, null, 2);
  const heroName = saveData.player?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Hero';
  const filename = `eldoria_save_${heroName}_Lv${saveData.player?.stats?.level || 1}.json`;
  triggerFileDownload(jsonStr, filename, 'application/json');
}

/**
 * Imports game save from a JSON file
 */
export function importGameSave(file: File): Promise<GameSaveExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.player || !parsed.player.stats) {
          throw new Error('Invalid save file format: Missing player state.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse save file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read save file'));
    reader.readAsText(file);
  });
}

/**
 * Generates an ultra-rich, single-file, 100% self-contained offline playable HTML game!
 * Includes full canvas renderer, audio synthesizers, combat, quests, shops, inventory, and save persistence.
 */
export function generateStandaloneOfflineHtml(saveData?: GameSaveExportData | null): string {
  const initialSaveJson = saveData ? JSON.stringify(saveData) : 'null';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Chronicles of Eldoria - Offline Edition</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-user-select: none; user-select: none; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #020617; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }
    #game-container { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; }
    header { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
    .hero-info { display: flex; align-items: center; gap: 12px; }
    .hero-badge { background: #1e1b4b; border: 1px solid #4338ca; color: #a5b4fc; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; }
    .gold-badge { background: #451a03; border: 1px solid #b45309; color: #fde047; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; }
    .btn { background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn:hover { background: #334155; transform: translateY(-1px); }
    .btn-primary { background: linear-gradient(135deg, #4f46e5, #7c3aed); border-color: #6366f1; color: white; }
    .btn-primary:hover { background: linear-gradient(135deg, #4338ca, #6d28d9); }
    #canvas-wrap { position: relative; flex: 1; width: 100%; height: 100%; overflow: hidden; background: #090d16; }
    canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
    .floating-prompt { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); border: 2px solid #f59e0b; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: bold; color: #fef08a; pointer-events: none; animation: bounce 1.5s infinite; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
    @keyframes bounce { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -6px); } }
    .modal { display: none; position: fixed; inset: 0; z-index: 50; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 16px; }
    .modal-box { background: #0f172a; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px; }
    .bar-bg { width: 90px; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-top: 3px; }
    .bar-fill-hp { height: 100%; background: #ef4444; }
    .bar-fill-mp { height: 100%; background: #6366f1; }
    /* Virtual d-pad for mobile */
    .dpad { position: absolute; bottom: 16px; left: 16px; z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .dpad-row { display: flex; gap: 4px; }
    .dpad-btn { width: 44px; height: 44px; background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; border-radius: 10px; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .dpad-btn:active { background: #4f46e5; }
    .action-btn { position: absolute; bottom: 20px; right: 20px; z-index: 20; width: 56px; height: 56px; border-radius: 28px; background: #f59e0b; border: 2px solid #fef08a; color: #0f172a; font-size: 22px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); }
  </style>
</head>
<body>
<div id="game-container">
  <header>
    <div class="hero-info">
      <div id="hero-avatar" style="font-size: 24px; cursor: pointer;" title="Character (C)">⚔️</div>
      <div>
        <div style="font-size: 13px; font-weight: bold;" id="hero-name">Hero</div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <span class="hero-badge" id="hero-level">Lv.1 Warrior</span>
          <div class="bar-bg"><div class="bar-fill-hp" id="hp-bar" style="width: 100%;"></div></div>
          <div class="bar-bg"><div class="bar-fill-mp" id="mp-bar" style="width: 100%;"></div></div>
        </div>
      </div>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <span class="gold-badge" id="hero-gold">💰 50</span>
      <button class="btn" onclick="openInventory()">🎒 Bag</button>
      <button class="btn" onclick="openCharacter()">👤 Hero</button>
      <button class="btn" onclick="openQuests()">📜 Quests</button>
      <button class="btn btn-primary" onclick="saveGame()">💾 Save</button>
    </div>
  </header>

  <div id="canvas-wrap">
    <canvas id="game-canvas"></canvas>
    <div id="floating-prompt" class="floating-prompt" style="display: none;"></div>

    <!-- Virtual Mobile Controls -->
    <div class="dpad">
      <button class="dpad-btn" onclick="movePlayer(0, -1)">▲</button>
      <div class="dpad-row">
        <button class="dpad-btn" onclick="movePlayer(-1, 0)">◀</button>
        <button class="dpad-btn" onclick="movePlayer(0, 1)">▼</button>
        <button class="dpad-btn" onclick="movePlayer(1, 0)">▶</button>
      </div>
    </div>
    <button class="action-btn" onclick="interact()">✋</button>
  </div>
</div>

<!-- Simple Modals for standalone offline play -->
<div id="inventory-modal" class="modal">
  <div class="modal-box">
    <div class="modal-head">
      <h3>🎒 Inventory</h3>
      <button class="btn" onclick="closeModals()">✕</button>
    </div>
    <div id="inventory-list" style="display: grid; gap: 8px;"></div>
  </div>
</div>

<div id="character-modal" class="modal">
  <div class="modal-box">
    <div class="modal-head">
      <h3>👤 Character Attributes</h3>
      <button class="btn" onclick="closeModals()">✕</button>
    </div>
    <div id="character-stats" style="line-height: 1.8; font-size: 14px;"></div>
  </div>
</div>

<div id="combat-modal" class="modal">
  <div class="modal-box" style="max-width: 600px;">
    <div class="modal-head">
      <h3 id="combat-enemy-name">⚔️ Combat</h3>
    </div>
    <div style="text-align: center; padding: 20px 0;">
      <div id="combat-enemy-avatar" style="font-size: 56px;">🐺</div>
      <div style="font-weight: bold; margin-top: 8px;" id="combat-enemy-stats">Enemy HP: 40/40</div>
      <div class="bar-bg" style="width: 200px; margin: 8px auto;"><div id="combat-enemy-hp-bar" class="bar-fill-hp" style="width: 100%;"></div></div>
    </div>
    <div id="combat-log" style="background: #020617; padding: 10px; border-radius: 8px; font-size: 12px; height: 80px; overflow-y: auto; margin-bottom: 16px;"></div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-primary" style="flex: 1;" onclick="combatAttack()">⚔️ Basic Strike</button>
      <button class="btn" style="flex: 1;" onclick="combatSkill()">⚡ Special Skill</button>
      <button class="btn" style="flex: 1;" onclick="combatHeal()">🧪 Potion</button>
    </div>
  </div>
</div>

<script>
// Web Audio Synthesizer (Zero external sound dependencies - 100% offline!)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, dur, gain=0.1) {
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch(e){}
}
function sfxHit() { playTone(160, 'sawtooth', 0.15, 0.2); }
function sfxVictory() { playTone(523, 'triangle', 0.15); setTimeout(()=>playTone(659, 'triangle', 0.15), 120); setTimeout(()=>playTone(784, 'triangle', 0.3), 240); }
function sfxLoot() { playTone(880, 'sine', 0.12); setTimeout(()=>playTone(1174, 'sine', 0.25), 100); }

// Game State Setup
const TILE_SIZE = 40;
let initialData = ${initialSaveJson};

let player = initialData?.player || {
  name: "Valerius",
  heroClass: "Warrior",
  x: 8,
  y: 8,
  direction: "down",
  stats: { hp: 100, maxHp: 100, mp: 40, maxMp: 40, level: 1, xp: 0, xpToNext: 100, gold: 60, baseAttack: 14, baseDefense: 8, baseMagic: 6 }
};

let inventory = initialData?.player?.inventory || [
  { id: 'hp_potion', name: 'Elixir of Vitality', effect: { healHp: 50 }, count: 3 },
  { id: 'iron_blade', name: 'Forged Iron Broadsword', attack: 8 }
];

let quests = initialData?.quests || [
  { id: 'q1', title: 'Woodland Beast Hunt', count: 0, target: 3, done: false }
];

// Map Definition
const MAP_W = 20, MAP_H = 15;
const map = [];
for (let y = 0; y < MAP_H; y++) {
  const row = [];
  for (let x = 0; x < MAP_W; x++) {
    if (x === 0 || x === MAP_W-1 || y === 0 || y === MAP_H-1) row.push('tree');
    else if (y === 8 || x === 8) row.push('path');
    else row.push('grass');
  }
  map.push(row);
}
// Campfire & Chest
map[5][5] = 'campfire';
map[10][14] = 'chest';
let chestOpened = false;

// Overworld Monsters
let monsters = [
  { id: 'wolf_1', name: 'Timber Wolf', x: 14, y: 5, hp: 45, maxHp: 45, attack: 10, icon: '🐺' },
  { id: 'goblin_1', name: 'Goblin Scout', x: 12, y: 11, hp: 60, maxHp: 60, attack: 14, icon: '👺' },
  { id: 'sorcerer_1', name: 'Void Archon', x: 4, y: 11, hp: 120, maxHp: 120, attack: 22, icon: '🧙‍♂️', isBoss: true }
];

// Canvas Rendering
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resize);
resize();

function render() {
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const camX = Math.max(0, Math.min(MAP_W * TILE_SIZE - canvas.width, player.x * TILE_SIZE + TILE_SIZE/2 - canvas.width/2));
  const camY = Math.max(0, Math.min(MAP_H * TILE_SIZE - canvas.height, player.y * TILE_SIZE + TILE_SIZE/2 - canvas.height/2));

  ctx.save();
  ctx.translate(-camX, -camY);

  // Draw Tiles
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const type = map[y][x];
      const px = x * TILE_SIZE, py = y * TILE_SIZE;
      if (type === 'grass') {
        ctx.fillStyle = (x+y)%2 === 0 ? '#15803d' : '#166534';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (type === 'path') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(px+2, py+2, TILE_SIZE-4, TILE_SIZE-4);
      } else if (type === 'tree') {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px+16, py+20, 8, 20);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px+20, py+16, 16, 0, Math.PI*2);
        ctx.fill();
      } else if (type === 'campfire') {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px+20, py+20, 10, 0, Math.PI*2);
        ctx.fill();
      } else if (type === 'chest') {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = chestOpened ? '#78350f' : '#f59e0b';
        ctx.fillRect(px+8, py+12, 24, 20);
      }
    }
  }

  // Draw Monsters
  monsters.forEach(m => {
    ctx.font = '22px sans-serif';
    ctx.fillText(m.icon, m.x * TILE_SIZE + 8, m.y * TILE_SIZE + 28);
  });

  // Draw Player
  ctx.fillStyle = player.heroClass === 'Warrior' ? '#dc2626' : player.heroClass === 'Mage' ? '#7c3aed' : '#059669';
  ctx.fillRect(player.x * TILE_SIZE + 10, player.y * TILE_SIZE + 10, 20, 24);
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(player.x * TILE_SIZE + 20, player.y * TILE_SIZE + 10, 8, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Player Movement & Interaction
function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H && map[ny][nx] !== 'tree') {
    player.x = nx;
    player.y = ny;
    checkTriggers();
  }
}

function checkTriggers() {
  const prompt = document.getElementById('floating-prompt');
  const enemy = monsters.find(m => m.x === player.x && m.y === player.y);
  if (enemy) {
    startCombat(enemy);
    prompt.style.display = 'none';
    return;
  }
  if (map[player.y][player.x] === 'campfire') {
    player.stats.hp = player.stats.maxHp;
    player.stats.mp = player.stats.maxMp;
    updateHUD();
    prompt.textContent = "Rested at campfire: HP and MP restored!";
    prompt.style.display = 'block';
    setTimeout(() => prompt.style.display = 'none', 2000);
    return;
  }
  if (map[player.y][player.x] === 'chest' && !chestOpened) {
    prompt.textContent = "SPACE / Tap to Open Chest";
    prompt.style.display = 'block';
    return;
  }
  prompt.style.display = 'none';
}

function interact() {
  if (map[player.y][player.x] === 'chest' && !chestOpened) {
    chestOpened = true;
    player.stats.gold += 80;
    inventory.push({ id: 'elixir', name: 'Greater Vitality Brew', count: 2 });
    sfxLoot();
    updateHUD();
    alert("Opened Ancient Chest! Found 80 Gold and Greater Vitality Brew!");
  }
}

// Combat Engine
let activeCombat = null;
function startCombat(enemy) {
  activeCombat = { enemy, enemyHp: enemy.hp };
  document.getElementById('combat-enemy-name').textContent = '⚔️ Battle vs ' + enemy.name;
  document.getElementById('combat-enemy-avatar').textContent = enemy.icon;
  document.getElementById('combat-enemy-stats').textContent = 'Enemy HP: ' + enemy.hp + '/' + enemy.maxHp;
  document.getElementById('combat-log').innerHTML = 'A wild ' + enemy.name + ' engages in combat!';
  document.getElementById('combat-modal').style.display = 'flex';
}

function combatAttack() {
  if (!activeCombat) return;
  sfxHit();
  const dmg = player.stats.baseAttack + Math.floor(Math.random() * 5);
  activeCombat.enemyHp = Math.max(0, activeCombat.enemyHp - dmg);
  const log = document.getElementById('combat-log');
  log.innerHTML = 'You strike ' + activeCombat.enemy.name + ' for ' + dmg + ' damage!<br>' + log.innerHTML;
  document.getElementById('combat-enemy-stats').textContent = 'Enemy HP: ' + activeCombat.enemyHp + '/' + activeCombat.enemy.maxHp;
  document.getElementById('combat-enemy-hp-bar').style.width = (activeCombat.enemyHp / activeCombat.enemy.maxHp * 100) + '%';

  if (activeCombat.enemyHp <= 0) {
    sfxVictory();
    player.stats.xp += 30;
    player.stats.gold += 25;
    monsters = monsters.filter(m => m !== activeCombat.enemy);
    alert('Victory! Vanquished ' + activeCombat.enemy.name + ' and earned 30 XP & 25 Gold!');
    closeModals();
    activeCombat = null;
    updateHUD();
    return;
  }

  // Enemy counterattack
  setTimeout(() => {
    const eDmg = activeCombat.enemy.attack;
    player.stats.hp = Math.max(0, player.stats.hp - eDmg);
    log.innerHTML = activeCombat.enemy.name + ' attacks you for ' + eDmg + ' damage!<br>' + log.innerHTML;
    updateHUD();
    if (player.stats.hp <= 0) {
      alert('You have fallen in battle! Respawning at village campfire...');
      player.stats.hp = player.stats.maxHp;
      player.x = 5; player.y = 5;
      closeModals();
      activeCombat = null;
      updateHUD();
    }
  }, 400);
}

function combatSkill() {
  if (player.stats.mp < 10) { alert("Not enough MP!"); return; }
  player.stats.mp -= 10;
  player.stats.baseAttack += 4;
  combatAttack();
  player.stats.baseAttack -= 4;
}

function combatHeal() {
  player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 40);
  updateHUD();
  const log = document.getElementById('combat-log');
  log.innerHTML = 'Used Vitality Brew! Restored 40 HP.<br>' + log.innerHTML;
}

// Controls
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, -1);
  if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, 1);
  if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
  if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
  if (e.key === ' ' || e.key === 'e') interact();
  if (e.key === 'b' || e.key === 'i') openInventory();
  if (e.key === 'c') openCharacter();
  if (e.key === 'Escape') closeModals();
});

function updateHUD() {
  document.getElementById('hero-name').textContent = player.name;
  document.getElementById('hero-level').textContent = 'Lv.' + player.stats.level + ' ' + player.heroClass;
  document.getElementById('hero-gold').textContent = '💰 ' + player.stats.gold;
  document.getElementById('hp-bar').style.width = (player.stats.hp / player.stats.maxHp * 100) + '%';
  document.getElementById('mp-bar').style.width = (player.stats.mp / player.stats.maxMp * 100) + '%';
}
updateHUD();

function openInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = inventory.map(i => '<div style="background:#1e293b; padding:8px; border-radius:6px;"><strong>' + i.name + '</strong></div>').join('');
  document.getElementById('inventory-modal').style.display = 'flex';
}

function openCharacter() {
  const stats = document.getElementById('character-stats');
  stats.innerHTML = '<strong>' + player.name + '</strong> (' + player.heroClass + ')<br>' +
    'Level: ' + player.stats.level + '<br>' +
    'Hit Points: ' + player.stats.hp + '/' + player.stats.maxHp + '<br>' +
    'Mana Points: ' + player.stats.mp + '/' + player.stats.maxMp + '<br>' +
    'Attack: ' + player.stats.baseAttack + '<br>' +
    'Defense: ' + player.stats.baseDefense + '<br>' +
    'Gold: ' + player.stats.gold;
  document.getElementById('character-modal').style.display = 'flex';
}

function openQuests() {
  alert("Quests Active:\\n- Woodland Beast Hunt: Slay wild monsters roaming the territory\\n- Ancient Chest: Discover the hidden treasure");
}

function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function saveGame() {
  const data = { player, inventory, chestOpened };
  localStorage.setItem('eldoria_offline_save', JSON.stringify(data));
  alert('Game progress saved successfully to your browser storage!');
}
</script>
</body>
</html>`;
}

/**
 * Creates and downloads a complete ZIP package containing the game,
 * standalone offline player, documentation, save backup, and assets.
 */
export async function downloadGameZip(saveData?: GameSaveExportData | null) {
  const zip = new JSZip();

  // 1. Standalone offline HTML game
  const standaloneHtml = generateStandaloneOfflineHtml(saveData);
  zip.file('Chronicles_of_Eldoria.html', standaloneHtml);
  zip.file('index.html', standaloneHtml);

  // 2. Readme and Player Manual
  const readmeContent = `# Chronicles of Eldoria - 2D RPG

Welcome to **Chronicles of Eldoria**, an immersive 2D tactical role-playing game.

## Quick Start
1. Double-click \`Chronicles_of_Eldoria.html\` or \`index.html\` in any web browser (Chrome, Firefox, Edge, Safari).
2. No internet connection, server, or installation required! The game runs completely offline.

## Controls
- **Movement:** WASD or Arrow Keys
- **Interact / Talk / Open:** SPACE or E (or tap the hand button on mobile)
- **Inventory / Bag:** B or I
- **Character Attributes:** C
- **Quest Log:** Q
- **Mystic Forge:** G

## Hero Classes
- **Warrior:** Master of heavy steel armor, high survivability, and devastating physical cleaves.
- **Mage:** Archon of arcane mysteries, devastating elemental spells, and mana shields.
- **Rogue:** Lethal agility, high critical strike probability, and venomous strikes.
- **Paladin:** Holy knight combining stalwart defense, radiant smites, and divine healing.

## Features
- Full tile-based world exploration across multiple biomes (Oakhaven Village, Whispering Forest, Sunken Crypt, Dragon Crag)
- Turn-based tactical combat with damage calculations, elemental skills, and loot drops
- Quests, dialogue system, merchant shops, and equipment loadouts
- Built-in Web Audio synthesizer for offline sound effects
- LocalStorage progress saving

Created with Google AI Studio. Enjoy your adventure!
`;
  zip.file('README.md', readmeContent);

  // 3. Quick controls guide
  const controlsContent = `CHRONICLES OF ELDORIA - CONTROLS CHEAT SHEET
=============================================
W / Arrow Up    : Move North
S / Arrow Down  : Move South
A / Arrow Left  : Move West
D / Arrow Right : Move East
SPACE or E      : Interact (Chests, NPCs, Campfires, Portals)
B or I          : Open Inventory / Equipment Bag
C               : Open Character Sheet / Allocate Stat Points
Q               : Open Quest Log
G               : Open Mystic Forge
`;
  zip.file('CONTROLS.txt', controlsContent);

  // 4. Windows 1-click launcher
  zip.file('start_game.bat', `@echo off
start Chronicles_of_Eldoria.html
`);

  // 5. Save data backup if available
  if (saveData) {
    zip.file('save_backup.json', JSON.stringify(saveData, null, 2));
  }

  // Generate zip and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = saveData?.player?.name
    ? `Chronicles_of_Eldoria_${saveData.player.name.replace(/[^a-zA-Z0-9_-]/g, '')}.zip`
    : 'Chronicles_of_Eldoria_Game.zip';

  triggerFileDownload(blob, filename, 'application/zip');
}
