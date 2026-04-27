class LightScene extends Phaser.Scene {
  constructor() {
    super('LightScene');
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.WALL = 58;
    this.collected = new Set();
    this.cleared = false;
    this.sonarUses = 4;
    this.sonarCd = 0;
    this.sonarActive = false;
    this.mirrorBuilt = false;
    this.beamAligned = false;
    this.decoyActive = false;
    this.mirrorAngles = [0, 0, 0];
    this.mirrorStep = 5;
    this.mirrorLength = 58;
    this.goalRadius = 35;
    this.decoyRadius = 32;
    this.lastBeamHitCount = 0;
    this.solutionAngles = [0, 0, 0];
    this.anomalyTime = 0;
    this.anomalyLevel = 1;
    this.anomalyJolt = 0;
    this.spaceRestoreAnnounced = false;
    this.anchorInfluence = 260;
    this.maxAnchorShift = 120;

    this.layout = this.createLibraryLayout();

    this.cameras.main.setBackgroundColor('#15110d');
    this.cameras.main.fadeIn(500);

    this.drawLibrary();
    this.createLightAnomalyFx();
    this.createZoneOverlays();
    this.createStation();
    this.createMirrors();
    this.createSpaceAnchors();
    this.createItems();
    this.createPlayer();
    this.createFloatingBooks();
    this.createControls();
    this.createHUD();
    this.updateBeams();

    this.time.delayedCall(700, () => {
      this.say('리플', '도서관이 조각처럼 끊어져 있어. 거울을 복원한 뒤 벌어진 공간 조각을 원래 자리에 맞춰야 해!');
    });
  }

  // ─── 레이아웃 ─────────────────────────────────────────────
  createLibraryLayout() {
    const { W, H, WALL } = this;
    return {
      // ❌ 수정 전: window: { x: W - 132, y: WALL - 14 },

      // ✅ 수정 후: x좌표를 비율(W * 0.88)로 맞추고, y좌표 시작점을 벽 끝단(WALL)으로 고정
      window: { x: W * 0.88, y: WALL },

      mirrors: [
        { x: W * 0.64, y: H * 0.26, name: '거울 A' },
        { x: W * 0.33, y: H * 0.42, name: '거울 B' },
        { x: W * 0.55, y: H * 0.70, name: '거울 C' }
      ],
      station: { x: W * 0.50, y: H - WALL - 30 },
      goal: { x: W * 0.22, y: H * 0.74 },
      decoy: { x: W * 0.22, y: H * 0.28 },
      darkZones: [
        { x: WALL + W * 0.10, y: WALL + H * 0.20, w: W * 0.20, h: H * 0.36 },
        { x: W - WALL - W * 0.10, y: WALL + H * 0.20, w: W * 0.20, h: H * 0.36 }
      ]
    };
  }

  // ─── 배경 드로잉 ─────────────────────────────────────────
  drawLibrary() {
    // 공유 Graphics — ADD blend 없음, depth별 1개씩
    const gBg = this.add.graphics().setDepth(0);
    const gAtm = this.add.graphics().setDepth(1);
    const gWin = this.add.graphics().setDepth(2);
    const gCase = this.add.graphics().setDepth(3);
    const gFurn = this.add.graphics().setDepth(4);
    const gDtl = this.add.graphics().setDepth(5);

    this.drawBg(gBg);
    this.drawLibrarySign(gDtl);
    this.drawTallWindow(gWin, gAtm);
    this.drawBookcases(gCase);
    this.drawReadingFurniture(gFurn);
    this.drawLibraryDetails(gDtl);
  }

  drawBg(g) {
    const { W, H, WALL } = this;
    g.fillStyle(0x21170f, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x302116, 1);
    g.fillRect(WALL, WALL, W - WALL * 2, H - WALL * 2);
    for (let y = WALL + 16; y < H - WALL; y += 34) {
      g.lineStyle(1, 0x7a5030, 0.16);
      g.lineBetween(WALL + 12, y, W - WALL - 12, y);
    }
    for (let x = WALL + 12; x < W - WALL; x += 88) {
      g.lineStyle(1, 0xffdca0, 0.08);
      g.lineBetween(x, WALL + 10, x + 30, H - WALL - 10);
    }
    g.fillStyle(0x17100c, 1);
    g.fillRect(0, 0, W, WALL);
    g.fillRect(0, H - WALL, W, WALL);
    g.fillRect(0, 0, WALL, H);
    g.fillRect(W - WALL, 0, WALL, H);
    g.lineStyle(2, 0x8b6940, 0.55);
    g.strokeRect(WALL, WALL, W - WALL * 2, H - WALL * 2);
    g.lineStyle(1, 0xffe2a8, 0.18);
    g.strokeRect(WALL + 6, WALL + 6, W - WALL * 2 - 12, H - WALL * 2 - 12);
  }

  drawLibrarySign(g) {
    const { WALL, H } = this;
    const signY = H - WALL - 48; // 좌측 하단으로 Y 좌표 이동

    g.fillStyle(0x101a22, 0.96);
    g.fillRoundedRect(WALL + 18, signY, 268, 38, 5);
    g.lineStyle(2, 0x78dfff, 0.54);
    g.strokeRoundedRect(WALL + 18, signY, 268, 38, 5);

    this.add.text(WALL + 152, signY + 19, '도서관 · 빛의 경로 복원', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '14px', color: '#c8f4ff', fontStyle: '800'
    }).setOrigin(0.5).setDepth(6);
  }

  drawTallWindow(g, gAtm) {
    const { W, WALL } = this;
    const { window } = this.layout;
    const x = window.x - 80, y = 10;

    g.fillStyle(0x1a3140, 1);
    g.fillRoundedRect(x, y, 160, 48, 5);
    g.lineStyle(2, 0xaeefff, 0.72);
    g.strokeRoundedRect(x, y, 160, 48, 5);
    for (let i = 1; i < 4; i++) {
      g.lineStyle(1, 0xcff7ff, 0.32);
      g.lineBetween(x + i * 40, y + 6, x + i * 40, y + 42);
    }
    g.lineStyle(1, 0xcff7ff, 0.32);
    g.lineBetween(x + 8, y + 24, x + 152, y + 24);

    // ADD blend 제거 — 일반 alpha로 대체
    gAtm.fillStyle(0xffe3a0, 0.07);
    gAtm.beginPath();
    gAtm.moveTo(window.x - 58, WALL);
    gAtm.lineTo(W * 0.70, this.H * 0.34);
    gAtm.lineTo(W * 0.42, this.H - WALL - 20);
    gAtm.lineTo(window.x + 58, WALL);
    gAtm.closePath();
    gAtm.fillPath();
    gAtm.lineStyle(1, 0xffe8b0, 0.12);
    gAtm.lineBetween(window.x - 42, WALL, W * 0.56, this.H * 0.46);
    gAtm.lineBetween(window.x + 24, WALL, W * 0.44, this.H * 0.74);
  }

  // ─── 책장 ────────────────────────────────────────────────
  shelfRects() {
    const { W, H, WALL } = this;
    return [
      { x: WALL + 16, y: WALL + 26, w: W * 0.22, h: H * 0.36 },
      { x: W - WALL - W * 0.22 - 16, y: WALL + 26, w: W * 0.22, h: H * 0.36 },
      { x: WALL + 18, y: H * 0.70, w: W * 0.28, h: H * 0.15 },
      { x: W - WALL - W * 0.28 - 18, y: H * 0.78, w: W * 0.28, h: H * 0.11 }
    ];
  }

  drawBookcases(g) {
    this.shelfRects().forEach((shelf, idx) => this.drawBookcase(g, shelf, idx));
  }

  drawBookcase(g, shelf, idx) {
    const { x, y, w, h } = shelf;
    g.fillStyle(0x000000, 0.20);
    g.fillRoundedRect(x + 7, y + 8, w, h, 5);
    g.fillStyle(0x3a2618, 1);
    g.fillRoundedRect(x, y, w, h, 5);
    g.lineStyle(2, 0x8a623a, 0.72);
    g.strokeRoundedRect(x, y, w, h, 5);

    const rows = Math.max(2, Math.floor(h / 44));
    const bookColors = [0xb94432, 0xd7a83d, 0x386ba8, 0x4f8b58, 0x744c9c, 0xd6d0b3];
    for (let row = 0; row < rows; row++) {
      const shelfY = y + 18 + row * (h - 28) / rows;
      g.lineStyle(2, 0x8a623a, 0.55);
      g.lineBetween(x + 8, shelfY + 30, x + w - 8, shelfY + 30);
      let bx = x + 12, guard = 0;
      while (bx < x + w - 16 && guard < 80) {
        guard++;
        const bw = Phaser.Math.Between(5, 10);
        const bh = Phaser.Math.Between(18, 30);
        g.fillStyle(bookColors[(idx + row + guard) % bookColors.length], 0.88);
        g.fillRect(bx, shelfY + 29 - bh, bw, bh);
        g.fillStyle(0xffffff, 0.14);
        g.fillRect(bx + 1, shelfY + 32 - bh, 1, Math.max(4, bh - 5));
        bx += bw + Phaser.Math.Between(2, 5);
      }
    }
    g.fillStyle(0xffd889, 0.14);
    g.fillRect(x + 6, y + 6, w - 12, 4);
  }

  // ─── 가구 ────────────────────────────────────────────────
  drawReadingFurniture(g) {
    const { W, H } = this;
    [
      { x: W * 0.46, y: H * 0.38, w: 150, h: 54 },
      { x: W * 0.57, y: H * 0.66, w: 170, h: 58 }
    ].forEach((table, i) => {
      g.fillStyle(0x000000, 0.22);
      g.fillRoundedRect(table.x - table.w / 2 + 7, table.y - table.h / 2 + 8, table.w, table.h, 6);
      g.fillStyle(0x5a3922, 1);
      g.fillRoundedRect(table.x - table.w / 2, table.y - table.h / 2, table.w, table.h, 6);
      g.lineStyle(2, 0xb9854a, 0.62);
      g.strokeRoundedRect(table.x - table.w / 2, table.y - table.h / 2, table.w, table.h, 6);
      g.fillStyle(0xf2e3b8, 0.92);
      g.fillRoundedRect(table.x - 48, table.y - 18, 32, 22, 2);
      g.fillRoundedRect(table.x + 16, table.y - 12, 42, 20, 2);
      g.lineStyle(1, 0x805b35, 0.32);
      g.lineBetween(table.x - 33, table.y - 16, table.x - 33, table.y + 2);
      g.fillStyle(i ? 0x78dfff : 0xffd16d, 0.22);
      g.fillCircle(table.x + table.w / 2 - 28, table.y - 5, 18);
      g.fillStyle(i ? 0x78dfff : 0xffd16d, 0.85);
      g.fillCircle(table.x + table.w / 2 - 28, table.y - 5, 4);
    });
    this.drawCardCatalog(g, W * 0.24, H * 0.52);
    this.drawBookCart(g, W * 0.74, H * 0.48);
  }

  drawCardCatalog(g, cx, cy) {
    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(cx - 46 + 5, cy - 38 + 6, 92, 76, 5);
    g.fillStyle(0x4a2f1d, 1);
    g.fillRoundedRect(cx - 46, cy - 38, 92, 76, 5);
    g.lineStyle(2, 0xba8750, 0.55);
    g.strokeRoundedRect(cx - 46, cy - 38, 92, 76, 5);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = cx - 36 + col * 44;
        const y = cy - 28 + row * 22;
        g.fillStyle(0xd7c092, 0.72);
        g.fillRoundedRect(x, y, 32, 15, 2);
        g.fillStyle(0x4a2f1d, 0.45);
        g.fillCircle(x + 16, y + 8, 2);
      }
    }
  }

  drawBookCart(g, cx, cy) {
    g.fillStyle(0x1f2c32, 1);
    g.fillRoundedRect(cx - 54, cy - 26, 108, 52, 5);
    g.lineStyle(2, 0x95d9ff, 0.42);
    g.strokeRoundedRect(cx - 54, cy - 26, 108, 52, 5);
    g.lineStyle(1, 0x95d9ff, 0.28);
    g.lineBetween(cx - 46, cy, cx + 46, cy);
    [0xe9523f, 0xe6bf4a, 0x48a86e, 0x5e85c8, 0xc9d5cf].forEach((color, i) => {
      g.fillStyle(color, 0.86);
      g.fillRoundedRect(cx - 40 + i * 17, cy - 19 + (i % 2), 10, 18, 1);
      g.fillRoundedRect(cx - 38 + i * 17, cy + 5, 12, 16, 1);
    });
    g.fillStyle(0x0c1318, 0.85);
    g.fillCircle(cx - 36, cy + 31, 5);
    g.fillCircle(cx + 36, cy + 31, 5);
  }

  drawLibraryDetails(g) {
    const { W, H, WALL } = this;
    g.fillStyle(0x203240, 0.94);
    g.fillRoundedRect(W * 0.50 - 92, WALL + 20, 184, 28, 4);
    g.lineStyle(1, 0x78dfff, 0.42);
    g.strokeRoundedRect(W * 0.50 - 92, WALL + 20, 184, 28, 4);
    this.add.text(W * 0.50, WALL + 34, '빛 경로 판독기', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#c9f3ff', fontStyle: '800'
    }).setOrigin(0.5).setDepth(6);

    g.fillStyle(0xf6e8bd, 0.92);
    g.fillRoundedRect(WALL + 18, H * 0.55, 122, 96, 3);
    g.lineStyle(1, 0x9c7648, 0.55);
    g.strokeRoundedRect(WALL + 18, H * 0.55, 122, 96, 3);
    this.add.text(WALL + 30, H * 0.55 + 10,
      '복원 메모\n1. 조각 5개 수집\n2. 공간 조각 결합\n3. 세 거울을 모두 통과\n※ 모조 프리즘 주의!', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px', color: '#4a2c12', lineSpacing: 5
    }).setDepth(6);

    for (let i = 0; i < 18; i++) {
      const x = W * (0.32 + (i % 6) * 0.075);
      const y = H * (0.47 + Math.floor(i / 6) * 0.11);
      g.fillStyle(0xffe5a6, 0.16);
      g.fillCircle(x, y, 1.4);
      g.fillCircle(x + 6, y + 3, 0.9);
    }
  }

  createLightAnomalyFx() {
    const { W, H, WALL } = this;
    this.fractureG = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.spaceChunkG = this.add.graphics().setDepth(6.4);
    this.spectralG = this.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    this.spaceTearG = this.add.graphics().setDepth(28);
    this.noiseG = this.add.graphics().setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    this.anomalyOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x2b8cff, 0.02)
      .setDepth(29)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: this.anomalyOverlay,
      alpha: { from: 0.012, to: 0.055 },
      yoyo: true,
      repeat: -1,
      duration: 980,
      ease: 'Sine.easeInOut'
    });

    [
      [WALL + 17, WALL + 17, 0x62dfff],
      [W - WALL - 17, WALL + 17, 0xff725c],
      [WALL + 17, H - WALL - 17, 0xffd16d],
      [W - WALL - 17, H - WALL - 17, 0x62dfff]
    ].forEach(([x, y, color], i) => {
      const glow = this.add.circle(x, y, 20, color, 0.18)
        .setDepth(8)
        .setBlendMode(Phaser.BlendModes.ADD);
      const dot = this.add.circle(x, y, 4, color, 0.88).setDepth(9);
      this.tweens.add({
        targets: [glow, dot],
        alpha: { from: 0.12, to: 0.75 },
        yoyo: true,
        repeat: -1,
        duration: 520 + i * 95,
        ease: 'Stepped'
      });
    });

    this.phaseText = this.add.text(WALL + 18, H - WALL - 74, 'REFLECTION ERROR', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px',
      color: '#ff8068',
      fontStyle: '900',
      backgroundColor: '#160605',
      padding: { x: 6, y: 2 }
    }).setDepth(31).setAlpha(0.82);

    this.tweens.add({
      targets: this.phaseText,
      alpha: { from: 0.34, to: 0.92 },
      yoyo: true,
      repeat: -1,
      duration: 430,
      ease: 'Stepped'
    });

    this.scanLine = this.add.rectangle(W / 2, WALL + 14, W - WALL * 2, 2, 0x8be8ff, 0.11)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.scanLine,
      y: { from: WALL + 16, to: H - WALL - 16 },
      alpha: { from: 0.04, to: 0.20 },
      yoyo: true,
      repeat: -1,
      duration: 3100,
      ease: 'Sine.easeInOut'
    });

    this.lightParticles = Array.from({ length: 30 }, (_, i) => ({
      x: Phaser.Math.Between(WALL + 40, W - WALL - 40),
      y: Phaser.Math.Between(WALL + 40, H - WALL - 40),
      phase: Math.random() * Math.PI * 2,
      speed: Phaser.Math.FloatBetween(0.0007, 0.0015),
      size: Phaser.Math.FloatBetween(1.2, 3.5),
      color: [0x78dfff, 0xffd16d, 0xff6b5a, 0xffffff][i % 4]
    }));
  }

  // ─── 구역 + 소나 ─────────────────────────────────────────
  createZoneOverlays() {
    this.darkOverlays = this.layout.darkZones.map((z, i) => {
      const rect = this.add.rectangle(z.x, z.y, z.w, z.h, 0x020204, 0.72).setDepth(31);
      const label = this.add.text(z.x, z.y - z.h / 2 + 16,
        i === 0 ? '그림자 서가 A' : '그림자 서가 B', {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#9fc7e8', fontStyle: '700'
      }).setOrigin(0.5).setDepth(32).setAlpha(0.72);
      return { rect, label };
    });

    // sonarRing만 ADD blend 유지 (시각적 필요성 있음)
    this.sonarRing = this.add.circle(0, 0, 80, 0x8bdcff, 0)
      .setDepth(42).setStrokeStyle(2, 0x8bdcff, 0.8)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  // ─── 복원대 + 목표 ───────────────────────────────────────
  createStation() {
    const { station, goal, decoy } = this.layout;
    const g = this.add.graphics().setDepth(7);

    g.fillStyle(0x000000, 0.24);
    g.fillRoundedRect(station.x - 82 + 6, station.y - 24 + 7, 164, 48, 6);
    g.fillStyle(0x17242b, 0.96);
    g.fillRoundedRect(station.x - 82, station.y - 24, 164, 48, 6);
    g.lineStyle(2, 0x78dfff, 0.56);
    g.strokeRoundedRect(station.x - 82, station.y - 24, 164, 48, 6);
    g.lineStyle(1, 0xffd16d, 0.48);
    g.lineBetween(station.x - 50, station.y, station.x + 50, station.y);
    g.lineBetween(station.x, station.y - 18, station.x, station.y + 18);

    this.stationGlow = this.add.circle(station.x, station.y, 36, 0x78dfff, 0.08).setDepth(6);
    this.tweens.add({
      targets: this.stationGlow,
      alpha: { from: 0.06, to: 0.20 },
      yoyo: true, repeat: -1, duration: 1300
    });

    this.stationLbl = this.add.text(station.x, station.y + 36, '[0/5] 거울 복원대', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#b9ecff', fontStyle: '800',
      backgroundColor: '#071018', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(12);

    // 목표 프리즘
    this.goalBase = this.add.graphics().setDepth(8);
    this.goalGlow = this.add.circle(goal.x, goal.y, 42, 0xffdf7d, 0.07).setDepth(7);
    this.goalText = this.add.text(goal.x, goal.y + 48, '목표 프리즘', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#ffe6a8', fontStyle: '800',
      backgroundColor: '#201407', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(12);
    this.drawGoal(false);

    // 모조 프리즘 — 의도적으로 목표와 비슷한 모양
    this.decoyBase = this.add.graphics().setDepth(8);
    this.decoyGlow = this.add.circle(decoy.x, decoy.y, 38, 0xff8060, 0.05).setDepth(7);
    this.decoyText = this.add.text(decoy.x, decoy.y + 44, '???', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#c8a090', fontStyle: '800',
      backgroundColor: '#140707', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(12);
    this.drawDecoy(false);
  }

  drawGoal(active) {
    const { goal } = this.layout;
    const g = this.goalBase;
    g.clear();
    g.fillStyle(0x0d1418, 0.94);
    g.fillRoundedRect(goal.x - 44, goal.y - 28, 88, 56, 6);
    g.lineStyle(2, active ? 0xfff0a0 : 0x8b6c40, active ? 0.85 : 0.5);
    g.strokeRoundedRect(goal.x - 44, goal.y - 28, 88, 56, 6);
    g.fillStyle(active ? 0xfff0a0 : 0x6a7a7d, active ? 0.9 : 0.58);
    g.beginPath();
    g.moveTo(goal.x, goal.y - 18);
    g.lineTo(goal.x - 20, goal.y + 16);
    g.lineTo(goal.x + 20, goal.y + 16);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0xffffff, active ? 0.55 : 0.22);
    g.lineBetween(goal.x, goal.y - 16, goal.x, goal.y + 14);
  }

  drawDecoy(active) {
    const { decoy } = this.layout;
    const g = this.decoyBase;
    g.clear();
    g.fillStyle(0x1a0a0a, 0.94);
    g.fillRoundedRect(decoy.x - 40, decoy.y - 26, 80, 52, 6);
    g.lineStyle(2, active ? 0xff9060 : 0x5a3a3a, active ? 0.80 : 0.40);
    g.strokeRoundedRect(decoy.x - 40, decoy.y - 26, 80, 52, 6);
    g.fillStyle(active ? 0xff9060 : 0x503030, active ? 0.85 : 0.50);
    g.beginPath();
    g.moveTo(decoy.x, decoy.y - 16);
    g.lineTo(decoy.x - 18, decoy.y + 14);
    g.lineTo(decoy.x + 18, decoy.y + 14);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0xffffff, active ? 0.38 : 0.15);
    g.lineBetween(decoy.x, decoy.y - 14, decoy.x, decoy.y + 12);
  }

  // ─── 거울 + 빔 ───────────────────────────────────────────
  createMirrors() {
    this.mirrors = this.layout.mirrors.map((def, i) => {
      const g = this.add.graphics().setDepth(11);
      const label = this.add.text(def.x, def.y + 42, `${def.name} · 조각 필요`, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#c7d8e2', fontStyle: '700',
        backgroundColor: '#071018', padding: { x: 6, y: 2 }
      }).setOrigin(0.5).setDepth(12);
      const mirror = { ...def, g, label, idx: i };
      this.drawMirror(g, def.x, def.y, 0, false);
      return mirror;
    });
    // beamG만 ADD blend 유지 (빛 줄기 효과)
    this.beamG = this.add.graphics().setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
    this.opticalG = this.add.graphics().setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
  }

  drawMirror(g, x, y, angleDeg, active, dragging = false) {
    const rad = Phaser.Math.DegToRad(angleDeg);
    g.clear();
    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(x - 34 + 5, y - 25 + 6, 68, 50, 6);
    g.fillStyle(active ? (dragging ? 0x173846 : 0x10242c) : 0x171717, 0.94);
    g.fillRoundedRect(x - 34, y - 25, 68, 50, 6);
    g.lineStyle(2, active ? 0x78dfff : 0x5e5e5e, dragging ? 0.92 : active ? 0.62 : 0.45);
    g.strokeRoundedRect(x - 34, y - 25, 68, 50, 6);
    g.lineStyle(1, 0xffd16d, active ? 0.36 : 0.12);
    g.lineBetween(x - 24, y + 18, x + 24, y + 18);

    if (!active) {
      g.lineStyle(2, 0x9ea9ad, 0.42);
      g.lineBetween(x - 16, y - 10, x - 3, y + 5);
      g.lineBetween(x + 1, y - 8, x + 16, y + 9);
      g.lineStyle(1, 0xffd16d, 0.35);
      g.strokeCircle(x, y, 20);
      return;
    }

    const len = this.mirrorLength / 2;
    g.lineStyle(8, 0x4d9bc2, 0.30);
    g.lineBetween(x - Math.cos(rad) * len, y - Math.sin(rad) * len, x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    g.lineStyle(4, 0xe9fbff, 0.96);
    g.lineBetween(x - Math.cos(rad) * len, y - Math.sin(rad) * len, x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    g.lineStyle(1, 0xffffff, 0.45);
    g.lineBetween(x - Math.cos(rad) * 13, y - Math.sin(rad) * 13, x + Math.cos(rad) * 18, y + Math.sin(rad) * 18);
  }

  createSpaceAnchors() {
    const { W, H } = this;
    const defs = [
      { id: 'A', baseX: W * 0.52, baseY: H * 0.34, x: W * 0.57, y: H * 0.29, color: 0x78dfff, region: { x: W * 0.43, y: H * 0.19, w: W * 0.23, h: H * 0.25 } },
      { id: 'B', baseX: W * 0.45, baseY: H * 0.58, x: W * 0.39, y: H * 0.63, color: 0xffd16d, region: { x: W * 0.31, y: H * 0.43, w: W * 0.28, h: H * 0.25 } },
      { id: 'C', baseX: W * 0.36, baseY: H * 0.70, x: W * 0.42, y: H * 0.75, color: 0xff6b5a, region: { x: W * 0.23, y: H * 0.62, w: W * 0.27, h: H * 0.20 } }
    ];

    this.anchorFieldG = this.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
    this.spaceAnchors = defs.map((def) => {
      const g = this.add.graphics().setDepth(32).setBlendMode(Phaser.BlendModes.ADD);
      const label = this.add.text(def.x, def.y + 30, `공간 조각 ${def.id}`, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#dff8ff', fontStyle: '800',
        backgroundColor: '#071018', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(33);
      label.setAlpha(0.62);
      const zone = this.add.zone(def.x, def.y, 54, 54)
        .setDepth(34)
        .setInteractive({ draggable: true, cursor: 'grab' });
      const anchor = { ...def, g, label, zone, dragging: false };
      zone.setData('spaceAnchor', anchor);
      this.input.setDraggable(zone);
      this.drawSpaceAnchor(anchor);
      return anchor;
    });

    this.input.on('dragstart', (_, obj) => this.onAnchorDragStart(obj));
    this.input.on('drag', (_, obj, dragX, dragY) => this.onAnchorDrag(obj, dragX, dragY));
    this.input.on('dragend', (_, obj) => this.onAnchorDragEnd(obj));
  }

  onAnchorDragStart(obj) {
    const anchor = obj?.getData('spaceAnchor');
    if (!anchor) return;
    if (!this.mirrorBuilt) {
      this.say('리플', '공간 조각이 아직 잠겨 있어. 먼저 거울 조각을 복원대에서 합쳐야 해.', 2200);
      return;
    }
    anchor.dragging = true;
    anchor.label.setText(`공간 조각 ${anchor.id}`);
    anchor.label.setColor('#dff8ff');
    this.spaceRestoreAnnounced = false;
    obj.input.cursor = 'grabbing';
    this.drawSpaceAnchor(anchor);
  }

  onAnchorDrag(obj, dragX, dragY) {
    const anchor = obj?.getData('spaceAnchor');
    if (!anchor || !this.mirrorBuilt) return;
    const margin = this.WALL + 42;
    const dx = Phaser.Math.Clamp(dragX - anchor.baseX, -this.maxAnchorShift, this.maxAnchorShift);
    const dy = Phaser.Math.Clamp(dragY - anchor.baseY, -this.maxAnchorShift, this.maxAnchorShift);
    anchor.x = Phaser.Math.Clamp(anchor.baseX + dx, margin, this.W - margin);
    anchor.y = Phaser.Math.Clamp(anchor.baseY + dy, margin, this.H - margin);
    anchor.zone.setPosition(anchor.x, anchor.y);
    anchor.label.setPosition(anchor.x, anchor.y + 30);
    this.drawSpaceAnchor(anchor);
    this.updateBeams();
  }

  onAnchorDragEnd(obj) {
    const anchor = obj?.getData('spaceAnchor');
    if (!anchor) return;
    if (Phaser.Math.Distance.Between(anchor.x, anchor.y, anchor.baseX, anchor.baseY) < 18) {
      anchor.x = anchor.baseX;
      anchor.y = anchor.baseY;
      anchor.zone.setPosition(anchor.x, anchor.y);
      anchor.label.setPosition(anchor.x, anchor.y + 30);
      this.playLightSurge('build');
    }
    anchor.dragging = false;
    obj.input.cursor = 'grab';
    this.drawSpaceAnchor(anchor);
    this.updateBeams();
    this.checkSpaceRestored();
  }

  drawSpaceAnchor(anchor) {
    const g = anchor.g;
    const pulse = (Math.sin(this.anomalyTime * 0.006 + anchor.baseX * 0.01) + 1) / 2;
    g.clear();
    g.lineStyle(1, anchor.color, 0.24);
    g.strokeCircle(anchor.baseX, anchor.baseY, 18 + pulse * 5);
    g.lineStyle(1, 0xffffff, 0.14);
    g.lineBetween(anchor.baseX - 12, anchor.baseY, anchor.baseX + 12, anchor.baseY);
    g.lineBetween(anchor.baseX, anchor.baseY - 12, anchor.baseX, anchor.baseY + 12);
    g.lineStyle(anchor.dragging ? 3 : 2, anchor.color, anchor.dragging ? 0.82 : 0.50);
    g.lineBetween(anchor.baseX, anchor.baseY, anchor.x, anchor.y);
    g.fillStyle(0x06131c, 0.86);
    g.fillCircle(anchor.x, anchor.y, 15);
    g.lineStyle(2, anchor.color, anchor.dragging ? 0.95 : 0.72);
    g.strokeCircle(anchor.x, anchor.y, 15);
    g.fillStyle(anchor.color, 0.54 + pulse * 0.20);
    g.fillCircle(anchor.x, anchor.y, 4);
  }

  isSpaceRestored() {
    return !!this.spaceAnchors?.length && this.spaceAnchors.every(anchor =>
      Phaser.Math.Distance.Between(anchor.x, anchor.y, anchor.baseX, anchor.baseY) < 1
    );
  }

  checkSpaceRestored() {
    if (!this.mirrorBuilt || !this.isSpaceRestored() || this.spaceRestoreAnnounced) return;
    this.spaceRestoreAnnounced = true;
    this.playLightSurge('restore');
    this.spaceAnchors.forEach(anchor => {
      anchor.label.setText(`공간 조각 ${anchor.id} · 결합`);
      anchor.label.setColor('#ffe98a');
      this.drawSpaceAnchor(anchor);
    });
    this.say('리플', '끊어진 도서관 조각들이 맞물렸어! 바닥과 서가가 원래 자리로 돌아오고 있어. 이제 빛의 경로를 확인해보자.', 4200);
  }

  updateBeams() {
    if (!this.beamG) return;
    const g = this.beamG;
    const { window: win } = this.layout;
    g.clear();

    const wasAligned = this.beamAligned;
    const wasDecoy = this.decoyActive;
    this.beamAligned = false;
    this.decoyActive = false;
    this.lastBeamHitCount = 0;

    const startDir = this.getWindowBeamDirection();

    if (!this.mirrorBuilt) {
      const end = this.projectRayToRoomEdge(win.x, win.y, startDir.dx, startDir.dy);
      this.drawBeamSegment(g, win.x, win.y, end.x, end.y, 0.18);
      this.drawOpticalField(new Set());
      this.drawGoal(false); this.drawDecoy(false);
      this.goalGlow.setAlpha(0.07); this.decoyGlow.setAlpha(0.05);
      this.setDarkZone(0, false);
      this.setDarkZone(1, false);
      this._updateAlignHUD();
      return;
    }

    const trace = this.traceBeam(win.x, win.y, startDir.dx, startDir.dy);
    trace.segments.forEach((seg, i) => {
      const alpha = Phaser.Math.Clamp(0.50 + i * 0.12, 0.42, 0.92);
      this.drawBeamSegment(g, seg.x1, seg.y1, seg.x2, seg.y2, alpha);
    });

    this.lastBeamHitCount = trace.hitMirrorIds.size;
    this.beamAligned = trace.goalHit && this.lastBeamHitCount === this.mirrors.length;
    this.decoyActive = trace.decoyHit && !this.beamAligned;
    if (this.beamAligned && !wasAligned) this.playLightSurge('clear');
    else if (this.decoyActive && !wasDecoy) this.playLightSurge('decoy');
    this.updateMirrorLabels(trace.hitMirrorIds);
    this.drawOpticalField(trace.hitMirrorIds);

    this.setDarkZone(0, trace.hitMirrorIds.has(0));
    this.setDarkZone(1, this.lastBeamHitCount >= 2);

    if (this.beamAligned) {
      this.drawGoal(true); this.goalGlow.setAlpha(0.36);
      this.drawDecoy(false); this.decoyGlow.setAlpha(0.05);
    } else if (this.decoyActive) {
      this.drawGoal(false); this.goalGlow.setAlpha(0.07);
      this.drawDecoy(true); this.decoyGlow.setAlpha(0.28);
    } else {
      this.drawGoal(false); this.goalGlow.setAlpha(trace.goalHit ? 0.16 : 0.07);
      this.drawDecoy(false); this.decoyGlow.setAlpha(0.05);
    }
    this._updateAlignHUD();
  }

  drawBeamSegment(g, x1, y1, x2, y2, alpha) {
    g.lineStyle(14, 0xffd98a, alpha * 0.09);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(5, 0xffedb0, alpha * 0.50);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(2, 0xffffff, alpha);
    g.lineBetween(x1, y1, x2, y2);
  }

  // 입사각 기반 물리 반사 벡터 계산 (입사각 = 반사각)
  physicalReflect(fromX, fromY, toX, toY, mirrorAngleDeg) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const inDx = dx / len;
    const inDy = dy / len;
    const rad = Phaser.Math.DegToRad(mirrorAngleDeg);
    // 거울 법선 (표면 방향의 수직)
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    const dot = inDx * nx + inDy * ny;
    return { dx: inDx - 2 * dot * nx, dy: inDy - 2 * dot * ny };
  }

  getWindowBeamDirection() {
    const { window: win, mirrors } = this.layout;
    return this.normalize(mirrors[0].x - win.x, mirrors[0].y - win.y);
  }

  getOpticalPoint(point) {
    if (!this.spaceAnchors?.length || !this.mirrorBuilt) return { x: point.x, y: point.y };
    let ox = 0;
    let oy = 0;
    this.spaceAnchors.forEach((anchor) => {
      const dx = point.x - anchor.baseX;
      const dy = point.y - anchor.baseY;
      const influence = Math.exp(-(dx * dx + dy * dy) / (this.anchorInfluence * this.anchorInfluence));
      ox += (anchor.x - anchor.baseX) * influence;
      oy += (anchor.y - anchor.baseY) * influence;
    });
    return { x: point.x + ox, y: point.y + oy };
  }

  getOpticalMirror(mirror) {
    const p = this.getOpticalPoint(mirror);
    return { ...mirror, x: p.x, y: p.y };
  }

  getSpaceStability() {
    if (!this.spaceAnchors?.length) return 0;
    const total = this.spaceAnchors.reduce((sum, anchor) => {
      return sum + Phaser.Math.Distance.Between(anchor.x, anchor.y, anchor.baseX, anchor.baseY);
    }, 0);
    return Phaser.Math.Clamp(1 - total / (this.spaceAnchors.length * this.maxAnchorShift), 0, 1);
  }

  drawOpticalField(hitMirrorIds = new Set()) {
    if (!this.opticalG) return;
    const g = this.opticalG;
    g.clear();
    if (!this.mirrorBuilt) return;

    this.mirrors.forEach((mirror) => {
      const op = this.getOpticalMirror(mirror);
      const moved = Phaser.Math.Distance.Between(mirror.x, mirror.y, op.x, op.y);
      if (moved < 2) return;
      const rad = Phaser.Math.DegToRad(this.mirrorAngles[mirror.idx]);
      const half = this.mirrorLength / 2;
      const active = hitMirrorIds.has(mirror.idx);
      g.lineStyle(1, active ? 0xffe68a : 0x78dfff, active ? 0.52 : 0.24);
      g.lineBetween(mirror.x, mirror.y, op.x, op.y);
      g.lineStyle(active ? 4 : 2, active ? 0xffe68a : 0x78dfff, active ? 0.55 : 0.30);
      g.lineBetween(
        op.x - Math.cos(rad) * half,
        op.y - Math.sin(rad) * half,
        op.x + Math.cos(rad) * half,
        op.y + Math.sin(rad) * half
      );
    });

    g.lineStyle(1, 0xffe68a, 0.10);
    g.strokeCircle(this.layout.goal.x, this.layout.goal.y, this.goalRadius);
    g.lineStyle(1, 0xff6b5a, 0.08);
    g.strokeCircle(this.layout.decoy.x, this.layout.decoy.y, this.decoyRadius);
  }

  traceBeam(x, y, dx, dy) {
    const segments = [];
    const hitMirrorIds = new Set();
    let origin = { x, y };
    let dir = this.normalize(dx, dy);
    let lastMirror = null;

    for (let bounce = 0; bounce < 7; bounce++) {
      const hit = this.findNearestBeamHit(origin, dir, lastMirror);
      segments.push({ x1: origin.x, y1: origin.y, x2: hit.x, y2: hit.y });

      if (hit.type === 'mirror') {
        hitMirrorIds.add(hit.mirror.idx);
        const reflected = this.reflectVector(dir.dx, dir.dy, this.mirrorAngles[hit.mirror.idx]);
        origin = { x: hit.x + reflected.dx * 1.8, y: hit.y + reflected.dy * 1.8 };
        dir = reflected;
        lastMirror = hit.mirror;
        continue;
      }

      return {
        segments,
        hitMirrorIds,
        goalHit: hit.type === 'goal',
        decoyHit: hit.type === 'decoy'
      };
    }

    return { segments, hitMirrorIds, goalHit: false, decoyHit: false };
  }

  findNearestBeamHit(origin, dir, lastMirror) {
    const candidates = [];
    candidates.push({ type: 'wall', ...this.projectRayToRoomEdge(origin.x, origin.y, dir.dx, dir.dy) });
    const goalHit = this.rayCircleHit(origin, dir, this.layout.goal, this.goalRadius);
    const decoyHit = this.rayCircleHit(origin, dir, this.layout.decoy, this.decoyRadius);
    if (goalHit) candidates.push({ type: 'goal', ...goalHit });
    if (decoyHit) candidates.push({ type: 'decoy', ...decoyHit });

    this.mirrors.forEach((mirror) => {
      const hit = this.rayMirrorHit(origin, dir, mirror);
      if (!hit) return;
      if (mirror === lastMirror && hit.t < 8) return;
      candidates.push({ type: 'mirror', mirror, ...hit });
    });

    candidates.sort((a, b) => a.t - b.t);
    return candidates[0];
  }

  rayMirrorHit(origin, dir, mirror) {
    const opticalMirror = this.getOpticalMirror(mirror);
    const rad = Phaser.Math.DegToRad(this.mirrorAngles[mirror.idx]);
    const half = this.mirrorLength / 2;
    const ax = opticalMirror.x - Math.cos(rad) * half;
    const ay = opticalMirror.y - Math.sin(rad) * half;
    const bx = opticalMirror.x + Math.cos(rad) * half;
    const by = opticalMirror.y + Math.sin(rad) * half;
    return this.raySegmentHit(origin, dir, { x: ax, y: ay }, { x: bx, y: by });
  }

  raySegmentHit(origin, dir, a, b) {
    const sx = b.x - a.x;
    const sy = b.y - a.y;
    const denom = this.cross(dir.dx, dir.dy, sx, sy);
    if (Math.abs(denom) < 0.00001) return null;

    const qpx = a.x - origin.x;
    const qpy = a.y - origin.y;
    const t = this.cross(qpx, qpy, sx, sy) / denom;
    const u = this.cross(qpx, qpy, dir.dx, dir.dy) / denom;
    if (t <= 0.5 || u < -0.01 || u > 1.01) return null;
    return { t, x: origin.x + dir.dx * t, y: origin.y + dir.dy * t };
  }

  rayCircleHit(origin, dir, circle, radius) {
    const ox = origin.x - circle.x;
    const oy = origin.y - circle.y;
    const b = 2 * (dir.dx * ox + dir.dy * oy);
    const c = ox * ox + oy * oy - radius * radius;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const root = Math.sqrt(disc);
    const t1 = (-b - root) / 2;
    const t2 = (-b + root) / 2;
    const t = t1 > 0.5 ? t1 : t2 > 0.5 ? t2 : null;
    if (t === null) return null;
    return { t, x: origin.x + dir.dx * t, y: origin.y + dir.dy * t };
  }

  projectRayToRoomEdge(x, y, dx, dy) {
    const minX = this.WALL + 8;
    const maxX = this.W - this.WALL - 8;
    const minY = this.WALL + 8;
    const maxY = this.H - this.WALL - 8;
    const ts = [];
    if (dx > 0) ts.push((maxX - x) / dx);
    if (dx < 0) ts.push((minX - x) / dx);
    if (dy > 0) ts.push((maxY - y) / dy);
    if (dy < 0) ts.push((minY - y) / dy);
    const t = ts.filter(v => v > 0).sort((a, b) => a - b)[0] || 900;
    return { t, x: x + dx * t, y: y + dy * t };
  }

  reflectVector(dx, dy, mirrorAngleDeg) {
    const inVec = this.normalize(dx, dy);
    const rad = Phaser.Math.DegToRad(mirrorAngleDeg);
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    const dot = inVec.dx * nx + inVec.dy * ny;
    return this.normalize(inVec.dx - 2 * dot * nx, inVec.dy - 2 * dot * ny);
  }

  normalize(dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    return { dx: dx / len, dy: dy / len };
  }

  cross(ax, ay, bx, by) {
    return ax * by - ay * bx;
  }

  drawStrayBeam(g, x, y, dx, dy, alpha) {
    const ex = x + dx * 300;
    const ey = y + dy * 300;
    g.lineStyle(4, 0xffd98a, alpha);
    g.lineBetween(x, y, ex, ey);
    g.lineStyle(1.5, 0xffffff, alpha * 0.45);
    g.lineBetween(x, y, ex, ey);
  }

  setDarkZone(index, lit) {
    const zone = this.darkOverlays?.[index];
    if (!zone || this.sonarActive) return;
    zone.rect.setAlpha(lit ? 0.22 : 0.72);
    zone.label.setAlpha(lit ? 0.28 : 0.72);
  }

  // ─── 아이템 ──────────────────────────────────────────────
  createItems() {
    const { W, H } = this;
    const shards = [
      { id: '1', x: W * 0.50, y: H * 0.38, name: '거울 조각 A' },
      { id: '2', x: W * 0.42, y: H * 0.72, name: '거울 조각 B' },
      { id: '3', x: W * 0.82, y: H * 0.30, name: '거울 조각 C' },
      { id: '4', x: W * 0.16, y: H * 0.20, name: '거울 조각 D' },
      { id: '5', x: W * 0.16, y: H * 0.60, name: '거울 조각 E' }
    ];

    this.itemObjs = shards.map((def, i) => {
      const g = this.add.graphics().setDepth(34);
      this.drawShard(g, def.x, def.y, i);
      // 트윈으로 alpha/scale만 갱신 — Graphics 재드로우보다 훨씬 저렴
      const glow = this.add.circle(def.x, def.y, 16, 0x9fe8ff, 0.28).setDepth(33);
      this.tweens.add({
        targets: glow,
        scaleX: { from: 0.8, to: 1.55 }, scaleY: { from: 0.8, to: 1.55 },
        alpha: { from: 0.28, to: 0.05 },
        yoyo: true, repeat: -1, duration: 920 + i * 70
      });
      const label = this.add.text(def.x, def.y - 26, def.name, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#e5f9ff', fontStyle: '800',
        backgroundColor: '#071018', padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(35);
      return { ...def, g, glow, label, done: false };
    });
  }

  drawShard(g, x, y, seed) {
    g.clear();
    const rot = seed * 0.7;
    const pts = [[-12, -8], [8, -13], [15, 4], [-2, 13], [-14, 5]].map(([px, py]) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      return [x + px * c - py * s, y + px * s + py * c];
    });
    g.fillStyle(0x07131a, 0.72);
    g.fillCircle(x, y, 18);
    g.fillStyle(0xdff9ff, 0.84);
    g.beginPath();
    pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py));
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x74dfff, 0.72);
    g.strokePath();
    g.lineStyle(1, 0xffffff, 0.72);
    g.lineBetween(x - 4, y - 6, x + 7, y + 3);
  }

  // ─── 플레이어 ────────────────────────────────────────────
  createPlayer() {
    const { W, H, WALL } = this;
    this.walls = this.physics.add.staticGroup();
    [
      { x: W / 2, y: WALL / 2, w: W, h: WALL },
      { x: W / 2, y: H - WALL / 2, w: W, h: WALL },
      { x: WALL / 2, y: H / 2, w: WALL, h: H },
      { x: W - WALL / 2, y: H / 2, w: WALL, h: H }
    ].forEach(({ x, y, w, h }) => {
      const r = this.add.rectangle(x, y, w, h, 0, 0);
      this.physics.add.existing(r, true);
      this.walls.add(r);
    });

    this.player = this.physics.add.sprite(W / 2, H / 2, 'simul-zone2');
    const img = this.textures.get('simul-zone2').getSourceImage();
    const sc = Math.min(94 / img.width, 78 / img.height);
    this.player.setScale(sc).setDepth(36).setCollideWorldBounds(true);
    this.player.body.setSize(38, 52);
    this.physics.add.collider(this.player, this.walls);

    this.pglow = this.add.circle(W / 2, H / 2, 38, 0x78dfff, 0.10).setDepth(35);
    this.pname = this.add.text(W / 2, H / 2 + 45, '시물이', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#f2f7ff', fontStyle: '800',
      backgroundColor: '#071018', padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(37);
  }

  // ─── 공중 부양 책들 ─────────────────────────────────────────
  createFloatingBooks() {
    const { W, H, WALL } = this;

    // 1. 책 이미지(텍스처)를 즉석에서 4가지 색상으로 그립니다
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const colors = [0x386ba8, 0xb94432, 0x4f8b58, 0xd7a83d]; // 파, 빨, 초, 노
    colors.forEach((color, i) => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, 18, 24, 2); // 표지
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(15, 2, 3, 20); // 책장 부분
      g.generateTexture(`float-book-${i}`, 18, 24);
    });
    g.destroy();

    // 2. 물리 엔진이 적용된 그룹 생성
    this.floatingBooks = this.physics.add.group();

    // 책 20권을 도서관 여기저기에 랜덤 배치
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(WALL + 50, W - WALL - 50);
      const y = Phaser.Math.Between(WALL + 50, H - WALL - 50);
      const tex = `float-book-${Phaser.Math.Between(0, 3)}`;

      const book = this.floatingBooks.create(x, y, tex);
      book.setDepth(35); // 시물이(36) 바로 아래 레이어

      // 둥둥 떠다니기 위한 속성 부여
      book.startY = y;
      book.phase = Math.random() * Math.PI * 2;
      book.floatSpeed = Phaser.Math.FloatBetween(0.002, 0.004);
      book.setRotation(Phaser.Math.FloatBetween(-0.4, 0.4));

      book.body.setSize(14, 20); // 스치기만 해도 닿지 않도록 판정을 약간 줄임
    }

    // 3. 둔화 타이머 변수와 충돌(overlap) 이벤트 등록
    this.slowEffectTime = 0;
    this.physics.add.overlap(this.player, this.floatingBooks, this.hitFloatingBook, null, this);
  }

  // 책에 부딪혔을 때 실행되는 함수
  hitFloatingBook(player, book) {
    // 부딪힌 책이 치여서 팽그르르 도는 효과
    book.rotation += 0.15;
    // 시물이 둔화 1.5초 적용 (1500ms)
    this.slowEffectTime = 1500;
  }

  // ─── 조작 ────────────────────────────────────────────────
  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER,F');
  }

  // ─── HUD ──────────────────────────────────────────────────
  createHUD() {
    const { W, H } = this;

    this.hudBg = this.add.rectangle(W - 8, 102, 204, 130, 0x071018, 0.94)
      .setOrigin(1, 0).setDepth(40).setStrokeStyle(1, 0x78dfff, 0.50);

    this.itemsTxt = this.add.text(W - 24, 112, '조각 0 / 5', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '15px', color: '#ffdc8a', fontStyle: '900'
    }).setOrigin(1, 0).setDepth(41);

    this.mirrorTxt = this.add.text(W - 24, 138, '거울: 미완성', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#b8dfff', fontStyle: '800'
    }).setOrigin(1, 0).setDepth(41);

    this.alignTxt = this.add.text(W - 24, 158, '반사 0/3 · 복원 전', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#8ba8c0', fontStyle: '800'
    }).setOrigin(1, 0).setDepth(41);

    this.spaceTxt = this.add.text(W - 24, 178, '공간 안정도 --%', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#ff9a76', fontStyle: '800'
    }).setOrigin(1, 0).setDepth(41);

    this.sonarTxt = this.add.text(W - 24, 198, `탐지 ${this.sonarUses}회`, {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#8bdcff', fontStyle: '800'
    }).setOrigin(1, 0).setDepth(41);

    this.dlgBg = this.add.rectangle(W / 2, H - 8, W - 92, 76, 0x071018, 0.94)
      .setOrigin(0.5, 1).setDepth(40).setStrokeStyle(1, 0x78dfff, 0.42).setVisible(false);
    this.dlgSpk = this.add.text(68, H - 72, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#8bdcff', fontStyle: '900'
    }).setDepth(41).setVisible(false);
    this.dlgTxt = this.add.text(68, H - 56, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#e8f5ff', wordWrap: { width: W - 150 }
    }).setDepth(41).setVisible(false);
  }

  say(speaker, text, dur = 4000) {
    this.dlgSpk.setText(`[ ${speaker} ]`);
    this.dlgTxt.setText(text);
    [this.dlgBg, this.dlgSpk, this.dlgTxt].forEach(o => o.setVisible(true).setAlpha(0));
    this.tweens.add({ targets: [this.dlgBg, this.dlgSpk, this.dlgTxt], alpha: 1, duration: 200 });
    if (this._dlgTm) this._dlgTm.remove();
    this._dlgTm = this.time.delayedCall(dur, () =>
      this.tweens.add({
        targets: [this.dlgBg, this.dlgSpk, this.dlgTxt], alpha: 0, duration: 300,
        onComplete: () => [this.dlgBg, this.dlgSpk, this.dlgTxt].forEach(o => o.setVisible(false))
      })
    );
  }

  updateLightAnomaly(delta) {
    if (!this.fractureG || !this.spectralG || !this.noiseG) return;

    this.anomalyTime += delta;
    const t = this.anomalyTime;
    const instability = this.mirrorBuilt ? 1 - this.getSpaceStability() : 1;
    const targetLevel = this.cleared ? 0
      : !this.mirrorBuilt ? 1.08
        : this.beamAligned ? 0.18
          : this.decoyActive ? 1.35
            : Phaser.Math.Clamp(0.62 + instability * 0.62 - this.lastBeamHitCount * 0.16, 0.34, 1.24);
    this.anomalyLevel = Phaser.Math.Linear(this.anomalyLevel, targetLevel, 0.045);

    const level = this.anomalyLevel;
    this.drawFractureField(t, level);
    this.drawDisconnectedMap(t, level, instability);
    this.drawSpaceTears(t, level, instability);
    this.drawSpectralNoise(t, level, delta);
    this.drawSpaceAnchorField(t, level);
    this.spaceAnchors?.forEach(anchor => this.drawSpaceAnchor(anchor));

    if (this.phaseText) {
      if (this.beamAligned) this.phaseText.setText('SPACE RESTORED');
      else if (this.decoyActive) this.phaseText.setText('FALSE PRISM SIGNAL');
      else if (this.mirrorBuilt) this.phaseText.setText('COORDINATE RIFT');
      else this.phaseText.setText('REFLECTION ERROR');
      this.phaseText.setColor(this.beamAligned ? '#ffe98a' : this.decoyActive ? '#ff8068' : '#8be8ff');
    }

    if (this.anomalyJolt > 0 && this.cameras.main.setRotation) {
      this.anomalyJolt = Math.max(0, this.anomalyJolt - delta);
      const p = this.anomalyJolt / 420;
      this.cameras.main.setRotation(Math.sin(t * 0.055) * 0.008 * p);
    } else if (this.cameras.main.setRotation) {
      this.cameras.main.setRotation(Math.sin(t * 0.0017) * 0.0016 * level);
    }
  }

  drawFractureField(t, level) {
    const { W, H, WALL } = this;
    const { window: win, goal, decoy } = this.layout;
    const g = this.fractureG;
    g.clear();

    const pulse = (Math.sin(t * 0.004) + 1) / 2;
    const colors = [0x66e6ff, 0xff6058, 0xffd16d];
    for (let i = 0; i < 8; i++) {
      const drift = Math.sin(t * 0.0018 + i * 1.7) * 36 * level;
      const sx = Phaser.Math.Linear(win.x, goal.x, i / 7);
      const sy = Phaser.Math.Linear(win.y, goal.y, i / 7);
      const ex = sx + Math.cos(i * 1.91 + t * 0.001) * (90 + i * 18) * level;
      const ey = sy + Math.sin(i * 1.37 - t * 0.0012) * (50 + i * 10) * level + drift;
      g.lineStyle(i % 3 === 0 ? 2 : 1, colors[i % colors.length], (0.08 + pulse * 0.06) * level);
      g.lineBetween(sx, sy, ex, ey);
    }

    [goal, decoy].forEach((p, i) => {
      const active = i === 0 ? this.beamAligned : this.decoyActive;
      const color = i === 0 ? 0xffe68a : 0xff6258;
      g.lineStyle(2, color, (active ? 0.34 : 0.10) * level);
      g.strokeCircle(p.x, p.y, 42 + pulse * 12 + i * 7);
      g.lineStyle(1, color, (active ? 0.18 : 0.055) * level);
      g.strokeCircle(p.x, p.y, 66 + (1 - pulse) * 16 + i * 9);
    });

    g.lineStyle(1, 0x8be8ff, 0.045 * level);
    for (let x = WALL + 20; x < W - WALL; x += 110) {
      const skew = Math.sin(t * 0.001 + x * 0.01) * 16 * level;
      g.lineBetween(x + skew, WALL + 10, x - skew * 1.8, H - WALL - 10);
    }
  }

  drawDisconnectedMap(t, level, instability) {
    if (!this.spaceChunkG) return;
    const { W, H, WALL } = this;
    const g = this.spaceChunkG;
    g.clear();

    const chunkPower = this.mirrorBuilt
      ? Phaser.Math.Clamp(instability, 0, 1)
      : 1;
    if (chunkPower < 0.025) return;

    const anchors = this.spaceAnchors?.length
      ? this.spaceAnchors
      : [
        { id: 'A', baseX: W * 0.52, baseY: H * 0.34, x: W * 0.57, y: H * 0.29, color: 0x78dfff, region: { x: W * 0.43, y: H * 0.19, w: W * 0.23, h: H * 0.25 } },
        { id: 'B', baseX: W * 0.45, baseY: H * 0.58, x: W * 0.39, y: H * 0.63, color: 0xffd16d, region: { x: W * 0.31, y: H * 0.43, w: W * 0.28, h: H * 0.25 } },
        { id: 'C', baseX: W * 0.36, baseY: H * 0.70, x: W * 0.42, y: H * 0.75, color: 0xff6b5a, region: { x: W * 0.23, y: H * 0.62, w: W * 0.27, h: H * 0.20 } }
      ];

    anchors.forEach((anchor, i) => {
      const r = anchor.region;
      const dx = anchor.x - anchor.baseX;
      const dy = anchor.y - anchor.baseY;
      const dist = Math.hypot(dx, dy);
      const localPower = this.mirrorBuilt
        ? Phaser.Math.Clamp(dist / this.maxAnchorShift, 0, 1)
        : 1;
      if (localPower < 0.03) return;

      const gapAlpha = (0.42 + localPower * 0.20) * level;
      const ghostX = r.x + dx;
      const ghostY = r.y + dy;
      const pulse = (Math.sin(t * 0.004 + i * 2.1) + 1) / 2;

      g.fillStyle(0x030407, gapAlpha);
      g.fillRoundedRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 4);
      g.lineStyle(2, 0x000000, 0.55 * localPower * level);
      this.drawBrokenRect(g, r.x, r.y, r.w, r.h, 9, pulse * 9);

      g.fillStyle(0x302116, 0.93);
      g.fillRoundedRect(ghostX, ghostY, r.w, r.h, 5);
      g.fillStyle(0x21170f, 0.72);
      g.fillRoundedRect(ghostX + 8, ghostY + 8, r.w - 16, r.h - 16, 3);

      g.lineStyle(1, 0xffdca0, 0.08 + localPower * 0.08);
      for (let y = ghostY + 18; y < ghostY + r.h - 10; y += 34) {
        g.lineBetween(ghostX + 10, y, ghostX + r.w - 10, y);
      }
      for (let x = ghostX + 14; x < ghostX + r.w - 10; x += 64) {
        g.lineBetween(x, ghostY + 10, x + 18, ghostY + r.h - 10);
      }

      this.drawChunkBooks(g, ghostX + 12, ghostY + 14, r.w - 24, Math.min(58, r.h - 28), i, localPower);
      this.drawChunkBooks(g, ghostX + 12, ghostY + r.h - 76, r.w - 24, 52, i + 3, localPower * 0.72);

      g.lineStyle(3, anchor.color, (0.34 + pulse * 0.16) * localPower * level);
      this.drawBrokenRect(g, ghostX, ghostY, r.w, r.h, 10, -pulse * 11);
      g.lineStyle(1, 0xffffff, 0.22 * localPower * level);
      g.lineBetween(r.x + r.w * 0.5, r.y + r.h * 0.5, ghostX + r.w * 0.5, ghostY + r.h * 0.5);

      g.fillStyle(0x020406, 0.70 * localPower * level);
      const cutW = 10 + localPower * 18;
      g.fillRect((r.x + ghostX) / 2 - cutW / 2, Math.min(r.y, ghostY) - 6, cutW, Math.max(r.y + r.h, ghostY + r.h) - Math.min(r.y, ghostY) + 12);
    });
  }

  drawChunkBooks(g, x, y, w, h, seed, power) {
    if (w <= 20 || h <= 18) return;
    g.fillStyle(0x4a2f1d, 0.88);
    g.fillRoundedRect(x, y, w, h, 3);
    g.lineStyle(1, 0x9b6a3b, 0.44);
    g.strokeRoundedRect(x, y, w, h, 3);
    const colors = [0xb94432, 0xd7a83d, 0x386ba8, 0x4f8b58, 0x744c9c, 0xd6d0b3];
    let bx = x + 8;
    let guard = 0;
    while (bx < x + w - 12 && guard < 42) {
      const bw = 6 + ((guard + seed) % 5);
      const bh = 18 + ((guard * 7 + seed * 3) % Math.max(8, Math.floor(h - 18)));
      g.fillStyle(colors[(guard + seed) % colors.length], 0.72 + power * 0.18);
      g.fillRect(bx, y + h - 8 - bh, bw, bh);
      bx += bw + 4;
      guard++;
    }
  }

  drawBrokenRect(g, x, y, w, h, steps, wobble) {
    const pts = [
      [x, y, x + w, y],
      [x + w, y, x + w, y + h],
      [x + w, y + h, x, y + h],
      [x, y + h, x, y]
    ];
    pts.forEach(([x1, y1, x2, y2], i) => {
      this.drawJaggedLine(g, x1, y1, x2, y2, steps, wobble + i * 3);
    });
  }

  drawSpaceTears(t, level, instability) {
    if (!this.spaceTearG) return;
    const { W, H, WALL } = this;
    const g = this.spaceTearG;
    g.clear();

    const tearPower = this.mirrorBuilt
      ? Phaser.Math.Clamp(instability, 0, 1)
      : 1;
    if (tearPower < 0.025) return;

    const anchors = this.spaceAnchors?.length
      ? this.spaceAnchors
      : [
        { baseX: W * 0.52, baseY: H * 0.34, x: W * 0.57, y: H * 0.29, color: 0x78dfff },
        { baseX: W * 0.45, baseY: H * 0.58, x: W * 0.39, y: H * 0.63, color: 0xffd16d },
        { baseX: W * 0.36, baseY: H * 0.70, x: W * 0.42, y: H * 0.75, color: 0xff6b5a }
      ];

    anchors.forEach((anchor, i) => {
      const dx = anchor.x - anchor.baseX;
      const dy = anchor.y - anchor.baseY;
      const dist = Math.hypot(dx, dy);
      const localPower = this.mirrorBuilt
        ? Phaser.Math.Clamp(dist / this.maxAnchorShift, 0, 1)
        : 1;
      if (localPower < 0.03) return;

      const cx = anchor.baseX + dx * 0.48;
      const cy = anchor.baseY + dy * 0.48;
      const angle = Math.atan2(dy || Math.sin(i + 1), dx || Math.cos(i + 1)) + Math.PI / 2;
      const span = 230 + localPower * 180;
      const wobble = Math.sin(t * 0.003 + i * 1.9) * 18 * localPower;
      const sx = cx - Math.cos(angle) * span * 0.5;
      const sy = cy - Math.sin(angle) * span * 0.5;
      const ex = cx + Math.cos(angle) * span * 0.5;
      const ey = cy + Math.sin(angle) * span * 0.5;

      g.fillStyle(0x020406, 0.18 * localPower * level);
      g.fillRect(WALL, cy - 9 + wobble * 0.12, W - WALL * 2, 18 + localPower * 12);

      g.lineStyle(9, 0x05070b, 0.24 * localPower * level);
      this.drawJaggedLine(g, sx + dx * 0.12, sy + dy * 0.12, ex + dx * 0.12, ey + dy * 0.12, 9, wobble);
      g.lineStyle(3, anchor.color, 0.42 * localPower * level);
      this.drawJaggedLine(g, sx, sy, ex, ey, 10, -wobble);
      g.lineStyle(1, 0xffffff, 0.28 * localPower * level);
      this.drawJaggedLine(g, sx - dx * 0.08, sy - dy * 0.08, ex - dx * 0.08, ey - dy * 0.08, 8, wobble * 0.55);

      const ghostAlpha = 0.055 * localPower * level;
      g.fillStyle(anchor.color, ghostAlpha);
      g.fillRoundedRect(cx - 145 + dx * 0.20, cy - 30 + dy * 0.20, 290, 58, 5);
      g.lineStyle(1, anchor.color, ghostAlpha * 2.4);
      g.strokeRoundedRect(cx - 145 - dx * 0.12, cy - 30 - dy * 0.12, 290, 58, 5);
    });
  }

  drawJaggedLine(g, x1, y1, x2, y2, steps, wobble) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    g.beginPath();
    g.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const p = i / steps;
      const zig = ((i % 2 ? 1 : -1) * (7 + Math.abs(wobble) * 0.18)) + Math.sin(p * Math.PI * 4 + wobble) * 5;
      g.lineTo(x1 + dx * p + nx * zig, y1 + dy * p + ny * zig);
    }
    g.lineTo(x2, y2);
    g.strokePath();
  }

  drawSpectralNoise(t, level, delta) {
    const { W, H, WALL } = this;
    const g = this.spectralG;
    g.clear();

    const anchor = this.decoyActive ? this.layout.decoy : this.beamAligned ? this.layout.goal : this.layout.window;
    const dt = delta || 16;
    this.lightParticles?.forEach((p, i) => {
      p.phase += dt * p.speed * (this.decoyActive ? 2.4 : 1);
      const pull = this.mirrorBuilt ? 0.018 : 0.006;
      p.x += Math.cos(p.phase * 2.1 + i) * 0.9 * level + (anchor.x - p.x) * pull * level;
      p.y += Math.sin(p.phase * 1.7 - i) * 0.8 * level + (anchor.y - p.y) * pull * level;
      if (p.x < WALL) p.x = W - WALL;
      if (p.x > W - WALL) p.x = WALL;
      if (p.y < WALL) p.y = H - WALL;
      if (p.y > H - WALL) p.y = WALL;

      const alpha = Phaser.Math.Clamp(0.12 + level * 0.26 + Math.sin(p.phase) * 0.08, 0.08, 0.58);
      g.fillStyle(p.color, alpha);
      g.fillCircle(p.x, p.y, p.size);
      g.lineStyle(1, 0xffffff, alpha * 0.28);
      g.lineBetween(p.x - 7 * level, p.y, p.x + 7 * level, p.y);
    });

    const ng = this.noiseG;
    ng.clear();
    const blocks = Math.floor(8 + level * 16);
    for (let i = 0; i < blocks; i++) {
      const y = Phaser.Math.Between(WALL, H - WALL);
      const x = Phaser.Math.Between(WALL, W - WALL - 80);
      const w = Phaser.Math.Between(18, 95);
      const color = i % 3 === 0 ? 0xff5f58 : i % 3 === 1 ? 0x66e6ff : 0xffd16d;
      ng.fillStyle(color, Phaser.Math.FloatBetween(0.012, 0.045) * level);
      ng.fillRect(x, y, w, 2);
    }
  }

  drawSpaceAnchorField(t, level) {
    if (!this.anchorFieldG || !this.spaceAnchors?.length) return;
    const g = this.anchorFieldG;
    g.clear();
    if (!this.mirrorBuilt) return;

    const stability = this.getSpaceStability();
    const alpha = Phaser.Math.Clamp((1 - stability) * 0.34 + 0.04, 0.04, 0.36);
    this.spaceAnchors.forEach((anchor, i) => {
      const dx = anchor.x - anchor.baseX;
      const dy = anchor.y - anchor.baseY;
      const dist = Math.hypot(dx, dy);
      const pulse = (Math.sin(t * 0.004 + i * 1.8) + 1) / 2;
      g.lineStyle(1, anchor.color, alpha * (0.7 + pulse * 0.5));
      for (let r = 58; r <= 210; r += 50) {
        g.strokeCircle(anchor.baseX + dx * 0.26, anchor.baseY + dy * 0.26, r + pulse * 9);
      }
      if (dist > 5) {
        const dir = Math.atan2(dy, dx);
        for (let k = -2; k <= 2; k++) {
          const a = dir + k * 0.38;
          g.lineBetween(
            anchor.baseX,
            anchor.baseY,
            anchor.baseX + Math.cos(a) * (60 + dist * 0.9),
            anchor.baseY + Math.sin(a) * (60 + dist * 0.9)
          );
        }
      }
    });
  }

  playLightSurge(kind) {
    const color = kind === 'clear' || kind === 'restore' ? 0xffe68a : kind === 'decoy' ? 0xff5f58 : 0x78dfff;
    const point = kind === 'clear' ? this.layout.goal
      : kind === 'decoy' ? this.layout.decoy
        : kind === 'restore' ? { x: this.W / 2, y: this.H / 2 }
          : this.layout.window;
    this.anomalyJolt = kind === 'clear' || kind === 'restore' ? 220 : 420;
    this.cameras.main.shake(kind === 'clear' || kind === 'restore' ? 90 : 140, kind === 'clear' || kind === 'restore' ? 0.0025 : 0.0045);
    this.cameras.main.flash(kind === 'clear' || kind === 'restore' ? 120 : 180, kind === 'decoy' ? 255 : 120, kind === 'clear' || kind === 'restore' ? 235 : 80, kind === 'decoy' ? 80 : 255, true);

    const pulse = this.add.circle(point.x, point.y, 32, color, 0.25)
      .setDepth(32)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: pulse,
      scale: kind === 'clear' || kind === 'restore' ? 3.1 : 2.4,
      alpha: 0,
      duration: kind === 'clear' || kind === 'restore' ? 520 : 360,
      ease: 'Power2.easeOut',
      onComplete: () => pulse.destroy()
    });
  }

  // ─── 업데이트 ─────────────────────────────────────────────
  update(_, delta) {
    if (this.cleared) return;

    // ✅ 1. 떠다니는 책 애니메이션 및 제거 로직
    if (this.floatingBooks) {
      const stability = this.getSpaceStability(); //

      if (stability >= 1.0) {
        // 100%가 되면 모든 책을 서서히 사라지게 합니다
        this.floatingBooks.getChildren().forEach(book => {
          if (!book.isfading) {
            book.isfading = true; // 중복 트윈 방지
            this.tweens.add({
              targets: book,
              alpha: 0,
              scale: 0,
              duration: 800,
              ease: 'Power2.easeIn',
              onComplete: () => book.destroy()
            });
          }
        });

        // 책들이 모두 사라질 것이므로 물리 그룹 참조를 제거하여 
        // 더 이상 update 로직이 타지 않게 합니다
        this.floatingBooks = null;

      } else {
        // 100% 미만일 때는 기존처럼 둥둥 떠다니게 합니다
        this.floatingBooks.getChildren().forEach(book => {
          if (!book.isfading) {
            book.phase += delta * book.floatSpeed;
            book.y = book.startY + Math.sin(book.phase) * 12;
          }
        });
      }
    }

    // ✅ 2. 둔화 효과 적용 (기존 코드와 동일)
    let currentSpeed = 275;
    if (this.slowEffectTime > 0) {
      this.slowEffectTime -= delta;
      currentSpeed = 100;
      this.pglow.setFillStyle(0xff6058, 0.3);
    } else if (this.pglow) {
      this.pglow.setFillStyle(0x78dfff, 0.10);
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    let vx = left ? -currentSpeed : right ? currentSpeed : 0;
    let vy = up ? -currentSpeed : down ? currentSpeed : 0;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);
    if (vx > 5) this.player.setFlipX(true);
    else if (vx < -5) this.player.setFlipX(false);

    this.pglow.setPosition(this.player.x, this.player.y);
    this.pname.setPosition(this.player.x, this.player.y + 46);
    this.updateLightAnomaly(delta);

    if (this.sonarCd > 0) this.sonarCd -= delta;
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.useSonar();
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
      this.tryInteract();
    }
  }

  useSonar() {
    if (this.sonarUses <= 0 || this.sonarCd > 0) {
      this.say('리플', this.sonarUses <= 0 ? '탐지 횟수를 모두 썼어. 빛을 직접 열어야 해.' : '탐지 장치가 식는 중이야. 잠깐만 기다려.');
      return;
    }
    this.sonarUses--;
    this.sonarCd = 4300;
    this.sonarActive = true;
    this.sonarTxt.setText(`탐지 ${this.sonarUses}회`);
    this.sonarRing.setPosition(this.player.x, this.player.y).setScale(1).setAlpha(0.85);
    this.tweens.add({ targets: this.sonarRing, scale: 3.1, alpha: 0, duration: 760 });
    this.darkOverlays.forEach(zone => {
      this.tweens.add({ targets: [zone.rect, zone.label], alpha: 0.16, duration: 240 });
    });
    this.time.delayedCall(2600, () => {
      this.sonarActive = false;
      this.updateBeams();
    });
    this.say('리플', '탐지 파동을 보냈어. 그림자 서가가 잠깐 드러날 거야.', 2200);
  }

  tryInteract() {
    const px = this.player.x, py = this.player.y;

    for (const item of this.itemObjs) {
      if (item.done) continue;
      if (Phaser.Math.Distance.Between(px, py, item.x, item.y) < 56) {
        this.collectShard(item);
        return;
      }
    }

    const { station, goal, decoy } = this.layout;

    if (Phaser.Math.Distance.Between(px, py, station.x, station.y) < 70) {
      if (this.collected.size < 5) {
        this.say('리플', `거울을 복원하려면 조각이 ${5 - this.collected.size}개 더 필요해.`);
      } else if (!this.mirrorBuilt) {
        this.buildMirror();
      } else {
        this.say('리플', '거울은 고정 기준점이야. 마우스로 끊어진 공간 조각을 움직여 도서관을 맞추고, 거울 옆에서는 SPACE로 각도만 조정해.');
      }
      return;
    }

    // 모조 프리즘 — 함정 피드백
    if (Phaser.Math.Distance.Between(px, py, decoy.x, decoy.y) < 60) {
      if (this.decoyActive) {
        this.say('리플', '이건 모조 프리즘이야! 여기선 클리어가 안 돼. 마지막 반사 방향을 목표 프리즘 쪽으로 틀어봐.', 4500);
      } else {
        this.say('리플', '...수상한 느낌. 빛이 닿지 않으면 반응이 없어.', 2200);
      }
      return;
    }

    if (this.mirrorBuilt) {
      for (const mirror of this.mirrors) {
        if (Phaser.Math.Distance.Between(px, py, mirror.x, mirror.y) < 66) {
          this.rotateMirror(mirror);
          return;
        }
      }
    } else if (this.mirrors?.some(m => Phaser.Math.Distance.Between(px, py, m.x, m.y) < 66)) {
      this.say('리플', '받침대는 준비됐지만 거울이 아직 없어. 조각을 모아 복원대에서 완성하자.');
      return;
    }

    if (Phaser.Math.Distance.Between(px, py, goal.x, goal.y) < 68) {
      if (this.beamAligned) this.doClear();
      else this.say('리플', '아직 안정화 조건이 부족해. 공간 좌표를 맞춘 뒤 빛이 세 거울에 모두 반사되어 목표 프리즘에 닿아야 해.');
    }
  }

  // ─── 수집 + 조작 ─────────────────────────────────────────
  collectShard(item) {
    item.done = true;
    item.g.destroy();
    item.glow.destroy();
    item.label.destroy();
    this.collected.add(item.id);
    const n = this.collected.size;

    const flash = this.add.circle(item.x, item.y, 26, 0x9fe8ff, 0.72).setDepth(50);
    this.tweens.add({ targets: flash, scale: 3.2, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
    this.itemsTxt.setText(`조각 ${n} / 5`);
    this.stationLbl.setText(`[${n}/5] 거울 복원대`);

    if (n === 5) {
      this.stationGlow.setFillStyle(0x78dfff, 0.28);
      this.say('리플', '조각 모두 확보! 하단 복원대에서 SPACE를 눌러 거울을 완성하자.', 4200);
    } else {
      this.say('리플', `${item.name} 확보! ${5 - n}개 더 찾으면 거울을 복원할 수 있어.`, 2200);
    }
  }

  buildMirror() {
    this.mirrorBuilt = true;
    this.mirrorTxt.setText('거울: 완성');
    this.mirrorTxt.setColor('#ffdc8a');
    this.stationLbl.setText('거울 완성 · 공간 조각 해제');
    this.stationGlow.setFillStyle(0xffd16d, 0.26);

    this.mirrors.forEach((m, i) => {
      this.mirrorAngles[i] = this.solutionAngles[i];
      this.drawMirror(m.g, m.x, m.y, this.mirrorAngles[i], true);
      m.label.setText(`${m.name} · ${this.mirrorAngles[i]}°`);
      m.label.setColor('#dff8ff');
    });
    this.spaceAnchors?.forEach(anchor => {
      anchor.label.setAlpha(1);
      anchor.label.setText(`공간 조각 ${anchor.id}`);
      anchor.label.setColor('#dff8ff');
      this.drawSpaceAnchor(anchor);
    });
    this._updateAlignHUD();

    this.cameras.main.flash(360, 150, 230, 255, true);
    this.playLightSurge('build');
    this.say('리플', '거울 복원 완료! 거울 각도는 기준값으로 맞춰뒀어. 마우스로 끊어진 공간 조각을 기준 고리에 맞추면 도서관이 다시 이어질 거야.', 5600);
    this.updateBeams();
  }

  rotateMirror(mirror) {
    this.mirrorAngles[mirror.idx] = (this.mirrorAngles[mirror.idx] + this.mirrorStep) % 180;
    const ang = this.mirrorAngles[mirror.idx];
    this.drawMirror(mirror.g, mirror.x, mirror.y, ang, true);
    mirror.label.setText(`${mirror.name} · ${ang}°`);
    this._updateAlignHUD();
    this.updateBeams();

    if (this.beamAligned) {
      this.say('리플', '세 거울이 모두 맞았어! 목표 프리즘 옆에서 SPACE를 눌러 안정화하자.', 3600);
    } else if (this.decoyActive) {
      this.say('리플', '모조 프리즘에 빛이 닿았어! 마지막 반사 방향을 다시 잡아보자.', 2200);
    } else {
      this.say('리플', `${mirror.name} → ${ang}°. 반사 경로가 바뀌었어.`, 1600);
    }
  }

  _updateAlignHUD() {
    if (!this.alignTxt) return;
    if (!this.mirrorBuilt) {
      this.alignTxt.setText('반사 0/3 · 복원 전');
      this.alignTxt.setColor('#8ba8c0');
      this.spaceTxt?.setText('공간 안정도 --%');
      this.spaceTxt?.setColor('#ff9a76');
      return;
    }
    const state = this.beamAligned ? '목표 도달' : this.decoyActive ? '모조 주의' : '조정 중';
    this.alignTxt.setText(`반사 ${this.lastBeamHitCount}/3 · ${state}`);
    this.alignTxt.setColor(this.beamAligned ? '#ffe060' : this.decoyActive ? '#ff9a76' : '#8ba8c0');
    const stability = Math.round(this.getSpaceStability() * 100);
    this.spaceTxt?.setText(`공간 안정도 ${stability}%`);
    this.spaceTxt?.setColor(stability > 72 ? '#ffe060' : stability > 38 ? '#ffdc8a' : '#ff9a76');
  }

  updateMirrorLabels(hitMirrorIds = new Set()) {
    if (!this.mirrorBuilt) return;
    this.mirrors.forEach((mirror) => {
      const hit = hitMirrorIds.has(mirror.idx);
      mirror.label.setText(`${mirror.name} · ${this.mirrorAngles[mirror.idx]}°${hit ? ' · 반사' : ''}`);
      mirror.label.setColor(hit ? '#ffe6a8' : '#dff8ff');
    });
  }

  // ─── 클리어 ──────────────────────────────────────────────
  doClear() {
    this.cleared = true;
    this.player.setVelocity(0, 0);
    this.anomalyLevel = 0;
    this.cameras.main.setRotation?.(0);

    this.darkOverlays.forEach(zone => {
      this.tweens.add({ targets: [zone.rect, zone.label], alpha: 0, duration: 800 });
    });
    this.tweens.add({
      targets: [this.fractureG, this.spectralG, this.noiseG, this.spaceTearG, this.anchorFieldG, this.spaceChunkG],
      alpha: 0,
      duration: 800
    });
    this.tweens.add({ targets: this.goalGlow, scale: 2.6, alpha: 0, duration: 900 });
    this.cameras.main.flash(900, 255, 235, 160);

    this.say('리플', '빛의 경로가 맞았어. 세 거울을 통해 흩어진 파동이 하나로 정렬됐네.', 4500);
    this.time.delayedCall(5200, () => {
      this.cameras.main.fadeOut(650);
      this.time.delayedCall(680, () => {
        hubController.anomalyCleared('lens-refraction');
        this.scene.stop();
        this.scene.resume('HubScene');
      });
    });
  }
}
