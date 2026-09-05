/**
 * QR Code Renderer for DJ Beatchic
 * Generates phone-scannable QR codes with Level H error correction,
 * high-contrast protection zone, and custom center monogram badge.
 */

class QrRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.size = 280; // Default canvas size
    this.padding = 18;
    this.currentUrl = '';
    this.djName = 'DJ BEATCHIC';
  }

  /**
   * Generates and renders the QR code with center badge
   */
  render(url, djName = 'DJ BEATCHIC') {
    this.currentUrl = url || window.location.href;
    this.djName = djName;

    // Use Level H (30% error correction) so center badge does not break scanning
    const qr = new QRCode(0, QRErrorCorrectLevel.H);
    qr.addData(this.currentUrl);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.size * dpr;
    this.canvas.height = this.size * dpr;
    this.canvas.style.width = `${this.size}px`;
    this.canvas.style.height = `${this.size}px`;

    const ctx = this.ctx;
    ctx.scale(dpr, dpr);

    // 1. Crisp White / Platinum Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.size, this.size);

    // 2. Subtle outer safety border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, this.size - 2, this.size - 2);

    const innerSize = this.size - (this.padding * 2);
    const moduleSize = innerSize / moduleCount;

    // Center badge dimensions (occupies ~22% of center area)
    const centerModuleRadius = Math.floor(moduleCount * 0.16);
    const centerModuleMin = Math.floor(moduleCount / 2) - centerModuleRadius;
    const centerModuleMax = Math.floor(moduleCount / 2) + centerModuleRadius;

    // 3. Render QR Modules
    ctx.fillStyle = '#060a08'; // Deepest emerald black for maximum contrast

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // Skip modules in center badge area (covered by error correction)
        if (
          row >= centerModuleMin && row <= centerModuleMax &&
          col >= centerModuleMin && col <= centerModuleMax
        ) {
          continue;
        }

        if (qr.isDark(row, col)) {
          const x = this.padding + col * moduleSize;
          const y = this.padding + row * moduleSize;

          // Corner finder patterns stay sharp squares; data modules have slight rounded styling
          const isFinder = (
            (row < 7 && col < 7) ||
            (row < 7 && col >= moduleCount - 7) ||
            (row >= moduleCount - 7 && col < 7)
          );

          if (isFinder) {
            ctx.fillRect(x, y, moduleSize + 0.3, moduleSize + 0.3);
          } else {
            // Slight roundness for a premium look while preserving phone readability
            this.drawRoundedRect(ctx, x, y, moduleSize + 0.2, moduleSize + 0.2, moduleSize * 0.2);
          }
        }
      }
    }

    // 4. Center Monogram Badge ("BC")
    const badgeCenter = this.size / 2;
    const badgeSize = (centerModuleRadius * 2 + 1) * moduleSize;

    // White badge cushion
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(badgeCenter, badgeCenter, badgeSize * 0.58, 0, Math.PI * 2);
    ctx.fill();

    // Dark Emerald Inner Badge Ring
    ctx.fillStyle = '#041d14';
    ctx.beginPath();
    ctx.arc(badgeCenter, badgeCenter, badgeSize * 0.50, 0, Math.PI * 2);
    ctx.fill();

    // Emerald Edge Accent
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(badgeCenter, badgeCenter, badgeSize * 0.50, 0, Math.PI * 2);
    ctx.stroke();

    // Center Initials / DJ Monogram
    ctx.fillStyle = '#00ff88';
    ctx.font = `bold ${Math.round(badgeSize * 0.42)}px 'Inter', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BC', badgeCenter, badgeCenter + 1);
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}

window.QrRenderer = QrRenderer;
