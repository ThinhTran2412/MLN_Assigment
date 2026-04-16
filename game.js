// --- CONFIG & CONSTANTS ---
const CONFIG = {
  FPS: 60,
  CITIZEN_COUNT_MAX: 15, // Giảm xuống còn 15 người để quan sát rõ hơn
  COLORS: {
    grass: '#1a472a',
    soil: '#4d3a24',
    city: '#1a1c2c',
    rich: '#ffd166',
    poor: '#ef476f',
    mid: '#e8eaf6'
  },
  ASSETS: {
    poor_single: 'assets/poor.png',
    rich_single: 'assets/rich.png',
    // Giai cấp nghèo: Nữ nông dân, Ông lão, Nam nông dân
    poor_f: 'assets/poor_f.png',
    poor_e: 'assets/poor_e.png',
    poor_m: 'assets/poor_m.png',
    // Giai cấp trung: Nam thương nhân, Nữ học giả, Thợ thủ công
    mid_m: 'assets/mid_m.png',
    mid_f: 'assets/mid_f.png',
    mid_c: 'assets/mid_c.png',
    // Giai cấp giàu: Lãnh chúa, Quý tộc nữ, Tướng quân
    rich_l: 'assets/rich_l.png',
    rich_la: 'assets/rich_la.png',
    rich_g: 'assets/rich_g.png',
    buildings: 'assets/buildings.png',
    // Môi trường Phase 0
    desert: 'assets/desert.png',
    tu_huu: 'assets/tu_huu.png',
    tu_huu_phase2: 'assets/tu_huu_phase2.png',
    happy: 'assets/happy.png',
    done: 'assets/done.png',
    apple_tree: 'assets/apple_tree.png',
    farming: 'assets/farming.png',
    guard: 'assets/guard.png',
    rebel: 'assets/rebel.png',
    nole: 'assets/nole.png',
    acient_m: 'assets/acient_male.png',
    acient_f: 'assets/acient_female.png',
    cave: 'assets/cave.png',
    luom_nhat: 'assets/luom_nhat.png'
  },
  // Map giai cấp → các sprite có thể dùng
  CLASS_SPRITES: {
    poor:   ['acient_f', 'acient_m'],   // Phase 0 dùng ancient
    mid:    ['acient_m', 'acient_f'],   // Phase 0 dùng ancient
    rich:   ['rich_l', 'rich_la', 'rich_g'],
    // Archive (vẫn giữ để phases sau dùng)
    vn_poor: ['poor_f', 'poor_e', 'poor_m'],
    vn_mid:  ['mid_m', 'mid_f', 'mid_c']
  }
};

const CURRENT_PAGE = window.location.pathname.split('/').pop().toLowerCase();
const IS_TU_HUU_PAGE = CURRENT_PAGE === 'tu_huu.html';
const HIGH_CONFLICT_MUSIC_THRESHOLD = 50;

const NAV_REASON_KEY = 'mln_nav_reason_v1';
const STORY_URL = 'story.txt';
const ENDING_URL = 'ending.txt';
let STORY_CACHE = null;
let ENDING_CACHE = null;

async function loadStory() {
  if (STORY_CACHE) return STORY_CACHE;
  try {
    const res = await fetch(STORY_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to fetch ${STORY_URL}`);
    const txt = await res.text();
    STORY_CACHE = parseStory(txt);
  } catch (e) {
    console.warn('Failed to load story.txt', e);
    STORY_CACHE = {};
  }
  return STORY_CACHE;
}

async function loadEndingTexts() {
  if (ENDING_CACHE) return ENDING_CACHE;
  try {
    const res = await fetch(ENDING_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to fetch ${ENDING_URL}`);
    ENDING_CACHE = parseStory(await res.text());
  } catch (e) {
    console.warn('Failed to load ending.txt', e);
    ENDING_CACHE = {};
  }
  return ENDING_CACHE;
}

function parseStory(text) {
  const out = {};
  let currentKey = null;
  let buf = [];
  const flush = () => {
    if (currentKey) out[currentKey] = buf.join('\n').trim();
    buf = [];
  };
  text.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*\[([A-Z0-9_]+)\]\s*$/);
    if (m) {
      flush();
      currentKey = m[1];
      return;
    }
    buf.push(line);
  });
  flush();
  return out;
}

async function showHintModal() {
  const story = await loadStory();
  const hintBody = document.getElementById('hint-body');
  if (hintBody) {
    const mainKey = IS_TU_HUU_PAGE ? 'TU_HUU_ENTER' : 'INDEX_HINT';
    const main = story[mainKey] || '';
    const extra = story['HINT_BUTTON'] ? `\n\n${story['HINT_BUTTON']}` : '';
    hintBody.textContent = (main + extra).trim();
  }
  openModal('modal-hint');
}

function setupHintControls() {
  const btn = document.getElementById('btn-hint');
  if (!btn) return;
  btn.onclick = () => { showHintModal(); };
}

async function maybeShowStoryOnEnter() {
  const story = await loadStory();
  const reason = localStorage.getItem(NAV_REASON_KEY);
  if (reason) localStorage.removeItem(NAV_REASON_KEY);

  if (reason === 'to_tu_huu') {
    const msg = story['TU_HUU_ENTER'] || '';
    if (msg) showStoryTutorial(msg);
    return;
  }
  if (!IS_TU_HUU_PAGE) return;
  // Vào tu_huu trực tiếp / refresh: vẫn hiện 1 lần nhỏ để người chơi nắm hint
  const msg = story['TU_HUU_ENTER'] || '';
  if (msg) showStoryTutorial(msg);
}

function showStoryTutorial(text) {
  const overlay = document.getElementById('tutorial-overlay');
  const tutBox = document.querySelector('.tutorial-box');
  const nextBtn = document.getElementById('btn-tut-next');
  const titleEl = document.getElementById('tut-title');
  const textEl = document.getElementById('tut-text');
  if (!overlay || !tutBox || !nextBtn || !titleEl || !textEl) return;

  // Hiện overlay dạng "khối chặn" để truyền đạt mạch truyện/hint.
  overlay.classList.remove('hidden');
  titleEl.textContent = '🦉 Gợi ý & Mạch truyện';
  textEl.textContent = text;

  // Xóa highlight nếu có.
  document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));

  // Đặt box giữa màn hình.
  tutBox.style.top = '50%';
  tutBox.style.left = '50%';
  tutBox.style.transform = 'translate(-50%, -50%)';

  nextBtn.textContent = 'Đã hiểu';
  nextBtn.style.display = 'inline-block';
  nextBtn.onclick = () => {
    overlay.classList.add('hidden');
  };
}

const STATE = {
  year: -5000,
  phase: 0,
  population: 12, // Giảm từ 30 xuống 12
  resources: 500,
  // Đếm số lần người chơi bấm "Lượm nhặt" để kích hoạt chuyển map sang trang tu_huu.html
  luomNhatCount: 0,
  inequality: 0,
  conflict: 0,
  stability: 100,
  rich: 0, middle: 12, poor: 0,
  slaves: 0,
  farmUses: 0,
  oppressCount: 0,
  middlePenalty: 0,
  poorPenaltyFromRevolt: 0,
  revoltAfter70Count: 0,
  tariffUses: 0,
  tuHuuPhase2Unlocked: false,
  stateUnlocked: false,
  turnsPlayed: 0,
  gameOver: false,
  questionCount: 0,
  cooldowns: {},
  nextEventTurn: 4,
  activeEvent: null,
  // === Phase 0 Nguyên Thủy ===
  farmingActive: false,
  farmingZones: [],
  fruitTrees: [],
  cavePos: null,
  caveBounds: null
};

// --- PERSIST / NAVIGATE ---
const SAVE_KEY = 'mln_game_state_v1';
function restoreSavedState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach(k => {
      if (k in STATE) STATE[k] = saved[k];
    });
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('Failed to restore saved game state', e);
  }
}

function saveStateAndGoToTuHuu() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(STATE));
    localStorage.setItem(NAV_REASON_KEY, 'to_tu_huu');
  } catch (e) {
    console.warn('Failed to save game state', e);
  }
  window.location.href = 'tu_huu.html';
}

function saveStateAndGoToNhaNuoc() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(STATE));
  } catch (e) {
    console.warn('Failed to save game state', e);
  }
  window.location.href = 'nha_nuoc.html';
}

restoreSavedState();

