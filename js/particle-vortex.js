/**
 * Stardust / Particle Vortex Visualizer Engine
 * High-performance 60 FPS HTML5 Canvas engine with additive blending,
 * gravitational orbital physics, kick-drum shockwaves, and frequency-driven stardust.
 */

class ParticleVortex {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // QR Protection exclusion zone radius
    this.qrSafeRadius = 155; // Radius where particles cannot cover the QR code

    // Particle pool
    this.particleCount = 1400; // Optimal default for Pi & Tablets
    this.particles = [];
    this.shockwaves = [];

    // Theme Palettes
    this.themes = {
      emerald: {
        name: 'Deep Emerald',
        background: '#040d09',
        primary: [0, 255, 136],      // Bright Emerald Green
        secondary: [0, 245, 212],    // Electric Teal
        accent: [80, 250, 123],      // Mint Sparkle
        aura: 'rgba(0, 255, 136, 0.25)',
        haloRgb: '0, 255, 136',
        centerGrad: ['rgba(0, 75, 45, 0.4)', 'rgba(4, 13, 9, 0.95)']
      },
      violet: {
        name: 'Cosmic Violet',
        background: '#0a0414',
        primary: [180, 70, 255],     // Electric Violet
        secondary: [255, 60, 180],   // Cosmic Pink
        accent: [120, 210, 255],     // Cyan Stardust
        aura: 'rgba(180, 70, 255, 0.25)',
        haloRgb: '180, 70, 255',
        centerGrad: ['rgba(70, 15, 95, 0.4)', 'rgba(10, 4, 20, 0.95)']
      },
      cyan: {
        name: 'Cyber Cyan',
        background: '#020b12',
        primary: [0, 225, 255],      // Cyber Cyan
        secondary: [0, 120, 255],    // Electric Blue
        accent: [220, 245, 255],     // Diamond White
        aura: 'rgba(0, 225, 255, 0.25)',
        haloRgb: '0, 225, 255',
        centerGrad: ['rgba(0, 50, 85, 0.4)', 'rgba(2, 11, 18, 0.95)']
      },
      gold: {
        name: 'Solar Gold',
        background: '#0e0b04',
        primary: [255, 195, 0],      // Rich Gold
        secondary: [255, 120, 30],   // Warm Amber
        accent: [255, 240, 180],     // Champagne Sparkle
        aura: 'rgba(255, 195, 0, 0.25)',
        haloRgb: '255, 195, 0',
        centerGrad: ['rgba(80, 55, 10, 0.4)', 'rgba(14, 11, 4, 0.95)']
      }
    };

    this.currentThemeKey = 'emerald';
    this.currentTheme = this.themes.emerald;

    // Dynamic rotation & vortex state
    this.vortexAngle = 0;
    this.baseSpeed = 0.003;
    this.shockwaveId = 0;

