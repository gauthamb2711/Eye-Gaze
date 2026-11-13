import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { CalibrationProfile, GazeFeatures, GazeRegion } from '../types';

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Computes Eye Aspect Ratio (EAR) using 6 standard eye perimeter landmarks.
 * p1: outer corner, p2/p3: upper lid, p4: inner corner, p5/p6: lower lid
 */
function computeEar(
  p1: NormalizedLandmark,
  p2: NormalizedLandmark,
  p3: NormalizedLandmark,
  p4: NormalizedLandmark,
  p5: NormalizedLandmark,
  p6: NormalizedLandmark
): number {
  const horiz = dist(p1, p4);
  if (horiz < 1e-5) return 0;
  const vert1 = dist(p2, p6);
  const vert2 = dist(p3, p5);
  return (vert1 + vert2) / (2.0 * horiz);
}

export const gazeEstimationService = {
  /**
   * Extracts real iris offsets, head pose estimates, and eye openness (EAR)
   * from MediaPipe 478-point Face Landmarker output.
   */
  extractFeatures(landmarks: NormalizedLandmark[]): GazeFeatures | null {
    if (!landmarks || landmarks.length < 468) return null;

    const irisDetected = landmarks.length >= 478;

    // Left eye corners & eyelids (MediaPipe canonical indices)
    const leftOuter = landmarks[33];
    const leftInner = landmarks[133];
    const leftUpper1 = landmarks[160];
    const leftUpper2 = landmarks[158];
    const leftLower1 = landmarks[144];
    const leftLower2 = landmarks[153];
    const leftUpperMid = landmarks[159];
    const leftLowerMid = landmarks[145];

    // Right eye corners & eyelids
    const rightInner = landmarks[362];
    const rightOuter = landmarks[263];
    const rightUpper1 = landmarks[385];
    const rightUpper2 = landmarks[387];
    const rightLower1 = landmarks[380];
    const rightLower2 = landmarks[373];
    const rightUpperMid = landmarks[386];
    const rightLowerMid = landmarks[374];

    const leftEar = computeEar(
      leftOuter,
      leftUpper1,
      leftUpper2,
      leftInner,
      leftLower2,
      leftLower1
    );
    const rightEar = computeEar(
      rightInner,
      rightUpper1,
      rightUpper2,
      rightOuter,
      rightLower2,
      rightLower1
    );
    const avgEar = (leftEar + rightEar) / 2;

    // Iris centers (468..472 = left iris, 473..477 = right iris)
    let leftIrisCenter: NormalizedLandmark;
    let rightIrisCenter: NormalizedLandmark;

    if (irisDetected) {
      leftIrisCenter = landmarks[468];
      rightIrisCenter = landmarks[473];
    } else {
      // Fallback to eye center if iris landmarks are absent
      leftIrisCenter = {
        x: (leftOuter.x + leftInner.x) / 2,
        y: (leftUpperMid.y + leftLowerMid.y) / 2,
        z: 0,
        visibility: 1,
      };
      rightIrisCenter = {
        x: (rightInner.x + rightOuter.x) / 2,
        y: (rightUpperMid.y + rightLowerMid.y) / 2,
        z: 0,
        visibility: 1,
      };
    }

    // Compute normalized iris position inside each eye socket
    const leftEyeWidth = Math.max(1e-4, Math.abs(leftInner.x - leftOuter.x));
    const leftEyeCenterX = (leftOuter.x + leftInner.x) / 2;
    const leftEyeCenterY = (leftUpperMid.y + leftLowerMid.y) / 2;
    const leftEyeHeight = Math.max(1e-4, Math.abs(leftLowerMid.y - leftUpperMid.y));

    const rightEyeWidth = Math.max(1e-4, Math.abs(rightOuter.x - rightInner.x));
    const rightEyeCenterX = (rightInner.x + rightOuter.x) / 2;
    const rightEyeCenterY = (rightUpperMid.y + rightLowerMid.y) / 2;
    const rightEyeHeight = Math.max(1e-4, Math.abs(rightLowerMid.y - rightUpperMid.y));

    const leftIrisRelX = (leftIrisCenter.x - leftEyeCenterX) / leftEyeWidth;
    const leftIrisRelY = (leftIrisCenter.y - leftEyeCenterY) / Math.max(leftEyeHeight, leftEyeWidth * 0.28);

    const rightIrisRelX = (rightIrisCenter.x - rightEyeCenterX) / rightEyeWidth;
    const rightIrisRelY = (rightIrisCenter.y - rightEyeCenterY) / Math.max(rightEyeHeight, rightEyeWidth * 0.28);

    // Mirrored webcam horizontal axis: moving eyes to user's right decreases raw x in unmirrored camera frame
    const irisOffsetX = -((leftIrisRelX + rightIrisRelX) / 2);
    const irisOffsetY = (leftIrisRelY + rightIrisRelY) / 2;

    // Head pose approximation from face geometry
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];

    const faceWidth = Math.max(1e-4, Math.abs(rightCheek.x - leftCheek.x));
    const faceHeight = Math.max(1e-4, Math.abs(chin.y - forehead.y));
    const faceMidX = (leftCheek.x + rightCheek.x) / 2;
    const eyeLineY = (leftEyeCenterY + rightEyeCenterY) / 2;

    const headYaw = -((noseTip.x - faceMidX) / faceWidth);
    const headPitch = (noseTip.y - eyeLineY) / faceHeight - 0.18;

    return {
      irisOffsetX,
      irisOffsetY,
      headYaw,
      headPitch,
      leftEar,
      rightEar,
      avgEar,
      faceCenterX: 1 - faceMidX,
      faceCenterY: eyeLineY,
      faceScale: faceWidth,
      irisDetected,
    };
  },

  buildFeatureVector(f: GazeFeatures): number[] {
    return [
      1,
      f.irisOffsetX,
      f.irisOffsetY,
      f.headYaw,
      f.headPitch,
      f.irisOffsetX * f.irisOffsetX,
      f.irisOffsetY * f.irisOffsetY,
      f.irisOffsetX * f.irisOffsetY,
    ];
  },

  buildMlVector(f: GazeFeatures): number[] {
    return [
      f.irisOffsetX,
      f.irisOffsetY,
      f.headYaw,
      f.headPitch,
      f.faceCenterX - 0.5,
      f.faceCenterY - 0.5,
    ];
  },

  estimateScreenPosition(
    features: GazeFeatures,
    calibration: CalibrationProfile | null,
    sensitivity: number
  ): { x: number; y: number; calibrated: boolean } {
    if (calibration && calibration.weightsX.length === 8 && calibration.weightsY.length === 8) {
      const vec = this.buildFeatureVector(features);
      let rawX = 0;
      let rawY = 0;
      for (let i = 0; i < 8; i++) {
        rawX += vec[i] * calibration.weightsX[i];
        rawY += vec[i] * calibration.weightsY[i];
      }
      // Apply user sensitivity around screen center (0.5, 0.5)
      const adjX = 0.5 + (rawX - 0.5) * sensitivity;
      const adjY = 0.5 + (rawY - 0.5) * sensitivity;
      return {
        x: Math.max(0.01, Math.min(0.99, adjX)),
        y: Math.max(0.01, Math.min(0.99, adjY)),
        calibrated: true,
      };
    }

    // Uncalibrated geometric baseline (clearly marked calibrated: false)
    const baselineX = 0.5 + (features.irisOffsetX * 3.2 + features.headYaw * 1.4) * sensitivity;
    const baselineY = 0.5 + (features.irisOffsetY * 2.6 + features.headPitch * 1.5) * sensitivity;

    return {
      x: Math.max(0.02, Math.min(0.98, baselineX)),
      y: Math.max(0.02, Math.min(0.98, baselineY)),
      calibrated: false,
    };
  },

  smoothPosition(
    prev: { x: number; y: number } | null,
    next: { x: number; y: number },
    alpha: number
  ): { x: number; y: number } {
    if (!prev) return next;
    const delta = Math.hypot(next.x - prev.x, next.y - prev.y);
    // Adaptive smoothing: faster response on intentional saccades, stronger damping on micro-jitter
    const adaptiveAlpha = delta > 0.14 ? Math.min(0.65, alpha * 1.8) : alpha;
    return {
      x: prev.x + (next.x - prev.x) * adaptiveAlpha,
      y: prev.y + (next.y - prev.y) * adaptiveAlpha,
    };
  },

  classifyRegion(x: number, y: number): GazeRegion {
    const col = x < 0.34 ? 'LEFT' : x > 0.66 ? 'RIGHT' : 'CENTER';
    const row = y < 0.34 ? 'TOP' : y > 0.66 ? 'BOTTOM' : 'CENTER';
    if (row === 'CENTER' && col === 'CENTER') return 'CENTER';
    return `${row} ${col}` as GazeRegion;
  },
};
