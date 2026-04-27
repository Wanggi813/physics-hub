class GravityScene extends Phaser.Scene {
  constructor() {
    super('GravityScene');
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.WALL = 64;
    this.collected = new Set();
    this.cleared = false;
    this.gravDirs = [
      { x: 0,  y: 1,  lbl: '아래', deg: 90  },
      { x: 0,  y: -1, lbl: '위',   deg: 270 },
      { x: 1,  y: 0,  lbl: '오른쪽', deg: 0   },
      { x: -1, y: 0,  lbl: '왼쪽', deg: 180 }
    ];
    this.gravIdx = 0;
    this.gravSpeed = 620;
    this.gravMaxSpeed = 390;
    this.jumpImpulse = 310;
    this.jumpCooldown = 0;
    this.wasAgainstGravity = false;
    this.gravVel = { x: 0, y: 0 };
    this.gravTimer = 8000;
    this.warned = false;
    this.extracting = null;
    this.extractDuration = 900;
    this.lastCoreMotionStarted = false;

    this.cameras.main.setBackgroundColor('#111820');
    this.cameras.main.fadeIn(600);

    this.drawFloor();
    this.drawWalls();
    this.drawFurniture();
    this.drawLabObstacles();
    this.drawLooseLabDetails();
    this.drawPremiumLabDetails();
    this.drawLighting();
    this.drawAnomalyDecor();
    this.drawGravWallMarkers();

    this.createPhysicsWalls();
    this.createItems();
    this.createStation();
    this.createPlayer();
    this.createControls();
    this.createHUD();
    this.startDebris();
    this.startEmergencyLights();
    this.startArcHazards();
    this.startAmbientLabAnimations();

    this.time.delayedCall(700, () =>
      this.say('시물이', '코어가 쉽게 분리되지 않아. 벽의 중력 변화와 장비 펄스 타이밍을 같이 관찰해봐.')
    );
  }

  drawFloor() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(0);
    const ix = WALL, iy = WALL, iw = W - WALL * 2, ih = H - WALL * 2;

    g.fillStyle(0xd7dde2, 1);
    g.fillRect(ix, iy, iw, ih);

    g.fillStyle(0xffffff, 0.18);
    g.fillRect(ix + 10, iy + 8, iw - 20, 12);
    g.fillStyle(0x7f929b, 0.14);
    g.fillRect(ix + 8, iy + ih - 18, iw - 16, 12);
    g.fillRect(ix + 8, iy + 8, 12, ih - 16);
    g.fillRect(ix + iw - 20, iy + 8, 12, ih - 16);

    [
      [W * 0.30, H * 0.34, 164, 92],
      [W * 0.70, H * 0.34, 164, 92],
      [W * 0.30, H * 0.67, 164, 92],
      [W * 0.70, H * 0.67, 164, 92],
      [W * 0.50, H * 0.50, 240, 180]
    ].forEach(([cx, cy, ew, eh]) => {
      g.fillStyle(0x1a2228, 0.045);
      g.fillEllipse(cx + 8, cy + 10, ew, eh);
      g.fillStyle(0xffffff, 0.045);
      g.fillEllipse(cx - 18, cy - 15, ew * 0.45, eh * 0.18);
    });

    this.fieldGridG = this.add.graphics().setDepth(1);
    this.drawFieldGrid();

    g.fillStyle(0x68d8ff, 0.05);
    g.fillCircle(W / 2, H / 2, Math.min(iw, ih) * 0.42);
    g.lineStyle(2, 0x56c7ff, 0.16);
    g.strokeCircle(W / 2, H / 2, Math.min(iw, ih) * 0.27);
    g.strokeCircle(W / 2, H / 2, Math.min(iw, ih) * 0.39);

    const sg = this.add.graphics().setDepth(3);
    sg.lineStyle(5, 0xffc928, 0.35);
    [
      [WALL + 8, WALL + 8, WALL + 92, WALL + 8],
      [WALL + 8, WALL + 8, WALL + 8, WALL + 92],
      [W - WALL - 92, WALL + 8, W - WALL - 8, WALL + 8],
      [W - WALL - 8, WALL + 8, W - WALL - 8, WALL + 92],
      [WALL + 8, H - WALL - 8, WALL + 92, H - WALL - 8],
      [WALL + 8, H - WALL - 92, WALL + 8, H - WALL - 8],
      [W - WALL - 92, H - WALL - 8, W - WALL - 8, H - WALL - 8],
      [W - WALL - 8, H - WALL - 92, W - WALL - 8, H - WALL - 8]
    ].forEach(([x1, y1, x2, y2]) => sg.lineBetween(x1, y1, x2, y2));
  }

  drawFieldGrid() {
    const { W, H, WALL } = this;
    const g = this.fieldGridG;
    if (!g) return;
    g.clear();
    const dir = this.gravDirs[this.gravIdx] || this.gravDirs[0];
    g.lineStyle(1, 0x31bfff, 0.22);
    for (let x = WALL + 42; x < W - WALL; x += 84) {
      for (let y = WALL + 42; y < H - WALL; y += 84) {
        const len = 22;
        g.lineBetween(x - dir.x * len * 0.4, y - dir.y * len * 0.4, x + dir.x * len, y + dir.y * len);
        this.drawTinyArrowHead(g, x + dir.x * len, y + dir.y * len, this.gravDirs[this.gravIdx].deg, 0x31bfff, 0.22);
      }
    }
  }

  drawTinyArrowHead(g, x, y, deg, color, alpha) {
    const r = Phaser.Math.DegToRad(deg);
    g.lineStyle(1, color, alpha);
    g.lineBetween(x, y, x - Math.cos(r - 0.65) * 7, y - Math.sin(r - 0.65) * 7);
    g.lineBetween(x, y, x - Math.cos(r + 0.65) * 7, y - Math.sin(r + 0.65) * 7);
  }

  drawWalls() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(2);
    const wallColor = 0x26313a;
    const edgeColor = 0x465763;

    g.fillStyle(wallColor, 1);
    g.fillRect(0, 0, W, WALL);
    g.fillRect(0, H - WALL, W, WALL);
    g.fillRect(0, 0, WALL, H);
    g.fillRect(W - WALL, 0, WALL, H);

    for (let x = WALL; x < W - WALL; x += 92) {
      g.lineStyle(1, 0x5e707c, 0.32);
      g.lineBetween(x, 6, x, WALL - 8);
      g.lineBetween(x, H - WALL + 8, x, H - 6);
    }
    for (let y = WALL; y < H - WALL; y += 76) {
      g.lineStyle(1, 0x5e707c, 0.32);
      g.lineBetween(6, y, WALL - 8, y);
      g.lineBetween(W - WALL + 8, y, W - 6, y);
    }

    g.fillStyle(0x0c161c, 1);
    g.fillRoundedRect(W / 2 - 150, 12, 300, 38, 5);
    g.lineStyle(2, 0x4be0ff, 0.7);
    g.strokeRoundedRect(W / 2 - 150, 12, 300, 38, 5);
    for (let y = 20; y < 46; y += 8) {
      g.lineStyle(1, 0x4be0ff, 0.08);
      g.lineBetween(W / 2 - 138, y, W / 2 + 138, y);
    }
    this.add.text(W / 2, 31, '중력장 분석실', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px',
      color: '#a8f3ff',
      fontStyle: '700'
    }).setOrigin(0.5).setDepth(4);

    this.drawWhiteboard(WALL + 10, 216);
    this.drawSupplyCabinet(W - WALL - 12, H * 0.56);
    this.drawWallObstacles();
    this.drawWallPipes();

    g.lineStyle(3, edgeColor, 0.85);
    g.strokeRect(WALL - 1, WALL - 1, W - WALL * 2 + 2, H - WALL * 2 + 2);
    g.lineStyle(1, 0xe8fbff, 0.15);
    g.strokeRect(WALL + 4, WALL + 4, W - WALL * 2 - 8, H - WALL * 2 - 8);
  }

  drawWhiteboard(x, y) {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0xf2fbf8, 0.94);
    g.fillRoundedRect(x, y, 150, 104, 4);
    g.lineStyle(2, 0x9ab4b0, 0.7);
    g.strokeRoundedRect(x, y, 150, 104, 4);
    g.lineStyle(2, 0x2f7c93, 0.75);
    g.lineBetween(x + 20, y + 70, x + 120, y + 70);
    g.lineBetween(x + 45, y + 88, x + 45, y + 22);
    g.lineStyle(2, 0xf06040, 0.75);
    g.strokeCircle(x + 84, y + 54, 20);
    g.fillStyle(0xffc857, 0.9);
    g.fillCircle(x + 132, y + 14, 4);
    g.fillStyle(0x57c7ff, 0.9);
    g.fillCircle(x + 120, y + 14, 4);
    g.fillStyle(0x2f3d42, 0.75);
    g.fillRoundedRect(x + 94, y + 90, 36, 6, 2);
    g.lineStyle(1, 0xff6d4a, 0.55);
    g.lineBetween(x + 70, y + 70, x + 120, y + 38);
    this.add.text(x + 12, y + 10, 'FIELD NOTE\nF = ma\ng = 9.8 m/s²\nvector: watch walls', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px',
      color: '#244044',
      lineSpacing: 4
    }).setDepth(5);
  }

  drawSupplyCabinet(x, y) {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x18242c, 0.96);
    g.fillRoundedRect(x - 82, y - 64, 82, 128, 4);
    g.lineStyle(1, 0x7adfff, 0.4);
    g.strokeRoundedRect(x - 82, y - 64, 82, 128, 4);
    for (let i = 0; i < 3; i++) {
      const sy = y - 38 + i * 35;
      g.lineStyle(1, 0x7adfff, 0.22);
      g.lineBetween(x - 76, sy, x - 7, sy);
      [['0x62c6ff', -58], ['0x9cff7a', -37], ['0xffc857', -20]].forEach(([c, ox], idx) => {
        g.fillStyle(Number(c), 0.85);
        g.fillRoundedRect(x + ox, sy - 19 + idx % 2, 10, 17, 2);
        g.fillStyle(0xe7fbff, 0.65);
        g.fillRect(x + ox + 2, sy - 15 + idx % 2, 6, 2);
      });
    }
    g.fillStyle(0x7adfff, 0.65);
    g.fillCircle(x - 74, y + 50, 3);
    g.fillCircle(x - 8, y + 50, 3);
  }

  wallObstacleDefs() {
    const { W, H, WALL } = this;
    return [
      { kind: 'shelf', x: WALL + 23,     y: H * 0.34, w: 46,  h: 86 },
      { kind: 'panel', x: WALL + 24,     y: H * 0.74, w: 48,  h: 112 },
      { kind: 'sink',  x: W - WALL - 24, y: H * 0.26, w: 48,  h: 100 },
      { kind: 'rack',  x: W - WALL - 24, y: H * 0.76, w: 48,  h: 108 },
      { kind: 'duct',  x: W * 0.32,      y: WALL + 22, w: 118, h: 44 },
      { kind: 'rail',  x: W * 0.72,      y: H - WALL - 22, w: 132, h: 44 }
    ];
  }

  drawWallObstacles() {
    const g = this.add.graphics().setDepth(6);
    this.wallObstacleDefs().forEach(def => {
      const x = def.x - def.w / 2;
      const y = def.y - def.h / 2;

      g.fillStyle(0x000000, 0.18);
      g.fillRoundedRect(x + 5, y + 5, def.w, def.h, 4);

      if (def.kind === 'shelf') {
        g.fillStyle(0x2c3b43, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, 0x7adfff, 0.5);
        g.strokeRoundedRect(x, y, def.w, def.h, 4);
        for (let i = 1; i < 3; i++) {
          g.lineStyle(1, 0x9feeff, 0.25);
          g.lineBetween(x + 5, y + i * def.h / 3, x + def.w - 5, y + i * def.h / 3);
        }
        g.fillStyle(0xffc857, 0.75);
        g.fillRoundedRect(x + 12, y + 12, 9, 18, 2);
        g.fillStyle(0x8dffbd, 0.7);
        g.fillRoundedRect(x + 25, y + 45, 10, 22, 2);
      } else if (def.kind === 'panel') {
        g.fillStyle(0x17212a, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, 0xffc857, 0.45);
        g.strokeRoundedRect(x, y, def.w, def.h, 4);
        for (let i = 0; i < 4; i++) {
          g.fillStyle(i % 2 ? 0xff7048 : 0x63e8ff, 0.75);
          g.fillCircle(def.x, y + 18 + i * 22, 5);
        }
      } else if (def.kind === 'sink') {
        g.fillStyle(0x263944, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 6);
        g.lineStyle(2, 0xb8d9e6, 0.55);
        g.strokeRoundedRect(x, y, def.w, def.h, 6);
        g.fillStyle(0x98e8ff, 0.2);
        g.fillRoundedRect(x + 9, y + 16, def.w - 18, 28, 8);
        g.lineStyle(2, 0xd7f8ff, 0.5);
        g.lineBetween(def.x, y + 7, def.x, y + 17);
      } else if (def.kind === 'rack') {
        g.fillStyle(0x202a30, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, 0x92a9b6, 0.55);
        g.strokeRoundedRect(x, y, def.w, def.h, 4);
        for (let i = 0; i < 4; i++) {
          g.fillStyle([0x5de6ff, 0xffc857, 0x8dffbd, 0xff7a5c][i], 0.75);
          g.fillRoundedRect(x + 10, y + 12 + i * 22, 28, 9, 2);
        }
      } else if (def.kind === 'duct') {
        g.fillStyle(0x33424b, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, 0x91a9b6, 0.45);
        g.strokeRoundedRect(x, y, def.w, def.h, 4);
        for (let i = 0; i < 5; i++) {
          g.lineStyle(1, 0x0f171c, 0.45);
          g.lineBetween(x + 16 + i * 18, y + 8, x + 16 + i * 18, y + def.h - 8);
        }
      } else {
        g.fillStyle(0x2f363a, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, 0xffc857, 0.5);
        g.strokeRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, 0xffc857, 0.35);
        g.lineBetween(x + 12, def.y, x + def.w - 12, def.y);
        g.lineBetween(def.x, y + 10, def.x, y + def.h - 10);
      }
    });
  }

  drawWallPipes() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(5);

    [
      { y: 18, x1: WALL + 18, x2: W * 0.34, color: 0x7d919d },
      { y: 45, x1: W * 0.62, x2: W - WALL - 18, color: 0x465b66 },
      { y: H - 45, x1: WALL + 22, x2: W * 0.42, color: 0x465b66 },
      { y: H - 18, x1: W * 0.58, x2: W - WALL - 22, color: 0x7d919d }
    ].forEach(pipe => {
      g.lineStyle(5, pipe.color, 0.7);
      g.lineBetween(pipe.x1, pipe.y, pipe.x2, pipe.y);
      g.lineStyle(1, 0xffffff, 0.18);
      g.lineBetween(pipe.x1, pipe.y - 2, pipe.x2, pipe.y - 2);
      for (let x = pipe.x1 + 22; x < pipe.x2; x += 44) {
        g.fillStyle(0x111a20, 0.8);
        g.fillRoundedRect(x - 4, pipe.y - 8, 8, 16, 2);
      }
    });

    [
      [22, WALL + 30, H * 0.34],
      [42, H * 0.58, H - WALL - 24],
      [W - 22, WALL + 52, H * 0.42],
      [W - 42, H * 0.62, H - WALL - 28]
    ].forEach(([x, y1, y2], i) => {
      const color = i % 2 ? 0x7d919d : 0x465b66;
      g.lineStyle(5, color, 0.68);
      g.lineBetween(x, y1, x, y2);
      g.lineStyle(1, 0xffffff, 0.16);
      g.lineBetween(x - 2, y1, x - 2, y2);
      for (let y = y1 + 26; y < y2; y += 46) {
        g.fillStyle(0x111a20, 0.78);
        g.fillRoundedRect(x - 8, y - 4, 16, 8, 2);
      }
    });

    [
      [WALL + 90, 38, 'VAC'],
      [W - WALL - 96, H - 40, 'COOL'],
      [36, H * 0.48, 'GAS'],
      [W - 38, H * 0.54, 'DATA']
    ].forEach(([x, y, text]) => {
      g.fillStyle(0xe7eef2, 0.82);
      g.fillRoundedRect(x - 19, y - 8, 38, 16, 2);
      g.lineStyle(1, 0x4e6570, 0.45);
      g.strokeRoundedRect(x - 19, y - 8, 38, 16, 2);
      this.add.text(x, y - 5, text, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#263940'
      }).setOrigin(0.5, 0).setDepth(6);
    });
  }

  drawFurniture() {
    const { W, H } = this;
    const fg = this.add.graphics().setDepth(4);
    const eqg = this.add.graphics().setDepth(5);
    const tables = [
      [W * 0.30, H * 0.34],
      [W * 0.70, H * 0.34],
      [W * 0.30, H * 0.67],
      [W * 0.70, H * 0.67]
    ];

    tables.forEach(([cx, cy], i) => {
      fg.fillStyle(0x000000, 0.18);
      fg.fillRoundedRect(cx - 60 + 7, cy - 30 + 8, 120, 60, 6);
      fg.fillStyle(0x243039, 1);
      fg.fillRoundedRect(cx - 60, cy - 30, 120, 60, 6);
      fg.lineStyle(2, 0x6c818f, 0.8);
      fg.strokeRoundedRect(cx - 60, cy - 30, 120, 60, 6);
      fg.fillStyle(0x31424d, 1);
      fg.fillRoundedRect(cx - 54, cy - 24, 108, 48, 4);
      fg.lineStyle(1, 0xffffff, 0.09);
      fg.lineBetween(cx - 52, cy - 22, cx + 52, cy - 22);
      fg.fillStyle(0x0f171c, 0.75);
      fg.fillRoundedRect(cx - 48, cy + 12, 34, 8, 2);
      fg.fillRoundedRect(cx + 12, cy + 12, 34, 8, 2);
      fg.lineStyle(1, 0x7adfff, 0.22);
      fg.lineBetween(cx - 38, cy + 16, cx - 18, cy + 16);
      fg.lineBetween(cx + 22, cy + 16, cx + 42, cy + 16);
      this.drawEquipment(eqg, cx, cy, i);
    });
  }

  labObstacleDefs() {
    const { W, H } = this;
    return [
      { kind: 'cart',  x: W * 0.50, y: H * 0.29, w: 132, h: 34 },
      { kind: 'coil',  x: W * 0.50, y: H * 0.72, w: 112, h: 42 },
      { kind: 'crate', x: W * 0.42, y: H * 0.50, w: 54,  h: 96 },
      { kind: 'tank',  x: W * 0.58, y: H * 0.50, w: 54,  h: 96 },
      { kind: 'case',  x: W * 0.18, y: H * 0.50, w: 52,  h: 120 },
      { kind: 'case',  x: W * 0.82, y: H * 0.52, w: 52,  h: 112 }
    ];
  }

  drawLabObstacles() {
    const g = this.add.graphics().setDepth(6);
    this.labObstacleDefs().forEach(def => {
      const x = def.x - def.w / 2;
      const y = def.y - def.h / 2;

      g.fillStyle(0x000000, 0.16);
      g.fillRoundedRect(x + 6, y + 7, def.w, def.h, 5);

      if (def.kind === 'cart') {
        g.fillStyle(0x22303a, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 5);
        g.lineStyle(2, 0x83a5b8, 0.72);
        g.strokeRoundedRect(x, y, def.w, def.h, 5);
        g.fillStyle(0x8fe7ff, 0.28);
        g.fillRect(x + 12, y + 8, def.w - 24, 7);
        g.fillStyle(0xffc857, 0.85);
        g.fillRoundedRect(x + 16, y + 18, 18, 7, 2);
        g.fillStyle(0x8dffbd, 0.8);
        g.fillRoundedRect(x + 42, y + 17, 12, 9, 2);
        g.lineStyle(1, 0xd7f8ff, 0.35);
        g.lineBetween(x + 62, y + 22, x + def.w - 18, y + 13);
        g.fillStyle(0x141d24, 1);
        g.fillCircle(x + 24, y + def.h - 4, 5);
        g.fillCircle(x + def.w - 24, y + def.h - 4, 5);
      } else if (def.kind === 'coil') {
        g.fillStyle(0x17242b, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 5);
        g.lineStyle(2, 0xffc857, 0.7);
        for (let i = 0; i < 4; i++) {
          g.strokeCircle(x + 24 + i * 22, def.y, 15);
        }
        g.fillStyle(0x55e6ff, 0.72);
        g.fillCircle(x + 12, y + 10, 3);
        g.fillStyle(0xff7048, 0.72);
        g.fillCircle(x + def.w - 12, y + 10, 3);
        g.lineStyle(1, 0xffc857, 0.45);
        g.lineBetween(x + 10, y + def.h - 9, x + def.w - 10, y + def.h - 9);
        g.lineStyle(1, 0x73e6ff, 0.45);
        g.strokeRoundedRect(x, y, def.w, def.h, 5);
      } else if (def.kind === 'tank') {
        g.fillStyle(0x223a34, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 12);
        g.lineStyle(2, 0x8df7c8, 0.65);
        g.strokeRoundedRect(x, y, def.w, def.h, 12);
        g.fillStyle(0x97ffd8, 0.25);
        g.fillRoundedRect(x + 10, y + 12, def.w - 20, def.h - 24, 8);
        g.fillStyle(0xc8fff0, 0.65);
        g.fillRect(x + 20, y - 8, def.w - 40, 10);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(def.x + 7, y + 24, 4);
        g.lineStyle(1, 0xc8fff0, 0.5);
        g.lineBetween(def.x, y + 44, def.x, y + def.h - 15);
      } else {
        g.fillStyle(def.kind === 'crate' ? 0x3b3430 : 0x2b3640, 1);
        g.fillRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(2, def.kind === 'crate' ? 0xc7955a : 0x7adfff, 0.55);
        g.strokeRoundedRect(x, y, def.w, def.h, 4);
        g.lineStyle(1, 0xffffff, 0.1);
        g.lineBetween(x + 8, y + 12, x + def.w - 8, y + def.h - 12);
        g.lineBetween(x + def.w - 8, y + 12, x + 8, y + def.h - 12);
        g.fillStyle(def.kind === 'crate' ? 0xffc857 : 0x7adfff, 0.55);
        g.fillRoundedRect(x + 12, y + 10, def.w - 24, 8, 2);
        g.fillStyle(0x0e151a, 0.45);
        g.fillRect(x + 10, y + def.h - 18, def.w - 20, 5);
      }
    });
  }

  drawLooseLabDetails() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(5);

    const clipboards = [
      [W * 0.23, H * 0.82, -0.18],
      [W * 0.76, H * 0.22, 0.12],
      [W * 0.62, H * 0.78, -0.08]
    ];
    clipboards.forEach(([cx, cy, rot]) => {
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const pts = [[-18, -12], [18, -12], [18, 12], [-18, 12]].map(([px, py]) => [cx + px * c - py * s, cy + px * s + py * c]);
      g.fillStyle(0xfff2bd, 0.92);
      g.beginPath();
      pts.forEach(([px, py], i) => i === 0 ? g.moveTo(px, py) : g.lineTo(px, py));
      g.closePath();
      g.fillPath();
      g.lineStyle(1, 0x8a7b55, 0.45);
      g.strokePath();
      g.fillStyle(0x54636a, 0.75);
      g.fillRoundedRect(cx - 8, cy - 14, 16, 5, 2);
      g.lineStyle(1, 0x57686d, 0.35);
      g.lineBetween(cx - 11, cy - 3, cx + 12, cy - 3);
      g.lineBetween(cx - 11, cy + 4, cx + 8, cy + 4);
    });

    [
      [W * 0.44, H * 0.22, W * 0.56, H * 0.22],
      [W * 0.50, H * 0.58, W * 0.68, H * 0.61],
      [W * 0.31, H * 0.48, W * 0.22, H * 0.42]
    ].forEach(([x1, y1, x2, y2], i) => {
      g.lineStyle(3, [0xffc857, 0x5de6ff, 0xff7a5c][i], 0.42);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo((x1 + x2) / 2, y1 + (i % 2 ? 22 : -18));
      g.lineTo(x2, y2);
      g.strokePath();
      g.fillStyle(0x10181d, 0.85);
      g.fillCircle(x1, y1, 4);
      g.fillCircle(x2, y2, 4);
    });

    [
      [W * 0.37, H * 0.22, 0x8dffbd],
      [W * 0.65, H * 0.38, 0xffc857],
      [W * 0.35, H * 0.74, 0x5de6ff],
      [W * 0.80, H * 0.66, 0xff7a5c]
    ].forEach(([cx, cy, color]) => {
      g.fillStyle(0x0e151a, 0.72);
      g.fillRoundedRect(cx - 13, cy - 8, 26, 16, 3);
      g.fillStyle(color, 0.82);
      g.fillCircle(cx - 5, cy, 3);
      g.lineStyle(1, color, 0.45);
      g.lineBetween(cx + 1, cy - 3, cx + 9, cy - 3);
      g.lineBetween(cx + 1, cy + 3, cx + 7, cy + 3);
    });

    g.lineStyle(2, 0xffc857, 0.28);
    g.strokeRoundedRect(W / 2 - 78, H / 2 - 78, 156, 156, 8);
    g.lineStyle(1, 0xffc857, 0.18);
    g.lineBetween(W / 2 - 65, H / 2, W / 2 + 65, H / 2);
    g.lineBetween(W / 2, H / 2 - 65, W / 2, H / 2 + 65);

    const floorLabels = [
      [W * 0.23, H * 0.30, 'AUX'],
      [W * 0.73, H * 0.31, 'S-02'],
      [W * 0.25, H * 0.66, 'CAL'],
      [W * 0.73, H * 0.70, 'G-LOCK']
    ];
    floorLabels.forEach(([x, y, text]) => {
      g.fillStyle(0x1b2a31, 0.22);
      g.fillRoundedRect(x - 22, y - 8, 44, 16, 2);
      g.lineStyle(1, 0x1b2a31, 0.35);
      g.strokeRoundedRect(x - 22, y - 8, 44, 16, 2);
      this.add.text(x, y - 5, text, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#263940'
      }).setOrigin(0.5, 0).setDepth(6);
    });

    [
      [W * 0.19, H * 0.38],
      [W * 0.81, H * 0.34],
      [W * 0.44, H * 0.82],
      [W * 0.56, H * 0.20]
    ].forEach(([x, y], i) => {
      g.fillStyle([0xffb000, 0x1f7aff, 0xff2f86, 0x8dffbd][i], 0.72);
      g.fillCircle(x, y, 4);
      g.lineStyle(1, 0x111820, 0.35);
      g.strokeCircle(x, y, 6);
      g.lineStyle(1, 0x111820, 0.28);
      g.lineBetween(x + 8, y, x + 24, y + (i % 2 ? 9 : -9));
    });

    for (let i = 0; i < 10; i++) {
      const x = W * (0.22 + (i % 5) * 0.14);
      const y = H * (0.43 + Math.floor(i / 5) * 0.16);
      g.fillStyle(0x22282c, 0.32);
      g.fillCircle(x, y, 1.5);
      g.fillCircle(x + 7, y + 3, 1);
    }
  }

  drawPremiumLabDetails() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(7);

    [
      { x: W * 0.20, y: H * 0.22, w: 74, h: 42, title: 'OSC', color: 0x55ff9a },
      { x: W * 0.80, y: H * 0.23, w: 74, h: 42, title: 'FLD', color: 0xffb000 },
      { x: W * 0.20, y: H * 0.78, w: 74, h: 42, title: 'LOG', color: 0x5de6ff },
      { x: W * 0.80, y: H * 0.78, w: 74, h: 42, title: 'SYNC', color: 0xff2f86 }
    ].forEach((m, idx) => {
      const x = m.x - m.w / 2;
      const y = m.y - m.h / 2;
      g.fillStyle(0x0e171d, 0.92);
      g.fillRoundedRect(x, y, m.w, m.h, 5);
      g.lineStyle(1, m.color, 0.55);
      g.strokeRoundedRect(x, y, m.w, m.h, 5);
      g.fillStyle(0x101f24, 1);
      g.fillRoundedRect(x + 8, y + 8, m.w - 16, 18, 3);
      g.lineStyle(1, m.color, 0.7);
      for (let i = 0; i < 4; i++) {
        const sx = x + 12 + i * 13;
        const sy = y + 17 + Math.sin(i + idx) * 5;
        if (i === 0) g.beginPath(), g.moveTo(sx, sy);
        else g.lineTo(sx, sy);
      }
      g.strokePath();
      g.fillStyle(m.color, 0.9);
      g.fillCircle(x + 11, y + 33, 2.5);
      g.fillStyle(0xdce8ec, 0.75);
      g.fillCircle(x + 21, y + 33, 2);
      this.add.text(x + m.w - 8, y + 30, m.title, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#dce8ec'
      }).setOrigin(1, 0).setDepth(8);
    });

    [
      [W * 0.38, H * 0.24],
      [W * 0.62, H * 0.24],
      [W * 0.38, H * 0.76],
      [W * 0.62, H * 0.76]
    ].forEach(([cx, cy], trayIdx) => {
      g.fillStyle(0x23313a, 0.85);
      g.fillRoundedRect(cx - 33, cy - 11, 66, 22, 4);
      g.lineStyle(1, 0x8ca4ae, 0.45);
      g.strokeRoundedRect(cx - 33, cy - 11, 66, 22, 4);
      for (let i = 0; i < 5; i++) {
        const bx = cx - 22 + i * 11;
        const fill = [0x5de6ff, 0xffb000, 0xff2f86, 0x8dffbd, 0xf2f7ff][(i + trayIdx) % 5];
        g.fillStyle(0xe8fbff, 0.45);
        g.fillRoundedRect(bx - 3, cy - 14, 6, 21, 2);
        g.fillStyle(fill, 0.82);
        g.fillRoundedRect(bx - 3, cy - 3, 6, 10, 2);
        g.lineStyle(1, 0xffffff, 0.32);
        g.lineBetween(bx - 1, cy - 12, bx - 1, cy - 5);
      }
    });

    [
      [WALL + 92, H - WALL - 34, 0xffb000],
      [WALL + 142, H - WALL - 34, 0x5de6ff],
      [W - WALL - 142, WALL + 34, 0xff2f86],
      [W - WALL - 92, WALL + 34, 0x8dffbd]
    ].forEach(([cx, cy, color]) => {
      g.lineStyle(2, color, 0.46);
      g.strokeCircle(cx, cy, 14);
      g.lineStyle(1, color, 0.28);
      g.strokeCircle(cx, cy, 21);
      g.fillStyle(color, 0.8);
      g.fillCircle(cx, cy, 3);
    });

    const glassPanels = [
      [W * 0.50, H * 0.20, 130, 26],
      [W * 0.50, H * 0.80, 130, 26]
    ];
    glassPanels.forEach(([cx, cy, w, h]) => {
      g.fillStyle(0xcff6ff, 0.12);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 5);
      g.lineStyle(1, 0xffffff, 0.24);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 5);
      g.lineStyle(1, 0xffffff, 0.32);
      g.lineBetween(cx - w / 2 + 9, cy - h / 2 + 5, cx + w / 2 - 28, cy - h / 2 + 5);
    });
  }

  drawEquipment(g, cx, cy, idx) {
    g.fillStyle(0x0e151a, 0.96);
    g.fillRoundedRect(cx - 13, cy - 22, 30, 15, 3);
    g.fillStyle(0x55ff9a, 0.8);
    g.fillRoundedRect(cx - 9, cy - 18, 22, 6, 2);
    g.lineStyle(1, 0x8dffbd, 0.4);
    g.lineBetween(cx - 7, cy - 15, cx + 11, cy - 15);

    const bx = cx + 34, by = cy + 5;
    g.fillStyle(0x3c86a8, 0.75);
    g.fillRoundedRect(bx - 10, by - 17, 20, 24, 3);
    g.fillStyle(0x8ce7ff, 0.28);
    g.fillRect(bx - 7, by - 14, 14, 10);
    g.lineStyle(1, 0xa3efff, 0.65);
    g.strokeRoundedRect(bx - 10, by - 17, 20, 24, 3);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(bx - 4, by - 10, 2);
    g.fillStyle(0x244c60, 0.55);
    g.fillRect(bx - 7, by + 1, 14, 2);

    const fx = cx - 29, fy = cy + 6;
    g.fillStyle(idx % 2 ? 0x7cc65b : 0xf2b84b, 0.72);
    g.beginPath();
    g.moveTo(fx, fy - 17);
    g.lineTo(fx + 14, fy + 9);
    g.lineTo(fx - 14, fy + 9);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0xffffff, 0.35);
    g.strokePath();
    g.fillStyle(0xdbe8ea, 0.75);
    g.fillRect(fx - 3, fy - 25, 6, 10);

    g.fillStyle(0xfff7c0, 0.9);
    g.fillRect(cx + 12, cy - 24, 22, 16);
    g.lineStyle(1, 0x5b6768, 0.35);
    g.lineBetween(cx + 15, cy - 19, cx + 31, cy - 19);
    g.lineBetween(cx + 15, cy - 15, cx + 29, cy - 15);

    g.fillStyle(0x101820, 0.9);
    g.fillRoundedRect(cx - 47, cy - 22, 22, 14, 3);
    g.fillStyle(idx % 2 ? 0xffc857 : 0x55ff9a, 0.8);
    g.fillCircle(cx - 40, cy - 15, 2.5);
    g.lineStyle(1, 0x8fe7ff, 0.45);
    g.lineBetween(cx - 34, cy - 18, cx - 27, cy - 12);

    g.lineStyle(2, idx % 2 ? 0xffc857 : 0x5de6ff, 0.38);
    g.beginPath();
    g.moveTo(cx - 44, cy + 5);
    g.lineTo(cx - 18, cy + 18);
    g.lineTo(cx + 18, cy + 17);
    g.strokePath();
  }

  drawLighting() {
    const { W, H } = this;
    [
      [W * 0.30, H * 0.30],
      [W * 0.70, H * 0.30],
      [W * 0.30, H * 0.70],
      [W * 0.70, H * 0.70]
    ].forEach(([lx, ly], i) => {
      const pool = this.add.ellipse(lx, ly, 330, 230, 0xdff7ff, 0.055)
        .setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: pool,
        alpha: { from: 0.04, to: 0.09 },
        yoyo: true,
        repeat: -1,
        duration: 1900 + i * 180,
        ease: 'Sine.easeInOut'
      });

      const lg = this.add.graphics().setDepth(8);
      lg.fillStyle(0xebf8ff, 0.95);
      lg.fillRoundedRect(lx - 48, ly - 8, 96, 16, 3);
      lg.lineStyle(1, 0xaec8d4, 0.7);
      lg.strokeRoundedRect(lx - 48, ly - 8, 96, 16, 3);
      lg.fillStyle(0xffffff, 0.35);
      lg.fillRect(lx - 43, ly - 5, 86, 5);
    });
  }

  drawAnomalyDecor() {
    const { W, H, WALL } = this;
    const g = this.add.graphics().setDepth(6);
    [[WALL, WALL], [W - WALL, WALL], [WALL, H - WALL], [W - WALL, H - WALL]].forEach(([cx, cy]) => {
      const sdx = cx < W / 2 ? 1 : -1;
      const sdy = cy < H / 2 ? 1 : -1;
      for (let i = 0; i < 5; i++) {
        const len = 16 + i * 9;
        const angle = Math.atan2(sdy, sdx) + (i - 2) * 0.33;
        g.lineStyle(1, 0x46e2ff, 0.22 - i * 0.025);
        g.lineBetween(cx, cy, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      }
    });

    for (let k = 0; k < 2; k++) {
      const ring = this.add.circle(W / 2, H / 2, 55, 0x48dfff, 0)
        .setDepth(5).setStrokeStyle(2, 0x48dfff, 0.24);
      this.tweens.add({
        targets: ring,
        scaleX: 5.4,
        scaleY: 4,
        alpha: 0,
        duration: 3200,
        repeat: -1,
        delay: k * 1600,
        ease: 'Power2.easeOut'
      });
    }

    this.dangerOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff5a24, 0)
      .setDepth(40).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.dangerOverlay,
      alpha: { from: 0, to: 0.035 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut'
    });
  }

  drawGravWallMarkers() {
    const { W, H, WALL } = this;
    const markerDefs = [
      { x: W / 2, y: H - WALL / 2, angle: 270, dirIdx: 0 },
      { x: W / 2, y: WALL / 2,     angle: 90,  dirIdx: 1 },
      { x: W - WALL / 2, y: H / 2, angle: 180, dirIdx: 2 },
      { x: WALL / 2,     y: H / 2, angle: 0,   dirIdx: 3 }
    ];

    this.gravMarkers = markerDefs.map(def => {
      const g = this.add.graphics().setDepth(9);
      const glow = this.add.circle(def.x, def.y, 28, 0x55dcff, 0)
        .setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
      this.drawMarkerArrow(g, def.x, def.y, def.angle, false);
      return { ...def, g, glow, active: false };
    });
    this.updateGravMarkers();
  }

  drawMarkerArrow(g, x, y, angleDeg, active) {
    g.clear();
    const r = Phaser.Math.DegToRad(angleDeg);
    const col = active ? 0x69e8ff : 0x6b8794;
    const a = active ? 0.95 : 0.35;
    const sz = active ? 14 : 9;
    g.lineStyle(active ? 2 : 1, col, a);
    g.beginPath();
    g.moveTo(x + Math.cos(r) * sz, y + Math.sin(r) * sz);
    g.lineTo(x + Math.cos(r + 2.5) * sz * 0.72, y + Math.sin(r + 2.5) * sz * 0.72);
    g.lineTo(x + Math.cos(r) * sz * 0.32, y + Math.sin(r) * sz * 0.32);
    g.lineTo(x + Math.cos(r - 2.5) * sz * 0.72, y + Math.sin(r - 2.5) * sz * 0.72);
    g.closePath();
    g.fillStyle(col, a * 0.62);
    g.fillPath();
    g.strokePath();
  }

  updateGravMarkers() {
    this.gravMarkers?.forEach((m, i) => {
      const active = i === this.gravIdx;
      if (m.active === active) return;
      m.active = active;
      this.drawMarkerArrow(m.g, m.x, m.y, m.angle, active);
      if (active) {
        this.tweens.add({ targets: m.glow, alpha: { from: 0.08, to: 0.42 }, yoyo: true, repeat: -1, duration: 600 });
      } else {
        this.tweens.killTweensOf(m.glow);
        m.glow.setAlpha(0);
      }
    });
  }

  createPhysicsWalls() {
    const { W, H, WALL } = this;
    this.walls = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();

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

    [
      [W * 0.30, H * 0.34],
      [W * 0.70, H * 0.34],
      [W * 0.30, H * 0.67],
      [W * 0.70, H * 0.67]
    ].forEach(([cx, cy]) => {
      const r = this.add.rectangle(cx, cy, 120, 60, 0, 0);
      this.physics.add.existing(r, true);
      this.obstacles.add(r);
    });

    this.labObstacleDefs().forEach(({ x, y, w, h }) => {
      const r = this.add.rectangle(x, y, w, h, 0, 0);
      this.physics.add.existing(r, true);
      this.obstacles.add(r);
    });

    this.wallObstacleDefs().forEach(({ x, y, w, h }) => {
      const r = this.add.rectangle(x, y, w, h, 0, 0);
      this.physics.add.existing(r, true);
      this.obstacles.add(r);
    });
  }

  createItems() {
    const { W, H, WALL } = this;
    this.itemObjs = [
      { id: 'A', x: WALL + 35, y: H * 0.51, name: '자이로 코어 A', labelDx: 56, labelDy: -18 },
      { id: 'B', x: W * 0.56, y: WALL + 35, name: '벡터 칩 B', labelDx: 0, labelDy: 34 },
      { id: 'C', x: W - WALL - 35, y: H * 0.40, name: '센서 모듈 C', labelDx: -58, labelDy: -18 }
    ].map(def => {
      const visual = this.coreVisual(def.id);
      const ig = this.add.graphics().setDepth(10);
      this.drawCoreItem(ig, def.x, def.y, def.id, false);
      const outerGlow = this.add.circle(def.x, def.y, visual.glowSize, visual.main, visual.glowAlpha)
        .setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: outerGlow,
        scale: { from: 1, to: 1.75 },
        alpha: { from: visual.glowAlpha, to: 0 },
        repeat: -1,
        duration: 1100
      });
      const tagW = 88;
      const tagH = 18;
      const tagX = def.x + def.labelDx;
      const tagY = def.y + def.labelDy;
      const tagBg = this.add.rectangle(tagX, tagY, tagW, tagH, 0xf3f7d8, 0.92)
        .setDepth(10).setStrokeStyle(1, visual.main, 0.78);
      const lbl = this.add.text(def.x + def.labelDx, def.y + def.labelDy, def.name, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px',
        color: visual.text,
        fontStyle: '700',
        shadow: { color: '#ffffff', fill: true, offsetX: 0, offsetY: 1, blur: 0 }
      }).setOrigin(0.5).setDepth(11);
      return { ...def, baseX: def.x, baseY: def.y, movePhase: Math.random() * Math.PI * 2, ig, outerGlow, tagBg, lbl, done: false, moving: false };
    });
    this.extractG = this.add.graphics().setDepth(19);
  }

  coreVisual(type) {
    return {
      A: { main: 0x1f7aff, inner: 0xffffff, halo: 0x06132a, text: '#072b68', shadow: '#1f7aff', glowAlpha: 0.28, glowSize: 32 },
      B: { main: 0xffb000, inner: 0x2b1400, halo: 0x261604, text: '#5a3100', shadow: '#ff9d00', glowAlpha: 0.30, glowSize: 33 },
      C: { main: 0xff2f86, inner: 0xfff06a, halo: 0x260814, text: '#651033', shadow: '#ff2f78', glowAlpha: 0.32, glowSize: 34 }
    }[type] || { main: 0x5de6ff, inner: 0xffc857, halo: 0x071218, text: '#11363f', shadow: '#22c9ff', glowAlpha: 0.18, glowSize: 28 };
  }

  drawCoreItem(g, x, y, type, collected) {
    g.clear();
    const palette = this.coreVisual(type);
    const col = collected ? 0xffffff : palette.main;
    const inner = collected ? 0xffffff : palette.inner;

    g.fillStyle(palette.halo, collected ? 0.18 : 0.82);
    g.fillCircle(x, y, type === 'C' ? 27 : 24);
    g.lineStyle(2, col, collected ? 0.2 : 0.35);
    g.strokeCircle(x, y, type === 'C' ? 28 : 25);

    if (type === 'A') {
      g.lineStyle(2, col, collected ? 0.42 : 0.95);
      g.fillStyle(col, collected ? 0.05 : 0.13);
      g.strokeCircle(x, y, 17);
      g.strokeEllipse(x, y, 34, 13);
      g.strokeEllipse(x, y, 13, 34);
      g.fillCircle(x, y, collected ? 3 : 5);
      g.lineStyle(1, inner, collected ? 0.35 : 0.75);
      g.lineBetween(x - 12, y, x + 12, y);
      g.lineBetween(x, y - 12, x, y + 12);
    } else if (type === 'B') {
      g.fillStyle(col, collected ? 0.06 : 0.16);
      g.lineStyle(2, col, collected ? 0.42 : 0.95);
      g.fillRoundedRect(x - 15, y - 15, 30, 30, 3);
      g.strokeRoundedRect(x - 15, y - 15, 30, 30, 3);
      g.fillStyle(inner, collected ? 0.3 : 0.85);
      g.fillRoundedRect(x - 7, y - 7, 14, 14, 2);
      for (let i = -1; i <= 1; i++) {
        g.lineStyle(1.5, col, collected ? 0.25 : 0.7);
        g.lineBetween(x - 20, y + i * 8, x - 15, y + i * 8);
        g.lineBetween(x + 15, y + i * 8, x + 20, y + i * 8);
        g.lineBetween(x + i * 8, y - 20, x + i * 8, y - 15);
        g.lineBetween(x + i * 8, y + 15, x + i * 8, y + 20);
      }
    } else {
      g.lineStyle(3, col, collected ? 0.5 : 1);
      g.fillStyle(col, collected ? 0.06 : 0.28);
      g.fillCircle(x, y, 17);
      g.strokeCircle(x, y, 17);
      g.fillStyle(inner, collected ? 0.3 : 0.95);
      g.fillCircle(x, y, 7);
      g.lineStyle(2.5, inner, collected ? 0.25 : 0.95);
      g.lineBetween(x, y - 17, x, y - 28);
      g.lineBetween(x - 11, y - 24, x + 11, y - 24);
      g.fillStyle(col, collected ? 0.25 : 0.9);
      g.fillCircle(x - 11, y - 24, 3);
      g.fillCircle(x + 11, y - 24, 3);
      g.lineStyle(2, col, collected ? 0.25 : 0.75);
      g.strokeCircle(x, y, 24);
      g.lineStyle(1, 0xffffff, collected ? 0.12 : 0.45);
      g.lineBetween(x - 9, y + 5, x + 7, y - 7);
    }
  }

  createStation() {
    const { W, H } = this;
    const cx = W / 2, cy = H / 2;
    const sg = this.add.graphics().setDepth(5);
    sg.lineStyle(2, 0x55e6ff, 0.55);
    sg.fillStyle(0x10242c, 0.88);
    this.drawHex(sg, cx, cy, 56);
    sg.lineStyle(1, 0xffffff, 0.16);
    this.drawHex(sg, cx, cy, 45);

    this.stationRingG = this.add.graphics().setDepth(7);
    this.stationRingAngle = 0;
    this.stationIcon = this.add.text(cx, cy, 'G', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '30px',
      color: '#8ff2ff',
      fontStyle: '900'
    }).setOrigin(0.5).setAlpha(0.45).setDepth(8);

    this.stationLbl = this.add.text(cx, cy + 64, '[0/3] 발생기 안정화', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#0b3540',
      fontStyle: '700',
      backgroundColor: '#e8fbff',
      padding: { x: 7, y: 3 }
    }).setOrigin(0.5).setDepth(8);

    this.stationGlow = this.add.circle(cx, cy, 54, 0x45e8ff, 0.08)
      .setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.stationGlow,
      alpha: { from: 0.08, to: 0.24 },
      yoyo: true,
      repeat: -1,
      duration: 1400
    });
  }

  drawHex(g, cx, cy, r) {
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      if (i === 0) g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  createPlayer() {
    const { W, H } = this;
    this.player = this.physics.add.sprite(W / 2, H - 110, 'simul-zone1');
    const img = this.textures.get('simul-zone1').getSourceImage();
    const sc = Math.min(96 / img.width, 80 / img.height);
    this.player.setScale(sc).setDepth(14).setCollideWorldBounds(true);
    this.player.body.setSize(36, 50);

    this.pglow = this.add.circle(W / 2, H - 110, 42, 0x4ab8ff, 0.16)
      .setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
    this.pname = this.add.text(W / 2, H - 63, '시물이', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px',
      color: '#0f2530',
      fontStyle: '700',
      backgroundColor: '#eef7fb',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(15);

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.obstacles);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER');
  }

  createHUD() {
    const { W, H } = this;
    const hg = this.add.graphics().setDepth(22);
    hg.fillStyle(0x071218, 0.94);
    hg.fillRoundedRect(W - 198, 60, 190, 86, 6);
    hg.lineStyle(1, 0x52dfff, 0.55);
    hg.strokeRoundedRect(W - 198, 60, 190, 86, 6);
    for (let y = 70; y < 140; y += 8) {
      hg.lineStyle(1, 0x52dfff, 0.1);
      hg.lineBetween(W - 190, y, W - 14, y);
    }

    this.add.text(W - 102, 67, 'GRAVITY FIELD', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px',
      color: '#80eeff',
      fontStyle: '700'
    }).setOrigin(0.5, 0).setDepth(23);

    this.compassG = this.add.graphics().setDepth(23);
    this.drawCompass();

    this.cdText = this.add.text(W - 30, 72, '8.0s', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '20px',
      color: '#98f7ff',
      fontStyle: '900'
    }).setOrigin(1, 0).setDepth(24);

    this.nextText = this.add.text(W - 30, 99, '다음: 위', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px',
      color: '#ffc857',
      fontStyle: '700'
    }).setOrigin(1, 0).setDepth(24);

    const itemPanelX = this.WALL + 8;
    const itemPanelY = H - this.WALL - 58;
    const ig = this.add.graphics().setDepth(22);
    ig.fillStyle(0x071218, 0.94);
    ig.fillRoundedRect(itemPanelX, itemPanelY, 164, 44, 6);
    ig.lineStyle(1, 0xffc857, 0.45);
    ig.strokeRoundedRect(itemPanelX, itemPanelY, 164, 44, 6);
    ig.fillStyle(0xffc857, 0.75);
    ig.fillCircle(itemPanelX + 18, itemPanelY + 22, 4);

    this.itemsText = this.add.text(itemPanelX + 34, itemPanelY + 14, '부품 0 / 3', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '14px',
      color: '#ffdc7c',
      fontStyle: '700'
    }).setDepth(23);

    this.dlgBg = this.add.rectangle(W / 2, H - 6, W - 100, 76, 0x071218, 0.94)
      .setOrigin(0.5, 1).setDepth(20).setStrokeStyle(1, 0x52dfff, 0.45).setVisible(false);
    this.dlgSpk = this.add.text(70, H - 70, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px',
      color: '#80eeff',
      fontStyle: '900'
    }).setDepth(21).setVisible(false);
    this.dlgTxt = this.add.text(70, H - 54, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px',
      color: '#d7eef3',
      wordWrap: { width: W - 150 }
    }).setDepth(21).setVisible(false);
  }

  drawCompass() {
    const { W } = this;
    const cx = W - 150, cy = 103;
    const g = this.compassG;
    g.clear();
    g.fillStyle(0x0c1b22, 1);
    g.fillCircle(cx, cy, 21);
    g.lineStyle(1, 0x52dfff, 0.45);
    g.strokeCircle(cx, cy, 21);

    [0, 90, 180, 270].forEach(deg => {
      const r = Phaser.Math.DegToRad(deg);
      g.lineStyle(1, 0x52dfff, 0.34);
      g.lineBetween(cx + Math.cos(r) * 14, cy + Math.sin(r) * 14, cx + Math.cos(r) * 19, cy + Math.sin(r) * 19);
    });

    const ar = Phaser.Math.DegToRad(this.gravDirs[this.gravIdx].deg);
    g.lineStyle(2, 0xffc857, 0.95);
    g.lineBetween(cx, cy, cx + Math.cos(ar) * 15, cy + Math.sin(ar) * 15);
    g.fillStyle(0xffc857, 1);
    g.fillCircle(cx + Math.cos(ar) * 15, cy + Math.sin(ar) * 15, 3);
    g.fillStyle(0xaaf9ff, 1);
    g.fillCircle(cx, cy, 3);
  }

  say(speaker, text, dur = 4500) {
    this.dlgSpk.setText(`[ ${speaker} ]`);
    this.dlgTxt.setText(text);
    [this.dlgBg, this.dlgSpk, this.dlgTxt].forEach(o => o.setVisible(true).setAlpha(0));
    this.tweens.add({ targets: [this.dlgBg, this.dlgSpk, this.dlgTxt], alpha: 1, duration: 200 });
    if (this._dlgTm) this._dlgTm.remove();
    this._dlgTm = this.time.delayedCall(dur, () =>
      this.tweens.add({
        targets: [this.dlgBg, this.dlgSpk, this.dlgTxt],
        alpha: 0,
        duration: 300,
        onComplete: () => [this.dlgBg, this.dlgSpk, this.dlgTxt].forEach(o => o.setVisible(false))
      })
    );
  }

  startDebris() {
    const { W, H } = this;
    this.debrisG = this.add.graphics().setDepth(16);
    this.debrisParticles = Array.from({ length: 22 }, () => ({
      x: Phaser.Math.Between(this.WALL + 20, W - this.WALL - 20),
      y: Phaser.Math.Between(this.WALL + 20, H - this.WALL - 20),
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      r: Math.random() * 2.8 + 1.4,
      a: Math.random() * 0.5 + 0.2
    }));
  }

  updateDebris(delta) {
    const { W, H, WALL } = this;
    const dt = delta / 1000;
    const grav = this.gravDirs[this.gravIdx];
    const dg = this.debrisG;
    dg.clear();
    this.debrisParticles.forEach(p => {
      p.vx += grav.x * 28 * dt;
      p.vy += grav.y * 28 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < WALL + 4) { p.x = WALL + 4; p.vx *= -0.5; }
      if (p.x > W - WALL - 4) { p.x = W - WALL - 4; p.vx *= -0.5; }
      if (p.y < WALL + 4) { p.y = WALL + 4; p.vy *= -0.5; }
      if (p.y > H - WALL - 4) { p.y = H - WALL - 4; p.vy *= -0.5; }
      p.vx *= 0.995;
      p.vy *= 0.995;
      dg.fillStyle(0x85eaff, p.a * 0.55);
      dg.fillCircle(p.x, p.y, p.r);
      dg.lineStyle(1, 0xffc857, p.a * 0.32);
      dg.strokeCircle(p.x, p.y, p.r + 1);
    });
  }

  startEmergencyLights() {
    const { W, H, WALL } = this;
    [
      [WALL + 14, WALL + 14],
      [W - WALL - 14, WALL + 14],
      [WALL + 14, H - WALL - 14],
      [W - WALL - 14, H - WALL - 14]
    ].forEach(([ex, ey], i) => {
      const eg = this.add.graphics().setDepth(9);
      eg.fillStyle(0xff5c2a, 0.9);
      eg.fillCircle(ex, ey, 5);
      eg.lineStyle(1, 0xffb14a, 0.7);
      eg.strokeCircle(ex, ey, 8);
      const glow = this.add.circle(ex, ey, 18, 0xff5c2a, 0.25)
        .setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.25, to: 0 },
        yoyo: true,
        repeat: -1,
        duration: 760 + i * 80,
        ease: 'Stepped'
      });
    });
  }

  startArcHazards() {
    const { W, H } = this;
    this.arcG = this.add.graphics().setDepth(15);
    this.arcTimer = 0;
    this.arcHitCooldown = 0;
    this.arcHazards = [
      { x: W * 0.34, y: H * 0.43, r: 42, phase: 0, color: 0x5de6ff },
      { x: W * 0.66, y: H * 0.43, r: 42, phase: 1, color: 0xffb000 },
      { x: W * 0.34, y: H * 0.59, r: 42, phase: 2, color: 0xff2f86 },
      { x: W * 0.66, y: H * 0.59, r: 42, phase: 3, color: 0x8dffbd }
    ];
    this.drawArcHazards();
  }

  startAmbientLabAnimations() {
    const { W, H } = this;
    const leds = [
      [W * 0.20 - 26, H * 0.22 + 12, 0x55ff9a, 0],
      [W * 0.80 - 26, H * 0.23 + 12, 0xffb000, 140],
      [W * 0.20 - 26, H * 0.78 + 12, 0x5de6ff, 280],
      [W * 0.80 - 26, H * 0.78 + 12, 0xff2f86, 420],
      [W * 0.50 - 55, H * 0.29 - 7, 0xffb000, 120],
      [W * 0.50 + 55, H * 0.72 - 10, 0x5de6ff, 360]
    ];

    leds.forEach(([x, y, color, delay]) => {
      const halo = this.add.circle(x, y, 7, color, 0.12)
        .setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
      const dot = this.add.circle(x, y, 2.5, color, 0.82).setDepth(18);
      this.tweens.add({
        targets: [halo, dot],
        alpha: { from: 0.2, to: 0.95 },
        yoyo: true,
        repeat: -1,
        duration: 720,
        delay,
        ease: 'Sine.easeInOut'
      });
    });

    this.scanLine = this.add.rectangle(W / 2, H / 2, 210, 2, 0x5de6ff, 0.16)
      .setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.scanLine,
      y: { from: H / 2 - 88, to: H / 2 + 88 },
      alpha: { from: 0.04, to: 0.22 },
      yoyo: true,
      repeat: -1,
      duration: 2600,
      ease: 'Sine.easeInOut'
    });
  }

  drawArcHazards() {
    if (!this.arcG) return;
    const g = this.arcG;
    g.clear();
    const cycle = Math.floor(this.arcTimer / 1250) % 4;

    this.arcHazards.forEach(arc => {
      const active = arc.phase === cycle;
      const color = active ? arc.color : 0x7a8790;
      const alpha = active ? 0.24 : 0.08;

      g.fillStyle(color, alpha);
      g.fillCircle(arc.x, arc.y, arc.r);
      g.lineStyle(active ? 3 : 1, color, active ? 0.8 : 0.22);
      g.strokeCircle(arc.x, arc.y, arc.r);
      g.lineStyle(1, color, active ? 0.35 : 0.14);
      g.strokeCircle(arc.x, arc.y, arc.r + 10);
      g.fillStyle(color, active ? 0.85 : 0.24);
      g.fillCircle(arc.x, arc.y, active ? 5 : 3);
      if (active) {
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 / 8) * i - this.arcTimer * 0.004;
          g.lineStyle(2, 0xffffff, 0.38);
          g.lineBetween(
            arc.x + Math.cos(a) * (arc.r + 4),
            arc.y + Math.sin(a) * (arc.r + 4),
            arc.x + Math.cos(a) * (arc.r - 10),
            arc.y + Math.sin(a) * (arc.r - 10)
          );
          g.fillStyle(0xffffff, 0.45);
          g.fillCircle(arc.x + Math.cos(a) * (arc.r - 12), arc.y + Math.sin(a) * (arc.r - 12), 2);
        }
      }
    });
  }

  updateArcHazards(delta) {
    if (!this.arcHazards) return;
    this.arcTimer += delta;
    this.arcHitCooldown = Math.max(0, this.arcHitCooldown - delta);
    this.drawArcHazards();

    if (this.arcHitCooldown > 0) return;
    const cycle = Math.floor(this.arcTimer / 1250) % 4;
    const hitArc = this.arcHazards.find(arc =>
      arc.phase === cycle && Phaser.Math.Distance.Between(this.player.x, this.player.y, arc.x, arc.y) < arc.r + 14
    );
    if (!hitArc) return;

    const dx = hitArc.x - this.player.x;
    const dy = hitArc.y - this.player.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.gravVel.x += (dx / len) * 90;
    this.gravVel.y += (dy / len) * 90;
    this.player.body.velocity.x += (dx / len) * 210;
    this.player.body.velocity.y += (dy / len) * 210;
    this.arcHitCooldown = 520;
    this.cancelCoreExtraction(false);
    this.cameras.main.shake(70, 0.003);
    this.cameras.main.flash(90, 90, 200, 255, true);
    this.say('시물이', '국소 중력장에 끌려가고 있어. 중심에 빨려들기 전에 빠져나오자.', 1500);
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    const sx = x1 + dx * t;
    const sy = y1 + dy * t;
    return Phaser.Math.Distance.Between(px, py, sx, sy);
  }

  updateCoreMovement(delta) {
    if (!this.itemObjs) return;

    if (this.collected.size >= 2 && !this.lastCoreMotionStarted) {
      this.lastCoreMotionStarted = true;
      this.itemObjs.forEach(item => {
        if (!item.done) {
          item.moving = true;
          const visual = this.coreVisual(item.id);
          item.outerGlow.setFillStyle(visual.main, Math.min(0.42, visual.glowAlpha + 0.12));
          this.say('시물이', '마지막 코어가 중력장에 반응해서 움직이기 시작했어.', 2200);
        }
      });
    }

    this.itemObjs.forEach(item => {
      if (item.done || !item.moving) return;
      if (this.extracting?.item === item) return;
      item.movePhase += delta * 0.00075;
      const s = Math.sin(item.movePhase);

      if (item.id === 'A') {
        item.x = item.baseX;
        item.y = Phaser.Math.Linear(this.H * 0.36, this.H * 0.66, (s + 1) / 2);
      } else if (item.id === 'B') {
        item.x = Phaser.Math.Linear(this.W * 0.42, this.W * 0.60, (s + 1) / 2);
        item.y = item.baseY;
      } else {
        item.x = item.baseX;
        item.y = Phaser.Math.Linear(this.H * 0.34, this.H * 0.64, (s + 1) / 2);
      }

      this.syncCoreVisual(item);
    });
  }

  syncCoreVisual(item) {
    this.drawCoreItem(item.ig, item.x, item.y, item.id, false);
    item.outerGlow.setPosition(item.x, item.y);
    item.tagBg.setPosition(item.x + item.labelDx, item.y + item.labelDy);
    item.lbl.setPosition(item.x + item.labelDx, item.y + item.labelDy);
  }

  updateCoreExtraction(delta) {
    if (!this.extracting) {
      this.extractG?.clear();
      return;
    }

    const item = this.extracting.item;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
    if (item.done || dist > 62 || !this.canCollectCore(item)) {
      this.cancelCoreExtraction(true);
      return;
    }

    this.extracting.elapsed += delta;
    const p = Phaser.Math.Clamp(this.extracting.elapsed / this.extractDuration, 0, 1);
    this.drawCoreExtractionRing(item, p);

    if (p >= 1) {
      this.completeCoreExtraction(item);
    }
  }

  drawCoreExtractionRing(item, progress) {
    const visual = this.coreVisual(item.id);
    const g = this.extractG;
    g.clear();
    g.lineStyle(5, 0x081218, 0.72);
    g.strokeCircle(item.x, item.y, 36);
    g.lineStyle(4, visual.main, 0.95);
    g.beginPath();
    g.arc(item.x, item.y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
    g.strokePath();
    g.fillStyle(visual.main, 0.18);
    g.fillCircle(item.x, item.y, 30 + Math.sin(progress * Math.PI) * 4);
  }

  startCoreExtraction(item) {
    if (this.extracting?.item === item) return;
    this.extracting = { item, elapsed: 0 };
    this.cameras.main.shake(60, 0.002);
    this.say('시물이', `${item.name} 분리 중... 가까이 붙어서 버텨!`, 1600);
  }

  cancelCoreExtraction(showFeedback = false) {
    if (!this.extracting) return;
    this.extractG?.clear();
    this.extracting = null;
    if (showFeedback) {
      this.cameras.main.shake(80, 0.003);
      this.say('시물이', '분리가 끊겼어. 거리와 중력 방향을 다시 맞춰보자.', 1700);
    }
  }

  completeCoreExtraction(item) {
    this.extractG?.clear();
    this.extracting = null;
    this.collectCore(item);
  }

  update(_, delta) {
    if (this.cleared) return;
    const dt = delta / 1000;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const grav = this.gravDirs[this.gravIdx];
    this.jumpCooldown = Math.max(0, this.jumpCooldown - delta);

    const inputX = (left ? -1 : 0) + (right ? 1 : 0);
    const inputY = (up ? -1 : 0) + (down ? 1 : 0);
    const sideX = -grav.y;
    const sideY = grav.x;
    const sideInput = Phaser.Math.Clamp(inputX * sideX + inputY * sideY, -1, 1);
    const againstInput = Phaser.Math.Clamp(inputX * -grav.x + inputY * -grav.y, 0, 1);
    const withInput = Phaser.Math.Clamp(inputX * grav.x + inputY * grav.y, 0, 1);

    const grounded = this.isTouchingGravitySurface(grav);
    if (grounded && againstInput > 0 && !this.wasAgainstGravity && this.jumpCooldown <= 0) {
      this.gravVel.x = -grav.x * this.jumpImpulse;
      this.gravVel.y = -grav.y * this.jumpImpulse;
      this.jumpCooldown = 520;
    }
    this.wasAgainstGravity = againstInput > 0;

    this.gravVel.x = Phaser.Math.Clamp(this.gravVel.x + grav.x * this.gravSpeed * dt, -this.gravMaxSpeed, this.gravMaxSpeed);
    this.gravVel.y = Phaser.Math.Clamp(this.gravVel.y + grav.y * this.gravSpeed * dt, -this.gravMaxSpeed, this.gravMaxSpeed);
    if ((this.player.body.blocked.left && this.gravVel.x < 0) || (this.player.body.blocked.right && this.gravVel.x > 0)) {
      this.gravVel.x = 0;
    }
    if ((this.player.body.blocked.up && this.gravVel.y < 0) || (this.player.body.blocked.down && this.gravVel.y > 0)) {
      this.gravVel.y = 0;
    }

    const SIDE_SPEED = 255;
    const FALL_PUSH = 70;
    const vx = sideX * sideInput * SIDE_SPEED + grav.x * withInput * FALL_PUSH + this.gravVel.x;
    const vy = sideY * sideInput * SIDE_SPEED + grav.y * withInput * FALL_PUSH + this.gravVel.y;
    this.player.setVelocity(Phaser.Math.Clamp(vx, -470, 470), Phaser.Math.Clamp(vy, -470, 470));
    if (vx > 6) this.player.setFlipX(true);
    else if (vx < -6) this.player.setFlipX(false);

    this.pglow.setPosition(this.player.x, this.player.y);
    this.pname.setPosition(this.player.x, this.player.y + 46);

    if (this.stationRingG) {
      this.stationRingAngle = (this.stationRingAngle + delta * 0.04) % 360;
      const { W, H } = this;
      const cx = W / 2, cy = H / 2;
      this.stationRingG.clear();
      this.stationRingG.lineStyle(1, 0x55e6ff, 0.35);
      for (let i = 0; i < 6; i++) {
        const a = Phaser.Math.DegToRad(this.stationRingAngle + i * 60);
        this.stationRingG.lineBetween(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38, cx + Math.cos(a) * 50, cy + Math.sin(a) * 50);
      }
    }

    this.updateDebris(delta);
    this.updateCoreMovement(delta);
    this.updateCoreExtraction(delta);
    this.updateArcHazards(delta);

    this.gravTimer -= delta;
    if (!this.warned && this.gravTimer <= 2000) {
      this.warned = true;
      const next = (this.gravIdx + 1) % 4;
      this.say('시물이', `중력 전환 2초 전! 다음 방향은 ${this.gravDirs[next].lbl}이야.`);
      this.cameras.main.shake(80, 0.004);
      this.nextText.setStyle({ color: '#ff5c2a' });
    }
    if (this.gravTimer <= 0) {
      this.gravIdx = (this.gravIdx + 1) % 4;
      this.gravTimer = 8000;
      this.warned = false;
      this.gravVel.x = 0;
      this.gravVel.y = 0;
      this.wasAgainstGravity = false;
      this.jumpCooldown = 0;
      this.cameras.main.flash(240, 80, 210, 255, true);
      this.nextText.setStyle({ color: '#ffc857' });
      this.updateGravMarkers();
      this.drawCompass();
      this.drawFieldGrid();
    }

    const secs = Math.max(0, this.gravTimer / 1000);
    this.cdText.setText(`${secs.toFixed(1)}s`);
    this.nextText.setText(`다음: ${this.gravDirs[(this.gravIdx + 1) % 4].lbl}`);

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
      this.tryInteract();
    }
  }

  isTouchingGravitySurface(grav) {
    if (grav.x > 0) return this.player.body.blocked.right || this.player.body.touching.right;
    if (grav.x < 0) return this.player.body.blocked.left || this.player.body.touching.left;
    if (grav.y > 0) return this.player.body.blocked.down || this.player.body.touching.down;
    return this.player.body.blocked.up || this.player.body.touching.up;
  }

  tryInteract() {
    this.itemObjs.forEach(item => {
      if (item.done) return;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 56) {
        if (!this.canCollectCore(item)) {
          this.say('시물이', `${item.name}이 아직 고정돼 있어. 중력 방향을 바꿔서 다시 시도해보자.`, 2200);
          this.cameras.main.shake(80, 0.003);
          return;
        }
        this.startCoreExtraction(item);
      }
    });

    if (this.collected.size === 3) {
      const { W, H } = this;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, W / 2, H / 2) < 62) {
        this.doClear();
      }
    }
  }

  canCollectCore(item) {
    const required = { A: 3, B: 1, C: 2 };
    return this.gravIdx === required[item.id];
  }

  collectCore(item) {
    if (item.done) return;
    item.done = true;
    item.moving = false;
    item.tagBg.destroy();
    item.lbl.destroy();
    item.outerGlow.destroy();
    this.drawCoreItem(item.ig, item.x, item.y, item.id, true);
    this.collected.add(item.id);
    const n = this.collected.size;
    const visual = this.coreVisual(item.id);

    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 / 10) * i;
      const spark = this.add.circle(item.x + Math.cos(a) * 28, item.y + Math.sin(a) * 28, 3, visual.main, 0.9)
        .setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: spark, x: item.x, y: item.y, alpha: 0, duration: 380, onComplete: () => spark.destroy() });
    }
    const flash = this.add.circle(item.x, item.y, 32, visual.main, 0.58).setDepth(17);
    this.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 460, onComplete: () => flash.destroy() });

    this.itemsText.setText(`부품 ${n} / 3`);
    this.stationLbl.setText(`[${n}/3] 발생기 안정화`);
    if (n === 3) {
      this.say('시물이', '부품을 모두 확보했어! 중앙 중력장 발생기에서 SPACE를 눌러 안정화하자.', 5000);
      this.stationIcon.setAlpha(1);
      this.stationGlow.setFillStyle(0x80fff0, 0.3);
    } else {
      this.say('시물이', `${item.name} 확보! ${3 - n}개 더 필요해.`);
    }
  }

  doClear() {
    this.cleared = true;
    this.player.setVelocity(0, 0);

    this.tweens.add({ targets: this.stationIcon, angle: 720, duration: 1400, ease: 'Power3.easeOut' });
    this.tweens.add({ targets: this.stationGlow, scale: 3, alpha: 0, duration: 1400 });
    this.cameras.main.flash(800, 190, 255, 255);
    this.debrisParticles.forEach(p => { p.vx = 0; p.vy = 0; });

    this.say('시물이', '중력 벡터 정상화 완료! 실험실이 다시 안정됐어. 오늘의 물리 실험은 꽤 실전적이었네.', 4500);
    this.time.delayedCall(5200, () => {
      this.cameras.main.fadeOut(700);
      this.time.delayedCall(720, () => {
        hubController.anomalyCleared('orbit-raise');
        this.scene.stop();
        this.scene.resume('HubScene');
      });
    });
  }
}
