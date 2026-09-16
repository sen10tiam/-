import { ZoneData, MapTile } from '../types';
import { ITEMS } from './gameData';

function createBlankMap(width: number, height: number, defaultType: MapTile['type'] = 'grass'): MapTile[][] {
  const map: MapTile[][] = [];
  for (let y = 0; y < height; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        type: defaultType,
        solid: defaultType === 'wall' || defaultType === 'water' || defaultType === 'tree' || defaultType === 'dungeon_wall' || defaultType === 'lava',
      });
    }
    map.push(row);
  }
  return map;
}

// 1. Oakhaven Village (18 x 14)
export function buildVillageZone(): ZoneData {
  const width = 18;
  const height = 14;
  const tiles = createBlankMap(width, height, 'grass');

  // Boundary trees & walls
  for (let x = 0; x < width; x++) {
    tiles[0][x] = { type: 'tree', solid: true };
    tiles[height - 1][x] = { type: 'tree', solid: true };
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = { type: 'tree', solid: true };
    tiles[y][width - 1] = { type: 'tree', solid: true };
  }

  // Paved roads
  for (let x = 2; x <= 15; x++) {
    tiles[8][x] = { type: 'path', solid: false };
  }
  for (let y = 2; y <= 11; y++) {
    tiles[y][8] = { type: 'path', solid: false };
  }

  // Blacksmith Forge (top right building: x: 11-15, y: 3-6)
  for (let x = 11; x <= 15; x++) {
    for (let y = 3; y <= 6; y++) {
      if (x === 11 || x === 15 || y === 3) {
        tiles[y][x] = { type: 'wall', solid: true };
      } else {
        tiles[y][x] = { type: 'floor', solid: false };
      }
    }
  }
  tiles[6][13] = { type: 'door', solid: false }; // Blacksmith entrance

  // Apothecary Shop (top left building: x: 2-6, y: 3-6)
  for (let x = 2; x <= 6; x++) {
    for (let y = 3; y <= 6; y++) {
      if (x === 2 || x === 6 || y === 3) {
        tiles[y][x] = { type: 'wall', solid: true };
      } else {
        tiles[y][x] = { type: 'floor', solid: false };
      }
    }
  }
  tiles[6][4] = { type: 'door', solid: false }; // Apothecary entrance

  // Village Chieftain Shrine / Plaza (center-top around y: 2-4, x: 7-9)
  tiles[2][8] = { type: 'stone', solid: false, trigger: { type: 'lore' } };

  // Central Village Fountain/Water Pond
  tiles[4][7] = { type: 'water', solid: true };
  tiles[4][8] = { type: 'water', solid: true };
  tiles[4][9] = { type: 'water', solid: true };

  // Rest Campfire (heals player upon stepping/interacting)
  tiles[10][5] = {
    type: 'floor',
    solid: false,
    trigger: { type: 'campfire' },
  };

  // Village Treasure Chest
  tiles[10][14] = {
    type: 'floor',
    solid: false,
    trigger: {
      type: 'chest',
      chestId: 'village_starter_chest',
      items: [ITEMS.hp_potion, ITEMS.mp_potion, ITEMS.leather_tunic],
    },
  };

  // Portal to Whispering Forest (Right side exit)
  tiles[8][width - 1] = {
    type: 'bridge',
    solid: false,
    trigger: {
      type: 'portal',
      targetZone: 'forest',
      targetX: 1,
      targetY: 8,
    },
  };

  return {
    id: 'village',
    name: 'Oakhaven Village',
    description: 'A peaceful haven sheltered beneath the great ancient oaks.',
    width,
    height,
    tiles,
    ambientColor: '#1e293b',
    monsters: [],
    dangerLevel: 0,
  };
}