    // Spectrum ring bars
    this.spectrumBars = 64;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createParticles();
  }

  setTheme(themeKey) {
    if (this.themes[themeKey]) {
      this.currentThemeKey = themeKey;
      this.currentTheme = this.themes[themeKey];
      // Refresh colors for existing particles
      this.particles.forEach(p => {
        const paletteChoice = Math.random();
        if (paletteChoice < 0.55) {
          p.rgb = this.currentTheme.primary;
        } else if (paletteChoice < 0.85) {
          p.rgb = this.currentTheme.secondary;
        } else {
          p.rgb = this.currentTheme.accent;
        }
      });
    }
  }

  setParticleCount(count) {
    this.particleCount = Math.max(400, Math.min(3500, parseInt(count)));
    this.createParticles();
  }

  setQrRadius(radius) {
    this.qrSafeRadius = radius;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // Dynamically adjust QR safe radius based on screen width
    const minDim = Math.min(this.width, this.height);
    this.qrSafeRadius = Math.max(120, Math.min(170, minDim * 0.22));
  }

  createParticles() {
    this.particles = [];
    const maxDistance = Math.hypot(this.width, this.height) * 0.65;

    for (let i = 0; i < this.particleCount; i++) {
      // Exponential distribution so more particles cluster closer to the vortex center
      const distRatio = Math.pow(Math.random(), 1.8);
      const radius = this.qrSafeRadius + 15 + distRatio * (maxDistance - this.qrSafeRadius);
      const angle = Math.random() * Math.PI * 2;

      // Color selection from theme
      const paletteChoice = Math.random();
      let rgb = this.currentTheme.primary;
      if (paletteChoice > 0.55 && paletteChoice < 0.85) {
        rgb = this.currentTheme.secondary;
      } else if (paletteChoice >= 0.85) {
        rgb = this.currentTheme.accent;
      }

      // 3 spiral arms offset
      const arm = Math.floor(Math.random() * 3);
      const armAngleOffset = (arm * (Math.PI * 2 / 3));

      this.particles.push({
        baseRadius: radius,
        currentRadius: radius,
        angle: angle + armAngleOffset,
        speed: (0.0015 + (1 / (radius + 50)) * 0.6) * (Math.random() * 0.5 + 0.75),
        size: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.03 + Math.random() * 0.05,
        rgb: rgb,
        radialOffset: 0,
        radialVelocity: 0,
        spiralArm: arm
      });
    }
  }

  /**
   * Triggers a bass kick shockwave
   */
  triggerShockwave(intensity = 0.8) {
    this.shockwaves.push({
      id: ++this.shockwaveId,
      radius: this.qrSafeRadius,
      maxRadius: Math.max(this.width, this.height) * 0.85,
      speed: 14 + intensity * 18,
      thickness: 35 + intensity * 40,
      intensity: intensity,
      alpha: 0.95
    });

    // Keep active shockwaves capped
    if (this.shockwaves.length > 5) {
      this.shockwaves.shift();
    }
  }

  /**
   * Main render loop called by requestAnimationFrame
   */
  render(audioLevels) {
    const { bass, mid, high, overall, isBeat, beatIntensity } = audioLevels;
    const ctx = this.ctx;

    // Trigger shockwave on beat kick
    if (isBeat) {
      this.triggerShockwave(beatIntensity);
    }

    // 1. Draw Space Background with Trail Decay
    // Instead of clearRect, we draw a semi-transparent dark rectangle for smooth motion trails
    const trailAlpha = 0.28 - overall * 0.1; // Less trail during loud energetic parts
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(4, 13, 9, ${trailAlpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Cosmic Nebula Background Glow (Breathes with sub-bass)
    const nebulaRadius = (this.qrSafeRadius * 2.2) + bass * 120;
    const nebulaGrad = ctx.createRadialGradient(
      this.centerX, this.centerY, this.qrSafeRadius * 0.4,
      this.centerX, this.centerY, nebulaRadius
    );
    nebulaGrad.addColorStop(0, this.currentTheme.centerGrad[0]);
    nebulaGrad.addColorStop(0.5, `rgba(${this.currentTheme.primary[0]}, ${this.currentTheme.primary[1]}, ${this.currentTheme.primary[2]}, ${0.08 + bass * 0.18})`);
    nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = nebulaGrad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, nebulaRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Switch to Additive Blending for Glowing Stardust
    ctx.globalCompositeOperation = 'lighter';

    // 4. Update & Draw Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha *= 0.96;

      if (sw.alpha > 0.02 && sw.radius < sw.maxRadius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.currentTheme.haloRgb}, ${sw.alpha * 0.7})`;
        ctx.lineWidth = sw.thickness * (1 - sw.radius / sw.maxRadius);
        ctx.stroke();
        ctx.restore();
      } else {
        this.shockwaves.splice(i, 1);
      }
    }

    // 5. Update & Draw Particles
    const swirlBoost = 1 + mid * 2.5; // Mids increase vortex spin
    const highShimmer = high * 1.5;   // Highs increase sparkle

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Swirl angle progression
      p.angle += p.speed * swirlBoost;

      // React to active shockwaves (push particles outward)
      let shockwaveDisplacement = 0;
      for (let s = 0; s < this.shockwaves.length; s++) {
        const sw = this.shockwaves[s];
        const distDiff = Math.abs(p.baseRadius - sw.radius);
        if (distDiff < sw.thickness) {
          const force = (1 - distDiff / sw.thickness) * sw.intensity * 25;
          shockwaveDisplacement += force;
        }
      }

      // Smooth radial spring dynamics
      p.radialVelocity = (p.radialVelocity + shockwaveDisplacement * 0.3) * 0.85;
      p.radialOffset += p.radialVelocity;
      p.radialOffset *= 0.92; // Decay back to base orbit

      const r = p.baseRadius + p.radialOffset + (bass * 35);
      const x = this.centerX + Math.cos(p.angle) * r;
      const y = this.centerY + Math.sin(p.angle) * r;

      // Twinkle & shimmer calculation
      p.twinklePhase += p.twinkleSpeed + highShimmer * 0.1;
      const shimmer = (Math.sin(p.twinklePhase) + 1) * 0.5;
      const alpha = Math.min(1.0, (p.baseAlpha + shimmer * 0.4 + highShimmer * 0.3) * (0.6 + overall * 0.4));
      const currentSize = p.size * (1 + (bass * 0.5) + (shimmer * 0.3));

      // Draw particle dot
      ctx.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, currentSize, 0, Math.PI * 2);
      ctx.fill();

      // For larger accent particles, draw subtle glowing flare
      if (p.size > 2.2 && (alpha > 0.7 || high > 0.4)) {
        ctx.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${alpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(x, y, currentSize * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Reactive Audio Spectrum Halo Ring (Circling the QR Sanctuary)
    this.renderAudioSpectrumHalo(audioLevels);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Renders a circular audio equalizer ring wrapping around the QR code's perimeter
   */
  renderAudioSpectrumHalo(audioLevels) {
    const ctx = this.ctx;
    const { bass, overall } = audioLevels;
    const barCount = this.spectrumBars;
    const radius = this.qrSafeRadius + 8;
    const baseBarHeight = 6 + bass * 14;

    ctx.save();
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 + this.vortexAngle;
      // Procedural pseudo-frequency variation around perimeter
      const freqVar = Math.sin(i * 3 + performance.now() * 0.005) * 0.5 + 0.5;
      const barLen = baseBarHeight + freqVar * (15 + bass * 35);

      const x1 = this.centerX + Math.cos(angle) * radius;
      const y1 = this.centerY + Math.sin(angle) * radius;
      const x2 = this.centerX + Math.cos(angle) * (radius + barLen);
      const y2 = this.centerY + Math.sin(angle) * (radius + barLen);

      const alpha = 0.35 + (bass * 0.5) + (freqVar * 0.25);
      ctx.strokeStyle = `rgba(${this.currentTheme.haloRgb}, ${alpha})`;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    this.vortexAngle += 0.004 + (overall * 0.008);
  }
}

window.ParticleVortex = ParticleVortex;
