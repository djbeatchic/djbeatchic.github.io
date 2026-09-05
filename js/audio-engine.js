/**
 * Audio Engine for DJ Beatchic Reactive Display
 * Handles Web Audio API input (Mic / Line-in), FFT Frequency Analysis,
 * Beat Detection, and an autonomous Synth House Beat Simulator.
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.mediaStream = null;
    this.dataArray = null;

    // Simulation / Demo mode
    this.isDemoMode = false;
    this.demoTimer = null;
    this.demoBpm = 126;
    this.demoStep = 0;

    // Frequency analysis states (normalized 0 to 1)
    this.levels = {
      bass: 0,
      mid: 0,
      high: 0,
      overall: 0,
      isBeat: false,
      beatIntensity: 0
    };

    // Beat detection parameters
    this.sensitivity = 1.2; // User gain multiplier
    this.beatThreshold = 0.55; // Dynamic trigger threshold
    this.beatDecay = 0.94;
    this.currentEnergy = 0;
    this.energyHistory = new Float32Array(30);
    this.historyIndex = 0;
    this.lastBeatTime = 0;

    // Available audio input devices
    this.audioDevices = [];
    this.selectedDeviceId = null;
    this.isRunning = false;
  }

  /**
   * Initializes Audio Context on user gesture
   */
  async init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    await this.refreshAudioDevices();
  }

  /**
   * Enumerate available microphone/line-in devices (e.g., USB Serato audio interface)
   */
  async refreshAudioDevices() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.audioDevices = devices.filter(d => d.kind === 'audioinput');
      }
    } catch (e) {
      console.warn('Could not enumerate audio devices:', e);
    }
    return this.audioDevices;
  }

  /**
   * Start listening to physical microphone or line-in
   */
  async startLiveInput(deviceId = null) {
    await this.init();
    this.stopDemoMode();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    };

    if (deviceId) {
      constraints.audio.deviceId = { exact: deviceId };
      this.selectedDeviceId = deviceId;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!this.analyser) {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;
      }

      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.isRunning = true;
      this.isDemoMode = false;
      return true;
    } catch (err) {
      console.error('Error opening audio input:', err);
      // Fallback to demo mode if mic permission was denied
      this.startDemoMode();
      return false;
    }
  }

  /**
   * Start Autonomous Synthesizer Demo Mode (126 BPM 4-on-the-floor kick + hats + bassline)
   * Allows testing without live music or cables.
   */
  async startDemoMode() {
    await this.init();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.isDemoMode = true;
    this.isRunning = true;

    // Stop existing demo loop if any
    if (this.demoTimer) clearInterval(this.demoTimer);

    // Setup an oscillator / noise audio loop for actual sound preview + analysis
    if (!this.analyser) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.75;
    }

    // Create a subtle sub-synth bus so audio actually plays softly
    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    masterGain.connect(this.analyser);

    const stepDurationMs = (60 / this.demoBpm / 4) * 1000; // 16th notes

    this.demoTimer = setInterval(() => {
      if (!this.isDemoMode || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const step = this.demoStep % 16;
      this.demoStep++;

      // 4-on-the-floor Kick drum on steps 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.audioCtx.createOscillator();
        const kickGain = this.audioCtx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        kickGain.gain.setValueAtTime(0.9, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.25);
      }

      // Offbeat Open Hi-Hat on steps 2, 6, 10, 14
      if (step % 4 === 2) {
        const bufferSize = this.audioCtx.sampleRate * 0.08;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, now);

        const hatGain = this.audioCtx.createGain();
        hatGain.gain.setValueAtTime(0.3, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(filter);
        filter.connect(hatGain);
        hatGain.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.08);
      }

      // Deep Sub Bassline pulse on offbeats
      if (step === 2 || step === 6 || step === 11 || step === 14) {
        const bassOsc = this.audioCtx.createOscillator();
        const bassGain = this.audioCtx.createGain();
        const notes = [55, 55, 65.4, 49]; // A1, C2, G1
        const freq = notes[(step / 2) % notes.length];
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, now);

        const bassFilter = this.audioCtx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(320, now);

        bassGain.gain.setValueAtTime(0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.18);
      }
    }, stepDurationMs);

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  stopDemoMode() {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    this.isDemoMode = false;
  }

  /**
   * Called every animation frame to extract real-time audio metrics
   */
  update() {
    if (!this.isRunning || !this.analyser || !this.dataArray) {
      // Gentle decay if idle
      this.levels.bass *= 0.92;
      this.levels.mid *= 0.92;
      this.levels.high *= 0.92;
      this.levels.overall *= 0.92;
      this.levels.isBeat = false;
      this.levels.beatIntensity *= 0.9;
      return this.levels;
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    const binCount = this.dataArray.length; // usually 256

    // Group frequency ranges
    // Sample rate ~44100Hz -> ~86Hz per bin
    // Sub/Bass: bins 0 to 5 (~0 - 450Hz)
    // Mids: bins 6 to 30 (~500 - 2500Hz)
    // Highs: bins 31 to 120 (~2600 - 10000Hz)
    let bassSum = 0, bassCount = 0;
    let midSum = 0, midCount = 0;
    let highSum = 0, highCount = 0;
    let totalSum = 0;

    for (let i = 0; i < binCount; i++) {
      const val = this.dataArray[i] / 255.0; // 0..1
      totalSum += val;

      if (i <= 5) {
        bassSum += val;
        bassCount++;
      } else if (i <= 30) {
        midSum += val;
        midCount++;
      } else if (i <= 120) {
        highSum += val;
        highCount++;
      }
    }

    const rawBass = (bassCount > 0 ? bassSum / bassCount : 0) * this.sensitivity;
    const rawMid = (midCount > 0 ? midSum / midCount : 0) * this.sensitivity;
    const rawHigh = (highCount > 0 ? highSum / highCount : 0) * this.sensitivity;
    const rawOverall = (totalSum / binCount) * this.sensitivity;

    // Smooth response
    this.levels.bass = Math.min(1.0, this.levels.bass * 0.3 + rawBass * 0.7);
    this.levels.mid = Math.min(1.0, this.levels.mid * 0.4 + rawMid * 0.6);
    this.levels.high = Math.min(1.0, this.levels.high * 0.4 + rawHigh * 0.6);
    this.levels.overall = Math.min(1.0, rawOverall);

    // Dynamic Beat Detection (Kick Shockwaves)
    // Computes moving energy average of the bass band
    const now = performance.now();
    let historySum = 0;
    for (let i = 0; i < this.energyHistory.length; i++) {
      historySum += this.energyHistory[i];
    }
    const avgEnergy = historySum / this.energyHistory.length;

    this.energyHistory[this.historyIndex] = this.levels.bass;
    this.historyIndex = (this.historyIndex + 1) % this.energyHistory.length;

    // Check if current bass peaks significantly above average energy and threshold
    const energyDelta = this.levels.bass - avgEnergy;
    const minBeatInterval = 210; // ~285 BPM cap to prevent rapid double-triggering

    if (
      this.levels.bass > this.beatThreshold &&
      energyDelta > 0.08 &&
      now - this.lastBeatTime > minBeatInterval
    ) {
      this.levels.isBeat = true;
      this.levels.beatIntensity = Math.min(1.0, (this.levels.bass - this.beatThreshold) * 2.5 + 0.4);
      this.lastBeatTime = now;
    } else {
      this.levels.isBeat = false;
      this.levels.beatIntensity *= this.beatDecay;
    }

    return this.levels;
  }

  setSensitivity(val) {
    this.sensitivity = parseFloat(val);
  }

  setThreshold(val) {
    this.beatThreshold = parseFloat(val);
  }
}

window.AudioEngine = AudioEngine;
