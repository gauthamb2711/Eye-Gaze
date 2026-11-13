import { CalibrationProfile, CalibrationSample, GazeRegion } from '../types';
import { gazeEstimationService } from './gazeEstimationService';

export interface CalibrationTargetPoint {
  index: number;
  x: number; // 0..1 normalized screen coordinate
  y: number;
  region: GazeRegion;
  label: string;
}

export function getCalibrationPoints(count: 5 | 9): CalibrationTargetPoint[] {
  if (count === 5) {
    return [
      { index: 0, x: 0.5, y: 0.5, region: 'CENTER', label: 'Center' },
      { index: 1, x: 0.14, y: 0.16, region: 'TOP LEFT', label: 'Top Left' },
      { index: 2, x: 0.86, y: 0.16, region: 'TOP RIGHT', label: 'Top Right' },
      { index: 3, x: 0.14, y: 0.84, region: 'BOTTOM LEFT', label: 'Bottom Left' },
      { index: 4, x: 0.86, y: 0.84, region: 'BOTTOM RIGHT', label: 'Bottom Right' },
    ];
  }
  return [
    { index: 0, x: 0.14, y: 0.16, region: 'TOP LEFT', label: 'Top Left' },
    { index: 1, x: 0.5, y: 0.16, region: 'TOP CENTER', label: 'Top Center' },
    { index: 2, x: 0.86, y: 0.16, region: 'TOP RIGHT', label: 'Top Right' },
    { index: 3, x: 0.14, y: 0.5, region: 'CENTER LEFT', label: 'Center Left' },
    { index: 4, x: 0.5, y: 0.5, region: 'CENTER', label: 'Center' },
    { index: 5, x: 0.86, y: 0.5, region: 'CENTER RIGHT', label: 'Center Right' },
    { index: 6, x: 0.14, y: 0.84, region: 'BOTTOM LEFT', label: 'Bottom Left' },
    { index: 7, x: 0.5, y: 0.84, region: 'BOTTOM CENTER', label: 'Bottom Center' },
    { index: 8, x: 0.86, y: 0.84, region: 'BOTTOM RIGHT', label: 'Bottom Right' },
  ];
}

/**
 * Solves (X^T X + lambda * I) * w = X^T y via Gaussian elimination with partial pivoting.
 */
function solveRidgeRegression(features: number[][], targets: number[], lambda = 0.04): number[] | null {
  const n = features.length;
  if (n === 0) return null;
  const d = features[0].length;

  const A: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  const b: number[] = Array(d).fill(0);

  for (let i = 0; i < n; i++) {
    const row = features[i];
    const y = targets[i];
    for (let j = 0; j < d; j++) {
      b[j] += row[j] * y;
      for (let k = 0; k < d; k++) {
        A[j][k] += row[j] * row[k];
      }
    }
  }

  // Regularize all non-bias terms
  for (let j = 1; j < d; j++) {
    A[j][j] += lambda;
  }
  A[0][0] += 1e-6;

  // Gaussian elimination with partial pivoting
  const aug = A.map((row, idx) => [...row, b[idx]]);
  for (let col = 0; col < d; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let r = col + 1; r < d; r++) {
      const val = Math.abs(aug[r][col]);
      if (val > maxVal) {
        maxVal = val;
        pivotRow = r;
      }
    }
    if (maxVal < 1e-10) return null;
    if (pivotRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = tmp;
    }

    const pivot = aug[col][col];
    for (let c = col; c <= d; c++) {
      aug[col][c] /= pivot;
    }

    for (let r = 0; r < d; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let c = col; c <= d; c++) {
        aug[r][c] -= factor * aug[col][c];
      }
    }
  }

  return aug.map((row) => row[d]);
}

function predict(vec: number[], weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += vec[i] * weights[i];
  }
  return sum;
}

export interface CalibrationTrainResult {
  success: boolean;
  profile?: CalibrationProfile;
  error?: string;
}

