'use strict';
/* ============================================================
   SUDOKU ENGINE
   ============================================================ */
const SudokuEngine = (() => {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function isValid(b, r, c, n) {
    for (let i = 0; i < 9; i++) if (b[r][i] === n || b[i][c] === n) return false;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) if (b[i][j] === n) return false;
    return true;
  }
  function fill(b) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (!b[r][c]) {
        for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
          if (isValid(b, r, c, n)) { b[r][c] = n; if (fill(b)) return true; b[r][c] = 0; }
        }
        return false;
      }
    }
    return true;
  }
  function countSol(b, lim = 2) {
    let ct = 0;
    function s(b2) {
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        if (!b2[r][c]) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(b2, r, c, n)) { b2[r][c] = n; s(b2); b2[r][c] = 0; if (ct >= lim) return; }
          }
          return;
        }
      }
      ct++;
    }
    s(b.map(r => [...r])); return ct;
  }
  function generate(diff = 'easy') {
    const full = Array.from({ length: 9 }, () => Array(9).fill(0));
    fill(full);
    const sol = full.map(r => [...r]), puz = full.map(r => [...r]);
    const remove = { easy: 35, medium: 49, hard: 57 }[diff] || 35;
    const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
    let done = 0;
    for (const idx of cells) {
      if (done >= remove) break;
      const r = Math.floor(idx / 9), c = idx % 9, bk = puz[r][c];
      puz[r][c] = 0;
      if (countSol(puz) === 1) done++;
      else puz[r][c] = bk;
    }
    return { puzzle: puz, solution: sol };
  }
  function validateConflicts(b) {
    const set = new Set();
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const v = b[r][c]; if (!v) continue;
      for (let i = 0; i < 9; i++) {
        if (i !== c && b[r][i] === v) { set.add(`${r},${c}`); set.add(`${r},${i}`); }
        if (i !== r && b[i][c] === v) { set.add(`${r},${c}`); set.add(`${i},${c}`); }
      }
      const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
      for (let i = br; i < br+3; i++) for (let j = bc; j < bc+3; j++) {
        if ((i!==r||j!==c) && b[i][j]===v) { set.add(`${r},${c}`); set.add(`${i},${j}`); }
      }
    }
    return set;
  }
  return { generate, validateConflicts };
})();

/* ============================================================
   LUDO ENGINE
   ============================================================ */
