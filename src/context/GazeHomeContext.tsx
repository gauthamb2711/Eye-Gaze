import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  AcMode,
  ApplianceState,
  BlinkEvent,
  CalibrationProfile,
  ControlMode,
  FaceDetectionQuality,
  GazeFeatures,
  GazePredictionEntry,
  GazeRegion,
  InteractionLogEntry,
  InteractionMethod,
  MlTrainingMetrics,
  RoomId,
  TrackingStatus,
  UserPreferences,
} from '../types';
import {
  createInitialAppliances,
  getApplianceSpeechMessage,
  nextAcMode,
  ROOMS,
} from '../services/applianceSimulationService';
import { blinkDetectionService } from '../services/blinkDetectionService';
import { cameraService, CameraDeviceInfo } from '../services/cameraService';
import { faceLandmarkService } from '../services/faceLandmarkService';
import { gazeEstimationService } from '../services/gazeEstimationService';
import { gazeInteractionService } from '../services/gazeInteractionService';
import { mlTrainingService } from '../services/mlTrainingService';
import { speechService } from '../services/speechService';
import { PersistedStats, storageService } from '../services/storageService';

export interface EarSamplePoint {
  t: number;
  left: number;
  right: number;
  avg: number;
}

interface GazeHomeContextValue {
  // Preferences & Accessibility
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;

  // Camera & Model Status
  trackingStatus: TrackingStatus;
  trackingError: string | null;
  modelReady: boolean;
  modelLoading: boolean;
  controlMode: ControlMode;
  cameras: CameraDeviceInfo[];
  refreshCameras: () => Promise<void>;
  startWebcamTracking: () => Promise<boolean>;
  pauseWebcamTracking: () => void;
  resumeWebcamTracking: () => void;
  stopWebcamTracking: () => void;
  videoStream: MediaStream | null;

  // Live Real-time Telemetry (Webcam or Demo cleanly separated)
  faceQuality: FaceDetectionQuality;
  faceCount: number;
  trackingConfidence: number;
  averageLuma: number;
  gazeFeatures: GazeFeatures | null;
  latestLandmarksRef: React.MutableRefObject<NormalizedLandmark[] | null>;
  latestFeaturesRef: React.MutableRefObject<GazeFeatures | null>;
  gazePoint: { x: number; y: number } | null;
  gazeRegion: GazeRegion | null;
  isCalibratedGaze: boolean;
  earHistory: EarSamplePoint[];
  lastBlinkEvent: BlinkEvent | null;
  isEyeClosed: boolean;

  // Dwell & Selection
  hoveredTargetId: string | null;
  hoveredTargetLabel: string | null;
  dwellProgress: number;
  inCooldown: boolean;

  // Calibration & ML
  calibrationProfile: CalibrationProfile | null;
  saveCalibrationProfile: (profile: CalibrationProfile) => void;
  resetCalibration: () => void;
  mlMetrics: MlTrainingMetrics;
  trainMlClassifier: () => Promise<MlTrainingMetrics>;
  predictionHistory: GazePredictionEntry[];
  mlPredictedRegion: { region: GazeRegion; confidence: number } | null;

  // Demo Mode
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  setDemoGazePosition: (x: number, y: number, source?: 'demo-cursor' | 'demo-keyboard') => void;
  triggerDemoBlink: (type: 'single' | 'double' | 'long') => void;

  // Smart Home State
  activeRoom: RoomId;
  setActiveRoom: (roomId: RoomId) => void;
  appliances: ApplianceState[];
  toggleAppliance: (id: string, method?: InteractionMethod) => void;
  updateAppliance: (
    id: string,
    patch: Partial<ApplianceState>,
    actionDesc: string,
    method?: InteractionMethod
  ) => void;
  applyRoomPreset: (roomId: RoomId, preset: 'all-off' | 'eco' | 'night-lock') => void;
  pendingDoorUnlock: ApplianceState | null;
  confirmPendingDoorUnlock: () => void;
  cancelPendingDoorUnlock: () => void;

  // History & Analytics Stats
  history: InteractionLogEntry[];
  clearHistory: () => void;
  stats: PersistedStats;
  sessionDurationSec: number;
  exportAllData: () => void;
}

const GazeHomeContext = createContext<GazeHomeContextValue | null>(null);

