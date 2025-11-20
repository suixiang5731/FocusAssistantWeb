/**
 * Generates a soothing "Singing Bowl" / "Ding" sound using the Web Audio API.
 * This ensures the app works offline and doesn't depend on broken CDN links.
 */
export const playMindfulnessBell = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    
    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.6, ctx.currentTime);

    // Fundamental Frequency (The "Ding")
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.connect(masterGain);

    // Overtone 1 (Harmonic)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25 * 2.5, ctx.currentTime); 
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.1, ctx.currentTime);
    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Envelope (Attack and Decay)
    const now = ctx.currentTime;
    
    // Attack
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
    
    // Long Decay
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    // Start and Stop
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 4);
    osc2.stop(now + 4);

    // Cleanup
    setTimeout(() => {
      ctx.close();
    }, 4000);

  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playSessionEndSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
  
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const createOsc = (freq: number, start: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 1.2);
      }

      // A major chord arpeggio
      createOsc(440, now);       // A4
      createOsc(554.37, now + 0.2); // C#5
      createOsc(659.25, now + 0.4); // E5
      
      setTimeout(() => ctx.close(), 2000);
    } catch (e) {
        console.error(e);
    }
}