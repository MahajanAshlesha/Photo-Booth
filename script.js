// ════════════════════════════════════════
// cutie booth — script.js
// User picks ONE filter on landing page
// and ALL photos get that filter applied
// ════════════════════════════════════════

// ── DOM ──
const btnStart      = document.getElementById('btnStart');
const btnShoot      = document.getElementById('btnShoot');
const btnDownload   = document.getElementById('btnDownload');
const btnRetake     = document.getElementById('btnRetake');
const video         = document.getElementById('video');
const captureCanvas = document.getElementById('captureCanvas');
const filmCanvas    = document.getElementById('filmCanvas');
const flash         = document.getElementById('flash');
const countdownNum  = document.getElementById('countdownNum');
const frameCounter  = document.getElementById('frameCounter');
const shootHint     = document.getElementById('shootHint');
const thumbStrip    = document.getElementById('thumbStrip');
const vfModeTag     = document.getElementById('vfModeTag');
const vfFilterTag   = document.getElementById('vfFilterTag');

// ── State ──
let photos         = [];
let stream         = null;
let shooting       = false;
let selectedMode   = 'filmstrip';
let selectedCount  = 4;
let selectedFilter = 'warm';

// Filter display names
const FILTER_NAMES = {
  warm:      'warm film',
  faded:     'faded',
  lightleak: 'light leak',
  cross:     'vivid',
  bw:        'b & w',
  cool:      'cool blue',
};

// Flash colours per filter
const FLASH_COLORS = {
  warm:      '#f5cba7',
  faded:     '#e8e0d5',
  lightleak: '#f9d776',
  cross:     '#56ccf2',
  bw:        '#ffffff',
  cool:      '#a8d8ea',
};

// ════════════════════════════════════════
// LANDING SELECTIONS
// ════════════════════════════════════════
function selectMode(btn) {
  document.querySelectorAll('.pill[data-mode]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedMode = btn.dataset.mode;
}

function selectCount(btn) {
  document.querySelectorAll('.count-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedCount = parseInt(btn.dataset.count);
}

function selectFilter(btn) {
  document.querySelectorAll('.filter-card').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedFilter = btn.dataset.filter;
}

// ════════════════════════════════════════
// START CAMERA
// ════════════════════════════════════════
btnStart.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    buildThumbs();
    vfModeTag.textContent   = selectedMode === 'filmstrip' ? '🎞 film strip' : '📷 polaroid';
    vfFilterTag.textContent = FILTER_NAMES[selectedFilter];
    frameCounter.textContent = `1 / ${selectedCount}`;
    shootHint.textContent   = 'click to snap ✿';

    showScreen('screen-camera');
  } catch (err) {
    alert('Camera access denied! Please allow camera and try again.');
  }
});

function buildThumbs() {
  thumbStrip.innerHTML = '';
  for (let i = 0; i < selectedCount; i++) {
    const slot = document.createElement('div');
    slot.className = 'thumb-slot';
    slot.id = `slot${i}`;
    slot.innerHTML = `<span class="slot-num">${i + 1}</span>`;
    thumbStrip.appendChild(slot);
  }
}

// ════════════════════════════════════════
// COUNTDOWN + SHOOT
// ════════════════════════════════════════
btnShoot.addEventListener('click', () => {
  if (shooting) return;
  startCountdown();
});

async function startCountdown() {
  shooting = true;
  btnShoot.disabled = true;
  shootHint.textContent = 'get ready...';

  for (let i = 3; i >= 1; i--) {
    countdownNum.textContent = i;
    countdownNum.classList.add('show');
    await wait(650);
    countdownNum.classList.remove('show');
    await wait(180);
  }

  // Flash colour matches the filter
  flash.style.background = FLASH_COLORS[selectedFilter];
  flash.classList.add('go');
  setTimeout(() => flash.classList.remove('go'), 220);

  launchConfetti();
  await wait(150);
  capturePhoto();
}

// ════════════════════════════════════════
// CAPTURE + APPLY CHOSEN FILTER
// ════════════════════════════════════════
function capturePhoto() {
  const W = video.videoWidth  || 640;
  const H = video.videoHeight || 480;

  captureCanvas.width  = W;
  captureCanvas.height = H;

  const ctx = captureCanvas.getContext('2d');
  ctx.save();
  ctx.translate(W, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, W, H);
  ctx.restore();

  // Apply the user's chosen filter to EVERY photo
  applyFilter(ctx, W, H, selectedFilter);

  const dataURL = captureCanvas.toDataURL('image/jpeg', 0.92);
  const index   = photos.length;
  photos.push(dataURL);

  // Fill thumbnail
  const slot = document.getElementById(`slot${index}`);
  slot.innerHTML = '';
  slot.classList.add('filled');
  const img = document.createElement('img');
  img.src = dataURL;
  slot.appendChild(img);

  shooting = false;
  btnShoot.disabled = false;

  if (photos.length < selectedCount) {
    const next = photos.length + 1;
    frameCounter.textContent = `${next} / ${selectedCount}`;
    shootHint.textContent    = `click to snap ✿`;
  } else {
    shootHint.textContent = 'developing... ✿';
    setTimeout(() => {
      stopCamera();
      if (selectedMode === 'filmstrip') buildFilmStrip();
      else buildPolaroids();
      showScreen('screen-result');
    }, 800);
  }
}