// --- DATA: PHASES & ACTIONS ---
const PHASES = [
  { 
    id: 0, 
    name: "Xã hội Nguyên Thủy", 
    badge: "Kỷ 1", 
    icon: "🌿", 
    yr: -5000, 
    desc: "Bình đẳng tuyệt đối.", 
    quote: "Con người sinh ra tự do...", 
    goal: 600, 
    goalType: 'res', 
    goalHint: "Tích lũy 600 Tài nguyên (Sản phẩm thặng dư).",
    classNames: { rich: "Người dư dả", mid: "Thành viên", poor: "Người thiếu thốn" },
    envType: 'nature',
    transitionReason: "Khi lực lượng sản xuất phát triển mạnh mẽ (nhờ cải tiến công cụ), con người bắt đầu tạo ra nhiều sản phẩm hơn mức cần thiết để tồn tại. Sự xuất hiện của 'Sản phẩm thặng dư' chính là tiền đề then chốt để hình thành chế độ tư hữu."
  },
  { 
    id: 1, 
    name: "Tư hữu xuất hiện", 
    badge: "Kỷ 2", 
    icon: "🌾", 
    yr: -3000, 
    desc: "Sản phẩm thặng dư dẫn đến tư hữu.", 
    quote: "Tư hữu là nguồn gốc bất bình đẳng.", 
    goal: 20, 
    goalType: 'ineq', 
    goalHint: "Đạt 20% Bất bình đẳng (Tư hữu hình thành).",
    classNames: { rich: "Chủ nô", mid: "Người tự do", poor: "Bình dân" },
    envType: 'huts',
    transitionReason: "Khi tư hữu xuất hiện, sự phân hóa giàu nghèo bắt đầu diễn ra. Những người có sức khỏe hoặc quyền lực tích trữ tài sản cho riêng mình, phá vỡ sự công bằng tuyệt đối của thời nguyên thủy, tạo tiền đề cho sự đối kháng giai cấp."
  },
  { 
    id: 2, 
    name: "Phân hóa Giai cấp", 
    badge: "Kỷ 3", 
    icon: "⚖️", 
    yr: -1000, 
    desc: "Giai cấp thống trị và bị trị hình thành.", 
    quote: "Lịch sử là đấu tranh giai cấp.", 
    goal: 40, 
    goalType: 'conf', 
    goalHint: "Đạt 40% Mâu thuẫn (Giai cấp xung đột).",
    classNames: { rich: "Chủ nô", mid: "Người tự do", poor: "Bình dân" },
    envType: 'ancient',
    transitionReason: "Mâu thuẫn giai cấp nảy sinh từ lợi ích kinh tế đối kháng. Giai cấp thống trị nắm giữ tư liệu sản xuất và bóc lột giai cấp bị trị. Khi mâu thuẫn này trở nên gay gắt và không thể điều hòa, một công cụ quyền lực mới (Nhà nước) bắt buộc phải ra đời."
  },
  { 
    id: 3, 
    name: "Mâu thuẫn Đỉnh điểm", 
    badge: "Kỷ 4", 
    icon: "🔥", 
    yr: 0, 
    desc: "Xung đột không thể điều hòa.", 
    quote: "Nhà nước xuất hiện để kìm hãm đối kháng.", 
    goal: 70, 
    goalType: 'conf', 
    goalHint: "Đạt 70% Mâu thuẫn (Đỉnh điểm đối kháng).",
    classNames: { rich: "Lãnh chúa", mid: "Thị dân", poor: "Nông nô" },
    envType: 'feudal',
    transitionReason: "Theo Engels, Nhà nước là bằng chứng cho thấy xã hội đã rơi vào một mâu thuẫn giai cấp không thể tự giải quyết. Nhà nước ra đời để kìm hãm xung đột, giữ cho xã hội không bị tiêu diệt bởi cuộc đấu tranh giai cấp đang bùng nổ."
  },
  { 
    id: 4, 
    name: "Nhà nước Quản lý", 
    badge: "Kỷ 5", 
    icon: "🏛️", 
    yr: 500, 
    desc: "Bộ máy chính quyền ổn định xã hội.", 
    quote: "Nhà nước là công cụ của giai cấp thống trị.", 
    goal: 100, 
    goalType: 'stab', 
    goalHint: "Đạt 100% Ổn định để chiến thắng.",
    classNames: { rich: "Tư sản", mid: "Trung lưu", poor: "Vô sản" },
    envType: 'modern',
    transitionReason: "Nhà nước không phải là một quyền lực từ bên ngoài áp đặt vào xã hội. Theo Lenin, Nhà nước là sản phẩm và biểu hiện của những mâu thuẫn giai cấp không thể điều hòa được. Nó ra đời khi mâu thuẫn giai cấp đã lên đến đỉnh điểm, nhằm kìm hãm sự xung đột và duy trì một 'trật tự' có lợi cho giai cấp thống trị, ngăn cản xã hội tự hủy diệt trong cuộc đấu tranh giai cấp."
  }
];

const ACTIONS = {
  basic: [
    { id: 'idle_a', icon: '🪵', name: 'Không làm gì', cost: 0, eff: { }, txt: "Bạn ngồi yên và để ngày trôi qua." },
    { id: 'idle_b', icon: '😴', name: 'Không làm gì', cost: 0, eff: { }, txt: "Bạn tiếp tục chờ đợi mà không tìm thức ăn." },
    { id: 'collect', icon: '🧺', name: 'Lượm nhặt', cost: 15, eff: { res: +150, ineq: +3 }, txt: "Tìm kiếm sản phẩm dư thừa rải rác." }
  ],
  production: [
    { id: 'farm', icon: '🌾', name: 'Canh tác', cost: 40, eff: { res: +180, ineq: +4 }, txt: "Mở rộng khu vực canh tác và tích lũy lương thực." }
  ],
  conflict: [
    { id: 'revolt', icon: '✊', name: 'Nổi dậy', cost: 0, eff: { conf: +15, stab: -20, ineq: -5 }, txt: "Bạo quân bị lật đổ." },
    { id: 'oppress', icon: '⛓️', name: 'Cưỡng chế', cost: 50, eff: { conf: -10, stab: -10, ineq: +5 }, txt: "Dùng vũ lực trấn áp." }
  ],
  state: [
    { id: 'tax', icon: '📊', name: 'Thu thuế', cost: 0, eff: { ineq: -8, res: +100, stab: +5 }, txt: "Điều tiết thu nhập xã hội." },
    { id: 'law', icon: '📜', name: 'Luật pháp', cost: 80, eff: { conf: -15, stab: +20 }, txt: "Trật tự được thiết lập." },
    { id: 'welfare', icon: '🏥', name: 'Phúc lợi', cost: 100, eff: { ineq: -15, conf: -10, stab: +15 }, txt: "Hỗ trợ người nghèo." }
  ],
  chapter2_state: [
    { id: 'land_redistribution', icon: '🌱', name: 'Phân chia ruộng đất', cost: 60, eff: { ineq: -10, conf: -6, res: +40 }, txt: "Tái phân phối ruộng đất để hạ nhiệt xung đột giai cấp." },
    { id: 'code_decree', icon: '📜', name: 'Ban bố quy cách', cost: 40, eff: { conf: -8, ineq: -4 }, txt: "Thiết lập khuôn khổ quản trị để củng cố trật tự mới." },
    { id: 'tariff_policy', icon: '💰', name: 'Áp dụng thuế quan', cost: 20, eff: { res: +150, conf: +15 }, txt: "Tăng ngân khố nhanh nhưng làm mâu thuẫn xã hội gia tăng." }
  ]
};

function getSpritePoolByClass(citizenClass) {
  if (IS_TU_HUU_PAGE && STATE.phase >= 1) {
    if (citizenClass === 'poor') return ['poor_single'];
    if (citizenClass === 'rich') return ['rich_single'];
    if (citizenClass === 'mid') return ['poor_single'];
  }
  return CONFIG.CLASS_SPRITES[citizenClass] || CONFIG.CLASS_SPRITES.vn_mid;
}

function getTuHuuFarmSpots(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  return [
    { x: W * 0.08, y: H * 0.30, w: W * 0.15, h: H * 0.15 },
    { x: W * 0.07, y: H * 0.48, w: W * 0.16, h: H * 0.15 },
    { x: W * 0.15, y: H * 0.60, w: W * 0.15, h: H * 0.15 },
    { x: W * 0.22, y: H * 0.40, w: W * 0.15, h: H * 0.15 },
    { x: W * 0.50, y: H * 0.05, w: W * 0.15, h: H * 0.15 },
    { x: W * 0.45, y: H * 0.15, w: W * 0.15, h: H * 0.15 },
    { x: W * 0.55, y: H * 0.18, w: W * 0.15, h: H * 0.15 },
  ];
}

// ASSET LOADING & PROCESSING
const IMAGES = {};
function loadAssets(callback) {
  let loaded = 0;
  const keys = Object.keys(CONFIG.ASSETS);
  const toLoad = keys.length;
  const noChromaKeys = new Set(['poor_single', 'rich_single', 'guard', 'rebel', 'nole', 'farming', 'tu_huu', 'tu_huu_phase2', 'happy', 'done']);
  
  keys.forEach(key => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = CONFIG.ASSETS[key];
    img.onload = () => {
      // Một số sprite nền trong suốt sẵn thì không áp chroma key để tránh bị mờ.
      IMAGES[key] = noChromaKeys.has(key) ? img : makeTransparent(img, [255, 0, 255]);
      loaded++;
      if (loaded === toLoad) callback();
    };
    img.onerror = () => {
      console.error(`Failed to load ${key}`);
      loaded++;
      if (loaded === toLoad) callback();
    };
  });
}

/**
 * Hàm xóa màu nền (Chroma Key) để tạo độ trong suốt
 */
function makeTransparent(img, targetRGB) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const [tr, tg, tb] = targetRGB;
  const tolerance = 60; // Độ lệch màu cho phép
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i+2];
    
    // Nếu màu gần giống màu Magenta thì cho độ trong suốt = 0
    if (Math.abs(r - tr) < tolerance && 
        Math.abs(g - tg) < tolerance && 
        Math.abs(b - tb) < tolerance) {
      data[i + 3] = 0;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas; // Trả về canvas đã được xử lý như một Image
}

