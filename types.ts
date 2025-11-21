export enum TimerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  BREAK_PAUSED = 'BREAK_PAUSED',
  BREAK = 'BREAK',
  FINISHED = 'FINISHED'
}

export type TimeUnit = 'min' | 'sec';

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
};