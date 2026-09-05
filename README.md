# ✨ DJ Beatchic • Music-Reactive Stardust QR Display

A lightweight, GPU-accelerated **music-reactive visualizer and scannable QR display** built specifically for DJ booths. It surrounds your QR code with an audio-reactive cosmic stardust vortex that dances to Serato DJ beats while keeping your QR code 100% phone-scannable.

Includes a matching **Mobile Multi-Link Hub** for tips (Venmo, Cash App, PayPal) and social profiles (Instagram, SoundCloud, Spotify, TikTok).

---

## 🚀 Instant Quickstart (Local Test)

To preview the display right now on your machine:

```bash
# In this directory (/Users/rashmi/karthik/dev/dj-display)
python3 -m http.server 8080
```
Open **`http://localhost:8080`** in your browser (Chrome, Edge, Safari, or Firefox).

* Click **"Test Beat Mode (126 BPM Demo)"** to see the particle vortex and kick-drum shockwaves in action without any cables!
* Click **"Enable Live Audio"** to let the display react to live music from your laptop mic or Serato DJ line-in.

---

## 🌐 Architecture & Domain Setup (djbeatchic.com)

1. A `CNAME` file with `djbeatchic.com` is already included in the repository.
2. Structure:
   * **`https://djbeatchic.com/`** (Root `index.html`) → **Main Website & Link Hub** (Bio, Tip Jar via Venmo/CashApp/PayPal, and Social Profiles).
   * **`https://djbeatchic.com/display/`** (`display/index.html`) → **Live Music-Reactive Display** for your DJ booth.
3. The QR code on the display automatically directs crowd phone cameras to **`https://djbeatchic.com/`**!
4. Once pushed to your GitHub repository, load **`https://djbeatchic.com/display/`** on your Android tablet, Raspberry Pi, or laptop.


### Option 2: Netlify or Vercel (Drag-and-Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop) or [Vercel](https://vercel.com).
2. Drag and drop this `dj-display` folder onto the page.
3. You get an instant custom HTTPS URL (e.g., `https://djbeatchic.netlify.app`) with free SSL!

---

## 📱 Hardware & DJ Booth Setup

### A. Android Tablet Setup
1. Open Chrome on your Android tablet and navigate to your hosted URL.
2. Tap the menu (`⋮`) and tap **"Add to Home screen"** or **"Install app"** (this turns it into a standalone fullscreen app without browser address bars).
3. Mount the tablet to your DJ booth or coffin facing the dance floor.
4. Tap **"Enable Live Audio"** and the tablet's built-in microphone will listen to the club sound.

### B. Raspberry Pi + Portable Monitor Setup
For a dedicated, plug-and-play booth display:
1. Connect your portable HDMI/USB-C monitor to the Raspberry Pi.
2. Launch Chromium in fullscreen kiosk mode on startup:
   ```bash
   chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:8080
   ```
3. Plug a cheap USB audio capture card or USB microphone into the Pi:
   * Run the Serato Booth Out (RCA) into the Pi's USB line-in for clean, noise-free bass detection without crowd screaming.

### C. Laptop as Fallback
* Simply open `index.html` in Chrome and press `F` to enter borderless fullscreen.

---

## 🎛️ Audio Routing with Serato DJ

You have two simple ways to feed audio into the visualizer:

1. **Microphone (Zero Cables)**:
   * Uses your tablet/laptop/Pi microphone.
   * Great for quick gigs or when you don't want extra cords.
   * Adjust the **Audio Sensitivity** slider in Settings (`⚙`) to match the venue volume.

2. **Direct Line-In / Serato Booth Out (Studio Precision)**:
   * Connect an RCA-to-3.5mm cable from your Serato DJ controller's **Booth Out** or **Master 2** into your display device's Line-In or USB audio interface.
   * In the display settings (`⚙`), select your audio interface from the **"Audio Input Device"** dropdown.
   * Isolates crisp kick drums and sub-bass shockwaves without crowd background noise.

---

## ⚡ Keyboard Shortcuts (Booth Quick Controls)

* **`F`** — Toggle True Fullscreen
* **`S`** — Open/Close Booth Settings Drawer
* **`D`** — Toggle Test Beat Mode (126 BPM autonomous house beat)
* **`M`** — Toggle Live Audio Input

---

## 🎨 Customizing Your Hub & Links

The mobile hub files are located in `hub/`:
* Open `hub/index.html` to update your Venmo, Cash App, PayPal handles, or social links:
  * Venmo: `https://venmo.com/DJBeatchic`
  * Cash App: `https://cash.app/$DJBeatchic`
  * PayPal: `https://paypal.me/DJBeatchic`
  * Instagram: `https://instagram.com/djbeatchic`
  * SoundCloud: `https://soundcloud.com/djbeatchic`
  * TikTok: `https://tiktok.com/@djbeatchic`

All changes will be reflected when guests scan the QR code!