// --- 2D ENGINE CLASSES ---

class Particle {
  constructor(x, y, text, color, size = 18) {
    this.x = x; this.y = y; this.text = text; this.color = color;
    this.life = 1.0; 
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -1.5 - Math.random() * 2;
    this.size = size;
  }
  update() { 
    this.x += this.vx;
    this.y += this.vy; 
    this.life -= 0.015; 
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.font = `bold ${this.size}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Hàm hỗ trợ chớp màn hình
function spawnFlash(color = 'white', duration = 150) {
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  flash.style.backgroundColor = color;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), duration);
}

// Hiển thị chỉ số thay đổi nổi lên (+5, -10)
function spawnStatDelta(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const delta = document.createElement('div');
  delta.className = 'stat-delta ' + (value >= 0 ? 'pos' : 'neg');
  delta.textContent = (value >= 0 ? '+' : '') + value;
  delta.style.left = `${rect.left + rect.width / 2}px`;
  delta.style.top = `${rect.top}px`;
  document.body.appendChild(delta);
  setTimeout(() => delta.remove(), 800);
  
  // Hiệu ứng bar-pulse
  const bar = el.querySelector('.stat-fill');
  if (bar) {
    bar.classList.add('bar-pulse');
    setTimeout(() => bar.classList.remove('bar-pulse'), 500);
  }
}

class SmokeParticle {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = -0.5 - Math.random();
    this.size = 5 + Math.random() * 10;
    this.life = 1.0;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.life -= 0.01;
    this.size += 0.2;
  }
  draw(ctx) {
    ctx.globalAlpha = this.life * 0.3;
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

// --- AUDIO SYSTEM ---
const AUDIO = {
  ctx: null,
  musicVolume: 0.5,
  init() { 
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { console.warn("Audio not supported"); }
  },
  play(freq, type = 'sine', duration = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  click() { this.play(440, 'sine', 0.05); },
  transition() { this.play(220, 'triangle', 0.5); this.play(330, 'triangle', 0.5); },
  error() { this.play(110, 'sawtooth', 0.2); },
  getMusicElement() {
    return document.getElementById('bg-music');
  },
  getMusicButton() {
    return document.getElementById('btn-music');
  },
  getVolumeSlider() {
    return document.getElementById('volume-slider');
  },
  getPreferredTrack() {
    if (IS_TU_HUU_PAGE) {
      return STATE.conflict >= HIGH_CONFLICT_MUSIC_THRESHOLD
        ? 'assets/music/game2_phase2.mp3'
        : 'assets/music/game2_phase1.mp3';
    }
    return 'assets/music/acient_song.mp3';
  },
  getVolumeIcon() {
    if (this.musicVolume <= 0.01) return '🔇';
    if (this.musicVolume < 0.5) return '🔉';
    return '🔊';
  },
  updateMusicUI() {
    const btn = this.getMusicButton();
    const slider = this.getVolumeSlider();
    if (btn) {
      btn.textContent = this.getVolumeIcon();
      btn.classList.toggle('playing', this.musicVolume > 0.01);
    }
    if (slider) slider.value = String(Math.round(this.musicVolume * 100));
  },
  applyVolume() {
    const music = this.getMusicElement();
    if (music) music.volume = this.musicVolume;
    this.updateMusicUI();
  },
  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(1, value));
    this.applyVolume();
  },
  syncBackgroundMusic(forcePlay = false) {
    const music = this.getMusicElement();
    if (!music) return;

    const nextTrack = this.getPreferredTrack();
    const currentTrack = music.getAttribute('src') || '';
    const trackChanged = currentTrack !== nextTrack;
    const shouldPlay = forcePlay || !music.paused;

    if (trackChanged) {
      music.setAttribute('src', nextTrack);
      music.load();
    }

    this.applyVolume();

    if (shouldPlay) {
      music.play().catch(() => {
        console.warn("Browser requires user interaction to play music first.");
      });
    }
  },
  playEndingCue(kind) {
    const src = kind === 'done'
      ? 'assets/music/done_sound.mp3'
      : 'assets/music/fail_sound.mp3';
    const cue = new Audio(src);
    cue.volume = this.musicVolume;
    cue.play().catch(() => {
      console.warn(`Unable to play ending cue: ${src}`);
    });
  }
};

function setupVolumeControls() {
  const btn = document.getElementById('btn-music');
  const panel = document.getElementById('volume-panel');
  const slider = document.getElementById('volume-slider');
  if (!btn || !panel || !slider) return;

  btn.onclick = (event) => {
    event.stopPropagation();
    panel.classList.toggle('hidden');
  };

  panel.addEventListener('click', (event) => event.stopPropagation());
  slider.addEventListener('input', (event) => {
    AUDIO.setMusicVolume(Number(event.target.value) / 100);
    AUDIO.syncBackgroundMusic(true);
  });
  document.addEventListener('click', () => panel.classList.add('hidden'));

  AUDIO.updateMusicUI();
}

class Citizen {
  constructor(canvas) {
    this.canvas = canvas;
    this.size = 65; 
    this.reset();
  }
  reset() {
    this.x = Math.random() * (this.canvas.width - this.size);
    this.y = Math.random() * (this.canvas.height - this.size);
    this.tx = this.x; this.ty = this.y;
    this.speed = 0.4 + Math.random() * 0.6;
    this.mood = ''; this.moodTimer = 0;
    this.class = 'mid'; 
    this.spriteKey = null;
    this.activity = 'idle'; // idle, moving, action
    this.target = null;
    this.actionTimer = 0;
  }
  update() {
    // 1. Logic di chuyển
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > 5) {
      const nextX = this.x + (dx / dist) * this.speed;
      const nextY = this.y + (dy / dist) * this.speed;

      // Kiểm tra ranh giới hang (No-go zone)
      let canMove = true;
      if (STATE.phase === 0 && STATE.caveBounds && (!this.target || this.target.type !== 'cave')) {
        const b = STATE.caveBounds;
        if (nextX > b.x1 && nextX < b.x2 && nextY > b.y1 && nextY < b.y2) {
          canMove = false;
          this.findNewTask(); // Đổi hướng
        }
      }

      if (canMove) {
        this.x = nextX;
        this.y = nextY;
        this.activity = 'moving';
      }
    } else {
      if (this.activity === 'moving' && this.target) {
        this.activity = 'action';
        this.actionTimer = 60 + Math.random() * 60;
      } else if (this.activity === 'action') {
        this.actionTimer--;
        if (this.actionTimer <= 0) {
          this.activity = 'idle';
          this.target = null;
          this.findNewTask();
        }
      } else {
        this.activity = 'idle';
        if (Math.random() < 0.005) this.findNewTask();
      }
    }

    if (this.moodTimer > 0) this.moodTimer--; else this.mood = '';
  }

  findNewTask() {
    if (STATE.phase === 0 && STATE.desertBounds) {
      const db = STATE.desertBounds;

      // Đi vòng vòng (70%) hoặc đến gần cây (30%)
      if (Math.random() < 0.7) {
        this.tx = db.x + 0.1 * db.w + Math.random() * (db.w * 0.8);
        this.ty = db.y + 0.1 * db.h + Math.random() * (db.h * 0.8);
        this.target = null;
      } else {
        if (STATE.fruitTrees && STATE.fruitTrees.length > 0) {
          const t = STATE.fruitTrees[Math.floor(Math.random() * STATE.fruitTrees.length)];
          this.tx = t.x + (Math.random()-0.5) * 60;
          this.ty = t.y + (Math.random()-0.5) * 30;
          this.target = { type: 'fruit' };
        }
      }
    } else {
      this.tx = Math.random() * (this.canvas.width - this.size);
      this.ty = Math.random() * (this.canvas.height - this.size);
      this.target = null;
    }
  }

  draw(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.size/2, this.y + this.size - 5, 20, 8, 0, 0, Math.PI*2);
    ctx.fill();
    
    const pool = getSpritePoolByClass(this.class);
    if (!this.spriteKey || !pool.includes(this.spriteKey)) {
      this.spriteKey = pool[Math.floor(Math.random() * pool.length)];
    }
    const img = IMAGES[this.spriteKey];
    if (img) {
      const drawScale = this.spriteKey === 'poor_single' ? 0.75 : 1;
      const drawSize = this.size * drawScale;
      const dx = this.x + (this.size - drawSize) / 2;
      const dy = this.y + (this.size - drawSize);
      ctx.drawImage(img, dx, dy, drawSize, drawSize);
    }

    if (this.mood) {
      ctx.font = "24px Arial"; 
      ctx.textAlign = "center";
      ctx.fillText(this.mood, this.x + this.size/2, this.y - 10);
    }
  }
  setMood(m, duration = 120) { this.mood = m; this.moodTimer = duration; }
}

class EnvObject {
  constructor(x, y, type, emoji) {
    this.x = x; this.y = y; this.type = type; this.emoji = emoji;
    this.scale = 0.5 + Math.random() * 0.5;
  }
  draw(ctx) {
    const img = IMAGES[this.emoji];
    if (img) {
      // Scale down image assets for environment objects
      const sw = (img.width || 100) * 0.08 * this.scale;
      const sh = (img.height || 100) * 0.08 * this.scale;
      ctx.drawImage(img, this.x - sw/2, this.y - sh, sw, sh);
    } else {
      ctx.font = `${40 * this.scale}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(this.emoji, this.x, this.y);
    }
    