// 2. Whispering Forest (22 x 16)
export function buildForestZone(): ZoneData {
  const width = 22;
  const height = 16;
  const tiles = createBlankMap(width, height, 'grass');

  // Outer trees
  for (let x = 0; x < width; x++) {
    tiles[0][x] = { type: 'tree', solid: true };
    tiles[height - 1][x] = { type: 'tree', solid: true };
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = { type: 'tree', solid: true };
    tiles[y][width - 1] = { type: 'tree', solid: true };
  }

  // Scattered groves
  const treeClusters = [
    [3, 3], [4, 3], [3, 4],
    [8, 2], [9, 2], [9, 3],
    [16, 2], [17, 2], [18, 3],
    [3, 12], [4, 12], [5, 13],
    [12, 12], [13, 12], [14, 13],
    [18, 10], [19, 10], [19, 11],
  ];
  treeClusters.forEach(([tx, ty]) => {
    if (tiles[ty] && tiles[ty][tx]) {
      tiles[ty][tx] = { type: 'tree', solid: true };
    }
  });

  // Forest River
  for (let y = 1; y < height - 1; y++) {
    tiles[y][10] = { type: 'water', solid: true };
  }
  // Bridge over river
  tiles[8][10] = { type: 'bridge', solid: false };
  tiles[9][10] = { type: 'bridge', solid: false };

  // Dirt paths connecting
  for (let x = 0; x < 10; x++) {
    tiles[8][x] = { type: 'path', solid: false };
  }
  for (let x = 11; x < width - 1; x++) {
    tiles[8][x] = { type: 'path', solid: false };
  }
  for (let y = 2; y <= 14; y++) {
    tiles[y][16] = { type: 'path', solid: false };
  }

  // Left exit back to Village
  tiles[8][0] = {
    type: 'bridge',
    solid: false,
    trigger: {
      type: 'portal',
      targetZone: 'village',
      targetX: 16,
      targetY: 8,
    },
  };

  // Top exit to Sunken Crypt
  tiles[0][16] = {
    type: 'door',
    solid: false,
    trigger: {
      type: 'portal',
      targetZone: 'crypt',
      targetX: 9,
      targetY: 13,
    },
  };

  // Forest Monster Encounter Spots
  tiles[5][6] = {
    type: 'grass',
    solid: false,
    trigger: { type: 'monster', monsterId: 'forest_wolf' },
  };
  tiles[11][5] = {
    type: 'grass',
    solid: false,
    trigger: { type: 'monster', monsterId: 'forest_wolf' },
  };
  tiles[5][14] = {
    type: 'grass',
    solid: false,
    trigger: { type: 'monster', monsterId: 'goblin_raider' },
  };
  tiles[12][18] = {
    type: 'grass',
    solid: false,
    trigger: { type: 'monster', monsterId: 'goblin_raider' },
  };

  // Forest Hidden Chest
  tiles[3][19] = {
    type: 'grass',
    solid: false,
    trigger: {
      type: 'chest',
      chestId: 'forest_cache',
      items: [ITEMS.large_hp_potion, ITEMS.fire_bomb, ITEMS.iron_plate],
    },
  };

  // Ranger Campfire
  tiles[4][13] = {
    type: 'floor',
    solid: false,
    trigger: { type: 'campfire' },
  };

  return {
    id: 'forest',
    name: 'Whispering Forest',
    description: 'A dense canopy of rustling emerald boughs where goblins and wolves prowl.',
    width,
    height,
    tiles,
    ambientColor: '#064e3b',
    monsters: ['forest_wolf', 'goblin_raider'],
    dangerLevel: 1,
  };
}

