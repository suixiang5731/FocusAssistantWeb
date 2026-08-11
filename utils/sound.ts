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

// Master White / Pink Noise Engine using Web Audio API
export type NoiseType = 'rain' | 'waves' | 'pink' | 'white';

export const NOISE_TYPES: { id: NoiseType; name: string; icon: string }[] = [
  { id: 'rain', name: '舒缓雨声', icon: '🌧️' },
  { id: 'waves', name: '潮汐海浪', icon: '🌊' },
  { id: 'pink', name: '柔和粉噪', icon: '🍃' },
  { id: 'white', name: '纯白噪声', icon: '⚡' },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.35;
  private currentType: NoiseType = 'rain';

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start(type: NoiseType = this.currentType, volume: number = this.currentVolume) {
    this.initContext();
    if (!this.ctx) return;

    if (this.isPlaying) {
      this.stop();
    }

    this.currentType = type;
    this.currentVolume = volume;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink / White noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        output[i] = white * 0.12;
      } else {
        // Pink noise approximation
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    
    if (type === 'rain') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1100, this.ctx.currentTime);
    } else if (type === 'waves') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(650, this.ctx.currentTime);
    } else if (type === 'pink') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    } else {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(2800, this.ctx.currentTime);
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);

    if (type === 'waves') {
      const waveGain = this.ctx.createGain();
      waveGain.gain.setValueAtTime(this.currentVolume * 0.6, this.ctx.currentTime);

      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      
      const lfoGainNode = this.ctx.createGain();
      lfoGainNode.gain.setValueAtTime(this.currentVolume * 0.35, this.ctx.currentTime);

      this.lfoOsc.connect(lfoGainNode);
      lfoGainNode.connect(waveGain.gain);

      this.filterNode.connect(waveGain);
      waveGain.connect(this.ctx.destination);
      this.lfoOsc.start();
    } else {
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }

    this.noiseNode.start();
    this.isPlaying = true;
  }

  public stop() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    if (this.lfoOsc) {
      try {
        this.lfoOsc.stop();
        this.lfoOsc.disconnect();
      } catch (e) {}
      this.lfoOsc = null;
    }
    this.isPlaying = false;
  }

  public setVolume(vol: number) {
    this.currentVolume = vol;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public getType() {
    return this.currentType;
  }

  public getVolume() {
    return this.currentVolume;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const noiseEngine = new SoundEngine();
