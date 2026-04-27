const manifest = window.muligoManifest || { roster: [], missions: [] };

const zoneLabel = document.getElementById("zoneLabel");
const interactionHint = document.getElementById("interactionHint");
const hintTitle = document.getElementById("hintTitle");
const hintBody = document.getElementById("hintBody");
const missionOverlay = document.getElementById("missionOverlay");
const missionFrame = document.getElementById("missionFrame");
const overlayZone = document.getElementById("overlayZone");
const overlayTitle = document.getElementById("overlayTitle");
const overlayObjective = document.getElementById("overlayObjective");
const openStandalone = document.getElementById("openStandalone");
const closeMissionButton = document.getElementById("closeMission");
const statusText = document.getElementById("statusText");
const statusPip = document.getElementById("statusPip");
const landingScreen = document.getElementById("landingScreen");
const enterSchoolButton = document.getElementById("enterSchool");
const startInvestigationButton = document.getElementById("startInvestigation");
const storyIntro = document.getElementById("storyIntro");
const gameRoot = document.getElementById("gameRoot");

const hubController = {
  scene: null,
  enteredSchool: !landingScreen,
  activeMissionId: null,
  overlayOpen: false,
  activeAnomalyScene: false,
  clearedMissions: new Set(),   // 전자칠판 시뮬레이션 완료
  anomalySolved: new Set(),     // 실제 이상현상 해결 완료
  allClearTriggered: false,
  challengeActive: false,
  anomalyMode: true,            // 게임 시작부터 이상현상 모드
  missionLevels: {},
  pendingLevelUp: null,
  challengeScore: 0
};

// 이상현상 해결 시 호출 — 전자칠판 잠금 해제
hubController.anomalyCleared = function(missionId) {
  hubController.activeAnomalyScene = false;
  interactionHint.classList.add("hidden");
  hubController.anomalySolved.add(missionId);
  hubController.scene?.markAnomalySolved(missionId);
  updateAnomalyStatus();
  if (hubController.anomalySolved.size >= manifest.missions.length) {
    setTimeout(() => showLevelUpToast('모든 이상현상 해결! 전자칠판으로 연구를 시작해봐.'), 600);
  }
};

function showStoryIntro() {
  landingScreen?.classList.add("story-active");
  storyIntro?.setAttribute("aria-hidden", "false");
  enterSchoolButton?.setAttribute("aria-hidden", "true");
  startInvestigationButton?.focus();
}

function enterSchool() {
  if (hubController.enteredSchool) return;
  hubController.enteredSchool = true;
  document.body.classList.remove("landing-active");
  gameRoot?.setAttribute("aria-hidden", "false");
  landingScreen?.classList.add("is-entering");
  landingScreen?.setAttribute("aria-hidden", "true");
  hubController.scene?.unlockFromLanding();

  window.setTimeout(() => {
    landingScreen?.classList.add("hidden");
  }, 560);
}

enterSchoolButton?.addEventListener("click", showStoryIntro);
startInvestigationButton?.addEventListener("click", enterSchool);

(function createLandingParticles() {
  const container = document.getElementById("landingParticles");
  if (!container) return;
  for (let i = 0; i < 32; i++) {
    const p = document.createElement("span");
    p.className = "landing-particle";
    const size = Math.random() * 3 + 1.5;
    p.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `left:${Math.random() * 100}%`,
      `bottom:${Math.random() * 30}%`,
      `--dur:${5 + Math.random() * 9}s`,
      `--delay:${-Math.random() * 12}s`,
      `--drift:${(Math.random() - 0.5) * 90}px`,
    ].join(";");
    container.appendChild(p);
  }
})();

function updateAnomalyStatus() {
  const total = manifest.missions.length;
  const remaining = Math.max(0, total - hubController.anomalySolved.size);

  if (remaining === 0) {
    statusText.textContent = "CLEAR · 모든 이상 현상 안정화 완료";
    statusText.classList.add("is-clear");
    statusPip.classList.add("is-clear");
    return;
  }

  statusText.textContent = `ALERT · 이상 현상 ${remaining}개 활성 중`;
  statusText.classList.remove("is-clear");
  statusPip.classList.remove("is-clear");
}

function setHint(mission) {
  if (hubController.overlayOpen || hubController.activeAnomalyScene) {
    interactionHint.classList.add("hidden");
    return;
  }
  if (!mission) {
    interactionHint.classList.add("hidden");
    zoneLabel.textContent = "물리고등학교 본관 복도";
    return;
  }

  const solved  = hubController.anomalySolved.has(mission.id);
  const cleared = hubController.clearedMissions.has(mission.id);
  interactionHint.classList.remove("hidden");

  if (cleared) {
    hintTitle.textContent = `${mission.title} · 완료`;
    hintBody.textContent  = `${mission.zone} · 시뮬레이션 완료`;
  } else if (solved) {
    hintTitle.textContent = `${mission.title} · 전자칠판`;
    hintBody.textContent  = `${mission.zone} · 전자칠판 시뮬레이션을 시작합니다`;
  } else {
    hintTitle.textContent = `${mission.title} · 이상현상 진입`;
    hintBody.textContent  = `${mission.zone} · 이상현상 현장에 진입합니다`;
  }
  zoneLabel.textContent = mission.zone;
}
function openMission(mission) {
  hubController.scene?.setSimulPresenting(true);
  hubController.overlayOpen = true;
  interactionHint.classList.add("hidden");
  overlayZone.textContent = mission.zone;
  overlayTitle.textContent = mission.title;
  overlayObjective.textContent = mission.objective;
  const missionSrc = hubController.challengeActive
    ? `${mission.source}?level=${hubController.missionLevels[mission.id] || 1}`
    : mission.source;
  openStandalone.href = missionSrc;
  missionFrame.src = missionSrc;
  missionOverlay.classList.remove("hidden");
  missionOverlay.setAttribute("aria-hidden", "false");
  hubController.scene?.scene.pause();
}

function closeMission() {
  hubController.overlayOpen = false;
  missionOverlay.classList.add("hidden");
  missionOverlay.setAttribute("aria-hidden", "true");
  missionFrame.src = "about:blank";
  hubController.scene?.scene.resume();
  hubController.scene?.setSimulPresenting(false);
  setHint(hubController.scene?.activePortal?.mission || null);
}

closeMissionButton.addEventListener("click", closeMission);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !missionOverlay.classList.contains("hidden")) {
    closeMission();
  }
});

window.addEventListener("message", (e) => {
  if (e.data?.type === "muligo-mission-cleared") {
    const missionId = e.data.missionId;
    if (!hubController.challengeActive) {
      hubController.clearedMissions.add(missionId);
      hubController.scene?.markMissionCleared(missionId);
      updateAnomalyStatus();
    } else {
      hubController.pendingLevelUp = missionId;
    }
  }
  if (e.data?.type === "muligo-challenge-score") {
    hubController.challengeScore += e.data.score;
    updateChallengeHUD();
  }
  if (e.data?.type === "muligo-close") {
    closeMission();
    if (!hubController.challengeActive) {
      const total = manifest.missions.length;
      if (hubController.clearedMissions.size >= total && !hubController.allClearTriggered) {
        hubController.allClearTriggered = true;
        triggerAllClearSequence();
      }
    } else if (hubController.pendingLevelUp) {
      checkMissionLevelUp(hubController.pendingLevelUp);
      hubController.pendingLevelUp = null;
    }
  }
});

class HubScene extends Phaser.Scene {
  constructor() {
    super("HubScene");
    this.player = null;
    this.portalEntries = [];
    this.cursors = null;
    this.keys = null;
    this.activePortal = null;
    this.selectedPortalId = null;
    this.badgeTexts = [];
    this.currentSimulTexture = 'simul-base';
    this.playerTransforming = false;
    this.isIdle = false;
    this.idleTimer = null;
    this.preIdleTexture = 'simul-base';
    this.preOverlayTexture = 'simul-base';
    this.anomalyObjects = new Map();
    this.ledPanels = new Map();
    this.atmosphere = null;
    this.playerLocked = false;
  }

  preload() {
    this.load.image('simul-base', 'assets/궁금한 시물이.png');
    this.load.image('simul-zone1', 'assets/역학 시물이.png');
    this.load.image('simul-zone2', 'assets/양자시물이.png');
    this.load.image('simul-zone3', 'assets/전자기 시물이.png');
    this.load.image('simul-idle', 'assets/책읽는 시물이.png');
    this.load.image('simul-present', 'assets/발표 시물이.png');

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(0x9a6a3f, 1);
    g.fillRoundedRect(0, 0, 88, 132, 4);
    g.lineStyle(3, 0x5a3722, 1);
    g.strokeRoundedRect(1, 1, 86, 130, 4);
    g.fillStyle(0xcfa06a, 1);
    g.fillRoundedRect(9, 9, 70, 114, 3);
    g.fillStyle(0xbfe5f2, 1);
    g.fillRoundedRect(18, 16, 52, 45, 3);
    g.lineStyle(2, 0x6e4729, 1);
    g.lineBetween(44, 16, 44, 61);
    g.lineBetween(18, 38, 70, 38);
    g.fillStyle(0x8b5a33, 1);
    g.fillRoundedRect(15, 75, 58, 42, 3);
    g.fillStyle(0xf0d070, 1);
    g.fillCircle(72, 68, 4);
    g.generateTexture("lab-door", 88, 132);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 8, 5, 2);
    g.generateTexture("debris", 8, 5);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture("spark", 6, 6);

