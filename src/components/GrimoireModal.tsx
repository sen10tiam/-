import React, { useState } from 'react';
import {
  AspectRatioOption,
  ImageSizeOption,
  ImageModelOption,
  GeneratedGrimoireEntry,
  Player,
} from '../types';
import { sound } from '../utils/audio';
import { Sparkles, Wand2, Image as ImageIcon, Check, Loader2, Download, UserCheck, X } from 'lucide-react';

interface GrimoireModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSetCustomPortrait: (url: string) => void;
  entries: GeneratedGrimoireEntry[];
  onAddEntry: (entry: GeneratedGrimoireEntry) => void;
}

const ASPECT_RATIOS: { ratio: AspectRatioOption; label: string; iconShape: string }[] = [
  { ratio: '1:1', label: 'Square (1:1)', iconShape: 'w-5 h-5' },
  { ratio: '2:3', label: 'Classic Portrait (2:3)', iconShape: 'w-4 h-6' },
  { ratio: '3:2', label: 'Classic Landscape (3:2)', iconShape: 'w-6 h-4' },
  { ratio: '3:4', label: 'Tall Portrait (3:4)', iconShape: 'w-4.5 h-6' },
  { ratio: '4:3', label: 'Standard (4:3)', iconShape: 'w-6 h-4.5' },
  { ratio: '9:16', label: 'Mobile Vertical (9:16)', iconShape: 'w-3.5 h-6' },
  { ratio: '16:9', label: 'Widescreen (16:9)', iconShape: 'w-7 h-4' },
  { ratio: '21:9', label: 'Cinematic Ultra (21:9)', iconShape: 'w-8 h-3.5' },
];

const SIZES: { size: ImageSizeOption; label: string; desc: string }[] = [
  { size: '1K', label: '1K Standard', desc: 'Fast generation, crisp fidelity' },
  { size: '2K', label: '2K High-Def', desc: 'Enhanced textural details' },
  { size: '4K', label: '4K Ultra-Studio', desc: 'Maximum resolution & depth' },
];

const PRESET_CATEGORIES = [
  {
    id: 'portrait',
    title: 'Hero Portrait',
    prompts: [
      'A heroic fantasy portrait of an armored warrior with glowing runes on breastplate, determined expression, dramatic lighting, painted masterpiece',
      'An elven archmage in enchanted celestial robes, casting an azure frost spell, mystical floating runes, intricate fantasy portrait',
      'A cloaked rogue assassin holding twin glowing daggers in shadowy moonlit mist, lethal gaze, dark fantasy portrait',
      'A holy paladin crowned in radiant golden sunlight, polished silver armor, holding a blessed broadsword, epic fantasy',
    ],
  },
  {
    id: 'artifact',
    title: 'Legendary Relic',
    prompts: [
      'A mythical dragon-forged broadsword bathed in roaring crimson embers, resting on an obsidian anvil, dark fantasy art',
      'An ancient celestial orb hovering inside an intricate golden gyroscope, shimmering arcane particles, high fantasy item',
      'A royal aegis kite shield forged from white sun-steel with emerald lion insignia, battle-worn and glowing',
    ],
  },
  {
    id: 'scenery',
    title: 'Realm & Dungeon',
    prompts: [
      'An ancient forgotten stone crypt illuminated by eerie cyan torches and crumbling sarcophagi, atmospheric dark fantasy',
      'A mystical peaceful woodland village surrounded by colossal ancient oak trees, gentle golden hour sunlight, fantasy RPG world',
      'A colossal volcanic caldera with molten lava rivers and jagged black obsidian spires under a smoky twilight sky',
    ],
  },
  {
    id: 'monster',
    title: 'Beasts & Foes',
    prompts: [
      'A terrifying shadow sorcerer floating above an eldritch summoning circle, dark purple void magic swirling around',
      'A ferocious primeval timber wolf with glowing amber eyes prowling through a misty pine forest',
      'An ancient crimson dragon perched atop a hoard of glittering gold and jewel-encrusted chalices, smoke billowing from nostrils',
    ],
  },
];

