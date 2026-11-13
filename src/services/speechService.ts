export const speechService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  speak(text: string, options: { enabled: boolean; volume: number; rate: number }): void {
    if (!options.enabled || !this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = Math.max(0, Math.min(1, options.volume));
      utterance.rate = Math.max(0.5, Math.min(2, options.rate));
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis may fail silently in restricted frames
    }
  },

  stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  },
};