    // Đổ bóng dưới chân
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, 15 * this.scale, 8 * this.scale, 0, 0, Math.PI*2);
    ctx.fill();
  }
}

// ===================================================================
// LƯỢM NHẶT ENTITY - Di chuyển vòng vòng như nhân vật thường
// ===================================================================
class LuomNhatEntity {
  constructor(canvas) {
    this.canvas = canvas;
    this.size = 65; // Cùng kích thước với citizen
    const db = STATE.desertBounds;
    if (db) {
      this.x = db.x + 0.1 * db.w + Math.random() * (db.w * 0.8);
      this.y = db.y + 0.2 * db.h + Math.random() * (db.h * 0.6);
    } else {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }
    this.tx = this.x;
    this.ty = this.y;
    this.speed = 0.4 + Math.random() * 0.5;
  }

  update() {
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else {
      // Chọn điểm đi mới ngẫu nhiên trong desert
      if (Math.random() < 0.01) {
        const db = STATE.desertBounds;
        if (db) {
          this.tx = db.x + 0.1 * db.w + Math.random() * (db.w * 0.8);
          this.ty = db.y + 0.1 * db.h + Math.random() * (db.h * 0.8);
        } else {
          this.tx = Math.random() * this.canvas.width;
          this.ty = Math.random() * this.canvas.height;
        }
      }
    }
  }

  draw(ctx) {
    const img = IMAGES['luom_nhat'];
    if (img) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(this.x + this.size / 2, this.y + this.size - 5, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(img, this.x, this.y, this.size, this.size);
    }
  }
}

class ActionEntity {
  constructor(canvas, spriteKey, speed = 0.35) {
    this.canvas = canvas;
    this.spriteKey = spriteKey;
    this.size = 62;
    this.x = Math.random() * (canvas.width - this.size);
    this.y = Math.random() * (canvas.height - this.size);
    this.tx = this.x;
    this.ty = this.y;
    this.speed = speed;
  }
  update() {
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 4) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      return;
    }
    if (Math.random() < 0.02) {
      this.tx = Math.random() * (this.canvas.width - this.size);
      this.ty = Math.random() * (this.canvas.height - this.size);
    }
  }
  draw(ctx) {
    const img = IMAGES[this.spriteKey];
    if (!img) return;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.size / 2, this.y + this.size - 5, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, this.x, this.y, this.size, this.size);
  }
}

class GameWorld {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.citizens = [];
    this.luomNhatEntities = []; // Mảng chứa các entity lượm nhặt
    this.guardEntities = [];
    this.rebelEntities = [];
    this.slaveEntities = [];
    this.particles = [];
    this.envObjects = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    const count = Math.min(STATE.population, CONFIG.CITIZEN_COUNT_MAX);
    for (let i = 0; i < count; i++) this.citizens.push(new Citizen(this.canvas));
    
