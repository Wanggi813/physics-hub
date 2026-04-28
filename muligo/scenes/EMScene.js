class EMScene extends Phaser.Scene {
  constructor() {
    super('EMScene');
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.collected  = new Set();
    this.cleared    = false;
    this.stunned    = false;
    this.zoneTimer  = 4000;
    this.panelSlots = ['unstable', 'unstable', 'unstable', 'unstable'];
    this.lockActive = false;
    this.lockMini   = null;
    this.stabilizedCells = new Set();


    this.COLS = 6;
    this.ROWS = 4;
    this.patternIdx = 0;



    this.patterns = [

      [ 2,0,3,1,2,1,
        0,1,2,2,1,3,
        1,2,0,3,2,1,
        2,3,1,0,1,3 ],

      [ 0,1,1,0,1,0,
        1,0,2,2,0,1,
        1,2,0,0,2,0,
        0,0,1,1,0,3 ],

      [ 0,2,2,3,2,0,
        2,3,2,2,3,2,
        0,2,2,2,2,3,
        1,0,2,2,0,1 ],

      [ 1,0,2,2,0,1,
        0,1,3,3,1,0,
        3,0,1,1,0,3,
        1,1,0,0,1,1 ],

      [ 3,1,0,1,3,1,
        1,3,1,0,1,3,
        0,1,3,1,0,1,
        1,0,1,3,1,0 ],
    ];
    this.currentPattern = [...this.patterns[0]];


    this.cameras.main.setBackgroundColor('#0c1210');
    this.cameras.main.fadeIn(500);

    this.drawRoom();
    this.startLightFlicker();
    this.startMeterAnimation();
    this.createWalls();
    this.createGrid();
    this.createItems();
    this.createPanel();
    this.createPlayer();
    this.createControls();
    this.createHUD();
    this.showIntroCard();

    this.time.delayedCall(6200, () =>
      this.say('시물이', '전자기장이 구역을 나눠서 퍼져있어! 4초마다 패턴이 바뀌니까 타이밍 잡아서 이동하고, 중앙 배전반에 닿아야 해!')
    );
  }


  drawRoom() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(0x141c14, 1);
    g.fillRect(0, 0, W, H);
    for (let x = 64; x < W - 64; x += 80) {
      g.lineStyle(1, 0x1e2e1e, 0.5);
      g.lineBetween(x, 64, x, H - 64);
    }
    for (let y = 64; y < H - 64; y += 80) {
      g.lineStyle(1, 0x1e2e1e, 0.5);
      g.lineBetween(64, y, W - 64, y);
    }

    // Floor safety line
    g.lineStyle(3, 0xb89010, 0.32);
    g.strokeRect(82, 82, W - 164, H - 164);
    g.lineStyle(1, 0xb89010, 0.14);
    g.strokeRect(90, 90, W - 180, H - 180);

    g.fillStyle(0x1e2c1e, 1);
    g.fillRect(0, 0, W, 56);
    g.fillRect(0, H - 56, W, 56);
    g.fillRect(0, 0, 56, H);
    g.fillRect(W - 56, 0, 56, H);

    for (let i = 0; i < 12; i++) {
      const x = 56 + i * (W - 112) / 12;
      g.fillStyle(i % 2 === 0 ? 0x1e2c1e : 0x243024, 1);
      g.fillRect(x, 0, (W - 112) / 12, 56);
      g.fillRect(x, H - 56, (W - 112) / 12, 56);
    }

    this.drawCableTrays();
    this.drawTransformers();
    this.drawMeterPanel();
    this.drawCeilingLights();
    this.drawFloorEquipment();


    g.fillStyle(0x0e180e, 1);
    g.fillRoundedRect(W / 2 - 140, 6, 280, 44, 4);
    g.lineStyle(2, 0x50ff80, 0.6);
    g.strokeRoundedRect(W / 2 - 140, 6, 280, 44, 4);
    this.add.text(W / 2, 28, '시물이 · 전자기 분석 시스템', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#70ff90', fontStyle: '700'
    }).setOrigin(0.5).setDepth(1);


    const tg = this.add.graphics().setDepth(2);
    tg.fillStyle(0x283828, 1);
    this.tableRects().forEach(({ x, y, w, h }) => {
      tg.fillRoundedRect(x, y, w, h, 4);
      tg.lineStyle(2, 0x3a5a3a, 0.8);
      tg.strokeRoundedRect(x, y, w, h, 4);
      tg.lineStyle(1, 0x2a4a2a, 0.5);
      tg.lineBetween(x + 8, y + h * 0.5, x + w - 8, y + h * 0.5);
      tg.fillStyle(0x1e321e, 0.8);
      tg.fillRoundedRect(x + 6, y + h * 0.22, w * 0.38, h * 0.3, 2);
    });

    this.drawCenterPanel(g);


    const mg = this.add.graphics().setDepth(3);
    mg.fillStyle(0xf0ffe0, 0.92);
    mg.fillRect(W - 168, H * 0.35, 108, 92);
    mg.lineStyle(1, 0x80a060, 0.5);
    mg.strokeRect(W - 168, H * 0.35, 108, 92);
    this.add.text(W - 162, H * 0.35 + 6,
      '유도 전류 방향\nA 슬롯: N\nB 슬롯: S\nC 슬롯: N\nD 슬롯: S',
      { fontFamily: 'Pretendard, Malgun Gothic, sans-serif', fontSize: '10px', color: '#203010' }
    ).setDepth(4);
  }


  drawCenterPanel(g) {
    const { W, H } = this;
    const cx = W / 2, cy = H / 2;
    const PW = 310, PH = 210;
    const px = cx - PW / 2, py = cy - PH / 2;

    // Ground circle guides
    g.lineStyle(1, 0x30d060, 0.07);
    g.strokeCircle(cx, cy, 118);
    g.lineStyle(1, 0x30d060, 0.04);
    g.strokeCircle(cx, cy, 136);

    // Drop shadow
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(px + 7, py + 7, PW, PH, 10);

    // Main housing body
    g.fillStyle(0x141f14, 1);
    g.fillRoundedRect(px, py, PW, PH, 10);

    // Outer frame stroke
    g.lineStyle(3, 0x2e4a2e, 1);
    g.strokeRoundedRect(px, py, PW, PH, 10);

    // Inner highlight inset
    g.lineStyle(1, 0x50ff80, 0.22);
    g.strokeRoundedRect(px + 5, py + 5, PW - 10, PH - 10, 7);

    // Header bar
    g.fillStyle(0x0c170c, 1);
    g.fillRoundedRect(px + 8, py + 8, PW - 16, 36, 5);
    g.lineStyle(1, 0x40b060, 0.5);
    g.strokeRoundedRect(px + 8, py + 8, PW - 16, 36, 5);

    // Header caution stripes
    for (let i = 0; i < 10; i++) {
      const sw = (PW - 16) / 10;
      g.fillStyle(i % 2 === 0 ? 0x1e3a1e : 0x111c11, 0.5);
      g.fillRect(px + 8 + i * sw, py + 8, sw, 36);
    }
    // Header re-clip (restore rounded corners by drawing solid background on sides)
    g.fillStyle(0x0c170c, 1);
    g.fillRect(px + 8, py + 8, 5, 36);
    g.fillRect(px + PW - 13, py + 8, 5, 36);

    // Interior grid texture
    g.lineStyle(1, 0x1a2e1a, 0.4);
    for (let gy = py + 52; gy < py + PH - 10; gy += 12) {
      g.lineBetween(px + 12, gy, px + PW - 12, gy);
    }
    for (let gx = px + 12; gx < px + PW - 12; gx += 16) {
      g.lineBetween(gx, py + 52, gx, py + PH - 10);
    }

    // Status LED row (below header)
    const ledColors = [0x20ff50, 0x20ff50, 0xffc020, 0xffc020, 0xff4040, 0xff4040];
    ledColors.forEach((col, i) => {
      const lx = cx - 60 + i * 24;
      const ly = py + 56;
      g.fillStyle(col, 0.85);
      g.fillCircle(lx, ly, 3.5);
      g.lineStyle(1, col, 0.35);
      g.strokeCircle(lx, ly, 6);
    });

    // Copper bus bars
    [0.44, 0.68].forEach(frac => {
      const by = py + PH * frac;
      g.fillStyle(0x7a5a10, 0.65);
      g.fillRect(px + 16, by, PW - 32, 5);
      g.lineStyle(1, 0xb88820, 0.45);
      g.lineBetween(px + 16, by + 1, px + PW - 16, by + 1);
      g.lineStyle(1, 0x3a2a08, 0.4);
      g.lineBetween(px + 16, by + 4, px + PW - 16, by + 4);
    });

    // Left & right cable entry channels
    [px + 2, px + PW - 12].forEach(lx => {
      g.fillStyle(0x1e2e1e, 1);
      g.fillRoundedRect(lx, py + PH * 0.38, 10, PH * 0.46, 3);
      g.lineStyle(1, 0x304530, 0.6);
      g.strokeRoundedRect(lx, py + PH * 0.38, 10, PH * 0.46, 3);
      for (let j = 0; j < 5; j++) {
        const ky = py + PH * 0.38 + 8 + j * (PH * 0.46 - 14) / 4;
        g.fillStyle(0x0a120a, 1);
        g.fillCircle(lx + 5, ky, 2.5);
        g.lineStyle(1, 0x3a5a3a, 0.5);
        g.strokeCircle(lx + 5, ky, 2.5);
      }
    });

    // Slot bay inset panel
    g.fillStyle(0x0a150a, 0.95);
    g.fillRoundedRect(cx - 122, cy - 18, 244, 68, 5);
    g.lineStyle(1.5, 0x2a4a2a, 0.7);
    g.strokeRoundedRect(cx - 122, cy - 18, 244, 68, 5);
    g.lineStyle(1, 0x60ff90, 0.12);
    g.strokeRoundedRect(cx - 119, cy - 15, 238, 62, 4);

    // Slot bay circuit traces connecting slots
    g.lineStyle(1, 0x20a040, 0.3);
    g.lineBetween(cx - 108, cy + 34, cx + 108, cy + 34);
    for (let i = 0; i < 4; i++) {
      const sx = cx - 78 + i * 52;
      g.lineBetween(sx, cy + 34, sx, cy + 38);
      g.fillStyle(0x20a040, 0.5);
      g.fillCircle(sx, cy + 38, 2);
    }

    // Warning indicators on left edge
    [0.52, 0.66, 0.80].forEach((frac, i) => {
      const wy = py + PH * frac;
      g.fillStyle(i === 0 ? 0xb03010 : 0x143014, 0.8);
      g.fillRoundedRect(px + 14, wy - 4, 8, 8, 2);
      g.lineStyle(1, i === 0 ? 0xff5030 : 0x305030, 0.5);
      g.strokeRoundedRect(px + 14, wy - 4, 8, 8, 2);
    });

    // Bottom terminal block
    for (let i = 0; i < 6; i++) {
      const tx = cx - 70 + i * 28;
      const ty = py + PH - 18;
      g.fillStyle(0x1e2e1e, 1);
      g.fillRoundedRect(tx - 7, ty - 3, 14, 13, 2);
      g.lineStyle(1, i % 2 === 0 ? 0x40b050 : 0x286030, 0.6);
      g.strokeRoundedRect(tx - 7, ty - 3, 14, 13, 2);
      g.fillStyle(i % 3 === 0 ? 0x40b060 : 0x1a3a1a, 0.9);
      g.fillCircle(tx, ty + 4, 2);
    }

    // Corner bolts / rivets
    [[px + 14, py + 14], [px + PW - 14, py + 14],
     [px + 14, py + PH - 14], [px + PW - 14, py + PH - 14]].forEach(([rx, ry]) => {
      g.fillStyle(0x243824, 1);
      g.fillCircle(rx, ry, 5);
      g.lineStyle(1.5, 0x4a6e4a, 0.8);
      g.strokeCircle(rx, ry, 5);
      g.lineStyle(1, 0x70ff90, 0.14);
      g.strokeCircle(rx, ry, 7.5);
      // Cross slot on bolt
      g.lineStyle(1, 0x3a583a, 0.6);
      g.lineBetween(rx - 3, ry, rx + 3, ry);
      g.lineBetween(rx, ry - 3, rx, ry + 3);
    });

    // Alert indicators (flashing circles) each side of panel
    const cg = this.add.graphics().setDepth(6);
    [cx - PW / 2 + 28, cx + PW / 2 - 28].forEach(ax => {
      cg.fillStyle(0xff2020, 0.85);
      cg.fillCircle(ax, cy, 6);
      cg.lineStyle(2, 0xff6060, 0.4);
      cg.strokeCircle(ax, cy, 10);
    });

    // Label area above slots
    cg.fillStyle(0x0c1c0c, 1);
    cg.fillRoundedRect(cx - 82, cy - 16, 164, 14, 3);
    cg.lineStyle(1, 0x30a050, 0.4);
    cg.strokeRoundedRect(cx - 82, cy - 16, 164, 14, 3);

    this.add.text(cx, cy - 9, 'CARD SLOTS  ·  카드 슬롯', {
      fontFamily: 'monospace', fontSize: '9px', color: '#40c060'
    }).setOrigin(0.5).setDepth(7);

    this.add.text(cx, py + 26, '중앙 배전반  ·  MAIN DISTRIBUTION PANEL', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#70ff90', fontStyle: '700'
    }).setOrigin(0.5).setDepth(7);
  }


  createGrid() {
    const { W, H } = this;
    const cellW = (W - 112) / this.COLS;
    const cellH = (H - 112) / this.ROWS;

    this.gridCells = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.gridCells.push({
          r, c,
          x: 56 + c * cellW + cellW / 2,
          y: 56 + r * cellH + cellH / 2,
          w: cellW,
          h: cellH,
        });
      }
    }

    this.cellGraphics = this.gridCells.map((cell, i) => {
      const gfx = this.add.graphics().setDepth(5);
      this.drawCell(gfx, cell, this.currentPattern[i]);
      return gfx;
    });


    const borderG = this.add.graphics().setDepth(4);
    borderG.lineStyle(1, 0x253525, 0.55);
    this.gridCells.forEach(cell => {
      borderG.strokeRect(cell.x - cell.w / 2, cell.y - cell.h / 2, cell.w, cell.h);
    });

    // Minimap preview
    this.previewG = this.add.graphics().setDepth(22);
    this.previewLabels = [];
    this.updatePreview();


    this.patternEvent = this.time.addEvent({
      delay: 4000, loop: true,
      callback: () => this.advancePattern()
    });
  }

  redrawCell(i) {
    this.drawCell(this.cellGraphics[i], this.gridCells[i], this.currentPattern[i]);
  }

  drawCell(gfx, cell, type) {
    const { x, y, w, h } = cell;
    const l = x - w / 2, t = y - h / 2;

    gfx.clear();
    if (type === 0) return;

    const fills   = [0, 0x2050d0, 0xd02020, 0xd0d000];
    const borders = [0, 0x4080ff, 0xff4040, 0xffff30];
    const alpha   = [0, 0.14, 0.14, 0.19];

    gfx.fillStyle(fills[type], alpha[type]);
    gfx.fillRect(l + 2, t + 2, w - 4, h - 4);
    gfx.lineStyle(1.5, borders[type], 0.55);
    gfx.strokeRect(l + 2, t + 2, w - 4, h - 4);


    gfx.lineStyle(2, borders[type], 0.85);
    const arm = Math.min(w, h) * 0.22;

    if (type === 1) {
      // PULL
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 2;
        const ox  = Math.cos(rad) * arm, oy = Math.sin(rad) * arm;
        const ix  = Math.cos(rad) * (arm * 0.3), iy = Math.sin(rad) * (arm * 0.3);
        gfx.lineBetween(x + ox, y + oy, x + ix, y + iy);
        const tipAngle = Math.atan2(iy - oy, ix - ox);
        for (const da of [Math.PI * 0.7, -Math.PI * 0.7]) {
          gfx.lineBetween(x + ix, y + iy,
            x + ix + Math.cos(tipAngle + da) * 8,
            y + iy + Math.sin(tipAngle + da) * 8);
        }
      }
    } else if (type === 2) {
      // PUSH
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 2;
        const ix  = Math.cos(rad) * (arm * 0.3), iy = Math.sin(rad) * (arm * 0.3);
        const ox  = Math.cos(rad) * arm, oy = Math.sin(rad) * arm;
        gfx.lineBetween(x + ix, y + iy, x + ox, y + oy);
        const tipAngle = Math.atan2(oy - iy, ox - ix);
        for (const da of [Math.PI * 0.7, -Math.PI * 0.7]) {
          gfx.lineBetween(x + ox, y + oy,
            x + ox + Math.cos(tipAngle + da) * 8,
            y + oy + Math.sin(tipAngle + da) * 8);
        }
      }
    } else if (type === 3) {

      gfx.lineStyle(3.5, 0xffff40, 0.95);
      gfx.beginPath();
      const s = Math.min(w, h) * 0.28;
      gfx.moveTo(x + s * 0.4,  y - s);
      gfx.lineTo(x - s * 0.15, y - s * 0.1);
      gfx.lineTo(x + s * 0.35, y - s * 0.1);
      gfx.lineTo(x - s * 0.4,  y + s);
      gfx.strokePath();
    }
  }

  redrawAllCells() {
    this.cellGraphics.forEach((gfx, i) =>
      this.drawCell(gfx, this.gridCells[i], this.currentPattern[i])
    );
  }

  advancePattern() {
    if (this.cleared || this.lockActive) return;
    this.patternIdx = (this.patternIdx + 1) % this.patterns.length;
    this.currentPattern = [...this.patterns[this.patternIdx]];
    this.stabilizedCells.forEach(i => { this.currentPattern[i] = 0; });
    this.redrawAllCells();
    this.updatePreview();
    this.zoneTimer = 4000;

    const names = ['세로 통로', '가로 통로', '아크 패턴'];
    this.say('시물이', `패턴 변경 → ${names[this.patternIdx]}! 안전한 칸을 확인해!`);
    this.cameras.main.shake(80, 0.005);


    const flash = this.add.graphics().setDepth(30).setAlpha(0);
    flash.fillStyle(0x204820, 1);
    flash.fillRect(0, 0, this.W, this.H);
    this.tweens.add({ targets: flash, alpha: 0.12, duration: 60, yoyo: true, onComplete: () => flash.destroy() });
  }


  updatePreview() {
    const { W, H } = this;
    const nextIdx  = (this.patternIdx + 1) % this.patterns.length;
    const nextPat  = this.patterns[nextIdx];

    const PW  = 162, PH = 100;
    const px0 = W - 10 - PW, py0 = H - 10 - PH;
    const pcw = PW / this.COLS, pch = PH / this.ROWS;

    this.previewG.clear();
    this.previewLabels.forEach(t => t.destroy());
    this.previewLabels = [];


    this.previewG.fillStyle(0x080e08, 0.88);
    this.previewG.fillRoundedRect(px0 - 4, py0 - 18, PW + 8, PH + 22, 4);
    this.previewG.lineStyle(1, 0x30e060, 0.35);
    this.previewG.strokeRoundedRect(px0 - 4, py0 - 18, PW + 8, PH + 22, 4);

    const lbl = this.add.text(px0 + PW / 2, py0 - 11, '다음 패턴', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px', color: '#50c070', fontStyle: '700'
    }).setOrigin(0.5, 0).setDepth(23);
    this.previewLabels.push(lbl);

    const fills   = [0x1a2e1a, 0x2050d0, 0xd02020, 0xd0c800];
    const palpha  = [0.25, 0.65, 0.65, 0.70];
    const borders = [0x253525, 0x4080ff, 0xff4040, 0xffff30];

    nextPat.forEach((type, i) => {
      const r = Math.floor(i / this.COLS), c = i % this.COLS;
      const rx = px0 + c * pcw, ry = py0 + r * pch;
      this.previewG.fillStyle(fills[type], palpha[type]);
      this.previewG.fillRect(rx + 1, ry + 1, pcw - 2, pch - 2);
      this.previewG.lineStyle(0.5, borders[type], 0.4);
      this.previewG.strokeRect(rx, ry, pcw, pch);
    });


    const centerCols = [Math.floor(this.COLS / 2) - 1, Math.floor(this.COLS / 2)];
    const centerRows = [Math.floor(this.ROWS / 2) - 1, Math.floor(this.ROWS / 2)];
    centerRows.forEach(cr => centerCols.forEach(cc => {
      const rx = px0 + cc * pcw, ry = py0 + cr * pch;
      this.previewG.lineStyle(1.5, 0x50ff80, 0.7);
      this.previewG.strokeRect(rx + 1, ry + 1, pcw - 2, pch - 2);
    }));
  }


  applyGridEffect() {
    if (this.stunned) return;
    const px = this.player.x, py = this.player.y;


    if (Phaser.Math.Distance.Between(px, py, this.W / 2, this.H / 2) < 96) return;

    for (let i = 0; i < this.gridCells.length; i++) {
      const cell = this.gridCells[i];
      if (px < cell.x - cell.w / 2 || px > cell.x + cell.w / 2 ||
          py < cell.y - cell.h / 2 || py > cell.y + cell.h / 2) continue;

      const type = this.currentPattern[i];
      if (type === 1) {
        const dx = cell.x - px, dy = cell.y - py;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        this.player.body.velocity.x = this.player.body.velocity.x * 0.89 + (dx / d) * 115;
        this.player.body.velocity.y = this.player.body.velocity.y * 0.89 + (dy / d) * 115;
      } else if (type === 2) {
        const dx   = px - cell.x, dy = py - cell.y;
        const d    = Math.sqrt(dx * dx + dy * dy) || 1;
        const edge = Math.max(0, 1 - d / (Math.min(cell.w, cell.h) * 0.5));
        this.player.body.velocity.x += (dx / d) * (280 + edge * 180);
        this.player.body.velocity.y += (dy / d) * (280 + edge * 180);
      } else if (type === 3) {
        this.triggerStun(cell);
      }
      break;
    }
  }

  triggerStun(cell) {
    if (this.stunned) return;
    this.stunned = true;
    this.cameras.main.flash(220, 255, 240, 60, true);
    this.cameras.main.shake(200, 0.015);
    const dx  = this.player.x - cell.x;
    const dy  = this.player.y - cell.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.player.setVelocity((dx / len) * 420, (dy / len) * 420);
    this.say('시물이', '아크 방전! 0.8초 스턴. 다음 패턴 때 타이밍을 노려!');
    this.time.delayedCall(800, () => {
      this.stunned = false;
      this.player.setVelocity(0, 0);
    });
  }


  drawCableTrays() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(1);

    g.fillStyle(0x2c3c2c, 1);
    g.fillRect(56, 40, W - 112, 16);
    g.lineStyle(1, 0x3e5040, 0.9);
    g.strokeRect(56, 40, W - 112, 16);
    for (let x = 72; x < W - 56; x += 22) {
      g.lineStyle(1, 0x3a4c3a, 0.5);
      g.lineBetween(x, 40, x, 56);
    }
    [
      { y: 43, col: 0xff2020, a: 0.7 },
      { y: 46, col: 0x2020ff, a: 0.7 },
      { y: 49, col: 0x20d020, a: 0.7 },
      { y: 52, col: 0xa0a0a0, a: 0.5 },
      { y: 54, col: 0xd0c830, a: 0.4 },
    ].forEach(c => {
      g.lineStyle(2, c.col, c.a);
      g.lineBetween(58, c.y, W - 58, c.y);
    });
    [W * 0.22, W * 0.42, W * 0.62, W * 0.82].forEach(hx => {
      g.fillStyle(0x384838, 1);
      g.fillRect(hx - 2, 0, 4, 42);
      g.fillStyle(0x304030, 1);
      g.fillRect(hx - 5, 38, 10, 4);
    });

    g.fillStyle(0x2c3c2c, 1);
    g.fillRect(40, 56, 16, H - 112);
    g.lineStyle(1, 0x3e5040, 0.9);
    g.strokeRect(40, 56, 16, H - 112);
    for (let y = 72; y < H - 56; y += 22) {
      g.lineStyle(1, 0x3a4c3a, 0.5);
      g.lineBetween(40, y, 56, y);
    }
    [0xff2020, 0x2020ff, 0x20d020].forEach((c, i) => {
      g.lineStyle(2, c, 0.65);
      g.lineBetween(43 + i * 4, 58, 43 + i * 4, H - 58);
    });
  }


  drawTransformers() {
    const { H } = this;
    const g = this.add.graphics().setDepth(2);
    this.drawSingleTransformer(g, 4, H * 0.18, 'TR-1');
    this.drawSingleTransformer(g, 4, H * 0.52, 'TR-2');
  }

  drawSingleTransformer(g, x, y, label) {
    const bw = 52, bh = 74;
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x243224, 1);
      g.fillRect(x + bw, y + 5 + i * 11, 9, 8);
      g.lineStyle(1, 0x384838, 0.7);
      g.strokeRect(x + bw, y + 5 + i * 11, 9, 8);
    }
    g.fillStyle(0x2e3e2e, 1);
    g.fillRect(x, y, bw, bh);
    g.lineStyle(2, 0x4a604a, 1);
    g.strokeRect(x, y, bw, bh);
    g.fillStyle(0x243424, 1);
    g.fillRect(x + 4, y + 4, bw - 8, bh - 8);
    for (let i = 0; i < 4; i++) {
      g.lineStyle(1, 0x38503a, 0.5);
      g.lineBetween(x + 7, y + 14 + i * 11, x + bw - 7, y + 14 + i * 11);
    }
    g.fillStyle(0xb89010, 0.65);
    g.fillRect(x + 4, y + bh * 0.44, bw - 8, 13);
    for (let s = 0; s < 5; s++) {
      g.fillStyle(0x181c18, 0.55);
      g.fillTriangle(x + 4 + s * 10, y + bh * 0.44, x + 4 + s * 10 + 7, y + bh * 0.44, x + 4 + s * 10, y + bh * 0.44 + 13);
    }
    g.fillStyle(0x1a281a, 1);
    g.fillRoundedRect(x + 7, y + bh - 22, bw - 14, 18, 2);
    g.lineStyle(1, 0x406040, 0.7);
    g.strokeRoundedRect(x + 7, y + bh - 22, bw - 14, 18, 2);
    this.add.text(x + bw / 2, y + bh - 13, label, {
      fontFamily: 'monospace', fontSize: '9px', color: '#80b080', fontStyle: '700'
    }).setOrigin(0.5).setDepth(3);
    [x + 10, x + 26, x + 42].forEach(ix => {
      g.fillStyle(0x688060, 1);
      g.fillRect(ix - 3, y - 24, 6, 26);
      for (let d = 0; d < 3; d++) {
        g.fillStyle(0x8a9e78, 1);
        g.fillEllipse(ix, y - 8 - d * 7, 13, 5);
      }
      g.fillStyle(0xb0c090, 1);
      g.fillCircle(ix, y - 23, 4);
      g.lineStyle(1, 0x707070, 0.5);
      g.lineBetween(ix, y - 27, ix, y - 34);
    });
    g.fillStyle(0xff1818, 1);
    g.fillCircle(x + bw - 7, y + 8, 3.5);
    g.lineStyle(1.5, 0xff6060, 0.4);
    g.strokeCircle(x + bw - 7, y + 8, 5.5);
  }


  drawMeterPanel() {
    const { W, H } = this;
    const px = W - 54, py = H * 0.08;
    const pw = 48, ph = H * 0.62;
    const pg = this.add.graphics().setDepth(2);
    pg.fillStyle(0x222e22, 1);
    pg.fillRect(px, py, pw, ph);
    pg.lineStyle(2, 0x3c503c, 1);
    pg.strokeRect(px, py, pw, ph);
    this.add.text(px + pw / 2, py + 7, '계기반', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '9px', color: '#60a060', fontStyle: '700'
    }).setOrigin(0.5, 0).setDepth(3);
    pg.lineStyle(1, 0x2e402e, 0.7);
    pg.lineBetween(px + 4, py + 20, px + pw - 4, py + 20);
    const gcx = px + pw / 2;
    this.meterNeedles = [
      { cy: py + ph * 0.22, label: 'A', val: 0.79 },
      { cy: py + ph * 0.46, label: 'V', val: 0.51 },
      { cy: py + ph * 0.70, label: 'W', val: 0.87 },
    ].map(gd => this.drawGauge(pg, gcx, gd.cy, gd.label, gd.val));
    pg.lineStyle(1, 0x2e402e, 0.7);
    pg.lineBetween(px + 4, py + ph * 0.83, px + pw - 4, py + ph * 0.83);
    const ledY = py + ph * 0.91;
    [{ col: 0xff2020, on: true }, { col: 0xffaa20, on: true }, { col: 0x20ff60, on: false }]
      .forEach((led, i) => {
        const lx = px + 9 + i * 14;
        pg.fillStyle(led.col, led.on ? 0.9 : 0.2);
        pg.fillCircle(lx, ledY, 4);
        if (led.on) { pg.lineStyle(1, led.col, 0.3); pg.strokeCircle(lx, ledY, 6); }
      });
    this.add.text(px + pw / 2, py + ph * 0.97, '이상 감지', {
      fontFamily: 'monospace', fontSize: '7px', color: '#ff5050'
    }).setOrigin(0.5).setDepth(3);
    [[px + 4, py + 4], [px + pw - 4, py + 4],
     [px + 4, py + ph - 4], [px + pw - 4, py + ph - 4]].forEach(([bx, by]) => {
      pg.fillStyle(0x4a5e4a, 0.9);
      pg.fillCircle(bx, by, 2.5);
    });
  }

  drawGauge(panelG, cx, cy, unit, needleFraction) {
    const r = 16;
    panelG.fillStyle(0x0c1410, 1);
    panelG.fillCircle(cx, cy, r);
    panelG.lineStyle(1.5, 0x3a5040, 1);
    panelG.strokeCircle(cx, cy, r);
    const sa = (-5 * Math.PI) / 6, sw = (5 * Math.PI) / 3;
    for (let tick = 0; tick <= 10; tick++) {
      const angle = sa + (tick / 10) * sw;
      const isMajor = tick % 2 === 0;
      panelG.lineStyle(isMajor ? 1.5 : 1, isMajor ? 0x80c080 : 0x506050, 0.9);
      const inner = isMajor ? r - 7 : r - 5;
      panelG.lineBetween(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner,
        cx + Math.cos(angle) * (r - 2), cy + Math.sin(angle) * (r - 2));
    }
    panelG.lineStyle(2, 0xff2020, 0.45);
    panelG.beginPath();
    panelG.arc(cx, cy, r - 3, sa + sw * 0.78, sa + sw, false);
    panelG.strokePath();
    panelG.fillStyle(0x708870, 1);
    panelG.fillCircle(cx, cy, 2.5);
    this.add.text(cx, cy + r + 3, unit, {
      fontFamily: 'monospace', fontSize: '8px', color: '#70a070'
    }).setOrigin(0.5, 0).setDepth(3);
    const needleG = this.add.graphics().setDepth(4);
    const info = { g: needleG, cx, cy, r, fraction: needleFraction };
    this.redrawNeedle(info);
    return info;
  }

  redrawNeedle(info) {
    const { g, cx, cy, r, fraction } = info;
    const angle = (-5 * Math.PI) / 6 + fraction * (5 * Math.PI) / 3;
    g.clear();
    g.lineStyle(1.5, 0xff7040, 1);
    g.lineBetween(cx, cy, cx + Math.cos(angle) * (r - 4), cy + Math.sin(angle) * (r - 4));
    g.fillStyle(0x809080, 1);
    g.fillCircle(cx, cy, 2.5);
  }


  drawCeilingLights() {
    const { W } = this;
    const bg = this.add.graphics().setDepth(1);
    this.ceilingLightObjs = [];
    [W * 0.28, W * 0.5, W * 0.72].forEach(lx => {
      const ty = 56;
      bg.fillStyle(0x304030, 1);
      bg.fillRect(lx - 54, ty, 108, 10);
      bg.lineStyle(1, 0x48604a, 0.8);
      bg.strokeRect(lx - 54, ty, 108, 10);
      bg.fillStyle(0x364836, 1);
      bg.fillRect(lx - 2, 0, 4, ty);
      const tubeG = this.add.graphics().setDepth(2);
      tubeG.fillStyle(0xd0ffd4, 0.88);
      tubeG.fillRect(lx - 52, ty + 1, 104, 7);
      const glowG = this.add.graphics().setDepth(0).setBlendMode(Phaser.BlendModes.ADD);
      glowG.fillStyle(0x206020, 0.055);
      glowG.fillTriangle(lx - 52, ty + 8, lx + 52, ty + 8, lx, ty + 190);
      this.ceilingLightObjs.push({ tube: tubeG, glow: glowG });
    });
  }


  drawFloorEquipment() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(2);

    // Ground terminal
    const gx = 58, gy = H * 0.78;
    g.fillStyle(0x253525, 1);
    g.fillRect(gx, gy, 36, 28);
    g.lineStyle(1.5, 0x406040, 0.9);
    g.strokeRect(gx, gy, 36, 28);
    const gcx2 = gx + 18, gcy2 = gy + 14;
    g.lineStyle(2, 0x60c060, 0.75);
    g.lineBetween(gcx2, gcy2 - 7, gcx2, gcy2 + 1);
    g.lineBetween(gcx2 - 9, gcy2 + 1, gcx2 + 9, gcy2 + 1);
    g.lineBetween(gcx2 - 6, gcy2 + 5, gcx2 + 6, gcy2 + 5);
    g.lineBetween(gcx2 - 3, gcy2 + 9, gcx2 + 3, gcy2 + 9);
    this.add.text(gcx2, gy - 9, 'GND', {
      fontFamily: 'monospace', fontSize: '7px', color: '#60c060', fontStyle: '700'
    }).setOrigin(0.5).setDepth(3);

    // Emergency cutoff switch
    const ex = W - 56 - 44, ey = 62;
    g.fillStyle(0x3a1010, 1);
    g.fillRoundedRect(ex, ey, 34, 30, 4);
    g.lineStyle(1.5, 0x804040, 0.9);
    g.strokeRoundedRect(ex, ey, 34, 30, 4);
    g.fillStyle(0xff1818, 0.95);
    g.fillCircle(ex + 17, ey + 15, 11);
    g.lineStyle(2, 0xff8080, 0.5);
    g.strokeCircle(ex + 17, ey + 15, 11);
    g.fillStyle(0xff6060, 0.4);
    g.fillCircle(ex + 13, ey + 11, 4);
    this.add.text(ex + 17, ey + 30, '비상차단', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif', fontSize: '7px', color: '#ff7070'
    }).setOrigin(0.5, 0).setDepth(3);

    // Warning signs
    this.drawWarningSign(g, 30, H * 0.42, '고전압\n위험');
    this.drawWarningSign(g, W - 30, H * 0.22, '접근\n금지');

    // Cable outlets
    [W * 0.3, W * 0.55, W * 0.75].forEach(cx => {
      g.fillStyle(0x283028, 1);
      g.fillRect(cx - 12, H - 56, 24, 18);
      g.lineStyle(1, 0x3c4c3c, 0.7);
      g.strokeRect(cx - 12, H - 56, 24, 18);
      [0xff2020, 0x2020ff, 0x20c020].forEach((c, i) => {
        g.lineStyle(2, c, 0.6);
        g.lineBetween(cx - 4 + i * 4, H - 56, cx - 4 + i * 4, H - 42);
      });
    });
  }

  drawWarningSign(g, cx, cy, text) {
    const hs = 15;
    g.fillStyle(0xc8a020, 0.88);
    g.fillTriangle(cx, cy - hs - 4, cx - hs, cy + hs - 6, cx + hs, cy + hs - 6);
    g.lineStyle(2, 0x181c10, 0.65);
    g.strokeTriangle(cx, cy - hs - 4, cx - hs, cy + hs - 6, cx + hs, cy + hs - 6);
    g.fillStyle(0x181c10, 0.9);
    g.fillRect(cx - 1.5, cy - 7, 3, 10);
    g.fillCircle(cx, cy + 6, 2);
    this.add.text(cx, cy + hs, text, {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '8px', color: '#c8a020', align: 'center'
    }).setOrigin(0.5, 0).setDepth(3);
  }


  startLightFlicker() {
    if (!this.ceilingLightObjs?.length) return;
    this.ceilingLightObjs.forEach((light, i) => {
      const schedule = () => {
        this.time.delayedCall(2800 + Math.random() * 3500 + i * 700, () => {
          if (this.cleared) return;
          this.tweens.add({
            targets: [light.tube, light.glow],
            alpha: 0.06, duration: 65, yoyo: true,
            repeat: Math.random() < 0.4 ? 2 : 0,
            onComplete: () => schedule()
          });
        });
      };
      schedule();
    });
  }


  startMeterAnimation() {
    if (!this.meterNeedles?.length) return;
    this.meterNeedles.forEach((needle, i) => {
      const base = needle.fraction;
      const amp  = 0.07 + i * 0.04;
      let t = Math.random() * Math.PI * 2;
      this.time.addEvent({
        delay: 180, loop: true,
        callback: () => {
          if (this.cleared) return;
          t += 0.06 + Math.random() * 0.05;
          needle.fraction = Math.max(0.05, Math.min(0.97,
            base + Math.sin(t) * amp + (Math.random() - 0.5) * 0.025));
          this.redrawNeedle(needle);
        }
      });
    });
  }


  tableRects() {
    const { W, H } = this;
    return [
      { x: W * 0.08, y: H * 0.11, w: 80, h: 32 },
      { x: W * 0.84, y: H * 0.11, w: 80, h: 32 },
      { x: W * 0.08, y: H * 0.82, w: 80, h: 32 },
      { x: W * 0.84, y: H * 0.82, w: 80, h: 32 },
    ];
  }


  createWalls() {
    const { W, H } = this;
    this.walls  = this.physics.add.staticGroup();
    this.tables = this.physics.add.staticGroup();
    [
      { x: W / 2,  y: 28,     w: W,  h: 56 },
      { x: W / 2,  y: H - 28, w: W,  h: 56 },
      { x: 28,     y: H / 2,  w: 56, h: H  },
      { x: W - 28, y: H / 2,  w: 56, h: H  }
    ].forEach(({ x, y, w, h }) => {
      const r = this.add.rectangle(x, y, w, h, 0, 0);
      this.physics.add.existing(r, true);
      this.walls.add(r);
    });
    this.tableRects().forEach(({ x, y, w, h }) => {
      const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0);
      this.physics.add.existing(r, true);
      this.tables.add(r);
    });
  }


  createItems() {

    // A: (row3, col5)  B: (row0, col3)  C: (row2, col5)  D: (row3, col1)
    const cellIndices = [
      { id: 'A', idx: 3 * this.COLS + 5, name: '회로카드 A' },
      { id: 'B', idx: 0 * this.COLS + 3, name: '회로카드 B' },
      { id: 'C', idx: 2 * this.COLS + 5, name: '회로카드 C' },
      { id: 'D', idx: 3 * this.COLS + 1, name: '회로카드 D' },
    ];

    this.itemObjs = cellIndices.map(def => {
      const gridIdx = def.gridIdx ?? def.idx;
      const cell = this.gridCells[gridIdx];
      const glow = this.add.circle(cell.x, cell.y, 13, 0x60ff90, 0.75).setDepth(8);
      this.tweens.add({
        targets: glow, alpha: { from: 0.75, to: 0.15 },
        scale: { from: 1, to: 1.6 }, yoyo: true, repeat: -1, duration: 860
      });
      const lbl = this.add.text(cell.x, cell.y - 22, def.name, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#80ffaa', fontStyle: '700'
      }).setOrigin(0.5).setDepth(9);
      return { ...def, gridIdx, x: cell.x, y: cell.y, glow, lbl, done: false };
    });
  }


  createPanel() {
    const { W, H } = this;
    const SLOT_Y  = H / 2 + 10;
    const SLOT_X0 = W / 2 - 78;
    const SLOT_STEP = 52;
    this.slotGraphics = [];
    this.slotTexts    = [];
    this.slotLabels   = [];
    for (let i = 0; i < 4; i++) {
      const sx = SLOT_X0 + i * SLOT_STEP;
      const sg = this.add.graphics().setDepth(10);
      const st = this.add.text(sx, SLOT_Y - 4, '!', {
        fontFamily: 'monospace', fontSize: '14px', color: '#c05050', fontStyle: '900'
      }).setOrigin(0.5).setDepth(11);
      const sl = this.add.text(sx, SLOT_Y + 20, String.fromCharCode(65 + i), {
        fontFamily: 'monospace', fontSize: '9px', color: '#406040'
      }).setOrigin(0.5).setDepth(11);
      this.slotGraphics.push(sg);
      this.slotTexts.push(st);
      this.slotLabels.push(sl);
      this.redrawSlot(i);
    }
    this.panelLbl = this.add.text(W / 2, H / 2 + 54, '카드 0/4 · 배전반 근처에서 SPACE', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px', color: '#50c070', fontStyle: '700'
    }).setOrigin(0.5).setDepth(11);
  }

  redrawSlot(i) {
    const { W, H } = this;
    const sx = W / 2 - 78 + i * 52;
    const sy = H / 2 + 10;
    const hw = 21, hh = 27;
    const state = this.panelSlots[i];
    const sg = this.slotGraphics[i];
    const st = this.slotTexts[i];
    const sl = this.slotLabels?.[i];
    sg.clear();

    if (state === 'unstable') {
      // Dark red — empty slot with hazard pattern
      sg.fillStyle(0x1e0e0e, 1);
      sg.fillRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(2, 0x8a2020, 0.9);
      sg.strokeRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(1, 0x5a1010, 0.5);
      sg.strokeRoundedRect(sx - hw + 3, sy - hh + 3, hw * 2 - 6, hh * 2 - 6, 3);
      // Hazard diagonal stripes
      sg.lineStyle(1, 0x6a1818, 0.35);
      for (let d = -hh * 2; d < hw * 2; d += 8) {
        const x1 = sx - hw + Math.max(0, d);
        const y1 = sy - hh + Math.max(0, -d);
        const x2 = sx - hw + Math.min(hw * 2, d + hh * 2);
        const y2 = sy - hh + Math.min(hh * 2, hh * 2 - d);
        if (x1 < sx + hw && y1 < sy + hh) sg.lineBetween(x1, y1, x2, y2);
      }
      // Corner marks
      [[sx - hw + 4, sy - hh + 4], [sx + hw - 4, sy - hh + 4]].forEach(([cx, cy]) => {
        sg.lineStyle(1.5, 0xff3030, 0.6);
        sg.lineBetween(cx - 3, cy, cx + 3, cy);
        sg.lineBetween(cx, cy - 3, cx, cy + 3);
      });
      st.setText('!').setColor('#c04040').setFontFamily('monospace').setFontSize('15px');
      sl?.setColor('#5a2020');

    } else if (state === 'waiting') {
      // Blue — card inserted, awaiting lock
      sg.fillStyle(0x0e1e30, 1);
      sg.fillRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(2, 0x50c0ff, 0.95);
      sg.strokeRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(1, 0x2080c0, 0.5);
      sg.strokeRoundedRect(sx - hw + 3, sy - hh + 3, hw * 2 - 6, hh * 2 - 6, 3);
      // Card inserted indicator lines
      sg.lineStyle(1, 0x3090d0, 0.45);
      for (let r = 0; r < 3; r++) {
        const ry = sy - hh + 10 + r * 8;
        sg.lineBetween(sx - hw + 5, ry, sx + hw - 5, ry);
      }
      // Ready corner indicators
      [[sx - hw + 5, sy - hh + 5], [sx + hw - 5, sy - hh + 5],
       [sx - hw + 5, sy + hh - 5], [sx + hw - 5, sy + hh - 5]].forEach(([cx, cy]) => {
        sg.fillStyle(0x50c0ff, 0.7);
        sg.fillCircle(cx, cy, 2.5);
      });
      // Central glow
      sg.fillStyle(0x1060a0, 0.3);
      sg.fillCircle(sx, sy - 2, 10);
      st.setText(`${i + 1}`).setColor('#80e8ff').setFontFamily('monospace').setFontSize('15px');
      sl?.setColor('#3080a0');

    } else if (state === 'locked') {
      // Bright green — locked in
      sg.fillStyle(0x0a1e10, 1);
      sg.fillRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(2.5, 0x40ff80, 1);
      sg.strokeRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(1, 0x20b050, 0.45);
      sg.strokeRoundedRect(sx - hw + 3, sy - hh + 3, hw * 2 - 6, hh * 2 - 6, 3);
      // Circuit trace pattern
      sg.lineStyle(1, 0x20a050, 0.4);
      sg.lineBetween(sx - hw + 5, sy, sx - 8, sy);
      sg.lineBetween(sx - 8, sy, sx - 8, sy - hh + 8);
      sg.lineBetween(sx + hw - 5, sy, sx + 8, sy);
      sg.lineBetween(sx + 8, sy, sx + 8, sy + hh - 8);
      // Nodes on trace
      [[-8, -hh + 8], [8, hh - 8]].forEach(([ox, oy]) => {
        sg.fillStyle(0x30ff70, 0.7);
        sg.fillCircle(sx + ox, sy + oy, 2.5);
      });
      // Full glow
      sg.fillStyle(0x20ff60, 0.15);
      sg.fillRoundedRect(sx - hw + 1, sy - hh + 1, hw * 2 - 2, hh * 2 - 2, 5);
      // Checkmark
      sg.lineStyle(2.5, 0x40ff80, 1);
      sg.beginPath();
      sg.moveTo(sx - 7, sy - 4);
      sg.lineTo(sx - 2, sy + 4);
      sg.lineTo(sx + 8, sy - 8);
      sg.strokePath();
      st.setText('').setColor('#40ff80');
      sl?.setColor('#30b060');

    } else {
      sg.fillStyle(0x1e0e0e, 1);
      sg.fillRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      sg.lineStyle(1, 0x502020, 0.6);
      sg.strokeRoundedRect(sx - hw, sy - hh, hw * 2, hh * 2, 5);
      st.setText('?').setColor('#604040').setFontFamily('monospace').setFontSize('14px');
    }
  }


  createPlayer() {
    const { W, H } = this;

    const startCell = this.gridCells[this.COLS]; // row1, col0
    this.player = this.physics.add.sprite(startCell.x, startCell.y, 'simul-zone3');
    const img = this.textures.get('simul-zone3').getSourceImage();
    const sc  = Math.min(96 / img.width, 80 / img.height);
    this.player.setScale(sc).setDepth(15).setCollideWorldBounds(true);
    this.player.body.setSize(38, 52);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.tables);
    this.pglow = this.add.circle(startCell.x, startCell.y, 38, 0x4ab8ff, 0.15)
      .setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
    this.pname = this.add.text(startCell.x, startCell.y + 44, '시물이', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#c8e0ff', fontStyle: '700'
    }).setOrigin(0.5).setDepth(16);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER');
  }


  createHUD() {
    const { W, H } = this;
    this.hudBg = this.add.rectangle(W - 8, 58, 210, 64, 0x080e08, 0.92)
      .setOrigin(1, 0).setDepth(20).setStrokeStyle(1, 0x40e060, 0.5);
    this.itemsTxt = this.add.text(W - 18, 64, '카드  0 / 4', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '14px', color: '#80ffaa', fontStyle: '700'
    }).setOrigin(1, 0).setDepth(21);
    this.zoneTxt = this.add.text(W - 18, 90, '패턴 변경 4.0s', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#60c080', fontStyle: '700'
    }).setOrigin(1, 0).setDepth(21);
    this.dlgBg  = this.add.rectangle(W / 2, H - 8, W - 80, 96, 0x080e08, 0.92)
      .setOrigin(0.5, 1).setDepth(20).setStrokeStyle(1, 0x40e060, 0.4).setVisible(false);
    const portraitSrc = this.textures.get('simul-zone3').getSourceImage();
    const portraitScale = Math.min(148 / portraitSrc.width, 156 / portraitSrc.height);
    this.dlgPortrait = this.add.image(112, H - 68, 'simul-zone3')
      .setScale(portraitScale).setDepth(21).setVisible(false);
    this.dlgSpk = this.add.text(190, H - 90, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#60e080', fontStyle: '900'
    }).setDepth(21).setVisible(false);
    this.dlgTxt = this.add.text(190, H - 72, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#c8e8d0', wordWrap: { width: W - 260 }
    }).setDepth(21).setVisible(false);
    this.dlgObjs = [this.dlgBg, this.dlgPortrait, this.dlgSpk, this.dlgTxt];
  }

  say(speaker, text, dur = 4000) {
    this.dlgSpk.setText(`[ ${speaker} ]`);
    this.dlgTxt.setText(text);
    this.dlgObjs.forEach(o => o.setVisible(true).setAlpha(0));
    this.tweens.add({ targets: this.dlgObjs, alpha: 1, duration: 200 });
    if (this._dlgTm) this._dlgTm.remove();
    this._dlgTm = this.time.delayedCall(dur, () =>
      this.tweens.add({
        targets: this.dlgObjs, alpha: 0, duration: 300,
        onComplete: () => this.dlgObjs.forEach(o => o.setVisible(false))
      })
    );
  }

  showIntroCard() {
    const { W, H } = this;
    const overlay = this.add.container(0, 0).setDepth(60);
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x020802, 0.72);
    const g = this.add.graphics();
    const cw = Math.min(560, W - 80);
    const ch = 320;
    const x = W / 2 - cw / 2;
    const y = H / 2 - ch / 2;

    g.fillStyle(0x07140d, 0.98);
    g.fillRoundedRect(x, y, cw, ch, 10);
    g.lineStyle(2, 0x70ff90, 0.78);
    g.strokeRoundedRect(x, y, cw, ch, 10);
    g.lineStyle(1, 0x70ff90, 0.22);
    g.strokeRoundedRect(x + 10, y + 10, cw - 20, ch - 20, 6);
    g.fillStyle(0x10281a, 1);
    g.fillRoundedRect(x + 30, y + 74, 126, 150, 8);
    g.lineStyle(2, 0x50e8ff, 0.55);
    g.strokeRoundedRect(x + 30, y + 74, 126, 150, 8);
    g.lineStyle(4, 0xffff80, 0.88);
    g.beginPath();
    g.moveTo(x + 96, y + 92);
    g.lineTo(x + 72, y + 142);
    g.lineTo(x + 101, y + 137);
    g.lineTo(x + 78, y + 203);
    g.lineTo(x + 128, y + 124);
    g.lineTo(x + 99, y + 130);
    g.strokePath();
    [0, 1, 2, 3].forEach(i => {
      g.fillStyle(i < 2 ? 0x203040 : 0x402020, 1);
      g.fillCircle(x + 56 + i * 26, y + 232, 7);
    });

    const title = this.add.text(x + 28, y + 24, '이상현상: 전자기장 폭주', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '22px', color: '#a8ffc0', fontStyle: '900'
    });
    const body = this.add.text(x + 184, y + 78,
      '실험실 바닥이 유도 전류와 자기장 패턴으로 갈라졌어.\n위험 셀은 4초마다 바뀌고, 중앙 배전반은 카드 인증 없이는 열리지 않아.',
      { fontFamily: 'Pretendard, Malgun Gothic, sans-serif', fontSize: '14px', color: '#dcffe8', lineSpacing: 7, wordWrap: { width: cw - 220 } }
    );
    const tasks = this.add.text(x + 184, y + 166,
      '해야 할 일\n1. 회로카드 4장을 모아 주변 셀을 안정화한다.\n2. 중앙 배전반에서 SPACE로 잠금 시퀀스를 시작한다.\n3. 계기판의 녹색 구간에 바늘을 맞춰 전자기장을 차단한다.',
      { fontFamily: 'Pretendard, Malgun Gothic, sans-serif', fontSize: '14px', color: '#b8ffd0', lineSpacing: 7, wordWrap: { width: cw - 220 } }
    );
    const hint = this.add.text(W / 2, y + ch - 28, 'SPACE로 시작하기', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#70ff90', fontStyle: '700'
    }).setOrigin(0.5);

    overlay.add([shade, g, title, body, tasks, hint]);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 220 });

    const close = () => {
      if (!overlay.active) return;
      this.tweens.add({ targets: overlay, alpha: 0, duration: 180, onComplete: () => overlay.destroy() });
    };
    this.input.keyboard.once('keydown-SPACE', close);
  }


  update(_, delta) {
    if (this.cleared) return;

    if (this.lockActive) {
      this.player.setVelocity(0, 0);
      if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
        this.submitPanelTiming();
      }
      return;
    }

    if (!this.stunned) {
      const left  = this.cursors.left.isDown  || this.keys.A.isDown;
      const right = this.cursors.right.isDown || this.keys.D.isDown;
      const up    = this.cursors.up.isDown    || this.keys.W.isDown;
      const down  = this.cursors.down.isDown  || this.keys.S.isDown;
      const SPEED = 260;
      let vx = left ? -SPEED : right ? SPEED : 0;
      let vy = up   ? -SPEED : down  ? SPEED : 0;
      if (vx && vy) { vx *= 0.707; vy *= 0.707; }
      this.player.setVelocity(vx, vy);
      if (vx > 5) this.player.setFlipX(true);
      else if (vx < -5) this.player.setFlipX(false);
    }

    this.applyGridEffect();

    this.pglow.setPosition(this.player.x, this.player.y);
    this.pname.setPosition(this.player.x, this.player.y + 46);

    this.zoneTimer -= delta;
    this.zoneTxt.setText(`패턴 변경 ${Math.max(0, this.zoneTimer / 1000).toFixed(1)}s`);
    if (this.zoneTimer <= 0) this.zoneTimer = 4000;

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
      this.tryInteract();
    }
  }

  tryInteract() {
    if (this.lockActive) {
      this.submitPanelTiming();
      return;
    }

    const px = this.player.x, py = this.player.y;

    this.itemObjs.forEach(item => {
      if (item.done) return;
      if (Phaser.Math.Distance.Between(px, py, item.x, item.y) < 56) {
        item.done = true;
        item.glow.destroy(); item.lbl.destroy();
        this.collected.add(item.id);
        const n = this.collected.size;
        const flash = this.add.circle(item.x, item.y, 26, 0x60ff90, 0.8).setDepth(20);
        this.tweens.add({ targets: flash, scale: 3.5, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
        this.stabilizeFromCard(item, n - 1);
        this.itemsTxt.setText(`카드  ${n} / 4`);
        this.panelLbl.setText(`카드 ${n}/4 · 배전반 근처에서 SPACE`);
        if (n === 4) {
          this.say('시물이', '카드 4장 확보! 가로 통로 패턴 때 중앙 배전반으로!', 5000);
        } else {
          this.say('시물이', `${item.name} 수집! ${4 - n}개 남았어.`);
        }
      }
    });

    if (Phaser.Math.Distance.Between(px, py, this.W / 2, this.H / 2) < 96) {
      if (this.collected.size < 4) {
        this.say('시물이', `아직 배전반이 잠겨 있어. 카드 ${4 - this.collected.size}개가 더 필요해.`);
      } else {
        this.startPanelLockSequence();
      }
    }
  }


  stabilizeFromCard(item, slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.panelSlots.length) {
      this.panelSlots[slotIndex] = 'waiting';
      this.redrawSlot(slotIndex);
    }

    const base = item.gridIdx;
    const r = Math.floor(base / this.COLS);
    const c = base % this.COLS;
    const candidates = [
      [r, c], [r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1],
      [r - 1, c + 1], [r + 1, c - 1]
    ];
    const safeIndices = [];
    candidates.forEach(([rr, cc]) => {
      if (rr < 0 || rr >= this.ROWS || cc < 0 || cc >= this.COLS) return;
      const idx = rr * this.COLS + cc;
      if (!safeIndices.includes(idx)) safeIndices.push(idx);
    });
    safeIndices.slice(0, 3).forEach(idx => {
      this.stabilizedCells.add(idx);
      this.currentPattern[idx] = 0;
    });
    this.redrawAllCells();
  }

  startPanelLockSequence() {
    if (this.lockActive || this.cleared) return;
    this.lockActive = true;
    this.player.setVelocity(0, 0);
    if (this.patternEvent) this.patternEvent.paused = true;

    const { W, H } = this;
    const cx = W / 2;
    const cy = H / 2;
    const overlay = this.add.container(0, 0).setDepth(30);
    const bg = this.add.graphics();
    bg.fillStyle(0x020802, 0.78);
    bg.fillRect(0, 0, W, H);
    bg.fillStyle(0x101c14, 0.96);
    bg.fillRoundedRect(cx - 190, cy - 118, 380, 236, 8);
    bg.lineStyle(2, 0x70ff90, 0.7);
    bg.strokeRoundedRect(cx - 190, cy - 118, 380, 236, 8);
    overlay.add(bg);

    const title = this.add.text(cx, cy - 92, 'FIELD LOCK SEQUENCE', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '16px', color: '#a0ffc0', fontStyle: '900'
    }).setOrigin(0.5);
    const purpose = this.add.text(cx, cy - 74, '녹색 구간은 전자기장 상쇄 위상. 4개 슬롯을 모두 동기화해 이상현상을 차단해.', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#c8ffe0', fontStyle: '700',
      align: 'center', wordWrap: { width: 330 }
    }).setOrigin(0.5, 0);
    const prompt = this.add.text(cx, cy + 86, 'SPACE: 녹색 구간에서 잠금', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#d8ffe0', fontStyle: '700'
    }).setOrigin(0.5);
    const gauge = this.add.graphics();
    const needle = this.add.graphics();
    const slotText = this.add.text(cx, cy - 42, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#90e8ff', fontStyle: '800'
    }).setOrigin(0.5);
    overlay.add([gauge, needle, title, purpose, prompt, slotText]);

    const firstSlot = this.panelSlots.findIndex(s => s !== 'locked');
    this.lockMini = {
      overlay, gauge, needle, slotText,
      slotIndex: firstSlot >= 0 ? firstSlot : 4,
      pos: 0,
      dir: 1,
      busy: false,
      speeds: [0.75, 1.15, 1.65, 2.25],
      meterX: cx,
      meterY: cy + 34,
      meterR: 92,
      event: null,
      timeout: null,
    };
    this.drawLockGauge();
    this.startLockSlot();
    this.say('시물이', '카드 인증 완료. 4단계 타이밍 잠금을 시작해.');
  }

  startLockSlot() {
    const m = this.lockMini;
    if (!m) return;
    while (m.slotIndex < 4 && this.panelSlots[m.slotIndex] === 'locked') m.slotIndex++;
    if (m.slotIndex >= 4) {
      this.finishLockSequence();
      return;
    }

    m.pos = 0;
    m.dir = 1;
    m.busy = false;
    m.slotText.setText(`SLOT ${m.slotIndex + 1} / 4`);
    if (m.event) m.event.remove();
    if (m.timeout) m.timeout.remove();
    m.event = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        const dt = Math.max(0.001, (this.game.loop.delta || 50) / 1000);
        m.pos += m.dir * m.speeds[m.slotIndex] * dt;
        if (m.pos >= 1) { m.pos = 1; m.dir = -1; }
        if (m.pos <= 0) { m.pos = 0; m.dir = 1; }
        this.drawLockGauge();
      }
    });
    m.timeout = this.time.delayedCall(3000, () => this.failCurrentLock());
    this.drawLockGauge();
  }

  drawLockGauge(flashColor = null) {
    const m = this.lockMini;
    if (!m) return;
    const { meterX, meterY, meterR } = m;
    const startAngle = Phaser.Math.DegToRad(210);
    const endAngle = Phaser.Math.DegToRad(330);
    const sweep = endAngle - startAngle;
    const greenStart = startAngle + sweep * 0.3;
    const greenEnd = startAngle + sweep * 0.7;
    const needleAngle = startAngle + sweep * m.pos;
    const panelColor = flashColor || 0xb8ffd0;

    m.gauge.clear();
    m.gauge.fillStyle(0x07100a, 1);
    m.gauge.fillRoundedRect(meterX - 128, meterY - 118, 256, 178, 10);
    m.gauge.lineStyle(3, 0x364638, 1);
    m.gauge.strokeRoundedRect(meterX - 128, meterY - 118, 256, 178, 10);
    m.gauge.lineStyle(1, panelColor, flashColor ? 0.95 : 0.28);
    m.gauge.strokeRoundedRect(meterX - 119, meterY - 109, 238, 160, 7);

    [[meterX - 112, meterY - 102], [meterX + 112, meterY - 102],
     [meterX - 112, meterY + 44], [meterX + 112, meterY + 44]].forEach(([sx, sy]) => {
      m.gauge.fillStyle(0x1b241c, 1);
      m.gauge.fillCircle(sx, sy, 6);
      m.gauge.lineStyle(1, 0x8da08a, 0.6);
      m.gauge.strokeCircle(sx, sy, 6);
      m.gauge.lineStyle(1, 0x566456, 0.75);
      m.gauge.lineBetween(sx - 3, sy, sx + 3, sy);
    });

    m.gauge.fillStyle(0x111a14, 1);
    m.gauge.fillCircle(meterX, meterY, meterR + 22);
    m.gauge.lineStyle(5, 0x2f4032, 1);
    m.gauge.strokeCircle(meterX, meterY, meterR + 22);
    m.gauge.lineStyle(2, 0xa8c8a4, 0.5);
    m.gauge.strokeCircle(meterX, meterY, meterR + 14);
    m.gauge.fillStyle(0x07100b, 0.96);
    m.gauge.fillCircle(meterX, meterY, meterR + 5);

    m.gauge.fillStyle(0xffffff, 0.055);
    m.gauge.fillEllipse(meterX - 34, meterY - 46, meterR * 1.3, 34);
    m.gauge.fillStyle(0x70ffcc, 0.035);
    m.gauge.fillEllipse(meterX + 26, meterY - 10, meterR * 1.55, 82);

    m.gauge.lineStyle(16, 0x8a3030, 0.96);
    m.gauge.beginPath();
    m.gauge.arc(meterX, meterY, meterR, startAngle, greenStart, false);
    m.gauge.strokePath();
    m.gauge.lineStyle(16, 0x22984a, 0.98);
    m.gauge.beginPath();
    m.gauge.arc(meterX, meterY, meterR, greenStart, greenEnd, false);
    m.gauge.strokePath();
    m.gauge.lineStyle(16, 0x8a3030, 0.96);
    m.gauge.beginPath();
    m.gauge.arc(meterX, meterY, meterR, greenEnd, endAngle, false);
    m.gauge.strokePath();
    m.gauge.lineStyle(1, 0xf0ffe8, 0.38);
    m.gauge.beginPath();
    m.gauge.arc(meterX, meterY, meterR + 8, startAngle, endAngle, false);
    m.gauge.strokePath();
    m.gauge.beginPath();
    m.gauge.arc(meterX, meterY, meterR - 8, startAngle, endAngle, false);
    m.gauge.strokePath();

    for (let tick = 0; tick <= 20; tick++) {
      const amount = tick / 20;
      const angle = startAngle + sweep * amount;
      const major = tick % 4 === 0;
      const mid = tick % 2 === 0;
      const inner = meterR - (major ? 31 : mid ? 24 : 19);
      const outer = meterR - 5;
      m.gauge.lineStyle(major ? 2.5 : 1.2, major ? 0xe8ffe8 : 0x9fc8a0, major ? 0.95 : 0.72);
      m.gauge.lineBetween(
        meterX + Math.cos(angle) * inner,
        meterY + Math.sin(angle) * inner,
        meterX + Math.cos(angle) * outer,
        meterY + Math.sin(angle) * outer
      );
    }

    const labelStyle = { fontFamily: 'monospace', fontSize: '9px', color: '#d8ffe0', fontStyle: '700' };
    if (!m.labels) {
      m.labels = [
        this.add.text(meterX - 83, meterY - 58, 'FAIL', labelStyle).setOrigin(0.5).setDepth(31),
        this.add.text(meterX, meterY - 82, 'SYNC', labelStyle).setOrigin(0.5).setDepth(31),
        this.add.text(meterX + 83, meterY - 58, 'FAIL', labelStyle).setOrigin(0.5).setDepth(31),
        this.add.text(meterX - 62, meterY + 35, 'EM FIELD', {
          fontFamily: 'monospace', fontSize: '8px', color: '#8fb8a0', fontStyle: '700'
        }).setOrigin(0.5).setDepth(31),
        this.add.text(meterX + 62, meterY + 35, 'LOCK', {
          fontFamily: 'monospace', fontSize: '8px', color: '#8fb8a0', fontStyle: '700'
        }).setOrigin(0.5).setDepth(31),
      ];
      m.overlay.add(m.labels);
    }

    const ledOn = m.pos >= 0.3 && m.pos <= 0.7;
    m.gauge.fillStyle(ledOn ? 0x50ff80 : 0x3c1616, 1);
    m.gauge.fillCircle(meterX + 92, meterY + 28, 5);
    m.gauge.lineStyle(1, ledOn ? 0x90ffaa : 0xff6060, ledOn ? 0.75 : 0.42);
    m.gauge.strokeCircle(meterX + 92, meterY + 28, 8);
    m.gauge.fillStyle(ledOn ? 0x203820 : 0xff4040, ledOn ? 0.8 : 0.85);
    m.gauge.fillCircle(meterX - 92, meterY + 28, 5);
    m.gauge.lineStyle(1, ledOn ? 0x80a080 : 0xff6060, ledOn ? 0.35 : 0.7);
    m.gauge.strokeCircle(meterX - 92, meterY + 28, 8);

    m.gauge.fillStyle(0x0e2216, 1);
    m.gauge.fillCircle(meterX, meterY, 35);
    m.gauge.lineStyle(1, 0x70ff90, 0.35);
    m.gauge.strokeCircle(meterX, meterY, 35);

    m.needle.clear();
    m.needle.lineStyle(7, 0x241010, 0.55);
    m.needle.lineBetween(
      meterX,
      meterY,
      meterX + Math.cos(needleAngle) * (meterR - 22),
      meterY + Math.sin(needleAngle) * (meterR - 22)
    );
    m.needle.lineStyle(3, 0xfff0c0, 1);
    m.needle.lineBetween(
      meterX,
      meterY,
      meterX + Math.cos(needleAngle) * (meterR - 20),
      meterY + Math.sin(needleAngle) * (meterR - 20)
    );
    m.needle.fillStyle(0xd0d8c8, 1);
    m.needle.fillCircle(meterX, meterY, 10);
    m.needle.fillStyle(0x283028, 1);
    m.needle.fillCircle(meterX, meterY, 5);
    m.needle.lineStyle(1, 0xfff4a0, 0.8);
    m.needle.strokeCircle(meterX, meterY, 13);
  }

  submitPanelTiming() {
    const m = this.lockMini;
    if (!m || this.cleared || m.busy) return;
    const success = m.pos >= 0.3 && m.pos <= 0.7;
    if (success) this.lockCurrentSlot();
    else this.failCurrentLock();
  }

  lockCurrentSlot() {
    const m = this.lockMini;
    if (!m) return;
    m.busy = true;
    if (m.event) m.event.remove();
    if (m.timeout) m.timeout.remove();
    this.panelSlots[m.slotIndex] = 'locked';
    this.redrawSlot(m.slotIndex);
    this.drawLockGauge(0x70ff90);
    this.cameras.main.flash(120, 80, 255, 140, true);
    m.slotIndex++;
    this.time.delayedCall(360, () => this.startLockSlot());
  }

  failCurrentLock() {
    const m = this.lockMini;
    if (!m || this.cleared) return;
    m.busy = true;
    if (m.event) m.event.remove();
    if (m.timeout) m.timeout.remove();
    this.drawLockGauge(0xff6060);
    this.triggerStun({ x: this.W / 2, y: this.H / 2 });
    this.say('시물이', `슬롯 ${m.slotIndex + 1} 잠금 실패. 같은 슬롯을 다시 맞춰!`);
    this.time.delayedCall(650, () => {
      if (!this.lockActive || this.cleared) return;
      this.startLockSlot();
    });
  }

  finishLockSequence() {
    const m = this.lockMini;
    if (m?.event) m.event.remove();
    if (m?.timeout) m.timeout.remove();
    if (m?.overlay) m.overlay.destroy();
    this.lockMini = null;
    this.lockActive = false;
    this.doClear();
  }

  doClear() {
    this.cleared = true;
    this.lockActive = false;
    this.player.setVelocity(0, 0);
    if (this.patternEvent) this.patternEvent.paused = true;

    this.gridCells.forEach((_, i) => {
      this.time.delayedCall(i * 100, () => {
        this.currentPattern[i] = 0;
        this.redrawCell(i);
      });
    });

    this.ceilingLightObjs?.forEach(light => {
      this.tweens.killTweensOf([light.tube, light.glow]);
      this.tweens.add({
        targets: [light.tube, light.glow],
        alpha: 1,
        duration: 500,
        ease: 'Sine.easeOut'
      });
    });

    this.meterNeedles?.forEach(needle => {
      this.tweens.add({
        targets: needle,
        fraction: 0,
        duration: 700,
        ease: 'Sine.easeOut',
        onUpdate: () => this.redrawNeedle(needle)
      });
    });

    this.cameras.main.flash(800, 80, 255, 140);
    this.say('시물이', '전자기장 완전 차단. 이상현상 종료.', 2000);
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(620, () => {
        hubController.anomalyCleared('electromagnetic-induction');
        this.scene.stop();
        this.scene.resume('HubScene');
      });
    });
  }
}