// ════════════════════════════════════════
// FILTERS — pixel manipulation
// ════════════════════════════════════════
function applyFilter(ctx, W, H, name) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i+1], b = d[i+2];

    if (name === 'warm') {
      // Warm golden sepia
      const grey = r * 0.299 + g * 0.587 + b * 0.114;
      r = Math.min(255, grey * 1.1 + 48);
      g = Math.min(255, grey * 0.92 + 22);
      b = Math.min(255, grey * 0.72);
      r = r * 0.88 + 18; g = g * 0.88 + 10; b = b * 0.88 + 6;

    } else if (name === 'faded') {
      // Soft faded pastel
      r = r * 0.72 + 58;
      g = g * 0.72 + 54;
      b = b * 0.72 + 65;

    } else if (name === 'lightleak') {
      // Warm orange light leak from the right
      const px = (i / 4) % W;
      const leak = Math.max(0, (px / W - 0.45) * 1.8);
      r = Math.min(255, r * 0.85 + 38 + leak * 90);
      g = Math.min(255, g * 0.82 + 18 + leak * 35);
      b = Math.min(255, b * 0.75 + leak * 5);

    } else if (name === 'cross') {
      // Vivid cross-processed — punchy and saturated
      r = Math.min(255, Math.pow(r / 255, 0.85) * 255 * 1.1);
      g = Math.min(255, g * 1.25 + 8);
      b = Math.min(255, b * 0.85 + 25);

    } else if (name === 'bw') {
      // Black and white with high contrast
      const grey = r * 0.299 + g * 0.587 + b * 0.114;
      const contrast = (grey - 128) * 1.2 + 128;
      r = g = b = Math.max(0, Math.min(255, contrast));

    } else if (name === 'cool') {
      // Cool blue — moody, slightly desaturated
      r = Math.min(255, r * 0.85 + 10);
      g = Math.min(255, g * 0.92 + 12);
      b = Math.min(255, b * 1.1  + 28);
    }

    // Light grain on all filters
    const grain = (Math.random() - 0.5) * 16;
    d[i]   = Math.max(0, Math.min(255, r + grain));
    d[i+1] = Math.max(0, Math.min(255, g + grain));
    d[i+2] = Math.max(0, Math.min(255, b + grain));
  }

  ctx.putImageData(imageData, 0, 0);
}

// ════════════════════════════════════════
// BUILD FILM STRIP
// ════════════════════════════════════════
function buildFilmStrip() {
  const PHOTO_W = 220;
  const PHOTO_H = 165;
  const PAD_X   = 32;
  const PAD_TOP = 46;
  const GAP     = 16;
  const STRIP_W = PHOTO_W + PAD_X * 2;
  const STRIP_H = PAD_TOP + selectedCount * PHOTO_H + (selectedCount - 1) * GAP + 64;

  filmCanvas.width  = STRIP_W;
  filmCanvas.height = STRIP_H;

  const ctx = filmCanvas.getContext('2d');

  // Dark strip
  ctx.fillStyle = '#111009';
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);

  drawSprockets(ctx, STRIP_W, STRIP_H);

  const promises = photos.map((url, i) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const y     = PAD_TOP + i * (PHOTO_H + GAP);
      const x     = PAD_X;
      const angle = (Math.random() - 0.5) * 0.014;

      ctx.save();
      ctx.translate(x + PHOTO_W / 2, y + PHOTO_H / 2);
      ctx.rotate(angle);

      // White border
      ctx.fillStyle = '#fff8f0';
      ctx.fillRect(-PHOTO_W/2 - 5, -PHOTO_H/2 - 5, PHOTO_W + 10, PHOTO_H + 10);
      ctx.drawImage(img, -PHOTO_W/2, -PHOTO_H/2, PHOTO_W, PHOTO_H);

      // Light scratches
      ctx.strokeStyle = 'rgba(255,240,200,0.04)';
      ctx.lineWidth = 0.5;
      for (let s = 0; s < 2; s++) {
        const sx = (Math.random() - 0.5) * PHOTO_W;
        ctx.beginPath();
        ctx.moveTo(sx, -PHOTO_H/2);
        ctx.lineTo(sx + (Math.random()-0.5)*10, PHOTO_H/2);
        ctx.stroke();
      }
      ctx.restore();
      resolve();
    };
    img.src = url;
  }));

  Promise.all(promises).then(() => {
    const date = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase();
    ctx.fillStyle = 'rgba(255, 220, 150, 0.45)';
    ctx.font = '11px Architects Daughter, cursive';
    ctx.textAlign = 'center';
    ctx.fillText(`cutie booth  ✿  ${FILTER_NAMES[selectedFilter].toUpperCase()}  ·  ${date}`, STRIP_W/2, STRIP_H - 20);
    addGrain(ctx, STRIP_W, STRIP_H);
  });
}

