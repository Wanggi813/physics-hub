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
    this.slotValues = [0, 0, 0, 0]; // 0=N, 1=S
    this.CORRECT    = [0, 1, 0, 1]; // N-S-N-S (메모에 힌트 표시)
    this.panelOpen  = false;

    this.cameras.main.setBackgroundColor('#0c1210');
    this.cameras.main.fadeIn(500);

    this.drawRoom();
    this.createWalls();
    this.createHazardZones();
    this.createItems();
    this.createPanel();
    this.createPlayer();
    this.createControls();
    this.createHUD();

    this.time.delayedCall(700, () =>
      this.say('테슬', '전자기장 패턴이 4초마다 바뀌어! 미니맵으로 다음 패턴 예고해줄게. SPACE로 아이템 수집·배전반 조작.')
    );
  }

  // ─── 방 드로잉 ───────────────────────────────────────────
  drawRoom() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(0);

    // 바닥
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

    // 벽
    g.fillStyle(0x1e2c1e, 1);
    g.fillRect(0, 0, W, 56);
    g.fillRect(0, H - 56, W, 56);
    g.fillRect(0, 0, 56, H);
    g.fillRect(W - 56, 0, 56, H);

    // 경고 스트라이프
    for (let i = 0; i < 12; i++) {
      const x = 56 + i * (W - 112) / 12;
      g.fillStyle(i % 2 === 0 ? 0x1e2c1e : 0x243024, 1);
      g.fillRect(x, 0, (W - 112) / 12, 56);
      g.fillRect(x, H - 56, (W - 112) / 12, 56);
    }

    // 전자칠판 (위 중앙)
    g.fillStyle(0x0e180e, 1);
    g.fillRoundedRect(W / 2 - 140, 6, 280, 44, 4);
    g.lineStyle(2, 0x50ff80, 0.6);
    g.strokeRoundedRect(W / 2 - 140, 6, 280, 44, 4);
    this.add.text(W / 2, 28, '테슬 · 전자기 분석 시스템', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#70ff90', fontStyle: '700'
    }).setOrigin(0.5).setDepth(1);

    // 작업대 (안전 섬)
    const tg = this.add.graphics().setDepth(2);
    tg.fillStyle(0x283828, 1);
    this.tableRects().forEach(({ x, y, w, h }) => {
      tg.fillRoundedRect(x, y, w, h, 4);
      tg.lineStyle(2, 0x3a5a3a, 0.8);
      tg.strokeRoundedRect(x, y, w, h, 4);
    });

    // 배전반 (위 좌측)
    g.fillStyle(0x1a2c1a, 1);
    g.fillRoundedRect(66, 66, 160, 90, 6);
    g.lineStyle(2, 0x50ff80, 0.5);
    g.strokeRoundedRect(66, 66, 160, 90, 6);
    this.add.text(146, 76, '배전반', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#70ff90', fontStyle: '700'
    }).setOrigin(0.5).setDepth(3);

    // 메모 (오른쪽 벽)
    const mg = this.add.graphics().setDepth(3);
    mg.fillStyle(0xf0ffe0, 0.92);
    mg.fillRect(W - 168, H * 0.35, 108, 92);
    mg.lineStyle(1, 0x80a060, 0.5);
    mg.strokeRect(W - 168, H * 0.35, 108, 92);
    this.add.text(W - 162, H * 0.35 + 6,
      '유도 전류 방향\nA슬롯: N\nB슬롯: S\nC슬롯: N\nD슬롯: S',
      { fontFamily: 'Pretendard, Malgun Gothic, sans-serif', fontSize: '10px', color: '#203010' }
    ).setDepth(4);
  }

  tableRects() {
    const { W, H } = this;
    return [
      { x: W * 0.36 - 55, y: H * 0.3 - 22,  w: 110, h: 44 },
      { x: W * 0.64 - 55, y: H * 0.3 - 22,  w: 110, h: 44 },
      { x: W * 0.36 - 55, y: H * 0.7 - 22,  w: 110, h: 44 },
      { x: W * 0.64 - 55, y: H * 0.7 - 22,  w: 110, h: 44 },
    ];
  }

  // ─── 벽 + 작업대 물리 ─────────────────────────────────────
  createWalls() {
    const { W, H } = this;
    this.walls = this.physics.add.staticGroup();
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

  // ─── 위험 구역 ───────────────────────────────────────────
  createHazardZones() {
    const { W, H } = this;
    // 6개 구역 정의 (중심 좌표)
    this.zoneDefs = [
      { x: W * 0.25, y: H * 0.5  },
      { x: W * 0.5,  y: H * 0.22 },
      { x: W * 0.75, y: H * 0.5  },
      { x: W * 0.5,  y: H * 0.78 },
      { x: W * 0.35, y: H * 0.5  },
      { x: W * 0.65, y: H * 0.5  },
    ];

    // 타입: 0=PULL(인력) 1=PUSH(척력) 2=ARC(감전)
    this.zoneTypes = [0, 1, 2, 0, 1, 2];
    this.zoneGraphics = this.zoneDefs.map((def, i) => {
      const g = this.add.graphics().setDepth(5);
      this.drawHazardZone(g, def, this.zoneTypes[i]);
      return g;
    });

    // 예고 그래픽 (미니맵 형태 — 우하단)
    this.previewG = this.add.graphics().setDepth(22);
    this.updatePreview();

    // 4초 주기 재배치
    this.time.addEvent({
      delay: 4000, loop: true,
      callback: () => {
        this.reshuffleZones();
        this.say('테슬', '전자기장 패턴 변경!');
        this.cameras.main.shake(60, 0.003);
      }
    });
  }

  drawHazardZone(g, def, type) {
    const colors  = [0x4080ff, 0xff4040, 0xffff20];
    const alphas  = [0.18, 0.18, 0.22];
    const strokes = [0x6090ff, 0xff6060, 0xffff60];
    const r = 58;
    g.clear();
    g.fillStyle(colors[type], alphas[type]);
    g.fillCircle(def.x, def.y, r);
    g.lineStyle(2, strokes[type], 0.7);
    g.strokeCircle(def.x, def.y, r);

    // 중심 아이콘
    g.lineStyle(2, strokes[type], 0.9);
    if (type === 0) {
      // PULL: 안으로 향하는 화살표
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 2;
        g.lineBetween(
          def.x + Math.cos(rad) * 36, def.y + Math.sin(rad) * 36,
          def.x + Math.cos(rad) * 16, def.y + Math.sin(rad) * 16
        );
      }
    } else if (type === 1) {
      // PUSH: 밖으로 향하는 화살표
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 2;
        g.lineBetween(
          def.x + Math.cos(rad) * 16, def.y + Math.sin(rad) * 16,
          def.x + Math.cos(rad) * 36, def.y + Math.sin(rad) * 36
        );
      }
    } else {
      // ARC: 번개 기호
      g.lineStyle(3, 0xffff60, 0.9);
      g.beginPath();
      g.moveTo(def.x + 6, def.y - 20);
      g.lineTo(def.x - 4, def.y);
      g.lineTo(def.x + 6, def.y);
      g.lineTo(def.x - 6, def.y + 20);
      g.strokePath();
    }
  }

  reshuffleZones() {
    // 타입을 순환 이동
    this.zoneTypes.push(this.zoneTypes.shift());
    this.zoneGraphics.forEach((g, i) => this.drawHazardZone(g, this.zoneDefs[i], this.zoneTypes[i]));
    this.updatePreview();
    this.zoneTimer = 4000;
  }

  updatePreview() {
    const { W, H } = this;
    const g = this.previewG;
    g.clear();

    const px = W - 10, py = H - 10;
    const pw = 150, ph = 90, scale = 0.18;

    g.fillStyle(0x080e08, 0.85);
    g.fillRoundedRect(px - pw, py - ph, pw, ph, 4);
    g.lineStyle(1, 0x30e060, 0.4);
    g.strokeRoundedRect(px - pw, py - ph, pw, ph, 4);

    this.add.text(px - pw / 2, py - ph + 6, '다음 패턴', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px', color: '#50c070', fontStyle: '700'
    }).setOrigin(0.5, 0).setDepth(23);

    const nextTypes = [...this.zoneTypes.slice(1), this.zoneTypes[0]];
    const colors = [0x6090ff, 0xff6060, 0xffff60];
    this.zoneDefs.forEach((def, i) => {
      const mx = px - pw + (def.x / W) * pw;
      const my = py - ph + (def.y / H) * ph;
      g.fillStyle(colors[nextTypes[i]], 0.8);
      g.fillCircle(mx, my, 6);
    });
  }

  // ─── 아이템 ──────────────────────────────────────────────
  createItems() {
    const { W, H } = this;
    this.itemObjs = [
      { id: 'A', x: W * 0.14,  y: H * 0.75,  name: '회로카드 A' },
      { id: 'B', x: W * 0.5,   y: H * 0.22,  name: '회로카드 B' },
      { id: 'C', x: W * 0.82,  y: H * 0.78,  name: '회로카드 C' },
      { id: 'D', x: W * 0.22,  y: H * 0.22,  name: '회로카드 D' },
    ].map(def => {
      const glow = this.add.circle(def.x, def.y, 13, 0x60ff90, 0.75).setDepth(8);
      this.tweens.add({
        targets: glow, alpha: { from: 0.75, to: 0.15 },
        scale: { from: 1, to: 1.6 }, yoyo: true, repeat: -1, duration: 860
      });
      const lbl = this.add.text(def.x, def.y - 22, def.name, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#80ffaa', fontStyle: '700'
      }).setOrigin(0.5).setDepth(9);
      return { ...def, glow, lbl, done: false };
    });
  }

  // ─── 배전반 패널 ─────────────────────────────────────────
  createPanel() {
    this.slotGraphics = [];
    this.slotTexts    = [];
    for (let i = 0; i < 4; i++) {
      const sx = 78 + i * 36;
      const sy = 102;
      const sg = this.add.graphics().setDepth(10);
      const st = this.add.text(sx, sy, 'N', {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '13px', color: '#60ff90', fontStyle: '900'
      }).setOrigin(0.5).setDepth(11);
      this.slotGraphics.push(sg);
      this.slotTexts.push(st);
      this.redrawSlot(i);
    }
    this.panelLbl = this.add.text(146, 148, '카드 0/4 · SPACE 조작', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '10px', color: '#50c070', fontStyle: '700'
    }).setOrigin(0.5).setDepth(11);
  }

  redrawSlot(i) {
    const sx = 78 + i * 36;
    const sy = 102;
    const isN = this.slotValues[i] === 0;
    const sg  = this.slotGraphics[i];
    sg.clear();
    sg.fillStyle(isN ? 0x2050a0 : 0xa02020, 0.8);
    sg.fillRoundedRect(sx - 14, sy - 14, 28, 28, 4);
    sg.lineStyle(1, isN ? 0x80c0ff : 0xff8080, 0.7);
    sg.strokeRoundedRect(sx - 14, sy - 14, 28, 28, 4);
    this.slotTexts[i].setText(isN ? 'N' : 'S');
    this.slotTexts[i].setColor(isN ? '#80c0ff' : '#ff8080');
  }

  // ─── 플레이어 ─────────────────────────────────────────────
  createPlayer() {
    const { W, H } = this;
    this.player = this.physics.add.sprite(W / 2, H / 2, 'simul-zone3');
    const img = this.textures.get('simul-zone3').getSourceImage();
    const sc = Math.min(96 / img.width, 80 / img.height);
    this.player.setScale(sc).setDepth(15).setCollideWorldBounds(true);
    this.player.body.setSize(38, 52);

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.tables);

    this.pglow = this.add.circle(W / 2, H / 2, 38, 0x4ab8ff, 0.15)
      .setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
    this.pname = this.add.text(W / 2, H / 2 + 44, '시물이', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#c8e0ff', fontStyle: '700'
    }).setOrigin(0.5).setDepth(16);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER');
  }

  // ─── HUD ──────────────────────────────────────────────────
  createHUD() {
    const { W, H } = this;
    this.hudBg = this.add.rectangle(W - 8, 58, 196, 64, 0x080e08, 0.92)
      .setOrigin(1, 0).setDepth(20).setStrokeStyle(1, 0x40e060, 0.5);
    this.itemsTxt = this.add.text(W - 18, 64, '카드  0 / 4', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '14px', color: '#80ffaa', fontStyle: '700'
    }).setOrigin(1, 0).setDepth(21);
    this.zoneTxt = this.add.text(W - 18, 90, '구역 재배치: 4.0s', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#60c080', fontStyle: '700'
    }).setOrigin(1, 0).setDepth(21);

    this.dlgBg  = this.add.rectangle(W / 2, H - 8, W - 80, 74, 0x080e08, 0.92)
      .setOrigin(0.5, 1).setDepth(20).setStrokeStyle(1, 0x40e060, 0.4).setVisible(false);
    this.dlgSpk = this.add.text(62, H - 72, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#60e080', fontStyle: '900'
    }).setDepth(21).setVisible(false);
    this.dlgTxt = this.add.text(62, H - 56, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#c8e8d0', wordWrap: { width: W - 130 }
    }).setDepth(21).setVisible(false);
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

  // ─── 업데이트 ─────────────────────────────────────────────
  update(_, delta) {
    if (this.cleared) return;

    this.applyHazardEffects();

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

    this.pglow.setPosition(this.player.x, this.player.y);
    this.pname.setPosition(this.player.x, this.player.y + 46);

    this.zoneTimer -= delta;
    this.zoneTxt.setText(`구역 재배치: ${Math.max(0, this.zoneTimer / 1000).toFixed(1)}s`);
    if (this.zoneTimer <= 0) this.zoneTimer = 4000;

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
      this.tryInteract();
    }
  }

  applyHazardEffects() {
    if (this.stunned) return;
    const PULL_F = 2.8, PUSH_F = 3.0;
    this.zoneDefs.forEach((def, i) => {
      const dx = this.player.x - def.x;
      const dy = this.player.y - def.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 58) return;

      const type = this.zoneTypes[i];
      if (type === 0) {
        // PULL
        this.player.body.velocity.x -= (dx / dist) * PULL_F * dist;
        this.player.body.velocity.y -= (dy / dist) * PULL_F * dist;
      } else if (type === 1) {
        // PUSH
        this.player.body.velocity.x += (dx / dist) * PUSH_F * dist;
        this.player.body.velocity.y += (dy / dist) * PUSH_F * dist;
      } else {
        // ARC: 스턴
        this.triggerStun(def);
      }
    });
  }

  triggerStun(zoneDef) {
    if (this.stunned) return;
    this.stunned = true;
    this.cameras.main.flash(220, 255, 240, 60, true);
    this.cameras.main.shake(180, 0.012);

    // 플레이어를 구역 중심 반대 방향으로 튕겨냄
    const dx = this.player.x - zoneDef.x;
    const dy = this.player.y - zoneDef.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.player.setVelocity((dx / len) * 380, (dy / len) * 380);

    this.say('테슬', '아크 구역에 닿았어! 0.8초 스턴.');
    this.time.delayedCall(800, () => {
      this.stunned = false;
      this.player.setVelocity(0, 0);
    });
  }

  tryInteract() {
    const px = this.player.x, py = this.player.y;

    // 아이템 수집
    this.itemObjs.forEach(item => {
      if (item.done) return;
      if (Phaser.Math.Distance.Between(px, py, item.x, item.y) < 56) {
        item.done = true;
        item.glow.destroy(); item.lbl.destroy();
        this.collected.add(item.id);
        const n = this.collected.size;
        const flash = this.add.circle(item.x, item.y, 26, 0x60ff90, 0.8).setDepth(20);
        this.tweens.add({ targets: flash, scale: 3.5, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
        this.itemsTxt.setText(`카드  ${n} / 4`);
        this.panelLbl.setText(`카드 ${n}/4 · SPACE 조작`);
        if (n === 4) {
          this.say('테슬', '카드 4장 모두 확보! 배전반에서 슬롯 설정하고 SPACE!', 5000);
        } else {
          this.say('테슬', `${item.name} 수집! ${4 - n}개 남았어.`);
        }
      }
    });

    // 배전반 조작 (카드 보유 시)
    if (this.collected.size === 4) {
      const panelCx = 146, panelCy = 111;
      if (Phaser.Math.Distance.Between(px, py, panelCx, panelCy) < 80) {
        if (!this.panelOpen) {
          this.panelOpen = true;
          this.say('테슬', '슬롯을 SPACE로 눌러서 N/S 설정해. 벽 메모를 참고해!', 6000);
        } else {
          this.cycleNearestSlot(px, py);
        }
      }
    }
  }

  cycleNearestSlot(px, py) {
    let nearest = -1, minDist = 999;
    for (let i = 0; i < 4; i++) {
      const sx = 78 + i * 36, sy = 102;
      const d = Phaser.Math.Distance.Between(px, py, sx, sy);
      if (d < minDist) { minDist = d; nearest = i; }
    }
    if (nearest < 0 || minDist > 80) return;
    this.slotValues[nearest] = 1 - this.slotValues[nearest];
    this.redrawSlot(nearest);
    this.say('테슬', `슬롯 ${['A','B','C','D'][nearest]} → ${this.slotValues[nearest] === 0 ? 'N' : 'S'}`);
    this.checkPanelSolution();
  }

  checkPanelSolution() {
    const correct = this.slotValues.every((v, i) => v === this.CORRECT[i]);
    if (correct) this.doClear();
    else {
      // 오답: 아크 경고
      this.cameras.main.flash(150, 255, 40, 40, true);
      if (this.slotValues.filter((v, i) => v === this.CORRECT[i]).length >= 3) {
        this.say('테슬', '거의 다 왔어! 한 슬롯만 틀렸어.');
      }
    }
  }

  doClear() {
    this.cleared = true;
    this.player.setVelocity(0, 0);

    // 구역 소등
    this.zoneGraphics.forEach((g, i) => {
      this.tweens.add({ targets: g, alpha: 0, duration: 600, delay: i * 80 });
    });
    this.cameras.main.flash(800, 80, 255, 140);

    this.say('테슬', '수식은 예측이고, 실험은 진실이야. 오늘 네가 직접 증명했어.', 4500);
    this.time.delayedCall(5200, () => {
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(620, () => {
        hubController.anomalyCleared('electromagnetic-induction');
        this.scene.stop();
        this.scene.resume('HubScene');
      });
    });
  }
}
