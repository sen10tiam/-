/**
 * Chronicles of Eldoria: 2D RPG
 * Core Game Loop, State Management, and UI Integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Player,
  ZoneData,
  NPC,
  Quest,
  CombatState,
  GeneratedGrimoireEntry,
  Item,
  Equipment,
} from './types';
import { ALL_ZONES } from './game/mapData';
import { NPCS, INITIAL_QUESTS, MONSTERS, ITEMS } from './game/gameData';
import { sound } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { CombatModal } from './components/CombatModal';
import { GrimoireModal } from './components/GrimoireModal';
import { InventoryModal } from './components/InventoryModal';
import { CharacterModal } from './components/CharacterModal';
import { QuestModal } from './components/QuestModal';
import { ShopModal } from './components/ShopModal';
import { DialogueBox } from './components/DialogueBox';
import { CharacterCreateModal } from './components/CharacterCreateModal';
import { DownloadGameModal } from './components/DownloadGameModal';
import { GameSaveExportData } from './utils/gameExporter';

const SAVE_KEY = 'eldoria_rpg_save_v1';

export default function App() {
  // Game state
  const [player, setPlayer] = useState<Player | null>(null);
  const [zoneId, setZoneId] = useState<string>('village');
  const [zone, setZone] = useState<ZoneData>(() => ALL_ZONES.village());
  const [openedChests, setOpenedChests] = useState<Set<string>>(new Set());
  const [defeatedMonsters, setDefeatedMonsters] = useState<Set<string>>(new Set());
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [grimoireEntries, setGrimoireEntries] = useState<GeneratedGrimoireEntry[]>([]);

  // Modals & Overlays
  const [isCreatingChar, setIsCreatingChar] = useState<boolean>(true);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(false);
  const [characterOpen, setCharacterOpen] = useState<boolean>(false);
  const [questOpen, setQuestOpen] = useState<boolean>(false);
  const [grimoireOpen, setGrimoireOpen] = useState<boolean>(false);
  const [downloadOpen, setDownloadOpen] = useState<boolean>(false);
  const [activeDialogueNpc, setActiveDialogueNpc] = useState<NPC | null>(null);
  const [activeShopNpc, setActiveShopNpc] = useState<NPC | null>(null);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load game from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.player) {
          setPlayer(parsed.player);
          setZoneId(parsed.player.zoneId || 'village');
          setZone(ALL_ZONES[parsed.player.zoneId || 'village']());
          if (parsed.openedChests) setOpenedChests(new Set(parsed.openedChests));
          if (parsed.defeatedMonsters) setDefeatedMonsters(new Set(parsed.defeatedMonsters));
          if (parsed.quests) setQuests(parsed.quests);
          if (parsed.grimoireEntries) setGrimoireEntries(parsed.grimoireEntries);
          setIsCreatingChar(false);
        }
      }
    } catch {
      // LocalStorage error handled
    }
  }, []);

  // Save game periodically or when player changes
  useEffect(() => {
    if (!player || isCreatingChar) return;
    try {
      const data = {
        player,
        openedChests: Array.from(openedChests),
        defeatedMonsters: Array.from(defeatedMonsters),
        quests,
        grimoireEntries,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {}
  }, [player, openedChests, defeatedMonsters, quests, grimoireEntries, isCreatingChar]);

  // Show temporary toast message
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

  // Import / Restore saved game
  const handleImportSave = (saveData: GameSaveExportData) => {
    if (saveData.player) {
      setPlayer(saveData.player);
      const targetZoneId = saveData.player.zoneId || 'village';
      setZoneId(targetZoneId);
      if (ALL_ZONES[targetZoneId]) {
        setZone(ALL_ZONES[targetZoneId]());
      }
      if (saveData.openedChests) setOpenedChests(new Set(saveData.openedChests));
      if (saveData.defeatedMonsters) setDefeatedMonsters(new Set(saveData.defeatedMonsters));
      if (saveData.quests) setQuests(saveData.quests);
      if (saveData.grimoireEntries) setGrimoireEntries(saveData.grimoireEntries);
      setIsCreatingChar(false);
      showToast(`Welcome back, ${saveData.player.name}! Save restored.`);
    }
  };

  // Level Up Check
  const checkLevelUp = useCallback((currentStats: Player['stats']): Player['stats'] => {
    let stats = { ...currentStats };
    while (stats.xp >= stats.xpToNext) {
      stats.level += 1;
      stats.xp -= stats.xpToNext;
      stats.xpToNext = Math.round(stats.xpToNext * 1.5);
      stats.statPoints += 3;
      stats.maxHp += 15;
      stats.hp = stats.maxHp;
      stats.maxMp += 10;
      stats.mp = stats.maxMp;
      stats.baseAttack += 2;
      stats.baseDefense += 2;
      stats.baseMagic += 2;

      sound.playLevelUp();
      showToast(`⭐ LEVEL UP! You reached Level ${stats.level}! (+3 Stat Points)`);
    }
    return stats;
  }, [showToast]);

  // Handle Player Movement
  const handleMovePlayer = useCallback(
    (dx: number, dy: number) => {
      if (!player || combatState || activeDialogueNpc || activeShopNpc) return;

      const newX = player.x + dx;
      const newY = player.y + dy;

      let direction = player.direction;
      if (dx > 0) direction = 'right';
      if (dx < 0) direction = 'left';
      if (dy > 0) direction = 'down';
      if (dy < 0) direction = 'up';

      // Boundary check
      if (newX < 0 || newX >= zone.width || newY < 0 || newY >= zone.height) {
        return;
      }

      const targetTile = zone.tiles[newY][newX];

      // Solid collision check
      if (targetTile.solid) {
        setPlayer((prev) => (prev ? { ...prev, direction } : null));
        return;
      }

      // Check NPC collision (talk instead of walk over)
      const npcOnTile = Object.values(NPCS).find(
        (n) => n.zoneId === zone.id && n.x === newX && n.y === newY
      );
      if (npcOnTile) {
        sound.playStep();
        setActiveDialogueNpc(npcOnTile);
        setPlayer((prev) => (prev ? { ...prev, direction } : null));
        return;
      }

      // Play step sound
      sound.playStep();

      // Check monster trigger on destination tile
      if (targetTile.trigger?.type === 'monster') {
        const monsterKey = `${zone.id}_${newX}_${newY}`;
        if (!defeatedMonsters.has(monsterKey)) {
          const monsterId = targetTile.trigger.monsterId || 'forest_wolf';
          const monsterTemplate = MONSTERS[monsterId] || MONSTERS.forest_wolf;

          // Start combat
          sound.playAttack(true);
          setCombatState({
            isActive: true,
            monsterKey,
            monster: { ...monsterTemplate },
            turn: 'player',
            round: 1,
            playerHp: player.stats.hp,
            playerMp: player.stats.mp,
            monsterHp: monsterTemplate.hp,
            monsterMp: monsterTemplate.mp,
            playerShieldActive: false,
            logs: [`A hostile ${monsterTemplate.name} appeared! Prepare for battle!`],
            floatingTexts: [],
          });

          // Move player to target tile
          setPlayer((prev) => (prev ? { ...prev, x: newX, y: newY, direction } : null));
          return;
        }
      }

      // Check portal trigger
      if (targetTile.trigger?.type === 'portal') {
        const { targetZone, targetX = 8, targetY = 8 } = targetTile.trigger;
        if (targetZone && ALL_ZONES[targetZone]) {
          sound.playChest();
          const nextZone = ALL_ZONES[targetZone]();
          setZoneId(targetZone);
          setZone(nextZone);
          setPlayer((prev) =>
            prev
              ? {
                  ...prev,
                  zoneId: targetZone,
                  x: targetX,
                  y: targetY,
                  direction,
                }
              : null
          );
          showToast(`Entered ${nextZone.name}`);
          return;
        }
      }

      // Normal movement
      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              x: newX,
              y: newY,
              direction,
            }
          : null
      );
    },
    [player, zone, combatState, activeDialogueNpc, activeShopNpc, defeatedMonsters, showToast]
  );

  // Handle Interact (Space / E / Tap)
  const handleInteract = useCallback(async () => {
    if (!player || combatState) return;

    // Check adjacent & current coordinates
    const checkCoords = [
      { x: player.x, y: player.y },
      { x: player.x + (player.direction === 'right' ? 1 : player.direction === 'left' ? -1 : 0), y: player.y + (player.direction === 'down' ? 1 : player.direction === 'up' ? -1 : 0) },
      { x: player.x + 1, y: player.y },
      { x: player.x - 1, y: player.y },
      { x: player.x, y: player.y + 1 },
      { x: player.x, y: player.y - 1 },
    ];

    // 1. Check NPC
    const nearNpc = Object.values(NPCS).find(
      (npc) =>
        npc.zoneId === zone.id &&
        checkCoords.some((c) => c.x === npc.x && c.y === npc.y)
    );
    if (nearNpc) {
      sound.playStep();
      setActiveDialogueNpc(nearNpc);
      return;
    }

    // 2. Check Triggers
    for (const c of checkCoords) {
      if (c.y >= 0 && c.y < zone.height && c.x >= 0 && c.x < zone.width) {
        const tile = zone.tiles[c.y][c.x];
        if (tile.trigger) {
          // Chest
          if (tile.trigger.type === 'chest') {
            const chestId = tile.trigger.chestId || `chest_${c.x}_${c.y}`;
            if (!openedChests.has(chestId)) {
              sound.playChest();
              setOpenedChests((prev) => new Set([...prev, chestId]));

              const items = tile.trigger.items || [ITEMS.hp_potion];
              const goldGain = 45;

              setPlayer((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  stats: { ...prev.stats, gold: prev.stats.gold + goldGain },
                  inventory: [...prev.inventory, ...items],
                };
              });

              showToast(`🎁 Opened Chest! Received ${items.map((i) => i.name).join(', ')} and ${goldGain} Gold!`);
              return;
            } else {
              showToast('This chest is already empty.');
              return;
            }
          }

          // Campfire
          if (tile.trigger.type === 'campfire') {
            sound.playHeal();
            setPlayer((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                stats: {
                  ...prev.stats,
                  hp: prev.stats.maxHp,
                  mp: prev.stats.maxMp,
                },
              };
            });
            showToast('🔥 Rested by the warm campfire. HP and MP fully restored!');
            return;
          }

          // Lore Altar (calls AI backend to generate prophecy lore)
          if (tile.trigger.type === 'lore') {
            sound.playMagic();
            showToast('The ancient shrine begins to hum with arcane whispers...');
            try {
              const res = await fetch('/api/generate-lore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  characterName: player.name,
                  heroClass: player.heroClass,
                  zone: zone.name,
                }),
              });
              const data = await res.json();
              alert(`🔮 Ancient Eldorian Prophecy:\n\n"${data.lore}"`);
            } catch {
              alert('🔮 Ancient Eldorian Prophecy:\n\n"When the eclipse falls, only the valiant shall reclaim the light."');
            }
            return;
          }

          // Portal
          if (tile.trigger.type === 'portal') {
            const { targetZone, targetX = 8, targetY = 8 } = tile.trigger;
            if (targetZone && ALL_ZONES[targetZone]) {
              sound.playChest();
              const nextZone = ALL_ZONES[targetZone]();
              setZoneId(targetZone);
              setZone(nextZone);
              setPlayer((prev) =>
                prev
                  ? {
                      ...prev,
                      zoneId: targetZone,
                      x: targetX,
                      y: targetY,
                    }
                  : null
              );
              showToast(`Traversed portal into ${nextZone.name}`);
              return;
            }
          }
        }
      }
    }
  }, [player, zone, openedChests, combatState, showToast]);

  // Handle End of Combat
  const handleEndCombat = useCallback(
    (victory: boolean, rewards?: CombatState['rewards']) => {
      if (!player || !combatState) return;

      const monsterKey = combatState.monsterKey || `${zone.id}_${player.x}_${player.y}`;

      if (victory && rewards) {
        // Mark monster defeated
        setDefeatedMonsters((prev) => new Set([...prev, monsterKey]));

        // Update player stats and inventory
        let updatedStats = {
          ...player.stats,
          hp: combatState.playerHp,
          mp: combatState.playerMp,
          xp: player.stats.xp + rewards.xp,
          gold: player.stats.gold + rewards.gold,
        };

        // Level up check
        updatedStats = checkLevelUp(updatedStats);

        // Update active quests
        setQuests((prevQuests) =>
          prevQuests.map((q) => {
            if (q.isCompleted) return q;
            let count = q.currentCount;
            if (
              q.id === 'quest_1' &&
              (combatState.monster.id === 'forest_wolf' || combatState.monster.id === 'goblin_raider')
            ) {
              count += 1;
            } else if (q.id === 'quest_2' && combatState.monster.id === 'shadow_sorcerer') {
              count += 1;
            } else if (q.id === 'quest_3' && combatState.monster.id === 'molten_drake') {
              count += 1;
            }

            const isCompleted = count >= q.targetCount;
            if (isCompleted && !q.isCompleted) {
              sound.playLevelUp();
              showToast(`📜 Quest Completed: ${q.title}! Visit quest giver to claim rewards.`);
            }
            return { ...q, currentCount: count, isCompleted };
          })
        );

        setPlayer({
          ...player,
          stats: updatedStats,
          inventory: [...player.inventory, ...(rewards.items || [])],
        });
      } else if (!victory && combatState.result === 'defeat') {
        // Respawn at village campfire
        const villageZone = ALL_ZONES.village();
        setZoneId('village');
        setZone(villageZone);
        setPlayer({
          ...player,
          zoneId: 'village',
          x: 10,
          y: 6,
          stats: {
            ...player.stats,
            hp: player.stats.maxHp,
            mp: player.stats.maxMp,
          },
        });
        showToast('You woke up safe beside the Oakhaven campfire.');
      }

      setCombatState(null);
    },
    [player, combatState, zone.id, checkLevelUp, showToast]
  );

  // Equip Item
  const handleEquipItem = (item: Item) => {
    if (!player) return;
    const slot = item.type as keyof Equipment;
    const currentEquipped = player.equipment[slot];

    const newInventory = player.inventory.filter((i) => i !== item);
    if (currentEquipped) {
      newInventory.push(currentEquipped);
    }

    setPlayer({
      ...player,
      equipment: {
        ...player.equipment,
        [slot]: item,
      },
      inventory: newInventory,
    });
    showToast(`Equipped ${item.name}`);
  };

  // Unequip Item
  const handleUnequipItem = (slot: keyof Equipment) => {
    if (!player) return;
    const item = player.equipment[slot];
    if (!item) return;

    setPlayer({
      ...player,
      equipment: {
        ...player.equipment,
        [slot]: null,
      },
      inventory: [...player.inventory, item],
    });
    showToast(`Unequipped ${item.name}`);
  };

  // Use Consumable Item
  const handleUseItem = (item: Item) => {
    if (!player) return;

    let nextHp = player.stats.hp;
    let nextMp = player.stats.mp;

    if (item.effect?.healHp) {
      sound.playHeal();
      nextHp = Math.min(player.stats.maxHp, player.stats.hp + item.effect.healHp);
      showToast(`Used ${item.name}: +${item.effect.healHp} HP`);
    } else if (item.effect?.healMp) {
      sound.playMagic();
      nextMp = Math.min(player.stats.maxMp, player.stats.mp + item.effect.healMp);
      showToast(`Used ${item.name}: +${item.effect.healMp} MP`);
    }

    const idx = player.inventory.indexOf(item);
    if (idx > -1) {
      player.inventory.splice(idx, 1);
    }

    setPlayer({
      ...player,
      stats: {
        ...player.stats,
        hp: nextHp,
        mp: nextMp,
      },
      inventory: [...player.inventory],
    });
  };

  // Allocate Stat Points
  const handleAllocateStat = (statKey: 'attack' | 'defense' | 'magic' | 'hp' | 'mp') => {
    if (!player || player.stats.statPoints <= 0) return;

    const stats = { ...player.stats, statPoints: player.stats.statPoints - 1 };
    if (statKey === 'attack') stats.baseAttack += 2;
    if (statKey === 'defense') stats.baseDefense += 2;
    if (statKey === 'magic') stats.baseMagic += 2;
    if (statKey === 'hp') {
      stats.maxHp += 12;
      stats.hp += 12;
    }
    if (statKey === 'mp') {
      stats.maxMp += 10;
      stats.mp += 10;
    }

    setPlayer({ ...player, stats });
    showToast(`Upgraded ${statKey.toUpperCase()}!`);
  };

  // Claim Quest Reward
  const handleClaimQuestReward = (questId: string) => {
    if (!player) return;
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest || !targetQuest.isCompleted || targetQuest.isClaimed) return;

    let updatedStats = {
      ...player.stats,
      gold: player.stats.gold + targetQuest.rewardGold,
      xp: player.stats.xp + targetQuest.rewardXp,
    };
    updatedStats = checkLevelUp(updatedStats);

    const newInventory = [...player.inventory];
    if (targetQuest.rewardItem) {
      newInventory.push(targetQuest.rewardItem);
    }

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, isClaimed: true } : q))
    );

    setPlayer({
      ...player,
      stats: updatedStats,
      inventory: newInventory,
    });

    showToast(`🎁 Claimed rewards for "${targetQuest.title}"!`);
  };

  // Shop Buy
  const handleBuyItem = (item: Item) => {
    if (!player || player.stats.gold < item.price) return;
    setPlayer({
      ...player,
      stats: { ...player.stats, gold: player.stats.gold - item.price },
      inventory: [...player.inventory, item],
    });
    showToast(`Purchased ${item.name}`);
  };

  // Shop Sell
  const handleSellItem = (item: Item) => {
    if (!player) return;
    const sellPrice = Math.max(1, Math.floor(item.price * 0.6));
    const idx = player.inventory.indexOf(item);
    if (idx > -1) {
      player.inventory.splice(idx, 1);
    }
    setPlayer({
      ...player,
      stats: { ...player.stats, gold: player.stats.gold + sellPrice },
      inventory: [...player.inventory],
    });
    showToast(`Sold ${item.name} for ${sellPrice} Gold`);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900/95 border border-indigo-500/80 px-4 py-2 rounded-xl shadow-2xl text-xs font-bold text-amber-200 backdrop-blur-md animate-fade-in flex items-center gap-2">
            <span>⚔️</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Game Screen */}
      {player && !isCreatingChar ? (
        <div className="relative w-full h-full flex flex-col">
          <GameCanvas
            player={player}
            zone={zone}
            npcs={Object.values(NPCS)}
            openedChests={openedChests}
            defeatedMonsters={defeatedMonsters}
            onMovePlayer={handleMovePlayer}
            onInteract={handleInteract}
            onOpenInventory={() => setInventoryOpen(true)}
            onOpenCharacter={() => setCharacterOpen(true)}
            onOpenQuests={() => setQuestOpen(true)}
            onOpenGrimoire={() => setGrimoireOpen(true)}
            onOpenDownload={() => setDownloadOpen(true)}
          />

          {/* Dialogue Overlay */}
          {activeDialogueNpc && (
            <DialogueBox
              npc={activeDialogueNpc}
              onClose={() => setActiveDialogueNpc(null)}
              onOpenShop={() => {
                const npc = activeDialogueNpc;
                setActiveDialogueNpc(null);
                setActiveShopNpc(npc);
              }}
              onOpenQuests={() => {
                setActiveDialogueNpc(null);
                setQuestOpen(true);
              }}
            />
          )}

          {/* Merchant Shop Modal */}
          {activeShopNpc && (
            <ShopModal
              player={player}
              npc={activeShopNpc}
              isOpen={Boolean(activeShopNpc)}
              onClose={() => setActiveShopNpc(null)}
              onBuyItem={handleBuyItem}
              onSellItem={handleSellItem}
            />
          )}

          {/* Inventory Modal */}
          <InventoryModal
            player={player}
            isOpen={inventoryOpen}
            onClose={() => setInventoryOpen(false)}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
            onUseItem={handleUseItem}
          />

          {/* Character Sheet Modal */}
          <CharacterModal
            player={player}
            isOpen={characterOpen}
            onClose={() => setCharacterOpen(false)}
            onAllocateStat={handleAllocateStat}
          />

          {/* Quest Journal Modal */}
          <QuestModal
            quests={quests}
            isOpen={questOpen}
            onClose={() => setQuestOpen(false)}
            onClaimQuestReward={handleClaimQuestReward}
          />

          {/* Turn-Based Battle Modal */}
          {combatState && (
            <CombatModal
              combat={combatState}
              player={player}
              onUpdateCombat={setCombatState}
              onEndCombat={handleEndCombat}
            />
          )}

          {/* Mystic Forge / AI Image Synthesizer Modal */}
          <GrimoireModal
            player={player}
            isOpen={grimoireOpen}
            onClose={() => setGrimoireOpen(false)}
            onSetCustomPortrait={(url) => {
              setPlayer({ ...player, customPortraitUrl: url });
            }}
            entries={grimoireEntries}
            onAddEntry={(entry) => setGrimoireEntries((prev) => [entry, ...prev])}
          />

          {/* Download Game & Save Management Modal */}
          <DownloadGameModal
            isOpen={downloadOpen}
            onClose={() => setDownloadOpen(false)}
            player={player}
            openedChests={openedChests}
            defeatedMonsters={defeatedMonsters}
            quests={quests}
            grimoireEntries={grimoireEntries}
            onImportSave={handleImportSave}
          />
        </div>
      ) : (
        /* Character Creation / Welcome Screen */
        <>
          <CharacterCreateModal
            onStartGame={(newHero) => {
              setPlayer(newHero);
              setIsCreatingChar(false);
              showToast(`Welcome to Oakhaven Village, ${newHero.name}!`);
            }}
            onOpenDownload={() => setDownloadOpen(true)}
          />

          <DownloadGameModal
            isOpen={downloadOpen}
            onClose={() => setDownloadOpen(false)}
            player={player}
            openedChests={openedChests}
            defeatedMonsters={defeatedMonsters}
            quests={quests}
            grimoireEntries={grimoireEntries}
            onImportSave={handleImportSave}
          />
        </>
      )}
    </div>
  );
}