    g.destroy();
  }

  create() {
    hubController.scene = this;

    this.physics.world.setBounds(0, 620, 2400, 330);
    this.cameras.main.setBounds(0, 0, 2400, 1040);
    this.cameras.main.setBackgroundColor("#f3ead9");

    this.drawHub();
    this.createHallwayAtmosphere();
    this.addDataGrid();
    this.createPortals();
    this.addAnomalyEffects();
    this.createPlayer();
    this.createControls();
    this.startGlitchEffect();
    this.playerLocked = !hubController.enteredSchool;

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(window.innerWidth < 960 ? 0.82 : 1);

    this.scale.on("resize", (size) => {
      this.cameras.main.setZoom(size.width < 960 ? 0.82 : 1);
    });
  }

  drawHub() {
    const g = this.add.graphics();
    const W = 2400;
    const H = 1040;
    const doorZones = [
      {
        x: 520,
        color: 0x7e4f38,
        trim: 0x4d3024,
        label: "과학실",
        room: "2-01",
        field: "역학",
        ledColor: 0xff7050,
        missionId: "orbit-raise"
      },
      {
        x: 1200,
        color: 0x557460,
        trim: 0x3b4d3e,
        label: "도서관",
        room: "2-07",
        field: "파동",
        ledColor: 0x62c7ff,
        missionId: "lens-refraction"
      },
      {
        x: 1880,
        color: 0x52677f,
        trim: 0x384653,
        label: "전기실",
        room: "2-12",
        field: "전자기",
        ledColor: 0x68f090,
        missionId: "electromagnetic-induction"
      }
    ];

    this.drawHallwayArchitecture(g, W, H);
    this.drawCentralSign(g);
    this.drawWindows(g);
    this.drawCeilingLights(g, W);

    doorZones.forEach((zone, i) => {
      this.drawRoomDoor(g, zone, i);
      this.createDoorLedPanel({
        missionId: zone.missionId,
        x: i === 2 ? zone.x - 306 : zone.x + 118,
        y: 182,
        color: zone.ledColor,
        label: zone.label,
        room: zone.room,
        field: zone.field
      });
    });

    this.drawHallwayProps(g);
    this.drawClock(g);
    this.drawForegroundDepth(g, W, H, doorZones);
  }

  drawHallwayArchitecture(g, W, H) {
    g.fillStyle(0xe5d0af, 1);
    g.fillRect(0, 0, W, H);

    for (let y = 0; y < 140; y += 10) {
      g.fillStyle(y < 70 ? 0xd7c09d : 0xc5a77e, 0.42);
      g.fillRect(0, y, W, 10);
    }

    g.fillStyle(0x7e5737, 1);
    g.fillRect(0, 126, W, 16);
    g.fillStyle(0xf7ead2, 0.54);
    g.fillRect(0, 28, W, 20);
    g.fillStyle(0x4e3729, 0.22);
    g.fillRect(0, 142, W, 12);

    for (let y = 154; y < 620; y += 12) {
      const shade = y < 330 ? 0xefdfc4 : y < 500 ? 0xe5cfad : 0xdac29d;
      g.fillStyle(shade, 0.52);
      g.fillRect(0, y, W, 12);
    }

    for (let x = 0; x <= W; x += 104) {
      const panelShade = x % 208 === 0 ? 0xf0dfc2 : 0xddc29b;
      g.fillStyle(panelShade, 0.28);
      g.fillRect(x, 154, 104, 466);
      g.lineStyle(1, 0xb8966d, 0.2);
      g.lineBetween(x, 154, x, 620);
      g.lineStyle(1, 0xffffff, 0.1);
      g.lineBetween(x + 2, 154, x + 2, 620);
    }

    for (let x = 52; x <= W; x += 104) {
      g.fillStyle(0xf8ead0, 0.1);
      g.fillRect(x - 16, 154, 32, 466);
    }

    this.drawWallMaterial(g, W);
    this.drawWallMolding(g, W);
    this.drawWallWear(g, W);

    g.fillStyle(0x7a5638, 1);
    g.fillRect(0, 610, W, 16);
    g.fillStyle(0xf8ecd7, 1);
    g.fillRect(0, 626, W, 22);
    g.fillStyle(0x5f3d25, 0.18);
    g.fillRect(0, 648, W, 8);

    g.fillStyle(0xb6733f, 1);
    g.fillRect(0, 656, W, H - 656);
    for (let y = 656; y < H; y += 46) {
      g.fillStyle(y % 92 === 0 ? 0xc17d47 : 0xaa6638, 0.62);
      g.fillRect(0, y, W, 46);
    }

    g.fillStyle(0xe2a064, 0.22);
    g.fillRect(0, 656, W, 54);
    g.fillStyle(0x5f351f, 0.1);
    g.fillRect(0, 720, W, H - 720);

    const vanishingX = W / 2;
    const horizonY = 648;
    g.lineStyle(1, 0x6b3f26, 0.22);
    for (let x = -240; x <= W + 240; x += 180) {
      g.lineBetween(x, H, vanishingX + (x - vanishingX) * 0.22, horizonY);
    }
    for (let y = 690; y <= H; y += 72) {
      const alpha = Phaser.Math.Clamp((y - 656) / 480, 0.12, 0.28);
      g.lineStyle(1, 0x6e4128, alpha);
      g.lineBetween(0, y, W, y);
    }

    g.lineStyle(1, 0xffd19a, 0.07);
    for (let y = 690; y <= 834; y += 72) g.lineBetween(0, y - 8, W, y - 8);
  }

  drawWallMaterial(g, W) {
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(162, 604);
      const radius = Phaser.Math.FloatBetween(0.35, 1.05);
      const warm = Math.random() > 0.5;
      g.fillStyle(warm ? 0xfff3d4 : 0x9f7e5d, Phaser.Math.FloatBetween(0.018, 0.045));
      g.fillCircle(x, y, radius);
    }

    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(178, 586);
      const w = Phaser.Math.Between(30, 96);
      const h = Phaser.Math.Between(2, 5);
      g.fillStyle(Math.random() > 0.55 ? 0xffffff : 0x745438, Phaser.Math.FloatBetween(0.014, 0.034));
      g.fillRoundedRect(x, y, w, h, h / 2);
    }

    for (let y = 190; y < 586; y += 66) {
      g.lineStyle(1, 0xffffff, 0.022);
      g.lineBetween(0, y, W, y);
      g.lineStyle(1, 0x7b5a3d, 0.018);
      g.lineBetween(0, y + 2, W, y + 2);
    }
  }

  drawWallMolding(g, W) {
    const rails = [
      { y: 154, h: 9, top: 0xffefd4, mid: 0xd2b28b, shadow: 0x5c3c27 },
      { y: 514, h: 7, top: 0xefdbbb, mid: 0xb98d62, shadow: 0x4f321f },
      { y: 606, h: 8, top: 0xf8ead4, mid: 0x9a6b42, shadow: 0x3c2518 }
    ];

    rails.forEach((rail) => {
      g.fillStyle(rail.shadow, 0.14);
      g.fillRect(0, rail.y + rail.h + 2, W, 3);
      g.fillStyle(rail.mid, 0.86);
      g.fillRect(0, rail.y, W, rail.h);
      g.fillStyle(rail.top, 0.26);
      g.fillRect(0, rail.y, W, 2);
      g.fillStyle(rail.shadow, 0.1);
      g.fillRect(0, rail.y + rail.h - 1, W, 1);
    });

    for (let x = 104; x < W; x += 208) {
      g.fillStyle(0x6a472f, 0.055);
      g.fillRect(x - 1, 154, 2, 458);
      g.fillStyle(0xffffff, 0.045);
      g.fillRect(x + 1, 154, 1, 458);
    }
  }

  drawWallWear(g, W) {
    const stains = [
      { x: 360, y: 552, w: 120, h: 54, a: 0.026 },
      { x: 1080, y: 540, w: 150, h: 62, a: 0.022 },
      { x: 2020, y: 548, w: 132, h: 56, a: 0.024 }
    ];

    stains.forEach((stain) => {
      g.fillStyle(0x6c4c31, stain.a);
      g.fillEllipse(stain.x, stain.y, stain.w, stain.h);
      g.fillStyle(0xfff1d4, stain.a * 0.85);
      g.fillEllipse(stain.x - stain.w * 0.16, stain.y - stain.h * 0.18, stain.w * 0.48, stain.h * 0.38);
    });

    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(40, W - 40);
      const y = Phaser.Math.Between(500, 594);
      const len = Phaser.Math.Between(10, 34);
      const angle = Phaser.Math.FloatBetween(-0.4, 0.4);
      g.lineStyle(1, Math.random() > 0.5 ? 0x7b5839 : 0xffffff, Phaser.Math.FloatBetween(0.035, 0.08));
      g.lineBetween(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    }

    for (let x = 40; x < W; x += 160) {
      g.fillStyle(0x3f2a1c, 0.065);
      g.fillCircle(x + Phaser.Math.Between(-8, 8), 516 + Phaser.Math.Between(-4, 4), 1.4);
    }
  }

  drawCentralSign(g) {
    g.fillStyle(0x1b120c, 0.22);
    g.fillRoundedRect(970, 52, 480, 82, 8);
    g.lineStyle(3, 0x4b3524, 0.45);
    g.lineBetween(1010, 42, 1010, 26);
    g.lineBetween(1390, 42, 1390, 26);
    g.fillStyle(0x5b3a24, 1);
    g.fillCircle(1010, 26, 5);
    g.fillCircle(1390, 26, 5);
    g.fillStyle(0x17291f, 1);
    g.fillRoundedRect(960, 42, 480, 82, 8);
    g.lineStyle(7, 0x7d5836, 1);
    g.strokeRoundedRect(960, 42, 480, 82, 8);
    g.lineStyle(1, 0xd8ead1, 0.24);
    g.strokeRoundedRect(972, 54, 456, 58, 5);
    g.lineStyle(2, 0xcfe5d5, 0.22);
    g.lineBetween(990, 92, 1408, 92);
    this.drawWallMountScrews(g, 960, 42, 480, 82, 0xd5c2a6);
    this.add.text(1200, 73, "물리고등학교 본관 2층", {
      fontFamily: "Pretendard, Malgun Gothic, sans-serif",
      fontSize: "23px",
      color: "#eaf6df",
      fontStyle: "800"
    }).setOrigin(0.5).setDepth(4);
  }

  drawWindows(g) {
    [{ x: 90, y: 214 }, { x: 2110, y: 214 }].forEach((w) => {
      g.fillStyle(0x5b422e, 0.16);
      g.fillRoundedRect(w.x - 10, w.y + 8, 218, 218, 8);
      g.fillStyle(0x6d5138, 0.18);
      g.fillRoundedRect(w.x - 14, w.y - 8, 226, 234, 8);
      g.fillStyle(0xd7f1fb, 0.94);
      g.fillRoundedRect(w.x, w.y, 198, 210, 7);
      g.fillStyle(0x8fc6dc, 0.52);
      g.fillRoundedRect(w.x + 9, w.y + 10, 180, 190, 5);
      g.lineStyle(7, 0xf8f0df, 1);
      g.strokeRoundedRect(w.x, w.y, 198, 210, 7);
      g.lineStyle(3, 0xf7efd9, 1);
      g.lineBetween(w.x + 99, w.y, w.x + 99, w.y + 210);
      g.lineBetween(w.x, w.y + 105, w.x + 198, w.y + 105);
      g.fillStyle(0xffffff, 0.23);
      g.fillRect(w.x + 18, w.y + 18, 62, 174);
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(w.x + 122, w.y + 18, 48, 174);
      g.lineStyle(2, 0x6a4b30, 0.24);
      g.lineBetween(w.x - 8, w.y + 218, w.x + 206, w.y + 218);
      g.fillStyle(0xd8bf95, 1);
      g.fillRoundedRect(w.x - 14, w.y + 210, 226, 16, 5);
      g.fillStyle(0x6a4b30, 0.2);
      g.fillRoundedRect(w.x - 6, w.y + 226, 210, 6, 3);
      g.lineStyle(1, 0xffffff, 0.18);
      g.lineBetween(w.x + 12, w.y + 214, w.x + 184, w.y + 214);
      this.drawWallMountScrews(g, w.x - 2, w.y + 2, 202, 210, 0x9e7650);
    });
  }

  drawCeilingLights(g, W) {
    for (let x = 160; x <= W - 160; x += 280) {
      g.fillStyle(0x6f553c, 0.24);
      g.fillRoundedRect(x - 64, 13, 128, 17, 8);
      g.fillStyle(0xfff4d0, 0.92);
      g.fillRoundedRect(x - 58, 14, 116, 14, 7);
      g.fillStyle(0xfff0b0, 0.052);
      g.fillRect(x - 170, 154, 340, 466);
    }
  }

  drawRoomDoor(g, zone, index) {
    const dx = zone.x;
    g.fillStyle(0x291c16, 0.18);
    g.fillRoundedRect(dx - 110, 298, 218, 332, 10);
    g.fillStyle(0x5a3b2b, 1);
    g.fillRoundedRect(dx - 92, 282, 184, 346, 9);
    g.fillStyle(0x3f291f, 0.62);
    g.fillRoundedRect(dx - 82, 296, 164, 322, 6);
    g.fillStyle(zone.color, 1);
    g.fillRoundedRect(dx - 76, 300, 152, 312, 5);

    g.fillStyle(0xffffff, 0.08);
    g.fillRect(dx - 64, 312, 128, 18);
    g.fillStyle(zone.trim, 0.24);
    g.fillRect(dx - 64, 592, 128, 12);
    g.lineStyle(1, 0xffffff, 0.12);
    g.lineBetween(dx - 65, 301, dx - 65, 610);
    g.lineStyle(1, 0x271912, 0.28);
    g.lineBetween(dx + 75, 304, dx + 75, 606);

    g.fillStyle(0xaed8e5, 0.95);
    g.fillRoundedRect(dx - 52, 326, 104, 86, 3);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(dx - 44, 334, 34, 70);
    g.lineStyle(2, 0x4e3728, 0.86);
    g.lineBetween(dx, 326, dx, 412);
    g.lineBetween(dx - 52, 369, dx + 52, 369);

    g.fillStyle(0xf5d76a, 1);
    g.fillCircle(dx + 56, 456, 5);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(dx + 54, 454, 2);

    g.fillStyle(0x20150e, 0.24);
    g.fillEllipse(dx, 632, 226, 32);

    g.fillStyle(0xffffff, 0.055);
    g.fillRect(dx - 100, 154, 200, 466);

    if (index === 0) {
      this.drawDoorIconScience(g, dx);
    } else if (index === 1) {
      this.drawDoorIconLibrary(g, dx);
    } else {
      this.drawDoorIconElectric(g, dx);
    }
  }

  drawDoorIconScience(g, dx) {
    g.lineStyle(2, 0xf2d18b, 0.55);
    g.strokeCircle(dx - 32, 536, 13);
    g.lineBetween(dx - 32, 523, dx - 32, 512);
    g.lineBetween(dx - 42, 512, dx - 22, 512);
    g.fillStyle(0xf2d18b, 0.52);
    g.fillCircle(dx - 32, 536, 5);
  }

  drawDoorIconLibrary(g, dx) {
    [0x9ac0d8, 0xd6bd82, 0x8bb48f].forEach((c, i) => {
      g.fillStyle(c, 0.66);
      g.fillRoundedRect(dx - 46 + i * 18, 520 - i * 2, 12, 38 + i * 2, 2);
    });
    g.lineStyle(1, 0xffffff, 0.28);
    g.lineBetween(dx - 48, 562, dx + 6, 562);
  }

  drawDoorIconElectric(g, dx) {
    g.lineStyle(2, 0xb8ffd0, 0.55);
    g.beginPath();
    g.moveTo(dx - 34, 514);
    g.lineTo(dx - 12, 514);
    g.lineTo(dx - 28, 536);
    g.lineTo(dx - 8, 536);
    g.lineTo(dx - 38, 572);
    g.strokePath();
  }

  drawHallwayProps(g) {
    [
      { x: 760, y: 492, w: 220, h: 104, c: 0x3a7a92 },
      { x: 1440, y: 492, w: 220, h: 104, c: 0xb18a4a }
    ].forEach((locker) => {
      g.fillStyle(0x2b211a, 0.24);
      g.fillRoundedRect(locker.x + 8, locker.y + 9, locker.w, locker.h, 8);
      g.fillStyle(locker.c, 1);
      g.fillRoundedRect(locker.x, locker.y, locker.w, locker.h, 8);
      g.fillStyle(0xffffff, 0.08);
      g.fillRect(locker.x + 10, locker.y + 10, locker.w - 20, 16);
      g.lineStyle(2, 0x4a3a2d, 0.62);
      g.strokeRoundedRect(locker.x, locker.y, locker.w, locker.h, 8);
      for (let x = locker.x + 42; x < locker.x + locker.w; x += 42) {
        g.lineStyle(1, 0xffffff, 0.2);
        g.lineBetween(x, locker.y + 12, x, locker.y + locker.h - 12);
        g.fillStyle(0x23313a, 0.32);
        g.fillRoundedRect(x - 8, locker.y + 42, 3, 22, 2);
        g.fillStyle(0xffffff, 0.16);
        g.fillRoundedRect(x - 24, locker.y + 18, 18, 3, 2);
        g.fillRoundedRect(x - 24, locker.y + 25, 18, 3, 2);
      }
      g.fillStyle(0x2a2119, 0.18);
      g.fillRoundedRect(locker.x + 18, locker.y + locker.h - 12, locker.w - 36, 5, 3);
      this.drawWallMountScrews(g, locker.x + 4, locker.y + 4, locker.w - 8, locker.h - 8, 0xe5d3b9);
    });

    g.fillStyle(0x3c281b, 0.18);
    g.fillRoundedRect(118, 474, 190, 102, 8);
    g.fillStyle(0x5b402c, 1);
    g.fillRoundedRect(110, 466, 190, 102, 8);
    g.fillStyle(0x8b6340, 0.55);
    g.fillRoundedRect(120, 476, 170, 82, 5);
    g.fillStyle(0xe8c76d, 1);
    g.fillRoundedRect(124, 480, 162, 74, 4);
    g.lineStyle(2, 0xb48b48, 0.8);
    g.strokeRoundedRect(124, 480, 162, 74, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(140, 496, 52, 30);
    g.fillStyle(0x87b8da, 1);
    g.fillRect(204, 506, 50, 34);
    this.drawPinnedNote(g, 154, 510, 52, 30, 0xffffff, 0xff6f5a);
    this.drawPinnedNote(g, 210, 504, 48, 36, 0x9ed0ec, 0x5a9fc0);
    this.drawPinnedNote(g, 244, 490, 30, 52, 0xffeaa0, 0xc79a34);
    this.drawWallMountScrews(g, 114, 470, 182, 94, 0xe8c76d);

    g.fillStyle(0x2d2118, 0.2);
    g.fillRoundedRect(2110, 474, 178, 102, 8);
    g.fillStyle(0x244a38, 1);
    g.fillRoundedRect(2100, 466, 178, 102, 8);
    g.lineStyle(6, 0x8a623c, 1);
    g.strokeRoundedRect(2100, 466, 178, 102, 8);
    g.fillStyle(0x123024, 0.42);
    g.fillRoundedRect(2114, 480, 150, 74, 5);
    g.lineStyle(2, 0xeaf6df, 0.28);
    g.lineBetween(2124, 516, 2252, 516);
    g.lineStyle(1, 0xeaf6df, 0.16);
    g.lineBetween(2124, 500, 2252, 500);
    g.lineBetween(2124, 536, 2252, 536);
    g.fillStyle(0xd8c8a6, 1);
    g.fillRoundedRect(2122, 562, 118, 6, 3);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(2134, 488, 36, 6);
    this.drawWallMountScrews(g, 2104, 470, 170, 94, 0xd7c2a0);
  }

  drawClock(g) {
    g.fillStyle(0x2e2017, 0.18);
    g.fillCircle(1524, 88, 36);
    g.fillStyle(0xb89567, 0.75);
    g.fillCircle(1518, 82, 39);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(1518, 82, 34);
    g.lineStyle(4, 0x725333, 1);
    g.strokeCircle(1518, 82, 34);
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      const x1 = 1518 + Math.cos(angle) * 25;
      const y1 = 82 + Math.sin(angle) * 25;
      const x2 = 1518 + Math.cos(angle) * 29;
      const y2 = 82 + Math.sin(angle) * 29;
      g.lineStyle(i % 3 === 0 ? 2 : 1, 0x4a3a2d, i % 3 === 0 ? 0.65 : 0.42);
      g.lineBetween(x1, y1, x2, y2);
    }
    g.lineStyle(3, 0x2f2f2f, 1);
    g.lineBetween(1518, 82, 1518, 58);
    g.lineBetween(1518, 82, 1536, 92);
    g.fillStyle(0x2f2f2f, 1);
    g.fillCircle(1518, 82, 3);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(1506, 70, 7);
  }

  drawWallMountScrews(g, x, y, w, h, color) {
    [
      [x + 10, y + 10],
      [x + w - 10, y + 10],
      [x + 10, y + h - 10],
      [x + w - 10, y + h - 10]
    ].forEach(([sx, sy]) => {
      g.fillStyle(0x3b281c, 0.28);
      g.fillCircle(sx + 1, sy + 1, 3);
      g.fillStyle(color, 0.75);
      g.fillCircle(sx, sy, 2.4);
      g.lineStyle(1, 0x4a3323, 0.5);
      g.lineBetween(sx - 1.4, sy, sx + 1.4, sy);
    });
  }

  drawPinnedNote(g, x, y, w, h, paperColor, pinColor) {
    g.fillStyle(0x3b281c, 0.14);
    g.fillRect(x + 3, y + 3, w, h);
    g.fillStyle(paperColor, 0.96);
    g.fillRect(x, y, w, h);
    g.fillStyle(pinColor, 1);
    g.fillCircle(x + w / 2, y + 4, 3);
    g.lineStyle(1, 0x6d5a48, 0.18);
    g.lineBetween(x + 7, y + 12, x + w - 7, y + 12);
    g.lineBetween(x + 7, y + 20, x + w - 10, y + 20);
  }

  drawForegroundDepth(g, W, H, doorZones) {
    doorZones.forEach((zone) => {
      g.fillStyle(0x26313a, 0.12);
      g.fillEllipse(zone.x, 638, 248, 34);
    });

    g.fillStyle(0x000000, 0.045);
    g.fillRect(0, 916, W, H - 916);
  }

  createHallwayAtmosphere() {
    if (!window.MuligoHallwayAtmosphere) return;

    this.atmosphere = new window.MuligoHallwayAtmosphere(this);
    this.atmosphere.create([
      { missionId: "orbit-raise", x: 520, color: 0xff5038 },
      { missionId: "lens-refraction", x: 1200, color: 0x4ab8ff },
      { missionId: "electromagnetic-induction", x: 1880, color: 0x48ef78 }
    ]);
  }

  createDoorLedPanel(config) {
    const panel = {
      ...config,
      width: 188,
      height: 100,
      cleared: false,
      graphics: this.add.graphics().setDepth(13),
      title: this.add.text(config.x + 44, config.y + 24, "", {
        fontFamily: "Pretendard, Malgun Gothic, sans-serif",
        fontSize: "18px",
        color: "#f5fbff",
        fontStyle: "900"
      }).setOrigin(0, 0.5).setDepth(14),
      status: this.add.text(config.x + 18, config.y + 58, "", {
        fontFamily: "Pretendard, Malgun Gothic, sans-serif",
        fontSize: "12px",
        color: "#ffb6a0",
        fontStyle: "900"
      }).setOrigin(0, 0.5).setDepth(14),
      detail: this.add.text(config.x + 18, config.y + 82, "", {
        fontFamily: "Pretendard, Malgun Gothic, sans-serif",
        fontSize: "11px",
        color: "#9fd8ff",
        fontStyle: "800"
      }).setOrigin(0, 0.5).setDepth(14)
    };

    this.ledPanels.set(config.missionId, panel);
    this.redrawDoorLedPanel(panel);

    this.time.addEvent({
      delay: 1800 + Phaser.Math.Between(0, 900),
      loop: true,
      callback: () => this.glitchDoorLedPanel(panel)
    });
  }

  redrawDoorLedPanel(panel) {
    const g = panel.graphics;
    const c = panel.cleared ? 0x64e59b : panel.color;
    const alertC = panel.cleared ? 0x64e59b : 0xff5b40;
    g.clear();

    g.fillStyle(0x071119, 0.98);
    g.fillRoundedRect(panel.x, panel.y, panel.width, panel.height, 8);
    g.lineStyle(2, c, panel.cleared ? 0.55 : 0.95);
    g.strokeRoundedRect(panel.x, panel.y, panel.width, panel.height, 8);
    g.lineStyle(1, c, 0.18);
    for (let yy = panel.y + 12; yy < panel.y + panel.height - 8; yy += 8) {
      g.lineBetween(panel.x + 12, yy, panel.x + panel.width - 12, yy);
    }

    g.fillStyle(c, panel.cleared ? 0.2 : 0.36);
    g.fillCircle(panel.x + 24, panel.y + 24, 16);
    g.fillStyle(c, 1);
    g.fillCircle(panel.x + 24, panel.y + 24, 7);

    if (!panel.cleared) {
      g.fillStyle(alertC, 0.16);
      g.fillRoundedRect(panel.x + 12, panel.y + 50, panel.width - 24, 20, 4);
      g.lineStyle(1, alertC, 0.55);
      g.strokeRoundedRect(panel.x + 12, panel.y + 50, panel.width - 24, 20, 4);
    }

    panel.title.setText(panel.label);
    panel.title.setColor(panel.cleared ? "#e8fff1" : "#f5fbff");
    panel.status.setText(panel.cleared ? "안정화 완료" : "⚠ 이상 현상 감지");
    panel.status.setColor(panel.cleared ? "#7cf0aa" : "#ffb6a0");
    panel.detail.setText(panel.cleared ? "정상 출입 가능" : `${panel.field} 미션`);
    panel.detail.setColor(panel.cleared ? "#a8d8bd" : "#9fd8ff");
  }

  glitchDoorLedPanel(panel) {
    if (panel.cleared || Math.random() > 0.42) return;

    const targets = [panel.graphics, panel.title, panel.status, panel.detail];
    const dx = Phaser.Math.Between(-3, 3);
    const tint = Math.random() > 0.5 ? 0xff6b6b : 0x65d8ff;

    [panel.title, panel.status, panel.detail].forEach((text) => text.setTint(tint));
    this.tweens.add({
      targets,
      x: `+=${dx}`,
      alpha: { from: 1, to: 0.78 },
      yoyo: true,
      repeat: 1,
      duration: 45,
      onComplete: () => {
        panel.graphics.setPosition(0, 0);
        panel.title.setPosition(panel.x + 44, panel.y + 24).clearTint().setAlpha(1);
        panel.status.setPosition(panel.x + 18, panel.y + 58).clearTint().setAlpha(1);
        panel.detail.setPosition(panel.x + 18, panel.y + 82).clearTint().setAlpha(1);
      }
    });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(520, 770, 'simul-base');
    this.player.setScale(this.getPlayerScaleForTexture('simul-base'));
    // 궁금한 시물이는 우향이므로 기본 flip 없음
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(44, 60);
    this.player.body.setOffset(18, 15);

    // 외곽 헤일로 (가산 블렌드 — 어두운 배경에서 실제 발광처럼 보임)
    this.playerGlow = this.add.circle(this.player.x, this.player.y + 22, 52, 0x4ab8ff, 0.2)
      .setDepth(18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.playerName = this.add
      .text(this.player.x, this.player.y + 52, "시물이", {
        fontFamily: "Pretendard, Malgun Gothic, sans-serif",
        fontSize: "14px",
        color: "#d8ebff",
        fontStyle: "800"
      })
      .setOrigin(0.5, 0)
      .setDepth(21);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,ENTER");
  }

  unlockFromLanding() {
    this.playerLocked = false;
    this.cameras.main.flash(420, 74, 203, 160);
    if (this.playerGlow) {
      this.tweens.add({
        targets: this.playerGlow,
        alpha: { from: 0.2, to: 0.65 },
        scaleX: { from: 1, to: 1.7 },
        scaleY: { from: 1, to: 1.7 },
        yoyo: true,
        duration: 360,
        ease: "Sine.easeInOut"
      });
    }
  }

  createPortals() {
    const positions = [
      { x: 520, y: 612, frameColor: 0xff5020, glowColor: 0xff6030, labelColor: "#ffb090" },
      { x: 1200, y: 612, frameColor: 0x4aaaf0, glowColor: 0x70ccff, labelColor: "#bde8ff" },
      { x: 1880, y: 612, frameColor: 0x30da60, glowColor: 0x60ff90, labelColor: "#c6ffd5" }
    ];

    manifest.missions.forEach((mission, index) => {
      const pos = positions[index] || positions[positions.length - 1];

      // 배경 헤일로 (가산 블렌드 — 포털에서 빛이 뿜어져 나오는 효과)
      const halo = this.add.circle(pos.x, pos.y, 190, pos.glowColor, 0.06)
        .setDepth(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      const haloInner = this.add.circle(pos.x, pos.y, 85, pos.glowColor, 0.12)
        .setDepth(0)
        .setBlendMode(Phaser.BlendModes.ADD);

      // 이상장 경고 프레임 (문틀)
      const frame = this.add.graphics().setDepth(2);
      frame.lineStyle(5, pos.frameColor, 1);
      frame.strokeEllipse(pos.x, pos.y, 184, 66);
      frame.fillStyle(pos.frameColor, 0.08);
      frame.fillEllipse(pos.x, pos.y, 184, 66);

      // 문틀 발광 (가산 블렌드)
      const glow = this.add.ellipse(pos.x, pos.y, 210, 78, pos.glowColor, 0.18)
        .setDepth(1)
        .setBlendMode(Phaser.BlendModes.ADD);

      // 이상장 경고 배지 (문 위)
      const badge = this.add.graphics().setDepth(5);
      badge.fillStyle(pos.frameColor, 1);
      badge.fillRoundedRect(pos.x - 52, pos.y - 374, 104, 28, 6);
      const badgeText = this.add
        .text(pos.x, pos.y - 360, "⚠ 이상현상", {
          fontFamily: "Pretendard, Malgun Gothic, sans-serif",
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "800"
        })
        .setOrigin(0.5, 0.5)
        .setDepth(6);
      this.badgeTexts.push([badgeText, pos.x, pos.y - 360]);

      // 발광 펄스 애니메이션
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.18, to: 0.55 },
        yoyo: true,
        repeat: -1,
        duration: 1100 + index * 150
      });

      // 헤일로 호흡 애니메이션
      this.tweens.add({
        targets: halo,
        alpha: { from: 0.04, to: 0.14 },
        yoyo: true,
        repeat: -1,
        duration: 1900 + index * 200
      });
      this.tweens.add({
        targets: haloInner,
        alpha: { from: 0.1, to: 0.26 },
        scaleX: { from: 1, to: 1.35 },
        scaleY: { from: 1, to: 1.35 },
        yoyo: true,
        repeat: -1,
        duration: 1400 + index * 160
      });

      // 경고 배지 점멸
      this.tweens.add({
        targets: badge,
        alpha: { from: 1, to: 0.4 },
        yoyo: true,
        repeat: -1,
        duration: 700 + index * 80
      });

      this.portalEntries.push({
        mission,
        x: pos.x,
        y: 656,
        triggerHalfWidth: 58,
        triggerHalfHeight: 48,
        pad: badge,
        glow,
        halo,
        haloInner,
        frame,
        badgeText
      });

      if (hubController.clearedMissions.has(mission.id)) {
        this.markMissionCleared(mission.id);
      }
    });
  }

  // 이상현상 해결 → 전자칠판 잠금 해제 (포털을 황금색으로 변경)
  markAnomalySolved(missionId) {
    const portal = this.portalEntries.find(e => e.mission.id === missionId);
    if (!portal || portal.anomalySolved) return;
    portal.anomalySolved = true;

    // 이상현상 이펙트 제거
    const anomalyObjs = this.anomalyObjects.get(missionId) || [];
    anomalyObjs.forEach(obj => obj?.destroy?.());
    this.anomalyObjects.delete(missionId);
    this.atmosphere?.markCleared(missionId);

    // 포털 → 전자칠판 활성 상태 (황금색)
    this.tweens.killTweensOf([portal.glow, portal.halo, portal.haloInner, portal.pad]);
    portal.glow.setFillStyle(0xffd040, 1).setVisible(true);
    portal.halo.setFillStyle(0xffd040, 0.1).setVisible(true);
    portal.haloInner.setFillStyle(0xffd040, 0.18).setVisible(true);
    this.tweens.add({
      targets: [portal.glow, portal.halo, portal.haloInner],
      alpha: { from: 0.3, to: 0.75 }, yoyo: true, repeat: -1, duration: 950
    });
    portal.pad.clear();
    portal.pad.fillStyle(0x3a2e00, 1);
    portal.pad.fillRoundedRect(portal.x - 52, 238, 104, 28, 6);
    portal.badgeText.setText('전자칠판 활성');
    portal.badgeText.setColor('#ffe060');
    portal.badgeText.setPosition(portal.x, 251);

    // LED 패널 업데이트
    const led = this.ledPanels.get(missionId);
    if (led) {
      led.status.setText('이상현상 해결 · 전자칠판 활성화');
      led.status.setColor('#ffd060');
      led.detail.setText('시뮬레이션 시작 가능');
      led.detail.setColor('#ffee90');
    }

    // 카메라 플래시
    this.cameras.main.flash(500, 255, 210, 60);
  }

  markMissionCleared(missionId) {
    const portal = this.portalEntries.find((entry) => entry.mission.id === missionId);
    if (!portal || portal.cleared) return;
    portal.cleared = true;

    const anomalyObjects = this.anomalyObjects.get(missionId) || [];
    anomalyObjects.forEach((obj) => {
      if (obj?.destroy) obj.destroy();
    });
    this.anomalyObjects.delete(missionId);

    this.tweens.killTweensOf([portal.glow, portal.halo, portal.haloInner, portal.pad, portal.frame]);
    portal.glow.setVisible(false);
    portal.halo.setVisible(false);
    portal.haloInner.setVisible(false);
    portal.frame.setAlpha(0);
    portal.pad.clear();
    portal.pad.fillStyle(0x2f8f5a, 1);
    portal.pad.fillRoundedRect(portal.x - 42, 238, 84, 26, 6);
    portal.badgeText.setText("해결됨");
    portal.badgeText.setPosition(portal.x, 251);
    portal.badgeText.clearTint();
    portal.badgeText.setColor("#dfffe9");

    const ledPanel = this.ledPanels.get(missionId);
    if (ledPanel) {
      ledPanel.cleared = true;
      this.redrawDoorLedPanel(ledPanel);
    }
    this.atmosphere?.markCleared(missionId);

    this.tweens.add({
      targets: portal.badgeText,
      alpha: { from: 1, to: 0.68 },
      yoyo: true,
      repeat: 2,
      duration: 360
    });
  }

  enterChallengeMode(missionLevels) {
    this.portalEntries.forEach(portal => {
      const lv = missionLevels[portal.mission.id] || 1;
      this.tweens.killTweensOf([portal.glow, portal.halo, portal.haloInner]);
      portal.glow.setVisible(true);
      portal.halo.setVisible(true);
      portal.haloInner.setVisible(true);
      this.tweens.add({
        targets: [portal.halo, portal.haloInner, portal.glow],
        alpha: { from: 0.35, to: 0.85 },
        yoyo: true,
        repeat: -1,
        duration: 920
      });
      portal.pad.clear();
      portal.pad.fillStyle(0x1a3d6a, 1);
      portal.pad.fillRoundedRect(portal.x - 42, 238, 84, 26, 6);
      portal.badgeText.setText(`LV.${lv}`);
      portal.badgeText.setColor('#ffe080');
      portal.badgeText.setPosition(portal.x, 251);
    });
  }

  updateChallengePortalLevel(missionId, level) {
    const portal = this.portalEntries.find(p => p.mission.id === missionId);
    if (!portal) return;
    if (level >= 5) {
      portal.badgeText.setText('MAX');
      portal.badgeText.setColor('#ffd040');
      portal.pad.clear();
      portal.pad.fillStyle(0x4a2e00, 1);
      portal.pad.fillRoundedRect(portal.x - 42, 238, 84, 26, 6);
      this.tweens.killTweensOf([portal.halo, portal.haloInner, portal.glow]);
      portal.halo.setFillStyle(0xffd040);
      portal.haloInner.setFillStyle(0xffd040);
      portal.glow.setFillStyle(0xffd040);
      this.tweens.add({
        targets: [portal.halo, portal.haloInner, portal.glow],
        alpha: { from: 0.45, to: 1.0 },
        yoyo: true, repeat: -1, duration: 680
      });
    } else {
      portal.badgeText.setText(`LV.${level}`);
    }
  }

  triggerAllMaxEffect() {
    this.cameras.main.flash(900, 255, 210, 60);

    this.portalEntries.forEach(portal => {
      for (let i = 0; i < 28; i++) {
        const spark = this.add.circle(
          portal.x + Phaser.Math.Between(-70, 70),
          Phaser.Math.Between(200, 620),
          Phaser.Math.FloatBetween(1.5, 4),
          Math.random() > 0.5 ? 0xffd040 : 0xffe880,
          1
        ).setDepth(16).setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
          targets: spark,
          y: spark.y - Phaser.Math.Between(140, 420),
          x: spark.x + Phaser.Math.Between(-60, 60),
          alpha: 0,
          delay: Phaser.Math.Between(0, 900),
          duration: Phaser.Math.Between(800, 2200),
          ease: 'Sine.easeOut',
          onComplete: () => spark.destroy()
        });
      }
    });

    if (this.playerGlow) {
      this.tweens.add({
        targets: this.playerGlow,
        alpha: { from: 0.2, to: 0.9 },
        scaleX: { from: 1, to: 3.5 },
        scaleY: { from: 1, to: 3.5 },
        yoyo: true, repeat: 4, duration: 280,
        ease: 'Sine.easeInOut'
      });
    }
  }

  launchAnomalyScene(mission) {
    const sceneMap = {
      'orbit-raise':                 'GravityScene',
      'lens-refraction':             'LightScene',
      'electromagnetic-induction':   'EMScene'
    };
    const sceneName = sceneMap[mission.id];
    if (!sceneName) return;
    hubController.activeAnomalyScene = true;
    interactionHint.classList.add("hidden");
    this.scene.launch(sceneName);
    this.scene.pause();
  }

  triggerBarrierBreakEffect() {
    hubController.anomalyMode = true;
    document.getElementById('challengeHud')?.classList.add('hidden');
    this.cameras.main.shake(900, 0.02);
    this.cameras.main.flash(1400, 255, 60, 20);
    setTimeout(() => showLevelUpToast('⚠ 격리막 붕괴 — 직접 진입하라'), 700);
    this.portalEntries.forEach(portal => {
      this.tweens.killTweensOf([portal.glow, portal.halo, portal.haloInner]);
      portal.glow.setVisible(true).setFillStyle(0xff4020, 1);
      portal.halo.setVisible(true);
      portal.haloInner.setVisible(true);
      this.tweens.add({
        targets: [portal.halo, portal.haloInner, portal.glow],
        alpha: { from: 0.5, to: 1.0 }, yoyo: true, repeat: -1, duration: 600
      });
      portal.pad.clear();
      portal.pad.fillStyle(0x5a0000, 1);
      portal.pad.fillRoundedRect(portal.x - 42, 238, 84, 26, 6);
      portal.badgeText.setText('진입');
      portal.badgeText.setColor('#ff6040');
      portal.badgeText.setPosition(portal.x, 251);
    });
  }

  triggerAllClearEffect() {
    if (this.idleTimer) { this.idleTimer.remove(false); this.idleTimer = null; }
    this.isIdle = false;
    this.playerTransforming = false;
    this.playerLocked = true;
    this.player.setVelocity(0, 0);
    this.applyPlayerTexture('simul-present');
    this.currentSimulTexture = 'simul-present';
    this.cameras.main.flash(600, 180, 255, 215);
    this.atmosphere?.triggerAllClear();

    if (this.playerGlow) {
      this.tweens.add({
        targets: this.playerGlow,
        alpha: { from: 0.2, to: 0.65 },
        scaleX: { from: 1, to: 2.8 },
        scaleY: { from: 1, to: 2.8 },
        yoyo: true,
        repeat: 3,
        duration: 300,
        ease: 'Sine.easeInOut'
      });
    }
  }

  addAnomalyEffects() {
    this.registerAnomaly("orbit-raise", () => this.addOrbitalAnomaly(520));
    this.registerAnomaly("lens-refraction", () => this.addWaveAnomaly(1200));
    this.registerAnomaly("electromagnetic-induction", () => this.addElectricAnomaly(1880));
  }

  registerAnomaly(missionId, build) {
    if (hubController.clearedMissions.has(missionId)) return;
    const before = new Set(this.children.list);
    build();
    const created = this.children.list.filter((obj) => !before.has(obj));
    this.anomalyObjects.set(missionId, created);
  }

  isAnomalyActiveAt(x) {
    const missionIdByX = {
      520: "orbit-raise",
      1200: "lens-refraction",
      1880: "electromagnetic-induction"
    };
    const missionId = missionIdByX[x];
    return !missionId || !hubController.clearedMissions.has(missionId);
  }

  addDoorAnomalyShell(x, color, kind) {
    const door = { x, y: 300, w: 152, h: 312 };
    const shell = this.add.graphics().setDepth(6);
    const lineLayer = this.add.graphics().setDepth(9);
    const glow = this.add.rectangle(x, 456, 176, 338, color, 0.08)
      .setDepth(5)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.ellipse(x, 456, 132, 254, color, 0.08)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);

    shell.fillStyle(color, 0.055);
    shell.fillRoundedRect(door.x - door.w / 2, door.y, door.w, door.h, 5);
    shell.lineStyle(2, color, 0.48);
    shell.strokeRoundedRect(door.x - door.w / 2 + 4, door.y + 4, door.w - 8, door.h - 8, 5);

    for (let yy = door.y + 26; yy < door.y + door.h - 22; yy += 22) {
      shell.lineStyle(1, color, 0.12);
      shell.lineBetween(door.x - 61, yy, door.x + 61, yy + Phaser.Math.Between(-4, 4));
    }

    this.tweens.add({
      targets: [glow, core, shell],
      alpha: { from: 0.62, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 820,
      ease: "Sine.easeInOut"
    });

    if (kind === "orbit") this.decorateOrbitDoorAnomaly(x, color, lineLayer);
    if (kind === "wave") this.decorateWaveDoorAnomaly(x, color, lineLayer);
    if (kind === "electric") this.decorateElectricDoorAnomaly(x, color, lineLayer);

    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (!this.isAnomalyActiveAt(x) || Math.random() > 0.5) return;
        this.flashDoorSurface(x, color, kind);
      }
    });
  }

  decorateOrbitDoorAnomaly(x, color, g) {
    g.lineStyle(2, color, 0.42);
    g.strokeEllipse(x, 454, 178, 236);
    g.lineStyle(1, 0xffd28c, 0.32);
    g.strokeEllipse(x, 454, 118, 292);
    g.strokeEllipse(x, 454, 214, 112);

    [0, 0.33, 0.66].forEach((offset, i) => {
      const orb = this.add.circle(x, 454, 4 + i, [0xff5c38, 0xffb067, 0xffe0a0][i], 1)
        .setDepth(11)
        .setBlendMode(Phaser.BlendModes.ADD);
      const follower = { t: offset };
      this.tweens.add({
        targets: follower,
        t: offset + 1,
        repeat: -1,
        duration: 2200 + i * 420,
        ease: "Linear",
        onUpdate: () => {
          const angle = follower.t * Math.PI * 2;
          orb.setPosition(x + Math.cos(angle) * 78, 454 + Math.sin(angle) * 118);
        }
      });
    });

    this.add.particles(x, 510, "debris", {
      speedX: { min: -32, max: 32 },
      speedY: { min: -95, max: -22 },
      scale: { start: 1.2, end: 0.18 },
      alpha: { start: 0.78, end: 0 },
      rotate: { min: -120, max: 120 },
      lifespan: { min: 1700, max: 3100 },
      frequency: 160,
      quantity: 2,
      gravityY: -38,
      tint: [0xff6030, 0xffa060, 0xffd090, 0xffffff],
      emitZone: { type: "random", source: new Phaser.Geom.Rectangle(-72, -170, 144, 288) }
    }).setDepth(12);

    for (let i = 0; i < 9; i++) {
      const itemX = x + Phaser.Math.Between(-86, 86);
      const itemY = Phaser.Math.Between(326, 590);
      const item = i % 3 === 0
        ? this.add.rectangle(itemX, itemY, Phaser.Math.Between(10, 22), Phaser.Math.Between(5, 10), 0xffd08a, 0.9)
        : this.add.circle(itemX, itemY, Phaser.Math.Between(3, 7), i % 2 ? 0xff7040 : 0xffe0a0, 0.9);

      item
        .setDepth(13)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setRotation(Phaser.Math.FloatBetween(-0.9, 0.9));

      this.tweens.add({
        targets: item,
        x: itemX + Phaser.Math.Between(-34, 34),
        y: itemY - Phaser.Math.Between(22, 64),
        rotation: item.rotation + Phaser.Math.FloatBetween(-2.8, 2.8),
        alpha: { from: 0.34, to: 1 },
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 700),
        duration: Phaser.Math.Between(1700, 3200),
        ease: "Sine.easeInOut"
      });
    }
  }

  decorateWaveDoorAnomaly(x, color, g) {
    let phase = 0;
    const redrawWarp = () => {
      if (!this.isAnomalyActiveAt(x)) return;
      phase += 0.18;
      g.clear();

      g.fillStyle(0x8ce8ff, 0.055);
      for (let i = 0; i < 12; i++) {
        const y = 312 + i * 25;
        const offset = Math.sin(phase + i * 0.72) * 16;
        g.fillRoundedRect(x - 72 + offset, y, 144, 12, 6);
      }

      for (let i = 0; i < 11; i++) {
        const y = 322 + i * 27;
        g.lineStyle(i % 2 ? 3 : 2, i % 2 ? 0xcff8ff : color, i % 2 ? 0.5 : 0.34);
        g.beginPath();
        g.moveTo(x - 70 + Math.sin(phase + i) * 10, y);
        for (let px = -56; px <= 70; px += 14) {
          const wave = Math.sin(phase * 1.4 + px / 16 + i * 0.6) * (11 + i * 0.55);
          g.lineTo(x + px + wave, y + Math.cos(phase + px / 18) * 5);
        }
        g.strokePath();
      }

      g.lineStyle(2, 0xffffff, 0.28);
      g.beginPath();
      g.moveTo(x - 54 + Math.sin(phase) * 15, 326);
      g.lineTo(x + 54 + Math.sin(phase + 1.4) * 15, 326);
      g.lineTo(x + 48 + Math.sin(phase + 2.1) * 22, 412);
      g.lineTo(x - 50 + Math.sin(phase + 0.7) * 18, 412);
      g.closePath();
      g.strokePath();
    };

    redrawWarp();
    this.time.addEvent({ delay: 70, loop: true, callback: redrawWarp });

    for (let i = 0; i < 5; i++) {
      const strip = this.add.rectangle(x, 340 + i * 54, 148, 20, i % 2 ? 0x73ddff : 0xffffff, 0.12)
        .setDepth(12)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: strip,
        x: x + (i % 2 ? 26 : -26),
        scaleX: { from: 0.72, to: 1.12 },
        alpha: { from: 0.04, to: 0.22 },
        yoyo: true,
        repeat: -1,
        delay: i * 140,
        duration: 720 + i * 90,
        ease: "Sine.easeInOut"
      });
    }

    const prism = this.add.graphics().setDepth(10);
    prism.fillStyle(0xffffff, 0.12);
    prism.fillTriangle(x - 44, 386, x + 42, 420, x - 26, 458);
    prism.lineStyle(2, 0xcff6ff, 0.72);
    prism.strokeTriangle(x - 44, 386, x + 42, 420, x - 26, 458);
    this.tweens.add({
      targets: prism,
      alpha: { from: 0.35, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: 980,
      ease: "Sine.easeInOut"
    });
  }

  decorateElectricDoorAnomaly(x, color, g) {
    for (let i = 0; i < 5; i++) {
      const lx = x - 54 + i * 27;
      g.lineStyle(3, color, 0.48);
      g.lineBetween(lx, 318, lx + Phaser.Math.Between(-10, 10), 596);

      const charge = this.add.circle(lx, 330, 4, i % 2 ? 0xffffff : color, 1)
        .setDepth(13)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: charge,
        y: 596,
        x: lx + Phaser.Math.Between(-12, 12),
        alpha: { from: 1, to: 0.2 },
        scale: { from: 1.3, to: 0.45 },
        repeat: -1,
        delay: i * 180,
        duration: 760 + i * 80,
        ease: "Sine.easeIn"
      });
    }
    g.lineStyle(3, 0xb8ffd0, 0.48);
    g.strokeEllipse(x, 452, 170, 64);
    g.strokeEllipse(x, 452, 128, 196);
    g.strokeEllipse(x, 452, 204, 242);

    this.add.particles(x, 456, "spark", {
      speedX: { min: -74, max: 74 },
      speedY: { min: -120, max: 120 },
      scale: { start: 1.15, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 180, max: 520 },
      frequency: 42,
      quantity: 2,
      tint: [0x50ff80, 0xaaffcc, 0xffffff],
      emitZone: { type: "random", source: new Phaser.Geom.Rectangle(-70, -140, 140, 280) }
    }).setDepth(12);

    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (!this.isAnomalyActiveAt(x) || Math.random() > 0.42) return;
        this.drawLightningBolt(
          x + Phaser.Math.Between(-54, 54),
          Phaser.Math.Between(318, 380),
          Phaser.Math.Between(500, 606)
        );
      }
    });
  }

  flashDoorSurface(x, color, kind) {
    const h = Phaser.Math.Between(8, 18);
    const flash = this.add.rectangle(
      x + Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(326, 590),
      Phaser.Math.Between(98, 154),
      h,
      kind === "wave" ? 0xcff6ff : color,
      Phaser.Math.FloatBetween(0.14, 0.28)
    )
      .setDepth(14)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      x: flash.x + Phaser.Math.Between(-18, 18),
      alpha: 0,
      duration: 140,
      ease: "Sine.easeOut",
      onComplete: () => flash.destroy()
    });
  }

  // 1구역: 궤도 이상장 — 실제 궤도 운동 + 중력 역전 파편
  addOrbitalAnomaly(x) {
    const cy = 555;
    this.addDoorAnomalyShell(x, 0xff6030, "orbit");

    // 궤도 경로 타원 (희미하게 표시)
    const pathG = this.add.graphics().setDepth(5);
    pathG.lineStyle(1.5, 0xd04020, 0.25);
    pathG.strokeEllipse(x, cy + 60, 280, 140);
    pathG.lineStyle(1, 0xff8050, 0.15);
    pathG.strokeEllipse(x, cy + 60, 200, 100);

    // 궤도를 도는 파편 3개
    const orbitPath = new Phaser.Curves.Ellipse(x, cy + 60, 140, 70);
    [0, 0.33, 0.67].forEach((offset, i) => {
      const sizes = [8, 6, 5];
      const colors = [0xff6030, 0xff9050, 0xffb878];
      const debris = this.add.circle(0, 0, sizes[i], colors[i], 1).setDepth(10);
      // 그림자
      const shadow = this.add.circle(0, 0, sizes[i] + 3, colors[i], 0.25).setDepth(9);
      const follower = { t: offset, vec: new Phaser.Math.Vector2() };
      this.tweens.add({
        targets: follower,
        t: follower.t + 1,
        duration: 2800 + i * 500,
        repeat: -1,
        ease: "Linear",
        onUpdate: () => {
          orbitPath.getPoint(follower.t % 1, follower.vec);
          debris.setPosition(follower.vec.x, follower.vec.y);
          shadow.setPosition(follower.vec.x + 3, follower.vec.y + 3);
        }
      });
    });

    // 중력 역전 — 파편 폭발적으로 떠오름
    this.add.particles(x, cy + 100, "debris", {
      speedX: { min: -70, max: 70 },
      speedY: { min: -160, max: -40 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 1800, max: 3500 },
      frequency: 120,
      quantity: 3,
      tint: [0xd04020, 0xff6030, 0xff9050, 0xffb878, 0xffd090],
      gravityY: -25,
      emitZone: { type: "random", source: new Phaser.Geom.Ellipse(0, 0, 180, 80) }
    }).setDepth(8);

    // 중력장 수축 링 (여러 개 동시)
    [0, 600, 1200].forEach((startAt) => {
      this.time.addEvent({
        delay: 1400,
        startAt,
        loop: true,
        callback: () => {
          if (!this.isAnomalyActiveAt(x)) return;
          const sy = cy + Phaser.Math.Between(40, 220);
          const ring = this.add.circle(x + Phaser.Math.Between(-50, 50), sy, 18, 0xd04020, 0).setDepth(7);
          ring.setStrokeStyle(3, 0xff6030, 0.75);
          this.tweens.add({
            targets: ring,
            y: sy - Phaser.Math.Between(120, 220),
            scaleX: 0.1,
            scaleY: 0.1,
            alpha: 0,
            duration: Phaser.Math.Between(1400, 2400),
            ease: "Power2.easeIn",
            onComplete: () => ring.destroy()
          });
        }
      });
    });

    // 중력 웰 펄스 글로우
    const well = this.add.circle(x, cy + 60, 90, 0xd04020, 0.1).setDepth(4);
    this.tweens.add({
      targets: well,
      alpha: { from: 0.1, to: 0.28 },
      scaleX: { from: 1, to: 1.25 },
      scaleY: { from: 1, to: 1.25 },
      yoyo: true,
      repeat: -1,
      duration: 1000
    });
  }

  // 2구역: 굴절 이상장 — 중첩 파동 + 간섭무늬
  addWaveAnomaly(x) {
    const cy = 555;
    this.addDoorAnomalyShell(x, 0x60b8f8, "wave");

    // 중심 발광체
    const core = this.add.circle(x, cy + 40, 22, 0x1a7fc0, 0.7).setDepth(6);
    const coreGlow = this.add.circle(x, cy + 40, 38, 0x60b8f8, 0.25).setDepth(5);
    this.tweens.add({
      targets: [core, coreGlow],
      alpha: { from: 0.7, to: 0.2 },
      scaleX: { from: 1, to: 1.5 },
      scaleY: { from: 1, to: 1.5 },
      yoyo: true,
      repeat: -1,
      duration: 700
    });

    // 3겹 파동 (각기 다른 색·속도)
    const waveSet = [
      { delay: 550, color: 0x0050c0, sw: 3.5, maxSX: 14, maxSY: 8, dur: 2000 },
      { delay: 420, color: 0x1a7fc0, sw: 2.5, maxSX: 11, maxSY: 6, dur: 1700 },
      { delay: 650, color: 0x60b8f8, sw: 1.5, maxSX: 16, maxSY: 9, dur: 2400 }
    ];
    waveSet.forEach((cfg, wi) => {
      this.time.addEvent({
        delay: cfg.delay,
        startAt: wi * 180,
        loop: true,
        callback: () => {
          if (!this.isAnomalyActiveAt(x)) return;
          const ring = this.add.circle(x, cy + 40, 10, cfg.color, 0).setDepth(7);
          ring.setStrokeStyle(cfg.sw, cfg.color, 0.85);
          this.tweens.add({
            targets: ring,
            scaleX: cfg.maxSX,
            scaleY: cfg.maxSY,
            alpha: 0,
            duration: cfg.dur,
            ease: "Sine.easeOut",
            onComplete: () => ring.destroy()
          });
        }
      });
    });

    // 두 발생원 간섭 파동
    [-70, 70].forEach((dx, si) => {
      this.time.addEvent({
        delay: 900,
        startAt: si * 450,
        loop: true,
        callback: () => {
          if (!this.isAnomalyActiveAt(x)) return;
          const ring = this.add.circle(x + dx, cy + 50, 6, 0x90d0ff, 0).setDepth(6);
          ring.setStrokeStyle(2, 0x90d0ff, 0.6);
          this.tweens.add({
            targets: ring,
            scaleX: 7,
            scaleY: 4.5,
            alpha: 0,
            duration: 1600,
            ease: "Sine.easeOut",
            onComplete: () => ring.destroy()
          });
        }
      });
    });

    // 빛 입자 흩날림
    this.add.particles(x, cy + 40, "spark", {
      speed: { min: 20, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: { min: 1500, max: 3500 },
      frequency: 90,
      quantity: 3,
      tint: [0x0050c0, 0x1a7fc0, 0x60b8f8, 0xaadcff, 0xffffff],
      emitZone: { type: "random", source: new Phaser.Geom.Ellipse(0, 0, 240, 160) }
    }).setDepth(8);
  }

  // 3구역: 유도 이상장 — 번개 + 전자기장 폭주
  addElectricAnomaly(x) {
    const cy = 555;
    this.addDoorAnomalyShell(x, 0x50ff80, "electric");

    // 전자기장 배경 글로우
    const field = this.add.rectangle(x, cy + 100, 200, 260, 0x20e060, 0.08).setDepth(4);
    this.tweens.add({
      targets: field,
      alpha: { from: 0.08, to: 0.22 },
      yoyo: true,
      repeat: -1,
      duration: 500
    });

    // 위로 튀는 메인 스파크 (대량)
    this.add.particles(x, cy + 20, "spark", {
      speedX: { min: -120, max: 120 },
      speedY: { min: -260, max: -60 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 250, max: 700 },
      frequency: 35,
      quantity: 4,
      tint: [0x20c050, 0x50ff80, 0xaaffcc, 0xffffff, 0x20ff60],
      gravityY: 180
    }).setDepth(9);

    // 바닥 튀는 스파크
    this.add.particles(x, cy + 180, "spark", {
      speedX: { min: -80, max: 80 },
      speedY: { min: -60, max: 20 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 150, max: 400 },
      frequency: 55,
      quantity: 2,
      tint: [0x50ff80, 0xaaffcc],
      gravityY: 100
    }).setDepth(9);

    // 번개 볼트 (빈번하게)
    this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        if (!this.isAnomalyActiveAt(x)) return;
        if (Math.random() > 0.6) return;
        this.drawLightningBolt(
          x + Phaser.Math.Between(-60, 60),
          cy - 10,
          cy + Phaser.Math.Between(100, 260)
        );
      }
    });

    // 전기 펄스 링 (빠르게 확산)
    [0, 350, 700].forEach((startAt) => {
      this.time.addEvent({
        delay: 800,
        startAt,
        loop: true,
        callback: () => {
          if (!this.isAnomalyActiveAt(x)) return;
          const ring = this.add.circle(x, cy + 80, 14, 0x20e060, 0).setDepth(7);
          ring.setStrokeStyle(3, 0x50ff80, 0.9);
          this.tweens.add({
            targets: ring,
            scaleX: 8,
            scaleY: 5,
            alpha: 0,
            duration: 550,
            ease: "Power3.easeOut",
            onComplete: () => ring.destroy()
          });
        }
      });
    });

    // 자기장선 — 수평 호 형태로 흐름
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        if (!this.isAnomalyActiveAt(x)) return;
        const sy = cy + Phaser.Math.Between(30, 200);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const line = this.add.rectangle(x - dir * 80, sy, 4, 2, 0x20e060, 0.8).setDepth(8);
        this.tweens.add({
          targets: line,
          x: x + dir * 80,
          alpha: 0,
          scaleX: 0.2,
          duration: 700,
          ease: "Sine.easeIn",
          onComplete: () => line.destroy()
        });
      }
    });
  }

  addDataGrid() {
    const W = 2400;

    for (let i = 0; i < 40; i++) {
      const mote = this.add.circle(
        Phaser.Math.Between(80, W - 80),
        Phaser.Math.Between(190, 830),
        Phaser.Math.FloatBetween(1.2, 2.8),
        0xfff4c7,
        Phaser.Math.FloatBetween(0.12, 0.28)
      ).setDepth(2);

      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(18, 42),
        alpha: { from: mote.alpha, to: 0.04 },
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(2600, 5200),
        delay: Phaser.Math.Between(0, 2200),
        ease: "Sine.easeInOut"
      });
    }

    this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: () => {
        if (Math.random() > 0.28) return;
        const chalk = this.add.circle(
          Phaser.Math.Between(640, 1080),
          Phaser.Math.Between(52, 130),
          Phaser.Math.FloatBetween(1.2, 2.2),
          0xeaf6df,
          0.42
        ).setDepth(5);
        this.tweens.add({
          targets: chalk,
          y: chalk.y + Phaser.Math.Between(18, 46),
          x: chalk.x + Phaser.Math.Between(-18, 18),
          alpha: 0,
          duration: Phaser.Math.Between(900, 1800),
          ease: "Sine.easeOut",
          onComplete: () => chalk.destroy()
        });
      }
    });
  }

  startGlitchEffect() {
    const scheduleNext = () => {
      this.time.delayedCall(Phaser.Math.Between(3000, 6500), () => {
        this.triggerGlitch();
        scheduleNext();
      });
    };
    scheduleNext();
  }

  triggerGlitch() {
    const steps = [
      { dx: -4, dy: 0, tint: 0xff0040 },
      { dx: 5, dy: 1, tint: 0x00ffdd },
      { dx: -2, dy: -1, tint: 0xff0040 },
      { dx: 3, dy: 0, tint: 0x00ffdd },
      { dx: -1, dy: 1, tint: 0xff0040 },
      { dx: 0, dy: 0, tint: null }
    ];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        this.badgeTexts.forEach(([txt, ox, oy]) => {
          txt.clearTint();
          txt.setPosition(ox, oy);
        });
        return;
      }
      const s = steps[i++];
      this.badgeTexts.forEach(([txt, ox, oy]) => {
        txt.setPosition(ox + s.dx, oy + s.dy);
        s.tint !== null ? txt.setTint(s.tint) : txt.clearTint();
      });
      this.time.delayedCall(55, tick);
    };
    tick();
  }

  // 번개 볼트 그리기 (분기 포함)
  drawLightningBolt(x, y1, y2) {
    const bolt = this.add.graphics().setDepth(11);
    const segs = 10;
    const pts = [{ x, y: y1 }];
    const segH = (y2 - y1) / segs;
    for (let i = 1; i < segs; i++) {
      pts.push({ x: x + Phaser.Math.Between(-28, 28), y: y1 + segH * i });
    }
    pts.push({ x: x + Phaser.Math.Between(-10, 10), y: y2 });

    // 흰색 코어
    bolt.lineStyle(3, 0xffffff, 1);
    bolt.beginPath();
    bolt.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => bolt.lineTo(p.x, p.y));
    bolt.strokePath();

    // 초록 외곽
    bolt.lineStyle(6, 0x30ff70, 0.45);
    bolt.beginPath();
    bolt.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => bolt.lineTo(p.x, p.y));
    bolt.strokePath();

    // 분기
    if (Math.random() > 0.35) {
      const bi = Phaser.Math.Between(2, segs - 2);
      const bp = pts[bi];
      bolt.lineStyle(1.5, 0xaaffcc, 0.75);
      bolt.beginPath();
      bolt.moveTo(bp.x, bp.y);
      bolt.lineTo(bp.x + Phaser.Math.Between(-50, 50), bp.y + Phaser.Math.Between(25, 70));
      bolt.strokePath();
    }

    this.tweens.add({
      targets: bolt,
      alpha: 0,
      duration: 180,
      onComplete: () => bolt.destroy()
    });
  }

  getZoneTexture(mission) {
    const idx = manifest.missions.indexOf(mission);
    return ['simul-zone1', 'simul-zone2', 'simul-zone3'][idx] ?? 'simul-base';
  }

  getPlayerScaleForTexture(key = this.currentSimulTexture) {
    const texture = this.textures.get(key);
    const source = texture?.getSourceImage();
    const w = source?.width || this.player.width || 90;
    const h = source?.height || this.player.height || 90;
    return Math.min(112 / w, 96 / h);
  }

  getPlayerFacingSign(key = this.currentSimulTexture, vx = 0) {
    if (key === 'simul-base' || key === 'simul-idle' || key === 'simul-present') {
      return vx < -4 ? -1 : 1;
    }
    return vx >= -4 ? -1 : 1;
  }

  applyPlayerTexture(key, vx = 0) {
    this.player.setTexture(key);
    const sc = this.getPlayerScaleForTexture(key);
    const sign = this.getPlayerFacingSign(key, vx);
    this.player.setScale(sc * sign, sc);
    this.player.setFlipX(false);
    this.player.body.setSize(44, 60);
    this.player.body.setOffset(18, 15);
    return { sc, sign };
  }

  switchSimulTexture(key) {
    if (this.playerTransforming) return;
    this.playerTransforming = true;
    this.currentSimulTexture = key;

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      scaleX: 0,
      scaleY: Math.abs(this.player.scaleY),
      duration: 120,
      ease: 'Power2.easeIn',
      onComplete: () => {
        const { sc, sign } = this.applyPlayerTexture(key);

        const targetScaleX = sc * sign;
        this.player.scaleX = 0;
        this.player.scaleY = sc;
        this.tweens.add({
          targets: this.player,
          alpha: 1,
          scaleX: targetScaleX,
          scaleY: sc,
          duration: 180,
          ease: 'Back.easeOut',
          onComplete: () => { this.playerTransforming = false; }
        });
      }
    });
  }

  setSimulPresenting(active) {
    if (active) {
      // 아이들 타이머 취소, 현재 상태 저장
      if (this.idleTimer) { this.idleTimer.remove(false); this.idleTimer = null; }
      this.preOverlayTexture = this.isIdle ? this.preIdleTexture : this.currentSimulTexture;
      this.isIdle = false;
      // 씬이 곧 pause되므로 tween 없이 즉시 교체
      this.applyPlayerTexture('simul-present');
      this.currentSimulTexture = 'simul-present';
    } else {
      // 씬이 resume된 직후 호출 — tween으로 자연스럽게 복귀
      this.switchSimulTexture(this.preOverlayTexture);
    }
  }

  focusMission(missionId) {
    const portal = this.portalEntries.find((entry) => entry.mission.id === missionId);
    if (!portal) return;
    this.selectedPortalId = missionId;
    this.cameras.main.pan(portal.x, portal.y, 420, "Sine.easeInOut");
    this.tweens.add({
      targets: portal.glow,
      alpha: 0.35,
      yoyo: true,
      duration: 180,
      repeat: 2
    });
  }

  findNearbyPortal() {
    let match = null;

    this.portalEntries.forEach((entry) => {
      const dx = Math.abs(this.player.x - entry.x);
      const dy = Math.abs(this.player.y - entry.y);
      const insideDoorMat = dx <= entry.triggerHalfWidth && dy <= entry.triggerHalfHeight;

      if (insideDoorMat) {
        const score = dx / entry.triggerHalfWidth + dy / entry.triggerHalfHeight;
        if (!match || score < match.score) {
          match = { entry, score };
        }
      }
    });

    return match?.entry || null;
  }

  update() {
    if (!this.player || hubController.overlayOpen || this.playerLocked) {
      if (this.player) this.player.setVelocity(0, 0);
      return;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const speed = 300;
    let vx = 0;
    let vy = 0;

    if (left) vx -= speed;
    if (right) vx += speed;
    if (up) vy -= speed;
    if (down) vy += speed;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);

    // 아이들 상태 추적
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      if (this.idleTimer) { this.idleTimer.remove(false); this.idleTimer = null; }
      if (this.isIdle) {
        this.isIdle = false;
        this.switchSimulTexture(this.preIdleTexture);
      }
    } else if (!this.isIdle && !this.idleTimer && !this.playerTransforming) {
      this.idleTimer = this.time.delayedCall(3500, () => {
        this.idleTimer = null;
        if (!this.playerTransforming) {
          this.preIdleTexture = this.currentSimulTexture;
          this.isIdle = true;
          this.switchSimulTexture('simul-idle');
        }
      });
    }

    if (!this.playerTransforming) {
      const sc = this.getPlayerScaleForTexture(this.currentSimulTexture);
      const sign = this.getPlayerFacingSign(this.currentSimulTexture, vx);
      this.player.setScale(sc * sign, sc);
      this.player.setFlipX(false);
    }
    if (this.playerGlow) {
      this.playerGlow.setPosition(this.player.x, this.player.y + 22);
      this.playerGlow.setAlpha(vx !== 0 || vy !== 0 ? 0.26 : 0.16);
    }
    if (this.playerName) {
      this.playerName.setPosition(this.player.x, this.player.y + 52);
    }

    const nearbyPortal = this.findNearbyPortal();
    if (nearbyPortal?.mission.id !== this.activePortal?.mission.id) {
      this.activePortal = nearbyPortal;
      setHint(nearbyPortal?.mission || null);
      const newTex = nearbyPortal ? this.getZoneTexture(nearbyPortal.mission) : 'simul-base';
      if (this.currentSimulTexture !== newTex) {
        if (this.idleTimer) { this.idleTimer.remove(false); this.idleTimer = null; }
        this.isIdle = false;
        this.switchSimulTexture(newTex);
      }
    }

    if (this.activePortal && (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER))) {
      const id = this.activePortal.mission.id;
      if (!hubController.anomalySolved.has(id)) {
        this.launchAnomalyScene(this.activePortal.mission);
      } else {
        openMission(this.activePortal.mission);
      }
    }
  }
}