// 3. Sunken Crypt (Dungeon zone 20 x 16)
export function buildCryptZone(): ZoneData {
  const width = 20;
  const height = 16;
  const tiles = createBlankMap(width, height, 'dungeon_wall');

  // Carve out rooms and hallways
  // Entry Chamber (x: 7-11, y: 11-14)
  for (let x = 7; x <= 11; x++) {
    for (let y = 11; y <= 14; y++) {
      tiles[y][x] = { type: 'floor', solid: false };
    }
  }

  // Central Corridor (y: 6-11, x: 9)
  for (let y = 6; y <= 11; y++) {
    tiles[y][9] = { type: 'floor', solid: false };
    tiles[y][10] = { type: 'floor', solid: false };
  }

  // Left Hallway & Relic Vault (x: 2-8, y: 7-10)
  for (let x = 2; x <= 8; x++) {
    for (let y = 7; y <= 10; y++) {
      tiles[y][x] = { type: 'floor', solid: false };
    }
  }

  // Right Chamber (x: 11-17, y: 7-10)
  for (let x = 11; x <= 17; x++) {
    for (let y = 7; y <= 10; y++) {
      tiles[y][x] = { type: 'floor', solid: false };
    }
  }

  // Boss Hall / Throne Altar (x: 5-14, y: 1-5)
  for (let x = 5; x <= 14; x++) {
    for (let y = 1; y <= 5; y++) {
      tiles[y][x] = { type: 'floor', solid: false };
    }
  }

  // Exit back to Forest
  tiles[15][9] = {
    type: 'door',
    solid: false,
    trigger: {
      type: 'portal',
      targetZone: 'forest',
      targetX: 16,
      targetY: 1,
    },
  };

  // Portal to Molten Peak / Dragon Crag (Secret gate behind Boss altar)
  tiles[1][9] = {
    type: 'door',
    solid: false,
    trigger: {
      type: 'portal',
      targetZone: 'drake',
      targetX: 8,
      targetY: 12,
    },
  };

  // Monsters in Crypt
  tiles[8][4] = {
    type: 'floor',
    solid: false,
    trigger: { type: 'monster', monsterId: 'crypt_skeleton' },
  };
  tiles[8][15] = {
    type: 'floor',
    solid: false,
    trigger: { type: 'monster', monsterId: 'crypt_skeleton' },
  };
  tiles[6][9] = {
    type: 'floor',
    solid: false,
    trigger: { type: 'monster', monsterId: 'crypt_skeleton' },
  };

  // Boss Malakor encounter!
  tiles[3][9] = {
    type: 'stone',
    solid: false,
    trigger: { type: 'monster', monsterId: 'shadow_sorcerer' },
  };

  // Crypt Gold Chest
  tiles[8][2] = {
    type: 'floor',
    solid: false,
    trigger: {
      type: 'chest',
      chestId: 'crypt_gold_chest',
      items: [ITEMS.sunblade, ITEMS.large_hp_potion, ITEMS.mp_potion],
    },
  };

  return {
    id: 'crypt',
    name: 'Sunken Crypt of Malakor',
    description: 'An eerie underground labyrinth chilled by dark necrotic sorcery.',
    width,
    height,
    tiles,
    ambientColor: '#312e81',
    monsters: ['crypt_skeleton', 'shadow_sorcerer'],
    dangerLevel: 3,
  };
}

// 4. Molten Peak / Dragon Crag (Endgame Zone 18 x 14)
export function buildDrakeZone(): ZoneData {
  const width = 18;
  const height = 14;
  const tiles = createBlankMap(width, height, 'lava');

  // Obsidian platforms & bridge
  for (let x = 3; x <= 14; x++) {
    for (let y = 2; y <= 11; y++) {
      tiles[y][x] = { type: 'stone', solid: false };
    }
  }

  // Lava cracks
  for (let x = 5; x <= 12; x++) {
    tiles[6][x] = { type: 'lava', solid: true };
  }
  // Bridge over lava
  tiles[6][8] = { type: 'bridge', solid: false };
  tiles[6][9] = { type: 'bridge', solid: false };

  // Exit back to Crypt
  tiles[13][8] = {
    type: 'door',
    solid: false,
    trigger: {
      type: 'portal',
      targetZone: 'crypt',
      targetX: 9,
      targetY: 2,
    },
  };

  // Dragon Boss Altar!
  tiles[3][8] = {
    type: 'stone',
    solid: false,
    trigger: { type: 'monster', monsterId: 'molten_drake' },
  };

  // Mythic Treasure Cache
  tiles[3][13] = {
    type: 'stone',
    solid: false,
    trigger: {
      type: 'chest',
      chestId: 'drake_relic_chest',
      items: [ITEMS.dragon_slayer, ITEMS.amulet_of_eternity, ITEMS.large_hp_potion],
    },
  };

  return {
    id: 'drake',
    name: 'Molten Peak Dragon Sanctuary',
    description: 'A treacherous caldera engulfed in incandescent magma and draconic flames.',
    width,
    height,
    tiles,
    ambientColor: '#7f1d1d',
    monsters: ['molten_drake'],
    dangerLevel: 5,
  };
}

export const ALL_ZONES: Record<string, () => ZoneData> = {
  village: buildVillageZone,
  forest: buildForestZone,
  crypt: buildCryptZone,
  drake: buildDrakeZone,
};