export const GazeHomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    storageService.loadPreferences()
  );
  const [calibrationProfile, setCalibrationProfile] = useState<CalibrationProfile | null>(() =>
    storageService.loadCalibration()
  );
  const [appliances, setAppliances] = useState<ApplianceState[]>(() =>
    storageService.loadAppliances(createInitialAppliances())
  );
  const [activeRoom, setActiveRoomState] = useState<RoomId>(() =>
    storageService.loadActiveRoom()
  );
  const [history, setHistory] = useState<InteractionLogEntry[]>(() =>
    storageService.loadHistory()
  );
  const [stats, setStats] = useState<PersistedStats>(() => storageService.loadStats());

  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('idle');
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [controlMode, setControlMode] = useState<ControlMode>('off');
  const [cameras, setCameras] = useState<CameraDeviceInfo[]>([]);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const [faceQuality, setFaceQuality] = useState<FaceDetectionQuality>('lost');
  const [faceCount, setFaceCount] = useState<number>(0);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(0);
  const [averageLuma, setAverageLuma] = useState<number>(128);
  const [gazeFeatures, setGazeFeatures] = useState<GazeFeatures | null>(null);
  const [gazePoint, setGazePoint] = useState<{ x: number; y: number } | null>(null);
  const [gazeRegion, setGazeRegion] = useState<GazeRegion | null>(null);
  const [isCalibratedGaze, setIsCalibratedGaze] = useState<boolean>(false);
  const [earHistory, setEarHistory] = useState<EarSamplePoint[]>([]);
  const [lastBlinkEvent, setLastBlinkEvent] = useState<BlinkEvent | null>(null);
  const [isEyeClosed, setIsEyeClosed] = useState<boolean>(false);

  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);
  const [hoveredTargetLabel, setHoveredTargetLabel] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const [inCooldown, setInCooldown] = useState<boolean>(false);

  const [mlMetrics, setMlMetrics] = useState<MlTrainingMetrics>(() =>
    mlTrainingService.getMetrics()
  );
  const [predictionHistory, setPredictionHistory] = useState<GazePredictionEntry[]>([]);
  const [mlPredictedRegion, setMlPredictedRegion] = useState<{
    region: GazeRegion;
    confidence: number;
  } | null>(null);

  const [pendingDoorUnlock, setPendingDoorUnlock] = useState<ApplianceState | null>(null);
  const [sessionDurationSec, setSessionDurationSec] = useState<number>(0);

  // Refs for animation loop without stale closures
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const loopRunningRef = useRef<boolean>(false);
  const lastFrameProcessTsRef = useRef<number>(0);
  const lastUiSyncTsRef = useRef<number>(0);
  const smoothedGazeRef = useRef<{ x: number; y: number } | null>(null);
  const latestLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const latestFeaturesRef = useRef<GazeFeatures | null>(null);

  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;
  const calRef = useRef(calibrationProfile);
  calRef.current = calibrationProfile;
  const controlModeRef = useRef(controlMode);
  controlModeRef.current = controlMode;
  const trackingStatusRef = useRef(trackingStatus);
  trackingStatusRef.current = trackingStatus;
  const hoveredTargetRef = useRef<string | null>(null);
  hoveredTargetRef.current = hoveredTargetId;
  const gazeRegionRef = useRef<GazeRegion | null>(null);
  gazeRegionRef.current = gazeRegion;
  const demoMethodRef = useRef<'demo-cursor' | 'demo-keyboard'>('demo-cursor');

  // Apply high contrast and font size classes to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.remove('font-large', 'font-xl');
    if (preferences.fontSize === 'large') root.classList.add('font-large');
    if (preferences.fontSize === 'xl') root.classList.add('font-xl');
  }, [preferences.highContrast, preferences.fontSize]);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      storageService.savePreferences(next);
      return next;
    });
  }, []);

  const setActiveRoom = useCallback((roomId: RoomId) => {
    setActiveRoomState(roomId);
    storageService.saveActiveRoom(roomId);
  }, []);

  const appendHistory = useCallback(
    (entry: Omit<InteractionLogEntry, 'id' | 'timestamp'>) => {
      const fullEntry: InteractionLogEntry = {
        ...entry,
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const next = [fullEntry, ...prev].slice(0, 500);
        storageService.saveHistory(next);
        return next;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    storageService.clearHistory();
    const resetStats: PersistedStats = {
      totalBlinkGestures: 0,
      totalGazeSeconds: 0,
      gazeRegionCounts: {},
    };
    setStats(resetStats);
    storageService.clearStats();
  }, []);

  // Appliance actions
  const updateAppliance = useCallback(
    (
      id: string,
      patch: Partial<ApplianceState>,
      actionDesc: string,
      method: InteractionMethod = 'manual'
    ) => {
      setAppliances((prev) => {
        let updatedItem: ApplianceState | null = null;
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          updatedItem = { ...item, ...patch, lastUpdated: Date.now() };
          return updatedItem;
        });
        storageService.saveAppliances(next);

        if (updatedItem) {
          const itemRef = updatedItem as ApplianceState;
          appendHistory({
            roomId: itemRef.roomId,
            applianceId: itemRef.id,
            applianceName: itemRef.name,
            action: actionDesc,
            method,
            gazeRegion: gazeRegionRef.current,
          });
          speechService.speak(getApplianceSpeechMessage(itemRef, actionDesc), {
            enabled: prefsRef.current.voiceEnabled,
            volume: prefsRef.current.voiceVolume,
            rate: prefsRef.current.voiceRate,
          });
        }
        return next;
      });
    },
    [appendHistory]
  );

  const toggleAppliance = useCallback(
    (id: string, method: InteractionMethod = 'manual') => {
      setAppliances((prev) => {
        const target = prev.find((a) => a.id === id);
        if (!target) return prev;

        // Door unlock safety confirmation
        if (target.type === 'door' && target.isLocked && prefsRef.current.confirmDoorUnlock) {
          setPendingDoorUnlock(target);
          speechService.speak(`Confirm unlocking ${target.name}`, {
            enabled: prefsRef.current.voiceEnabled,
            volume: prefsRef.current.voiceVolume,
            rate: prefsRef.current.voiceRate,
          });
          return prev;
        }

        let updatedItem: ApplianceState | null = null;
        let actionDesc = '';

        const next = prev.map((item) => {
          if (item.id !== id) return item;
          if (item.type === 'door') {
            const nextLocked = !item.isLocked;
            actionDesc = nextLocked ? 'Locked' : 'Unlocked';
            updatedItem = { ...item, isLocked: nextLocked, isOn: !nextLocked, lastUpdated: Date.now() };
            return updatedItem;
          }
          if (item.type === 'curtains') {
            const nextOpen = !item.isOn;
            actionDesc = nextOpen ? 'Opened' : 'Closed';
            updatedItem = {
              ...item,
              isOn: nextOpen,
              curtainPosition: nextOpen ? 100 : 0,
              lastUpdated: Date.now(),
            };
            return updatedItem;
          }
          const nextOn = !item.isOn;
          actionDesc = nextOn ? 'Turned ON' : 'Turned OFF';
          updatedItem = { ...item, isOn: nextOn, lastUpdated: Date.now() };
          return updatedItem;
        });

        storageService.saveAppliances(next);

        if (updatedItem) {
          const itemRef = updatedItem as ApplianceState;
          appendHistory({
            roomId: itemRef.roomId,
            applianceId: itemRef.id,
            applianceName: itemRef.name,
            action: actionDesc,
            method,
            gazeRegion: gazeRegionRef.current,
          });
          speechService.speak(getApplianceSpeechMessage(itemRef, actionDesc.toLowerCase()), {
            enabled: prefsRef.current.voiceEnabled,
            volume: prefsRef.current.voiceVolume,
            rate: prefsRef.current.voiceRate,
          });
        }

        return next;
      });
    },
    [appendHistory]
  );

  const confirmPendingDoorUnlock = useCallback(() => {
    if (!pendingDoorUnlock) return;
    const id = pendingDoorUnlock.id;
    setPendingDoorUnlock(null);
    updateAppliance(id, { isLocked: false, isOn: true }, 'Unlocked (Confirmed)', 'gaze-dwell');
  }, [pendingDoorUnlock, updateAppliance]);

  const cancelPendingDoorUnlock = useCallback(() => {
    if (!pendingDoorUnlock) return;
    setPendingDoorUnlock(null);
    speechService.speak('Door unlock cancelled.', {
      enabled: prefsRef.current.voiceEnabled,
      volume: prefsRef.current.voiceVolume,
      rate: prefsRef.current.voiceRate,
    });
  }, [pendingDoorUnlock]);

  const applyRoomPreset = useCallback(
    (roomId: RoomId, preset: 'all-off' | 'eco' | 'night-lock') => {
      const roomName = ROOMS.find((r) => r.id === roomId)?.name ?? roomId;
      setAppliances((prev) => {
        const next = prev.map((a) => {
          if (a.roomId !== roomId) return a;
          if (preset === 'all-off') {
            if (a.type === 'door') return a;
            return { ...a, isOn: false, lastUpdated: Date.now() };
          }
          if (preset === 'eco') {
            if (a.type === 'ac') return { ...a, isOn: true, acMode: 'eco' as AcMode, temperature: 25, lastUpdated: Date.now() };
            if (a.type === 'light') return { ...a, isOn: true, brightness: 50, lastUpdated: Date.now() };
            if (a.type === 'fan') return { ...a, isOn: true, speed: 2, lastUpdated: Date.now() };
            return a;
          }
          // night-lock
          if (a.type === 'door') return { ...a, isLocked: true, isOn: false, lastUpdated: Date.now() };
          if (a.type === 'curtains') return { ...a, isOn: false, curtainPosition: 0, lastUpdated: Date.now() };
          if (a.type === 'light') return { ...a, isOn: false, lastUpdated: Date.now() };
          if (a.type === 'tv') return { ...a, isOn: false, lastUpdated: Date.now() };
          return a;
        });
        storageService.saveAppliances(next);
        return next;
      });
      const label =
        preset === 'all-off'
          ? 'All appliances turned OFF'
          : preset === 'eco'
          ? 'Eco preset applied'
          : 'Night lock preset applied';
      appendHistory({
        roomId,
        applianceId: `${roomId}-preset`,
        applianceName: `${roomName} Preset`,
        action: label,
        method: 'manual',
        gazeRegion: null,
      });
      speechService.speak(`${roomName} ${label}`, {
        enabled: prefsRef.current.voiceEnabled,
        volume: prefsRef.current.voiceVolume,
        rate: prefsRef.current.voiceRate,
      });
    },
    [appendHistory]
  );

  // Target activation dispatcher for DOM elements tagged with data-gaze-target
  const activateTargetId = useCallback(
    (targetId: string, method: InteractionMethod) => {
      if (targetId === 'door-confirm-unlock') {
        confirmPendingDoorUnlock();
        return;
      }
      if (targetId === 'door-cancel-unlock') {
        cancelPendingDoorUnlock();
        return;
      }
      if (targetId.startsWith('room:')) {
        const roomId = targetId.replace('room:', '') as RoomId;
        setActiveRoom(roomId);
        const roomLabel = ROOMS.find((r) => r.id === roomId)?.name ?? roomId;
        speechService.speak(`Switched to ${roomLabel}`, {
          enabled: prefsRef.current.voiceEnabled,
          volume: prefsRef.current.voiceVolume,
          rate: prefsRef.current.voiceRate,
        });
        return;
      }
      if (targetId.startsWith('appliance:')) {
        const appId = targetId.replace('appliance:', '');
        toggleAppliance(appId, method);
        return;
      }
      if (targetId.startsWith('action:')) {
        // Trigger DOM click for registered interactive gaze buttons
        const el = document.querySelector<HTMLElement>(`[data-gaze-target="${targetId}"]`);
        if (el) el.click();
      }
    },
    [cancelPendingDoorUnlock, confirmPendingDoorUnlock, setActiveRoom, toggleAppliance]
  );

  const activateTargetRef = useRef(activateTargetId);
  activateTargetRef.current = activateTargetId;

  // Handle blink gesture events
  const handleBlinkEvent = useCallback((evt: BlinkEvent) => {
    setLastBlinkEvent(evt);
    setStats((prev) => {
      const next = {
        ...prev,
        totalBlinkGestures: prev.totalBlinkGestures + 1,
      };
      storageService.saveStats(next);
      return next;
    });

    const p = prefsRef.current;
    if (evt.type === 'double' && p.doubleBlinkAction !== 'none') {
      const currentTarget = hoveredTargetRef.current;
      if (currentTarget) {
        gazeInteractionService.triggerCooldown();
        activateTargetRef.current(currentTarget, 'double-blink');
      }
    } else if (evt.type === 'long') {
      if (p.longBlinkAction === 'cancel') {
        if (pendingDoorUnlock) {
          cancelPendingDoorUnlock();
        } else {
          gazeInteractionService.reset();
          setHoveredTargetId(null);
          setDwellProgress(0);
        }
      } else if (p.longBlinkAction === 'pause' && controlModeRef.current === 'webcam-gaze') {
        setTrackingStatus((prev) => (prev === 'active' ? 'paused' : prev));
        speechService.speak('Gaze control paused.', {
          enabled: p.voiceEnabled,
          volume: p.voiceVolume,
          rate: p.voiceRate,
        });
      }
    }
  }, [cancelPendingDoorUnlock, pendingDoorUnlock]);

  useEffect(() => {
    blinkDetectionService.setListener(handleBlinkEvent);
    return () => blinkDetectionService.setListener(null);
  }, [handleBlinkEvent]);

  // Session duration & gaze region accounting timer (1s interval while active)
  useEffect(() => {
    if (controlMode === 'off' || (controlMode === 'webcam-gaze' && trackingStatus !== 'active')) {
      return;
    }
    const timer = window.setInterval(() => {
      setSessionDurationSec((s) => s + 1);
      if (gazeRegionRef.current) {
        const reg = gazeRegionRef.current;
        setStats((prev) => {
          const next: PersistedStats = {
            ...prev,
            totalGazeSeconds: prev.totalGazeSeconds + 1,
            gazeRegionCounts: {
              ...prev.gazeRegionCounts,
              [reg]: (prev.gazeRegionCounts[reg] || 0) + 1,
            },
          };
          storageService.saveStats(next);
          return next;
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [controlMode, trackingStatus]);

  const stopLoop = useCallback(() => {
    loopRunningRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const stopWebcamTracking = useCallback(() => {
    stopLoop();
    blinkDetectionService.reset();
    gazeInteractionService.reset();
    smoothedGazeRef.current = null;
    latestLandmarksRef.current = null;
    latestFeaturesRef.current = null;

    if (streamRef.current) {
      cameraService.stopCamera(streamRef.current);
      streamRef.current = null;
    }
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.srcObject = null;
    }
    setVideoStream(null);
    setTrackingStatus('idle');
    setControlMode((prev) => (prev === 'webcam-gaze' ? 'off' : prev));
    setFaceQuality('lost');
    setFaceCount(0);
    setTrackingConfidence(0);
    setGazeFeatures(null);
    setGazePoint(null);
    setHoveredTargetId(null);
    setDwellProgress(0);
    setIsEyeClosed(false);
  }, [stopLoop]);

  const runTrackingLoop = useCallback(() => {
    if (!loopRunningRef.current) return;

    const now = performance.now();
    // Skip heavy CV work if tab is hidden or throttling to ~30fps
    if (!document.hidden && now - lastFrameProcessTsRef.current >= 30) {
      lastFrameProcessTsRef.current = now;
      const video = hiddenVideoRef.current;

      if (
        video &&
        trackingStatusRef.current === 'active' &&
        controlModeRef.current === 'webcam-gaze' &&
        faceLandmarkService.isReady()
      ) {
        const detection = faceLandmarkService.detectFrame(video, now);
        if (detection) {
          latestLandmarksRef.current = detection.landmarks;

          if (!detection.landmarks || detection.faceCount === 0) {
            latestFeaturesRef.current = null;
            gazeInteractionService.reset();
            if (now - lastUiSyncTsRef.current >= 65) {
              lastUiSyncTsRef.current = now;
              setFaceQuality(detection.quality);
              setFaceCount(0);
              setTrackingConfidence(0);
              setAverageLuma(Math.round(detection.averageLuma));
              setGazeFeatures(null);
              setHoveredTargetId(null);
              setDwellProgress(0);
            }
          } else {
            const features = gazeEstimationService.extractFeatures(detection.landmarks);
            latestFeaturesRef.current = features;

            if (features) {
              const p = prefsRef.current;
              const rawEstimate = gazeEstimationService.estimateScreenPosition(
                features,
                calRef.current,
                p.sensitivity
              );
              const smoothed = gazeEstimationService.smoothPosition(
                smoothedGazeRef.current,
                { x: rawEstimate.x, y: rawEstimate.y },
                p.smoothingAlpha
              );
              smoothedGazeRef.current = smoothed;

              const blinkSnap = blinkDetectionService.update(features.avgEar, now, {
                earThreshold: p.blinkEarThreshold,
                longBlinkMinMs: p.longBlinkMinMs,
                doubleBlinkWindowMs: p.doubleBlinkWindowMs,
              });

              const reliable =
                detection.quality === 'good' || detection.quality === 'fair';

              // Pause dwell progression while eyes are closed so blinking doesn't abort dwell
              const dwell = blinkSnap.isEyeClosed
                ? {
                    hoveredTargetId: hoveredTargetRef.current,
                    hoveredLabel: null,
                    dwellProgress: 0,
                    activatedTargetId: null,
                    inCooldown: blinkSnap.inCooldown,
                  }
                : gazeInteractionService.updateDwell(
                    smoothed.x,
                    smoothed.y,
                    now,
                    p.dwellDurationMs,
                    reliable
                  );

              if (dwell.activatedTargetId) {
                activateTargetRef.current(dwell.activatedTargetId, 'gaze-dwell');
              }

              if (now - lastUiSyncTsRef.current >= 55) {
                lastUiSyncTsRef.current = now;
                const region = gazeEstimationService.classifyRegion(smoothed.x, smoothed.y);
                setFaceQuality(detection.quality);
                setFaceCount(detection.faceCount);
                setTrackingConfidence(Math.round(detection.confidence * 100));
                setAverageLuma(Math.round(detection.averageLuma));
                setGazeFeatures(features);
                setGazePoint(smoothed);
                setGazeRegion(region);
                setIsCalibratedGaze(rawEstimate.calibrated);
                setIsEyeClosed(blinkSnap.isEyeClosed);
                setHoveredTargetId(dwell.hoveredTargetId);
                if (dwell.hoveredLabel !== null) setHoveredTargetLabel(dwell.hoveredLabel);
                setDwellProgress(dwell.dwellProgress);
                setInCooldown(dwell.inCooldown);

                // Optional ML classifier inference
                let mlPred: { region: GazeRegion; confidence: number } | null = null;
                if (mlTrainingService.isTrained()) {
                  mlPred = mlTrainingService.predictRegion(features);
                  setMlPredictedRegion(mlPred);
                }

                setEarHistory((prev) => [
                  ...prev.slice(-79),
                  {
                    t: Math.round(now),
                    left: Number(features.leftEar.toFixed(3)),
                    right: Number(features.rightEar.toFixed(3)),
                    avg: Number(features.avgEar.toFixed(3)),
                  },
                ]);

                if (Math.random() < 0.15) {
                  setPredictionHistory((prev) => [
                    {
                      timestamp: Date.now(),
                      x: Number(smoothed.x.toFixed(3)),
                      y: Number(smoothed.y.toFixed(3)),
                      region,
                      mlRegion: mlPred?.region ?? null,
                      mlConfidence: mlPred?.confidence ?? null,
                      source: 'webcam',
                    },
                    ...prev.slice(0, 29),
                  ]);
                }
              }
            }
          }
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(runTrackingLoop);
  }, []);

  const refreshCameras = useCallback(async () => {
    const list = await cameraService.listCameras();
    setCameras(list);
  }, []);

  const startWebcamTracking = useCallback(async (): Promise<boolean> => {
    // Stop any previous stream or demo mode
    stopLoop();
    if (streamRef.current) {
      cameraService.stopCamera(streamRef.current);
      streamRef.current = null;
    }

    setTrackingError(null);
    setTrackingStatus('initializing');
    setModelLoading(true);

    const [camRes, loaded] = await Promise.all([
      cameraService.startCamera(prefsRef.current.preferredCameraId || undefined),
      faceLandmarkService.initialize(),
    ]);

    setModelLoading(false);
    setModelReady(loaded);

    if (!camRes.stream) {
      const errStatus: TrackingStatus =
        camRes.errorCode === 'permission-denied'
          ? 'permission-denied'
          : camRes.errorCode === 'no-camera'
          ? 'no-camera'
          : camRes.errorCode === 'camera-in-use'
          ? 'camera-in-use'
          : 'error';
      setTrackingStatus(errStatus);
      setTrackingError(camRes.errorMessage || 'Unable to start webcam.');
      setControlMode('off');
      return false;
    }

    if (!loaded) {
      cameraService.stopCamera(camRes.stream);
      setTrackingStatus('error');
      setTrackingError(
        faceLandmarkService.getError() ||
          'MediaPipe Face Landmarker model failed to load.'
      );
      setControlMode('off');
      return false;
    }

    // Create hidden persistent video element for continuous CV inference across routes
    if (!hiddenVideoRef.current) {
      const v = document.createElement('video');
      v.playsInline = true;
      v.muted = true;
      v.autoplay = true;
      hiddenVideoRef.current = v;
    }
    hiddenVideoRef.current.srcObject = camRes.stream;
    try {
      await hiddenVideoRef.current.play();
    } catch {
      // Autoplay handled
    }

    streamRef.current = camRes.stream;
    setVideoStream(camRes.stream);
    setControlMode('webcam-gaze');
    setTrackingStatus('active');
    await refreshCameras();

    loopRunningRef.current = true;
    rafIdRef.current = requestAnimationFrame(runTrackingLoop);

    speechService.speak('Eye gaze tracking started.', {
      enabled: prefsRef.current.voiceEnabled,
      volume: prefsRef.current.voiceVolume,
      rate: prefsRef.current.voiceRate,
    });
    return true;
  }, [refreshCameras, runTrackingLoop, stopLoop]);

  const pauseWebcamTracking = useCallback(() => {
    if (controlModeRef.current !== 'webcam-gaze') return;
    setTrackingStatus('paused');
    gazeInteractionService.reset();
    setHoveredTargetId(null);
    setDwellProgress(0);
    speechService.speak('Gaze control paused.', {
      enabled: prefsRef.current.voiceEnabled,
      volume: prefsRef.current.voiceVolume,
      rate: prefsRef.current.voiceRate,
    });
  }, []);

  const resumeWebcamTracking = useCallback(() => {
    if (controlModeRef.current !== 'webcam-gaze') return;
    setTrackingStatus('active');
    speechService.speak('Gaze control resumed.', {
      enabled: prefsRef.current.voiceEnabled,
      volume: prefsRef.current.voiceVolume,
      rate: prefsRef.current.voiceRate,
    });
  }, []);

  // Calibration & ML
  const saveCalibrationProfile = useCallback((profile: CalibrationProfile) => {
    setCalibrationProfile(profile);
    storageService.saveCalibration(profile);
  }, []);

  const resetCalibration = useCallback(() => {
    setCalibrationProfile(null);
    storageService.saveCalibration(null);
    mlTrainingService.disposeModel();
    setMlMetrics(mlTrainingService.getMetrics());
    setMlPredictedRegion(null);
    setIsCalibratedGaze(false);
  }, []);

  const trainMlClassifier = useCallback(async () => {
    const samples = calRef.current?.samples ?? [];
    const result = await mlTrainingService.trainRegionClassifier(samples, (m) => {
      setMlMetrics(m);
    });
    if (result.trained && calRef.current) {
      const updated: CalibrationProfile = {
        ...calRef.current,
        mlClassifierTrained: true,
        mlValidationAccuracy: result.valAccuracy,
      };
      setCalibrationProfile(updated);
      storageService.saveCalibration(updated);
    }
    return result;
  }, []);

  // Demo Simulation Mode (strictly isolated from webcam telemetry)
  const enableDemoMode = useCallback(() => {
    stopWebcamTracking();
    setControlMode('demo-simulation');
    const initial = { x: 0.5, y: 0.5 };
    setGazePoint(initial);
    setGazeRegion('CENTER');
    setHoveredTargetId(null);
    setDwellProgress(0);
    speechService.speak('Demo gaze simulation enabled.', {
      enabled: prefsRef.current.voiceEnabled,
      volume: prefsRef.current.voiceVolume,
      rate: prefsRef.current.voiceRate,
    });
  }, [stopWebcamTracking]);

  const disableDemoMode = useCallback(() => {
    gazeInteractionService.reset();
    setControlMode((prev) => (prev === 'demo-simulation' ? 'off' : prev));
    setGazePoint(null);
    setGazeRegion(null);
    setHoveredTargetId(null);
    setDwellProgress(0);
  }, []);

  const setDemoGazePosition = useCallback(
    (x: number, y: number, source: 'demo-cursor' | 'demo-keyboard' = 'demo-cursor') => {
      if (controlModeRef.current !== 'demo-simulation') return;
      demoMethodRef.current = source;
      const clamped = {
        x: Math.max(0.02, Math.min(0.98, x)),
        y: Math.max(0.02, Math.min(0.98, y)),
      };
      const region = gazeEstimationService.classifyRegion(clamped.x, clamped.y);
      setGazePoint(clamped);
      setGazeRegion(region);
    },
    []
  );

  // Demo dwell tick loop (only active in demo-simulation mode)
  useEffect(() => {
    if (controlMode !== 'demo-simulation') return;
    const interval = window.setInterval(() => {
      setGazePoint((pt) => {
        if (!pt) return pt;
        const dwell = gazeInteractionService.updateDwell(
          pt.x,
          pt.y,
          performance.now(),
          prefsRef.current.dwellDurationMs,
          true
        );
        setHoveredTargetId(dwell.hoveredTargetId);
        if (dwell.hoveredLabel !== null) setHoveredTargetLabel(dwell.hoveredLabel);
        setDwellProgress(dwell.dwellProgress);
        setInCooldown(dwell.inCooldown);
        if (dwell.activatedTargetId) {
          activateTargetRef.current(dwell.activatedTargetId, demoMethodRef.current);
        }
        return pt;
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [controlMode]);

  const triggerDemoBlink = useCallback(
    (type: 'single' | 'double' | 'long') => {
      const evt: BlinkEvent = {
        type,
        durationMs: type === 'long' ? 750 : 180,
        timestamp: Date.now(),
      };
      setLastBlinkEvent(evt);
      setStats((prev) => {
        const next = { ...prev, totalBlinkGestures: prev.totalBlinkGestures + 1 };
        storageService.saveStats(next);
        return next;
      });

      if (type === 'double' && hoveredTargetRef.current) {
        gazeInteractionService.triggerCooldown();
        activateTargetRef.current(hoveredTargetRef.current, 'double-blink');
      } else if (type === 'long') {
        if (pendingDoorUnlock) {
          cancelPendingDoorUnlock();
        } else {
          gazeInteractionService.reset();
          setHoveredTargetId(null);
          setDwellProgress(0);
        }
      }
    },
    [cancelPendingDoorUnlock, pendingDoorUnlock]
  );

  const exportAllData = useCallback(() => {
    const json = storageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gazehome-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup on page unload
  useEffect(() => {
    const handleUnload = () => {
      stopWebcamTracking();
      mlTrainingService.disposeModel();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [stopWebcamTracking]);

  const value = useMemo<GazeHomeContextValue>(
    () => ({
      preferences,
      updatePreferences,
      trackingStatus,
      trackingError,
      modelReady,
      modelLoading,
      controlMode,
      cameras,
      refreshCameras,
      startWebcamTracking,
      pauseWebcamTracking,
      resumeWebcamTracking,
      stopWebcamTracking,
      videoStream,
      faceQuality,
      faceCount,
      trackingConfidence,
      averageLuma,
      gazeFeatures,
      latestLandmarksRef,
      latestFeaturesRef,
      gazePoint,
      gazeRegion,
      isCalibratedGaze,
      earHistory,
      lastBlinkEvent,
      isEyeClosed,
      hoveredTargetId,
      hoveredTargetLabel,
      dwellProgress,
      inCooldown,
      calibrationProfile,
      saveCalibrationProfile,
      resetCalibration,
      mlMetrics,
      trainMlClassifier,
      predictionHistory,
      mlPredictedRegion,
      enableDemoMode,
      disableDemoMode,
      setDemoGazePosition,
      triggerDemoBlink,
      activeRoom,
      setActiveRoom,
      appliances,
      toggleAppliance,
      updateAppliance,
      applyRoomPreset,
      pendingDoorUnlock,
      confirmPendingDoorUnlock,
      cancelPendingDoorUnlock,
      history,
      clearHistory,
      stats,
      sessionDurationSec,
      exportAllData,
    }),
    [
      preferences,
      updatePreferences,
      trackingStatus,
      trackingError,
      modelReady,
      modelLoading,
      controlMode,
      cameras,
      refreshCameras,
      startWebcamTracking,
      pauseWebcamTracking,
      resumeWebcamTracking,
      stopWebcamTracking,
      videoStream,
      faceQuality,
      faceCount,
      trackingConfidence,
      averageLuma,
      gazeFeatures,
      gazePoint,
      gazeRegion,
      isCalibratedGaze,
      earHistory,
      lastBlinkEvent,
      isEyeClosed,
      hoveredTargetId,
      hoveredTargetLabel,
      dwellProgress,
      inCooldown,
      calibrationProfile,
      saveCalibrationProfile,
      resetCalibration,
      mlMetrics,
      trainMlClassifier,
      predictionHistory,
      mlPredictedRegion,
      enableDemoMode,
      disableDemoMode,
      setDemoGazePosition,
      triggerDemoBlink,
      activeRoom,
      setActiveRoom,
      appliances,
      toggleAppliance,
      updateAppliance,
      applyRoomPreset,
      pendingDoorUnlock,
      confirmPendingDoorUnlock,
      cancelPendingDoorUnlock,
      history,
      clearHistory,
      stats,
      sessionDurationSec,
      exportAllData,
    ]
  );

  return <GazeHomeContext.Provider value={value}>{children}</GazeHomeContext.Provider>;
};

export function useGazeHome(): GazeHomeContextValue {
  const ctx = useContext(GazeHomeContext);
  if (!ctx) throw new Error('useGazeHome must be used inside GazeHomeProvider');
  return ctx;
}
