import React, { useState } from 'react';
import { NPC } from '../types';
import { sound } from '../utils/audio';
import { MessageSquare, ArrowRight, ShoppingBag, Scroll, X } from 'lucide-react';

interface DialogueBoxProps {
  npc: NPC;
  onClose: () => void;
  onOpenShop?: () => void;
  onOpenQuests?: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  npc,
  onClose,
  onOpenShop,
  onOpenQuests,
}) => {
  const [lineIndex, setLineIndex] = useState(0);

  const handleNext = () => {
    sound.playStep();
    if (lineIndex < npc.dialogue.length - 1) {
      setLineIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
      <div className="rounded-2xl bg-slate-900/95 border-2 border-indigo-500/60 shadow-2xl p-4 backdrop-blur-md text-slate-100 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{npc.avatar}</span>
            <div>
              <h3 className="font-bold text-sm text-amber-300">{npc.name}</h3>
              <span className="text-[11px] text-slate-400">{npc.title}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue Text */}
        <p className="text-xs sm:text-sm text-slate-200 min-h-[44px] leading-relaxed">
          "{npc.dialogue[lineIndex]}"
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {npc.shopItems && npc.shopItems.length > 0 && (
              <button
                onClick={() => {
                  sound.playCoin();
                  onOpenShop?.();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Browse Shop
              </button>
            )}
            {npc.questId && (
              <button
                onClick={() => {
                  sound.playChest();
                  onOpenQuests?.();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Scroll className="w-3.5 h-3.5" /> Quests Available
              </button>
            )}
          </div>

          <button
            id="dialogue-continue-btn"
            onClick={handleNext}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {lineIndex < npc.dialogue.length - 1 ? (
              <>
                Next <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              'Farewell'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