    this.generateEnvironment();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
    this.generateEnvironment(); // Re-gen on resize
  }

  generateEnvironment() {
    this.envObjects = [];
    const type = PHASES[STATE.phase].envType;
    
    // 1. Vật thể thiên nhiên ngẫu nhiên
    if (STATE.phase === 0) {
      // Bỏ qua vật thể ngẫu nhiên cho Giai đoạn 0 vì đã có terrain chuyên biệt
    } else {
      let pool = ['🌳', '🌿', '⛰️'];
      if (type === 'huts') pool = ['🛖', '🌲', '🔥'];
      if (type === 'ancient') pool = ['🏛️', '🏺', '📜'];
      if (type === 'feudal') pool = ['🏰', '🛡️', '🌾'];
      if (type === 'modern') pool = ['🏭', '🏢', '🏗️'];

      for (let i = 0; i < 15; i++) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        const emoji = pool[Math.floor(Math.random() * pool.length)];
        this.envObjects.push(new EnvObject(x, y, type, emoji));
      }
    }

    // 2. Vật thể đặc thù theo giai cấp (Dựa trên vị trí nhân vật hiện có)
    this.citizens.forEach(c => {
      let classEmoji = null;
      if (STATE.phase >= 1) {
        if (c.class === 'rich') {
          classEmoji = (STATE.phase >= 3) ? '🏰' : '🏠';
          if (STATE.phase === 4) classEmoji = '🏙️';
        } else if (c.class === 'poor') {
          classEmoji = (STATE.phase >= 3) ? '🏭' : '🛖';
          if (STATE.phase === 4) classEmoji = '🛠️';
        }
      }
      
      if (classEmoji) {
        this.envObjects.push(new EnvObject(c.x + 20, c.y + 20, 'class-dist', classEmoji));
      }

      // Thêm yếu tố môi trường phụ (Gia súc, Quân đội)
      if (Math.random() < 0.15) {
        let extraEmoji = null;
        if (STATE.phase === 1) extraEmoji = Math.random() < 0.5 ? '🐄' : '🐖';
        if (STATE.phase >= 2 && STATE.phase < 4) extraEmoji = Math.random() < 0.5 ? '🌳' : '🌾';
        if (STATE.phase === 4) extraEmoji = Math.random() < 0.5 ? '💂' : '🏢';
        
        if (extraEmoji) {
          this.envObjects.push(new EnvObject(c.x - 20, c.y - 20, 'extra-decor', extraEmoji));
        }
      }
    });
  }
  spawnLuomNhat() {
    this.luomNhatEntities.push(new LuomNhatEntity(this.canvas));
  }
  spawnGuard() {
    this.guardEntities.push(new ActionEntity(this.canvas, 'guard', 0.45));
  }
  spawnRebel() {
    this.rebelEntities.push(new ActionEntity(this.canvas, 'rebel', 0.42));
  }
  spawnSlave() {
    this.slaveEntities.push(new ActionEntity(this.canvas, 'nole', 0.22));
  }

  update() {
    const hideMovingEntities = IS_TU_HUU_PAGE && STATE.tuHuuPhase2Unlocked && STATE.stability >= 70;
    this.citizens.forEach(c => c.update());
    if (!hideMovingEntities) {
      this.luomNhatEntities.forEach(e => e.update());
      this.guardEntities.forEach(e => e.update());
      this.rebelEntities.forEach(e => e.update());
      this.slaveEntities.forEach(e => e.update());
    }
    this.particles.forEach((p, i) => {
      p.update();
      if (p.life <= 0) this.particles.splice(i, 1);
    });

    // Tạo khói từ nhà máy ở kỷ Tư bản
    if (STATE.phase === 4) {
      this.envObjects.forEach(obj => {
        if (obj.emoji === '🏭' && Math.random() < 0.05) {
          this.particles.push(new SmokeParticle(obj.x, obj.y - 20));
        }
      });
    }
    
    // Sync citizens with class counts
    this.updateCitizenSprites();
  }
  updateCitizenSprites() {
    const total = this.citizens.length;
    this.citizens.forEach((c, i) => {
      const ratio = i / total;
      const poorLimit = STATE.poor / STATE.population;
      const midLimit = (STATE.poor + STATE.middle) / STATE.population;
      
      if (ratio < poorLimit) c.class = 'poor';
      else if (ratio < midLimit) c.class = 'mid';
      else c.class = 'rich';
    });
  }
  draw() {
    const ctx = this.ctx;
    this.drawBackground(ctx);
    
    if (STATE.phase === 0) {
      this.drawPhase0Terrain(ctx);
    }
    this.drawFarmingZones(ctx);
    
    // Sắp xếp tất cả nhân vật + entity theo trục Y để tạo chiều sâu
    const hideMovingEntities = IS_TU_HUU_PAGE && STATE.tuHuuPhase2Unlocked && STATE.stability >= 70;
    const allObjects = hideMovingEntities
      ? [...this.envObjects]
      : [
          ...this.citizens,
          ...this.luomNhatEntities,
          ...this.guardEntities,
          ...this.rebelEntities,
          ...this.slaveEntities,
          ...this.envObjects
        ];
    allObjects.sort((a, b) => a.y - b.y);
    
    allObjects.forEach(obj => obj.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
  }
  drawBackground(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;

    if (STATE.phase === 0) {
      const desertImg = IMAGES['desert'];
      if (desertImg) {
        const iw = desertImg.width  || desertImg.naturalWidth  || W;
        const ih = desertImg.height || desertImg.naturalHeight || H;
        const scale = Math.min(W / iw, H / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;
        
        ctx.fillStyle = '#b89050'; 
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(desertImg, dx, dy, dw, dh);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, W, H);

        // Store bounds for objects & AI
        STATE.desertBounds = { x: dx, y: dy, w: dw, h: dh };
      } else {
        ctx.fillStyle = '#c4902e';
        ctx.fillRect(0, 0, W, H);
        STATE.desertBounds = { x: 0, y: 0, w: W, h: H };
      }
      return;
    }

    if (IS_TU_HUU_PAGE) {
      const tuHuuImg = (STATE.tuHuuPhase2Unlocked && STATE.stability >= 80)
        ? IMAGES['done']
        : (STATE.tuHuuPhase2Unlocked ? IMAGES['tu_huu_phase2'] : IMAGES['tu_huu']);
      if (tuHuuImg) {
        const iw = tuHuuImg.width || tuHuuImg.naturalWidth || W;
        const ih = tuHuuImg.height || tuHuuImg.naturalHeight || H;
        const scale = Math.max(W / iw, H / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;

        ctx.fillStyle = '#4b3820';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(tuHuuImg, dx, dy, dw, dh);
        ctx.fillStyle = 'rgba(18,12,8,0.2)';
        ctx.fillRect(0, 0, W, H);
        return;
      }
    }

    // Các phase khác dùng gradient
    const skyGrad    = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);

    if (STATE.phase === 1) {
      skyGrad.addColorStop(0, '#1a3f6b'); skyGrad.addColorStop(1, '#2e7d53');
      groundGrad.addColorStop(0, '#2d6a3f'); groundGrad.addColorStop(1, '#1a3a24');
    } else if (STATE.phase === 2) {
      skyGrad.addColorStop(0, '#2c2a1a'); skyGrad.addColorStop(1, '#5a4a2a');
      groundGrad.addColorStop(0, '#6b5a32'); groundGrad.addColorStop(1, '#3a2e1a');
    } else {
      skyGrad.addColorStop(0, '#050714'); skyGrad.addColorStop(1, '#1a1c3a');
      groundGrad.addColorStop(0, '#1a1c2c'); groundGrad.addColorStop(1, '#0a0b14');
    }

    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H * 0.6);
    ctx.fillStyle = groundGrad; ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }

  // ===================================================================
  // PHASE 0: Vẽ địa hình Thời đại Đá
  // ===================================================================
  drawPhase0Terrain(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;

    // --- NÚI XA (Distant Mountains) ---
    this.drawMountains(ctx);

    // --- CAVE (cave.png) nằm bên phải ---
    const caveImg = IMAGES['cave'];
    if (caveImg) {
      const cw = (caveImg.width || 800) * 0.3 * (W / 800);
      const ch = (caveImg.height || 600) * 0.3 * (W / 800);
      const cx = W * 0.78 - cw / 2;
      const cy = H * 0.22 - ch / 2;
      
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(cx + cw/2, cy + ch - 5, cw*0.35, ch*0.12, 0, 0, Math.PI*2);
      ctx.fill();
      
      ctx.drawImage(caveImg, cx, cy, cw, ch);
      STATE.cavePos = { x: cx + cw/2, y: cy + ch - 10 };
      // Định nghĩa vùng không được vào (No-go zone)
      STATE.caveBounds = { x1: cx - 20, y1: cy - 20, x2: cx + cw + 20, y2: cy + ch + 10 };
    }

    // --- HỐ LỬA ---
    const fX = W * 0.46, fY = H * 0.68;
    ctx.fillStyle = 'rgba(255,100,0,0.15)'; 
    ctx.beginPath(); ctx.arc(fX, fY, 35, 0, Math.PI*2); ctx.fill();
    ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('🔥', fX, fY + 8);

    // --- CÂY ĂN QUẢ (Distributed within desert, away from cave) ---
    const treeImg = IMAGES['apple_tree'];
    if (treeImg && STATE.desertBounds) {
      const db = STATE.desertBounds;
      const TREE_SPOTS = [
        { fx: 0.20, fy: 0.35, s: 0.15 },
        { fx: 0.45, fy: 0.28, s: 0.16 },
        { fx: 0.35, fy: 0.65, s: 0.14 },
        { fx: 0.15, fy: 0.75, s: 0.13 },
        { fx: 0.55, fy: 0.55, s: 0.15 },
      ];
      STATE.fruitTrees = []; // Reset list for AI
      TREE_SPOTS.forEach(t => {
        const tw = (treeImg.width || 528) * t.s * (db.w / 800);
        const th = (treeImg.height || 528) * t.s * (db.w / 800);
        const tx = db.x + t.fx * db.w;
        const ty = db.y + t.fy * db.h;
        ctx.drawImage(treeImg, tx - tw/2, ty - th, tw, th);
        STATE.fruitTrees.push({ x: tx, y: ty, w: tw });
      });
    }
  }

  drawMountains(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const topY = H * 0.15; // Phía trên màn hình

    // Lớp núi xa nhất (Phớt xanh mờ)
    ctx.save();
    ctx.globalAlpha = 0.5;
    this.drawMountainLayer(ctx, W, topY, 0.4, '#5a6b8a', '#8a9ab8');
    ctx.restore();

    // Lớp núi gần hơn (Nâu xám)
    ctx.save();
    ctx.globalAlpha = 0.8;
    this.drawMountainLayer(ctx, W, topY + 40, 0.6, '#6b5a45', '#a09070');
    ctx.restore();
  }

  drawMountainLayer(ctx, W, baseH, frequency, color1, color2) {
    const grad = ctx.createLinearGradient(0, baseH - 80, 0, baseH + 40);
    grad.addColorStop(0, color2);
    grad.addColorStop(1, color1);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(0, baseH + 100);
    for (let x = 0; x <= W; x += 15) {
      // Dùng deterministic sine waves để núi không nhảy
      const y = baseH + Math.sin(x * 0.015 * frequency) * 30 + 
                       Math.sin(x * 0.04 * frequency) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, baseH + 100);
    ctx.lineTo(0, baseH + 100);
    ctx.fill();
  }

  drawFarmingZones(ctx) {
    if (!STATE.farmingActive) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (STATE.farmingZones.length === 0) {
      if (IS_TU_HUU_PAGE && STATE.phase >= 1) {
        return;
      } else {
        STATE.farmingZones = [{ x: W*0.19, y: H*0.28, w: W*0.17, h: H*0.25 }];
      }
    }

    if (IS_TU_HUU_PAGE && STATE.phase >= 1) {
      const img = IMAGES['farming'];
      if (img) {
        STATE.farmingZones.forEach(z => {
          ctx.drawImage(img, z.x, z.y, z.w, z.h);
        });
        return;
      }
    }

    STATE.farmingZones.forEach(z => {
      ctx.fillStyle = '#3a7020';
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(z.x, z.y, z.w, z.h);
    });
  }

  spawnParticle(text, color, targetSelector = null, deltaValue = null) {
    this.particles.push(new Particle(this.canvas.width/2, this.canvas.height/2, text, color, 24));
    if (targetSelector && deltaValue !== null) {
      spawnStatDelta(targetSelector, deltaValue);
    }
  }
}

// --- GAME LOGIC ---

let world;
function init() {
  AUDIO.init(); // Khởi tạo âm thanh
  if (IS_TU_HUU_PAGE && STATE.conflict >= 70) {
    STATE.tuHuuPhase2Unlocked = true;
  }
  loadAssets(() => {
    world = new GameWorld();
    requestAnimationFrame(loop);
    renderActions();
    updateUI();
    addLog('🌍 Thế giới 2D đã sẵn sàng.', 'good');
    if (STATE.turnsPlayed === 0) startTutorial(); // Tránh hiện tutorial lại nếu chuyển trang
    AUDIO.syncBackgroundMusic(false);
    maybeShowStoryOnEnter();
  });
}

// --- TUTORIAL SYSTEM ---
const TutState = {
  active: false,
  step: 0,
  steps: [
    { 
      target: null, 
      title: "Chào mừng, Linh hồn Lịch sử!", 
      text: "Bạn đang dẫn dắt xã hội qua các thời kỳ lịch sử theo học thuyết Mác-Lênin."
    },
    { 
      target: '#obj-tracker', 
      title: "Mục tiêu Kỷ nguyên", 
      text: "Đây là mục tiêu cần đạt để tiến hóa. Hiện tại: Tích lũy tài nguyên dư thừa."
    },
    { 
      target: '.action-card:nth-child(3)', 
      title: "Cải tiến Sản xuất", 
      text: "Nút 'Canh tác' giúp tạo ra lương thực và sản phẩm thặng dư. Lực lượng sản xuất phát triển là nền tảng của mọi thay đổi xã hội."
    },
    { 
      target: '.action-card:nth-child(2)', 
      title: "Tích trữ & Tư hữu", 
      text: "Nút 'Tích trữ' cho thấy khi có dư thừa, sự tư hữu bắt đầu nảy sinh, dẫn đến bất bình đẳng và mâu thuẫn giai cấp."
    },
    { 
      target: '.sidebar-left', 
      title: "Chỉ số Xã hội", 
      text: "Theo dõi Bất bình đẳng và Mâu thuẫn tại đây. Khi mâu thuẫn đạt đỉnh, Nhà nước sẽ ra đời để điều hòa trật tự."
    }
  ]
};

function startTutorial() {
  TutState.active = true;
  TutState.step = 0;
  showTutorialStep();
}

