/**
 * PIXEL PAINT STUDIO - ENGINE & INTERACTIVE RECONSTRUCTOR
 * Motor de dibujo pixel-perfect, animación de reconstrucción y gestión de paletas
 */

// ==========================================
// CONFIGURACIÓN Y ESTADO INICIAL
// ==========================================
const STATE = {
  resolution: 64, // 32, 64, 128
  zoom: 8,        // Multiplicador de escala en pantalla (8x = 512px para 64x64)
  tool: 'pencil', // pencil, eraser, eyedropper, bucket, line, rect
  brushSize: 1,   // 1, 2, 4
  currentColor: '#1c1815',
  showGrid: true,
  isDrawing: false,
  lastCoord: null,
  dragStartCoord: null,

  // Audio Synth
  soundEnabled: true,
  audioCtx: null,

  // Reconstrucción
  isReconstructing: false,
  reconstructIndex: 0,
  reconstructSequence: [],
  reconstructTimer: null,
  reconstructSpeed: 25, // píxeles por frame o tick
  pattern: 'scanline',

  // Imagen personalizada subida
  customImage: null,

  // Datos del Avatar / Imagen activa
  avatarData: null,

  // Historial
  history: [],
  historyIndex: -1,
  maxHistory: 25
};

// Paletas predefinidas
const PRESET_PALETTES = {
  pico8: [
    '#000000', '#1D2B53', '#7E2553', '#008751',
    '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
    '#FF004D', '#FFA300', '#FFEC27', '#00E436',
    '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
  ],
  gameboy: [
    '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
  ],
  cyberpunk: [
    '#0d0221', '#0f084b', '#26408b', '#a6cfd5',
    '#c2e7da', '#ff0055', '#00ffcc', '#ffe600'
  ],
  nes: [
    '#7C7C7C', '#0000FC', '#0000BC', '#4428BC',
    '#940084', '#A80020', '#A81000', '#881400',
    '#503000', '#007800', '#006800', '#005800',
    '#004058', '#000000', '#BCBCBC', '#FCFCFC'
  ]
};

// Paleta personalizada del usuario
let customPalette = ['#ffffff', '#000000', '#e2e8f0', '#94a3b8', '#38bdf8', '#818cf8', '#f43f5e', '#fbbf24'];

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const DOM = {
  viewport: document.getElementById('viewport'),
  canvasStage: document.getElementById('canvas-stage'),
  paintCanvas: document.getElementById('paint-canvas'),
  overlayCanvas: document.getElementById('overlay-canvas'),
  ghostImage: document.getElementById('ghost-image'),

  // Chips superiores
  coordDisplay: document.getElementById('coord-display'),
  zoomDisplay: document.getElementById('zoom-display'),
  resDisplay: document.getElementById('res-display'),
  currentColorBadge: document.getElementById('current-color-badge'),
  colorHexDisplay: document.getElementById('color-hex-display'),

  // Botones superiores
  btnUpload: document.getElementById('btn-upload'),
  inputUploadImage: document.getElementById('input-upload-image'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),
  btnClear: document.getElementById('btn-clear'),
  btnExportNative: document.getElementById('btn-export-native'),
  btnExportHd: document.getElementById('btn-export-hd'),

  // Reconstrucción
  btnReconstructStart: document.getElementById('btn-reconstruct-start'),
  txtReconstruct: document.getElementById('txt-reconstruct'),
  iconPlay: document.getElementById('icon-play'),
  btnReconstructStep: document.getElementById('btn-reconstruct-step'),
  btnReconstructInstant: document.getElementById('btn-reconstruct-instant'),
  btnReconstructReset: document.getElementById('btn-reconstruct-reset'),
  selectPattern: document.getElementById('select-pattern'),
  rangeSpeed: document.getElementById('range-speed'),
  speedIndicator: document.getElementById('speed-indicator'),
  checkSound: document.getElementById('check-sound'),
  checkGhostOverlay: document.getElementById('check-ghost-overlay'),
  reconstructStatus: document.getElementById('reconstruct-status'),
  reconstructPercent: document.getElementById('reconstruct-percent'),
  progressBarFill: document.getElementById('progress-bar-fill'),

  // Paleta y color
  nativeColorPicker: document.getElementById('native-color-picker'),
  inputHex: document.getElementById('input-hex'),
  avatarPaletteGrid: document.getElementById('avatar-palette-grid'),
  avatarColorCount: document.getElementById('avatar-color-count'),
  selectPresetPalette: document.getElementById('select-preset-palette'),
  presetPaletteGrid: document.getElementById('preset-palette-grid'),
  customPaletteGrid: document.getElementById('custom-palette-grid'),
  btnAddColor: document.getElementById('btn-add-color'),

  // Controles de vista y zoom
  btnToggleGrid: document.getElementById('btn-toggle-grid'),
  btnZoomIn: document.getElementById('btn-zoom-in'),
  btnZoomOut: document.getElementById('btn-zoom-out'),
  btnZoomReset: document.getElementById('btn-zoom-reset'),

  // Contenedor de Toasts
  toastContainer: document.getElementById('toast-container')
};

