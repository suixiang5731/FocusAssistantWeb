import React, { useState, useEffect, useRef } from 'react';
import { Settings, DEFAULT_SETTINGS, TimeUnit, FocusRecord, Tag, WebDavConfig, DEFAULT_WEBDAV_CONFIG } from '../types';
import { X, RotateCcw, Download, Upload, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Save, Trash2, History, Cloud, CloudUpload, CloudDownload, Server, Key, User, Folder, Link, Eye, EyeOff, Sparkles } from 'lucide-react';
import { exportBackupToFile, parseAndValidateBackup, getSnapshotList, deleteSnapshot, performAutoBackup, BackupData, SnapshotEntry, createBackupObject, clearAllSnapshots, keepOnlyLatestSnapshot } from '../utils/backup';
import { WEBDAV_PRESETS, testWebDavConnection, uploadToWebDav, downloadFromWebDav } from '../utils/webdav';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (newSettings: Settings) => void;
  history: FocusRecord[];
  tags: Tag[];
  onImportData: (data: BackupData) => void;
}

// Configuration to map value keys to their unit keys and base storage units
const FIELD_CONFIG = {
  focusDurationMinutes: { unitKey: 'focusDurationUnit', base: 'min' },
  minIntervalMinutes: { unitKey: 'minIntervalUnit', base: 'min' },
  maxIntervalMinutes: { unitKey: 'maxIntervalUnit', base: 'min' },
  microBreakSeconds: { unitKey: 'microBreakUnit', base: 'sec' },
  longBreakMinutes: { unitKey: 'longBreakUnit', base: 'min' },
} as const;

interface InputRowProps {
  label: string;
  value: number;
  currentUnit: TimeUnit;
  min?: number;
  onChange: (val: string) => void;
  onToggleUnit: () => void;
}

