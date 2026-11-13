export type RoomId = 'living-room' | 'bedroom' | 'kitchen';

export type ApplianceType = 'light' | 'fan' | 'ac' | 'tv' | 'door' | 'curtains';

export type AcMode = 'cool' | 'eco' | 'fan';

export interface ApplianceState {
  id: string;
  roomId: RoomId;
  type: ApplianceType;
  name: string;
  isOn: boolean;
  brightness?: number; // 10 - 100
  color?: string; // hex
  speed?: number; // 1 - 5
  temperature?: number; // 16 - 30
  acMode?: AcMode;
  volume?: number; // 0 - 100
  channel?: number; // 1 - 5
  isLocked?: boolean;
  curtainPosition?: number; // 0 (closed) - 100 (open)
  lastUpdated: number;
}

export type GazeRegion =
  | 'TOP LEFT'
  | 'TOP CENTER'
  | 'TOP RIGHT'
  | 'CENTER LEFT'
  | 'CENTER'
  | 'CENTER RIGHT'
  | 'BOTTOM LEFT'
  | 'BOTTOM CENTER'
  | 'BOTTOM RIGHT';

export interface GazeFeatures {
  irisOffsetX: number;
  irisOffsetY: number;
  headYaw: number;
  headPitch: number;
  leftEar: number;
  rightEar: number;
  avgEar: number;
  faceCenterX: number;
  faceCenterY: number;
  faceScale: number;
  irisDetected: boolean;
}

export interface CalibrationSample {
  pointIndex: number;
  targetX: number;
  targetY: number;
  region: GazeRegion;
  features: number[];
  rawGaze: GazeFeatures;
  timestamp: number;
}

export interface CalibrationProfile {
  id: string;
  createdAt: number;
  pointCount: 5 | 9;
  sampleCount: number;
  weightsX: number[];
  weightsY: number[];
  validationErrorNorm: number;
  validationErrorPx: number;
  r2Score: number;
  qualityLabel: 'Excellent' | 'Good' | 'Fair' | 'Needs Recalibration';
  samples: CalibrationSample[];
  mlClassifierTrained: boolean;
  mlValidationAccuracy: number | null;
}

export type BlinkEventType = 'single' | 'double' | 'long';

export interface BlinkEvent {
  type: BlinkEventType;
  durationMs: number;
  timestamp: number;
}

export type TrackingStatus =
  | 'idle'
  | 'initializing'
  | 'active'
  | 'paused'
  | 'error'
  | 'permission-denied'
  | 'no-camera'
  | 'camera-in-use';

export type FaceDetectionQuality =
  | 'good'
  | 'fair'
  | 'lost'
  | 'multiple-faces'
  | 'low-light';

export type ControlMode = 'off' | 'webcam-gaze' | 'demo-simulation';

export type InteractionMethod =
  | 'gaze-dwell'
  | 'double-blink'
  | 'long-blink'
  | 'manual'
  | 'demo-cursor'
  | 'demo-keyboard';

export interface InteractionLogEntry {
  id: string;
  timestamp: number;
  roomId: RoomId;
  applianceId: string;
  applianceName: string;
  action: string;
  method: InteractionMethod;
  gazeRegion: GazeRegion | null;
}

export interface GazePredictionEntry {
  timestamp: number;
  x: number;
  y: number;
  region: GazeRegion;
  mlRegion: GazeRegion | null;
  mlConfidence: number | null;
  source: 'webcam' | 'demo';
}

export interface UserPreferences {
  dwellDurationMs: number;
  sensitivity: number;
  smoothingAlpha: number;
  blinkEarThreshold: number;
  longBlinkMinMs: number;
  doubleBlinkWindowMs: number;
  singleBlinkAction: 'none' | 'highlight';
  doubleBlinkAction: 'confirm' | 'toggle' | 'none';
  longBlinkAction: 'cancel' | 'pause' | 'none';
  voiceEnabled: boolean;
  voiceVolume: number;
  voiceRate: number;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xl';
  calibrationPoints: 5 | 9;
  confirmDoorUnlock: boolean;
  preferredCameraId: string;
}

export interface MlTrainingMetrics {
  trained: boolean;
  trainingInProgress: boolean;
  sampleCount: number;
  trainCount: number;
  valCount: number;
  finalLoss: number | null;
  valAccuracy: number | null;
  lossHistory: { epoch: number; loss: number; valLoss: number }[];
  trainedAt: number | null;
  error: string | null;
}