// Contextos 2D
const pCtx = DOM.paintCanvas.getContext('2d', { willReadFrequently: true });
const oCtx = DOM.overlayCanvas.getContext('2d');

// Matriz de píxeles en memoria [y][x] = '#RRGGBB' o null (transparente)
let pixelMatrix = [];

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function initApp() {
  setupEventListeners();
  setColor(STATE.currentColor);
  renderPresetPalette('pico8');
  renderCustomPalette();
  
  // Cargar datos procesados de avatar_data.json
  await loadAvatarData();

  // Inicializar canvas en resolución por defecto
  setResolution(64);
  showToast('Bienvenido a Pixel Paint Studio. Listo para recrear píxel a píxel.', 'info');
}

// Cargar avatar_data.json
async function loadAvatarData() {
  try {
    const res = await fetch('avatar_data.json');
    if (!res.ok) throw new Error('No se pudo cargar avatar_data.json');
    STATE.avatarData = await res.json();
    updateAvatarPaletteUI();
  } catch (err) {
    console.error('Error al cargar datos del avatar:', err);
    showToast('Aviso: cargando fallback de imagen para el avatar.', 'warning');
  }
}

// Procesar imagen subida por el usuario
function handleImageUpload(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Por favor selecciona un archivo de imagen válido.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      STATE.customImage = img;
      DOM.ghostImage.src = img.src;

      processImageForResolutions(img);
      updateAvatarPaletteUI();
      resetReconstruction();

      const bannerTitle = document.querySelector('.banner-title h3');
      if (bannerTitle) bannerTitle.textContent = `Reconstructor Píxel a Píxel: ${file.name.slice(0, 18)}`;

      showToast(`¡Imagen "${file.name}" cargada! Lista para recrear píxel a píxel.`, 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function processImageForResolutions(img) {
  if (!STATE.avatarData) STATE.avatarData = {};

  const resolutions = [32, 64, 128];
  resolutions.forEach(res => {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = res;
    offCanvas.height = res;
    const offCtx = offCanvas.getContext('2d');

    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = 'high';
    offCtx.drawImage(img, 0, 0, res, res);

    const imgData = offCtx.getImageData(0, 0, res, res).data;
    const grid = [];
    const colorCounts = {};

    for (let y = 0; y < res; y++) {
      const row = [];
      for (let x = 0; x < res; x++) {
        const idx = (y * res + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const a = imgData[idx + 3];

        let hex = '#ffffff';
        if (a > 25) {
          hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
        }
        row.push(hex);
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
      grid.push(row);
    }

    const sortedPalette = Object.keys(colorCounts)
      .sort((a, b) => colorCounts[b] - colorCounts[a])
      .slice(0, 48);

    STATE.avatarData[res] = {
      resolution: res,
      palette: sortedPalette,
      grid: grid
    };
  });
}

// Actualizar la interfaz de la paleta del avatar según la resolución actual
function updateAvatarPaletteUI() {
  if (!STATE.avatarData || !STATE.avatarData[STATE.resolution]) return;
  const currentSet = STATE.avatarData[STATE.resolution];
  DOM.avatarColorCount.textContent = `${currentSet.palette.length} colores`;
  DOM.avatarPaletteGrid.innerHTML = '';

  currentSet.palette.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    swatch.title = color;
    if (color.toLowerCase() === STATE.currentColor.toLowerCase()) {
      swatch.classList.add('selected');
    }
    swatch.addEventListener('click', () => setColor(color));
    DOM.avatarPaletteGrid.appendChild(swatch);
  });
}

// ==========================================
// GESTIÓN DEL LIENZO Y RESOLUCIÓN
// ==========================================
function setResolution(newRes) {
  STATE.resolution = newRes;
  DOM.resDisplay.textContent = `${newRes} × ${newRes}`;

  // Ajustar dimensiones lógicas
  DOM.paintCanvas.width = newRes;
  DOM.paintCanvas.height = newRes;
  DOM.overlayCanvas.width = newRes;
  DOM.overlayCanvas.height = newRes;

  // Inicializar matriz en blanco
  pixelMatrix = Array.from({ length: newRes }, () => Array(newRes).fill('#ffffff'));

  // Ajustar escala de visualización
  updateCanvasScale();
  redrawMainCanvas();
  renderGrid();
  resetHistory();
  saveHistoryState();
  updateAvatarPaletteUI();

  // Resetear estado del reconstructor
  resetReconstruction();

  // Actualizar botones de resolución
  document.querySelectorAll('.res-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.res) === newRes);
  });
}

function updateCanvasScale() {
  const displaySize = STATE.resolution * STATE.zoom;
  DOM.canvasStage.style.width = `${displaySize}px`;
  DOM.canvasStage.style.height = `${displaySize}px`;
  DOM.paintCanvas.style.width = `${displaySize}px`;
  DOM.paintCanvas.style.height = `${displaySize}px`;
  DOM.overlayCanvas.style.width = `${displaySize}px`;
  DOM.overlayCanvas.style.height = `${displaySize}px`;

  DOM.zoomDisplay.textContent = `${STATE.zoom * 100}%`;
  renderGrid();
}

function redrawMainCanvas() {
  pCtx.clearRect(0, 0, STATE.resolution, STATE.resolution);
  for (let y = 0; y < STATE.resolution; y++) {
    for (let x = 0; x < STATE.resolution; x++) {
      const color = pixelMatrix[y][x];
      if (color) {
        pCtx.fillStyle = color;
        pCtx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function renderGrid() {
  oCtx.clearRect(0, 0, STATE.resolution, STATE.resolution);
  if (!STATE.showGrid || STATE.zoom < 3) return;

  // Dibujar líneas de cuadrícula sutiles
  oCtx.save();
  oCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  oCtx.lineWidth = 0.08;

  for (let i = 0; i <= STATE.resolution; i++) {
    oCtx.beginPath();
    oCtx.moveTo(i, 0);
    oCtx.lineTo(i, STATE.resolution);
    oCtx.stroke();

    oCtx.beginPath();
    oCtx.moveTo(0, i);
    oCtx.lineTo(STATE.resolution, i);
    oCtx.stroke();
  }
  oCtx.restore();
}

// ==========================================
// MOTOR DE DIBUJO Y HERRAMIENTAS
// ==========================================
function getCanvasCoords(e) {
  const rect = DOM.paintCanvas.getBoundingClientRect();
  const scaleX = STATE.resolution / rect.width;
  const scaleY = STATE.resolution / rect.height;

  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  return {
    x: Math.max(0, Math.min(STATE.resolution - 1, x)),
    y: Math.max(0, Math.min(STATE.resolution - 1, y))
  };
}

function setPixel(x, y, color) {
  if (x < 0 || x >= STATE.resolution || y < 0 || y >= STATE.resolution) return;
  pixelMatrix[y][x] = color;
  pCtx.fillStyle = color;
  pCtx.fillRect(x, y, 1, 1);
}

function applyBrush(cx, cy, color) {
  const r = Math.floor(STATE.brushSize / 2);
  for (let dy = -r; dy < STATE.brushSize - r; dy++) {
    for (let dx = -r; dx < STATE.brushSize - r; dx++) {
      setPixel(cx + dx, cy + dy, color);
    }
  }
}

// Algoritmo de línea Bresenham para trazo fluido continuo
function drawLineBresenham(x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    applyBrush(x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// Relleno por inundación (Flood Fill BFS)
function floodFill(startX, startY, targetColor, fillColor) {
  if (targetColor === fillColor) return;
  const queue = [[startX, startY]];
  const visited = new Uint8Array(STATE.resolution * STATE.resolution);

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const idx = y * STATE.resolution + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    if (pixelMatrix[y][x] === targetColor) {
      setPixel(x, y, fillColor);

      if (x > 0) queue.push([x - 1, y]);
      if (x < STATE.resolution - 1) queue.push([x + 1, y]);
      if (y > 0) queue.push([x, y - 1]);
      if (y < STATE.resolution - 1) queue.push([x, y + 1]);
    }
  }
}

// ==========================================
// RECONSTRUCTOR ANIMADO PÍXEL A PÍXEL
// ==========================================
function prepareReconstructionSequence() {
  if (!STATE.avatarData || !STATE.avatarData[STATE.resolution]) {
    showToast('Los datos del avatar no están listos.', 'error');
    return false;
  }

  const grid = STATE.avatarData[STATE.resolution].grid;
  const list = [];
  const res = STATE.resolution;

  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const color = grid[y][x];
      // Calcular luminosidad relativa
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      list.push({ x, y, color, lum });
    }
  }

  // Ordenar según el patrón seleccionado
  const pattern = DOM.selectPattern.value;
  if (pattern === 'scanline') {
    // Ya está ordenado fila a fila
  } else if (pattern === 'column') {
    list.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
  } else if (pattern === 'luminance') {
    // Primero los tonos oscuros (contornos y sombras faciales), luego luces
    list.sort((a, b) => a.lum - b.lum);
  } else if (pattern === 'spiral') {
    const cx = res / 2;
    const cy = res / 2;
    list.sort((a, b) => {
      const distA = Math.hypot(a.x - cx, a.y - cy);
      const distB = Math.hypot(b.x - cx, b.y - cy);
      return distA - distB;
    });
  } else if (pattern === 'scatter') {
    // Barajado Fisher-Yates
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  STATE.reconstructSequence = list;
  STATE.reconstructIndex = 0;
  return true;
}

function startReconstruction() {
  if (STATE.isReconstructing) {
    pauseReconstruction();
    return;
  }

  if (STATE.reconstructSequence.length === 0 || STATE.reconstructIndex >= STATE.reconstructSequence.length) {
    // Si ya completó o es nuevo, limpiar y preparar
    if (!prepareReconstructionSequence()) return;
    // Opcional: fondo limpio
    if (STATE.reconstructIndex === 0) {
      pixelMatrix = Array.from({ length: STATE.resolution }, () => Array(STATE.resolution).fill('#ffffff'));
      redrawMainCanvas();
    }
  }

  STATE.isReconstructing = true;
  DOM.txtReconstruct.textContent = 'Pausar Reconstrucción';
  DOM.iconPlay.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  DOM.reconstructStatus.textContent = 'Pintando píxel a píxel...';

  runReconstructionLoop();
}

function pauseReconstruction() {
  STATE.isReconstructing = false;
  if (STATE.reconstructTimer) {
    cancelAnimationFrame(STATE.reconstructTimer);
    STATE.reconstructTimer = null;
  }
  DOM.txtReconstruct.textContent = 'Reanudar Píxel a Píxel';
  DOM.iconPlay.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  DOM.reconstructStatus.textContent = 'Pausado';
}

function resetReconstruction() {
  pauseReconstruction();
  STATE.reconstructIndex = 0;
  STATE.reconstructSequence = [];
  DOM.txtReconstruct.textContent = 'Recrear Píxel a Píxel';
  DOM.reconstructStatus.textContent = 'Listo para reconstruir';
  DOM.reconstructPercent.textContent = `0% (0 / ${STATE.resolution * STATE.resolution} px)`;
  DOM.progressBarFill.style.width = '0%';
}

function runReconstructionLoop() {
  if (!STATE.isReconstructing) return;

  const total = STATE.reconstructSequence.length;
  const pixelsPerTick = Math.max(1, STATE.reconstructSpeed);

  for (let i = 0; i < pixelsPerTick && STATE.reconstructIndex < total; i++) {
    const item = STATE.reconstructSequence[STATE.reconstructIndex];
    setPixel(item.x, item.y, item.color);
    STATE.reconstructIndex++;

    // Tocar sonido cada N píxeles para ritmo agradable
    if (STATE.soundEnabled && (STATE.reconstructIndex % Math.max(1, Math.floor(pixelsPerTick / 2)) === 0)) {
      playSynthBlip(item.lum);
    }
  }

  // Actualizar UI
  const current = STATE.reconstructIndex;
  const pct = ((current / total) * 100).toFixed(1);
  DOM.reconstructPercent.textContent = `${pct}% (${current} / ${total} px)`;
  DOM.progressBarFill.style.width = `${pct}%`;

  if (current > 0) {
    const lastItem = STATE.reconstructSequence[current - 1];
    DOM.coordDisplay.textContent = `X: ${lastItem.x}, Y: ${lastItem.y}`;
    DOM.currentColorBadge.style.backgroundColor = lastItem.color;
    DOM.colorHexDisplay.textContent = lastItem.color.toUpperCase();
  }

  if (STATE.reconstructIndex >= total) {
    STATE.isReconstructing = false;
    DOM.txtReconstruct.textContent = 'Completado con Éxito';
    DOM.iconPlay.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    DOM.reconstructStatus.textContent = '¡Avatar recreado en su totalidad!';
    saveHistoryState();
    showToast('¡Recreación completa píxel a píxel terminada!', 'success');
    return;
  }

  STATE.reconstructTimer = requestAnimationFrame(runReconstructionLoop);
}

function stepReconstruction(count = 10) {
  if (STATE.reconstructSequence.length === 0) {
    if (!prepareReconstructionSequence()) return;
  }
  pauseReconstruction();

  const total = STATE.reconstructSequence.length;
  for (let i = 0; i < count && STATE.reconstructIndex < total; i++) {
    const item = STATE.reconstructSequence[STATE.reconstructIndex];
    setPixel(item.x, item.y, item.color);
    STATE.reconstructIndex++;
  }

  const current = STATE.reconstructIndex;
  const pct = ((current / total) * 100).toFixed(1);
  DOM.reconstructPercent.textContent = `${pct}% (${current} / ${total} px)`;
  DOM.progressBarFill.style.width = `${pct}%`;
  renderGrid();
}

function completeInstantReconstruction() {
  if (!STATE.avatarData || !STATE.avatarData[STATE.resolution]) return;
  pauseReconstruction();

  const grid = STATE.avatarData[STATE.resolution].grid;
  for (let y = 0; y < STATE.resolution; y++) {
    for (let x = 0; x < STATE.resolution; x++) {
      setPixel(x, y, grid[y][x]);
    }
  }

  const total = STATE.resolution * STATE.resolution;
  STATE.reconstructIndex = total;
  DOM.reconstructPercent.textContent = `100% (${total} / ${total} px)`;
  DOM.progressBarFill.style.width = '100%';
  DOM.reconstructStatus.textContent = 'Completado de forma instantánea';
  saveHistoryState();
  showToast('Lienzo sincronizado con el avatar completo.', 'success');
}

// ==========================================
// EFECTO DE SONIDO RETRO SYNTH (WEB AUDIO)
// ==========================================
function playSynthBlip(lum = 128) {
  try {
    if (!STATE.audioCtx) {
      STATE.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (STATE.audioCtx.state === 'suspended') {
      STATE.audioCtx.resume();
    }

    const osc = STATE.audioCtx.createOscillator();
    const gain = STATE.audioCtx.createGain();

    // Mapear luminosidad a tono (tono más agudo para luces, grave para sombras)
    const baseFreq = 220 + (lum / 255) * 600;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, STATE.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, STATE.audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, STATE.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, STATE.audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(STATE.audioCtx.destination);

    osc.start();
    osc.stop(STATE.audioCtx.currentTime + 0.05);
  } catch (e) {
    // Silencio si el navegador bloquea audio sin interacción inicial
  }
}

// ==========================================
// GESTIÓN DE COLOR Y PALETAS
// ==========================================
function setColor(hex) {
  STATE.currentColor = hex;
  DOM.nativeColorPicker.value = hex;
  DOM.inputHex.value = hex.toUpperCase();
  DOM.currentColorBadge.style.backgroundColor = hex;
  DOM.colorHexDisplay.textContent = hex.toUpperCase();

  // Resaltar swatch activo en las paletas
  document.querySelectorAll('.swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.title.toLowerCase() === hex.toLowerCase());
  });
}

function renderPresetPalette(presetKey) {
  const colors = PRESET_PALETTES[presetKey] || PRESET_PALETTES.pico8;
  DOM.presetPaletteGrid.innerHTML = '';

  colors.forEach(col => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.backgroundColor = col;
    sw.title = col;
    sw.addEventListener('click', () => setColor(col));
    DOM.presetPaletteGrid.appendChild(sw);
  });
}

function renderCustomPalette() {
  DOM.customPaletteGrid.innerHTML = '';
  customPalette.forEach(col => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.backgroundColor = col;
    sw.title = col;
    sw.addEventListener('click', () => setColor(col));
    DOM.customPaletteGrid.appendChild(sw);
  });
}

// ==========================================
// HISTORIAL (UNDO / REDO)
// ==========================================
function saveHistoryState() {
  // Truncar futuro si estamos en medio
  if (STATE.historyIndex < STATE.history.length - 1) {
    STATE.history = STATE.history.slice(0, STATE.historyIndex + 1);
  }

  // Copia profunda de la matriz
  const snapshot = pixelMatrix.map(row => [...row]);
  STATE.history.push(snapshot);

  if (STATE.history.length > STATE.maxHistory) {
    STATE.history.shift();
  } else {
    STATE.historyIndex++;
  }
}

function resetHistory() {
  STATE.history = [];
  STATE.historyIndex = -1;
}

function undo() {
  if (STATE.historyIndex > 0) {
    STATE.historyIndex--;
    const snapshot = STATE.history[STATE.historyIndex];
    pixelMatrix = snapshot.map(row => [...row]);
    redrawMainCanvas();
    renderGrid();
    showToast('Deshecho', 'info');
  }
}

function redo() {
  if (STATE.historyIndex < STATE.history.length - 1) {
    STATE.historyIndex++;
    const snapshot = STATE.history[STATE.historyIndex];
    pixelMatrix = snapshot.map(row => [...row]);
    redrawMainCanvas();
    renderGrid();
    showToast('Rehecho', 'info');
  }
}

// ==========================================
// EXPORTACIÓN DE IMÁGENES
// ==========================================
function exportNativePNG() {
  const link = document.createElement('a');
  link.download = `avatar_recreated_${STATE.resolution}x${STATE.resolution}.png`;
  link.href = DOM.paintCanvas.toDataURL('image/png');
  link.click();
  showToast(`Descargado en ${STATE.resolution}×${STATE.resolution} px`, 'success');
}

function exportHdPNG() {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const expCtx = exportCanvas.getContext('2d');

  expCtx.imageSmoothingEnabled = false;
  expCtx.drawImage(DOM.paintCanvas, 0, 0, 1024, 1024);

  const link = document.createElement('a');
  link.download = `avatar_pixel_art_HD_1024x1024.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
  showToast('Exportado nítido a 1024×1024 px con éxito', 'success');
}

// ==========================================
// NOTIFICACIONES TOAST
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ==========================================
// EVENT LISTENERS Y VINCULACIÓN
// ==========================================
function setupEventListeners() {
  // Herramientas
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.tool = btn.dataset.tool;
    });
  });

  // Tamaños de pincel
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.brushSize = parseInt(btn.dataset.size);
    });
  });

  // Resoluciones
  document.querySelectorAll('.res-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = parseInt(btn.dataset.res);
      if (res !== STATE.resolution) {
        setResolution(res);
      }
    });
  });

  // Canvas Mouse Events
  DOM.paintCanvas.addEventListener('mousedown', (e) => {
    STATE.isDrawing = true;
    const coords = getCanvasCoords(e);
    STATE.lastCoord = coords;
    STATE.dragStartCoord = coords;

    if (STATE.tool === 'pencil') {
      applyBrush(coords.x, coords.y, STATE.currentColor);
    } else if (STATE.tool === 'eraser') {
      applyBrush(coords.x, coords.y, '#ffffff');
    } else if (STATE.tool === 'eyedropper') {
      const sampled = pixelMatrix[coords.y][coords.x];
      if (sampled) setColor(sampled);
    } else if (STATE.tool === 'bucket') {
      const target = pixelMatrix[coords.y][coords.x];
      floodFill(coords.x, coords.y, target, STATE.currentColor);
      saveHistoryState();
    }
  });

  window.addEventListener('mousemove', (e) => {
    const coords = getCanvasCoords(e);
    DOM.coordDisplay.textContent = `X: ${coords.x}, Y: ${coords.y}`;

    // Vista previa de cursor y herramientas en overlay
    renderCursorOverlay(coords);

    if (!STATE.isDrawing) return;

    if (STATE.tool === 'pencil') {
      drawLineBresenham(STATE.lastCoord.x, STATE.lastCoord.y, coords.x, coords.y, STATE.currentColor);
      STATE.lastCoord = coords;
    } else if (STATE.tool === 'eraser') {
      drawLineBresenham(STATE.lastCoord.x, STATE.lastCoord.y, coords.x, coords.y, '#ffffff');
      STATE.lastCoord = coords;
    } else if (STATE.tool === 'line' || STATE.tool === 'rect') {
      // Dibujar vista previa en overlayCanvas
      renderShapePreview(STATE.dragStartCoord, coords);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (!STATE.isDrawing) return;
    STATE.isDrawing = false;

    const coords = getCanvasCoords(e);
    if (STATE.tool === 'line' && STATE.dragStartCoord) {
      drawLineBresenham(STATE.dragStartCoord.x, STATE.dragStartCoord.y, coords.x, coords.y, STATE.currentColor);
    } else if (STATE.tool === 'rect' && STATE.dragStartCoord) {
      const x0 = Math.min(STATE.dragStartCoord.x, coords.x);
      const x1 = Math.max(STATE.dragStartCoord.x, coords.x);
      const y0 = Math.min(STATE.dragStartCoord.y, coords.y);
      const y1 = Math.max(STATE.dragStartCoord.y, coords.y);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          setPixel(x, y, STATE.currentColor);
        }
      }
    }

    renderGrid();
    saveHistoryState();
  });

  // Zoom con rueda de ratón sobre el viewport
  DOM.viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      STATE.zoom = Math.min(24, STATE.zoom + 1);
    } else {
      STATE.zoom = Math.max(1, STATE.zoom - 1);
    }
    updateCanvasScale();
  }, { passive: false });

  DOM.btnZoomIn.addEventListener('click', () => {
    STATE.zoom = Math.min(24, STATE.zoom + 1);
    updateCanvasScale();
  });

  DOM.btnZoomOut.addEventListener('click', () => {
    STATE.zoom = Math.max(1, STATE.zoom - 1);
    updateCanvasScale();
  });

  DOM.btnZoomReset.addEventListener('click', () => {
    STATE.zoom = STATE.resolution === 32 ? 14 : (STATE.resolution === 64 ? 8 : 4);
    updateCanvasScale();
  });

  // Reconstrucción Controles
  DOM.btnReconstructStart.addEventListener('click', startReconstruction);
  DOM.btnReconstructStep.addEventListener('click', () => stepReconstruction(15));
  DOM.btnReconstructInstant.addEventListener('click', completeInstantReconstruction);
  DOM.btnReconstructReset.addEventListener('click', resetReconstruction);

  DOM.selectPattern.addEventListener('change', () => {
    STATE.pattern = DOM.selectPattern.value;
    resetReconstruction();
  });

  DOM.rangeSpeed.addEventListener('input', () => {
    STATE.reconstructSpeed = parseInt(DOM.rangeSpeed.value);
    let label = 'Normal';
    if (STATE.reconstructSpeed < 10) label = 'Lento';
    else if (STATE.reconstructSpeed > 60) label = 'Ultra';
    else if (STATE.reconstructSpeed > 20) label = 'Rápido';
    DOM.speedIndicator.textContent = `${STATE.reconstructSpeed}x (${label})`;
  });

  DOM.checkSound.addEventListener('change', () => {
    STATE.soundEnabled = DOM.checkSound.checked;
  });

  DOM.checkGhostOverlay.addEventListener('change', () => {
    DOM.ghostImage.style.display = DOM.checkGhostOverlay.checked ? 'block' : 'none';
  });

  // Paleta y Color Picker
  DOM.nativeColorPicker.addEventListener('input', (e) => setColor(e.target.value));
  DOM.inputHex.addEventListener('change', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) setColor(val);
  });

  DOM.selectPresetPalette.addEventListener('change', (e) => {
    renderPresetPalette(e.target.value);
  });

  DOM.btnAddColor.addEventListener('click', () => {
    if (!customPalette.includes(STATE.currentColor)) {
      customPalette.push(STATE.currentColor);
      renderCustomPalette();
      showToast('Color añadido a tu paleta.', 'info');
    }
  });

  // Cuadrícula
  DOM.btnToggleGrid.addEventListener('click', () => {
    STATE.showGrid = !STATE.showGrid;
    DOM.btnToggleGrid.classList.toggle('active-toggle', STATE.showGrid);
    renderGrid();
  });

  // Botones de acción
  DOM.btnClear.addEventListener('click', () => {
    pixelMatrix = Array.from({ length: STATE.resolution }, () => Array(STATE.resolution).fill('#ffffff'));
    redrawMainCanvas();
    renderGrid();
    saveHistoryState();
    showToast('Lienzo limpio', 'info');
  });

  DOM.btnUndo.addEventListener('click', undo);
  DOM.btnRedo.addEventListener('click', redo);
  DOM.btnExportNative.addEventListener('click', exportNativePNG);
  DOM.btnExportHd.addEventListener('click', exportHdPNG);

  // Subir imagen
  DOM.btnUpload.addEventListener('click', () => {
    DOM.inputUploadImage.click();
  });

  DOM.inputUploadImage.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleImageUpload(file);
      DOM.inputUploadImage.value = '';
    }
  });

  // Atajos de teclado (Ctrl+Z, Ctrl+Y, B, E, I)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    } else if (e.key.toLowerCase() === 'b') {
      document.querySelector('[data-tool="pencil"]').click();
    } else if (e.key.toLowerCase() === 'e') {
      document.querySelector('[data-tool="eraser"]').click();
    } else if (e.key.toLowerCase() === 'i') {
      document.querySelector('[data-tool="eyedropper"]').click();
    } else if (e.key.toLowerCase() === 'g') {
      DOM.btnToggleGrid.click();
    }
  });
}

function renderCursorOverlay(coords) {
  renderGrid();
  // Dibujar recuadro de selección sobre el píxel actual
  oCtx.save();
  oCtx.strokeStyle = '#38bdf8';
  oCtx.lineWidth = 0.15;
  oCtx.strokeRect(coords.x, coords.y, STATE.brushSize, STATE.brushSize);
  oCtx.restore();
}

function renderShapePreview(start, end) {
  renderGrid();
  oCtx.save();
  oCtx.fillStyle = STATE.currentColor;
  oCtx.globalAlpha = 0.5;

  if (STATE.tool === 'line') {
    // Línea simple
    oCtx.beginPath();
    oCtx.moveTo(start.x + 0.5, start.y + 0.5);
    oCtx.lineTo(end.x + 0.5, end.y + 0.5);
    oCtx.strokeStyle = STATE.currentColor;
    oCtx.lineWidth = 0.5;
    oCtx.stroke();
  } else if (STATE.tool === 'rect') {
    const x0 = Math.min(start.x, end.x);
    const x1 = Math.max(start.x, end.x);
    const y0 = Math.min(start.y, end.y);
    const y1 = Math.max(start.y, end.y);
    oCtx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }
  oCtx.restore();
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', initApp);