const LudoEngine = (() => {
  // 52-cell main path: [row, col]
  const PATH = [
    [6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],[0,8],
    [1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],[8,14],
    [8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],[14,6],
    [13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],[6,0]
  ];
  // Home columns (5 cells; step 52-56)
  const HOME = {
    red:    [[7,1],[7,2],[7,3],[7,4],[7,5]],
    green:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
    blue:   [[7,13],[7,12],[7,11],[7,10],[7,9]],
    yellow: [[13,7],[12,7],[11,7],[10,7],[9,7]],
  };
  // Starting path index for each player
  const START = { red: 0, green: 13, blue: 26, yellow: 39 };
  // Safe squares (global path indices)
  const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
  // Home base circles (row, col) for 4 tokens
  const HOME_BASE = {
    red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
    green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
    blue:   [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
    yellow: [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
  };
  const COLORS = { red:'#ef4444', green:'#22c55e', blue:'#3b82f6', yellow:'#eab308' };
  const COLORS_LIGHT = { red:'#fca5a5', green:'#86efac', blue:'#93c5fd', yellow:'#fde047' };
  const ORDER = ['red','green','blue','yellow'];

  // Get cell coordinates for a token at step s
  function getCell(player, step) {
    if (step < 0) {
      const hb = HOME_BASE[player];
      return null; // at home base, handled separately
    }
    if (step <= 51) {
      const idx = (START[player] + step) % 52;
      return PATH[idx];
    }
    if (step <= 56) {
      return HOME[player][step - 52];
    }
    return null; // finished
  }

  function isGlobalSafe(player, step) {
    if (step < 0 || step > 51) return true;
    const globalIdx = (START[player] + step) % 52;
    return SAFE.has(globalIdx);
  }

  function getValidMoves(state, playerIdx, dice) {
    const player = state.players[playerIdx];
    const moves = [];
    player.tokens.forEach((step, ti) => {
      if (step === 57) return; // finished
      if (step === -1) {
        if (dice === 6) moves.push({ ti, from: -1, to: 0 });
      } else {
        const newStep = step + dice;
        if (newStep <= 57) moves.push({ ti, from: step, to: newStep });
      }
    });
    return moves;
  }

  function applyMove(state, playerIdx, ti, to) {
    const player = state.players[playerIdx];
    player.tokens[ti] = to;
    const messages = [];
    // Check for captures (only on main path)
    if (to >= 0 && to <= 51 && !isGlobalSafe(player.color, to)) {
      const toCell = getCell(player.color, to);
      state.players.forEach((other, oi) => {
        if (oi === playerIdx) return;
        other.tokens.forEach((ostep, oti) => {
          if (ostep < 0 || ostep > 51) return;
          const otherCell = getCell(other.color, ostep);
          if (otherCell && otherCell[0] === toCell[0] && otherCell[1] === toCell[1]) {
            other.tokens[oti] = -1;
            messages.push(`${player.color} captured ${other.color}'s token!`);
          }
        });
      });
    }
    // Check win
    if (player.tokens.every(s => s === 57)) {
      state.winner = playerIdx;
      messages.push(`${player.color} wins!`);
    }
    return messages;
  }

  // Simple CPU AI
  function aiChooseMove(state, playerIdx, dice) {
    const moves = getValidMoves(state, playerIdx, dice);
    if (!moves.length) return null;
    const player = state.players[playerIdx];

    // Score moves: capture > move farthest > exit home
    let best = null, bestScore = -Infinity;
    moves.forEach(m => {
      let score = m.to; // prefer moving farthest token
      // Bonus for capture
      if (m.to >= 0 && m.to <= 51 && !isGlobalSafe(player.color, m.to)) {
        const toCell = getCell(player.color, m.to);
        state.players.forEach((other, oi) => {
          if (oi === playerIdx) return;
          other.tokens.forEach(ostep => {
            if (ostep >= 0 && ostep <= 51) {
              const oc = getCell(other.color, ostep);
              if (oc && oc[0] === toCell[0] && oc[1] === toCell[1]) score += 200;
            }
          });
        });
      }
      // Bonus for finishing
      if (m.to === 57) score += 500;
      // Bonus for moving out of home
      if (m.from === -1) score += 50;
      if (score > bestScore) { bestScore = score; best = m; }
    });
    return best;
  }

  return { PATH, HOME, HOME_BASE, COLORS, COLORS_LIGHT, ORDER, START, SAFE,
           getCell, getValidMoves, applyMove, aiChooseMove };
})();

/* ============================================================
   LUDO RENDERER
   ============================================================ */
const LudoRenderer = (() => {
  let canvas, ctx, cellSize;
  const BOARD_SIZE = 15;

  function init(c) {
    canvas = c; ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    const maxW = Math.min(window.innerWidth - 200, window.innerHeight - 180, 500);
    cellSize = Math.floor(maxW / BOARD_SIZE);
    canvas.width = cellSize * BOARD_SIZE;
    canvas.height = cellSize * BOARD_SIZE;
  }

  function getCellSize() { return cellSize; }

  function draw(ludoState) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    if (ludoState) drawTokens(ludoState);
  }

  function drawBoard() {
    const cs = cellSize;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    // Board bg
    ctx.fillStyle = isDark ? '#1a1d35' : '#f8f9ff';
    ctx.fillRect(0, 0, cs * BOARD_SIZE, cs * BOARD_SIZE);

    // Corner home zones
    const zoneColors = {
      red:    isDark ? '#3f1010' : '#ffe4e4',
      green:  isDark ? '#0f2e1a' : '#dcfce7',
      blue:   isDark ? '#0f1e3f' : '#dbeafe',
      yellow: isDark ? '#2e2300' : '#fef9c3',
    };
    drawRect(0, 0, 6, 6, zoneColors.red);
    drawRect(0, 9, 6, 6, zoneColors.green);
    drawRect(9, 9, 6, 6, zoneColors.blue);
    drawRect(9, 0, 6, 6, zoneColors.yellow);

    // Inner home bases (white circles background)
    drawInnerHome(0, 0, '#ff4444', zoneColors.red);
    drawInnerHome(0, 9, '#22c55e', zoneColors.green);
    drawInnerHome(9, 9, '#3b82f6', zoneColors.blue);
    drawInnerHome(9, 0, '#eab308', zoneColors.yellow);

    // Home base circles (token start positions)
    drawHomeCircles('red');
    drawHomeCircles('green');
    drawHomeCircles('blue');
    drawHomeCircles('yellow');

    // Path squares
    drawPathSquares();
    drawHomeColumns();

    // Center
    drawCenter();

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cs); ctx.lineTo(canvas.width, i * cs); ctx.stroke();
    }

    // Safe square stars
    const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];
    safePositions.forEach(idx => {
      const [r, c] = LudoEngine.PATH[idx];
      drawStar(c + 0.5, r + 0.5, '⭐');
    });

    // Start arrows (decorative arrow showing entry point)
    drawArrow(6, 1, '→', '#ff4444'); // Red enters going right
    drawArrow(1, 8, '↓', '#22c55e'); // Green enters going down
    drawArrow(8, 13, '←', '#3b82f6'); // Blue enters going left
    drawArrow(13, 6, '↑', '#eab308'); // Yellow enters going up
  }

  function drawRect(row, col, rows, cols, color) {
    ctx.fillStyle = color;
    ctx.fillRect(col * cellSize, row * cellSize, cols * cellSize, rows * cellSize);
  }

  function drawInnerHome(zoneRow, zoneCol, borderColor, bgColor) {
    const cs = cellSize;
    const x = (zoneCol + 0.75) * cs, y = (zoneRow + 0.75) * cs;
    const w = 4.5 * cs;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(x, y, w, w, cs * 0.4);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawHomeCircles(player) {
    const cs = cellSize;
    const positions = LudoEngine.HOME_BASE[player];
    const color = LudoEngine.COLORS[player];
    const light = LudoEngine.COLORS_LIGHT[player];
    positions.forEach(([r, c]) => {
      const cx = c * cs, cy = r * cs, rad = cs * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fillStyle = light;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function drawPathSquares() {
    const cs = cellSize;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const pathColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    LudoEngine.PATH.forEach(([r, c]) => {
      ctx.fillStyle = pathColor;
      ctx.fillRect(c * cs, r * cs, cs, cs);
    });
    // Outline path squares
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    LudoEngine.PATH.forEach(([r, c]) => {
      ctx.strokeRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1);
    });
  }

  function drawHomeColumns() {
    const cs = cellSize;
    const homeColors = {
      red: 'rgba(239,68,68,0.25)', green: 'rgba(34,197,94,0.25)',
      blue: 'rgba(59,130,246,0.25)', yellow: 'rgba(234,179,8,0.25)'
    };
    Object.entries(LudoEngine.HOME).forEach(([player, cells]) => {
      cells.forEach(([r, c]) => {
        ctx.fillStyle = homeColors[player];
        ctx.fillRect(c * cs, r * cs, cs, cs);
        ctx.strokeStyle = LudoEngine.COLORS[player];
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1);
      });
    });
  }

  function drawCenter() {
    const cs = cellSize;
    const cx = 7 * cs, cy = 7 * cs, size = 3 * cs;
    // 4 triangles meeting at center
    const mid = { x: cx + size / 2, y: cy + size / 2 };
    const corners = [
      { x: cx, y: cy }, { x: cx + size, y: cy },
      { x: cx + size, y: cy + size }, { x: cx, y: cy + size }
    ];
    const colors = ['#ef4444','#22c55e','#3b82f6','#eab308'];
    const triangles = [
      [corners[0], corners[1]], [corners[1], corners[2]],
      [corners[2], corners[3]], [corners[3], corners[0]]
    ];
    triangles.forEach(([a, b], i) => {
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
      ctx.lineTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.closePath();
      ctx.fillStyle = colors[i] + '99';
      ctx.fill();
    });
    // Star in center
    ctx.font = `${cs * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', mid.x, mid.y);
  }

  function drawStar(col, row, emoji) {
    const cs = cellSize;
    ctx.font = `${cs * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, col * cs, row * cs);
  }

  function drawArrow(row, col, arrow, color) {
    const cs = cellSize;
    ctx.fillStyle = color;
    ctx.font = `bold ${cs * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arrow, (col + 0.5) * cs, (row + 0.5) * cs);
  }

  function drawTokens(ludoState) {
    const cs = cellSize;
    // Track cells to handle stacking
    const cellMap = {};
    ludoState.players.forEach((player, pi) => {
      player.tokens.forEach((step, ti) => {
        if (step === 57) return; // finished, shown in sidebar
        let cellKey, drawX, drawY;
        if (step === -1) {
          // At home base
          const [r, c] = LudoEngine.HOME_BASE[player.color][ti];
          drawX = c * cs;
          drawY = r * cs;
        } else {
          const cell = LudoEngine.getCell(player.color, step);
          if (!cell) return;
          const [r, c] = cell;
          cellKey = `${r},${c}`;
          if (!cellMap[cellKey]) cellMap[cellKey] = [];
          cellMap[cellKey].push({ player, step, ti });
          return;
        }
        drawToken(drawX, drawY, cs, player.color, ti, ludoState, pi, false, false);
      });
    });
    // Draw stacked tokens
    Object.values(cellMap).forEach(group => {
      const [r, c] = LudoEngine.getCell(group[0].player.color, group[0].step);
      const baseX = c * cs, baseY = r * cs;
      const offsets = [[0,0],[0.5,0],[0,0.5],[0.5,0.5]];
      group.forEach(({ player, step, ti }, gi) => {
        const [ox, oy] = offsets[gi] || [0, 0];
        const isSelected = ludoState.selectedToken &&
          ludoState.selectedToken.pi === ludoState.players.indexOf(player) &&
          ludoState.selectedToken.ti === ti;
        drawToken(baseX + ox * cs * 0.5, baseY + oy * cs * 0.5, cs * (group.length > 1 ? 0.55 : 1),
                  player.color, ti, ludoState, ludoState.players.indexOf(player), isSelected, group.length > 1);
      });
    });
    // Highlight moveable tokens
    if (ludoState.validMoves && ludoState.currentPlayer === 0) {
      ludoState.validMoves.forEach(m => {
        const player = ludoState.players[0];
        let drawX, drawY;
        if (m.from === -1) {
          const [r, c] = LudoEngine.HOME_BASE[player.color][m.ti];
          drawX = c * cs; drawY = r * cs;
        } else {
          const cell = LudoEngine.getCell(player.color, m.from);
          if (!cell) return;
          drawX = cell[1] * cs; drawY = cell[0] * cs;
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.arc(drawX + cs / 2, drawY + cs / 2, cs * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }

  function drawToken(x, y, cs, color, ti, state, pi, isSelected, small) {
    const r = small ? cs * 0.22 : cs * 0.38;
    const cx = x + cs / 2, cy = y + cs / 2;
    // Shadow
    ctx.shadowColor = LudoEngine.COLORS[color];
    ctx.shadowBlur = isSelected ? 12 : 6;
    // Body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, LudoEngine.COLORS_LIGHT[color]);
    g.addColorStop(1, LudoEngine.COLORS[color]);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Number
    if (!small) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${r * 0.85}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ti + 1, cx, cy + 1);
    }
  }

  function getCellFromClick(mouseX, mouseY) {
    const col = Math.floor(mouseX / cellSize);
    const row = Math.floor(mouseY / cellSize);
    return [row, col];
  }

  return { init, draw, resize, getCellFromClick, getCellSize };
})();

/* ============================================================
   TIMER
   ============================================================ */
const Timer = (() => {
  let secs = 0, iv = null, running = false, cb = null;
  function start(callback) {
    if (running) return;
    running = true; cb = callback;
    iv = setInterval(() => { secs++; if (cb) cb(secs); }, 1000);
  }
  function pause() { if (!running) return; running = false; clearInterval(iv); iv = null; }
  function resume() { if (running) return; start(cb); }
  function reset(callback) { pause(); secs = 0; cb = callback; }
  function setSeconds(s) { secs = s; }
  function getSeconds() { return secs; }
  function isRunning() { return running; }
  function format(s) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }
  return { start, pause, resume, reset, setSeconds, getSeconds, isRunning, format };
})();

/* ============================================================
   SOUND ENGINE
   ============================================================ */
const Sound = (() => {
  let ctx = null, enabled = true;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function tone(freq, type, dur, vol) {
    if (!enabled) return;
    try {
      const ac = getCtx(), o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      o.start(ac.currentTime); o.stop(ac.currentTime + dur);
    } catch(e) {}
  }
  function play(t) {
    const m = { place:[440,'sine',.08,.07], error:[200,'sawtooth',.12,.06],
      hint:[600,'sine',.15,.07], win:[880,'sine',.5,.1], erase:[300,'square',.06,.04],
      dice:[350,'square',.1,.08], move:[520,'sine',.1,.07], capture:[280,'sawtooth',.2,.08] };
    const cfg = m[t] || m.place;
    tone(...cfg);
    if (t === 'win') {
      [1,1.25,1.5,2].forEach((mult, i) => setTimeout(() => tone(440*mult,'sine',.3,.08), i*120));
    }
  }
  function toggle() { enabled = !enabled; return enabled; }
  function isEnabled() { return enabled; }
  return { play, toggle, isEnabled };
})();

/* ============================================================
   LOCAL STORAGE
   ============================================================ */
const Store = (() => {
  const get = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };
  function saveSudoku(data) { set('zudolo_sudoku', data); }
  function loadSudoku() { return get('zudolo_sudoku'); }
  function clearSudoku() { try { localStorage.removeItem('zudolo_sudoku'); } catch(e) {} }
  function addScore(diff, secs, mistakes) {
    const lb = get('zudolo_lb') || {};
    if (!lb[diff]) lb[diff] = [];
    lb[diff].push({ time: secs, mistakes, date: Date.now() });
    lb[diff].sort((a, b) => a.time - b.time);
    lb[diff] = lb[diff].slice(0, 5);
    set('zudolo_lb', lb);
  }
  function getLeaderboard() { return get('zudolo_lb') || {}; }
  function getLudoStats() { return get('zudolo_ludo') || { wins: 0, played: 0 }; }
  function addLudoResult(won) {
    const s = getLudoStats();
    s.played++; if (won) s.wins++;
    set('zudolo_ludo', s);
  }
  function getSudokuStats() {
    const lb = getLeaderboard();
    let best = null, wins = 0;
    Object.values(lb).forEach(arr => {
      wins += arr.length;
      arr.forEach(e => { if (!best || e.time < best.time) best = e; });
    });
    return { best, wins };
  }
  return { saveSudoku, loadSudoku, clearSudoku, addScore, getLeaderboard, getLudoStats, addLudoResult, getSudokuStats };
})();

/* ============================================================
   THREE.JS BACKGROUND
   ============================================================ */
const ThreeBG = (() => {
  let renderer, scene, camera, pts, t = 0, af;
  function init() {
    const c = document.getElementById('bg-canvas');
    if (!c || typeof THREE === 'undefined') return;
    renderer = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.z = 3;
    const count = 200, geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random()-.5)*12;
      pos[i*3+1] = (Math.random()-.5)*12;
      pos[i*3+2] = (Math.random()-.5)*4;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pts = new THREE.Points(geo, new THREE.PointsMaterial({ size:.035, color:0x7c6fff, transparent:true, opacity:.3 }));
    scene.add(pts);
    resize(); window.addEventListener('resize', resize);
    (function loop() { af = requestAnimationFrame(loop); t+=.003; pts.rotation.y=t*.15; pts.rotation.x=Math.sin(t*.1)*.08; renderer.render(scene,camera); })();
  }
  function resize() {
    if (!renderer) return;
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    if (camera) { camera.aspect = w/h; camera.updateProjectionMatrix(); }
  }
  function setTheme(dark) { if (pts) pts.material.color.setHex(dark ? 0x7c6fff : 0x6c5fff); }
  return { init, setTheme };
})();

/* ============================================================
   WIN CONFETTI (Three.js)
   ============================================================ */
const WinFX = (() => {
  let renderer, scene, camera, pts, af;
  function start() {
    const c = document.getElementById('win-canvas');
    if (!c || typeof THREE === 'undefined') return;
    c.width = innerWidth; c.height = innerHeight;
    renderer = new THREE.WebGLRenderer({ canvas: c, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(c.width, c.height);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, c.width/c.height, 0.1, 100);
    camera.position.z = 5;
    const count = 320, geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3), vel = [], col = new Float32Array(count*3);
    const palette = [[0.42,0.39,1],[0.18,0.77,0.37],[1,0.44,0.26],[0.98,0.7,0.03],[0,0.75,0.9]];
    for (let i = 0; i < count; i++) {
      pos[i*3]=(Math.random()-.5)*2; pos[i*3+1]=(Math.random()-.5)*2; pos[i*3+2]=(Math.random()-.5)*2;
      vel.push({x:(Math.random()-.5)*.06,y:Math.random()*.05+.02,z:(Math.random()-.5)*.03,ay:-(Math.random()*.006+.003)});
      const [r2,g2,b2]=palette[Math.floor(Math.random()*5)];
      col[i*3]=r2; col[i*3+1]=g2; col[i*3+2]=b2;
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    pts = new THREE.Points(geo, new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:.9}));
    scene.add(pts);
    const pa = geo.attributes.position;
    let frame = 0;
    (function loop(){
      if (!renderer) return;
      af = requestAnimationFrame(loop); frame++;
      for (let i=0;i<count;i++){vel[i].ay-=.0002;pa.array[i*3]+=vel[i].x;pa.array[i*3+1]+=vel[i].y+vel[i].ay*frame*.02;pa.array[i*3+2]+=vel[i].z;}
      pa.needsUpdate=true; pts.material.opacity=Math.max(0,.9-frame*.005);
      if(pts.material.opacity<=0){stop();return;}
      renderer.render(scene,camera);
    })();
  }
  function stop() { if(af)cancelAnimationFrame(af); if(renderer)renderer.dispose(); renderer=scene=camera=pts=null; }
  return { start, stop };
})();

/* ============================================================
   SUDOKU GAME STATE
   ============================================================ */
const SudokuState = (() => {
  let puzzle, solution, board, given, notes, diff;
  let mistakes, hintsLeft, autoCheck, notesMode;
  let undoStack, redoStack, selRow, selCol, numDone;

  function init(puz, sol, d) {
    puzzle = puz.map(r=>[...r]); solution = sol.map(r=>[...r]);
    board = puz.map(r=>[...r]); given = puz.map(r=>r.map(v=>v!==0));
    notes = Array.from({length:9},()=>Array.from({length:9},()=>new Set()));
    diff = d; mistakes = 0; hintsLeft = 3; autoCheck = false; notesMode = false;
    undoStack = []; redoStack = []; selRow = -1; selCol = -1;
    recalc();
  }

  function recalc() {
    numDone = {};
    for (let r=0;r<9;r++) for(let c=0;c<9;c++) {
      const v=board[r][c]; if(v) numDone[v]=(numDone[v]||0)+1;
    }
  }

  function select(r, c) { selRow=r; selCol=c; }
  function getSelected() { return {row:selRow,col:selCol}; }
  function isDone(n) { return (numDone[n]||0)>=9; }

  function snap() {
    return { board:board.map(r=>[...r]), notes:notes.map(r=>r.map(s=>new Set(s))), mistakes };
  }

  function placeNumber(num) {
    if (selRow<0 || given[selRow][selCol]) return null;
    if (notesMode && num!==0) {
      const s=snap(); notes[selRow][selCol].has(num)?notes[selRow][selCol].delete(num):notes[selRow][selCol].add(num);
      undoStack.push(s); redoStack=[]; return {type:'note',row:selRow,col:selCol};
    }
    const s=snap(), prev=board[selRow][selCol];
    board[selRow][selCol]=num;
    let isError=false;
    if (num!==0&&autoCheck&&num!==solution[selRow][selCol]) { mistakes++; isError=true; Sound.play('error'); }
    else if (num!==0) { Sound.play('place'); notes[selRow][selCol].clear(); clearRelatedNotes(selRow,selCol,num); }
    else Sound.play('erase');
    undoStack.push(s); redoStack=[]; recalc();
    return {type:'place',row:selRow,col:selCol,num,prev,isError};
  }

  function clearRelatedNotes(row,col,num) {
    for(let c=0;c<9;c++) notes[row][c].delete(num);
    for(let r=0;r<9;r++) notes[r][col].delete(num);
    const br=Math.floor(row/3)*3,bc=Math.floor(col/3)*3;
    for(let r=br;r<br+3;r++) for(let c=bc;c<bc+3;c++) notes[r][c].delete(num);
  }

  function undo() {
    if(!undoStack.length) return false;
    redoStack.push(snap()); const sn=undoStack.pop();
    board=sn.board; notes=sn.notes; mistakes=sn.mistakes; recalc(); return true;
  }
  function redo() {
    if(!redoStack.length) return false;
    undoStack.push(snap()); const sn=redoStack.pop();
    board=sn.board; notes=sn.notes; mistakes=sn.mistakes; recalc(); return true;
  }

  function getHint() {
    if(hintsLeft<=0) return null;
    const cands=[];
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(!given[r][c]&&board[r][c]!==solution[r][c]) cands.push({r,c});
    if(!cands.length) return null;
    undoStack.push(snap()); redoStack=[];
    const p=cands[Math.floor(Math.random()*cands.length)];
    board[p.r][p.c]=solution[p.r][p.c]; notes[p.r][p.c].clear(); clearRelatedNotes(p.r,p.c,solution[p.r][p.c]);
    hintsLeft--; recalc(); Sound.play('hint'); return p;
  }

  function isComplete() {
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(board[r][c]!==solution[r][c]) return false;
    return true;
  }

  function serialize() {
    return { puzzle:puzzle.map(r=>[...r]),solution:solution.map(r=>[...r]),board:board.map(r=>[...r]),
      given:given.map(r=>[...r]),notes:notes.map(r=>r.map(s=>[...s])),diff,mistakes,hintsLeft,autoCheck,notesMode,
      undoStack:undoStack.map(s=>({board:s.board.map(r=>[...r]),notes:s.notes.map(r=>r.map(ns=>[...ns])),mistakes:s.mistakes})) };
  }

  function deserialize(d) {
    puzzle=d.puzzle; solution=d.solution; board=d.board; given=d.given;
    notes=d.notes.map(r=>r.map(s=>new Set(s))); diff=d.diff; mistakes=d.mistakes;
    hintsLeft=d.hintsLeft; autoCheck=d.autoCheck; notesMode=d.notesMode;
    undoStack=(d.undoStack||[]).map(s=>({board:s.board,notes:s.notes.map(r=>r.map(ns=>new Set(ns))),mistakes:s.mistakes}));
    redoStack=[]; selRow=-1; selCol=-1; recalc();
  }

  return {
    init, select, getSelected, placeNumber, undo, redo, getHint,
    isComplete, serialize, deserialize, isDone,
    get board(){return board}, get given(){return given}, get notes(){return notes},
    get diff(){return diff}, get mistakes(){return mistakes},
    get maxMistakes(){return 3}, get hintsLeft(){return hintsLeft},
    get autoCheck(){return autoCheck}, set autoCheck(v){autoCheck=v},
    get notesMode(){return notesMode}, set notesMode(v){notesMode=v},
  };
})();

/* ============================================================
   LUDO GAME STATE
   ============================================================ */
const LudoState = (() => {
  let state = null;

  function init(playerCount) {
    const allColors = ['red','green','blue','yellow'];
    const active = playerCount === 2 ? ['red','blue'] :
                   playerCount === 3 ? ['red','green','blue'] : allColors;
    state = {
      players: allColors.map((color, i) => ({
        color, isHuman: color === 'red',
        active: active.includes(color),
        tokens: [-1, -1, -1, -1],
        finished: false,
      })),
      currentPlayer: 0,
      dice: null,
      rolled: false,
      validMoves: [],
      selectedToken: null,
      gameOver: false,
      winner: null,
      turnCount: 0,
    };
    // Skip inactive players at start
    while (!state.players[state.currentPlayer].active) {
      state.currentPlayer = (state.currentPlayer + 1) % 4;
    }
  }

  function getState() { return state; }

  function nextActivePlayer(from) {
    let next = (from + 1) % 4;
    let tries = 0;
    while (!state.players[next].active && tries < 4) { next = (next+1)%4; tries++; }
    return next;
  }

  function rollDice() {
    if (!state || state.rolled || state.gameOver) return null;
    const val = Math.floor(Math.random() * 6) + 1;
    state.dice = val;
    state.rolled = true;
    state.turnCount++;
    // Find valid moves for current player
    state.validMoves = LudoEngine.getValidMoves(state, state.currentPlayer, val);
    Sound.play('dice');
    return val;
  }

  function makeMove(ti) {
    if (!state || !state.rolled) return null;
    const move = state.validMoves.find(m => m.ti === ti);
    if (!move) return null;
    const msgs = LudoEngine.applyMove(state, state.currentPlayer, move.ti, move.to);
    Sound.play(msgs.some(m => m.includes('captured')) ? 'capture' : 'move');

    const gotSix = state.dice === 6;
    const won = state.winner !== null;

    if (!won) {
      if (!gotSix) {
        state.currentPlayer = nextActivePlayer(state.currentPlayer);
      }
      state.rolled = false;
      state.validMoves = [];
    } else {
      state.gameOver = true;
    }
    state.selectedToken = null;
    return { msgs, gotSix, won };
  }

  function skipTurn() {
    if (!state) return;
    state.currentPlayer = nextActivePlayer(state.currentPlayer);
    state.rolled = false;
    state.validMoves = [];
    state.selectedToken = null;
  }

  return { init, getState, rollDice, makeMove, skipTurn };
})();

/* ============================================================
   APP CONTROLLER
   ============================================================ */
const App = (() => {
  let isDark = true;
  let activeGame = null; // 'sudoku' | 'ludo'
  let sudokuActive = false;
  const sudokuCells = [];
  let selectedDiff = 'easy';
  let selectedPlayers = 4;
  let ludoCpuTimeout = null;

  /* ---- Screen management ---- */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      if (s.id === id) { s.classList.remove('out'); s.classList.add('active','in'); setTimeout(()=>s.classList.remove('in'),500); }
      else { s.classList.remove('active','in'); }
    });
  }

  /* ---- Theme ---- */
  function setTheme(dark) {
    isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? '' : 'light');
    ThreeBG.setTheme(dark);
    if (activeGame === 'ludo') LudoRenderer.draw(LudoState.getState());
  }

  function toggleTheme() { setTheme(!isDark); }

  /* ---- Dashboard stats ---- */
  function updateDashStats() {
    const ss = Store.getSudokuStats();
    const ls = Store.getLudoStats();
    const lb = Store.getLeaderboard();
    document.getElementById('sudoku-best-dash').textContent = ss.best ? Timer.format(ss.best.time) : '—';
    document.getElementById('sudoku-wins-dash').textContent = ss.wins;
    document.getElementById('ludo-wins-dash').textContent = ls.wins;
    document.getElementById('ludo-games-dash').textContent = ls.played;
    // LB chips
    const chips = document.getElementById('dash-lb-chips');
    let html = '';
    ['easy','medium','hard'].forEach(d => {
      const entries = lb[d] || [];
      if (entries[0]) {
        html += `<span class="lb-chip">
          <span class="lb-chip-rank">${d[0].toUpperCase()}</span>
          <span class="lb-chip-time">${Timer.format(entries[0].time)}</span>
          <span class="lb-chip-diff">${entries[0].mistakes}❌</span>
        </span>`;
      }
    });
    chips.innerHTML = html || '<span class="lb-empty-chip">No records yet — be the first!</span>';
  }

  /* ---- Sudoku ---- */
  function buildSudokuGrid() {
    const grid = document.getElementById('sudoku-grid');
    grid.innerHTML = ''; sudokuCells.length = 0;
    for (let r = 0; r < 9; r++) {
      sudokuCells[r] = [];
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        cell.dataset.row = r; cell.dataset.col = c;
        cell.addEventListener('click', () => onSudokuCellClick(r, c));
        grid.appendChild(cell); sudokuCells[r][c] = cell;
      }
    }
  }

  function renderSudoku() {
    const board = SudokuState.board, given = SudokuState.given, notes = SudokuState.notes;
    const { row: sr, col: sc } = SudokuState.getSelected();
    const conflicts = SudokuEngine.validateConflicts(board);
    const selBox = sr >= 0 ? {br:Math.floor(sr/3)*3,bc:Math.floor(sc/3)*3} : null;
    const selVal = sr >= 0 ? board[sr][sc] : 0;

    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const cell = sudokuCells[r][c], val = board[r][c], noteSet = notes[r][c];
      let cls = 'sudoku-cell';
      if (given[r][c]) cls += ' given';
      const isSel = r===sr&&c===sc;
      const inBox = selBox && r>=selBox.br&&r<selBox.br+3&&c>=selBox.bc&&c<selBox.bc+3;
      if (isSel) cls += ' selected';
      else if (sr>=0&&(r===sr||c===sc||inBox)) cls += ' highlighted';
      if (selVal && selVal===val && !isSel) cls += ' same-number';
      if (conflicts.has(`${r},${c}`) && SudokuState.autoCheck) cls += ' conflict';
      if (!given[r][c] && val && !conflicts.has(`${r},${c}`)) cls += ' user-correct';
      cell.className = cls;

      if (val) { cell.textContent = val; }
      else if (noteSet.size > 0) {
        cell.textContent = '';
        const ng = document.createElement('div'); ng.className = 'notes-grid';
        for (let n = 1; n <= 9; n++) {
          const sp = document.createElement('span'); sp.className = 'note-num';
          sp.textContent = noteSet.has(n) ? n : ''; ng.appendChild(sp);
        }
        cell.appendChild(ng);
      } else { cell.textContent = ''; }
    }
    // Numpad completed
    document.querySelectorAll('.np-btn').forEach(btn => {
      btn.classList.toggle('completed', SudokuState.isDone(parseInt(btn.dataset.num)));
    });
    // Chip updates
    document.getElementById('mistakes-display').textContent = SudokuState.mistakes;
    document.getElementById('max-mistakes').textContent = SudokuState.maxMistakes;
    document.getElementById('difficulty-label').textContent = SudokuState.diff.charAt(0).toUpperCase() + SudokuState.diff.slice(1);
    document.getElementById('btn-notes').classList.toggle('active', SudokuState.notesMode);
    document.getElementById('btn-auto-check').classList.toggle('active', SudokuState.autoCheck);
    const hl = document.getElementById('hints-left'); if (hl) hl.textContent = SudokuState.hintsLeft;
    document.getElementById('btn-hint').disabled = SudokuState.hintsLeft <= 0;
  }

  function onSudokuCellClick(r, c) {
    if (!sudokuActive) return;
    SudokuState.select(r, c); renderSudoku();
  }

  function handleSudokuNumber(num) {
    if (!sudokuActive) return;
    const result = SudokuState.placeNumber(num);
    if (!result) return;
    renderSudoku();
    if (result.type === 'place' && result.num > 0) {
      const cell = sudokuCells[result.row][result.col];
      cell.classList.add('bounce'); setTimeout(() => cell.classList.remove('bounce'), 300);
    }
    if (result.isError) {
      const cell = sudokuCells[result.row][result.col];
      cell.classList.add('conflict'); setTimeout(() => cell.classList.remove('conflict'), 700);
    }
    if (SudokuState.mistakes >= SudokuState.maxMistakes) {
      setTimeout(() => { if (confirm('Too many mistakes! Try again?')) startSudoku(SudokuState.diff); }, 300);
      return;
    }
    if (result.type === 'place' && SudokuState.isComplete()) {
      setTimeout(onSudokuWin, 300);
    }
    Store.saveSudoku({ state: SudokuState.serialize(), elapsed: Timer.getSeconds() });
  }

  function startSudoku(diff) {
    const btn = document.getElementById('btn-start-sudoku');
    btn.textContent = 'Generating...';
    setTimeout(() => {
      const { puzzle, solution } = SudokuEngine.generate(diff);
      SudokuState.init(puzzle, solution, diff);
      buildSudokuGrid();
      Timer.reset(s => document.getElementById('timer-display').textContent = Timer.format(s));
      showScreen('game-screen');
      renderSudoku();
      sudokuActive = true; activeGame = 'sudoku';
      setTimeout(() => Timer.start(s => document.getElementById('timer-display').textContent = Timer.format(s)), 500);
      btn.textContent = 'Start Game';
      Store.clearSudoku();
      document.getElementById('sudoku-setup').classList.add('hidden');
    }, 50);
  }

  function resumeSudoku(save) {
    SudokuState.deserialize(save.state);
    buildSudokuGrid();
    Timer.reset(s => document.getElementById('timer-display').textContent = Timer.format(s));
    Timer.setSeconds(save.elapsed || 0);
    document.getElementById('timer-display').textContent = Timer.format(save.elapsed || 0);
    showScreen('game-screen');
    renderSudoku();
    sudokuActive = true; activeGame = 'sudoku';
    Timer.start(s => document.getElementById('timer-display').textContent = Timer.format(s));
  }

  function onSudokuWin() {
    sudokuActive = false; Timer.pause();
    Store.addScore(SudokuState.diff, Timer.getSeconds(), SudokuState.mistakes);
    Store.clearSudoku();
    showWin({
      trophy: '🏆', title: 'Puzzle Solved!',
      stats: [
        { label: 'Time', val: Timer.format(Timer.getSeconds()) },
        { label: 'Mistakes', val: SudokuState.mistakes },
        { label: 'Difficulty', val: SudokuState.diff.charAt(0).toUpperCase() + SudokuState.diff.slice(1) },
      ],
      onAgain: () => { document.getElementById('sudoku-setup').classList.remove('hidden'); },
    });
  }

  /* ---- Ludo ---- */
  function startLudo(playerCount) {
    document.getElementById('ludo-setup').classList.add('hidden');
    LudoState.init(playerCount);
    showScreen('ludo-screen');
    activeGame = 'ludo';
    const canvas = document.getElementById('ludo-canvas');
    LudoRenderer.init(canvas);
    LudoRenderer.draw(LudoState.getState());
    canvas.addEventListener('click', onLudoCanvasClick);
    updateLudoUI();
    const btn = document.getElementById('btn-roll');
    btn.disabled = false;
    document.getElementById('ludo-msg').textContent = "Red's turn — roll the dice!";
  }

  function onLudoCanvasClick(e) {
    const state = LudoState.getState();
    if (!state || state.gameOver) return;
    if (state.currentPlayer !== 0) return; // not human's turn
    if (!state.rolled || !state.validMoves.length) return;

    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const cs = LudoRenderer.getCellSize();
    const player = state.players[0];

    // Find which token was clicked
    let clickedTi = -1;
    state.validMoves.forEach(m => {
      let cx, cy;
      if (m.from === -1) {
        const [r, c] = LudoEngine.HOME_BASE[player.color][m.ti];
        cx = c * cs; cy = r * cs;
      } else {
        const cell = LudoEngine.getCell(player.color, m.from);
        if (!cell) return;
        cx = cell[1] * cs; cy = cell[0] * cs;
      }
      const dist = Math.sqrt((mx - cx - cs/2)**2 + (my - cy - cs/2)**2);
      if (dist < cs * 0.45) clickedTi = m.ti;
    });

    if (clickedTi >= 0) {
      const result = LudoState.makeMove(clickedTi);
      if (result) {
        LudoRenderer.draw(LudoState.getState());
        updateLudoUI();
        if (result.msgs.length) document.getElementById('ludo-msg').textContent = result.msgs[0];
        if (result.won) {
          setTimeout(onLudoWin, 500);
        } else if (!result.gotSix) {
          setTimeout(doCpuTurns, 800);
        } else {
          document.getElementById('ludo-msg').textContent = "You rolled a 6 — roll again!";
          document.getElementById('btn-roll').disabled = false;
        }
      }
    }
  }

  function doCpuTurns() {
    const state = LudoState.getState();
    if (!state || state.gameOver) return;
    if (state.currentPlayer === 0) return; // human's turn

    const player = state.players[state.currentPlayer];
    if (!player.active) { LudoState.skipTurn(); doCpuTurns(); return; }

    // CPU rolls
    const dice = LudoState.rollDice();
    if (dice === null) return;
    LudoRenderer.draw(state);
    updateLudoUI();
    document.getElementById('ludo-msg').textContent = `${capitalize(player.color)} rolls ${dice}...`;
    animateDice(dice);

    ludoCpuTimeout = setTimeout(() => {
      if (state.gameOver) return;
      const move = LudoEngine.aiChooseMove(state, state.currentPlayer, dice);
      if (move) {
        const result = LudoState.makeMove(move.ti);
        LudoRenderer.draw(LudoState.getState());
        updateLudoUI();
        if (result) {
          if (result.msgs.length) document.getElementById('ludo-msg').textContent = result.msgs[0];
          if (result.won) { setTimeout(onLudoWin, 500); return; }
          if (result.gotSix) {
            setTimeout(doCpuTurns, 900);
          } else {
            setTimeout(afterCpuMove, 600);
          }
        }
      } else {
        document.getElementById('ludo-msg').textContent = `${capitalize(player.color)} has no valid move.`;
        LudoState.skipTurn();
        LudoRenderer.draw(LudoState.getState());
        updateLudoUI();
        setTimeout(afterCpuMove, 600);
      }
    }, 800);
  }

  function afterCpuMove() {
    const state = LudoState.getState();
    if (!state || state.gameOver) return;
    if (state.currentPlayer === 0) {
      document.getElementById('btn-roll').disabled = false;
      document.getElementById('ludo-msg').textContent = "Your turn! Roll the dice.";
    } else {
      doCpuTurns();
    }
  }

  function animateDice(val) {
    const box = document.getElementById('dice-box');
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    box.classList.add('rolling');
    let count = 0;
    const iv = setInterval(() => {
      document.getElementById('dice-val').textContent = faces[Math.floor(Math.random()*6)];
      count++;
      if (count > 8) {
        clearInterval(iv);
        document.getElementById('dice-val').textContent = faces[val - 1];
        box.classList.remove('rolling');
      }
    }, 60);
  }

  function updateLudoUI() {
    const state = LudoState.getState();
    if (!state) return;
    const player = state.players[state.currentPlayer];
    const colors = { red:'#ff4444', green:'#22c55e', blue:'#3b82f6', yellow:'#eab308' };
    const c = colors[player.color];
    const chip = document.getElementById('ludo-turn-chip');
    chip.textContent = `${capitalize(player.color)}'s Turn`;
    chip.style.background = c + '22';
    chip.style.color = c;

    // Update player cards
    ['red','green','blue','yellow'].forEach(col => {
      const card = document.getElementById(`lp-${col}`);
      if (!card) return;
      const p = state.players.find(p => p.color === col);
      card.classList.toggle('current', p && state.players[state.currentPlayer].color === col);
      const dots = card.querySelectorAll('.lp-token-dot');
      p && p.tokens.forEach((step, i) => {
        const dot = dots[i];
        if (!dot) return;
        dot.style.color = colors[col];
        dot.classList.remove('at-home','on-board','done');
        if (step === -1) dot.classList.add('at-home');
        else if (step === 57) dot.classList.add('done');
        else dot.classList.add('on-board');
      });
    });
  }

  function onLudoWin() {
    const state = LudoState.getState();
    const winnerIdx = state.winner;
    const winner = state.players[winnerIdx];
    Store.addLudoResult(winnerIdx === 0); // 0 = human player (Red)
    const isHuman = winnerIdx === 0;
    showWin({
      trophy: isHuman ? '🏆' : '🤖',
      title: isHuman ? 'You Win!' : `${capitalize(winner.color)} Wins!`,
      stats: [
        { label: 'Winner', val: capitalize(winner.color) },
        { label: 'Turns', val: state.turnCount },
        { label: isHuman ? 'Victory!' : 'Better luck next time', val: isHuman ? '🎉' : '😅' },
      ],
      onAgain: () => { document.getElementById('ludo-setup').classList.remove('hidden'); },
    });
  }

  /* ---- Shared win screen ---- */
  function showWin({ trophy, title, stats, onAgain }) {
    document.getElementById('win-trophy').textContent = trophy;
    document.getElementById('win-title').textContent = title;
    const sr = document.getElementById('win-stats');
    sr.innerHTML = stats.map(s =>
      `<div class="win-stat"><span class="win-stat-label">${s.label}</span><span class="win-stat-val">${s.val}</span></div>`
    ).join('');
    showScreen('win-screen');
    WinFX.start(); Sound.play('win');
    document.getElementById('btn-play-again').onclick = () => { WinFX.stop(); onAgain(); };
    document.getElementById('btn-win-menu').onclick = () => { WinFX.stop(); showScreen('dashboard-screen'); updateDashStats(); activeGame = null; };
  }

  /* ---- Keyboard (Sudoku) ---- */
  function onKeydown(e) {
    if (activeGame !== 'sudoku' || !sudokuActive) return;
    const { row, col } = SudokuState.getSelected();
    const moves = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      SudokuState.select(Math.max(0,Math.min(8,row<0?0:row+dr)), Math.max(0,Math.min(8,col<0?0:col+dc)));
      renderSudoku(); return;
    }
    const n = parseInt(e.key);
    if (n >= 1 && n <= 9) { handleSudokuNumber(n); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { handleSudokuNumber(0); return; }
    if (e.key.toLowerCase() === 'n') { SudokuState.notesMode = !SudokuState.notesMode; renderSudoku(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if(SudokuState.undo()){renderSudoku();} return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); if(SudokuState.redo()){renderSudoku();} return; }
    if (e.key.toLowerCase() === 'h') { handleSudokuHint(); return; }
    if (e.key.toLowerCase() === 'p') { togglePause(); return; }
  }

  function handleSudokuHint() {
    const h = SudokuState.getHint();
    if (!h) return;
    renderSudoku();
    const cell = sudokuCells[h.r][h.c];
    cell.classList.add('hint-flash'); setTimeout(() => cell.classList.remove('hint-flash'), 800);
    if (SudokuState.isComplete()) setTimeout(onSudokuWin, 800);
    Store.saveSudoku({ state: SudokuState.serialize(), elapsed: Timer.getSeconds() });
  }

  function togglePause() {
    if (activeGame !== 'sudoku') return;
    if (Timer.isRunning()) {
      Timer.pause();
      document.getElementById('pause-overlay').classList.remove('hidden');
    } else {
      Timer.resume();
      document.getElementById('pause-overlay').classList.add('hidden');
    }
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---- INIT ---- */
  function init() {
    ThreeBG.init();

    // Loading → Dashboard
    setTimeout(() => {
      showScreen('dashboard-screen');
      updateDashStats();
      // Show resume button if save exists
    }, 2200);

    // Theme buttons
    ['btn-theme-dash','btn-theme-game','btn-theme-ludo'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', toggleTheme);
    });

    // Sound
    ['btn-sound-dash'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => {
        const on = Sound.toggle();
        document.getElementById('sound-icon-dash').style.opacity = on ? '1' : '0.4';
      });
    });

    // Leaderboard
    document.getElementById('btn-lb-dash').addEventListener('click', showLeaderboard);
    document.getElementById('btn-close-lb').addEventListener('click', () => document.getElementById('lb-modal').classList.add('hidden'));

    // Game cards → setup modals
    document.getElementById('btn-play-sudoku').addEventListener('click', () => document.getElementById('sudoku-setup').classList.remove('hidden'));
    document.getElementById('btn-play-ludo').addEventListener('click', () => document.getElementById('ludo-setup').classList.remove('hidden'));

    // Sudoku setup
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDiff = btn.dataset.diff;
      });
    });
    document.getElementById('btn-start-sudoku').addEventListener('click', () => startSudoku(selectedDiff));
    document.getElementById('btn-cancel-sudoku').addEventListener('click', () => document.getElementById('sudoku-setup').classList.add('hidden'));

    // Ludo setup
    document.querySelectorAll('.player-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.player-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPlayers = parseInt(btn.dataset.players);
      });
    });
    document.getElementById('btn-start-ludo').addEventListener('click', () => startLudo(selectedPlayers));
    document.getElementById('btn-cancel-ludo').addEventListener('click', () => document.getElementById('ludo-setup').classList.add('hidden'));

    // Sudoku back
    document.getElementById('btn-back').addEventListener('click', () => {
      Timer.pause(); sudokuActive = false;
      Store.saveSudoku({ state: SudokuState.serialize(), elapsed: Timer.getSeconds() });
      showScreen('dashboard-screen'); updateDashStats(); activeGame = null;
    });

    // Ludo back
    document.getElementById('btn-ludo-back').addEventListener('click', () => {
      clearTimeout(ludoCpuTimeout);
      showScreen('dashboard-screen'); updateDashStats(); activeGame = null;
    });

    // Sudoku numpad
    document.querySelectorAll('.np-btn').forEach(btn => {
      btn.addEventListener('click', () => handleSudokuNumber(parseInt(btn.dataset.num)));
    });

    // Sudoku actions
    document.getElementById('btn-undo').addEventListener('click', () => { if(SudokuState.undo()){renderSudoku();} });
    document.getElementById('btn-redo').addEventListener('click', () => { if(SudokuState.redo()){renderSudoku();} });
    document.getElementById('btn-erase').addEventListener('click', () => handleSudokuNumber(0));
    document.getElementById('btn-notes').addEventListener('click', () => { SudokuState.notesMode = !SudokuState.notesMode; renderSudoku(); });
    document.getElementById('btn-hint').addEventListener('click', handleSudokuHint);
    document.getElementById('btn-auto-check').addEventListener('click', () => { SudokuState.autoCheck = !SudokuState.autoCheck; renderSudoku(); });
    document.getElementById('btn-pause-timer').addEventListener('click', togglePause);

    // Pause overlay
    document.getElementById('btn-resume-game').addEventListener('click', () => { Timer.resume(); document.getElementById('pause-overlay').classList.add('hidden'); });
    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      document.getElementById('pause-overlay').classList.add('hidden');
      Timer.pause(); sudokuActive = false;
      Store.saveSudoku({ state: SudokuState.serialize(), elapsed: Timer.getSeconds() });
      showScreen('dashboard-screen'); updateDashStats(); activeGame = null;
    });

    // Ludo roll
    document.getElementById('btn-roll').addEventListener('click', () => {
      const state = LudoState.getState();
      if (!state || state.gameOver) return;
      if (state.currentPlayer !== 0 || state.rolled) return;
      const val = LudoState.rollDice();
      if (val === null) return;
      animateDice(val);
      document.getElementById('btn-roll').disabled = true;
      LudoRenderer.draw(state);
      updateLudoUI();
      setTimeout(() => {
        if (!state.validMoves.length) {
          document.getElementById('ludo-msg').textContent = "No valid moves — turn passes.";
          setTimeout(() => { LudoState.skipTurn(); LudoRenderer.draw(LudoState.getState()); updateLudoUI(); doCpuTurns(); }, 1000);
        } else {
          document.getElementById('ludo-msg').textContent = `You rolled ${val}! Click a highlighted token to move.`;
          LudoRenderer.draw(state);
        }
      }, 600);
    });

    // Keyboard
    document.addEventListener('keydown', onKeydown);

    // Check for saved sudoku game
    const save = Store.loadSudoku();
    // (Could auto-prompt resume here if desired)
  }

  function showLeaderboard() {
    const lb = Store.getLeaderboard();
    let html = '';
    ['easy','medium','hard'].forEach(d => {
      const entries = lb[d] || [];
      html += `<div class="lb-section"><div class="lb-section-title">${d.charAt(0).toUpperCase()+d.slice(1)}</div>`;
      if (!entries.length) html += '<div class="lb-no-data">No records yet</div>';
      else entries.forEach((e,i) => {
        html += `<div class="lb-entry"><span class="lb-rank">#${i+1}</span><span class="lb-time">${Timer.format(e.time)}</span><span class="lb-meta">${e.mistakes} mistake${e.mistakes!==1?'s':''}</span></div>`;
      });
      html += '</div>';
    });
    document.getElementById('lb-content').innerHTML = html;
    document.getElementById('lb-modal').classList.remove('hidden');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