function triggerAllClearSequence() {
  setTimeout(() => {
    hubController.scene?.triggerAllClearEffect();
  }, 600);

  setTimeout(() => {
    showEndingOverlay();
  }, 3400);
}

function showEndingOverlay() {
  const overlay = document.getElementById("endingOverlay");
  const grid = document.getElementById("endingMissions");

  const fieldColors = {
    "역학":   { bg: "rgba(255,64,32,0.1)",   border: "rgba(255,64,32,0.38)",   text: "#ff6040" },
    "파동":   { bg: "rgba(74,174,255,0.1)",  border: "rgba(74,174,255,0.38)",  text: "#4aaeff" },
    "전자기": { bg: "rgba(48,238,120,0.1)",  border: "rgba(48,238,120,0.38)",  text: "#30ee78" }
  };

  grid.innerHTML = "";
  manifest.missions.forEach((mission, i) => {
    const col = fieldColors[mission.field] ?? {
      bg: "rgba(80,160,220,0.1)", border: "rgba(80,160,220,0.35)", text: "#4aaddd"
    };
    const card = document.createElement("div");
    card.className = "ending-mission-card";
    card.style.animationDelay = `${0.5 + i * 0.13}s`;
    card.innerHTML = `
      <span class="ending-mission-field" style="background:${col.bg};border:1px solid ${col.border};color:${col.text}">${mission.field}</span>
      <p class="ending-mission-title">${mission.title}</p>
      <div class="ending-mission-resolved">해결됨</div>
    `;
    grid.appendChild(card);
  });

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

document.getElementById("endingClose").addEventListener("click", () => {
  document.getElementById("endingOverlay").classList.add("hidden");
  document.getElementById("endingOverlay").setAttribute("aria-hidden", "true");
  if (hubController.scene) hubController.scene.playerLocked = false;
  startChallengeMode();
});

function startChallengeMode() {
  hubController.challengeActive = true;
  hubController.challengeScore = 0;
  hubController.pendingLevelUp = null;
  hubController.missionLevels = {};
  manifest.missions.forEach(m => { hubController.missionLevels[m.id] = 1; });
  document.getElementById("challengeHud").classList.remove("hidden");
  updateChallengeHUD();
  hubController.scene?.enterChallengeMode(hubController.missionLevels);
}

function checkMissionLevelUp(missionId) {
  const mission = manifest.missions.find(m => m.id === missionId);
  const currentLv = hubController.missionLevels[missionId] || 1;
  if (currentLv < 5) {
    const newLv = currentLv + 1;
    hubController.missionLevels[missionId] = newLv;
    hubController.scene?.updateChallengePortalLevel(missionId, newLv);
    const isNowMax = newLv === 5;
    showLevelUpToast(isNowMax
      ? `${mission?.field ?? missionId} · MAX 달성!`
      : `${mission?.field ?? missionId} · LV.${newLv} 해금`);
    if (isNowMax) checkAllMax();
  } else {
    showLevelUpToast(`${mission?.field ?? missionId} · MAX · +500pts`);
  }
  updateChallengeHUD();
}

function checkAllMax() {
  const allMax = manifest.missions.every(m => (hubController.missionLevels[m.id] || 1) >= 5);
  if (!allMax) return;
  setTimeout(() => {
    showLevelUpToast('전 구역 MAX 달성!');
    hubController.scene?.triggerAllMaxEffect();
  }, 3500);
}

function updateChallengeHUD() {
  const scEl = document.getElementById("challengeScoreText");
  const lvRow = document.getElementById("challengeLevelsRow");
  if (scEl) scEl.textContent = `${hubController.challengeScore.toLocaleString()} pts`;
  if (lvRow) {
    lvRow.innerHTML = manifest.missions.map(m => {
      const lv = hubController.missionLevels[m.id] || 1;
      const isMax = lv >= 5;
      return `<span class="challenge-lv-pill${isMax ? ' is-max' : ''}">${m.field} <b>${isMax ? 'MAX' : `LV.${lv}`}</b></span>`;
    }).join('');
  }
}

function showLevelUpToast(msg) {
  const toast = document.getElementById("levelUpToast");
  const text = document.getElementById("levelUpText");
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.remove("hidden", "toast-out");
  toast.classList.add("toast-in");
  setTimeout(() => {
    toast.classList.remove("toast-in");
    toast.classList.add("toast-out");
    setTimeout(() => toast.classList.add("hidden"), 600);
  }, 2800);
}

setHint(null);
updateAnomalyStatus();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "gameRoot",
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#f3ead9",
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [HubScene, GravityScene, LightScene, EMScene]
});
