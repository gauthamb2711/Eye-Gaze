export interface GazeTargetInfo {
  id: string;
  label: string;
}

export interface DwellFrameState {
  hoveredTargetId: string | null;
  hoveredLabel: string | null;
  dwellProgress: number; // 0..1
  activatedTargetId: string | null;
  inCooldown: boolean;
}

class GazeInteractionService {
  private activeTargetId: string | null = null;
  private activeLabel: string | null = null;
  private dwellStartTs = 0;
  private lastHitTs = 0;
  private cooldownUntilTs = 0;

  private readonly LEAVE_GRACE_MS = 160;
  private readonly POST_ACTIVATION_COOLDOWN_MS = 1350;
  private readonly HIT_PADDING_PX = 14;

  reset(): void {
    this.activeTargetId = null;
    this.activeLabel = null;
    this.dwellStartTs = 0;
  }

  /**
   * Finds the DOM element marked with `data-gaze-target` under normalized screen coordinates (0..1).
   */
  findTargetAtPoint(normX: number, normY: number): GazeTargetInfo | null {
    if (typeof document === 'undefined') return null;

    const px = normX * window.innerWidth;
    const py = normY * window.innerHeight;
    const elements = document.querySelectorAll<HTMLElement>('[data-gaze-target]');

    let bestMatch: { id: string; label: string; dist: number } | null = null;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const left = rect.left - this.HIT_PADDING_PX;
      const right = rect.right + this.HIT_PADDING_PX;
      const top = rect.top - this.HIT_PADDING_PX;
      const bottom = rect.bottom + this.HIT_PADDING_PX;

      if (px >= left && px <= right && py >= top && py <= bottom) {
        const cx = (rect.left + rect.right) / 2;
        const cy = (rect.top + rect.bottom) / 2;
        const dist = Math.hypot(px - cx, py - cy);
        if (!bestMatch || dist < bestMatch.dist) {
          bestMatch = {
            id: el.dataset.gazeTarget || '',
            label: el.dataset.gazeLabel || el.dataset.gazeTarget || 'Target',
            dist,
          };
        }
      }
    });

    if (!bestMatch) return null;
    return { id: (bestMatch as { id: string }).id, label: (bestMatch as { label: string }).label };
  }

  updateDwell(
    normX: number,
    normY: number,
    now: number,
    dwellDurationMs: number,
    trackingReliable: boolean
  ): DwellFrameState {
    const inCooldown = now < this.cooldownUntilTs;

    if (!trackingReliable) {
      this.reset();
      return {
        hoveredTargetId: null,
        hoveredLabel: null,
        dwellProgress: 0,
        activatedTargetId: null,
        inCooldown,
      };
    }

    const hit = this.findTargetAtPoint(normX, normY);

    if (hit) {
      this.lastHitTs = now;
      if (hit.id !== this.activeTargetId) {
        this.activeTargetId = hit.id;
        this.activeLabel = hit.label;
        this.dwellStartTs = now;
      }

      if (inCooldown) {
        return {
          hoveredTargetId: this.activeTargetId,
          hoveredLabel: this.activeLabel,
          dwellProgress: 0,
          activatedTargetId: null,
          inCooldown: true,
        };
      }

      const elapsed = now - this.dwellStartTs;
      const progress = Math.max(0, Math.min(1, elapsed / Math.max(400, dwellDurationMs)));

      if (progress >= 1) {
        const activatedId = this.activeTargetId;
        this.cooldownUntilTs = now + this.POST_ACTIVATION_COOLDOWN_MS;
        this.dwellStartTs = now + this.POST_ACTIVATION_COOLDOWN_MS;
        return {
          hoveredTargetId: activatedId,
          hoveredLabel: this.activeLabel,
          dwellProgress: 1,
          activatedTargetId: activatedId,
          inCooldown: true,
        };
      }

      return {
        hoveredTargetId: this.activeTargetId,
        hoveredLabel: this.activeLabel,
        dwellProgress: progress,
        activatedTargetId: null,
        inCooldown: false,
      };
    }

    // Brief hysteresis grace window to absorb micro-saccades
    if (this.activeTargetId && now - this.lastHitTs <= this.LEAVE_GRACE_MS) {
      const progress = inCooldown
        ? 0
        : Math.max(0, Math.min(1, (now - this.dwellStartTs) / Math.max(400, dwellDurationMs)));
      return {
        hoveredTargetId: this.activeTargetId,
        hoveredLabel: this.activeLabel,
        dwellProgress: progress,
        activatedTargetId: null,
        inCooldown,
      };
    }

    this.reset();
    return {
      hoveredTargetId: null,
      hoveredLabel: null,
      dwellProgress: 0,
      activatedTargetId: null,
      inCooldown,
    };
  }

  triggerCooldown(now: number = performance.now()): void {
    this.cooldownUntilTs = now + this.POST_ACTIVATION_COOLDOWN_MS;
    this.dwellStartTs = now + this.POST_ACTIVATION_COOLDOWN_MS;
  }
}

export const gazeInteractionService = new GazeInteractionService();
