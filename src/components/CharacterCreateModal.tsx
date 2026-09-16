import React, { useState } from 'react';
import { HeroClass, Player, Equipment } from '../types';
import { ITEMS } from '../game/gameData';
import { sound } from '../utils/audio';
import { Shield, Sparkles, Sword, Crosshair, ArrowRight, Download, Upload } from 'lucide-react';

interface CharacterCreateModalProps {
  onStartGame: (player: Player) => void;
  onOpenDownload?: () => void;
  onImportSave?: () => void;
}

const CLASS_OPTIONS: {
  heroClass: HeroClass;
  title: string;
  icon: string;
  desc: string;
  hp: number;
  mp: number;
  atk: number;
  def: number;
  mag: number;
  crit: number;
  speed: number;
  starterWeapon: string;
}[] = [
  {
    heroClass: 'Warrior',
    title: 'Vanguard Juggernaut',
    icon: '🛡️',
    desc: 'Master of sword and shield. Durable champion resilient against physical onslaughts.',
    hp: 120,
    mp: 40,
    atk: 14,
    def: 12,
    mag: 4,
    crit: 8,
    speed: 9,
    starterWeapon: 'rusty_sword',
  },
  {
    heroClass: 'Mage',
    title: 'Arcane Elementalist',
    icon: '🧙‍♂️',
    desc: 'Wielder of primal fire and frost sorceries. Deals staggering burst magic damage.',
    hp: 80,
    mp: 100,
    atk: 6,
    def: 5,
    mag: 18,
    crit: 10,
    speed: 10,
    starterWeapon: 'oak_staff',
  },
  {
    heroClass: 'Rogue',
    title: 'Shadow Assassin',
    icon: '🗡️',
    desc: 'Swift and lethal predator of the dark. Punishes enemies with deadly critical ambushes.',
    hp: 95,
    mp: 50,
    atk: 15,
    def: 7,
    mag: 6,
    crit: 22,
    speed: 15,
    starterWeapon: 'silver_dagger',
  },
  {
    heroClass: 'Paladin',
    title: 'Solar Templar',
    icon: '⚔️',
    desc: 'Holy defender guided by divine radiance. Harmonizes righteous smites with healing miracles.',
    hp: 110,
    mp: 70,
    atk: 12,
    def: 10,
    mag: 12,
    crit: 10,
    speed: 9,
    starterWeapon: 'rusty_sword',
  },
];

export const CharacterCreateModal: React.FC<CharacterCreateModalProps> = ({ onStartGame, onOpenDownload }) => {
  const [name, setName] = useState('Eldor');
  const [selectedClass, setSelectedClass] = useState<HeroClass>('Warrior');

  const selectedClassInfo = CLASS_OPTIONS.find((c) => c.heroClass === selectedClass)!;

  const handleStart = () => {
    sound.playLevelUp();

    const starterEquip: Equipment = {
      weapon: ITEMS[selectedClassInfo.starterWeapon] || ITEMS.rusty_sword,
      shield: selectedClass === 'Warrior' ? ITEMS.wooden_buckler : null,
      armor: ITEMS.leather_tunic,
      helmet: null,
      boots: ITEMS.leather_boots,
      accessory: null,
    };

    const newPlayer: Player = {
      name: name.trim() || 'Hero of Eldoria',
      heroClass: selectedClass,
      x: 8,
      y: 8,
      direction: 'down',
      isMoving: false,
      zoneId: 'village',
      stats: {
        hp: selectedClassInfo.hp,
        maxHp: selectedClassInfo.hp,
        mp: selectedClassInfo.mp,
        maxMp: selectedClassInfo.mp,
        level: 1,
        xp: 0,
        xpToNext: 100,
        gold: 60,
        baseAttack: selectedClassInfo.atk,
        baseDefense: selectedClassInfo.def,
        baseMagic: selectedClassInfo.mag,
        baseSpeed: selectedClassInfo.speed,
        baseCrit: selectedClassInfo.crit,
        statPoints: 0,
      },
      equipment: starterEquip,
      inventory: [ITEMS.hp_potion, ITEMS.hp_potion, ITEMS.mp_potion],
      learnedSkills: [],
    };

    onStartGame(newPlayer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 flex flex-col text-slate-100 max-h-[95vh] overflow-y-auto">
        {/* Banner */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-indigo-400 bg-clip-text text-transparent">
            Chronicles of Eldoria
          </h1>
          <p className="text-xs text-slate-400">
            Create your champion and step into the 2D realms of forgotten legends.
          </p>
        </div>

        {/* Hero Name Input */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Champion Name
          </label>
          <input
            id="hero-name-input"
            type="text"
            maxLength={18}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter hero name..."
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Hero Class Selection */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Hero Archetype
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CLASS_OPTIONS.map((c) => (
              <button
                key={c.heroClass}
                type="button"
                id={`class-${c.heroClass.toLowerCase()}-btn`}
                onClick={() => {
                  sound.playAttack();
                  setSelectedClass(c.heroClass);
                }}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center ${
                  selectedClass === c.heroClass
                    ? 'bg-indigo-950/70 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-500/50 scale-102'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="text-3xl mb-1">{c.icon}</span>
                <span className="font-bold text-xs">{c.heroClass}</span>
                <span className="text-[10px] text-indigo-300 mt-0.5">{c.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Class Stats Overview */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-amber-300">{selectedClassInfo.title}</span>
            <span className="text-xs text-slate-400">Class Traits</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{selectedClassInfo.desc}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">HP</span>
              <span className="font-bold text-rose-400">{selectedClassInfo.hp}</span>
            </div>
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">MP</span>
              <span className="font-bold text-indigo-400">{selectedClassInfo.mp}</span>
            </div>
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">ATK</span>
              <span className="font-bold text-red-400">{selectedClassInfo.atk}</span>
            </div>
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">DEF</span>
              <span className="font-bold text-blue-400">{selectedClassInfo.def}</span>
            </div>
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">MAG</span>
              <span className="font-bold text-purple-400">{selectedClassInfo.mag}</span>
            </div>
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">CRIT</span>
              <span className="font-bold text-amber-400">{selectedClassInfo.crit}%</span>
            </div>
          </div>
        </div>

        {/* Start Adventure Button */}
        <button
          id="start-adventure-btn"
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all hover:scale-102"
        >
          Begin Journey in Oakhaven Village <ArrowRight className="w-4 h-4" />
        </button>

        {/* Download & Offline Options */}
        {onOpenDownload && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs">
            <button
              id="title-download-btn"
              onClick={onOpenDownload}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать игру (Офлайн) / Download Game</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
