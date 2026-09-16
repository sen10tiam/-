import { Player, ZoneData, NPC } from '../types';
import {
  TILE_SIZE,
  drawEnhancedTile,
  drawEnhancedChest,
  drawEnhancedCampfire,
  drawEnhancedPortal,
  drawEnhancedLoreAltar,
  drawOverworldMonster,
  drawEnhancedNPC,
  drawEnhancedPlayer,
} from './spriteRenderer';

export { TILE_SIZE };

export interface RenderContextOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  zone: ZoneData;
  player: Player;
  npcs: NPC[];
  openedChests: Set<string>;
  defeatedMonsters: Set<string>;
  time: number;
}

export function renderGameWorld(options: RenderContextOptions) {
  const { ctx, canvasWidth, canvasHeight, zone, player, npcs, openedChests, defeatedMonsters, time } = options;

  // Clear background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate camera offset (keep player centered smoothly)
  const targetCamX = player.x * TILE_SIZE + TILE_SIZE / 2 - canvasWidth / 2;
  const targetCamY = player.y * TILE_SIZE + TILE_SIZE / 2 - canvasHeight / 2;

  // Clamp camera to map bounds
  const mapPixelWidth = zone.width * TILE_SIZE;
  const mapPixelHeight = zone.height * TILE_SIZE;

  const camX = Math.max(0, Math.min(mapPixelWidth - canvasWidth, targetCamX));
  const camY = Math.max(0, Math.min(mapPixelHeight - canvasHeight, targetCamY));

  ctx.save();
  ctx.translate(-camX, -camY);

  // 1. Draw tiles in visible viewport
  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
  const endCol = Math.min(zone.width - 1, Math.ceil((camX + canvasWidth) / TILE_SIZE));
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
  const endRow = Math.min(zone.height - 1, Math.ceil((camY + canvasHeight) / TILE_SIZE));

  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      const tile = zone.tiles[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      drawEnhancedTile(ctx, tile.type, px, py, time, x, y);

      // Draw interactive tile triggers
      if (tile.trigger) {
        const trigger = tile.trigger;
        if (trigger.type === 'chest') {
          const isOpened = openedChests.has(trigger.chestId || '');
          drawEnhancedChest(ctx, px, py, isOpened, time);
        } else if (trigger.type === 'campfire') {
          drawEnhancedCampfire(ctx, px, py, time);
        } else if (trigger.type === 'portal') {
          drawEnhancedPortal(ctx, px, py, time);
        } else if (trigger.type === 'monster') {
          const monsterKey = `${zone.id}_${x}_${y}`;
          if (!defeatedMonsters.has(monsterKey)) {
            drawOverworldMonster(ctx, px, py, trigger.monsterId || '', time);
          }
        } else if (trigger.type === 'lore') {
          drawEnhancedLoreAltar(ctx, px, py, time);
        }
      }
    }
  }

  // 2. Draw NPCs in current zone
  npcs.filter((npc) => npc.zoneId === zone.id).forEach((npc) => {
    drawEnhancedNPC(ctx, npc, time);
  });

  // 3. Draw Player Hero with dynamic walk cycle & equipment
  drawEnhancedPlayer(ctx, player, time);

  ctx.restore();

  // 4. Subtle ambient lighting / atmospheric vignette depending on zone danger
  drawZoneAtmosphere(ctx, canvasWidth, canvasHeight, zone.dangerLevel, time);
}

function drawZoneAtmosphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dangerLevel: number,
  time: number
) {
  // Edge shadow vignette
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75
  );

  if (dangerLevel === 0) {
    // Peaceful warm golden sun haze
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
  } else if (dangerLevel <= 2) {
    // Forest twilight / mysterious blue
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(6, 78, 59, 0.35)');
  } else if (dangerLevel <= 4) {
    // Crypt subterranean gloom
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
  } else {
    // Volcanic embers or Citadel nether void
    const pulse = Math.sin(time * 0.003) * 0.08;
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    grad.addColorStop(1, `rgba(69, 10, 10, ${0.65 + pulse})`);
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
