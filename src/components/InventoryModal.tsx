import React, { useState } from 'react';
import { Player, Item, Equipment } from '../types';
import { sound } from '../utils/audio';
import { Shield, Sword, Sparkles, Footprints, Crown, Gem, X, PackageOpen } from 'lucide-react';

interface InventoryModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: keyof Equipment) => void;
  onUseItem: (item: Item) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  player,
  isOpen,
  onClose,
  onEquipItem,
  onUnequipItem,
  onUseItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  if (!isOpen) return null;

  const getRarityColor = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'uncommon':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20';
      case 'rare':
        return 'text-blue-400 border-blue-500/50 bg-blue-950/20';
      case 'epic':
        return 'text-purple-400 border-purple-500/50 bg-purple-950/20';
      case 'legendary':
        return 'text-amber-400 border-amber-500/50 bg-amber-950/20';
      default:
        return 'text-slate-300 border-slate-700 bg-slate-800/40';
    }
  };

  const getSlotIcon = (slot: keyof Equipment) => {
    switch (slot) {
      case 'weapon':
        return <Sword className="w-4 h-4" />;
      case 'shield':
        return <Shield className="w-4 h-4" />;
      case 'armor':
        return <Shield className="w-4 h-4" />;
      case 'helmet':
        return <Crown className="w-4 h-4" />;
      case 'boots':
        return <Footprints className="w-4 h-4" />;
      case 'accessory':
        return <Gem className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold">Equipment & Inventory</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-amber-950 border border-amber-600/40 px-3 py-1 rounded-full text-amber-300 font-bold flex items-center gap-1.5">
              💰 {player.stats.gold} Gold
            </span>
            <button
              id="inventory-close-btn"
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Paperdoll Equipment (5 cols) */}
          <div className="md:col-span-5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Equipped Gear</h3>
            <div className="space-y-2">
              {(['weapon', 'shield', 'helmet', 'armor', 'boots', 'accessory'] as (keyof Equipment)[]).map((slot) => {
                const item = player.equipment[slot];
                return (
                  <div
                    key={slot}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      item ? getRarityColor(item.rarity) : 'border-slate-800 bg-slate-800/20 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300">{getSlotIcon(slot)}</div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{slot}</span>
                        <span className="text-xs font-bold text-slate-200">
                          {item ? item.name : 'Empty Slot'}
                        </span>
                      </div>
                    </div>
                    {item && (
                      <button
                        onClick={() => {
                          sound.playAttack();
                          onUnequipItem(slot);
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-slate-800/80 cursor-pointer"
                      >
                        Unequip
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Backpack Grid & Inspector (7 cols) */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Backpack ({player.inventory.length}/24)
                </h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-800/30 p-3 rounded-xl border border-slate-700/60 min-h-[180px]">
                {player.inventory.map((item, idx) => (
                  <button
                    key={`${item.id}_${idx}`}
                    onClick={() => setSelectedItem(item)}
                    className={`h-14 rounded-xl border p-1 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                      selectedItem === item ? 'ring-2 ring-indigo-400' : ''
                    } ${getRarityColor(item.rarity)}`}
                  >
                    <span className="text-lg">
                      {item.type === 'weapon'
                        ? '🗡️'
                        : item.type === 'shield'
                        ? '🛡️'
                        : item.type === 'armor'
                        ? '🥋'
                        : item.type === 'helmet'
                        ? '👑'
                        : item.type === 'boots'
                        ? '🥾'
                        : item.type === 'accessory'
                        ? '💍'
                        : '🧪'}
                    </span>
                    <span className="text-[9px] font-bold truncate max-w-full px-1">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Item Details */}
            {selectedItem ? (
              <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{selectedItem.name}</h4>
                      <span className="text-[10px] uppercase font-bold text-indigo-400">
                        {selectedItem.rarity} {selectedItem.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-300">💰 {selectedItem.price} G</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{selectedItem.description}</p>
                  {/* Stats list */}
                  {selectedItem.stats && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedItem.stats.attack && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 font-semibold">
                          +{selectedItem.stats.attack} ATK
                        </span>
                      )}
                      {selectedItem.stats.defense && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-semibold">
                          +{selectedItem.stats.defense} DEF
                        </span>
                      )}
                      {selectedItem.stats.magic && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-semibold">
                          +{selectedItem.stats.magic} MAG
                        </span>
                      )}
                      {selectedItem.stats.hpMax && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold">
                          +{selectedItem.stats.hpMax} Max HP
                        </span>
                      )}
                      {selectedItem.stats.speed && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 font-semibold">
                          +{selectedItem.stats.speed} SPD
                        </span>
                      )}
                      {selectedItem.stats.crit && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-semibold">
                          +{selectedItem.stats.crit}% Crit
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {selectedItem.type === 'consumable' ? (
                    <button
                      onClick={() => {
                        onUseItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white cursor-pointer shadow"
                    >
                      Use Consumable
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playAttack();
                        onEquipItem(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white cursor-pointer shadow"
                    >
                      Equip Item
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-800/30 border border-dashed border-slate-700 text-center text-xs text-slate-500 flex-1 flex items-center justify-center">
                Click any item in your backpack to view details and equip
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
