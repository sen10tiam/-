import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Player, ZoneData, NPC, MapTile } from '../types';
import { renderGameWorld, TILE_SIZE } from '../game/renderer';
import { sound } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Package,
  User,
  Scroll,
  Sparkles,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hand,
  Download,
} from 'lucide-react';

interface GameCanvasProps {
  player: Player;
  zone: ZoneData;
  npcs: NPC[];
  openedChests: Set<string>;
  defeatedMonsters: Set<string>;
  onMovePlayer: (dx: number, dy: number) => void;
  onInteract: () => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenQuests: () => void;
  onOpenGrimoire: () => void;
  onOpenDownload: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  player,
  zone,
  npcs,
  openedChests,
  defeatedMonsters,
  onMovePlayer,
  onInteract,
  onOpenInventory,
  onOpenCharacter,
  onOpenQuests,
  onOpenGrimoire,
  onOpenDownload,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [nearbyInteraction, setNearbyInteraction] = useState<string | null>(null);

  // ResizeObserver for canvas container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.floor(width),
          height: Math.max(380, Math.floor(height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation render loop
  useEffect(() => {
    let animId: number;
    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGameWorld({
            ctx,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            zone,
            player,
            npcs,
            openedChests,
            defeatedMonsters,
            time,
          });
        }
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [zone, player, npcs, openedChests, defeatedMonsters]);

  // Check nearby interactive tile/NPC for prompt hint
  useEffect(() => {
    // Check adjacent tiles
    const checkCoords = [
      { x: player.x, y: player.y },
      { x: player.x + 1, y: player.y },
      { x: player.x - 1, y: player.y },
      { x: player.x, y: player.y + 1 },
      { x: player.x, y: player.y - 1 },
    ];

    // Check NPC
    const nearNpc = npcs.find(
      (npc) =>
        npc.zoneId === zone.id &&
        checkCoords.some((c) => c.x === npc.x && c.y === npc.y)
    );
    if (nearNpc) {
      setNearbyInteraction(`Talk with ${nearNpc.name}`);
      return;
    }

    // Check Tile trigger
    for (const c of checkCoords) {
      if (c.y >= 0 && c.y < zone.height && c.x >= 0 && c.x < zone.width) {
        const tile = zone.tiles[c.y][c.x];
        if (tile.trigger) {
          if (tile.trigger.type === 'chest' && !openedChests.has(tile.trigger.chestId || '')) {
            setNearbyInteraction('Open Treasure Chest');
            return;
          }
          if (tile.trigger.type === 'campfire') {
            setNearbyInteraction('Rest at Campfire (Restore HP/MP)');
            return;
          }
          if (tile.trigger.type === 'portal') {
            setNearbyInteraction('Step through Mystical Portal');
            return;
          }
          if (tile.trigger.type === 'lore') {
            setNearbyInteraction('Consult the Ancient Altar');
            return;
          }
        }
      }
    }

    setNearbyInteraction(null);
  }, [player.x, player.y, zone, npcs, openedChests]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          onMovePlayer(0, -1);
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          onMovePlayer(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          onMovePlayer(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          onMovePlayer(1, 0);
          break;
        case 'e':
        case ' ':
          e.preventDefault();
          onInteract();
          break;
        case 'i':
        case 'b':
          e.preventDefault();
          onOpenInventory();
          break;
        case 'c':
          e.preventDefault();
          onOpenCharacter();
          break;
        case 'q':
          e.preventDefault();
          onOpenQuests();
          break;
        case 'g':
          e.preventDefault();
          onOpenGrimoire();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMovePlayer, onInteract, onOpenInventory, onOpenCharacter, onOpenQuests, onOpenGrimoire]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 select-none overflow-hidden">
      {/* Top HUD Navigation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20 backdrop-blur-sm">
        {/* Player Status & Portrait */}
        <div className="flex items-center gap-3">
          <div
            onClick={onOpenCharacter}
            className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-indigo-500/60 overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-md"
            title="View Character Sheet (C)"
          >
            {player.customPortraitUrl ? (
              <img
                src={player.customPortraitUrl}
                alt={player.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-2xl">
                {player.heroClass === 'Warrior'
                  ? '🛡️'
                  : player.heroClass === 'Mage'
                  ? '🧙‍♂️'
                  : player.heroClass === 'Rogue'
                  ? '🗡️'
                  : '⚔️'}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">{player.name}</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Lv.{player.stats.level} {player.heroClass}
              </span>
            </div>

            {/* HP and MP Mini Bars */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.stats.hp / player.stats.maxHp) * 100)}%` }}
                  title={`HP: ${player.stats.hp}/${player.stats.maxHp}`}
                />
              </div>
              <div className="w-20 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.stats.mp / player.stats.maxMp) * 100)}%` }}
                  title={`MP: ${player.stats.mp}/${player.stats.maxMp}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Zone Badge & Danger Level */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">{zone.name}</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              zone.dangerLevel === 0
                ? 'bg-emerald-950 text-emerald-300'
                : zone.dangerLevel <= 2
                ? 'bg-amber-950 text-amber-300'
                : 'bg-rose-950 text-rose-300'
            }`}
          >
            {zone.dangerLevel === 0 ? 'Safe Zone' : `Danger Lv.${zone.dangerLevel}`}
          </span>
        </div>

        {/* HUD Quick Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Gold Display */}
          <div className="text-xs bg-amber-950/70 border border-amber-600/40 px-2.5 py-1 rounded-lg text-amber-300 font-bold flex items-center gap-1 mr-1">
            💰 {player.stats.gold}
          </div>

          <button
            id="hud-inventory-btn"
            onClick={onOpenInventory}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition-all hover:scale-105 flex items-center gap-1 text-xs"
            title="Inventory (B / I)"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline font-semibold">Bag</span>
          </button>

          <button
            id="hud-character-btn"
            onClick={onOpenCharacter}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition-all hover:scale-105 flex items-center gap-1 text-xs relative"
            title="Character Stats (C)"
          >
            <User className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline font-semibold">Hero</span>
            {player.stats.statPoints > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            id="hud-quests-btn"
            onClick={onOpenQuests}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition-all hover:scale-105 flex items-center gap-1 text-xs"
            title="Quests (Q)"
          >
            <Scroll className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline font-semibold">Quests</span>
          </button>

          <button
            id="hud-grimoire-btn"
            onClick={onOpenGrimoire}
            className="p-2 rounded-xl bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 text-white border border-indigo-500/50 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 text-xs shadow-lg"
            title="Mystic Forge AI Image Synthesizer (G)"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="font-bold">Mystic Forge</span>
          </button>

          <button
            id="hud-download-btn"
            onClick={onOpenDownload}
            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-semibold shadow-md"
            title="Скачать игру / Download Game"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Скачать</span>
          </button>

          <button
            id="hud-mute-btn"
            onClick={() => setIsMuted(sound.toggleMute())}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full block"
        />

        {/* Interaction Prompt Floating Pill */}
        {nearbyInteraction && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-slate-900/90 border-2 border-amber-400/80 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
              <span className="text-xs bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                SPACE / E
              </span>
              <span className="text-xs font-bold text-amber-200">{nearbyInteraction}</span>
            </div>
          </div>
        )}

        {/* Mini Radar / Controls overlay on bottom left */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:block bg-slate-900/70 p-2 rounded-xl border border-slate-800 backdrop-blur-xs text-[11px] text-slate-400">
          <div>Move: <span className="text-slate-200 font-bold">WASD / Arrow Keys</span></div>
          <div>Interact: <span className="text-slate-200 font-bold">SPACE / E</span></div>
          <div>Shortcuts: <span className="text-slate-200 font-bold">B, C, Q, G</span></div>
        </div>

        {/* Touch / Mobile Virtual D-Pad (bottom left) */}
        <div className="absolute bottom-5 left-5 z-20 flex flex-col items-center sm:hidden">
          <button
            onClick={() => onMovePlayer(0, -1)}
            className="w-11 h-11 rounded-xl bg-slate-900/80 active:bg-indigo-600 border border-slate-700 text-white flex items-center justify-center cursor-pointer shadow-lg"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div className="flex gap-4 my-1">
            <button
              onClick={() => onMovePlayer(-1, 0)}
              className="w-11 h-11 rounded-xl bg-slate-900/80 active:bg-indigo-600 border border-slate-700 text-white flex items-center justify-center cursor-pointer shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => onInteract()}
              className="w-11 h-11 rounded-xl bg-amber-600/90 active:bg-amber-500 border border-amber-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-lg"
            >
              <Hand className="w-5 h-5" />
            </button>
            <button
              onClick={() => onMovePlayer(1, 0)}
              className="w-11 h-11 rounded-xl bg-slate-900/80 active:bg-indigo-600 border border-slate-700 text-white flex items-center justify-center cursor-pointer shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => onMovePlayer(0, 1)}
            className="w-11 h-11 rounded-xl bg-slate-900/80 active:bg-indigo-600 border border-slate-700 text-white flex items-center justify-center cursor-pointer shadow-lg"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
