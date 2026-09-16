/**
 * Chronicles of Eldoria - High Quality Procedural Sprite Engine
 * Renders handcrafted pixel-art style sprites for Heroes, Monsters, NPCs, and World Elements
 */

import { Player, NPC, Monster, HeroClass } from '../types';

export const TILE_SIZE = 40;

// Helper for deterministic pseudo-random per tile
export function tileHash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 982451653) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

// -------------------------------------------------------------
// 1. TILE SPRITE RENDERING
// -------------------------------------------------------------

export function drawEnhancedTile(
  ctx: CanvasRenderingContext2D,
  type: string,
  px: number,
  py: number,
  time: number,
  tx: number,
  ty: number
) {
  const hash = tileHash(tx, ty);
  const variant = hash % 5;

  switch (type) {
    case 'grass': {
      // Rich gradient base
      const grad = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
      grad.addColorStop(0, '#166534');
      grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Subtle texture dots
      ctx.fillStyle = '#14532d';
      ctx.fillRect(px + (hash % 28) + 4, py + ((hash >> 3) % 28) + 4, 3, 2);

      // Grass tufts with gentle wind animation
      const wind = Math.sin(time * 0.003 + tx * 0.4 + ty * 0.3) * 1.5;
      ctx.fillStyle = '#22c55e';
      const gx1 = px + 6 + (hash % 12);
      const gy1 = py + 10 + ((hash >> 2) % 16);
      ctx.fillRect(gx1 + wind, gy1, 2, 5);
      ctx.fillRect(gx1 + 3 + wind, gy1 - 2, 2, 7);

      // Occasional wildflowers on certain tiles
      if (variant === 0) {
        // White daisy
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 26, py + 14, 3, 3);
        ctx.fillRect(px + 25, py + 13, 2, 2);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 26, py + 14, 1, 1);
      } else if (variant === 1) {
        // Blue bellflower
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(px + 12, py + 26, 3, 4);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(px + 13, py + 25, 2, 2);
      } else if (variant === 2) {
        // Tiny pebble
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px + 24, py + 28, 4, 3);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + 24, py + 28, 2, 1);
      }
      break;
    }

    case 'path': {
      // Earth background
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Cobblestone pattern (distinct flagstones)
      const stones = [
        { x: 2, y: 2, w: 16, h: 10, col: '#d97706' },
        { x: 20, y: 2, w: 18, h: 12, col: '#b45309' },
        { x: 2, y: 14, w: 12, h: 12, col: '#b45309' },
        { x: 16, y: 16, w: 14, h: 10, col: '#d97706' },
        { x: 32, y: 16, w: 6, h: 12, col: '#92400e' },
        { x: 2, y: 28, w: 18, h: 10, col: '#b45309' },
        { x: 22, y: 28, w: 16, h: 10, col: '#d97706' },
      ];

      for (const s of stones) {
        // Stone shadow/mortar
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + s.x + 1, py + s.y + 1, s.w, s.h);
        // Stone face
        ctx.fillStyle = s.col;
        ctx.fillRect(px + s.x, py + s.y, s.w - 1, s.h - 1);
        // Stone top-left highlight
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + s.x, py + s.y, s.w - 2, 2);
        ctx.fillRect(px + s.x, py + s.y, 2, s.h - 2);
      }
      break;
    }

    case 'water': {
      // Animated water with caustics and wave highlights
      const wave1 = Math.sin(time * 0.003 + tx * 0.7 + ty * 0.5) * 3;
      const wave2 = Math.cos(time * 0.0025 + tx * 0.4 - ty * 0.6) * 3;

      // Base deep water
      const waterGrad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
      waterGrad.addColorStop(0, '#0369a1');
      waterGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Shimmer lines
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 4, py + 8 + wave1, 14, 2);
      ctx.fillRect(px + 22, py + 22 + wave2, 14, 2);

      // Sparkle glints
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(px + 8 + ((hash >> 1) % 18), py + 14 + wave1, 3, 2);

      // Floating lily pad on rare tiles
      if (variant === 4) {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(px + 18, py + 18 + wave2 * 0.5, 7, 5, 0, 0, Math.PI * 1.7);
        ctx.fill();
        // Pink lotus flower
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(px + 16, py + 16 + wave2 * 0.5, 3, 3);
        ctx.fillStyle = '#fdf2f8';
        ctx.fillRect(px + 17, py + 17 + wave2 * 0.5, 1, 1);
      }
      break;
    }

    case 'lava': {
      // Swirling molten magma
      const pulse = Math.sin(time * 0.005 + tx + ty) * 20;
      ctx.fillStyle = `rgb(${210 + Math.round(pulse)}, 40, 10)`;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Dark floating cooling crust
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(px + 4, py + 6, 12, 10);
      ctx.fillRect(px + 20, py + 18, 14, 12);

      // Bright magma rivers
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(px + 2, py + 18, 16, 4);
      ctx.fillRect(px + 18, py + 8, 14, 4);

      // Yellow glowing hot spots & bubbles
      const bubble = Math.abs(Math.sin(time * 0.007 + hash)) * 4;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(px + 14, py + 22, 2 + bubble, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px + 26, py + 12, 3, 3);
      break;
    }

    case 'tree': {
      // Grass backdrop
      ctx.fillStyle = '#15803d';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Trunk shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 36, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk with roots
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px + 15, py + 20, 10, 16);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 16, py + 20, 8, 15);
      // Bark texture line
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 18, py + 22, 2, 10);

      // Multi-layer lush canopy with shadows & highlights
      // Lower canopy (shadow)
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(px + 20, py + 16, 17, 0, Math.PI * 2);
      ctx.fill();

      // Middle canopy
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(px + 20, py + 13, 14, 0, Math.PI * 2);
      ctx.fill();

      // Top canopy (sunlit)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px + 18, py + 10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Foliage highlight dots
      ctx.fillStyle = '#86efac';
      ctx.fillRect(px + 14, py + 8, 3, 2);
      ctx.fillRect(px + 22, py + 12, 2, 2);
      break;
    }

    case 'wall': {
      // Stone masonry wall with bevels and mortar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Wall stones
      const bricks = [
        { x: 0, y: 0, w: 20, h: 12 },
        { x: 21, y: 0, w: 19, h: 12 },
        { x: 0, y: 13, w: 10, h: 13 },
        { x: 11, y: 13, w: 18, h: 13 },
        { x: 30, y: 13, w: 10, h: 13 },
        { x: 0, y: 27, w: 19, h: 13 },
        { x: 20, y: 27, w: 20, h: 13 },
      ];

      for (const b of bricks) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + b.x, py + b.y, b.w - 1, b.h - 1);
        ctx.fillStyle = '#64748b'; // highlight top edge
        ctx.fillRect(px + b.x, py + b.y, b.w - 1, 2);
        ctx.fillStyle = '#334155'; // shadow bottom edge
        ctx.fillRect(px + b.x, py + b.y + b.h - 3, b.w - 1, 2);
      }

      // Occasional wall torch on specific coordinates
      if ((tx + ty * 3) % 7 === 0) {
        drawWallTorch(ctx, px + 16, py + 6, time);
      }
      break;
    }

    case 'dungeon_wall': {
      // Dark ancient obsidian bricks with glowing rune cracks
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Dark indigo stone
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px + 1, py + 1, 18, 17);
      ctx.fillRect(px + 21, py + 1, 18, 17);
      ctx.fillRect(px + 1, py + 20, 38, 18);

      // Rune glow in cracks
      const runePulse = Math.sin(time * 0.004 + tx * 2) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(168, 85, 247, ${runePulse})`;
      ctx.fillRect(px + 8, py + 26, 8, 2);
      ctx.fillRect(px + 12, py + 22, 2, 8);
      ctx.fillRect(px + 26, py + 8, 2, 5);
      break;
    }

    case 'floor': {
      // Flagstone dungeon / house floor
      ctx.fillStyle = '#334155';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      // Inset decorative line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1.5, py + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
      // Diamond center tile
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px + 18, py + 18, 4, 4);
      break;
    }

    case 'stone': {
      // Natural boulder
      ctx.fillStyle = '#166534';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 30, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boulder body
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(px + 20, py + 20, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight facet
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.ellipse(px + 18, py + 16, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Moss patch
      ctx.fillStyle = '#15803d';
      ctx.fillRect(px + 12, py + 16, 5, 3);
      break;
    }

    case 'door': {
      // Wooden reinforced doorway
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Wood planks
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, TILE_SIZE - 2);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 8, py + 4, 6, TILE_SIZE - 6);
      ctx.fillRect(px + 18, py + 4, 6, TILE_SIZE - 6);
      ctx.fillRect(px + 28, py + 4, 6, TILE_SIZE - 6);

      // Iron hinges & handle
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + 4, py + 8, TILE_SIZE - 8, 3);
      ctx.fillRect(px + 4, py + 26, TILE_SIZE - 8, 3);
      // Brass handle
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px + 28, py + 20, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bridge': {
      // Water beneath
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // Wooden planks
      for (let i = 2; i < TILE_SIZE - 2; i += 7) {
        ctx.fillStyle = '#451a03'; // shadow
        ctx.fillRect(px + 1, py + i + 1, TILE_SIZE - 2, 5);
        ctx.fillStyle = '#92400e'; // plank
        ctx.fillRect(px + 1, py + i, TILE_SIZE - 2, 5);
        ctx.fillStyle = '#b45309'; // plank highlight
        ctx.fillRect(px + 1, py + i, TILE_SIZE - 2, 1);
        // Iron nails
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px + 4, py + i + 2, 2, 2);
        ctx.fillRect(px + TILE_SIZE - 6, py + i + 2, 2, 2);
      }
      // Rope railings
      ctx.fillStyle = '#d97706';
      ctx.fillRect(px + 2, py, 2, TILE_SIZE);
      ctx.fillRect(px + TILE_SIZE - 4, py, 2, TILE_SIZE);
      break;
    }

    default: {
      ctx.fillStyle = '#166534';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawWallTorch(ctx: CanvasRenderingContext2D, px: number, py: number, time: number) {
  // Sconce mount
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + 3, py + 8, 2, 6);
  ctx.fillStyle = '#475569';
  ctx.fillRect(px + 2, py + 6, 4, 3);

  // Animated torch flame
  const flick = Math.sin(time * 0.015 + px) * 1.5;
  // Glow halo
  ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.beginPath();
  ctx.arc(px + 4, py + 3, 14, 0, Math.PI * 2);
  ctx.fill();

  // Flame layers
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(px + 4, py + 3 + flick, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(px + 4, py + 2 + flick, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(px + 3, py + 1 + flick, 2, 2);
}

// -------------------------------------------------------------
// 2. INTERACTIVE OBJECT SPRITES
// -------------------------------------------------------------

export function drawEnhancedChest(ctx: CanvasRenderingContext2D, px: number, py: number, isOpened: boolean, time: number) {
  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(px + 20, py + 34, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!isOpened) {
    // Closed Treasure Chest with ornate gilded iron bands
    // Chest base
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 6, py + 16, 28, 16);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 7, py + 17, 26, 14);

    // Arched Lid
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(px + 5, py + 10, 30, 9, [4, 4, 0, 0]);
    ctx.fill();

    // Gold decorative bands & corner brackets
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px + 9, py + 10, 4, 21);
    ctx.fillRect(px + 27, py + 10, 4, 21);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(px + 10, py + 10, 2, 21);
    ctx.fillRect(px + 28, py + 10, 2, 21);

    // Rivets on bands
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 10, py + 12, 2, 2);
    ctx.fillRect(px + 28, py + 12, 2, 2);
    ctx.fillRect(px + 10, py + 26, 2, 2);
    ctx.fillRect(px + 28, py + 26, 2, 2);

    // Ornate Golden Lock & Keyhole
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px + 17, py + 17, 6, 8);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(px + 18, py + 18, 4, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(px + 19, py + 20, 2, 3);

    // Magical Shimmer Sparkle (pulsing)
    const shimmer = Math.sin(time * 0.006) > 0.3;
    if (shimmer) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 29, py + 8, 3, 3);
      ctx.fillRect(px + 30, py + 7, 1, 5);
      ctx.fillRect(px + 28, py + 9, 5, 1);
    }
  } else {
    // Open chest with visible interior
    ctx.fillStyle = '#291404';
    ctx.fillRect(px + 6, py + 18, 28, 14);
    // Open lid tilted back
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 6, py + 8, 28, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 8, py + 9, 24, 6);
    // Interior velvet lining (empty)
    ctx.fillStyle = '#581c87';
    ctx.fillRect(px + 8, py + 19, 24, 11);
    // Latch
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px + 18, py + 20, 4, 3);
  }
}

export function drawEnhancedCampfire(ctx: CanvasRenderingContext2D, px: number, py: number, time: number) {
  // Stone ring around fire pit
  const stones = [
    { x: 8, y: 26 }, { x: 14, y: 29 }, { x: 22, y: 29 }, { x: 28, y: 26 },
    { x: 6, y: 21 }, { x: 30, y: 21 }, { x: 10, y: 17 }, { x: 26, y: 17 },
  ];
  for (const s of stones) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(px + s.x, py + s.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(px + s.x - 1, py + s.y - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Charcoal embers bed
  ctx.fillStyle = '#450a0a';
  ctx.beginPath();
  ctx.ellipse(px + 20, py + 24, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Crossed burnt wooden logs
  ctx.fillStyle = '#291404';
  ctx.fillRect(px + 10, py + 22, 20, 4);
  ctx.fillRect(px + 12, py + 20, 16, 4);

  // Dynamic Multi-layered Dancing Fire
  const f1 = Math.sin(time * 0.012) * 2;
  const f2 = Math.cos(time * 0.018) * 2;

  // Warm ambient light pool
  ctx.fillStyle = 'rgba(249, 115, 22, 0.22)';
  ctx.beginPath();
  ctx.arc(px + 20, py + 20, 22, 0, Math.PI * 2);
  ctx.fill();

  // Outer red fire tongue
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(px + 11, py + 25);
  ctx.quadraticCurveTo(px + 20 + f1, py + 8 + f2, px + 29, py + 25);
  ctx.fill();

  // Middle orange tongue
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(px + 14, py + 24);
  ctx.quadraticCurveTo(px + 20 + f2, py + 12 + f1, px + 26, py + 24);
  ctx.fill();

  // Inner bright yellow flame core
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(px + 17, py + 23);
  ctx.quadraticCurveTo(px + 20, py + 15, px + 23, py + 23);
  ctx.fill();

  // Drifting hot spark embers
  const sparkY1 = ((time * 0.03 + px) % 18);
  const sparkY2 = ((time * 0.025 + py * 2) % 18);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(px + 18 + f1, py + 16 - sparkY1, 2, 2);
  ctx.fillRect(px + 23 - f2, py + 18 - sparkY2, 1, 1);
}

export function drawEnhancedPortal(ctx: CanvasRenderingContext2D, px: number, py: number, time: number) {
  const cx = px + 20;
  const cy = py + 20;

  // Outer magical ground runic circle
  ctx.save();
  ctx.translate(cx, cy);

  // Pulsing glow
  const pulse = Math.sin(time * 0.005) * 3;
  ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
  ctx.beginPath();
  ctx.arc(0, 0, 20 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Stone portal ring frame
  ctx.strokeStyle = '#312e81';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.stroke();

  // Rotating vortex spiral
  const angle = (time * 0.004) % (Math.PI * 2);
  ctx.rotate(angle);

  // Dimensional vortex arms
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = i % 2 === 0 ? '#818cf8' : '#c084fc';
    ctx.beginPath();
    ctx.ellipse(6, 0, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brilliant star center
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 3 + Math.sin(time * 0.01), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawEnhancedLoreAltar(ctx: CanvasRenderingContext2D, px: number, py: number, time: number) {
  // Stepped stone pedestal
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(px + 4, py + 24, 32, 12);
  ctx.fillStyle = '#334155';
  ctx.fillRect(px + 6, py + 20, 28, 6);
  ctx.fillStyle = '#475569';
  ctx.fillRect(px + 8, py + 14, 24, 8);

  // Ancient Monolith with carved glowing runes
  ctx.fillStyle = '#64748b';
  ctx.fillRect(px + 12, py + 4, 16, 12);

  // Pulsing cyan runic glyphs
  const runeGlow = (Math.sin(time * 0.004) * 0.4 + 0.6);
  ctx.fillStyle = `rgba(56, 189, 248, ${runeGlow})`;
  ctx.fillRect(px + 15, py + 7, 4, 2);
  ctx.fillRect(px + 16, py + 10, 8, 2);
  ctx.fillRect(px + 21, py + 6, 2, 5);

  // Floating Arcane Mana Orb atop altar
  const float = Math.sin(time * 0.005) * 3;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.arc(px + 20, py - 2 + float, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(px + 20, py - 2 + float, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(px + 18.5, py - 3.5 + float, 2, 0, Math.PI * 2);
  ctx.fill();
}

// -------------------------------------------------------------
// 3. DETAILED OVERWORLD MONSTER SPRITES
// -------------------------------------------------------------

export function drawOverworldMonster(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  monsterId: string,
  time: number
) {
  const bob = Math.sin(time * 0.007) * 2;
  const isBoss = monsterId.includes('sorcerer') || monsterId.includes('drake');

  // Ground shadow
  ctx.fillStyle = isBoss ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(px + 20, py + 34, isBoss ? 16 : 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (monsterId.includes('wolf')) {
    // --- TIMBER WOLF SPRITE ---
    // Fur body
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.ellipse(px + 20, py + 22 + bob, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wolf Head & pointed ears
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.arc(px + 14, py + 16 + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.moveTo(px + 11, py + 13 + bob);
    ctx.lineTo(px + 13, py + 8 + bob);
    ctx.lineTo(px + 15, py + 13 + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 13 + bob);
    ctx.lineTo(px + 17, py + 8 + bob);
    ctx.lineTo(px + 19, py + 13 + bob);
    ctx.fill();
    // Muzzle & glowing eyes
    ctx.fillStyle = '#292524';
    ctx.fillRect(px + 9, py + 17 + bob, 4, 3);
    ctx.fillStyle = '#f87171'; // Glowing red eye
    ctx.fillRect(px + 12, py + 15 + bob, 2, 2);
    // Bushy tail
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.ellipse(px + 30, py + 19 + bob, 5, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (monsterId.includes('goblin')) {
    // --- GOBLIN PILLAGER SPRITE ---
    // Leather tunic
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 14, py + 20 + bob, 12, 10);
    // Green goblin head
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(px + 20, py + 14 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    // Pointy ears
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(px + 13, py + 14 + bob);
    ctx.lineTo(px + 8, py + 12 + bob);
    ctx.lineTo(px + 13, py + 17 + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 27, py + 14 + bob);
    ctx.lineTo(px + 32, py + 12 + bob);
    ctx.lineTo(px + 27, py + 17 + bob);
    ctx.fill();
    // Red bandana
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(px + 14, py + 10 + bob, 12, 3);
    // Beady yellow eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 17, py + 13 + bob, 2, 2);
    ctx.fillRect(px + 21, py + 13 + bob, 2, 2);
    // Jagged dagger
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px + 27, py + 16 + bob, 5, 2);
  } else if (monsterId.includes('skeleton')) {
    // --- CRYPT SKELETON GUARD ---
    // Bony ribcage
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px + 16, py + 18 + bob, 8, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 18, py + 20 + bob, 4, 2);
    ctx.fillRect(px + 18, py + 24 + bob, 4, 2);
    // Skull
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(px + 20, py + 12 + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    // Glowing cyan eye sockets
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(px + 18, py + 11 + bob, 2, 2);
    ctx.fillRect(px + 22, py + 11 + bob, 2, 2);
    // Rusty sword & cracked shield
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 26, py + 10 + bob, 2, 14);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(px + 13, py + 22 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (monsterId.includes('sorcerer')) {
    // --- MALAKOR THE VOIDCALLER (BOSS) ---
    // Floating purple void aura
    const aura = Math.sin(time * 0.008) * 3;
    ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
    ctx.beginPath();
    ctx.arc(px + 20, py + 16 + bob, 16 + aura, 0, Math.PI * 2);
    ctx.fill();
    // Flowing dark robes
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 14 + bob);
    ctx.lineTo(px + 28, py + 14 + bob);
    ctx.lineTo(px + 32, py + 32 + bob);
    ctx.lineTo(px + 8, py + 32 + bob);
    ctx.closePath();
    ctx.fill();
    // Dark cowl hood
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.arc(px + 20, py + 12 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    // Empty shadow face with piercing amethyst eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 16, py + 11 + bob, 8, 5);
    ctx.fillStyle = '#e879f9';
    ctx.fillRect(px + 17, py + 12 + bob, 2, 2);
    ctx.fillRect(px + 21, py + 12 + bob, 2, 2);
    // Floating skull orb in hand
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(px + 28, py + 20 + bob - aura, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (monsterId.includes('drake')) {
    // --- IGNIS PRIME DRAGON (BOSS) ---
    // Dragon wings
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 16 + bob);
    ctx.lineTo(px - 4, py + 6 + bob);
    ctx.lineTo(px + 12, py + 12 + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 34, py + 16 + bob);
    ctx.lineTo(px + 44, py + 6 + bob);
    ctx.lineTo(px + 28, py + 12 + bob);
    ctx.fill();
    // Scaled red dragon body
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(px + 20, py + 20 + bob, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dragon head with golden horns
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(px + 20, py + 12 + bob, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Golden horns
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 8 + bob);
    ctx.lineTo(px + 11, py + 2 + bob);
    ctx.lineTo(px + 17, py + 7 + bob);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 25, py + 8 + bob);
    ctx.lineTo(px + 29, py + 2 + bob);
    ctx.lineTo(px + 23, py + 7 + bob);
    ctx.fill();
    // Burning yellow dragon eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 16, py + 11 + bob, 2, 2);
    ctx.fillRect(px + 22, py + 11 + bob, 2, 2);
    // Smoke puffs from nostrils
    ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.fillRect(px + 19, py + 15 + bob, 2, 2);
  } else {
    // Default monster
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(px + 20, py + 18 + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 16, py + 15 + bob, 2, 3);
    ctx.fillRect(px + 22, py + 15 + bob, 2, 3);
  }

  // Floating combat alert icon
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚔️', px + 20, py + 4 + bob);
  ctx.textAlign = 'start';
}

// -------------------------------------------------------------
// 4. DETAILED NPC SPRITES
// -------------------------------------------------------------

export function drawEnhancedNPC(ctx: CanvasRenderingContext2D, npc: NPC, time: number) {
  const px = npc.x * TILE_SIZE;
  const py = npc.y * TILE_SIZE;
  const bob = Math.sin(time * 0.003 + npc.x) * 1;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(px + 20, py + 35, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (npc.id.includes('elder')) {
    // --- ELDER ARIN (Wise Wizard Elder) ---
    // Robe
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(px + 12, py + 16 + bob, 16, 17);
    ctx.fillStyle = '#fbbf24'; // Gold trim
    ctx.fillRect(px + 19, py + 16 + bob, 2, 17);
    // Head & face
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(px + 20, py + 11 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    // Long white beard
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(px + 14, py + 12 + bob);
    ctx.lineTo(px + 26, py + 12 + bob);
    ctx.lineTo(px + 20, py + 22 + bob);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 17, py + 10 + bob, 2, 2);
    ctx.fillRect(px + 21, py + 10 + bob, 2, 2);
    // Wooden staff with amber crystal
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 28, py + 6 + bob, 3, 26);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px + 29.5, py + 5 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (npc.id.includes('blacksmith')) {
    // --- MARCUS ANVILHEART (Blacksmith) ---
    // Leather blacksmith apron over burly shirt
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + 11, py + 15 + bob, 18, 18);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 14, py + 17 + bob, 12, 15);
    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(px + 20, py + 11 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    // Bushy brown beard
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 15, py + 12 + bob, 10, 6);
    // Eyes & red headband
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(px + 13, py + 6 + bob, 14, 3);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 17, py + 10 + bob, 2, 2);
    ctx.fillRect(px + 21, py + 10 + bob, 2, 2);
    // Heavy iron forge hammer
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 29, py + 12 + bob, 2, 18);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + 26, py + 10 + bob, 8, 6);
  } else if (npc.id.includes('alchemist')) {
    // --- LYRA MOONWHISPER (Apothecary) ---
    // Emerald green dress
    ctx.fillStyle = '#065f46';
    ctx.fillRect(px + 12, py + 16 + bob, 16, 17);
    // Head & auburn hair
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(px + 20, py + 11 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.arc(px + 20, py + 8 + bob, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    // Potion satchel & glowing flask
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 10, py + 22 + bob, 4, 6);
    // Glowing cyan vial in hand
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + 27, py + 18 + bob, 4, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 28, py + 16 + bob, 2, 2);
  } else if (npc.id.includes('ranger')) {
    // --- SYLAS SWIFTWOOD (Ranger) ---
    // Forest tunic & green hood
    ctx.fillStyle = '#166534';
    ctx.fillRect(px + 12, py + 16 + bob, 16, 16);
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(px + 20, py + 10 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    // Face shadow & eyes
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(px + 17, py + 10 + bob, 6, 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 18, py + 11 + bob, 2, 2);
    ctx.fillRect(px + 21, py + 11 + bob, 2, 2);
    // Quiver on back with feather arrows
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 7, py + 10 + bob, 4, 16);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px + 8, py + 6 + bob, 2, 4);
  } else {
    // Generic friendly villager
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(px + 12, py + 16 + bob, 16, 16);
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(px + 20, py + 11 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floating quest / chat bubble indicator above head
  const floatPrompt = Math.sin(time * 0.005) * 3;
  if (npc.questId) {
    // Exclamation Mark badge with pulsing glow
    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.beginPath();
    ctx.arc(px + 20, py - 6 + floatPrompt, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(px + 20, py - 6 + floatPrompt, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', px + 20, py - 2 + floatPrompt);
    ctx.textAlign = 'start';
  } else {
    // Speech bubble
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(px + 11, py - 14 + floatPrompt, 18, 12, 4);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💬', px + 20, py - 5 + floatPrompt);
    ctx.textAlign = 'start';
  }
}

// -------------------------------------------------------------
// 5. DETAILED PLAYER HERO SPRITES (WITH ANIMATED WALK CYCLE)
// -------------------------------------------------------------

export function drawEnhancedPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  time: number
) {
  const px = player.x * TILE_SIZE;
  const py = player.y * TILE_SIZE;

  // Walk cycle calculation
  const isMoving = player.isMoving;
  const walkPhase = isMoving ? (time * 0.012) : 0;
  const bob = isMoving ? Math.sin(walkPhase * 2) * 2 : Math.sin(time * 0.003) * 1;
  const legOffset = isMoving ? Math.sin(walkPhase) * 4 : 0;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(px + 20, py + 35, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Legs (animated footsteps)
  ctx.fillStyle = '#1e293b';
  if (player.direction === 'up' || player.direction === 'down') {
    // Left & right boots
    ctx.fillRect(px + 14, py + 28 + legOffset, 4, 6);
    ctx.fillRect(px + 22, py + 28 - legOffset, 4, 6);
  } else {
    ctx.fillRect(px + 18 + legOffset, py + 28, 5, 6);
  }

  // Draw Class-Specific Hero Body & Equipment
  drawHeroClassBody(ctx, px, py, player.heroClass, player.direction, bob, time);

  // Weapon in hand
  drawHeroWeapon(ctx, px, py, player.heroClass, player.direction, bob, time);

  // Player Name Tag & Level Badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(px + 1, py - 14, 38, 13, 3);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.name.slice(0, 8), px + 20, py - 4);
  ctx.textAlign = 'start';
}

function drawHeroClassBody(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  heroClass: HeroClass,
  direction: string,
  bob: number,
  time: number
) {
  const headY = py + 11 + bob;

  switch (heroClass) {
    case 'Warrior': {
      // --- WARRIOR (Heavy steel plate armor & winged helmet) ---
      // Steel Breastplate & crimson sash
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px + 12, py + 16 + bob, 16, 14);
      ctx.fillStyle = '#dc2626'; // crimson tabard
      ctx.fillRect(px + 16, py + 16 + bob, 8, 14);
      // Steel Pauldrons
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 10, py + 16 + bob, 4, 6);
      ctx.fillRect(px + 26, py + 16 + bob, 4, 6);

      // Steel Helmet with golden crest
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(px + 20, headY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b'; // Gold crest plume
      ctx.fillRect(px + 19, headY - 10, 2, 5);

      // Visor slit / face
      if (direction !== 'up') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 16, headY - 1, 8, 3);
        ctx.fillStyle = '#38bdf8'; // Glowing blue visor slit
        ctx.fillRect(px + 17, headY, 6, 1);
      }
      break;
    }

    case 'Mage': {
      // --- MAGE (Archmage royal robes & pointed mystic hat) ---
      // Flowing sapphire/purple robe with gold embroidery
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(px + 11, py + 16 + bob, 18, 15);
      ctx.fillStyle = '#fbbf24'; // Golden runes
      ctx.fillRect(px + 19, py + 16 + bob, 2, 15);

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(px + 20, headY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Pointed Wizard Hat
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(px + 12, headY - 3);
      ctx.lineTo(px + 20, headY - 14);
      ctx.lineTo(px + 28, headY - 3);
      ctx.closePath();
      ctx.fill();
      // Hat brim
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 10, headY - 3, 20, 2);

      // Eyes
      if (direction !== 'up') {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 17, headY, 2, 2);
        ctx.fillRect(px + 21, headY, 2, 2);
      }
      break;
    }

    case 'Rogue': {
      // --- ROGUE (Shadow cowl & agile leather armor) ---
      // Dark leather vest with criss-cross straps
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(px + 12, py + 16 + bob, 16, 14);
      ctx.fillStyle = '#047857';
      ctx.fillRect(px + 14, py + 18 + bob, 12, 10);

      // Dark shadow cowl hood
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(px + 20, headY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Face shadow with piercing amber eyes
      if (direction !== 'up') {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(px + 15, headY - 2, 10, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 17, headY, 2, 2);
        ctx.fillRect(px + 21, headY, 2, 2);
      }
      break;
    }

    case 'Paladin': {
      // --- PALADIN (Shining silver plate & radiant holy halo) ---
      // Silver & Gold Armor
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 12, py + 16 + bob, 16, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + 17, py + 16 + bob, 6, 14);

      // Golden Holy Circlet / Helm
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(px + 20, headY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Radiant Halo
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + 20, headY - 5, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Eyes
      if (direction !== 'up') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + 17, headY, 2, 2);
        ctx.fillRect(px + 21, headY, 2, 2);
      }
      break;
    }
  }
}

function drawHeroWeapon(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  heroClass: HeroClass,
  direction: string,
  bob: number,
  time: number
) {
  const isRight = direction === 'right';
  const isLeft = direction === 'left';
  const isUp = direction === 'up';

  switch (heroClass) {
    case 'Warrior': {
      // Iron broadsword & heater shield
      if (isRight) {
        // Sword pointing right
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px + 27, py + 16 + bob, 10, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 25, py + 14 + bob, 3, 7); // guard
      } else if (isLeft) {
        // Sword pointing left
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px + 3, py + 16 + bob, 10, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 12, py + 14 + bob, 3, 7);
      } else {
        // Front or back view: Sword on right hip, shield on left
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(px + 28, py + 16 + bob, 3, 12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 26, py + 16 + bob, 7, 2);
        // Heater Shield on left arm
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.roundRect(px + 7, py + 16 + bob, 6, 12, [2, 2, 4, 4]);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px + 9, py + 18 + bob, 2, 8);
      }
      break;
    }

    case 'Mage': {
      // Archmage Staff with glowing floating gem
      const staffX = isLeft ? px + 6 : px + 28;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(staffX, py + 6 + bob, 3, 24);
      // Floating elemental orb with particle pulse
      const gemPulse = Math.sin(time * 0.008) * 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(staffX + 1.5, py + 4 + bob + gemPulse, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(staffX + 1.5, py + 4 + bob + gemPulse, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'Rogue': {
      // Twin silver daggers
      ctx.fillStyle = '#e2e8f0';
      if (isRight) {
        ctx.fillRect(px + 26, py + 16 + bob, 8, 2);
        ctx.fillRect(px + 24, py + 22 + bob, 7, 2);
      } else if (isLeft) {
        ctx.fillRect(px + 6, py + 16 + bob, 8, 2);
        ctx.fillRect(px + 9, py + 22 + bob, 7, 2);
      } else {
        ctx.fillRect(px + 8, py + 18 + bob, 2, 8);
        ctx.fillRect(px + 30, py + 18 + bob, 2, 8);
      }
      break;
    }

    case 'Paladin': {
      // Holy War Hammer / Sunblade
      const weaponX = isLeft ? px + 4 : px + 26;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(weaponX, py + 14 + bob, 4, 14);
      // Radiant golden hammerhead
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(weaponX - 3, py + 10 + bob, 10, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(weaponX - 2, py + 11 + bob, 8, 2);
      break;
    }
  }
}
