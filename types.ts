export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  BREAK = 'BREAK',
  FINISHED = 'FINISHED'
}

export interface Settings {
  focusDurationMinutes: number;    // Total session length
  minIntervalMinutes: number;      // Random bell min
  maxIntervalMinutes: number;      // Random bell max
  microBreakSeconds: number;       // Duration of the "ding" notification
  longBreakMinutes: number;        // Rest time after session
  showBreakCountdown: boolean;     // Toggle for break UI
}

export const DEFAULT_SETTINGS: Settings = {
  focusDurationMinutes: 90,
  minIntervalMinutes: 2,
  maxIntervalMinutes: 5,
  microBreakSeconds: 10,
  longBreakMinutes: 20,
  showBreakCountdown: true,
};