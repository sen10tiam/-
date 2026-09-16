import React from 'react';
import { Quest } from '../types';
import { sound } from '../utils/audio';
import { Scroll, CheckCircle2, Clock, Award, X } from 'lucide-react';

interface QuestModalProps {
  quests: Quest[];
  isOpen: boolean;
  onClose: () => void;
  onClaimQuestReward: (questId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  quests,
  isOpen,
  onClose,
  onClaimQuestReward,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[85vh]">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scroll className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-bold">Quest Journal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-xl border transition-all ${
                quest.isClaimed
                  ? 'border-slate-800 bg-slate-900/40 opacity-70'
                  : quest.isCompleted
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  {quest.isClaimed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : quest.isCompleted ? (
                    <Award className="w-4 h-4 text-yellow-400 animate-bounce" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                  <h3 className="font-bold text-sm text-white">{quest.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800">
                  {quest.zone} • {quest.giver}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-2">{quest.description}</p>

              {/* Progress bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Objective: {quest.objective}</span>
                  <span>
                    {quest.currentCount} / {quest.targetCount}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quest.isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rewards */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-amber-400 font-bold">💰 {quest.rewardGold} Gold</span>
                  <span className="text-indigo-400 font-bold">⭐ {quest.rewardXp} XP</span>
                  {quest.rewardItem && (
                    <span className="text-emerald-400 font-bold">🎁 {quest.rewardItem.name}</span>
                  )}
                </div>

                {quest.isCompleted && !quest.isClaimed && (
                  <button
                    onClick={() => {
                      sound.playLevelUp();
                      onClaimQuestReward(quest.id);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow animate-pulse"
                  >
                    Claim Reward
                  </button>
                )}

                {quest.isClaimed && (
                  <span className="text-xs font-bold text-emerald-400">Completed & Claimed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
