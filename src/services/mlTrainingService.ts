import * as tf from '@tensorflow/tfjs';
import { CalibrationSample, GazeFeatures, GazeRegion, MlTrainingMetrics } from '../types';
import { gazeEstimationService } from './gazeEstimationService';

export const GAZE_REGIONS: GazeRegion[] = [
  'TOP LEFT',
  'TOP CENTER',
  'TOP RIGHT',
  'CENTER LEFT',
  'CENTER',
  'CENTER RIGHT',
  'BOTTOM LEFT',
  'BOTTOM CENTER',
  'BOTTOM RIGHT',
];

class MlTrainingService {
  private classifierModel: tf.LayersModel | null = null;
  private featureMean: number[] | null = null;
  private featureStd: number[] | null = null;
  private metrics: MlTrainingMetrics = {
    trained: false,
    trainingInProgress: false,
    sampleCount: 0,
    trainCount: 0,
    valCount: 0,
    finalLoss: null,
    valAccuracy: null,
    lossHistory: [],
    trainedAt: null,
    error: null,
  };

  getMetrics(): MlTrainingMetrics {
    return { ...this.metrics };
  }

  isTrained(): boolean {
    return this.classifierModel !== null && this.metrics.trained;
  }

  disposeModel(): void {
    if (this.classifierModel) {
      this.classifierModel.dispose();
      this.classifierModel = null;
    }
    this.featureMean = null;
    this.featureStd = null;
    this.metrics = {
      trained: false,
      trainingInProgress: false,
      sampleCount: 0,
      trainCount: 0,
      valCount: 0,
      finalLoss: null,
      valAccuracy: null,
      lossHistory: [],
      trainedAt: null,
      error: null,
    };
  }

