import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FaceDetectionQuality } from '../types';

export interface FaceDetectionFrameResult {
  faceCount: number;
  landmarks: NormalizedLandmark[] | null;
  quality: FaceDetectionQuality;
  confidence: number;
  averageLuma: number;
  timestamp: number;
}

const WASM_ASSET_PATH = '/mediapipe/wasm';
const MODEL_ASSET_PATH = '/mediapipe/face_landmarker.task';

class FaceLandmarkService {
  private landmarker: FaceLandmarker | null = null;
  private initializingPromise: Promise<void> | null = null;
  private loadError: string | null = null;
  private lumaCanvas: HTMLCanvasElement | null = null;
  private lumaCtx: CanvasRenderingContext2D | null = null;
  private frameCounter = 0;
  private lastLuma = 128;

  isReady(): boolean {
    return this.landmarker !== null;
  }

  getError(): string | null {
    return this.loadError;
  }

  async initialize(): Promise<boolean> {
    if (this.landmarker) return true;
    if (this.initializingPromise) {
      await this.initializingPromise;
      return this.landmarker !== null;
    }

    this.loadError = null;
    this.initializingPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);
        try {
          this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_ASSET_PATH,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 2,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          });
        } catch {
          // Fallback to CPU delegate if WebGL/GPU delegate is unavailable
          this.landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_ASSET_PATH,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 2,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.loadError = `Failed to load MediaPipe Face Landmarker assets (${msg}).`;
        this.landmarker = null;
      } finally {
        this.initializingPromise = null;
      }
    })();

    await this.initializingPromise;
    return this.landmarker !== null;
  }

  private sampleFrameLuma(video: HTMLVideoElement): number {
    this.frameCounter++;
    if (this.frameCounter % 20 !== 1) return this.lastLuma;

    try {
      if (!this.lumaCanvas) {
        this.lumaCanvas = document.createElement('canvas');
        this.lumaCanvas.width = 48;
        this.lumaCanvas.height = 36;
        this.lumaCtx = this.lumaCanvas.getContext('2d', { willReadFrequently: true });
      }
      if (!this.lumaCtx) return this.lastLuma;

      this.lumaCtx.drawImage(video, 0, 0, 48, 36);
      const data = this.lumaCtx.getImageData(0, 0, 48, 36).data;
      let sum = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      this.lastLuma = sum / count;
    } catch {
      // Ignore canvas read errors
    }
    return this.lastLuma;
  }

  detectFrame(video: HTMLVideoElement, timestampMs: number): FaceDetectionFrameResult | null {
    if (!this.landmarker || video.readyState < 2 || video.videoWidth === 0) {
      return null;
    }

    const luma = this.sampleFrameLuma(video);
    const result = this.landmarker.detectForVideo(video, timestampMs);
    const faces = result.faceLandmarks ?? [];

    if (faces.length === 0) {
      return {
        faceCount: 0,
        landmarks: null,
        quality: luma < 42 ? 'low-light' : 'lost',
        confidence: 0,
        averageLuma: luma,
        timestamp: timestampMs,
      };
    }

    if (faces.length > 1) {
      return {
        faceCount: faces.length,
        landmarks: faces[0],
        quality: 'multiple-faces',
        confidence: 0.45,
        averageLuma: luma,
        timestamp: timestampMs,
      };
    }

    const landmarks = faces[0];
    // Evaluate face framing & iris presence
    const hasIrises = landmarks.length >= 478;
    const nose = landmarks[1];
    const inBounds =
      nose &&
      nose.x > 0.12 &&
      nose.x < 0.88 &&
      nose.y > 0.12 &&
      nose.y < 0.88;

    let quality: FaceDetectionQuality = 'good';
    let confidence = hasIrises ? 0.94 : 0.72;

    if (luma < 42) {
      quality = 'low-light';
      confidence = Math.min(confidence, 0.55);
    } else if (!inBounds || !hasIrises) {
      quality = 'fair';
      confidence = Math.min(confidence, 0.7);
    }

    return {
      faceCount: 1,
      landmarks,
      quality,
      confidence,
      averageLuma: luma,
      timestamp: timestampMs,
    };
  }

  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignore close errors
      }
      this.landmarker = null;
    }
  }
}

export const faceLandmarkService = new FaceLandmarkService();
