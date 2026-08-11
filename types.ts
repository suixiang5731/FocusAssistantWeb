export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  BREAK_PAUSED = 'BREAK_PAUSED',
  BREAK = 'BREAK',
  FINISHED = 'FINISHED'
}

export type TimeUnit = 'min' | 'sec';

export interface WebDavConfig {
  enabled: boolean;
  serverUrl: string;   // e.g. https://dav.jianguoyun.com/dav/
  username: string;
  password: string;    // application password
  remotePath: string;  // e.g. /focus_flow_backup.json
  autoSync: boolean;   // Auto upload after focus session completion
  lastSyncTime?: number;
}

export const DEFAULT_WEBDAV_CONFIG: WebDavConfig = {
  enabled: false,
  serverUrl: 'https://dav.jianguoyun.com/dav/',
  username: '',
  password: '',
  remotePath: '/focus_flow_backup.json',
  autoSync: true,
};

export interface Settings {
  focusDurationMinutes: number;    // Total session length
  focusDurationUnit: TimeUnit;
  
  minIntervalMinutes: number;      // Random bell min
  minIntervalUnit: TimeUnit;
  
  maxIntervalMinutes: number;      // Random bell max
  maxIntervalUnit: TimeUnit;
  
  microBreakSeconds: number;       // Duration of the "ding" notification
  microBreakUnit: TimeUnit;

  longBreakMinutes: number;        // Rest time after session
  longBreakUnit: TimeUnit;

  showBreakCountdown: boolean;     // Toggle for break UI
  autoBackupEnabled: boolean;      // Toggle for automatic backups
  webDavConfig?: WebDavConfig;     // WebDAV cloud sync configuration
}

export const DEFAULT_SETTINGS: Settings = {
  focusDurationMinutes: 90,
  focusDurationUnit: 'min',

  minIntervalMinutes: 2,
  minIntervalUnit: 'min',

  maxIntervalMinutes: 5,
  maxIntervalUnit: 'min',

  microBreakSeconds: 10,
  microBreakUnit: 'sec',

  longBreakMinutes: 20,
  longBreakUnit: 'min',

  showBreakCountdown: true,
  autoBackupEnabled: true,
  webDavConfig: DEFAULT_WEBDAV_CONFIG,
};

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface FocusRecord {
  id: string;
  startTime: number; // timestamp
  endTime: number;   // timestamp
  durationSeconds: number;
  tagId: string;
  tagName: string; // Store name in case tag is deleted
}

export const DEFAULT_TAGS: Tag[] = [
  { id: '1', name: '学习', color: '#4f46e5' }, // Indigo
  { id: '2', name: '刷题', color: '#0ea5e9' }, // Sky
  { id: '3', name: '纪录片', color: '#f59e0b' }, // Amber
  { id: '4', name: '运动', color: '#10b981' }, // Emerald
  { id: '5', name: '阅读', color: '#ec4899' }, // Pink
];