function showTutorialStep() {
  const step = TutState.steps[TutState.step];
  const overlay = document.getElementById('tutorial-overlay');
  const nextBtn = document.getElementById('btn-tut-next');
  const tutBox = document.querySelector('.tutorial-box');

  overlay.classList.remove('hidden');
  document.getElementById('tut-title').textContent = step.title;
  document.getElementById('tut-text').textContent = step.text;
  
  document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
  
  if (step.target) {
    const el = document.querySelector(step.target);
    if (el) {
      el.classList.add('tut-highlight');
      const rect = el.getBoundingClientRect();
      
      // Tính toán vị trí hộp thoại gần target
      let boxTop, boxLeft;
      const margin = 40;

      if (rect.top > window.innerHeight / 2) {
        // Nếu target ở nửa dưới, hiện box phía trên
        boxTop = rect.top - tutBox.offsetHeight - margin - 50;
        boxLeft = window.innerWidth / 2 - tutBox.offsetWidth / 2;
      } else {
        // Nếu target ở nửa trên, hiện box phía dưới
        boxTop = rect.bottom + margin + 50;
        boxLeft = window.innerWidth / 2 - tutBox.offsetWidth / 2;
      }

      // Đảm bảo box không văng khỏi màn hình
      boxTop = Math.max(20, Math.min(window.innerHeight - tutBox.offsetHeight - 20, boxTop));
      
      tutBox.style.top = `${boxTop}px`;
      tutBox.style.left = `${boxLeft}px`;
      tutBox.style.transform = 'none';
    }
  } else {
    // Nếu không có target, hiện chính giữa
    tutBox.style.top = '50%';
    tutBox.style.left = '50%';
    tutBox.style.transform = 'translate(-50%, -50%)';
  }
  
  nextBtn.style.display = 'inline-block';
}

function advanceTut() {
  TutState.step++;
  if (TutState.step >= TutState.steps.length) {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
    TutState.active = false;
  } else {
    showTutorialStep();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-tut-next');
  if(btn) btn.onclick = advanceTut;
});

function loop() {
  if (STATE.gameOver) return;
  world.update();
  world.draw();
  requestAnimationFrame(loop);
}

function performAction(act) {
  // Loại bỏ logic chặn hành động trong tutorial để người chơi tự do khám phá khi đang xem hướng dẫn
  let shouldRedirectToTuHuu = false;

  if (STATE.phase === 0 && (act.id === 'idle_a' || act.id === 'idle_b')) {
    showStarvationEnding();
    return;
  }

  if (act.id === 'farm' && IS_TU_HUU_PAGE && STATE.farmUses >= 7) {
    showToast('Canh tác đã đạt giới hạn 7 lần trong chương này.');
    return;
  }

  if (STATE.resources < act.cost) {
    AUDIO.error();
    showToast("Không đủ tài nguyên!"); return;
  }
  
  AUDIO.click();
  STATE.resources -= act.cost;
  applyEffect(act.eff);
  
  addLog(`${act.icon} ${act.name}`, 'info');
  updateNarrative(act.icon, act.txt);
  world.spawnParticle(`${act.icon} EXECUTED`, '#fff');
  
  if (act.id === 'collect') {
    world.spawnLuomNhat();
    STATE.luomNhatCount++;
    if (STATE.luomNhatCount >= 5) {
      STATE.phase = 1;
      STATE.stateUnlocked = false;
      shouldRedirectToTuHuu = true;
    }
  }

  if (act.id === 'farm') {
    STATE.farmingActive = true;
    STATE.farmUses++;
    if (IS_TU_HUU_PAGE && world) {
      const farmSpots = getTuHuuFarmSpots(world.canvas);
      if (STATE.farmingZones.length < farmSpots.length) {
        STATE.farmingZones.push(farmSpots[STATE.farmingZones.length]);
      }
    } else if (!IS_TU_HUU_PAGE) {
      STATE.farmingZones = [];
    }
    if (IS_TU_HUU_PAGE && STATE.farmUses >= 7) {
      renderActions();
    }
  }

  if (IS_TU_HUU_PAGE && world && act.id === 'oppress') {
    world.spawnGuard();
    STATE.oppressCount++;
    STATE.middlePenalty++;
    if (STATE.oppressCount > 3) {
      STATE.slaves++;
      world.spawnSlave();
    }
  }

  if (IS_TU_HUU_PAGE && world && act.id === 'revolt') {
    world.spawnRebel();
    STATE.poorPenaltyFromRevolt++;
  }

  if (IS_TU_HUU_PAGE && STATE.tuHuuPhase2Unlocked && act.id === 'tariff_policy') {
    STATE.tariffUses++;
    if (STATE.tariffUses >= 5 || STATE.conflict >= 85) {
      endChapter2TaxBad();
      return;
    }
  }

  // Visual feedback for citizens
  world.citizens.forEach(c => {
    if (act.id === 'gather') c.setMood('🍎');
    if (act.id === 'farm') c.setMood('🌾');
  });

  STATE.year += 100;
  STATE.turnsPlayed++;

  if (IS_TU_HUU_PAGE && STATE.conflict >= 70 && !STATE.tuHuuPhase2Unlocked) {
    STATE.tuHuuPhase2Unlocked = true;
    STATE.revoltAfter70Count = 0;
    // Sang giai đoạn 2: xóa các nông trại cũ để chuyển bối cảnh xung đột trực diện.
    STATE.farmingZones = [];
    STATE.farmingActive = false;
    showToast('Mâu thuẫn bùng nổ! Bối cảnh chuyển sang giai đoạn 2.');
    renderActions();
  }

  if (IS_TU_HUU_PAGE && STATE.middle <= 2) {
    endChapter2Bad();
    return;
  }

  if (IS_TU_HUU_PAGE && STATE.tuHuuPhase2Unlocked && STATE.stability >= 80) {
    endChapter2Good();
    return;
  }

  if (shouldRedirectToTuHuu) {
    saveStateAndGoToTuHuu();
    return; // Tránh chạy checkPhase/updateUI trên trang cũ
  }
  
  checkPhase();
  updateUI();
  checkAdvisor();
}

function checkAdvisor() {
  if (STATE.conflict > 50 && !STATE.advisorTriggeredConflict) {
    showAdvisor("Mâu thuẫn đang tăng cao! Giai cấp bị trị bắt đầu phản kháng. Nếu không có bộ máy cưỡng chế, xã hội sẽ sụp đổ.");
    STATE.advisorTriggeredConflict = true;
  }
  if (STATE.inequality > 40 && !STATE.advisorTriggeredIneq) {
    showAdvisor("Sự tích cực tư hữu đang tạo ra khoảng cách lớn. Người giàu nắm giữ phương tiện sản xuất, người nghèo trắng tay.");
    STATE.advisorTriggeredIneq = true;
  }
}

function showAdvisor(text) {
  const box = document.getElementById('advisor-box');
  document.getElementById('advisor-text').textContent = text;
  box.classList.remove('hidden');
}

function closeAdvisor() {
  document.getElementById('advisor-box').classList.add('hidden');
}

function applyEffect(eff) {
  if (eff.ineq) STATE.inequality = Math.max(0, Math.min(100, STATE.inequality + eff.ineq));
  if (eff.conf) STATE.conflict = Math.max(0, Math.min(100, STATE.conflict + eff.conf));
  if (eff.res) STATE.resources += eff.res;
  if (eff.pop) STATE.population += eff.pop;
  
  const computedStability = 100 - (STATE.conflict * 0.8) - (STATE.inequality * 0.2);
  const stabilityDelta = eff.stab || 0;
  STATE.stability = Math.max(0, Math.min(100, computedStability + stabilityDelta));
  
  // Calculate counts
  STATE.poor = Math.floor(STATE.population * (STATE.inequality / 100) * 0.7);
  STATE.rich = Math.floor(STATE.population * (STATE.inequality / 100) * 0.1);
  const baseMiddle = STATE.population - STATE.poor - STATE.rich;
  if (IS_TU_HUU_PAGE && STATE.phase >= 1) {
    STATE.rich = Math.max(0, STATE.farmUses - 1);
    STATE.middle = Math.max(0, baseMiddle - STATE.middlePenalty);
    const normalPoor = Math.max(0, STATE.population - STATE.rich - STATE.middle);
    STATE.poor = Math.max(0, normalPoor - STATE.poorPenaltyFromRevolt);
  } else {
    STATE.middle = baseMiddle;
  }
}

async function showStarvationEnding() {
  const endings = await loadEndingTexts();
  const msg = endings['STARVATION_ENDING'] || 'Bộ tộc của bạn đã bị chết đói.';
  const lines = msg.split(/\r?\n|\/n/).filter(Boolean);
  endGame('bad');
  const music = document.getElementById('bg-music');
  if (music) music.pause();
  document.getElementById('ending-icon').textContent = '💀';
  document.getElementById('ending-title').textContent = 'Bộ tộc diệt vong';
  document.getElementById('ending-desc').textContent = lines[0] || msg;
  document.getElementById('ending-lesson-text').textContent = lines.slice(1).join(' ') || msg;
}

function toggleTheorySpotlight() {
  const box = document.getElementById('theory-spotlight');
  const icon = document.getElementById('theory-toggle-icon');
  if (!box) return;
  box.classList.toggle('collapsed');
  if (icon) icon.textContent = box.classList.contains('collapsed') ? '►' : '▼';
}

