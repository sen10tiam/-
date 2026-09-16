export type HeroClass = 'Warrior' | 'Mage' | 'Rogue' | 'Paladin';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'weapon' | 'shield' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'consumable';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  price: number;
  icon: string; // Lucide icon name or emoji identifier
  stats?: {
    attack?: number;
    defense?: number;
    magic?: number;
    hpMax?: number;
    mpMax?: number;
    crit?: number;
    speed?: number;
  };
  effect?: {
    healHp?: number;
    healMp?: number;
    damage?: number;
    buffType?: string;
  };
}

export interface Equipment {
  weapon: Item | null;
  shield: Item | null;
  armor: Item | null;
  helmet: Item | null;
  boots: Item | null;
  accessory: Item | null;
}

export interface HeroStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  baseAttack: number;
  baseDefense: number;
  baseMagic: number;
  baseSpeed: number;
  baseCrit: number;
  statPoints: number;
}

export interface HeroSkill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  power: number;
  type: 'attack' | 'magic' | 'heal' | 'buff';
  element: 'physical' | 'fire' | 'ice' | 'holy' | 'lightning';
  levelReq: number;
  icon: string;
}

export interface Player {
  name: string;
  heroClass: HeroClass;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  zoneId: string;
  stats: HeroStats;
  equipment: Equipment;
  inventory: Item[];
  learnedSkills: string[];
  customPortraitUrl?: string;
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
  xpReward: number;
  goldReward: number;
  lootTable: { item: Item; chance: number }[];
  skills: { name: string; damage: number; mpCost: number; element?: string }[];
  spriteColor: string;
  avatarIcon: string;
  isBoss?: boolean;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  zoneId: string;
  x: number;
  y: number;
  avatar: string;
  dialogue: string[];
  shopItems?: Item[];
  questId?: string;
}

export interface Quest {
  id: string;
  title: string;
  giver: string;
  zone: string;
  description: string;
  objective: string;
  currentCount: number;
  targetCount: number;
  rewardGold: number;
  rewardXp: number;
  rewardItem?: Item;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface MapTile {
  type: 'grass' | 'path' | 'water' | 'wall' | 'tree' | 'door' | 'floor' | 'dungeon_wall' | 'lava' | 'stone' | 'bridge';
  solid: boolean;
  trigger?: {
    type: 'portal' | 'chest' | 'campfire' | 'lore' | 'monster';
    targetZone?: string;
    targetX?: number;
    targetY?: number;
    chestId?: string;
    items?: Item[];
    monsterId?: string;
  };
}

export interface ZoneData {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  tiles: MapTile[][];
  ambientColor: string;
  monsters: string[];
  dangerLevel: number;
}

export interface CombatState {
  isActive: boolean;
  monsterKey?: string;
  monster: Monster;
  turn: 'player' | 'monster' | 'animating';
  round: number;
  playerHp: number;
  playerMp: number;
  monsterHp: number;
  monsterMp: number;
  playerShieldActive: boolean;
  logs: string[];
  floatingTexts?: { id: string; text: string; color: string; isCrit?: boolean }[];
  result?: 'victory' | 'defeat' | 'escaped';
  rewards?: {
    xp: number;
    gold: number;
    items: Item[];
  };
}

export type AspectRatioOption = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSizeOption = '1K' | '2K' | '4K';
export type ImageModelOption = 'gemini-3-pro-image-preview' | 'gemini-3.1-flash-image-preview';

export interface GeneratedGrimoireEntry {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string;
  model: ImageModelOption;
  aspectRatio: AspectRatioOption;
  imageSize: ImageSizeOption;
  category: 'portrait' | 'artifact' | 'scenery' | 'monster';
  timestamp: string;
}
