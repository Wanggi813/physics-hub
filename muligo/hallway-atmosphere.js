class MuligoHallwayAtmosphere {
  constructor(scene) {
    this.scene = scene;
    this.zoneLayers = new Map();
    this.worldWidth = 2400;
    this.worldHeight = 1040;
  }

  create(doorZones) {
    this.createGlobalTint();
    this.createAmbientDust();
    this.createCeilingSystem();
    this.createFloorStressLines();
    doorZones.forEach((zone, index) => this.createDoorZone(zone, index));
  }

  createGlobalTint() {
    const { scene } = this;
    const g = scene.add.graphics().setDepth(1);

    g.fillStyle(0x12070a, 0.13);
    g.fillRect(0, 140, this.worldWidth, 500);
    g.fillStyle(0x050711, 0.16);
    g.fillRect(0, 650, this.worldWidth, this.worldHeight - 650);

    for (let y = 174; y <= 606; y += 36) {
      g.fillStyle(0x23100f, y % 72 === 0 ? 0.06 : 0.032);
      g.fillRect(0, y, this.worldWidth, 1);
    }

    const edge = scene.add.graphics().setDepth(12);
    edge.fillStyle(0x030610, 0.2);
    edge.fillRect(0, 0, this.worldWidth, 88);
    edge.fillStyle(0x030610, 0.18);
    edge.fillRect(0, this.worldHeight - 136, this.worldWidth, 136);

    const leftVignette = scene.add.rectangle(0, 520, 280, this.worldHeight, 0x030610, 0.18)
      .setOrigin(0, 0.5)
      .setDepth(12);
    const rightVignette = scene.add.rectangle(this.worldWidth, 520, 280, this.worldHeight, 0x030610, 0.18)
      .setOrigin(1, 0.5)
      .setDepth(12);
    scene.tweens.add({
      targets: [leftVignette, rightVignette],
      alpha: { from: 0.14, to: 0.24 },
      yoyo: true,
      repeat: -1,
      duration: 2400,
      ease: "Sine.easeInOut"
    });
  }

  createAmbientDust() {
    const { scene } = this;
    for (let i = 0; i < 38; i++) {
      const mote = scene.add.circle(
        Phaser.Math.Between(40, this.worldWidth - 40),
        Phaser.Math.Between(170, 720),
        Phaser.Math.FloatBetween(0.55, 1.35),
        Math.random() > 0.72 ? 0xffc4a0 : 0xf9e8cb,
        Phaser.Math.FloatBetween(0.035, 0.105)
      ).setDepth(7);

      scene.tweens.add({
        targets: mote,
        x: mote.x + Phaser.Math.Between(-18, 18),
        y: mote.y - Phaser.Math.Between(18, 48),
        alpha: { from: mote.alpha, to: 0.02 },
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1800),
        duration: Phaser.Math.Between(2600, 6200),
        ease: "Sine.easeInOut"
      });
    }
  }

  createCeilingSystem() {
    const { scene } = this;
    const rail = scene.add.graphics().setDepth(3);
    rail.lineStyle(3, 0x2f1b18, 0.32);
    rail.lineBetween(0, 136, this.worldWidth, 136);
    rail.lineStyle(1, 0xff6655, 0.24);
    rail.lineBetween(0, 151, this.worldWidth, 151);

    [360, 820, 1320, 1740, 2180].forEach((x, i) => {
      const lamp = scene.add.graphics().setDepth(4);
      lamp.fillStyle(0x251916, 0.95);
      lamp.fillRoundedRect(x - 48, 108, 96, 22, 8);
      lamp.fillStyle(0xff3e34, 0.72);
      lamp.fillRoundedRect(x - 34, 114, 68, 8, 4);
      lamp.fillStyle(0xffd0b8, 0.35);
      lamp.fillRoundedRect(x - 26, 116, 52, 3, 2);

      const wash = scene.add.ellipse(x, 288, 280, 340, 0xff3328, 0.048)
        .setDepth(2)
        .setBlendMode(Phaser.BlendModes.ADD);
      const cone = scene.add.triangle(x, 140, -110, 0, 110, 0, 190, 410, 0xff3a30, 0.032)
        .setDepth(2)
        .setBlendMode(Phaser.BlendModes.ADD);

      scene.tweens.add({
        targets: [lamp, wash, cone],
        alpha: { from: 0.48, to: 0.96 },
        yoyo: true,
        repeat: -1,
        duration: 860 + i * 110,
        ease: "Sine.easeInOut"
      });
    });
  }

  createFloorStressLines() {
    const { scene } = this;
    const g = scene.add.graphics().setDepth(3);

    for (let x = 180; x < this.worldWidth; x += 360) {
      g.lineStyle(1, 0x210b0b, 0.065);
      g.beginPath();
      g.moveTo(x, 686);
      g.lineTo(x + 34, 724);
      g.lineTo(x - 12, 780);
      g.lineTo(x + 42, 832);
      g.strokePath();
    }

    g.lineStyle(2, 0xff4a32, 0.035);
    g.lineBetween(0, 650, this.worldWidth, 650);
    g.lineStyle(1, 0xffc082, 0.055);
    g.lineBetween(0, 674, this.worldWidth, 674);
  }

  createDoorZone(zone, index) {
    const { scene } = this;
    const layer = {
      missionId: zone.missionId,
      cleared: false,
      objects: [],
      timed: []
    };

    const halo = scene.add.ellipse(zone.x, 458, 410, 450, zone.color, 0.045)
      .setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD);
    const floorGlow = scene.add.ellipse(zone.x, 668, 286, 58, zone.color, 0.11)
      .setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD);
    const doorBacklight = scene.add.rectangle(zone.x, 444, 196, 344, zone.color, 0.035)
      .setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD);
    layer.objects.push(halo, floorGlow, doorBacklight);

    const cracks = scene.add.graphics().setDepth(4);
    this.drawCrackSet(cracks, zone.x, zone.color, index);
    layer.objects.push(cracks);

    const warningBands = scene.add.graphics().setDepth(5);
    this.drawWarningBands(warningBands, zone.x, zone.color);
    layer.objects.push(warningBands);

    const dust = scene.add.particles(zone.x, 520, "spark", {
      speedX: { min: -24, max: 24 },
      speedY: { min: -18, max: 16 },
      scale: { start: 0.42, end: 0 },
      alpha: { start: 0.24, end: 0 },
      lifespan: { min: 900, max: 1600 },
      frequency: 260,
      quantity: 1,
      tint: [zone.color, 0xffc6a0, 0xffffff],
      emitZone: { type: "random", source: new Phaser.Geom.Rectangle(-110, -120, 220, 250) }
    }).setDepth(6);
    layer.objects.push(dust);

    scene.tweens.add({
      targets: [halo, floorGlow, doorBacklight],
      alpha: { from: 0.035, to: 0.14 },
      scaleX: { from: 1, to: 1.045 },
      scaleY: { from: 1, to: 1.055 },
      yoyo: true,
      repeat: -1,
      duration: 980 + index * 130,
      ease: "Sine.easeInOut"
    });

    const glitchEvent = scene.time.addEvent({
      delay: 1350 + index * 190,
      loop: true,
      callback: () => {
        if (layer.cleared || Math.random() > 0.32) return;
        this.pulseZoneGlitch(layer, zone);
      }
    });
    layer.timed.push(glitchEvent);

    this.zoneLayers.set(zone.missionId, layer);
  }

  drawCrackSet(g, x, color, index) {
    const starts = [
      { ox: -78, y: 440 },
      { ox: 86, y: 480 },
      { ox: -36, y: 566 }
    ];

    starts.forEach((start, crackIndex) => {
      const baseX = x + start.ox;
      const baseY = start.y + index * 5;
      g.lineStyle(2, color, 0.16);
      g.beginPath();
      g.moveTo(baseX, baseY);
      for (let i = 1; i <= 5; i++) {
        g.lineTo(
          baseX + (i % 2 === 0 ? -1 : 1) * (12 + i * 8),
          baseY + i * 22
        );
      }
      g.strokePath();

      g.lineStyle(1, 0xffffff, 0.1);
      g.beginPath();
      g.moveTo(baseX + 4, baseY + 28);
      g.lineTo(baseX + 32 + crackIndex * 5, baseY + 48);
      g.lineTo(baseX + 18, baseY + 70);
      g.strokePath();
    });
  }

  drawWarningBands(g, x, color) {
    g.lineStyle(1, color, 0.12);
    for (let i = 0; i < 5; i++) {
      const y = 322 + i * 52;
      g.lineBetween(x - 116, y, x + 116, y + 12);
    }

    g.fillStyle(color, 0.048);
    g.fillRect(x - 122, 150, 244, 480);
  }

  pulseZoneGlitch(layer, zone) {
    const { scene } = this;
    const sliceCount = Phaser.Math.Between(2, 4);
    const slices = [];

    for (let i = 0; i < sliceCount; i++) {
      const rect = scene.add.rectangle(
        zone.x + Phaser.Math.Between(-112, 112),
        Phaser.Math.Between(214, 604),
        Phaser.Math.Between(42, 108),
        Phaser.Math.Between(2, 5),
        Math.random() > 0.5 ? 0xff4242 : 0x58d6ff,
        Phaser.Math.FloatBetween(0.14, 0.28)
      ).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
      slices.push(rect);
    }

    scene.tweens.add({
      targets: slices,
      x: `+=${Phaser.Math.Between(-12, 12)}`,
      alpha: 0,
      duration: 120,
      onComplete: () => slices.forEach((slice) => slice.destroy())
    });

    scene.tweens.add({
      targets: layer.objects.filter((obj) => obj.active !== false),
      alpha: "-=0.08",
      yoyo: true,
      duration: 58
    });
  }

  markCleared(missionId) {
    const layer = this.zoneLayers.get(missionId);
    if (!layer || layer.cleared) return;
    layer.cleared = true;

    layer.timed.forEach((event) => event.remove(false));
    layer.objects.forEach((obj) => {
      if (!obj || !obj.active) return;
      this.scene.tweens.killTweensOf(obj);
      this.scene.tweens.add({
        targets: obj,
        alpha: 0,
        duration: 420,
        ease: "Sine.easeOut",
        onComplete: () => obj.destroy()
      });
    });
  }
}

window.MuligoHallwayAtmosphere = MuligoHallwayAtmosphere;