export const calibrationService = {
  trainCalibrationModel(
    samples: CalibrationSample[],
    pointCount: 5 | 9
  ): CalibrationTrainResult {
    if (samples.length < pointCount * 4) {
      return {
        success: false,
        error: `Insufficient calibration samples (${samples.length}). Look steadily at each point until collection completes.`,
      };
    }

    // Verify gaze features actually varied across calibration targets
    const irisXs = samples.map((s) => s.rawGaze.irisOffsetX);
    const irisYs = samples.map((s) => s.rawGaze.irisOffsetY);
    const spreadX = Math.max(...irisXs) - Math.min(...irisXs);
    const spreadY = Math.max(...irisYs) - Math.min(...irisYs);

    if (spreadX < 0.008 && spreadY < 0.008) {
      return {
        success: false,
        error:
          'Eye movement variance was too small to build a reliable mapping. Ensure your face is well-lit and move your eyes to each target.',
      };
    }

    const X = samples.map((s) => s.features);
    const yX = samples.map((s) => s.targetX);
    const yY = samples.map((s) => s.targetY);

    // 5-fold cross-validation for genuine held-out validation error
    const folds = 5;
    let sqErrSum = 0;
    let valCount = 0;
    const meanX = yX.reduce((a, b) => a + b, 0) / yX.length;
    const meanY = yY.reduce((a, b) => a + b, 0) / yY.length;
    let totalVarSum = 0;

    for (let f = 0; f < folds; f++) {
      const trainX: number[][] = [];
      const trainYX: number[] = [];
      const trainYY: number[] = [];
      const valX: number[][] = [];
      const valYX: number[] = [];
      const valYY: number[] = [];

      samples.forEach((_, idx) => {
        if (idx % folds === f) {
          valX.push(X[idx]);
          valYX.push(yX[idx]);
          valYY.push(yY[idx]);
        } else {
          trainX.push(X[idx]);
          trainYX.push(yX[idx]);
          trainYY.push(yY[idx]);
        }
      });

      const foldWX = solveRidgeRegression(trainX, trainYX, 0.05);
      const foldWY = solveRidgeRegression(trainX, trainYY, 0.05);
      if (!foldWX || !foldWY) {
        return {
          success: false,
          error: 'Calibration matrix was singular. Please keep your head steady and recalibrate.',
        };
      }

      for (let i = 0; i < valX.length; i++) {
        const px = Math.max(0, Math.min(1, predict(valX[i], foldWX)));
        const py = Math.max(0, Math.min(1, predict(valX[i], foldWY)));
        const ex = px - valYX[i];
        const ey = py - valYY[i];
        sqErrSum += ex * ex + ey * ey;
        totalVarSum += (valYX[i] - meanX) ** 2 + (valYY[i] - meanY) ** 2;
        valCount++;
      }
    }

    // Fit final model on all collected samples
    const weightsX = solveRidgeRegression(X, yX, 0.05);
    const weightsY = solveRidgeRegression(X, yY, 0.05);
    if (!weightsX || !weightsY) {
      return {
        success: false,
        error: 'Unable to solve calibration regression weights.',
      };
    }

    const rmseNorm = Math.sqrt(sqErrSum / Math.max(1, valCount));
    const r2Score = totalVarSum > 0 ? Math.max(0, 1 - sqErrSum / totalVarSum) : 0;
    const referenceScreenDiag = typeof window !== 'undefined' ? Math.hypot(window.innerWidth, window.innerHeight) : 1600;
    const validationErrorPx = Math.round(rmseNorm * referenceScreenDiag * 0.65);

    let qualityLabel: CalibrationProfile['qualityLabel'] = 'Fair';
    if (rmseNorm <= 0.11 && r2Score >= 0.65) qualityLabel = 'Excellent';
    else if (rmseNorm <= 0.18 && r2Score >= 0.4) qualityLabel = 'Good';
    else if (rmseNorm > 0.28) qualityLabel = 'Needs Recalibration';

    const profile: CalibrationProfile = {
      id: `cal_${Date.now()}`,
      createdAt: Date.now(),
      pointCount,
      sampleCount: samples.length,
      weightsX,
      weightsY,
      validationErrorNorm: Number(rmseNorm.toFixed(4)),
      validationErrorPx,
      r2Score: Number(r2Score.toFixed(3)),
      qualityLabel,
      samples: samples.slice(0, 270),
      mlClassifierTrained: false,
      mlValidationAccuracy: null,
    };

    return { success: true, profile };
  },

  createSample(
    point: CalibrationTargetPoint,
    rawGaze: CalibrationSample['rawGaze']
  ): CalibrationSample {
    return {
      pointIndex: point.index,
      targetX: point.x,
      targetY: point.y,
      region: point.region,
      features: gazeEstimationService.buildFeatureVector(rawGaze),
      rawGaze,
      timestamp: Date.now(),
    };
  },
};
