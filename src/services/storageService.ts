import {
  ApplianceState,
  CalibrationProfile,
  InteractionLogEntry,
  RoomId,
  UserPreferences,
} from '../types';

const STORAGE_KEYS = {
  PREFERENCES: 'gazehome_preferences_v1',
  CALIBRATION: 'gazehome_calibration_v1',
  APPLIANCES: 'gazehome_appliances_v1',
  HISTORY: 'gazehome_history_v1',
  ACTIVE_ROOM: 'gazehome_active_room_v1',
  SESSION_STATS: 'gazehome_session_stats_v1',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  dwellDurationMs: 1500,
  sensitivity: 1.0,
  smoothingAlpha: 0.28,
  blinkEarThreshold: 0.2,
  longBlinkMinMs: 650,
  doubleBlinkWindowMs: 450,
  singleBlinkAction: 'none',
  doubleBlinkAction: 'confirm',
  longBlinkAction: 'cancel',
  voiceEnabled: true,
  voiceVolume: 0.85,
  voiceRate: 1.0,
  highContrast: false,
  fontSize: 'normal',
  calibrationPoints: 9,
  confirmDoorUnlock: true,
  preferredCameraId: '',
};

export interface PersistedStats {
  totalBlinkGestures: number;
  totalGazeSeconds: number;
  gazeRegionCounts: Record<string, number>;
}

const DEFAULT_STATS: PersistedStats = {
  totalBlinkGestures: 0,
  totalGazeSeconds: 0,
  gazeRegionCounts: {},
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const storageService = {
  loadPreferences(): UserPreferences {
    const stored = safeRead<Partial<UserPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    return { ...DEFAULT_PREFERENCES, ...stored };
  },

  savePreferences(prefs: UserPreferences): boolean {
    return safeWrite(STORAGE_KEYS.PREFERENCES, prefs);
  },

  loadCalibration(): CalibrationProfile | null {
    return safeRead<CalibrationProfile | null>(STORAGE_KEYS.CALIBRATION, null);
  },

  saveCalibration(profile: CalibrationProfile | null): boolean {
    if (!profile) {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.CALIBRATION);
        return true;
      } catch {
        return false;
      }
    }
    return safeWrite(STORAGE_KEYS.CALIBRATION, profile);
  },

  loadAppliances(fallback: ApplianceState[]): ApplianceState[] {
    const stored = safeRead<ApplianceState[] | null>(STORAGE_KEYS.APPLIANCES, null);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      return fallback;
    }
    return stored;
  },

  saveAppliances(appliances: ApplianceState[]): boolean {
    return safeWrite(STORAGE_KEYS.APPLIANCES, appliances);
  },

  loadHistory(): InteractionLogEntry[] {
    return safeRead<InteractionLogEntry[]>(STORAGE_KEYS.HISTORY, []);
  },

  saveHistory(entries: InteractionLogEntry[]): boolean {
    return safeWrite(STORAGE_KEYS.HISTORY, entries.slice(0, 500));
  },

  clearHistory(): boolean {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.HISTORY);
      return true;
    } catch {
      return false;
    }
  },

  loadActiveRoom(): RoomId {
    return safeRead<RoomId>(STORAGE_KEYS.ACTIVE_ROOM, 'living-room');
  },

  saveActiveRoom(roomId: RoomId): boolean {
    return safeWrite(STORAGE_KEYS.ACTIVE_ROOM, roomId);
  },

  loadStats(): PersistedStats {
    return { ...DEFAULT_STATS, ...safeRead<Partial<PersistedStats>>(STORAGE_KEYS.SESSION_STATS, {}) };
  },

  saveStats(stats: PersistedStats): boolean {
    return safeWrite(STORAGE_KEYS.SESSION_STATS, stats);
  },

  clearStats(): boolean {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION_STATS);
      return true;
    } catch {
      return false;
    }
  },

  exportAllData(): string {
    const payload = {
      exportedAt: new Date().toISOString(),
      preferences: this.loadPreferences(),
      calibration: this.loadCalibration(),
      appliances: safeRead(STORAGE_KEYS.APPLIANCES, []),
      history: this.loadHistory(),
      stats: this.loadStats(),
    };
    return JSON.stringify(payload, null, 2);
  },
};
