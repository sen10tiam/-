import React, { useState, useEffect } from 'react';
import { CombatState, Player, HeroSkill, Item } from '../types';
import { CLASS_SKILLS } from '../game/gameData';
import { sound } from '../utils/audio';
import { Sword, Shield, Sparkles, Flame, Heart, Zap, Crosshair, ArrowLeft } from 'lucide-react';
import { CombatBattleSprite } from './CombatBattleSprite';

interface CombatModalProps {
  combat: CombatState;
  player: Player;
  onUpdateCombat: (combat: CombatState) => void;
  onEndCombat: (victory: boolean, rewards?: CombatState['rewards']) => void;
}

export const CombatModal: React.FC<CombatModalProps> = ({
  combat,
  player,
  onUpdateCombat,
  onEndCombat,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'skills' | 'items'>('main');
  const [animatingTarget, setAnimatingTarget] = useState<'none' | 'player' | 'monster'>('none');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; color: string; isCrit?: boolean }[]>([]);

  const { monster, playerHp, playerMp, monsterHp, playerShieldActive, logs, result } = combat;

  // Add floating damage text as purely local UI state without mutating combatState
  const addFloating = (text: string, color: string, isCrit = false) => {
    const id = Math.random().toString();
    setFloatingTexts((prev) => [...prev, { id, text, color, isCrit }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
  };

  // Keyboard shortcut: Press Enter or Space to claim rewards or revive
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (result === 'victory') {
          e.preventDefault();
          onEndCombat(true, combat.rewards);
        } else if (result === 'defeat') {
          e.preventDefault();
          onEndCombat(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, combat.rewards, onEndCombat]);

  // Turn check: If monster's turn, execute monster AI after brief delay
  useEffect(() => {
    if (combat.turn === 'monster' && monsterHp > 0 && playerHp > 0 && !result) {
      const timer = setTimeout(() => {
        executeMonsterTurn();
      }, 700);
      return () => clearTimeout(timer);
    } else if (combat.turn === 'player') {
      setIsProcessing(false);
    }
  }, [combat.turn, monsterHp, playerHp, result]);

  // Handle Victory
  const handleVictory = (options?: {
    nextPlayerHp?: number;
    nextPlayerMp?: number;
    customLog?: string;
  }) => {
    sound.playVictory();

    // Roll loot
    const lootItems: Item[] = [];
    monster.lootTable.forEach((entry) => {
      if (Math.random() <= entry.chance) {
        lootItems.push(entry.item);
      }
    });

    const victoryLogs = options?.customLog
      ? [options.customLog, `${monster.name} was vanquished! Victory is yours!`, ...logs.slice(0, 4)]
      : [`${monster.name} was vanquished! Victory is yours!`, ...logs.slice(0, 5)];

    onUpdateCombat({
      ...combat,
      playerHp: options?.nextPlayerHp ?? playerHp,
      playerMp: options?.nextPlayerMp ?? playerMp,
      monsterHp: 0,
      turn: 'player',
      result: 'victory',
      logs: victoryLogs,
      rewards: {
        xp: monster.xpReward,
        gold: monster.goldReward,
        items: lootItems,
      },
    });
    setIsProcessing(false);
  };

  // Player Basic Attack
  const handlePlayerAttack = () => {
    if (isProcessing || combat.turn !== 'player' || result || monsterHp <= 0) return;
    setIsProcessing(true);

    // Calculate damage
    const totalAtk = player.stats.baseAttack + (player.equipment.weapon?.stats?.attack || 0);
    const critChance = (player.stats.baseCrit + (player.equipment.weapon?.stats?.crit || 0)) / 100;
    const isCrit = Math.random() < critChance;
    let damage = Math.max(1, Math.round(totalAtk * (isCrit ? 1.8 : 1.0) - monster.defense * 0.5 + Math.random() * 4));

    sound.playAttack(isCrit);
    setAnimatingTarget('monster');
    setTimeout(() => setAnimatingTarget('none'), 400);

    const nextMonsterHp = Math.max(0, monsterHp - damage);
    const attackLog = `${player.name} strikes ${monster.name} with weapon for ${damage} damage!${isCrit ? ' (CRITICAL HIT!)' : ''}`;
    addFloating(`-${damage}${isCrit ? ' CRIT!' : ''}`, isCrit ? '#ef4444' : '#f59e0b', isCrit);

    if (nextMonsterHp <= 0) {
      handleVictory({ customLog: attackLog });
    } else {
      onUpdateCombat({
        ...combat,
        monsterHp: nextMonsterHp,
        turn: 'monster',
        logs: [attackLog, ...logs.slice(0, 5)],
      });
    }
  };

  // Player Skill Use
  const handleUseSkill = (skill: HeroSkill) => {
    if (isProcessing || combat.turn !== 'player' || result || monsterHp <= 0) return;
    if (playerMp < skill.mpCost) {
      alert('Not enough Mana Points!');
      return;
    }
    setIsProcessing(true);

    const nextMp = playerMp - skill.mpCost;

    if (skill.type === 'heal') {
      const healAmt = Math.round(skill.power + player.stats.baseMagic * 0.8);
      const nextHp = Math.min(player.stats.maxHp, playerHp + healAmt);
      sound.playHeal();
      setAnimatingTarget('player');
      setTimeout(() => setAnimatingTarget('none'), 400);

      const healLog = `${player.name} casts ${skill.name} restoring ${healAmt} HP!`;
      addFloating(`+${healAmt} HP`, '#22c55e');

      onUpdateCombat({
        ...combat,
        playerHp: nextHp,
        playerMp: nextMp,
        turn: 'monster',
        logs: [healLog, ...logs.slice(0, 5)],
      });
      setActiveTab('main');
      return;
    }

    // Damage skill
    const totalPower = skill.type === 'magic' ? player.stats.baseMagic * 1.3 : player.stats.baseAttack * 1.1;
    let damage = Math.max(2, Math.round(totalPower * skill.power - monster.defense * 0.3 + Math.random() * 6));

    sound.playMagic();
    setAnimatingTarget('monster');
    setTimeout(() => setAnimatingTarget('none'), 400);

    const nextMonsterHp = Math.max(0, monsterHp - damage);
    const skillLog = `${player.name} unleashes ${skill.name} dealing ${damage} ${skill.element} damage!`;
    addFloating(`-${damage}`, '#a855f7', true);

    if (nextMonsterHp <= 0) {
      handleVictory({
        nextPlayerMp: nextMp,
        customLog: skillLog,
      });
    } else {
      onUpdateCombat({
        ...combat,
        monsterHp: nextMonsterHp,
        playerMp: nextMp,
        turn: 'monster',
        logs: [skillLog, ...logs.slice(0, 5)],
      });
      setActiveTab('main');
    }
  };

  // Player Item Use
  const handleUseItem = (item: Item) => {
    if (isProcessing || combat.turn !== 'player' || result || monsterHp <= 0) return;
    setIsProcessing(true);

    let nextHp = playerHp;
    let nextMp = playerMp;
    let nextMonsterHp = monsterHp;
    let logMessage = '';

    if (item.effect?.healHp) {
      sound.playHeal();
      nextHp = Math.min(player.stats.maxHp, playerHp + item.effect.healHp);
      logMessage = `${player.name} drinks ${item.name} and recovers ${item.effect.healHp} HP!`;
      addFloating(`+${item.effect.healHp} HP`, '#22c55e');
    } else if (item.effect?.healMp) {
      sound.playMagic();
      nextMp = Math.min(player.stats.maxMp, playerMp + item.effect.healMp);
      logMessage = `${player.name} sips ${item.name} and restores ${item.effect.healMp} MP!`;
      addFloating(`+${item.effect.healMp} MP`, '#38bdf8');
    } else if (item.effect?.damage) {
      sound.playAttack(true);
      setAnimatingTarget('monster');
      setTimeout(() => setAnimatingTarget('none'), 400);
      nextMonsterHp = Math.max(0, monsterHp - item.effect.damage);
      logMessage = `${player.name} throws ${item.name} inflicting ${item.effect.damage} explosive damage!`;
      addFloating(`-${item.effect.damage}`, '#ef4444', true);
    }

    // Deduct one item from player inventory
    const itemIndex = player.inventory.findIndex((i) => i.id === item.id);
    if (itemIndex > -1) {
      player.inventory.splice(itemIndex, 1);
    }

    if (nextMonsterHp <= 0) {
      handleVictory({
        nextPlayerHp: nextHp,
        nextPlayerMp: nextMp,
        customLog: logMessage,
      });
    } else {
      onUpdateCombat({
        ...combat,
        playerHp: nextHp,
        playerMp: nextMp,
        monsterHp: nextMonsterHp,
        turn: 'monster',
        logs: [logMessage, ...logs.slice(0, 5)],
      });
      setActiveTab('main');
    }
  };

  // Player Defend
  const handleDefend = () => {
    if (isProcessing || combat.turn !== 'player' || result || monsterHp <= 0) return;
    setIsProcessing(true);
    sound.playMagic();
    const recoverMp = Math.min(player.stats.maxMp, playerMp + Math.round(player.stats.maxMp * 0.15));
    const newLogs = [`${player.name} takes a defensive stance and recovers ${recoverMp - playerMp} MP!`, ...logs.slice(0, 5)];
    addFloating('GUARD UP', '#38bdf8');

    onUpdateCombat({
      ...combat,
      playerMp: recoverMp,
      playerShieldActive: true,
      turn: 'monster',
      logs: newLogs,
    });
  };

  // Player Flee
  const handleFlee = () => {
    if (isProcessing || combat.turn !== 'player' || result || monsterHp <= 0) return;
    if (monster.isBoss) {
      alert('You cannot flee from a Boss Encounter!');
      return;
    }
    setIsProcessing(true);
    const fleeSuccess = Math.random() > 0.35;
    if (fleeSuccess) {
      onUpdateCombat({
        ...combat,
        result: 'escaped',
        logs: [`${player.name} successfully fled from the battle!`, ...logs.slice(0, 5)],
      });
      setTimeout(() => onEndCombat(false), 900);
    } else {
      onUpdateCombat({
        ...combat,
        turn: 'monster',
        logs: [`${player.name} failed to escape! ${monster.name} cuts off the retreat!`, ...logs.slice(0, 5)],
      });
    }
  };

  // Monster Turn AI
  const executeMonsterTurn = () => {
    if (result || monsterHp <= 0 || playerHp <= 0) return;

    const totalDef = player.stats.baseDefense + (player.equipment.armor?.stats?.defense || 0) + (player.equipment.shield?.stats?.defense || 0);

    // Pick skill or basic
    const useSkill = monster.skills.length > 0 && Math.random() > 0.4;
    let rawDmg = monster.attack;
    let attackName = 'strikes with fury';

    if (useSkill) {
      const sk = monster.skills[Math.floor(Math.random() * monster.skills.length)];
      rawDmg = sk.damage;
      attackName = `unleashes ${sk.name}`;
    }

    let actualDmg = Math.max(1, Math.round(rawDmg - totalDef * 0.6 + Math.random() * 3));
    if (playerShieldActive) {
      actualDmg = Math.max(1, Math.round(actualDmg * 0.45));
    }

    sound.playAttack();
    setAnimatingTarget('player');
    setTimeout(() => setAnimatingTarget('none'), 400);

    const nextPlayerHp = Math.max(0, playerHp - actualDmg);
    const monsterLog = `${monster.name} ${attackName} dealing ${actualDmg} damage!`;
    addFloating(`-${actualDmg}`, '#ef4444');

    if (nextPlayerHp <= 0) {
      sound.playDefeat();
      onUpdateCombat({
        ...combat,
        playerHp: 0,
        result: 'defeat',
        logs: [monsterLog, `${player.name} has fallen in combat...`, ...logs.slice(0, 4)],
      });
    } else {
      onUpdateCombat({
        ...combat,
        playerHp: nextPlayerHp,
        playerShieldActive: false,
        turn: 'player',
        logs: [monsterLog, ...logs.slice(0, 5)],
      });
    }
  };

  const playerSkills = CLASS_SKILLS[player.heroClass] || [];
  const consumables = player.inventory.filter((i) => i.type === 'consumable');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Battle Header */}
        <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">{monster.avatarIcon}</span>
            <h2 className="text-lg font-bold text-slate-100">
              Battle vs {monster.name} {monster.isBoss && <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white font-semibold">BOSS</span>}
            </h2>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">
            {combat.turn === 'player' ? '🟢 Your Turn' : '🔴 Monster Turn'}
          </div>
        </div>

        {/* Combat Visual Arena */}
        <div className="relative h-64 bg-radial from-slate-800 to-slate-950 flex items-center justify-around px-8 border-b border-slate-800">
          {/* Floating damage numbers */}
          {floatingTexts.map((f) => (
            <div
              key={f.id}
              className="absolute pointer-events-none font-extrabold text-xl animate-bounce drop-shadow-md z-30"
              style={{
                color: f.color,
                left: f.color.includes('22c55e') ? '25%' : '70%',
                top: '30%',
              }}
            >
              {f.text}
            </div>
          ))}

          {/* Player Side */}
          <div className={`flex flex-col items-center transition-transform duration-200 ${animatingTarget === 'player' ? 'scale-95 translate-x-3' : ''}`}>
            <div className="relative">
              <CombatBattleSprite
                type="player"
                player={player}
                isHit={animatingTarget === 'player'}
                isAttacking={animatingTarget === 'monster'}
                hasShield={playerShieldActive}
              />
              {player.customPortraitUrl && (
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full border-2 border-indigo-400 overflow-hidden shadow-md">
                  <img
                    src={player.customPortraitUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
            <div className="mt-1 text-center">
              <span className="text-sm font-bold text-slate-200">{player.name}</span>
              <span className="text-xs text-indigo-400 block font-medium">Lvl {player.stats.level} {player.heroClass}</span>
            </div>
            {/* Player HP & MP Bars */}
            <div className="w-36 mt-1.5 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>HP</span>
                <span>{playerHp}/{player.stats.maxHp}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (playerHp / player.stats.maxHp) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>MP</span>
                <span>{playerMp}/{player.stats.maxMp}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (playerMp / player.stats.maxMp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-slate-600 font-extrabold text-2xl">VS</div>

          {/* Monster Side */}
          <div className={`flex flex-col items-center transition-transform duration-200 ${animatingTarget === 'monster' ? 'scale-95 -translate-x-3' : ''}`}>
            <div className="relative">
              <CombatBattleSprite
                type="monster"
                monster={monster}
                isHit={animatingTarget === 'monster'}
                isAttacking={animatingTarget === 'player'}
              />
              {monster.isBoss && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-red-600 px-1.5 py-0.5 rounded-full text-white font-black shadow-md animate-pulse">
                  BOSS
                </span>
              )}
            </div>
            <div className="mt-1 text-center">
              <span className="text-sm font-bold text-slate-200">{monster.name}</span>
              <span className="text-xs text-red-400 block font-medium">Lvl {monster.level} Fiend</span>
            </div>
            {/* Monster HP Bar */}
            <div className="w-36 mt-1.5 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>HP</span>
                <span>{monsterHp}/{monster.maxHp}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (monsterHp / monster.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Combat Log Box */}
        <div className="bg-slate-950/70 px-6 py-2 border-b border-slate-800 h-20 overflow-y-auto text-xs text-slate-300 space-y-1">
          {logs.map((log, idx) => (
            <div key={idx} className={idx === 0 ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
              • {log}
            </div>
          ))}
        </div>

        {/* Action Controls or Victory/Defeat Banner */}
        <div className="p-5 bg-slate-900 flex-1">
          {result === 'victory' && (
            <div className="text-center py-3 space-y-3 animate-fade-in">
              <div className="text-2xl font-black text-amber-400">✨ ПОБЕДА / VICTORY! ✨</div>
              <p className="text-sm text-slate-300">
                You defeated {monster.name} and earned <strong className="text-indigo-400">+{combat.rewards?.xp} XP</strong> and{' '}
                <strong className="text-yellow-400">+{combat.rewards?.gold} Gold</strong>!
              </p>
              {combat.rewards?.items && combat.rewards.items.length > 0 && (
                <div className="text-xs text-slate-200">
                  Loot Found:{' '}
                  {combat.rewards.items.map((i) => (
                    <span key={i.id} className="inline-block bg-slate-800 px-2 py-1 rounded mx-1 text-emerald-400 font-semibold border border-slate-700">
                      🎁 {i.name}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <button
                  id="combat-claim-victory-btn"
                  onClick={() => onEndCombat(true, combat.rewards)}
                  className="mt-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  Забрать награду и продолжить / Continue [Enter]
                </button>
              </div>
            </div>
          )}

          {result === 'defeat' && (
            <div className="text-center py-3 space-y-3">
              <div className="text-2xl font-black text-red-500">💀 ПОРАЖЕНИЕ / DEFEATED 💀</div>
              <p className="text-sm text-slate-300">Your vision fades as darkness closes in...</p>
              <button
                id="combat-revive-btn"
                onClick={() => onEndCombat(false)}
                className="mt-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg cursor-pointer transition-all"
              >
                Возродиться у костра / Respawn at Campfire [Enter]
              </button>
            </div>
          )}

          {!result && (
            <>
              {activeTab === 'main' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    id="combat-attack-btn"
                    disabled={combat.turn !== 'player'}
                    onClick={handlePlayerAttack}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 disabled:opacity-50 cursor-pointer transition-all hover:scale-105"
                  >
                    <Sword className="w-5 h-5 text-red-400 mb-1" />
                    <span className="font-bold text-sm">Strike</span>
                    <span className="text-[10px] text-slate-400">Basic attack</span>
                  </button>

                  <button
                    id="combat-skills-btn"
                    disabled={combat.turn !== 'player'}
                    onClick={() => setActiveTab('skills')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 disabled:opacity-50 cursor-pointer transition-all hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-400 mb-1" />
                    <span className="font-bold text-sm">Skills & Spells</span>
                    <span className="text-[10px] text-slate-400">{playerSkills.length} available</span>
                  </button>

                  <button
                    id="combat-items-btn"
                    disabled={combat.turn !== 'player'}
                    onClick={() => setActiveTab('items')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 disabled:opacity-50 cursor-pointer transition-all hover:scale-105"
                  >
                    <Heart className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="font-bold text-sm">Use Item</span>
                    <span className="text-[10px] text-slate-400">{consumables.length} in bag</span>
                  </button>

                  <button
                    id="combat-defend-btn"
                    disabled={combat.turn !== 'player'}
                    onClick={handleDefend}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 disabled:opacity-50 cursor-pointer transition-all hover:scale-105"
                  >
                    <Shield className="w-5 h-5 text-blue-400 mb-1" />
                    <span className="font-bold text-sm">Defend</span>
                    <span className="text-[10px] text-slate-400">-55% dmg, +MP</span>
                  </button>

                  <div className="col-span-2 sm:col-span-4 flex justify-end">
                    <button
                      id="combat-flee-btn"
                      disabled={combat.turn !== 'player' || monster.isBoss}
                      onClick={handleFlee}
                      className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer disabled:opacity-40"
                    >
                      Attempt Escape 🏃
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300">Choose an ability:</span>
                    <button
                      onClick={() => setActiveTab('main')}
                      className="text-xs text-indigo-400 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to actions
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {playerSkills.map((sk) => (
                      <button
                        key={sk.id}
                        disabled={playerMp < sk.mpCost || combat.turn !== 'player'}
                        onClick={() => handleUseSkill(sk)}
                        className="p-3 text-left rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-100">{sk.name}</span>
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded">
                            {sk.mpCost} MP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{sk.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300">Select potion or flask:</span>
                    <button
                      onClick={() => setActiveTab('main')}
                      className="text-xs text-indigo-400 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to actions
                    </button>
                  </div>
                  {consumables.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">No consumable items in your bag!</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {consumables.map((item, idx) => (
                        <button
                          key={`${item.id}_${idx}`}
                          onClick={() => handleUseItem(item)}
                          className="p-2.5 text-left rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-100">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </div>
                          <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-1 rounded font-semibold">
                            Use
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