function endChapter2Bad() {
  STATE.gameOver = true;
  const music = document.getElementById('bg-music');
  if (music) music.pause();
  AUDIO.playEndingCue('fail');
  document.getElementById('screen-ending').classList.remove('hidden');
  document.getElementById('ending-icon').textContent = '⛓️';
  document.getElementById('ending-title').textContent = 'Chương 2: Sụp đổ';
  document.getElementById('ending-desc').textContent = 'Bình dân chỉ còn lại 2 người, xã hội rơi vào áp bức cực độ.';
  document.getElementById('ending-lesson-text').textContent = 'Khi cưỡng chế kéo dài, tầng lớp bình dân bị triệt tiêu và xung đột xã hội vỡ trận.';
  document.getElementById('final-ineq').textContent = `${Math.round(STATE.inequality)}%`;
  document.getElementById('final-conf').textContent = `${Math.round(STATE.conflict)}%`;
  document.getElementById('final-stab').textContent = `${Math.round(STATE.stability)}%`;
  document.getElementById('final-turns').textContent = STATE.turnsPlayed;
  setEndingArt(null);
}

function endChapter2TaxBad() {
  STATE.gameOver = true;
  const music = document.getElementById('bg-music');
  if (music) music.pause();
  AUDIO.playEndingCue('fail');
  document.getElementById('screen-ending').classList.remove('hidden');
  document.getElementById('ending-icon').textContent = '🔥';
  document.getElementById('ending-title').textContent = 'Chương 2: Thuế quan phản tác dụng';
  document.getElementById('ending-desc').textContent = 'Thuế quan bị lạm dụng khiến dân chúng bùng nổ phản kháng, trật tự mới sụp đổ.';
  document.getElementById('ending-lesson-text').textContent = 'Nếu chỉ bóc tách nguồn lực mà không tái phân phối công bằng, mâu thuẫn giai cấp sẽ quay lại dữ dội hơn.';
  document.getElementById('final-ineq').textContent = `${Math.round(STATE.inequality)}%`;
  document.getElementById('final-conf').textContent = `${Math.round(STATE.conflict)}%`;
  document.getElementById('final-stab').textContent = `${Math.round(STATE.stability)}%`;
  document.getElementById('final-turns').textContent = STATE.turnsPlayed;
  setEndingArt(null);
}

function endChapter2Good() {
  STATE.gameOver = true;
  const music = document.getElementById('bg-music');
  if (music) music.pause();
  AUDIO.playEndingCue('done');
  document.getElementById('screen-ending').classList.remove('hidden');
  document.getElementById('ending-icon').textContent = '🎉';
  document.getElementById('ending-title').textContent = 'Chương 2: Nhà nước ra đời';
  document.getElementById('ending-desc').textContent = 'Sau khi bình ổn vượt 80%, bộ máy nhà nước mới chính thức hình thành.';
  document.getElementById('ending-lesson-text').textContent = 'Khi tái tổ chức quan hệ sản xuất theo hướng công bằng hơn, ổn định xã hội có thể phục hồi sau xung đột đỉnh điểm.';
  document.getElementById('final-ineq').textContent = `${Math.round(STATE.inequality)}%`;
  document.getElementById('final-conf').textContent = `${Math.round(STATE.conflict)}%`;
  document.getElementById('final-stab').textContent = `${Math.round(STATE.stability)}%`;
  document.getElementById('final-turns').textContent = STATE.turnsPlayed;
  setEndingArt('assets/done.png');
}

function setEndingArt(src) {
  const endingArt = document.getElementById('ending-art');
  if (!endingArt) return;
  if (!src) {
    endingArt.classList.add('hidden');
    endingArt.removeAttribute('src');
    return;
  }
  endingArt.src = src;
  endingArt.classList.remove('hidden');
}

function restartGame() {
  window.location.href = 'index.html';
}

function checkPhase() {
  if (IS_TU_HUU_PAGE) {
    // Chương Tư hữu dùng tiến trình riêng, không nhảy sang bộ action "Nhà nước".
    return;
  }

  const next = STATE.phase + 1;
  // Giữ nguyên nền phase 0 cho tới khi người chơi "Lượm nhặt" đủ 5 lần.
  if (!(STATE.phase === 0 && STATE.luomNhatCount < 5)) {
    if (next < PHASES.length) {
      let canUnlock = false;
      if (next === 1 && STATE.resources > 600) canUnlock = true;
      if (next === 2 && STATE.inequality > 20) canUnlock = true;
      if (next === 3 && STATE.conflict > 40) canUnlock = true;
      if (next === 4 && STATE.conflict > 70) canUnlock = true;
      
      if (canUnlock) {
        STATE.phase = next;
        AUDIO.transition();
        showPhaseModal(PHASES[next]);
        if (next === 4) STATE.stateUnlocked = true;
        renderActions();
        if (world) world.generateEnvironment(); // Cập nhật môi trường mới
      }
    }
  }
  
  if (STATE.stability < 10) endGame('bad');
  if (STATE.stateUnlocked && STATE.stability >= 100) endGame('good');
}

// --- UI HELPERS ---

function updateUI() {
  document.getElementById('hud-year').textContent = STATE.year < 0 ? `${Math.abs(STATE.year)} TCN` : `${STATE.year} SCN`;
  document.getElementById('hud-pop').textContent = STATE.population;
  document.getElementById('hud-res').textContent = STATE.resources;
  
  document.getElementById('rich-count').textContent = STATE.rich;
  document.getElementById('mid-count').textContent = STATE.middle;
  document.getElementById('poor-count').textContent = STATE.poor;
  const slaveCountEl = document.getElementById('slave-count');
  if (slaveCountEl) slaveCountEl.textContent = STATE.slaves;
  
  document.getElementById('bar-ineq').style.width = `${STATE.inequality}%`;
  document.getElementById('bar-conf').style.width = `${STATE.conflict}%`;
  document.getElementById('bar-stab').style.width = `${STATE.stability}%`;
  
  document.getElementById('ineq-val').textContent = `${STATE.inequality}%`;
  document.getElementById('conf-val').textContent = `${STATE.conflict}%`;
  document.getElementById('stab-val').textContent = `${STATE.stability}%`;
  
  document.getElementById('phase-badge').textContent = PHASES[STATE.phase].badge;
  document.getElementById('phase-name').textContent = PHASES[STATE.phase].name;
  
  // Cập nhật tên giai cấp trong sidebar
  const cNames = PHASES[STATE.phase].classNames;
  document.querySelector('.rich .c-label').textContent = cNames.rich;
  document.querySelector('.mid .c-label').textContent = cNames.mid;
  document.querySelector('.poor .c-label').textContent = cNames.poor;

  updateObjective();
  
  // Cập nhật Góc Triết Học với lý luận sâu sắc
  const philText = document.getElementById('fact-text');
  if (philText && philText.dataset.staticContent !== 'true') {
    philText.innerHTML = `<strong>${PHASES[STATE.phase].name}:</strong><br>${PHASES[STATE.phase].transitionReason}`;
  }

  AUDIO.syncBackgroundMusic(false);
}

function updateObjective() {
  if (IS_TU_HUU_PAGE) {
    const objTextEl = document.getElementById('obj-text');
    const objProgEl = document.getElementById('obj-progress');
    if (!objTextEl || !objProgEl) return;

    if (STATE.tuHuuPhase2Unlocked) {
      objTextEl.textContent = 'Giai đoạn 2: Giữ bối cảnh hiện tại đến khi Ổn định đạt 80% để chuyển sang done (Nhà nước mới ra đời).';
      const prog = Math.min(100, (STATE.stability / 80) * 100);
      objProgEl.style.width = `${prog}%`;
      return;
    }

    if (STATE.conflict > 40) {
      objTextEl.textContent = 'Mục tiêu mới: Đẩy Mâu thuẫn lên 70% để mở Cảnh 3 - Nhà nước ra đời.';
      const prog = Math.min(100, (STATE.conflict / 70) * 100);
      objProgEl.style.width = `${prog}%`;
      return;
    }

    objTextEl.textContent = 'Đạt 40% Mâu thuẫn để bước vào giai đoạn đối kháng trực diện.';
    const prog = Math.min(100, (STATE.conflict / 40) * 100);
    objProgEl.style.width = `${prog}%`;
    return;
  }

  const current = PHASES[STATE.phase];
  const next = PHASES[STATE.phase + 1];
  
  if (!next) {
    document.getElementById('obj-text').textContent = "Hành trình kết thúc.";
    document.getElementById('obj-progress').style.width = '100%';
    return;
  }
  
  document.getElementById('obj-text').textContent = next.goalHint;
  
  let val = 0;
  let max = next.goal;
  
  if (next.goalType === 'res') val = STATE.resources;
  if (next.goalType === 'ineq') val = STATE.inequality;
  if (next.goalType === 'conf') val = STATE.conflict;
  if (next.goalType === 'stab') val = STATE.stability;
  
  const prog = Math.min(100, (val / max) * 100);
  document.getElementById('obj-progress').style.width = `${prog}%`;
}

