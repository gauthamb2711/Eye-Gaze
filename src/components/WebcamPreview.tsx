import React, { useEffect, useRef } from 'react';
import { Camera, CameraOff, AlertTriangle, Play } from 'lucide-react';
import { useGazeHome } from '../context/GazeHomeContext';

const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const FACE_OVAL_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

interface WebcamPreviewProps {
  compact?: boolean;
  showLandmarks?: boolean;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  compact = false,
  showLandmarks = true,
}) => {
  const {
    videoStream,
    trackingStatus,
    trackingError,
    controlMode,
    faceQuality,
    latestLandmarksRef,
    startWebcamTracking,
    enableDemoMode,
  } = useGazeHome();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (videoStream) {
      video.srcObject = videoStream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [videoStream]);

  useEffect(() => {
    if (!showLandmarks || !videoStream || trackingStatus !== 'active') return;
    let rafId = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const landmarks = latestLandmarksRef.current;
          if (landmarks && landmarks.length >= 468) {
            ctx.save();
            // Mirror coordinates to match mirrored video preview
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);

            // Face oval
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            FACE_OVAL_INDICES.forEach((idx, i) => {
              const p = landmarks[idx];
              const x = p.x * canvas.width;
              const y = p.y * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();

            // Left & Right eye contours
            const drawEye = (indices: number[]) => {
              ctx.strokeStyle = '#22D3EE';
              ctx.lineWidth = 2;
              ctx.beginPath();
              indices.forEach((idx, i) => {
                const p = landmarks[idx];
                const x = p.x * canvas.width;
                const y = p.y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              });
              ctx.closePath();
              ctx.stroke();
            };

            drawEye(LEFT_EYE_INDICES);
            drawEye(RIGHT_EYE_INDICES);

            // Iris centers (468, 473)
            if (landmarks.length >= 478) {
              [468, 473].forEach((irisIdx) => {
                const iris = landmarks[irisIdx];
                const ix = iris.x * canvas.width;
                const iy = iris.y * canvas.height;
                ctx.fillStyle = '#A78BFA';
                ctx.beginPath();
                ctx.arc(ix, iy, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });
            }

            ctx.restore();
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [latestLandmarksRef, showLandmarks, trackingStatus, videoStream]);

  const hasError =
    trackingStatus === 'permission-denied' ||
    trackingStatus === 'no-camera' ||
    trackingStatus === 'camera-in-use' ||
    trackingStatus === 'error';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#E2E0F0] bg-[#111834] text-white ${
        compact ? 'aspect-video' : 'aspect-[4/3]'
      }`}
    >
      {videoStream && controlMode === 'webcam-gaze' ? (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full -scale-x-100 object-cover"
          />
          {showLandmarks && (
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent p-3">
            <div className="flex items-center justify-between text-xs text-slate-200">
              <span>
                {trackingStatus === 'paused'
                  ? 'Tracking paused'
                  : faceQuality === 'good'
                  ? 'Face & iris locked'
                  : faceQuality === 'low-light'
                  ? 'Low lighting detected'
                  : faceQuality === 'multiple-faces'
                  ? 'Multiple faces in frame'
                  : faceQuality === 'fair'
                  ? 'Adjust face framing'
                  : 'Searching for face'}
              </span>
              <span className="font-mono tabular-nums text-cyan-300">Local CV</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-5 text-center">
          {hasError ? (
            <>
              <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
              <p className="text-sm font-semibold text-white">Camera Unavailable</p>
              <p className="mt-1 max-w-xs text-xs text-slate-300">{trackingError}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startWebcamTracking()}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={enableDemoMode}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 transition-colors"
                >
                  Use Demo Mode
                </button>
              </div>
            </>
          ) : trackingStatus === 'initializing' ? (
            <>
              <Camera className="mb-2 h-8 w-8 text-cyan-400" />
              <p className="text-sm font-medium text-white">Starting camera & MediaPipe model…</p>
              <p className="mt-1 text-xs text-slate-300">All processing stays locally in your browser.</p>
            </>
          ) : (
            <>
              <CameraOff className="mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-100">
                {controlMode === 'demo-simulation' ? 'Demo Simulation Active' : 'Webcam Feed Inactive'}
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                {controlMode === 'demo-simulation'
                  ? 'Camera is off. Gaze cursor is driven by Demo Mode.'
                  : 'Enable the webcam to begin real-time facial and iris tracking.'}
              </p>
              {controlMode !== 'demo-simulation' && (
                <button
                  type="button"
                  onClick={() => startWebcamTracking()}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  Start Camera
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
