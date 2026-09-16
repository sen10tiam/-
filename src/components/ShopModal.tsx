import React, { useState } from 'react';
import { Player, Item, NPC } from '../types';
import { sound } from '../utils/audio';
import { ShoppingBag, ArrowLeftRight, X } from 'lucide-react';

interface ShopModalProps {
  player: Player;
  npc: NPC;
  isOpen: boolean;
  onClose: () => void;
  onBuyItem: (item: Item) => void;
  onSellItem: (item: Item) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  player,
  npc,
  isOpen,
  onClose,
  onBuyItem,
  onSellItem,
}) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  if (!isOpen) return null;

  const shopItems = npc.shopItems || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[85vh]">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{npc.avatar}</span>
            <div>
              <h2 className="text-lg font-bold">{npc.name}'s Emporium</h2>
              <p className="text-xs text-slate-400">{npc.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-amber-950 border border-amber-500/50 px-3 py-1 rounded-full text-amber-300 font-bold">
              💰 {player.stats.gold} Gold
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-700 bg-slate-800/40">
          <button
            onClick={() => setTab('buy')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              tab === 'buy' ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400' : 'text-slate-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Buy Wares
          </button>
          <button
            onClick={() => setTab('sell')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              tab === 'sell' ? 'bg-slate-800 text-amber-300 border-b-2 border-amber-400' : 'text-slate-400'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> Sell Inventory
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {tab === 'buy' ? (
            shopItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No goods currently in stock.</div>
            ) : (
              shopItems.map((item) => {
                const canAfford = player.stats.gold >= item.price;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{item.name}</span>
                        <span className="text-[10px] uppercase font-bold text-indigo-400">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-300">💰 {item.price} G</span>
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          sound.playCoin();
                          onBuyItem(item);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer shadow"
                      >
                        Purchase
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : player.inventory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">Your backpack is empty!</div>
          ) : (
            player.inventory.map((item, idx) => {
              const sellPrice = Math.max(1, Math.floor(item.price * 0.6));
              return (
                <div
                  key={`${item.id}_${idx}`}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{item.name}</span>
                      <span className="text-[10px] uppercase font-bold text-indigo-400">{item.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-300">💰 {sellPrice} G</span>
                    <button
                      onClick={() => {
                        sound.playCoin();
                        onSellItem(item);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-rose-700 text-slate-200 hover:text-white font-bold text-xs cursor-pointer shadow"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
