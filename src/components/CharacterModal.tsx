import React from 'react';
import { Player } from '../types';
import { CLASS_SKILLS } from '../game/gameData';
import { sound } from '../utils/audio';
import { Shield, Sparkles, User, PlusCircle, X } from 'lucide-react';

interface CharacterModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onAllocateStat: (statKey: 'attack' | 'defense' | 'magic' | 'hp' | 'mp') => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  player,
  isOpen,
  onClose,
  onAllocateStat,
}) => {
  if (!isOpen) return null;

  const totalAtk = player.stats.baseAttack + (player.equipment.weapon?.stats?.attack || 0);
  const totalDef =
    player.stats.baseDefense +
    (player.equipment.armor?.stats?.defense || 0) +
    (player.equipment.shield?.stats?.defense || 0) +
    (player.equipment.helmet?.stats?.defense || 0);
  const totalMag =
    player.stats.baseMagic +
    (player.equipment.weapon?.stats?.magic || 0) +
    (player.equipment.armor?.stats?.magic || 0);
  const totalCrit = player.stats.baseCrit + (player.equipment.weapon?.stats?.crit || 0);
  const totalSpeed = player.stats.baseSpeed + (player.equipment.boots?.stats?.speed || 0);

  const skills = CLASS_SKILLS[player.heroClass] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[85vh]">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-bold">Hero Attributes & Abilities</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Hero Profile Banner */}
          <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-indigo-500/50 overflow-hidden flex items-center justify-center">
              {player.customPortraitUrl ? (
                <img
                  src={player.customPortraitUrl}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-4xl">
                  {player.heroClass === 'Warrior' ? '🛡️' : player.heroClass === 'Mage' ? '🧙‍♂️' : player.heroClass === 'Rogue' ? '🗡️' : '⚔️'}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{player.name}</h3>
              <p className="text-xs text-indigo-300 font-semibold">
                Level {player.stats.level} • {player.heroClass}
              </p>
              <div className="text-xs text-slate-400">
                Experience: <span className="text-indigo-400 font-bold">{player.stats.xp}</span> / {player.stats.xpToNext} XP
              </div>
            </div>
          </div>

          {/* Stat Points Available Alert */}
          {player.stats.statPoints > 0 && (
            <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl flex items-center justify-between text-amber-200 text-xs">
              <span className="font-bold">✨ You have {player.stats.statPoints} unallocated Stat Points!</span>
              <span className="text-[11px] opacity-80">Click '+' to upgrade your hero</span>
            </div>
          )}

          {/* Stats List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* HP */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Health Points</span>
                <span className="text-base font-bold text-rose-400">
                  {player.stats.hp} / {player.stats.maxHp} HP
                </span>
              </div>
              {player.stats.statPoints > 0 && (
                <button
                  onClick={() => {
                    sound.playMagic();
                    onAllocateStat('hp');
                  }}
                  className="p-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  title="+10 Max HP"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* MP */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Mana Energy</span>
                <span className="text-base font-bold text-indigo-400">
                  {player.stats.mp} / {player.stats.maxMp} MP
                </span>
              </div>
              {player.stats.statPoints > 0 && (
                <button
                  onClick={() => {
                    sound.playMagic();
                    onAllocateStat('mp');
                  }}
                  className="p-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  title="+8 Max MP"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Attack */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Physical Attack</span>
                <span className="text-base font-bold text-red-400">
                  {totalAtk} <span className="text-xs text-slate-500">({player.stats.baseAttack} base)</span>
                </span>
              </div>
              {player.stats.statPoints > 0 && (
                <button
                  onClick={() => {
                    sound.playAttack();
                    onAllocateStat('attack');
                  }}
                  className="p-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  title="+2 Attack"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Defense */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Armor Defense</span>
                <span className="text-base font-bold text-blue-400">
                  {totalDef} <span className="text-xs text-slate-500">({player.stats.baseDefense} base)</span>
                </span>
              </div>
              {player.stats.statPoints > 0 && (
                <button
                  onClick={() => {
                    sound.playAttack();
                    onAllocateStat('defense');
                  }}
                  className="p-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  title="+2 Defense"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Magic */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Magic Power</span>
                <span className="text-base font-bold text-purple-400">
                  {totalMag} <span className="text-xs text-slate-500">({player.stats.baseMagic} base)</span>
                </span>
              </div>
              {player.stats.statPoints > 0 && (
                <button
                  onClick={() => {
                    sound.playMagic();
                    onAllocateStat('magic');
                  }}
                  className="p-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  title="+2 Magic"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Speed & Crit */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 block">Agility & Precision</span>
                <span className="text-base font-bold text-amber-400">
                  {totalSpeed} Speed • {totalCrit}% Crit
                </span>
              </div>
            </div>
          </div>

          {/* Class Skills */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Class Skills & Spells
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {skills.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{s.name}</span>
                    <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-950 px-1.5 py-0.5 rounded">
                      {s.mpCost} MP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
