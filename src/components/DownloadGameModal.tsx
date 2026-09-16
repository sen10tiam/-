import React, { useState, useRef } from 'react';
import { Player, Quest, GeneratedGrimoireEntry } from '../types';
import {
  downloadGameZip,
  generateStandaloneOfflineHtml,
  triggerFileDownload,
  exportGameSave,
  importGameSave,
  GameSaveExportData,
} from '../utils/gameExporter';
import {
  Download,
  FileArchive,
  FileCode,
  Save,
  Upload,
  CheckCircle,
  X,
  Sparkles,
  Gamepad2,
  HardDrive,
  ShieldAlert,
} from 'lucide-react';

interface DownloadGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  openedChests: Set<string>;
  defeatedMonsters: Set<string>;
  quests: Quest[];
  grimoireEntries: GeneratedGrimoireEntry[];
  onImportSave: (saveData: GameSaveExportData) => void;
}

export const DownloadGameModal: React.FC<DownloadGameModalProps> = ({
  isOpen,
  onClose,
  player,
  openedChests,
  defeatedMonsters,
  quests,
  grimoireEntries,
  onImportSave,
}) => {
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentSaveData: GameSaveExportData | null = player
    ? {
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        player,
        openedChests: Array.from(openedChests),
        defeatedMonsters: Array.from(defeatedMonsters),
        quests,
        grimoireEntries,
      }
    : null;

  // 1. Download ZIP Archive
  const handleDownloadZip = async () => {
    try {
      setIsPackagingZip(true);
      setStatusNotice('Сборка архива с игрой... / Packaging game zip archive...');
      await downloadGameZip(currentSaveData);
      setStatusNotice('Архив успешно скачан! / Game ZIP downloaded successfully!');
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusNotice('Ошибка скачивания архива. / Error packaging zip.');
    } finally {
      setIsPackagingZip(false);
    }
  };

  // 2. Download Standalone HTML Game
  const handleDownloadHtml = () => {
    try {
      const htmlContent = generateStandaloneOfflineHtml(currentSaveData);
      const filename = player?.name
        ? `Chronicles_of_Eldoria_${player.name}.html`
        : 'Chronicles_of_Eldoria_Standalone.html';
      triggerFileDownload(htmlContent, filename, 'text/html');
      setStatusNotice('Автономный HTML файл скачан! Откройте его в любом браузере.');
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err) {
      console.error(err);
      setStatusNotice('Ошибка генерации HTML.');
    }
  };

  // 3. Export Save
  const handleExportSave = () => {
    if (!currentSaveData) {
      alert('Сначала начните игру или создайте персонажа!');
      return;
    }
    exportGameSave(currentSaveData);
    setStatusNotice('Файл сохранения (.json) успешно экспортирован!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // 4. Import Save
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importGameSave(file);
      onImportSave(data);
      setStatusNotice(`Сохранение для ${data.player.name} (Ур.${data.player.stats.level}) успешно загружено!`);
      setTimeout(() => {
        setStatusNotice(null);
        onClose();
      }, 1500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось прочитать файл сохранения');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Скачать игру / Download Game
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-semibold">
                  Offline Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Играйте полностью офлайн без подключения к интернету
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification */}
        {statusNotice && (
          <div className="bg-indigo-950/90 border-b border-indigo-700/60 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Option 1: Full Game ZIP Archive */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-indigo-500/40 hover:border-indigo-500/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-indigo-900/40 rounded-xl border border-indigo-600/40 text-indigo-300 shrink-0">
                <FileArchive className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-sm">
                    Полный архив игры (.ZIP)
                  </h3>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600/50 px-1.5 py-0.2 rounded font-bold">
                    Рекомендуется
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Содержит офлайн-клиент (.html), руководство с управлением и описанием классов (README.md) и резервную копию вашего сохранения.
                </p>
              </div>
            </div>

            <button
              id="download-zip-btn"
              onClick={handleDownloadZip}
              disabled={isPackagingZip}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isPackagingZip ? 'Сборка...' : 'Скачать ZIP'}</span>
            </button>
          </div>

          {/* Option 2: Standalone Single-File HTML */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-600/40 text-emerald-400 shrink-0">
                <FileCode className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  Автономный файл игры (.HTML)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Один единственный файл, готовый к запуску двойным кликом в Chrome, Firefox, Safari или Edge на Windows, Mac, Linux или телефоне.
                </p>
              </div>
            </div>

            <button
              id="download-html-btn"
              onClick={handleDownloadHtml}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Скачать HTML</span>
            </button>
          </div>

          {/* Option 3: Save Data Management */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              Управление сохранением / Save File Management
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Save Button */}
              <button
                id="export-save-btn"
                onClick={handleExportSave}
                disabled={!player}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 hover:bg-slate-750 text-left transition-colors cursor-pointer flex items-center gap-3 disabled:opacity-40"
              >
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Экспорт сохранения</div>
                  <div className="text-[11px] text-slate-400">Сохранить прогресс в .JSON</div>
                </div>
              </button>

              {/* Import Save Button */}
              <button
                id="import-save-btn"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 hover:bg-slate-750 text-left transition-colors cursor-pointer flex items-center gap-3"
              >
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Импорт сохранения</div>
                  <div className="text-[11px] text-slate-400">Загрузить файл .JSON</div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Quick Play Notes */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <span>Особенности автономной версии:</span>
            </div>
            <p>
              • <strong>100% Офлайн:</strong> Весь исходный код, звуки (синтезатор Web Audio API), карты, квесты и боевая система встроены внутрь скачиваемого файла.
            </p>
            <p>
              • <strong>Сохранения:</strong> Игра сохраняет прогресс автоматически в локальное хранилище браузера (localStorage), поэтому вы можете закрывать и открывать файл в любое время.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Закрыть / Close
          </button>
        </div>
      </div>
    </div>
  );
};