function renderActions() {
  const grid = document.getElementById('actions-grid');
  const sPanel = document.getElementById('state-panel');
  grid.innerHTML = '';
  
  if (STATE.stateUnlocked && !IS_TU_HUU_PAGE) {
    // Khi nhà nước xuất hiện, ẩn các hành động nguyên thủy/tự phát
    grid.style.display = 'none';
    sPanel.classList.remove('hidden');
    
    const pGrid = document.getElementById('policy-grid');
    pGrid.innerHTML = '';
    ACTIONS.state.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'action-card';
      btn.innerHTML = `<span class="ac-icon">${a.icon}</span><span class="ac-name">${a.name}</span><span class="ac-cost">💰 ${a.cost}</span>`;
      btn.onclick = () => performAction(a);
      pGrid.appendChild(btn);
    });
  } else {
    // Trước khi có nhà nước, hiển thị hành động xã hội & xung đột
    grid.style.display = 'grid';
    sPanel.classList.add('hidden');
    
    let pool = [...ACTIONS.basic];
    if (IS_TU_HUU_PAGE && STATE.phase >= 1) {
      if (STATE.tuHuuPhase2Unlocked) {
        pool = [...ACTIONS.chapter2_state];
      } else if (STATE.farmUses < 7) {
        pool = [...ACTIONS.production];
      } else {
        pool = [...ACTIONS.conflict];
      }
    } else if (STATE.phase >= 2) {
      pool = [...pool, ...ACTIONS.conflict];
    }
    
    pool.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'action-card';
      const isFarmLocked = IS_TU_HUU_PAGE && a.id === 'farm' && STATE.farmUses >= 7;
      if (isFarmLocked) {
        btn.classList.add('on-cooldown');
        btn.disabled = true;
      }
      
      let effHTML = '<div class="ac-eff-preview">';
      if (a.eff.ineq) effHTML += `<span class="eff-tag ${a.eff.ineq > 0 ? 'eff-neg' : 'eff-pos'}">⚖️${a.eff.ineq > 0 ? '↑' : '↓'}</span>`;
      if (a.eff.conf) effHTML += `<span class="eff-tag ${a.eff.conf > 0 ? 'eff-neg' : 'eff-pos'}">⚡${a.eff.conf > 0 ? '↑' : '↓'}</span>`;
      if (a.eff.res) effHTML += `<span class="eff-tag eff-pos">+${a.eff.res}💰</span>`;
      effHTML += '</div>';

      btn.innerHTML = `
        <span class="ac-icon">${a.icon}</span>
        <div class="ac-info">
          <span class="ac-name">${a.name}</span>
          <span class="ac-cost">💰 ${a.cost}</span>
        </div>
        ${effHTML}
      `;
      if (isFarmLocked) {
        btn.innerHTML += `<span class="cooldown-badge">GIỚI HẠN</span>`;
      }
      btn.onclick = () => performAction(a);
      grid.appendChild(btn);
    });
  }
}

function updateNarrative(emoji, text) {
  // Narrative overlay removed
}

function addLog(txt, type) {
  const log = document.getElementById('event-log');
  const div = document.createElement('div');
  div.className = `log-item ${type}`;
  div.textContent = `[${STATE.year}] ${txt}`;
  log.prepend(div);
}

const TUTORIAL_DATA = {
  0: ["Dùng 'Canh tác' để tạo lương thực.", "Mọi người đều bình đẳng."],
  1: ["Dư thừa sản phẩm dẫn đến 'Tích trữ'.", "Bắt đầu xuất hiện tư hữu."],
  2: ["Phân hóa giàu nghèo sâu sắc.", "Giai cấp thống trị bắt đầu hình thành."],
  3: ["Mâu thuẫn giai cấp không thể điều hòa.", "Chuẩn bị cho sự ra đời của Nhà nước."],
  4: ["Nhà nước độc quyền quản lý xã hội.", "Các hành động tự phát bị bãi bỏ."]
};

function showPhaseModal(p) {
  const banner = document.getElementById('phase-banner');
  const bIcon = document.getElementById('pb-icon');
  const bTitle = document.getElementById('pb-title');
  const bDesc = document.getElementById('pb-desc');
  const bMechanics = document.getElementById('pb-mechanics');
  const bReason = document.getElementById('phase-modal-reason');

  bIcon.textContent = p.icon;
  bTitle.textContent = p.name;
  bDesc.textContent = p.desc;
  if(bReason) bReason.textContent = p.transitionReason || "Lịch sử đang chuyển mình...";
  
  const tips = TUTORIAL_DATA[p.id] || [];
  bMechanics.innerHTML = `<strong>⚙️ Cơ chế:</strong> ${tips.join(' • ')}`;

  banner.classList.remove('hidden', 'hiding');
  
  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    banner.classList.add('hiding');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 500);
  }, 3000);

  // Vẫn hiện modal lý thuyết nếu cần ở góc
  addLog(`Tiến sang kỉ nguyên: ${p.name}`, 'good');
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m; t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2000);
}

function endGame(type) {
  STATE.gameOver = true;
  document.getElementById('screen-ending').classList.remove('hidden');
  setEndingArt(null);
  AUDIO.playEndingCue(type === 'good' ? 'done' : 'fail');
  
  const iconEl = document.getElementById('ending-icon');
  const titleEl = document.getElementById('ending-title');
  const descEl = document.getElementById('ending-desc');
  const lessonEl = document.getElementById('ending-lesson-text');
  
  // Fill stats
  document.getElementById('final-ineq').textContent = `${Math.round(STATE.inequality)}%`;
  document.getElementById('final-conf').textContent = `${Math.round(STATE.conflict)}%`;
  document.getElementById('final-stab').textContent = `${Math.round(STATE.stability)}%`;
  document.getElementById('final-turns').textContent = STATE.turnsPlayed;

  // Nuanced ending logic
  if (type === 'good') {
    if (STATE.inequality < 20) {
      iconEl.textContent = "⚖️";
      titleEl.textContent = "Nhà nước Xã hội Tiến bộ";
      descEl.textContent = "Bạn đã xây dựng được một xã hội mà Nhà nước thực sự phục vụ lợi ích của đa số nhân dân, thu hẹp khoảng cách giàu nghèo.";
      lessonEl.textContent = "Dưới lăng kính Mác-Lênin, đây là trạng thái mà mâu thuẫn giai cấp đã được xoa dịu đáng kể thông qua điều tiết công bằng. Nhà nước dần chuyển từ công cụ trấn áp sang cơ quan quản lý xã hội vì lợi ích chung, chuẩn bị cho một tương lai khi mâu thuẫn giai cấp hoàn toàn biến mất.";
    } else {
      iconEl.textContent = "🏛️";
      titleEl.textContent = "Cơ cấu Thống trị Ổn định";
      descEl.textContent = "Nhà nước đã thiết lập được trật tự, nhưng sự phân hóa giàu nghèo vẫn còn sâu sắc.";
      lessonEl.textContent = "Nhà nước ở đây đóng vai trò là cơ quan duy trì sự 'ổn định' trong áp bức. Nó kìm hãm mâu thuẫn đối kháng để xã hội không bùng nổ, nhưng bản chất vẫn là bảo vệ quyền lợi cho giai cấp nắm giữ tài sản. Sự bình ổn này mang tính tạm thời cho đến khi một mâu thuẫn mới lại nảy sinh.";
    }
  } else {
    if (STATE.turnsPlayed < 10) {
      iconEl.textContent = "🛖";
      titleEl.textContent = "Nguyên thủy Tan rã";
      descEl.textContent = "Xã hội đã sụp đổ ngay trước khi Nhà nước kịp hình thành.";
      lessonEl.textContent = "Mâu thuẫn nảy sinh từ tư hữu đã tiêu diệt sự liên kết cộng đồng quá sớm. Điều này chứng minh rằng nếu không có một công cụ quản lý (Nhà nước) xuất hiện kịp thời để cưỡng chế trật tự, xã hội sẽ rơi vào cảnh 'nồi da nấu thịt' và tự hủy diệt.";
    } else {
      iconEl.textContent = "🔥";
      titleEl.textContent = "Cách mạng Triệt để";
      descEl.textContent = "Mâu thuẫn không thể điều hòa đã dẫn đến sự sụp đổ của toàn bộ bộ máy cai trị.";
      lessonEl.textContent = "Đúng như Lenin nhận định: 'Nhà nước là sản phẩm của những mâu thuẫn giai cấp không thể điều hòa'. Khi xiềng xích quá nặng nề, giai cấp bị trị sẽ dùng bạo lực cách mạng để đập tan cỗ máy Nhà nước cũ. Đây không phải là sự kết thúc, mà là bước ngoặt khởi đầu cho một hình thái Nhà nước mới.";
    }
  }
}

// Start / Intro controls
const startBtn = document.getElementById('btn-start');
if (startBtn) {
  startBtn.onclick = () => {
    document.getElementById('screen-intro').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('hidden');
    init();
    AUDIO.syncBackgroundMusic(true);
  };
}

const theoryBtn = document.getElementById('btn-theory');
if (theoryBtn) {
  theoryBtn.onclick = () => openModal('modal-theory');
}

setupVolumeControls();
setupHintControls();

window.openModal = openModal;
window.closeModal = closeModal;
window.restartGame = restartGame;
window.closeAdvisor = closeAdvisor;
window.toggleTheorySpotlight = toggleTheorySpotlight;