const InputRow: React.FC<InputRowProps> = ({ label, value, currentUnit, min = 0, onChange, onToggleUnit }) => (
  <div className="flex items-center justify-between py-1 group">
    <label className="text-slate-700 font-medium text-sm sm:text-base group-hover:text-slate-900 transition-colors duration-200">{label}</label>
    <div className="flex items-center justify-end gap-2 shrink-0">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={currentUnit === 'min' ? "0.1" : "1"}
        value={isNaN(value) ? '' : value.toString()} 
        onChange={(e) => onChange(e.target.value)}
        className="w-20 sm:w-24 text-center bg-slate-50 border border-slate-200/80 rounded-xl py-1.5 px-2 text-base font-mono text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-xs hover:border-slate-300"
      />
      <button 
        type="button"
        onClick={onToggleUnit}
        className="min-w-[44px] px-2 py-1 text-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer select-none focus:outline-none active:scale-95 shrink-0 whitespace-nowrap"
        title="点击切换单位"
      >
        {currentUnit === 'min' ? '分钟' : '秒'}
      </button>
    </div>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  history,
  tags,
  onImportData,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingWebDav, setIsTestingWebDav] = useState(false);
  const [isUploadingWebDav, setIsUploadingWebDav] = useState(false);
  const [isDownloadingWebDav, setIsDownloadingWebDav] = useState(false);

  const getWebDavConfig = (): WebDavConfig => {
    return localSettings.webDavConfig || DEFAULT_WEBDAV_CONFIG;
  };

  const updateWebDavConfig = (patch: Partial<WebDavConfig>) => {
    setLocalSettings(prev => ({
      ...prev,
      webDavConfig: {
        ...(prev.webDavConfig || DEFAULT_WEBDAV_CONFIG),
        ...patch
      }
    }));
  };

  const handleTestWebDav = async () => {
    const config = getWebDavConfig();
    setIsTestingWebDav(true);
    setFeedback(null);
    const res = await testWebDavConnection(config);
    setIsTestingWebDav(false);
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleUploadWebDav = async () => {
    const config = getWebDavConfig();
    setIsUploadingWebDav(true);
    setFeedback(null);
    const backupObj = createBackupObject(localSettings, history, tags);
    const res = await uploadToWebDav(config, backupObj);
    setIsUploadingWebDav(false);
    if (res.success && res.timestamp) {
      updateWebDavConfig({ lastSyncTime: res.timestamp });
    }
    setFeedback({ type: res.success ? 'success' : 'error', message: res.message });
  };

  const handleDownloadWebDav = async () => {
    const config = getWebDavConfig();
    setIsDownloadingWebDav(true);
    setFeedback(null);
    const res = await downloadFromWebDav(config);
    setIsDownloadingWebDav(false);
    if (res.success && res.data) {
      onImportData(res.data);
      if (res.data.settings) {
        setLocalSettings({ ...DEFAULT_SETTINGS, ...res.data.settings });
      }
      setFeedback({ type: 'success', message: res.message });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setLocalSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(JSON.stringify(settings)) });
      setSnapshots(getSnapshotList());
      setFeedback(null);
    }
  }, [isOpen, settings]);

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsVisible(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  const getDisplayValue = (storedValue: number, baseUnit: TimeUnit, displayUnit: TimeUnit): number => {
    if (baseUnit === displayUnit) {
        return Math.round(storedValue * 100) / 100;
    }
    if (baseUnit === 'min' && displayUnit === 'sec') return Math.round(storedValue * 60);
    if (baseUnit === 'sec' && displayUnit === 'min') return parseFloat((storedValue / 60).toFixed(2));
    return storedValue;
  };

  const calculateStoredValueFromInput = (inputValue: string, baseUnit: TimeUnit, displayUnit: TimeUnit): number => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) return 0;
    if (baseUnit === displayUnit) return val;
    if (baseUnit === 'min' && displayUnit === 'sec') return val / 60;
    if (baseUnit === 'sec' && displayUnit === 'min') return val * 60;
    return val;
  };

  const updateSetting = (key: keyof Settings, val: string) => {
    const conf = FIELD_CONFIG[key as keyof typeof FIELD_CONFIG];
    if (!conf) return;

    const currentUnit = localSettings[conf.unitKey as keyof Settings] as TimeUnit;
    if (val === '') {
        setLocalSettings(prev => ({ ...prev, [key]: NaN }));
        return;
    }
    
    const newValue = calculateStoredValueFromInput(val, conf.base, currentUnit);
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
  };

  const toggleUnit = (valueKey: keyof Settings) => {
    const conf = FIELD_CONFIG[valueKey as keyof typeof FIELD_CONFIG];
    if (!conf) return;

    const unitKey = conf.unitKey as keyof Settings;
    const currentUnit = localSettings[unitKey] as TimeUnit;
    const currentStoredValue = localSettings[valueKey] as number;
    const currentDisplayValue = getDisplayValue(currentStoredValue, conf.base, currentUnit);
    const nextUnit = currentUnit === 'min' ? 'sec' : 'min';

    let newStoredValue = 0;
    if (conf.base === 'min') {
        newStoredValue = nextUnit === 'sec' ? currentDisplayValue / 60 : currentDisplayValue;
    } else {
        newStoredValue = nextUnit === 'sec' ? currentDisplayValue : currentDisplayValue * 60;
    }

    setLocalSettings(prev => ({
      ...prev,
      [valueKey]: newStoredValue,
      [unitKey]: nextUnit
    }));
  };

  const handleSave = () => {
    const cleanSettings = { ...localSettings };
    (Object.keys(cleanSettings) as Array<keyof Settings>).forEach(key => {
        const k = key as keyof Settings;
        if (typeof cleanSettings[k] === 'number' && isNaN(cleanSettings[k] as number)) {
             (cleanSettings as any)[k] = (DEFAULT_SETTINGS as any)[k];
        }
    });
    onUpdateSettings(cleanSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    setFeedback({ type: 'success', message: '已恢复默认设置' });
  };

  const handleExportBackup = () => {
    try {
      exportBackupToFile(localSettings, history, tags);
      setFeedback({ type: 'success', message: '备份 JSON 已导出并保存到本地' });
    } catch {
      setFeedback({ type: 'error', message: '备份导出失败，请重试' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateBackup(content);
      if (res.success && res.data) {
        onImportData(res.data);
        if (res.data.settings) {
          setLocalSettings({ ...DEFAULT_SETTINGS, ...res.data.settings });
        }
        setFeedback({ type: 'success', message: `成功导入 ${res.data.history.length} 条记录与 ${res.data.tags.length} 个标签！` });
      } else {
        setFeedback({ type: 'error', message: res.error || '解析失败，请检查文件格式' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreSnapshotEntry = (entry: SnapshotEntry) => {
    if (entry.data) {
      onImportData(entry.data);
      if (entry.data.settings) {
        setLocalSettings({ ...DEFAULT_SETTINGS, ...entry.data.settings });
      }
      setFeedback({ type: 'success', message: `已还原 [${new Date(entry.timestamp).toLocaleString()}] 快照！` });
    }
  };

  const handleDeleteSnapshotEntry = (id: string) => {
    const updated = deleteSnapshot(id);
    setSnapshots(updated);
    setFeedback({ type: 'success', message: '已删除选中的快照记录' });
  };

  const handleClearAllSnapshots = () => {
    const updated = clearAllSnapshots();
    setSnapshots(updated);
    setFeedback({ type: 'success', message: '已成功清空所有快照记录' });
  };

  const handleKeepOnlyLatestSnapshot = () => {
    const updated = keepOnlyLatestSnapshot();
    setSnapshots(updated);
    setFeedback({ type: 'success', message: '已精简快照列表，仅保留最新 1 份' });
  };

  const handleCreateManualSnapshot = () => {
    try {
      const ts = performAutoBackup(localSettings, history, tags);
      if (ts) {
        setSnapshots(getSnapshotList());
        setFeedback({ type: 'success', message: '已为您立即保存当前数据状态为最新快照！' });
      } else {
        setFeedback({ type: 'error', message: '保存快照失败，请重试' });
      }
    } catch {
      setFeedback({ type: 'error', message: '生成快照过程出现异常' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className={`absolute inset-0 bg-slate-900/30 backdrop-blur-xs ${isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'}`} 
      />
      
      <div 
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 ${isOpen ? 'animate-modal-enter' : 'animate-modal-exit'}`}
        onAnimationEnd={handleAnimationEnd}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">计时设置与备份</h2>
            <p className="text-xs text-slate-500 mt-0.5">定制专属专注节奏与数据管理</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all p-1.5 rounded-full active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-start gap-2.5 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-rose-50 text-rose-800 border border-rose-200/60'}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Focus Durations */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">专注与提醒参数</div>
            <InputRow 
                label="专注时长" 
                value={getDisplayValue(localSettings.focusDurationMinutes, 'min', localSettings.focusDurationUnit)}
                currentUnit={localSettings.focusDurationUnit}
                onChange={(val) => updateSetting('focusDurationMinutes', val)}
                onToggleUnit={() => toggleUnit('focusDurationMinutes')}
            />
            <InputRow 
                label="提醒最小间隔" 
                value={getDisplayValue(localSettings.minIntervalMinutes, 'min', localSettings.minIntervalUnit)}
                currentUnit={localSettings.minIntervalUnit}
                onChange={(val) => updateSetting('minIntervalMinutes', val)}
                onToggleUnit={() => toggleUnit('minIntervalMinutes')}
            />
            <InputRow 
                label="提醒最大间隔" 
                value={getDisplayValue(localSettings.maxIntervalMinutes, 'min', localSettings.maxIntervalUnit)}
                currentUnit={localSettings.maxIntervalUnit}
                min={getDisplayValue(localSettings.minIntervalMinutes, 'min', localSettings.maxIntervalUnit)}
                onChange={(val) => updateSetting('maxIntervalMinutes', val)}
                onToggleUnit={() => toggleUnit('maxIntervalMinutes')}
            />
            <InputRow 
                label="正念提神时长" 
                value={getDisplayValue(localSettings.microBreakSeconds, 'sec', localSettings.microBreakUnit)}
                currentUnit={localSettings.microBreakUnit}
                onChange={(val) => updateSetting('microBreakSeconds', val)}
                onToggleUnit={() => toggleUnit('microBreakSeconds')}
            />
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Section 2: Break Options */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">休息偏好</div>
            <InputRow 
                label="长休息时长" 
                value={getDisplayValue(localSettings.longBreakMinutes, 'min', localSettings.longBreakUnit)}
                currentUnit={localSettings.longBreakUnit}
                onChange={(val) => updateSetting('longBreakMinutes', val)}
                onToggleUnit={() => toggleUnit('longBreakMinutes')}
            />

            <div className="flex items-center justify-between py-1 group">
               <label className="text-slate-700 font-medium text-sm sm:text-base group-hover:text-slate-900 transition-colors">开启休息倒计时</label>
               <div className="flex items-center justify-end">
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={localSettings.showBreakCountdown} 
                      onChange={(e) => setLocalSettings(prev => ({...prev, showBreakCountdown: e.target.checked}))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 hover:bg-slate-300 transition-colors"></div>
                </label>
               </div>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Section 3: Backup & Restore */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">数据备份与快照管理</div>
              <button
                type="button"
                onClick={handleCreateManualSnapshot}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs rounded-lg transition-all active:scale-95 border border-teal-200/60"
              >
                <Save size={13} className="text-teal-600 shrink-0" />
                <span>拍摄新快照</span>
              </button>
            </div>

            {/* Auto Backup Toggle */}
            <div className="flex items-center justify-between py-1">
               <div className="flex items-center gap-2">
                 <ShieldCheck size={18} className="text-teal-600" />
                 <span className="text-slate-700 font-medium text-sm">自动本地备份快照</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={localSettings.autoBackupEnabled ?? true} 
                    onChange={(e) => setLocalSettings(prev => ({...prev, autoBackupEnabled: e.target.checked}))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 hover:bg-slate-300 transition-colors"></div>
              </label>
            </div>

            {/* Snapshot Records List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <History size={13} />
                  <span>历史快照列表 ({snapshots.length}/5)</span>
                </span>
                {snapshots.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleKeepOnlyLatestSnapshot}
                      className="text-teal-600 hover:text-teal-700 hover:underline font-semibold"
                      title="精简旧快照，仅保留最新 1 份"
                    >
                      仅留最新
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllSnapshots}
                      className="text-rose-500 hover:text-rose-600 hover:underline font-semibold"
                      title="清空所有快照记录"
                    >
                      清空快照
                    </button>
                  </div>
                )}
              </div>

              {snapshots.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {snapshots.map((snap) => (
                    <div 
                      key={snap.id} 
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-semibold text-slate-800">
                          {new Date(snap.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          包含 {snap.data?.history?.length || 0} 条记录 · {snap.data?.tags?.length || 0} 个标签
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshotEntry(snap)}
                          className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-teal-50 text-teal-700 font-semibold rounded-lg border border-slate-200 hover:border-teal-300 transition-all active:scale-95 text-[11px]"
                          title="恢复此快照数据"
                        >
                          <RefreshCw size={11} />
                          <span>还原</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshotEntry(snap.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="删除此快照"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  暂无快照记录，可以点击右上角“拍摄新快照”保存
                </div>
              )}
              
              <p className="text-[11px] text-slate-400 leading-tight pt-0.5">
                💡 自动智能去重与数量精简（最多保留 5 份最新快照，3分钟内变动自动覆盖合并），无需担心占用硬盘空间。
              </p>
            </div>

            {/* Backup/Export & Import JSON Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-xl transition-all active:scale-98"
              >
                <Download size={15} />
                <span>导出备份 JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-medium text-xs rounded-xl transition-all active:scale-98"
              >
                <Upload size={15} />
                <span>导入备份 JSON</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* Section 4: WebDAV Cloud Sync */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud size={18} className="text-teal-600" />
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">WebDAV 云端同步</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={getWebDavConfig().enabled} 
                  onChange={(e) => updateWebDavConfig({ enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 hover:bg-slate-300 transition-colors"></div>
              </label>
            </div>

            {getWebDavConfig().enabled && (
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                
                {/* Preset Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                    <span>网盘类型预设</span>
                    <span className="text-[10px] text-teal-600 font-mono">WebDAV 协议</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        updateWebDavConfig({ serverUrl: val });
                      }
                    }}
                    value={WEBDAV_PRESETS.find(p => p.url === getWebDavConfig().serverUrl)?.url || ''}
                    className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-2.5 text-xs text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    {WEBDAV_PRESETS.map((p, idx) => (
                      <option key={idx} value={p.url}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {WEBDAV_PRESETS.find(p => p.url === getWebDavConfig().serverUrl)?.helpText && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                      💡 {WEBDAV_PRESETS.find(p => p.url === getWebDavConfig().serverUrl)?.helpText}
                    </p>
                  )}
                </div>

                {/* Server URL */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Server size={12} className="text-slate-400" />
                    <span>服务器 URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://dav.jianguoyun.com/dav/"
                    value={getWebDavConfig().serverUrl}
                    onChange={(e) => updateWebDavConfig({ serverUrl: e.target.value })}
                    className="w-full bg-white border border-slate-200/80 rounded-xl py-1.5 px-3 text-xs font-mono text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                {/* Account & Password */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      <span>账号/邮箱</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. user@example.com"
                      value={getWebDavConfig().username}
                      onChange={(e) => updateWebDavConfig({ username: e.target.value })}
                      className="w-full bg-white border border-slate-200/80 rounded-xl py-1.5 px-2.5 text-xs font-mono text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Key size={12} className="text-slate-400" />
                      <span>应用授权密码</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="授权密码"
                        value={getWebDavConfig().password}
                        onChange={(e) => updateWebDavConfig({ password: e.target.value })}
                        className="w-full bg-white border border-slate-200/80 rounded-xl py-1.5 pl-2.5 pr-7 text-xs font-mono text-slate-800 outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remote Path */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Folder size={12} className="text-slate-400" />
                    <span>云端文件路径</span>
                  </label>
                  <input
                    type="text"
                    placeholder="/focus_flow_backup.json"
                    value={getWebDavConfig().remotePath}
                    onChange={(e) => updateWebDavConfig({ remotePath: e.target.value })}
                    className="w-full bg-white border border-slate-200/80 rounded-xl py-1.5 px-3 text-xs font-mono text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                {/* Auto Sync Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-slate-700">完成专注后自动上传同步</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={getWebDavConfig().autoSync} 
                      onChange={(e) => updateWebDavConfig({ autoSync: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 hover:bg-slate-300 transition-colors"></div>
                  </label>
                </div>

                {/* Last Sync Info */}
                {getWebDavConfig().lastSyncTime && (
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 pt-0.5">
                    <Sparkles size={11} className="text-teal-600" />
                    <span>上次同步时间：{new Date(getWebDavConfig().lastSyncTime!).toLocaleString()}</span>
                  </div>
                )}

                {/* Sync Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleTestWebDav}
                    disabled={isTestingWebDav}
                    className="py-2 px-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Link size={12} className={isTestingWebDav ? 'animate-spin text-teal-600' : ''} />
                    <span>{isTestingWebDav ? '测试中...' : '测试连接'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadWebDav}
                    disabled={isUploadingWebDav}
                    className="py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <CloudUpload size={12} className={isUploadingWebDav ? 'animate-bounce' : ''} />
                    <span>{isUploadingWebDav ? '上传中...' : '同步上传'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWebDav}
                    disabled={isDownloadingWebDav}
                    className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[11px] rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <CloudDownload size={12} className={isDownloadingWebDav ? 'animate-bounce' : ''} />
                    <span>{isDownloadingWebDav ? '拉取中...' : '云端还原'}</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-10">
            <button 
                onClick={handleReset}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 px-3 py-2 rounded-xl transition-all active:scale-95 text-sm font-medium"
                title="恢复默认设置"
            >
                <RotateCcw size={16} />
                <span>重置</span>
            </button>

            <button 
                onClick={handleSave}
                className="bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm py-2.5 px-6 rounded-xl transition-all shadow-xs active:scale-95"
            >
                保存设置
            </button>
        </div>
      </div>
    </div>
  );
};