export const GrimoireModal: React.FC<GrimoireModalProps> = ({
  player,
  isOpen,
  onClose,
  onSetCustomPortrait,
  entries,
  onAddEntry,
}) => {
  const [model, setModel] = useState<ImageModelOption>('gemini-3-pro-image-preview');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('1:1');
  const [imageSize, setImageSize] = useState<ImageSizeOption>('1K');
  const [prompt, setPrompt] = useState<string>(
    `A fantasy character portrait of ${player.name}, a heroic Level ${player.stats.level} ${player.heroClass} with intricate armor, painted concept art, masterpiece lighting`
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          imageSize,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate image.');
      }

      setPreviewUrl(data.imageUrl);
      sound.playLevelUp();

      const newEntry: GeneratedGrimoireEntry = {
        id: Math.random().toString(),
        title: prompt.slice(0, 32) + '...',
        prompt,
        imageUrl: data.imageUrl,
        model,
        aspectRatio,
        imageSize,
        category: 'portrait',
        timestamp: new Date().toLocaleTimeString(),
      };
      onAddEntry(newEntry);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Error generating image. Check your GEMINI_API_KEY in Settings > Secrets.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAsPortrait = (url: string) => {
    onSetCustomPortrait(url);
    sound.playChest();
    alert('Custom portrait applied to your Hero!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-200 my-auto">
        {/* Modal Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Mystic Forge & Chronicle Grimoire
              </h2>
              <p className="text-xs text-slate-400">
                AI visual synthesizer: forge hero portraits, legendary relics, and world lore using Gemini
              </p>
            </div>
          </div>
          <button
            id="grimoire-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Row: AI Model Selector & Image Resolution Affordance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model Selection */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                AI Image Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="model-pro-btn"
                  onClick={() => setModel('gemini-3-pro-image-preview')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    model === 'gemini-3-pro-image-preview'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">gemini-3-pro-image-preview</span>
                    {model === 'gemini-3-pro-image-preview' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[11px] text-indigo-300 block font-medium">Studio-Grade Quality</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Highest precision, vivid textures & epic rendering
                  </span>
                </button>

                <button
                  type="button"
                  id="model-flash-btn"
                  onClick={() => setModel('gemini-3.1-flash-image-preview')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    model === 'gemini-3.1-flash-image-preview'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">gemini-3.1-flash-image-preview</span>
                    {model === 'gemini-3.1-flash-image-preview' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[11px] text-emerald-300 block font-medium">Rapid Flash Mode</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Fast iteration for exploration & monsters
                  </span>
                </button>
              </div>
            </div>

            {/* Image Size Affordance (1K, 2K, 4K) */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Image Size Resolution
                </label>
                <span className="text-[11px] text-indigo-400 font-semibold">{imageSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    id={`size-${s.size}-btn`}
                    onClick={() => setImageSize(s.size)}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      imageSize === s.size
                        ? 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-sm font-black">{s.size}</div>
                    <div className="text-[9px] opacity-80 mt-0.5">{s.label.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {SIZES.find((s) => s.size === imageSize)?.desc}
              </p>
            </div>
          </div>

          {/* Aspect Ratio Affordance (1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9) */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Aspect Ratio Affordance
              </label>
              <span className="text-[11px] text-amber-400 font-semibold">{aspectRatio}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.ratio}
                  type="button"
                  id={`aspect-${ar.ratio.replace(':', '-')}-btn`}
                  onClick={() => setAspectRatio(ar.ratio)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center cursor-pointer transition-all ${
                    aspectRatio === ar.ratio
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm'
                      : 'bg-slate-800 border-slate-700/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`border border-current rounded-sm mb-1.5 opacity-90 ${ar.iconShape}`}
                  />
                  <span className="text-xs font-bold">{ar.ratio}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-full px-1">
                    {ar.label.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Presets & Input */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Inspirational Presets
              </label>
              <span className="text-[11px] text-slate-400">Click to load</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <span className="text-[11px] font-bold text-indigo-300 block">{cat.title}</span>
                  {cat.prompts.slice(0, 2).map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setPrompt(p)}
                      className="w-full text-left text-[11px] p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 truncate cursor-pointer"
                      title={p}
                    >
                      {p.slice(0, 28)}...
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Visual Art Prompt
              </label>
              <textarea
                id="grimoire-prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your hero, relic, boss, or scenery in detail..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-700 text-red-200 text-xs flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="text-red-400 underline text-[11px] ml-2">
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                id="grimoire-generate-btn"
                disabled={isLoading || !prompt.trim()}
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-102"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synthesizing with {model.includes('pro') ? 'Pro (1-4K)' : 'Flash'}...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Forge Visual Artwork
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Latest Generated Image Preview */}
          {previewUrl && (
            <div className="bg-slate-800/60 p-5 rounded-2xl border border-indigo-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Masterwork Artwork Forged
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    id="apply-portrait-btn"
                    onClick={() => handleApplyAsPortrait(previewUrl)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Apply as Hero Portrait
                  </button>
                  <a
                    href={previewUrl}
                    download="eldoria_art.png"
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center bg-slate-950/80 rounded-xl overflow-hidden p-2 border border-slate-800">
                <img
                  src={previewUrl}
                  alt="Generated artwork"
                  className="max-h-96 rounded-lg object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Chronicle Gallery History */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Adventure Gallery & Grimoire History ({entries.length})
            </h3>

            {entries.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-800/30 border border-slate-800 text-slate-500 text-xs">
                No visual creations yet. Use the prompt studio above to synthesize hero portraits, weapons, or dungeon visions.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex flex-col"
                  >
                    <div className="h-32 bg-slate-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={entry.imageUrl}
                        alt={entry.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-bold text-indigo-300">{entry.aspectRatio}</span>
                          <span>{entry.imageSize}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-200 line-clamp-1 mt-0.5">
                          {entry.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <button
                          onClick={() => handleApplyAsPortrait(entry.imageUrl)}
                          className="flex-1 py-1 px-1.5 rounded bg-slate-700 hover:bg-emerald-600 text-[10px] text-white font-semibold cursor-pointer transition-colors text-center"
                        >
                          Equip Portrait
                        </button>
                        <button
                          onClick={() => setPreviewUrl(entry.imageUrl)}
                          className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-slate-300 cursor-pointer"
                          title="View"
                        >
                          👁️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
