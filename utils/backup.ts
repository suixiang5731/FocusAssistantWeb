import { Settings, FocusRecord, Tag } from '../types';

export interface BackupData {
  version: number;
  app: string;
  exportedAt: string;
  settings: Settings;
  history: FocusRecord[];
  tags: Tag[];
}

export interface SnapshotEntry {
  id: string;
  timestamp: number;
  data: BackupData;
}

export const SNAPSHOT_LIST_KEY = 'focusFlow_snapshot_list';
export const AUTO_BACKUP_KEY = 'focusFlow_auto_backup_latest';
export const AUTO_BACKUP_TIME_KEY = 'focusFlow_auto_backup_time';

export function createBackupObject(settings: Settings, history: FocusRecord[], tags: Tag[]): BackupData {
  return {
    version: 1,
    app: 'Focus Flow',
    exportedAt: new Date().toISOString(),
    settings,
    history,
    tags,
  };
}

export function exportBackupToFile(settings: Settings, history: FocusRecord[], tags: Tag[]) {
  const data = createBackupObject(settings, history, tags);
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `focus_flow_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function performAutoBackup(settings: Settings, history: FocusRecord[], tags: Tag[]): number | null {
  try {
    const data = createBackupObject(settings, history, tags);
    const now = Date.now();
    
    // Save latest
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(data));
    localStorage.setItem(AUTO_BACKUP_TIME_KEY, now.toString());

    // Add to snapshot list (keep up to 10 entries max)
    const snapshots = getSnapshotList();
    const newEntry: SnapshotEntry = {
      id: `snap_${now}`,
      timestamp: now,
      data
    };
    
    // Don't add duplicate if history/tags/settings unchanged within 10 seconds
    if (snapshots.length > 0 && Math.abs(now - snapshots[0].timestamp) < 10000) {
      snapshots[0] = newEntry;
    } else {
      snapshots.unshift(newEntry);
    }

    const trimmed = snapshots.slice(0, 10);
    localStorage.setItem(SNAPSHOT_LIST_KEY, JSON.stringify(trimmed));

    return now;
  } catch (e) {
    console.error('Auto backup failed', e);
    return null;
  }
}

export function getSnapshotList(): SnapshotEntry[] {
  try {
    const str = localStorage.getItem(SNAPSHOT_LIST_KEY);
    if (!str) {
      // Fallback: migrate old single backup if exists
      const old = getAutoBackupSnapshot();
      if (old.data && old.timestamp) {
        return [{ id: `snap_${old.timestamp}`, timestamp: old.timestamp, data: old.data }];
      }
      return [];
    }
    return JSON.parse(str);
  } catch {
    return [];
  }
}

export function deleteSnapshot(id: string): SnapshotEntry[] {
  try {
    const list = getSnapshotList().filter(s => s.id !== id);
    localStorage.setItem(SNAPSHOT_LIST_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function getAutoBackupSnapshot(): { data: BackupData | null; timestamp: number | null } {
  try {
    const list = getSnapshotList();
    if (list.length > 0) {
      return { data: list[0].data, timestamp: list[0].timestamp };
    }
    return { data: null, timestamp: null };
  } catch {
    return { data: null, timestamp: null };
  }
}

export function parseAndValidateBackup(jsonString: string): { success: boolean; data?: BackupData; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: '文件格式无效：并非合法的 JSON 对象' };
    }
    
    // Validate history & tags arrays
    if (!Array.isArray(parsed.history) || !Array.isArray(parsed.tags)) {
      return { success: false, error: '数据格式错误：缺少必要的 history 或 tags 数据' };
    }

    return {
      success: true,
      data: parsed as BackupData
    };
  } catch (err: any) {
    return { success: false, error: `JSON 解析失败: ${err?.message || '文件损坏'}` };
  }
}
