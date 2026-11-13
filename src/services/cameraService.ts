export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export type CameraErrorCode =
  | 'unsupported'
  | 'permission-denied'
  | 'no-camera'
  | 'camera-in-use'
  | 'unknown';

export interface CameraStartResult {
  stream: MediaStream | null;
  errorCode?: CameraErrorCode;
  errorMessage?: string;
}

export const cameraService = {
  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  },

  async listCameras(): Promise<CameraDeviceInfo[]> {
    if (!this.isSupported() || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Webcam ${idx + 1}`,
        }));
    } catch {
      return [];
    }
  },

  async startCamera(preferredDeviceId?: string): Promise<CameraStartResult> {
    if (!this.isSupported()) {
      return {
        stream: null,
        errorCode: 'unsupported',
        errorMessage: 'Browser webcam API (getUserMedia) is not supported in this browser or non-HTTPS context.',
      };
    }

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30, max: 30 },
    };

    if (preferredDeviceId) {
      videoConstraints.deviceId = { exact: preferredDeviceId };
    } else {
      videoConstraints.facingMode = 'user';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      return { stream };
    } catch (err: unknown) {
      // Fallback if exact deviceId failed
      if (preferredDeviceId) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false,
          });
          return { stream: fallbackStream };
        } catch (fallbackErr) {
          return this.mapError(fallbackErr);
        }
      }
      return this.mapError(err);
    }
  },

  mapError(err: unknown): CameraStartResult {
    const name = err instanceof DOMException ? err.name : '';
    const message = err instanceof Error ? err.message : 'Unable to access webcam.';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        stream: null,
        errorCode: 'permission-denied',
        errorMessage:
          'Webcam permission was denied. Allow camera access in your browser settings or switch to Demo Mode.',
      };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        stream: null,
        errorCode: 'no-camera',
        errorMessage: 'No webcam device was detected on this system. You can use Demo Mode instead.',
      };
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return {
        stream: null,
        errorCode: 'camera-in-use',
        errorMessage:
          'Your webcam appears to be in use by another application. Close the other app and retry.',
      };
    }
    return {
      stream: null,
      errorCode: 'unknown',
      errorMessage: message,
    };
  },

  stopCamera(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore track stop errors
      }
    });
  },
};
