import React, { useRef, useEffect } from 'react';
import { Monster, Player, HeroClass } from '../types';

interface CombatBattleSpriteProps {
  type: 'monster' | 'player';
  monster?: Monster;
  player?: Player;
  isHit?: boolean;
  isAttacking?: boolean;
  hasShield?: boolean;
}

export const CombatBattleSprite: React.FC<CombatBattleSpriteProps> = ({
  type,
  monster,
  player,
  isHit,
  isAttacking,
  hasShield,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Hit recoil and flash
      if (isHit) {
        ctx.translate(type === 'monster' ? 8 : -8, 0);
      }
      if (isAttacking) {
        ctx.translate(type === 'monster' ? -12 : 12, 0);
      }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;

      if (type === 'monster' && monster) {
        drawMonsterBattleSprite(ctx, cx, cy, monster, time, isHit);
      } else if (type === 'player' && player) {
        drawHeroBattleSprite(ctx, cx, cy, player.heroClass, time, isHit, hasShield);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [type, monster, player, isHit, isAttacking, hasShield]);

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
};

// -------------------------------------------------------------
// COMBAT MONSTER SPRITE RENDERER
// -------------------------------------------------------------
function drawMonsterBattleSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  monster: Monster,
  time: number,
  isHit = false
) {
  const breath = Math.sin(time * 0.005) * 3;
  const id = monster.id;

  // Shadow at monster's feet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 42, monster.isBoss ? 42 : 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isHit) {
    // Flash white on impact
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 35, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (id.includes('wolf')) {
    // --- TIMBER WOLF BATTLE SPRITE ---
    // Muscular predatory wolf body
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy + 12 + breath, 28, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fur chest
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy + 8 + breath, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wolf head with snarling fangs
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.ellipse(cx - 24, cy - 4 + breath, 16, 13, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Sharp pointed ears
    ctx.fillStyle = '#292524';
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 14 + breath);
    ctx.lineTo(cx - 32, cy - 28 + breath);
    ctx.lineTo(cx - 22, cy - 16 + breath);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 14 + breath);
    ctx.lineTo(cx - 18, cy - 27 + breath);
    ctx.lineTo(cx - 14, cy - 14 + breath);
    ctx.fill();

    // Snout and gleaming fangs
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(cx - 40, cy - 3 + breath, 14, 8);
    // White sharp teeth
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 38, cy + 3 + breath, 3, 4);
    ctx.fillRect(cx - 33, cy + 3 + breath, 3, 3);

    // Glowing predator eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 26, cy - 8 + breath, 4, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 25, cy - 7 + breath, 2, 2);

    // Paws & Claws
    ctx.fillStyle = '#292524';
    ctx.fillRect(cx - 22, cy + 26, 8, 16);
    ctx.fillRect(cx - 6, cy + 26, 8, 16);
    ctx.fillRect(cx + 16, cy + 26, 8, 16);

    // Bushy tail
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.ellipse(cx + 36, cy + 6 + breath, 16, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (id.includes('goblin')) {
    // --- GOBLIN PILLAGER BATTLE SPRITE ---
    // Ragged leather jerkin
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 18, cy + 4 + breath, 36, 28);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx - 14, cy + 8 + breath, 28, 20);

    // Green skin arms & clawed hands
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(cx - 26, cy + 10 + breath, 8, 18);
    ctx.fillRect(cx + 18, cy + 10 + breath, 8, 18);

    // Goblin head
    ctx.beginPath();
    ctx.arc(cx, cy - 12 + breath, 20, 0, Math.PI * 2);
    ctx.fill();

    // Long pointed goblin ears
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 10 + breath);
    ctx.lineTo(cx - 38, cy - 20 + breath);
    ctx.lineTo(cx - 16, cy + 2 + breath);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy - 10 + breath);
    ctx.lineTo(cx + 38, cy - 20 + breath);
    ctx.lineTo(cx + 16, cy + 2 + breath);
    ctx.fill();

    // Red war bandana
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 20, cy - 26 + breath, 40, 8);

    // Cunning yellow eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 10, cy - 14 + breath, 6, 5);
    ctx.fillRect(cx + 4, cy - 14 + breath, 6, 5);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 8, cy - 13 + breath, 3, 3);
    ctx.fillRect(cx + 6, cy - 13 + breath, 3, 3);

    // Jagged smile with pointed fangs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 8, cy - 4 + breath, 16, 4);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 6, cy - 4 + breath, 3, 3);
    ctx.fillRect(cx + 3, cy - 4 + breath, 3, 3);

    // Jagged chipped scimitar in hand
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 38, cy - 4 + breath, 14, 6);
    ctx.fillRect(cx - 44, cy - 8 + breath, 8, 4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 28, cy + 4 + breath, 4, 12);
  } else if (id.includes('skeleton')) {
    // --- CRYPT SKELETON GUARD BATTLE SPRITE ---
    // Ribcage
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 14, cy + 4 + breath, 28, 26);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 10, cy + 8 + breath, 20, 4);
    ctx.fillRect(cx - 10, cy + 16 + breath, 20, 4);
    ctx.fillRect(cx - 10, cy + 24 + breath, 20, 4);

    // Skull
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy - 16 + breath, 18, 0, Math.PI * 2);
    ctx.fill();

    // Ancient cracked iron helm
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy - 20 + breath, 19, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 19, cy - 21 + breath, 38, 5);

    // Glowing cyan/turquoise ethereal eye sockets
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 14 + breath, 4, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy - 14 + breath, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cx - 8, cy - 15 + breath, 2, 2);
    ctx.fillRect(cx + 6, cy - 15 + breath, 2, 2);

    // Bony arms holding rusty broadsword
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 34, cy - 24 + breath, 6, 54);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 38, cy + 4 + breath, 14, 4);

    // Cracked wood buckler shield on other arm
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(cx + 26, cy + 14 + breath, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (id.includes('sorcerer')) {
    // --- MALAKOR THE VOIDCALLER (BOSS) ---
    // Swirling Void Aura
    const pulse = Math.sin(time * 0.007) * 6;
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 55 + pulse);
    grad.addColorStop(0, 'rgba(147, 51, 234, 0.5)');
    grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 55 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Shredded violet necromancer robes
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 10 + breath);
    ctx.lineTo(cx + 26, cy - 10 + breath);
    ctx.lineTo(cx + 36, cy + 42 + breath);
    ctx.lineTo(cx - 36, cy + 42 + breath);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#581c87';
    ctx.fillRect(cx - 18, cy - 4 + breath, 36, 32);

    // Void cowl & mask
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.arc(cx, cy - 18 + breath, 20, 0, Math.PI * 2);
    ctx.fill();

    // Dark void inside hood
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy - 16 + breath, 14, 0, Math.PI * 2);
    ctx.fill();

    // Piercing amethyst void eyes
    ctx.fillStyle = '#e879f9';
    ctx.fillRect(cx - 8, cy - 18 + breath, 5, 4);
    ctx.fillRect(cx + 3, cy - 18 + breath, 5, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 6, cy - 17 + breath, 2, 2);
    ctx.fillRect(cx + 5, cy - 17 + breath, 2, 2);

    // Floating orb of nether energy orbiting hand
    const orbX = cx - 34 + Math.cos(time * 0.008) * 8;
    const orbY = cy + breath + Math.sin(time * 0.008) * 8;
    ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(orbX - 2, orbY - 2, 4, 4);
  } else if (id.includes('drake')) {
    // --- IGNIS PRIME DRAGON (LEGENDARY BOSS) ---
    // Fiery wings spread wide
    const wingFlap = Math.sin(time * 0.006) * 6;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + breath);
    ctx.lineTo(cx - 65, cy - 30 + breath + wingFlap);
    ctx.lineTo(cx - 24, cy - 8 + breath);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 18, cy + breath);
    ctx.lineTo(cx + 65, cy - 30 + breath + wingFlap);
    ctx.lineTo(cx + 24, cy - 8 + breath);
    ctx.closePath();
    ctx.fill();

    // Scaled red dragon body
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12 + breath, 32, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dragon underbelly plates (golden/amber scales)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14 + breath, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dragon head & neck
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 16 + breath, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Majestic Golden Horns
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 24 + breath);
    ctx.lineTo(cx - 28, cy - 46 + breath);
    ctx.lineTo(cx - 6, cy - 28 + breath);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy - 24 + breath);
    ctx.lineTo(cx + 28, cy - 46 + breath);
    ctx.lineTo(cx + 6, cy - 28 + breath);
    ctx.fill();

    // Reptilian burning eyes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 12, cy - 20 + breath, 6, 5);
    ctx.fillRect(cx + 6, cy - 20 + breath, 6, 5);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(cx - 10, cy - 19 + breath, 2, 4);
    ctx.fillRect(cx + 8, cy - 19 + breath, 2, 4);

    // Nostril smoke & flame embers
    const emberY = (time * 0.05) % 18;
    ctx.fillStyle = '#f97316';
    ctx.fillRect(cx - 6, cy - 8 + breath - emberY, 3, 3);
    ctx.fillRect(cx + 4, cy - 8 + breath - emberY, 2, 2);
  } else {
    // Default monster circle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

// -------------------------------------------------------------
// COMBAT HERO SPRITE RENDERER
// -------------------------------------------------------------
function drawHeroBattleSprite(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heroClass: HeroClass,
  time: number,
  isHit = false,
  hasShield = false
) {
  const breath = Math.sin(time * 0.004) * 2;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 42, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isHit) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Active Magical Protective Barrier
  if (hasShield) {
    const shieldPulse = Math.sin(time * 0.008) * 4;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + breath, 45 + shieldPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  switch (heroClass) {
    case 'Warrior': {
      // Steel Breastplate & Pauldrons
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 18, cy + 2 + breath, 36, 32);
      ctx.fillStyle = '#dc2626'; // Crimson tabard
      ctx.fillRect(cx - 8, cy + 2 + breath, 16, 32);
      // Steel Pauldrons
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx - 24, cy + 2 + breath, 8, 12);
      ctx.fillRect(cx + 16, cy + 2 + breath, 8, 12);

      // Steel Helmet & Winged Visor
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cx, cy - 18 + breath, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b'; // Gold crest plume
      ctx.fillRect(cx - 2, cy - 38 + breath, 4, 12);

      // Visor with glowing cyan eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 10, cy - 19 + breath, 20, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 8, cy - 18 + breath, 16, 3);

      // Steel Broadsword in right hand
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx + 26, cy - 28 + breath, 8, 54);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx + 20, cy + 6 + breath, 20, 6); // Crossguard
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 28, cy + 12 + breath, 4, 14); // Hilt

      // Heavy Kite Shield on left arm
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(cx - 36, cy + 2 + breath, 16, 32, [4, 4, 10, 10]);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 31, cy + 6 + breath, 6, 24);
      break;
    }

    case 'Mage': {
      // Flowing royal purple archmage robes
      ctx.fillStyle = '#3730a3';
      ctx.fillRect(cx - 18, cy + 2 + breath, 36, 36);
      ctx.fillStyle = '#fbbf24'; // Gold embroidered trim
      ctx.fillRect(cx - 3, cy + 2 + breath, 6, 36);

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(cx, cy - 16 + breath, 16, 0, Math.PI * 2);
      ctx.fill();

      // Pointed Wizard Hat with golden brim
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy - 20 + breath);
      ctx.lineTo(cx, cy - 50 + breath);
      ctx.lineTo(cx + 24, cy - 20 + breath);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx - 26, cy - 21 + breath, 52, 5);

      // Wise glowing eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 7, cy - 17 + breath, 4, 4);
      ctx.fillRect(cx + 3, cy - 17 + breath, 4, 4);

      // Arcane Staff with floating celestial orb
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 24, cy - 28 + breath, 6, 62);
      const orbPulse = Math.sin(time * 0.008) * 4;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(cx + 27, cy - 36 + breath + orbPulse, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx + 27, cy - 36 + breath + orbPulse, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 25, cy - 38 + breath + orbPulse, 4, 4);
      break;
    }

    case 'Rogue': {
      // Dark emerald/leather shadow armor
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(cx - 16, cy + 2 + breath, 32, 32);
      ctx.fillStyle = '#047857';
      ctx.fillRect(cx - 12, cy + 6 + breath, 24, 24);

      // Shadow cowl hood
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(cx, cy - 16 + breath, 18, 0, Math.PI * 2);
      ctx.fill();

      // Shadow mask & piercing amber eyes
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(cx - 12, cy - 18 + breath, 24, 14);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 8, cy - 17 + breath, 5, 4);
      ctx.fillRect(cx + 3, cy - 17 + breath, 5, 4);

      // Twin Silver Daggers
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx + 22, cy - 14 + breath, 6, 28);
      ctx.fillRect(cx - 28, cy - 8 + breath, 6, 26);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx + 18, cy + 6 + breath, 14, 4);
      ctx.fillRect(cx - 32, cy + 10 + breath, 14, 4);
      break;
    }

    case 'Paladin': {
      // Radiant Silver & Gold Plate Armor
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 18, cy + 2 + breath, 36, 32);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - 6, cy + 2 + breath, 12, 32);

      // Helm & Golden Holy Halo
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(cx, cy - 16 + breath, 18, 0, Math.PI * 2);
      ctx.fill();

      // Holy Halo
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 32 + breath, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Golden War Hammer in hand
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx + 24, cy - 14 + breath, 6, 48);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cx + 16, cy - 24 + breath, 22, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + 18, cy - 22 + breath, 18, 5);
      break;
    }
  }
}