// ════════════════════════════════════════
// BUILD POLAROIDS
// ════════════════════════════════════════
function buildPolaroids() {
  const COLS   = selectedCount <= 2 ? 1 : 2;
  const ROWS   = Math.ceil(selectedCount / COLS);
  const PW     = 200, PH = 155;
  const BDR    = 14, BOT = 48;
  const POL_W  = PW + BDR * 2;
  const POL_H  = PH + BDR + BOT;
  const PAD    = 24;
  const CW     = COLS * POL_W + (COLS + 1) * PAD;
  const CH     = ROWS * POL_H + (ROWS + 1) * PAD + 44;

  filmCanvas.width  = CW;
  filmCanvas.height = CH;

  const ctx = filmCanvas.getContext('2d');

  // Cream scrapbook background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, CW, CH);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CW; x += 22) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CH); ctx.stroke(); }
  for (let y = 0; y < CH; y += 22) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke(); }

  const promises = photos.map((url, i) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const col   = i % COLS;
      const row   = Math.floor(i / COLS);
      const bx    = PAD + col * (POL_W + PAD);
      const by    = PAD + row * (POL_H + PAD);
      const angle = (Math.random() - 0.5) * 0.12;

      ctx.save();
      ctx.translate(bx + POL_W/2, by + POL_H/2);
      ctx.rotate(angle);

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur  = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      // White polaroid
      roundRect(ctx, -POL_W/2, -POL_H/2, POL_W, POL_H, 4);
      ctx.fillStyle = '#fffef9';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.drawImage(img, -POL_W/2 + BDR, -POL_H/2 + BDR, PW, PH);

      // Caption line
      ctx.fillStyle = '#ddd6cc';
      ctx.fillRect(-POL_W/2 + 18, POL_H/2 - 24, POL_W - 36, 1);

      // Date + filter name
      const date = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
      ctx.fillStyle = '#a89f95';
      ctx.font = '13px Architects Daughter, cursive';
      ctx.textAlign = 'center';
      ctx.fillText(`${date} · ${FILTER_NAMES[selectedFilter]}`, 0, POL_H/2 - 9);

      ctx.restore();
      resolve();
    };
    img.src = url;
  }));

  Promise.all(promises).then(() => {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.font = '15px Architects Daughter, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('cutie booth ✿', CW/2, CH - 14);
  });
}

// ── Sprocket holes ──
function drawSprockets(ctx, W, H) {
  const hw = 10, hh = 14, count = 14;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let i = 0; i < count; i++) {
    const y = 22 + i * (H - 44) / (count - 1);
    roundRect(ctx, 7, y - hh/2, hw, hh, 2); ctx.fill();
    roundRect(ctx, W - hw - 7, y - hh/2, hw, hh, 2); ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function addGrain(ctx, W, H) {
  const d = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    d.data[i]   = Math.max(0, Math.min(255, d.data[i]   + n));
    d.data[i+1] = Math.max(0, Math.min(255, d.data[i+1] + n));
    d.data[i+2] = Math.max(0, Math.min(255, d.data[i+2] + n));
  }
  ctx.putImageData(d, 0, 0);
}

// ── Confetti ──
function launchConfetti() {
  const container = document.getElementById('confetti');
  const colors = ['#ffb3c6','#fce38a','#b5ead7','#d4b8e0','#b8d8f8','#ffcba4','#ff85a1'];
  for (let i = 0; i < 45; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width  = (Math.random() * 9 + 5) + 'px';
    p.style.height = (Math.random() * 9 + 5) + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    p.style.animationDuration = (Math.random() * 1.4 + 0.9) + 's';
    p.style.animationDelay    = (Math.random() * 0.3) + 's';
    container.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}

// ── Download ──
btnDownload.addEventListener('click', () => {
  const link    = document.createElement('a');
  link.download = `cutie-booth-${selectedMode}-${selectedFilter}-${Date.now()}.png`;
  link.href     = filmCanvas.toDataURL('image/png');
  link.click();
});

// ── Retake ──
btnRetake.addEventListener('click', async () => {
  photos = [];
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    buildThumbs();
    frameCounter.textContent = `1 / ${selectedCount}`;
    shootHint.textContent    = 'click to snap ✿';
    showScreen('screen-camera');
  } catch {
    showScreen('screen-start');
  }
});

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
  const el = document.getElementById(id);
  el.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('active')));
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }