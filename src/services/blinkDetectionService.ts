import { BlinkEvent, BlinkEventType } from '../types';

export interface BlinkDetectorConfig {
  earThreshold: number;
  longBlinkMinMs: number;
  doubleBlinkWindowMs: number;
}

export interface BlinkStatusSnapshot {
  isEyeClosed: boolean;
  currentClosedDurationMs: number;
  lastEvent: BlinkEvent | null;
  inCooldown: boolean;
}

export class BlinkDetectionService {
  private isClosed = false;
  private closeStartTs = 0;
  private lastOpenTs = 0;
  private lastBlinkCompleteTs = 0;
  private lastEventTs = 0;
  private pendingSingleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEvent: BlinkEvent | null = null;
  private onBlinkCallback: ((evt: BlinkEvent) => void) | null = null;

  private readonly MIN_BLINK_MS = 65;
  private readonly MAX_BLINK_MS = 2800;
  private readonly COOLDOWN_MS = 750;
  private readonly HYSTERESIS = 0.02;

  setListener(cb: ((evt: BlinkEvent) => void) | null): void {
    this.onBlinkCallback = cb;
  }

  reset(): void {
    this.isClosed = false;
    this.closeStartTs = 0;
    if (this.pendingSingleTimer) {
      clearTimeout(this.pendingSingleTimer);
      this.pendingSingleTimer = null;
    }
  }

  private emit(type: BlinkEventType, durationMs: number, now: number): void {
    const evt: BlinkEvent = { type, durationMs, timestamp: now };
    this.lastEvent = evt;
    this.lastEventTs = now;
    if (this.onBlinkCallback) {
      this.onBlinkCallback(evt);
    }
  }

  update(avgEar: number, now: number, config: BlinkDetectorConfig): BlinkStatusSnapshot {
    const inCooldown = now - this.lastEventTs < this.COOLDOWN_MS;
    const closeThresh = config.earThreshold;
    const openThresh = config.earThreshold + this.HYSTERESIS;

    if (!this.isClosed) {
      if (avgEar > 0 && avgEar < closeThresh) {
        this.isClosed = true;
        this.closeStartTs = now;
      } else {
        this.lastOpenTs = now;
      }
    } else {
      const closedDuration = now - this.closeStartTs;
      if (avgEar >= openThresh) {
        this.isClosed = false;

        // Ignore micro-glitches (< 65ms) or extended eye-away pauses (> 2.8s)
        if (!inCooldown && closedDuration >= this.MIN_BLINK_MS && closedDuration <= this.MAX_BLINK_MS) {
          if (closedDuration >= config.longBlinkMinMs) {
            if (this.pendingSingleTimer) {
              clearTimeout(this.pendingSingleTimer);
              this.pendingSingleTimer = null;
            }
            this.lastBlinkCompleteTs = 0;
            this.emit('long', Math.round(closedDuration), now);
          } else {
            // Short/normal blink: check if it completes a double blink
            if (
              this.lastBlinkCompleteTs > 0 &&
              now - this.lastBlinkCompleteTs <= config.doubleBlinkWindowMs
            ) {
              if (this.pendingSingleTimer) {
                clearTimeout(this.pendingSingleTimer);
                this.pendingSingleTimer = null;
              }
              this.lastBlinkCompleteTs = 0;
              this.emit('double', Math.round(closedDuration), now);
            } else {
              this.lastBlinkCompleteTs = now;
              const capturedDuration = Math.round(closedDuration);
              if (this.pendingSingleTimer) {
                clearTimeout(this.pendingSingleTimer);
              }
              this.pendingSingleTimer = setTimeout(() => {
                this.pendingSingleTimer = null;
                this.lastBlinkCompleteTs = 0;
                this.emit('single', capturedDuration, Date.now());
              }, config.doubleBlinkWindowMs + 20);
            }
          }
        }
      }
    }

    return {
      isEyeClosed: this.isClosed,
      currentClosedDurationMs: this.isClosed ? Math.round(now - this.closeStartTs) : 0,
      lastEvent: this.lastEvent,
      inCooldown,
    };
  }
}

export const blinkDetectionService = new BlinkDetectionService();