  async trainRegionClassifier(
    samples: CalibrationSample[],
    onProgress?: (metrics: MlTrainingMetrics) => void
  ): Promise<MlTrainingMetrics> {
    if (!samples || samples.length < 18) {
      const errMetrics: MlTrainingMetrics = {
        ...this.metrics,
        trained: false,
        trainingInProgress: false,
        sampleCount: samples?.length ?? 0,
        error: 'At least 18 genuine calibration samples are required to train the TensorFlow.js 9-region classifier. Complete Eye Calibration first.',
      };
      this.metrics = errMetrics;
      onProgress?.(errMetrics);
      return errMetrics;
    }

    if (this.classifierModel) {
      this.classifierModel.dispose();
      this.classifierModel = null;
    }

    // Shuffle samples deterministically-randomly for real train/val split
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    const rawVectors = shuffled.map((s) => gazeEstimationService.buildMlVector(s.rawGaze));
    const labels = shuffled.map((s) => Math.max(0, GAZE_REGIONS.indexOf(s.region)));

    const numFeatures = rawVectors[0].length;
    const mean = Array(numFeatures).fill(0);
    const std = Array(numFeatures).fill(0);

    for (const vec of rawVectors) {
      for (let j = 0; j < numFeatures; j++) mean[j] += vec[j];
    }
    for (let j = 0; j < numFeatures; j++) mean[j] /= rawVectors.length;

    for (const vec of rawVectors) {
      for (let j = 0; j < numFeatures; j++) std[j] += (vec[j] - mean[j]) ** 2;
    }
    for (let j = 0; j < numFeatures; j++) {
      std[j] = Math.sqrt(std[j] / rawVectors.length);
      if (std[j] < 1e-5) std[j] = 1;
    }

    this.featureMean = mean;
    this.featureStd = std;

    const normVectors = rawVectors.map((vec) =>
      vec.map((v, j) => (v - mean[j]) / std[j])
    );

    const splitIdx = Math.max(10, Math.floor(normVectors.length * 0.8));
    const trainXArr = normVectors.slice(0, splitIdx);
    const trainYArr = labels.slice(0, splitIdx);
    const valXArr = normVectors.slice(splitIdx);
    const valYArr = labels.slice(splitIdx);

    this.metrics = {
      trained: false,
      trainingInProgress: true,
      sampleCount: samples.length,
      trainCount: trainXArr.length,
      valCount: valXArr.length,
      finalLoss: null,
      valAccuracy: null,
      lossHistory: [],
      trainedAt: null,
      error: null,
    };
    onProgress?.({ ...this.metrics });

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [numFeatures],
        units: 24,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.005 }),
      })
    );
    model.add(tf.layers.dropout({ rate: 0.15 }));
    model.add(
      tf.layers.dense({
        units: 16,
        activation: 'relu',
      })
    );
    model.add(
      tf.layers.dense({
        units: GAZE_REGIONS.length,
        activation: 'softmax',
      })
    );

    model.compile({
      optimizer: tf.train.adam(0.025),
      loss: 'sparseCategoricalCrossentropy',
      metrics: ['accuracy'],
    });

    const xTrain = tf.tensor2d(trainXArr);
    const yTrain = tf.tensor1d(trainYArr, 'float32');
    const hasVal = valXArr.length >= 3;
    const xVal = hasVal ? tf.tensor2d(valXArr) : null;
    const yVal = hasVal ? tf.tensor1d(valYArr, 'float32') : null;

    const lossHistory: { epoch: number; loss: number; valLoss: number }[] = [];

    try {
      await model.fit(xTrain, yTrain, {
        epochs: 40,
        batchSize: Math.min(16, trainXArr.length),
        shuffle: true,
        validationData: xVal && yVal ? [xVal, yVal] : undefined,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const loss = Number((logs?.loss ?? 0).toFixed(4));
            const valLoss = Number((logs?.val_loss ?? logs?.loss ?? 0).toFixed(4));
            lossHistory.push({ epoch: epoch + 1, loss, valLoss });
          },
        },
      });

      // Evaluate held-out validation accuracy
      let valAccuracy = 0;
      if (xVal && yVal) {
        const evalRes = model.evaluate(xVal, yVal) as tf.Scalar[];
        const accVal = (await evalRes[1].data())[0];
        valAccuracy = Number((accVal * 100).toFixed(1));
        evalRes.forEach((t) => t.dispose());
      } else {
        const evalRes = model.evaluate(xTrain, yTrain) as tf.Scalar[];
        const accVal = (await evalRes[1].data())[0];
        valAccuracy = Number((accVal * 100).toFixed(1));
        evalRes.forEach((t) => t.dispose());
      }

      this.classifierModel = model;
      this.metrics = {
        trained: true,
        trainingInProgress: false,
        sampleCount: samples.length,
        trainCount: trainXArr.length,
        valCount: valXArr.length,
        finalLoss: lossHistory[lossHistory.length - 1]?.loss ?? null,
        valAccuracy,
        lossHistory,
        trainedAt: Date.now(),
        error: null,
      };
      onProgress?.({ ...this.metrics });
      return { ...this.metrics };
    } catch (err: unknown) {
      model.dispose();
      const message = err instanceof Error ? err.message : 'TensorFlow.js training error.';
      this.metrics = {
        ...this.metrics,
        trained: false,
        trainingInProgress: false,
        error: message,
      };
      onProgress?.({ ...this.metrics });
      return { ...this.metrics };
    } finally {
      xTrain.dispose();
      yTrain.dispose();
      xVal?.dispose();
      yVal?.dispose();
    }
  }

  predictRegion(features: GazeFeatures): { region: GazeRegion; confidence: number } | null {
    if (!this.classifierModel || !this.featureMean || !this.featureStd) {
      return null;
    }

    const raw = gazeEstimationService.buildMlVector(features);
    const norm = raw.map((v, j) => (v - this.featureMean![j]) / this.featureStd![j]);

    const probs = tf.tidy(() => {
      const input = tf.tensor2d([norm]);
      const output = this.classifierModel!.predict(input) as tf.Tensor;
      return Array.from(output.dataSync());
    });

    let bestIdx = 0;
    let bestProb = probs[0] ?? 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > bestProb) {
        bestProb = probs[i];
        bestIdx = i;
      }
    }

    return {
      region: GAZE_REGIONS[bestIdx] ?? 'CENTER',
      confidence: Number((bestProb * 100).toFixed(1)),
    };
  }
}

export const mlTrainingService = new MlTrainingService();
