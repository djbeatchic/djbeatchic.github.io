/**
 * Main Application Orchestrator for DJ Beatchic Stardust Display
 * Connects Canvas Particle Physics, Web Audio Analysis, QR Rendering,
 * LocalStorage persistence, and DJ Booth Controls.
 */

(function () {
  // DOM Elements
  const canvas = document.getElementById('visualizer-canvas');
  const qrCanvas = document.getElementById('qr-canvas');
  const qrGlowDisc = document.getElementById('qr-glow-disc');
  const djNameEl = document.getElementById('dj-name-text');
  const djTaglineEl = document.getElementById('dj-tagline-text');
  const audioStatusPill = document.getElementById('audio-status');
  const statusBeacon = document.getElementById('status-beacon');
  const statusText = document.getElementById('status-text');

  // Modal & Drawer
  const startupModal = document.getElementById('startup-modal');
  const btnStartMic = document.getElementById('btn-start-mic');
  const btnStartDemo = document.getElementById('btn-start-demo');
  const btnSettings = document.getElementById('btn-settings');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const settingsDrawer = document.getElementById('settings-drawer');
  const btnCloseSettings = document.getElementById('btn-close-settings');

  // Setting Inputs
  const inputDjName = document.getElementById('setting-dj-name');
  const inputTagline = document.getElementById('setting-tagline');
  const inputQrUrl = document.getElementById('setting-qr-url');
  const selectAudioSource = document.getElementById('setting-audio-source');
  const sliderSensitivity = document.getElementById('setting-sensitivity');
  const valSensitivity = document.getElementById('val-sensitivity');
  const sliderParticles = document.getElementById('setting-particles');
  const valParticles = document.getElementById('val-particles');
  const btnToggleDemo = document.getElementById('btn-toggle-demo');
  const themeBtns = document.querySelectorAll('.theme-btn');

  // Core Engines
  let particleVortex = null;
  let audioEngine = null;
  let qrRenderer = null;

  // Configuration State - Targets custom domain hub at root so phones open https://djbeatchic.com/
  let defaultHubUrl = 'https://djbeatchic.com/';
  try {
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.protocol.startsWith('file')) {
      defaultHubUrl = new URL('../', window.location.href).href;
    }
  } catch (e) {
    console.warn('Using default custom domain hub URL');
  }

  const state = {
    djName: localStorage.getItem('dj_name') || 'DJ BEATCHIC',
    tagline: localStorage.getItem('dj_tagline') || '✦ SCAN FOR SOCIALS & TIP JAR ✦',
    qrUrl: localStorage.getItem('dj_qr_url') || defaultHubUrl,
    theme: localStorage.getItem('dj_theme') || 'emerald',
    particleCount: parseInt(localStorage.getItem('dj_particles') || '1400', 10),
    sensitivity: parseFloat(localStorage.getItem('dj_sensitivity') || '1.2'),
  };

  /**
   * Initializes all systems
   */
  async function init() {
    // 1. Initialize Engines
    particleVortex = new ParticleVortex(canvas);
    particleVortex.setTheme(state.theme);
    particleVortex.setParticleCount(state.particleCount);

    audioEngine = new AudioEngine();
    audioEngine.setSensitivity(state.sensitivity);

    qrRenderer = new QrRenderer(qrCanvas);

    // 2. Populate UI with Saved State
    updateBranding();
    syncSettingsInputs();

    // 3. Render Initial QR Code
    qrRenderer.render(state.qrUrl, state.djName);

    // 4. Setup Event Listeners
    setupEventListeners();

    // 5. Start Render Animation Loop
    requestAnimationFrame(renderLoop);
  }

  /**
   * Updates DJ Branding on screen
   */
  function updateBranding() {
    if (djNameEl) djNameEl.textContent = state.djName;
    if (djTaglineEl) djTaglineEl.textContent = state.tagline;
  }

  /**
   * Synchronize Drawer Inputs with State
   */
  function syncSettingsInputs() {
    if (inputDjName) inputDjName.value = state.djName;
    if (inputTagline) inputTagline.value = state.tagline;
    if (inputQrUrl) inputQrUrl.value = state.qrUrl;
    if (sliderSensitivity) {
      sliderSensitivity.value = state.sensitivity;
      valSensitivity.textContent = `${state.sensitivity}x`;
    }
    if (sliderParticles) {
      sliderParticles.value = state.particleCount;
      valParticles.textContent = state.particleCount;
    }

    // Highlight active theme button
    themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === state.theme);
    });
  }

  /**
   * Setup UI Interaction Handlers
   */
  function setupEventListeners() {
    // Start with Microphone
    btnStartMic.addEventListener('click', async () => {
      const ok = await audioEngine.startLiveInput();
      startupModal.classList.add('hidden');
      updateAudioStatus(ok ? 'mic' : 'demo');
      populateAudioSources();
    });

    // Start in Autonomous Demo Beat Mode
    btnStartDemo.addEventListener('click', async () => {
      await audioEngine.startDemoMode();
      startupModal.classList.add('hidden');
      updateAudioStatus('demo');
    });

    // Audio status pill click opens modal to switch
    audioStatusPill.addEventListener('click', () => {
      startupModal.classList.remove('hidden');
    });

    // Settings Drawer Open / Close
    btnSettings.addEventListener('click', () => {
      settingsDrawer.classList.toggle('open');
      populateAudioSources();
    });

    btnCloseSettings.addEventListener('click', () => {
      settingsDrawer.classList.remove('open');
    });

    // Fullscreen Toggle
    btnFullscreen.addEventListener('click', toggleFullscreen);

    // DJ Name Change
    inputDjName.addEventListener('input', (e) => {
      state.djName = e.target.value.trim() || 'DJ BEATCHIC';
      localStorage.setItem('dj_name', state.djName);
      updateBranding();
      qrRenderer.render(state.qrUrl, state.djName);
    });

    // Tagline Change
    inputTagline.addEventListener('input', (e) => {
      state.tagline = e.target.value.trim() || '✦ SCAN TO CONNECT ✦';
      localStorage.setItem('dj_tagline', state.tagline);
      updateBranding();
    });

    // QR Target URL Change
    inputQrUrl.addEventListener('change', (e) => {
      let url = e.target.value.trim();
      if (!url) url = defaultHubUrl;
      state.qrUrl = url;
      localStorage.setItem('dj_qr_url', state.qrUrl);
      qrRenderer.render(state.qrUrl, state.djName);
    });

    // Theme Buttons
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const themeKey = btn.dataset.theme;
        state.theme = themeKey;
        localStorage.setItem('dj_theme', state.theme);
        particleVortex.setTheme(themeKey);
        themeBtns.forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Sensitivity Slider
    sliderSensitivity.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.sensitivity = val;
      valSensitivity.textContent = `${val.toFixed(1)}x`;
      audioEngine.setSensitivity(val);
      localStorage.setItem('dj_sensitivity', val);
    });

    // Particle Count Slider (Performance calibration for Pi vs Laptop)
    sliderParticles.addEventListener('input', (e) => {
      const count = parseInt(e.target.value, 10);
      state.particleCount = count;
      valParticles.textContent = count;
      particleVortex.setParticleCount(count);
      localStorage.setItem('dj_particles', count);
    });

    // Demo Mode Toggle in Settings
    btnToggleDemo.addEventListener('click', () => {
      if (audioEngine.isDemoMode) {
        audioEngine.startLiveInput();
        updateAudioStatus('mic');
        btnToggleDemo.textContent = 'Switch to Test Beat';
      } else {
        audioEngine.startDemoMode();
        updateAudioStatus('demo');
        btnToggleDemo.textContent = 'Switch to Live Audio';
      }
    });

    // Audio Source Dropdown
    selectAudioSource.addEventListener('change', async (e) => {
      const deviceId = e.target.value;
      if (deviceId) {
        await audioEngine.startLiveInput(deviceId);
        updateAudioStatus('mic');
      }
    });

    // Keyboard Shortcuts (F for Fullscreen, S for Settings, D for Demo)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 's' || e.key === 'S') {
        settingsDrawer.classList.toggle('open');
      } else if (e.key === 'd' || e.key === 'D') {
        if (audioEngine.isDemoMode) {
          audioEngine.startLiveInput();
          updateAudioStatus('mic');
        } else {
          audioEngine.startDemoMode();
          updateAudioStatus('demo');
        }
      }
    });
  }

  /**
   * Enumerate and populate audio input devices (line-in, Serato USB interface, mic)
   */
  async function populateAudioSources() {
    const devices = await audioEngine.refreshAudioDevices();
    selectAudioSource.innerHTML = '<option value="">Default Microphone / Line-In</option>';
    devices.forEach((d, idx) => {
      const option = document.createElement('option');
      option.value = d.deviceId;
      option.textContent = d.label || `Audio Input ${idx + 1}`;
      if (audioEngine.selectedDeviceId === d.deviceId) {
        option.selected = true;
      }
      selectAudioSource.appendChild(option);
    });
  }

  /**
   * Update Audio Status Badge (Top Left)
   */
  function updateAudioStatus(mode) {
    if (mode === 'mic') {
      statusBeacon.className = 'status-beacon active';
      statusText.textContent = 'LIVE AUDIO';
    } else if (mode === 'demo') {
      statusBeacon.className = 'status-beacon demo';
      statusText.textContent = 'TEST BEAT (126 BPM)';
    } else {
      statusBeacon.className = 'status-beacon';
      statusText.textContent = 'AUDIO PAUSED';
    }
  }

  /**
   * Toggle True Browser Fullscreen
   */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /**
   * Main 60 FPS Render Loop
   */
  function renderLoop() {
    const levels = audioEngine.update();

    // Render Particle Vortex with Audio Metrics
    particleVortex.render(levels);

    // Bass Kick Impact Animation on QR disc and DJ Header
    if (levels.isBeat) {
      qrGlowDisc.classList.add('beat-kick');
      djNameEl.classList.add('beat-pulse');
      setTimeout(() => {
        qrGlowDisc.classList.remove('beat-kick');
        djNameEl.classList.remove('beat-pulse');
      }, 140);
    }

    requestAnimationFrame(renderLoop);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
