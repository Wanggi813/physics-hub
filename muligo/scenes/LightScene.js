class LightScene extends Phaser.Scene {
  constructor() {
    super('LightScene');
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.collected  = new Set();
    this.cleared    = false;
    this.sonarUses  = 5;
    this.sonarCd    = 0;
    // 거울 0: 좌측 중간, 거울 1: 우측 하단
    this.mirrorAngles = [0, 0]; // 0=0° 1=45° 2=90° 3=135°
    // 암흑 구역 조명 여부 (거울 정답 각도: mirrorAngles[0]===2, [1]===1)
    this.zoneIllum  = [false, false];

    this.cameras.main.setBackgroundColor('#0c0a08');
    this.cameras.main.fadeIn(500);

    this.drawRoom();
    this.createZoneOverlays();
    this.createMirrors();
    this.createItems();
    this.createStation();
    this.createPlayer();
    this.createControls();
    this.createHUD();

    this.time.delayedCall(700, () =>
      this.say('리플', '빛의 굴절이 붕괴됐어. SPACE로 거울 각도 조정, F키로 소나 사용 가능 (5회). 렌즈 조각 5개를 모아봐.')
    );
  }

  // ─── 방 드로잉 ───────────────────────────────────────────
  drawRoom() {
    const { W, H } = this;
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(0x1a1410, 1);
    g.fillRect(0, 0, W, H);

    // 벽
    g.fillStyle(0x2e2018, 1);
    g.fillRect(0, 0, W, 56);
    g.fillRect(0, H - 56, W, 56);
    g.fillRect(0, 0, 56, H);
    g.fillRect(W - 56, 0, 56, H);

    // 창문 (위 우측 — 빛 입사원)
    g.fillStyle(0x8ecce0, 0.85);
    g.fillRoundedRect(W - 180, 8, 120, 42, 4);
    g.lineStyle(3, 0xc8f0ff, 0.7);
    g.strokeRoundedRect(W - 180, 8, 120, 42, 4);
    g.lineStyle(2, 0xffffff, 0.4);
    g.lineBetween(W - 120, 8, W - 120, 50);
    this.add.text(W - 120, 29, '창문', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#a0d8f0', fontStyle: '700'
    }).setOrigin(0.5).setDepth(1);

    // 전자칠판 (위 좌측)
    g.fillStyle(0x0e1a14, 1);
    g.fillRoundedRect(66, 8, 240, 44, 4);
    g.lineStyle(2, 0x70b0ff, 0.6);
    g.strokeRoundedRect(66, 8, 240, 44, 4);
    this.add.text(186, 30, '리플 · 파동 분석 시스템', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#80c0ff', fontStyle: '700'
    }).setOrigin(0.5).setDepth(1);

    // 책장들
    const bg = this.add.graphics().setDepth(2);
    bg.fillStyle(0x3c2c1c, 1);
    this.shelfRects().forEach(({ x, y, w, h }) => {
      bg.fillRect(x, y, w, h);
      bg.lineStyle(1, 0x5a3e28, 0.5);
      bg.strokeRect(x, y, w, h);
      for (let i = 1; i < 3; i++) bg.lineBetween(x, y + h * i / 3, x + w, y + h * i / 3);
    });

    // 메모 (왼쪽 벽)
    const mg = this.add.graphics().setDepth(3);
    mg.fillStyle(0xfff8e0, 0.92);
    mg.fillRect(68, H * 0.6, 100, 80);
    mg.lineStyle(1, 0xb09060, 0.5);
    mg.strokeRect(68, H * 0.6, 100, 80);
    this.add.text(74, H * 0.6 + 6,
      '렌즈 위치\n①② 백색구역\n③ 우상 암흑\n④⑤ 좌상 암흑\n거울로 빛길 만들기',
      { fontFamily: 'Pretendard, Malgun Gothic, sans-serif', fontSize: '10px', color: '#3a2010' }
    ).setDepth(4);

    // 프리즘 거치대 표시
    g.lineStyle(2, 0x80b0ff, 0.5);
    g.strokeRoundedRect(W / 2 - 60, H - 90, 120, 34, 4);
  }

  shelfRects() {
    const { W, H } = this;
    return [
      { x: 56,         y: 56,         w: W * 0.2,  h: H * 0.38 }, // 좌상 암흑 영역 책장
      { x: W * 0.75,   y: 56,         w: W * 0.19, h: H * 0.38 }, // 우상 암흑 영역 책장
      { x: 56,         y: H * 0.52,   w: W * 0.35, h: H * 0.2  }, // 좌하 책장 (정상)
      { x: W * 0.64,   y: H * 0.52,   w: W * 0.3,  h: H * 0.2  }, // 우하 책장 (정상)
    ];
  }

  // ─── 구역 오버레이 ────────────────────────────────────────
  createZoneOverlays() {
    const { W, H } = this;

    // 백색 구역 (중앙 하단) — 눈부심
    this.whiteOverlay = this.add.rectangle(W * 0.5, H * 0.65, W * 0.55, H * 0.28, 0xffffff, 0.22)
      .setDepth(30).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.whiteOverlay, alpha: { from: 0.18, to: 0.28 }, yoyo: true, repeat: -1, duration: 1200
    });

    // 암흑 구역 1 (좌상) — 좌상 책장 위치
    this.darkZone1 = this.add.rectangle(
      56 + W * 0.1, 56 + H * 0.19, W * 0.2, H * 0.38, 0x000000, 0.9
    ).setDepth(31);

    // 암흑 구역 2 (우상) — 우상 책장 위치
    this.darkZone2 = this.add.rectangle(
      W * 0.845, 56 + H * 0.19, W * 0.19, H * 0.38, 0x000000, 0.9
    ).setDepth(31);

    // 소나 범위 표시 원 (비활성)
    this.sonarRing = this.add.circle(0, 0, 120, 0x80b0ff, 0)
      .setDepth(32).setStrokeStyle(2, 0x80b0ff, 0.7);
  }

  // ─── 거울 ─────────────────────────────────────────────────
  createMirrors() {
    const { W, H } = this;
    const mirrorDefs = [
      { x: W * 0.42, y: H * 0.45 },  // 거울 0
      { x: W * 0.62, y: H * 0.45 },  // 거울 1
    ];
    this.mirrors = mirrorDefs.map((def, i) => {
      const mg = this.add.graphics().setDepth(8);
      const lbl = this.add.text(def.x, def.y + 24, `거울 ${i + 1}  [0°]`, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '10px', color: '#a0c0e0', fontStyle: '700'
      }).setOrigin(0.5).setDepth(9);
      const zone = this.add.zone(def.x, def.y, 52, 52).setDepth(9);
      this.drawMirror(mg, def.x, def.y, 0);
      return { ...def, g: mg, lbl, zone, idx: i };
    });

    // 광선 그래픽
    this.beamG = this.add.graphics().setDepth(7);
    this.updateBeams();
  }

  drawMirror(g, x, y, angleIdx) {
    const angleDeg = angleIdx * 45;
    const rad = Phaser.Math.DegToRad(angleDeg);
    g.clear();
    g.lineStyle(4, 0xc8e8ff, 0.9);
    const len = 22;
    g.lineBetween(
      x - Math.cos(rad) * len, y - Math.sin(rad) * len,
      x + Math.cos(rad) * len, y + Math.sin(rad) * len
    );
    g.lineStyle(8, 0x6090c0, 0.3);
    g.lineBetween(
      x - Math.cos(rad) * len, y - Math.sin(rad) * len,
      x + Math.cos(rad) * len, y + Math.sin(rad) * len
    );
  }

  updateBeams() {
    const { W, H } = this;
    const g = this.beamG;
    g.clear();

    // 창문에서 내려오는 광선
    const winX = W - 120, winY = 50;

    this.mirrors.forEach((m, i) => {
      const angle = this.mirrorAngles[i];
      // 거울 0: angle===2(90°)이면 좌상 암흑구역 조명
      // 거울 1: angle===1(45°)이면 우상 암흑구역 조명
      const isCorrect = (i === 0 && angle === 2) || (i === 1 && angle === 1);
      const alpha = isCorrect ? 0.7 : 0.2;

      // 창문 → 거울 광선
      g.lineStyle(2, 0xfff0c0, alpha);
      g.lineBetween(winX, winY, m.x, m.y);

      if (isCorrect) {
        // 거울 → 암흑 구역 방향
        const targetX = i === 0 ? 56 + W * 0.1 : W * 0.845;
        const targetY = 56 + H * 0.19;
        g.lineStyle(3, 0xfff0c0, 0.65);
        g.lineBetween(m.x, m.y, targetX, targetY);

        // 조명 효과 on
        if (!this.zoneIllum[i]) {
          this.zoneIllum[i] = true;
          const overlay = i === 0 ? this.darkZone1 : this.darkZone2;
          this.tweens.add({ targets: overlay, alpha: 0.15, duration: 400 });
        }
      } else {
        if (this.zoneIllum[i]) {
          this.zoneIllum[i] = false;
          const overlay = i === 0 ? this.darkZone1 : this.darkZone2;
          // 소나가 활성 중이 아닐 때만 다시 어둡게
          if (!this.sonarActive) {
            this.tweens.add({ targets: overlay, alpha: 0.9, duration: 400 });
          }
        }
      }
    });
  }

  // ─── 아이템 ──────────────────────────────────────────────
  createItems() {
    const { W, H } = this;
    this.itemObjs = [
      { id: '1', x: W * 0.48, y: H * 0.6,   name: '렌즈①', zone: 'white' },
      { id: '2', x: W * 0.58, y: H * 0.68,  name: '렌즈②', zone: 'white' },
      { id: '3', x: W * 0.82, y: H * 0.22,  name: '렌즈③', zone: 'dark2' },
      { id: '4', x: W * 0.1,  y: H * 0.16,  name: '렌즈④', zone: 'dark1' },
      { id: '5', x: W * 0.14, y: H * 0.32,  name: '렌즈⑤', zone: 'dark1' },
    ].map(def => {
      const glow = this.add.circle(def.x, def.y, 13, 0x80c8ff, 0.75).setDepth(33);
      this.tweens.add({
        targets: glow, alpha: { from: 0.75, to: 0.15 },
        scale: { from: 1, to: 1.6 }, yoyo: true, repeat: -1, duration: 860
      });
      const lbl = this.add.text(def.x, def.y - 22, def.name, {
        fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
        fontSize: '11px', color: '#a0d0ff', fontStyle: '700'
      }).setOrigin(0.5).setDepth(34);
      return { ...def, glow, lbl, done: false };
    });
  }

  // ─── 프리즘 거치대 ───────────────────────────────────────
  createStation() {
    const { W, H } = this;
    const cx = W / 2, cy = H - 72;
    this.stationLbl = this.add.text(cx, cy, '[0/5] 프리즘 복원', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#80b0ff', fontStyle: '700'
    }).setOrigin(0.5).setDepth(5);
    this.stationGlow = this.add.circle(cx, cy - 14, 36, 0x4080ff, 0.07)
      .setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: this.stationGlow, alpha: { from: 0.07, to: 0.22 }, yoyo: true, repeat: -1, duration: 1400
    });
  }

  // ─── 플레이어 ─────────────────────────────────────────────
  createPlayer() {
    const { W, H } = this;
    this.walls = this.physics.add.staticGroup();
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

    this.player = this.physics.add.sprite(W / 2, H / 2, 'simul-zone2');
    const img = this.textures.get('simul-zone2').getSourceImage();
    const sc = Math.min(96 / img.width, 80 / img.height);
    this.player.setScale(sc).setDepth(35).setCollideWorldBounds(true);
    this.player.body.setSize(38, 52);
    this.physics.add.collider(this.player, this.walls);

    this.pglow = this.add.circle(W / 2, H / 2, 38, 0x4ab8ff, 0.15)
      .setDepth(34).setBlendMode(Phaser.BlendModes.ADD);
    this.pname = this.add.text(W / 2, H / 2 + 44, '시물이', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#c8e0ff', fontStyle: '700'
    }).setOrigin(0.5).setDepth(36);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys    = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER,F');
  }

  // ─── HUD ──────────────────────────────────────────────────
  createHUD() {
    const { W, H } = this;
    this.hudBg = this.add.rectangle(W - 8, 58, 200, 64, 0x080a12, 0.92)
      .setOrigin(1, 0).setDepth(40).setStrokeStyle(1, 0x4080ff, 0.5);
    this.itemsTxt = this.add.text(W - 18, 64, '렌즈  0 / 5', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '14px', color: '#a0d0ff', fontStyle: '700'
    }).setOrigin(1, 0).setDepth(41);
    this.sonarTxt = this.add.text(W - 18, 90, `소나  ${this.sonarUses}회 남음`, {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '12px', color: '#60a0c0', fontStyle: '700'
    }).setOrigin(1, 0).setDepth(41);

    // 대화창
    this.dlgBg  = this.add.rectangle(W / 2, H - 8, W - 80, 74, 0x080a12, 0.92)
      .setOrigin(0.5, 1).setDepth(40).setStrokeStyle(1, 0x4080ff, 0.4).setVisible(false);
    this.dlgSpk = this.add.text(62, H - 72, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '11px', color: '#70a8e0', fontStyle: '900'
    }).setDepth(41).setVisible(false);
    this.dlgTxt = this.add.text(62, H - 56, '', {
      fontFamily: 'Pretendard, Malgun Gothic, sans-serif',
      fontSize: '13px', color: '#c8ddf0', wordWrap: { width: W - 130 }
    }).setDepth(41).setVisible(false);
  }

  say(speaker, text, dur = 4500) {
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

    const left  = this.cursors.left.isDown  || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up    = this.cursors.up.isDown    || this.keys.W.isDown;
    const down  = this.cursors.down.isDown  || this.keys.S.isDown;
    const SPEED = 280;
    let vx = left ? -SPEED : right ? SPEED : 0;
    let vy = up   ? -SPEED : down  ? SPEED : 0;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);
    if (vx > 5) this.player.setFlipX(true);
    else if (vx < -5) this.player.setFlipX(false);

    this.pglow.setPosition(this.player.x, this.player.y);
    this.pname.setPosition(this.player.x, this.player.y + 46);

    // 소나 쿨다운
    if (this.sonarCd > 0) this.sonarCd -= delta;

    // 소나 (F)
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.useSonar();

    // SPACE 인터랙션
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
      this.tryInteract();
    }
  }

  useSonar() {
    if (this.sonarUses <= 0 || this.sonarCd > 0) {
      this.say('리플', this.sonarUses <= 0 ? '소나 사용 횟수를 모두 썼어.' : '소나 충전 중이야. 잠깐 기다려.');
      return;
    }
    this.sonarUses--;
    this.sonarCd = 5000;
    this.sonarTxt.setText(`소나  ${this.sonarUses}회 남음`);

    // 소나 링 애니메이션
    this.sonarRing.setPosition(this.player.x, this.player.y).setAlpha(0.8);
    this.tweens.add({ targets: this.sonarRing, scale: 3, alpha: 0, duration: 700 });

    // 암흑 오버레이 일시 해제 (거울 조명 없는 구역만)
    [{ overlay: this.darkZone1, illum: 0 }, { overlay: this.darkZone2, illum: 1 }].forEach(({ overlay, illum }) => {
      if (!this.zoneIllum[illum]) {
        this.tweens.add({ targets: overlay, alpha: 0.12, duration: 300 });
        this.time.delayedCall(3000, () => {
          if (!this.zoneIllum[illum]) {
            this.tweens.add({ targets: overlay, alpha: 0.9, duration: 400 });
          }
        });
      }
    });
    this.say('리플', '소나 발사! 3초간 암흑 구역을 볼 수 있어.');
  }

  tryInteract() {
    const px = this.player.x, py = this.player.y;

    // 거울 각도 조정
    this.mirrors.forEach((m, i) => {
      if (Phaser.Math.Distance.Between(px, py, m.x, m.y) < 58) {
        this.mirrorAngles[i] = (this.mirrorAngles[i] + 1) % 4;
        this.drawMirror(m.g, m.x, m.y, this.mirrorAngles[i]);
        m.lbl.setText(`거울 ${i + 1}  [${this.mirrorAngles[i] * 45}°]`);
        this.updateBeams();
        this.say('리플', `거울 ${i + 1} 각도 → ${this.mirrorAngles[i] * 45}°`);
      }
    });

    // 아이템 수집
    this.itemObjs.forEach(item => {
      if (item.done) return;
      if (Phaser.Math.Distance.Between(px, py, item.x, item.y) < 55) {
        item.done = true;
        item.glow.destroy(); item.lbl.destroy();
        this.collected.add(item.id);
        const n = this.collected.size;
        const flash = this.add.circle(item.x, item.y, 26, 0x80c8ff, 0.8).setDepth(50);
        this.tweens.add({ targets: flash, scale: 3.5, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
        this.itemsTxt.setText(`렌즈  ${n} / 5`);
        this.stationLbl.setText(`[${n}/5] 프리즘 복원`);
        if (n === 5) {
          this.say('리플', '다섯 조각 모두 모았어! 하단 프리즘 거치대에서 SPACE!', 5000);
          this.stationGlow.setFillStyle(0x4080ff, 0.35);
        } else {
          this.say('리플', `${item.name} 수집! ${5 - n}개 남았어.`);
        }
      }
    });

    // 프리즘 복원
    if (this.collected.size === 5) {
      const cx = this.W / 2, cy = this.H - 72;
      if (Phaser.Math.Distance.Between(px, py, cx, cy) < 60) {
        this.doClear();
      }
    }
  }

  doClear() {
    this.cleared = true;
    this.player.setVelocity(0, 0);

    // 빛 복원 연출
    this.tweens.add({ targets: [this.darkZone1, this.darkZone2], alpha: 0, duration: 800 });
    this.tweens.add({ targets: this.whiteOverlay, alpha: 0, duration: 800 });
    this.cameras.main.flash(800, 255, 240, 180);

    this.say('리플', '파동은 균형이야. 너무 없어도, 너무 많아도 공간을 부숴. 이제 알겠지?', 4500);
    this.time.delayedCall(5200, () => {
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(620, () => {
        hubController.anomalyCleared('lens-refraction');
        this.scene.stop();
        this.scene.resume('HubScene');
      });
    });
  }
}
