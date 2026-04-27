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
    this.mirrorAngles = [0, 0];
    this.requiredAngles = [3, 1];

    this.layout = this.createLibraryLayout();

    this.cameras.main.setBackgroundColor('#15110d');
    this.cameras.main.fadeIn(500);

    this.drawLibrary();
    this.createZoneOverlays();
    this.createStation();
    this.createMirrors();
    this.createItems();
    this.createPlayer();
    this.createControls();
    this.createHUD();
    this.updateBeams();

    this.time.delayedCall(700, () => {
      this.say('리플', '창문으로 들어온 빛을 목표 프리즘까지 보내야 해. 먼저 흩어진 거울 조각을 모아 복원대에서 거울을 완성하자.');
    });
  }

  createLibraryLayout() {
    const { W, H, WALL } = this;
    return {
      window: { x: W - 132, y: WALL - 14 },
      mirrors: [
        { x: W * 0.62, y: H * 0.34, name: '상단 거울' },
        { x: W * 0.38, y: H * 0.58, name: '하단 거울' }
      ],
      station: { x: W * 0.50, y: H - WALL - 30 },
      goal: { x: W * 0.78, y: H * 0.70 },
      darkZones: [
        { x: WALL + W * 0.10, y: WALL + H * 0.20, w: W * 0.20, h: H * 0.36 },
        { x: W - WALL - W * 0.10, y: WALL + H * 0.20, w: W * 0.20, h: H * 0.36 }
      ]
    };
  }

  drawLibrary() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(0);

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

    this.drawLibrarySign();
    this.drawTallWindow();
    this.drawBookcases();
    this.drawReadingFurniture();
    this.drawLibraryDetails();
  }

  drawLibrarySign() {
    const { WALL } = this;
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x101a22, 0.96);
    g.fillRoundedRect(WALL + 18, 12, 268, 38, 5);
    g.lineStyle(2, 0x78dfff, 0.54);
    g.strokeRoundedRect(WALL + 18, 12, 268, 38, 5);
    this.add.text(WALL + 152, 31, '도서관 · 빛의 경로 복원', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '14px',
      color: '#c8f4ff',
      fontStyle: '800'
    }).setOrigin(0.5).setDepth(5);
  }

  drawTallWindow() {
    const { W, WALL } = this;
    const { window } = this.layout;
    const g = this.add.graphics().setDepth(2);
    const x = window.x - 80;
    const y = 10;

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

    const light = this.add.graphics().setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    light.fillStyle(0xffe3a0, 0.10);
    light.beginPath();
    light.moveTo(window.x - 58, WALL);
    light.lineTo(W * 0.70, this.H * 0.34);
    light.lineTo(W * 0.42, this.H - WALL - 20);
    light.lineTo(window.x + 58, WALL);
    light.closePath();
    light.fillPath();
    light.lineStyle(1, 0xffe8b0, 0.18);
    light.lineBetween(window.x - 42, WALL, W * 0.56, this.H * 0.46);
    light.lineBetween(window.x + 24, WALL, W * 0.44, this.H * 0.74);
  }

  shelfRects() {
    const { W, H, WALL } = this;
    return [
      { x: WALL + 16, y: WALL + 26, w: W * 0.22, h: H * 0.36, side: 'left' },
      { x: W - WALL - W * 0.22 - 16, y: WALL + 26, w: W * 0.22, h: H * 0.36, side: 'right' },
      { x: WALL + 18, y: H * 0.70, w: W * 0.28, h: H * 0.15, side: 'bottom-left' },
      { x: W - WALL - W * 0.28 - 18, y: H * 0.78, w: W * 0.28, h: H * 0.11, side: 'bottom-right' }
    ];
  }

  drawBookcases() {
    const g = this.add.graphics().setDepth(3);
    this.shelfRects().forEach((shelf, idx) => {
      this.drawBookcase(g, shelf, idx);
    });
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
      let bx = x + 12;
      let guard = 0;
      while (bx < x + w - 16 && guard < 80) {
        guard++;
        const bw = Phaser.Math.Between(5, 10);
        const bh = Phaser.Math.Between(18, 30);
        const color = bookColors[(idx + row + guard) % bookColors.length];
        g.fillStyle(color, 0.88);
        g.fillRoundedRect(bx, shelfY + 29 - bh, bw, bh, 1);
        g.fillStyle(0xffffff, 0.14);
        g.fillRect(bx + 1, shelfY + 32 - bh, 1, Math.max(4, bh - 5));
        bx += bw + Phaser.Math.Between(2, 5);
      }
    }

    g.fillStyle(0xffd889, 0.14);
    g.fillRect(x + 6, y + 6, w - 12, 4);
  }

  drawReadingFurniture() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(4);

    [
      { x: W * 0.46, y: H * 0.38, w: 150, h: 54, rot: -0.04 },
      { x: W * 0.57, y: H * 0.66, w: 170, h: 58, rot: 0.03 }
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

  drawLibraryDetails() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(5);

    g.fillStyle(0x203240, 0.94);
    g.fillRoundedRect(W * 0.50 - 92, WALL + 20, 184, 28, 4);
    g.lineStyle(1, 0x78dfff, 0.42);
    g.strokeRoundedRect(W * 0.50 - 92, WALL + 20, 184, 28, 4);
    this.add.text(W * 0.50, WALL + 34, '빛 경로 판독기', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#c9f3ff',
      fontStyle: '800'
    }).setOrigin(0.5).setDepth(6);

    g.fillStyle(0xf6e8bd, 0.92);
    g.fillRoundedRect(WALL + 18, H * 0.55, 122, 86, 3);
    g.lineStyle(1, 0x9c7648, 0.55);
    g.strokeRoundedRect(WALL + 18, H * 0.55, 122, 86, 3);
    this.add.text(WALL + 30, H * 0.55 + 10, '복원 메모\n1. 조각 5개 수집\n2. 복원대에서 조립\n3. 빛을 프리즘으로 유도', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px',
      color: '#4a2c12',
      lineSpacing: 5
    }).setDepth(6);

    for (let i = 0; i < 18; i++) {
      const x = W * (0.32 + (i % 6) * 0.075);
      const y = H * (0.47 + Math.floor(i / 6) * 0.11);
      g.fillStyle(0xffe5a6, 0.16);
      g.fillCircle(x, y, 1.4);
      g.fillCircle(x + 6, y + 3, 0.9);
    }
  }

  createZoneOverlays() {
    this.darkOverlays = this.layout.darkZones.map((z, i) => {
      const rect = this.add.rectangle(z.x, z.y, z.w, z.h, 0x020204, 0.72)
        .setDepth(31);
      const label = this.add.text(z.x, z.y - z.h / 2 + 16, i === 0 ? '그림자 서가 A' : '그림자 서가 B', {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px',
        color: '#9fc7e8',
        fontStyle: '700'
      }).setOrigin(0.5).setDepth(32).setAlpha(0.72);
      return { rect, label };
    });

    this.sonarRing = this.add.circle(0, 0, 80, 0x8bdcff, 0)
      .setDepth(42)
      .setStrokeStyle(2, 0x8bdcff, 0.8);
  }

  createStation() {
    const { station, goal } = this.layout;
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

    this.stationGlow = this.add.circle(station.x, station.y, 36, 0x78dfff, 0.08)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.stationGlow,
      alpha: { from: 0.06, to: 0.23 },
      yoyo: true,
      repeat: -1,
      duration: 1300
    });

    this.stationLbl = this.add.text(station.x, station.y + 36, '[0/5] 거울 복원대', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#b9ecff',
      fontStyle: '800',
      backgroundColor: '#071018',
      padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(12);

    this.goalBase = this.add.graphics().setDepth(8);
    this.goalGlow = this.add.circle(goal.x, goal.y, 42, 0xffdf7d, 0.07)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.goalText = this.add.text(goal.x, goal.y + 48, '목표 프리즘', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#ffe6a8',
      fontStyle: '800',
      backgroundColor: '#201407',
      padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(12);
    this.drawGoal(false);
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

  createMirrors() {
    this.mirrors = this.layout.mirrors.map((def, i) => {
      const g = this.add.graphics().setDepth(11);
      const label = this.add.text(def.x, def.y + 42, `${def.name} · 조각 필요`, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px',
        color: '#c7d8e2',
        fontStyle: '700',
        backgroundColor: '#071018',
        padding: { x: 6, y: 2 }
      }).setOrigin(0.5).setDepth(12);
      this.drawMirror(g, def.x, def.y, 0, false);
      return { ...def, g, label, idx: i };
    });
    this.beamG = this.add.graphics().setDepth(10).setBlendMode(Phaser.BlendModes.ADD);
  }

  drawMirror(g, x, y, angleIdx, active) {
    const angleDeg = angleIdx * 45;
    const rad = Phaser.Math.DegToRad(angleDeg);
    g.clear();

    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(x - 34 + 5, y - 25 + 6, 68, 50, 6);
    g.fillStyle(active ? 0x10242c : 0x171717, 0.94);
    g.fillRoundedRect(x - 34, y - 25, 68, 50, 6);
    g.lineStyle(2, active ? 0x78dfff : 0x5e5e5e, active ? 0.62 : 0.45);
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

    const len = 26;
    g.lineStyle(8, 0x4d9bc2, 0.30);
    g.lineBetween(
      x - Math.cos(rad) * len,
      y - Math.sin(rad) * len,
      x + Math.cos(rad) * len,
      y + Math.sin(rad) * len
    );
    g.lineStyle(4, 0xe9fbff, 0.96);
    g.lineBetween(
      x - Math.cos(rad) * len,
      y - Math.sin(rad) * len,
      x + Math.cos(rad) * len,
      y + Math.sin(rad) * len
    );
    g.lineStyle(1, 0xffffff, 0.45);
    g.lineBetween(x - Math.cos(rad) * 13, y - Math.sin(rad) * 13, x + Math.cos(rad) * 18, y + Math.sin(rad) * 18);
  }

  updateBeams() {
    if (!this.beamG) return;
    const g = this.beamG;
    const { window, mirrors, goal } = this.layout;
    const first = this.mirrors?.[0] || mirrors[0];
    const second = this.mirrors?.[1] || mirrors[1];
    g.clear();

    g.lineStyle(12, 0xffd98a, 0.08);
    g.lineBetween(window.x, window.y, first.x, first.y);
    g.lineStyle(3, 0xfff0b0, this.mirrorBuilt ? 0.52 : 0.18);
    g.lineBetween(window.x, window.y, first.x, first.y);

    this.beamAligned = false;
    if (!this.mirrorBuilt) {
      this.drawGoal(false);
      this.goalGlow.setAlpha(0.07);
      return;
    }

    const correctA = this.mirrorAngles[0] === this.requiredAngles[0];
    const correctB = this.mirrorAngles[1] === this.requiredAngles[1];

    if (correctA) {
      this.drawBeamSegment(g, first.x, first.y, second.x, second.y, 0.68);
      this.setDarkZone(0, true);
    } else {
      this.drawStrayBeam(g, first.x, first.y, this.mirrorAngles[0], 0.26);
      this.setDarkZone(0, false);
    }

    if (correctA && correctB) {
      this.drawBeamSegment(g, second.x, second.y, goal.x, goal.y, 0.82);
      this.beamAligned = true;
      this.setDarkZone(1, true);
      this.drawGoal(true);
      this.goalGlow.setAlpha(0.36);
    } else {
      if (correctA) this.drawStrayBeam(g, second.x, second.y, this.mirrorAngles[1], 0.28);
      this.setDarkZone(1, false);
      this.drawGoal(false);
      this.goalGlow.setAlpha(0.07);
    }
  }

  drawBeamSegment(g, x1, y1, x2, y2, alpha) {
    g.lineStyle(14, 0xffd98a, alpha * 0.10);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(5, 0xffedb0, alpha * 0.52);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(2, 0xffffff, alpha);
    g.lineBetween(x1, y1, x2, y2);
  }

  drawStrayBeam(g, x, y, angleIdx, alpha) {
    const rad = Phaser.Math.DegToRad(angleIdx * 45 - 70);
    const ex = x + Math.cos(rad) * 210;
    const ey = y + Math.sin(rad) * 210;
    g.lineStyle(3, 0xffd98a, alpha);
    g.lineBetween(x, y, ex, ey);
    g.lineStyle(1, 0xffffff, alpha * 0.45);
    g.lineBetween(x, y, ex, ey);
  }

  setDarkZone(index, lit) {
    const zone = this.darkOverlays?.[index];
    if (!zone || this.sonarActive) return;
    zone.rect.setAlpha(lit ? 0.22 : 0.72);
    zone.label.setAlpha(lit ? 0.28 : 0.72);
  }

  createItems() {
    const { W, H } = this;
    const shards = [
      { id: '1', x: W * 0.49, y: H * 0.48, name: '거울 조각 A' },
      { id: '2', x: W * 0.56, y: H * 0.73, name: '거울 조각 B' },
      { id: '3', x: W * 0.78, y: H * 0.25, name: '거울 조각 C' },
      { id: '4', x: W * 0.16, y: H * 0.20, name: '거울 조각 D' },
      { id: '5', x: W * 0.18, y: H * 0.38, name: '거울 조각 E' }
    ];

    this.itemObjs = shards.map((def, i) => {
      const g = this.add.graphics().setDepth(34);
      this.drawShard(g, def.x, def.y, i);
      const glow = this.add.circle(def.x, def.y, 16, 0x9fe8ff, 0.34)
        .setDepth(33)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: glow,
        scale: { from: 0.8, to: 1.55 },
        alpha: { from: 0.34, to: 0.08 },
        yoyo: true,
        repeat: -1,
        duration: 920 + i * 70
      });
      const label = this.add.text(def.x, def.y - 26, def.name, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px',
        color: '#e5f9ff',
        fontStyle: '800',
        backgroundColor: '#071018',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5).setDepth(35);
      return { ...def, g, glow, label, done: false };
    });
  }

  drawShard(g, x, y, seed) {
    g.clear();
    const rot = seed * 0.7;
    const pts = [
      [-12, -8],
      [8, -13],
      [15, 4],
      [-2, 13],
      [-14, 5]
    ].map(([px, py]) => {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
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

    this.pglow = this.add.circle(W / 2, H / 2, 40, 0x78dfff, 0.13)
      .setDepth(35)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.pname = this.add.text(W / 2, H / 2 + 45, '시물이', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#f2f7ff',
      fontStyle: '800',
      backgroundColor: '#071018',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(37);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER,F');
    this.input.keyboard.enabled = true;
    this.input.keyboard.resetKeys();
  }

  createHUD() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(40);
    g.fillStyle(0x071018, 0.94);
    g.fillRoundedRect(W - 214, 62, 204, 88, 6);
    g.lineStyle(1, 0x78dfff, 0.50);
    g.strokeRoundedRect(W - 214, 62, 204, 88, 6);

    this.itemsTxt = this.add.text(W - 24, 72, '조각 0 / 5', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '15px',
      color: '#ffdc8a',
      fontStyle: '900'
    }).setOrigin(1, 0).setDepth(41);

    this.mirrorTxt = this.add.text(W - 24, 98, '거울: 미완성', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#b8dfff',
      fontStyle: '800'
    }).setOrigin(1, 0).setDepth(41);

    this.sonarTxt = this.add.text(W - 24, 121, `탐지 ${this.sonarUses}회`, {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#8bdcff',
      fontStyle: '800'
    }).setOrigin(1, 0).setDepth(41);

    this.dlgBg = this.add.rectangle(W / 2, H - 8, W - 92, 76, 0x071018, 0.94)
      .setOrigin(0.5, 1)
      .setDepth(40)
      .setStrokeStyle(1, 0x78dfff, 0.42)
      .setVisible(false);
    this.dlgSpk = this.add.text(68, H - 72, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px',
      color: '#8bdcff',
      fontStyle: '900'
    }).setDepth(41).setVisible(false);
    this.dlgTxt = this.add.text(68, H - 56, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px',
      color: '#e8f5ff',
      wordWrap: { width: W - 150 }
    }).setDepth(41).setVisible(false);
  }

  say(speaker, text, dur = 4500) {
    this.dlgSpk.setText(`[ ${speaker} ]`);
    this.dlgTxt.setText(text);
    [this.dlgBg, this.dlgSpk, this.dlgTxt].forEach(o => o.setVisible(true).setAlpha(0));
    this.tweens.add({ targets: [this.dlgBg, this.dlgSpk, this.dlgTxt], alpha: 1, duration: 200 });
    if (this._dlgTm) this._dlgTm.remove();
    this._dlgTm = this.time.delayedCall(dur, () => {
      this.tweens.add({
        targets: [this.dlgBg, this.dlgSpk, this.dlgTxt],
        alpha: 0,
        duration: 300,
        onComplete: () => [this.dlgBg, this.dlgSpk, this.dlgTxt].forEach(o => o.setVisible(false))
      });
    });
  }

  update(_, delta) {
    if (this.cleared) return;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const speed = 275;
    let vx = left ? -speed : right ? speed : 0;
    let vy = up ? -speed : down ? speed : 0;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);
    if (vx > 5) this.player.setFlipX(true);
    else if (vx < -5) this.player.setFlipX(false);

    this.pglow.setPosition(this.player.x, this.player.y);
    this.pname.setPosition(this.player.x, this.player.y + 46);

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
    const px = this.player.x;
    const py = this.player.y;

    for (const item of this.itemObjs) {
      if (item.done) continue;
      if (Phaser.Math.Distance.Between(px, py, item.x, item.y) < 56) {
        this.collectShard(item);
        return;
      }
    }

    const { station, goal } = this.layout;
    if (Phaser.Math.Distance.Between(px, py, station.x, station.y) < 70) {
      if (this.collected.size < 5) {
        this.say('리플', `거울을 복원하려면 조각이 ${5 - this.collected.size}개 더 필요해.`);
      } else if (!this.mirrorBuilt) {
        this.buildMirror();
      } else {
        this.say('리플', '거울은 완성됐어. 이제 받침대에서 각도를 맞춰 빛을 보내자.');
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
    } else if (this.mirrors.some(m => Phaser.Math.Distance.Between(px, py, m.x, m.y) < 66)) {
      this.say('리플', '받침대는 준비됐지만 거울이 아직 없어. 조각을 모아 복원대에서 완성하자.');
      return;
    }

    if (Phaser.Math.Distance.Between(px, py, goal.x, goal.y) < 68) {
      if (this.beamAligned) this.doClear();
      else this.say('리플', '목표 프리즘은 아직 빛을 받지 못했어. 두 거울의 각도를 다시 맞춰보자.');
    }
  }

  collectShard(item) {
    item.done = true;
    item.g.destroy();
    item.glow.destroy();
    item.label.destroy();
    this.collected.add(item.id);
    const n = this.collected.size;

    const flash = this.add.circle(item.x, item.y, 26, 0x9fe8ff, 0.72)
      .setDepth(50)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: flash, scale: 3.2, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
    this.itemsTxt.setText(`조각 ${n} / 5`);
    this.stationLbl.setText(`[${n}/5] 거울 복원대`);

    if (n === 5) {
      this.stationGlow.setFillStyle(0x78dfff, 0.28);
      this.say('리플', '거울 조각을 모두 모았어. 하단 복원대에서 SPACE를 눌러 거울을 완성하자.', 4200);
    } else {
      this.say('리플', `${item.name} 확보! ${5 - n}개 더 찾으면 거울을 복원할 수 있어.`, 2200);
    }
  }

  buildMirror() {
    this.mirrorBuilt = true;
    this.mirrorTxt.setText('거울: 완성');
    this.mirrorTxt.setColor('#ffdc8a');
    this.stationLbl.setText('거울 완성 · 빛 경로 조정');
    this.stationGlow.setFillStyle(0xffd16d, 0.26);

    this.mirrors.forEach((m, i) => {
      this.mirrorAngles[i] = 0;
      this.drawMirror(m.g, m.x, m.y, this.mirrorAngles[i], true);
      m.label.setText(`${m.name} · ${this.mirrorAngles[i] * 45}°`);
      m.label.setColor('#dff8ff');
    });

    this.cameras.main.flash(360, 150, 230, 255, true);
    this.say('리플', '거울 복원 완료! 각 받침대에서 SPACE를 눌러 각도를 바꾸고, 빛을 목표 프리즘까지 보내자.', 4200);
    this.updateBeams();
  }

  rotateMirror(mirror) {
    this.mirrorAngles[mirror.idx] = (this.mirrorAngles[mirror.idx] + 1) % 4;
    this.drawMirror(mirror.g, mirror.x, mirror.y, this.mirrorAngles[mirror.idx], true);
    mirror.label.setText(`${mirror.name} · ${this.mirrorAngles[mirror.idx] * 45}°`);
    this.updateBeams();

    if (this.beamAligned) {
      this.say('리플', '좋아, 빛이 목표 프리즘에 닿았어! 프리즘 옆에서 SPACE를 눌러 안정화하자.', 3600);
    } else {
      this.say('리플', `${mirror.name} 각도 ${this.mirrorAngles[mirror.idx] * 45}°. 빛의 꺾임을 더 살펴보자.`, 1600);
    }
  }

  doClear() {
    this.cleared = true;
    this.player.setVelocity(0, 0);

    this.darkOverlays.forEach(zone => {
      this.tweens.add({ targets: [zone.rect, zone.label], alpha: 0, duration: 800 });
    });
    this.tweens.add({ targets: this.goalGlow, scale: 2.6, alpha: 0, duration: 900 });
    this.cameras.main.flash(900, 255, 235, 160);

    this.say('리플', '빛의 경로가 맞았어. 흩어진 파동이 다시 한 줄로 정렬됐네.', 4500);
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
