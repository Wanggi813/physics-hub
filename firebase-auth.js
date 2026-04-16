import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ====================== Firebase 기본 설정 ======================
// ✅ 환경 변수 사용 (보안 개선)
const firebaseConfig = {
  apiKey: window.APP_CONFIG?.FIREBASE_API_KEY,
  authDomain: window.APP_CONFIG?.FIREBASE_AUTH_DOMAIN,
  projectId: window.APP_CONFIG?.FIREBASE_PROJECT_ID,
  storageBucket: window.APP_CONFIG?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.APP_CONFIG?.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.APP_CONFIG?.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentScore = 0;
let currentUserIdText = "";
let currentRankIdx = -1; // 랭크업 감지용 (-1 = 첫 로드)
let justLoggedIn = false; // 로그인 직후 패널 자동 닫힘용

// ====================== 토스트 알림 ======================
function showToast(msg, type = 'info') {
  const prev = document.querySelector('.toast');
  if (prev) { clearTimeout(prev._timer); prev.remove(); }

  const el = document.createElement('div');
  el.className = 'toast' + (type !== 'info' ? ' ' + type : '');
  el.textContent = msg;
  document.body.appendChild(el);

  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

  el._timer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

// ====================== 랭크 메타 / 이미지 / 이름 ======================

const rankTiers = [
  { file: "아이언.png",       en: "IRON",        ko: "아이언",       color: "#8c7b79", from: 0,     to: 500   },
  { file: "브론즈.png",       en: "BRONZE",       ko: "브론즈",       color: "#cd7f46", from: 500,   to: 1000  },
  { file: "실버.png",         en: "SILVER",       ko: "실버",         color: "#A3B4BF", from: 1000,  to: 2000  },
  { file: "골드.png",         en: "GOLD",         ko: "골드",         color: "#f5c842", from: 2000,  to: 5000  },
  { file: "에메랄드.png",     en: "EMERALD",      ko: "에메랄드",     color: "#7ABFB3", from: 5000,  to: 7000  },
  { file: "다이아.png",       en: "DIAMOND",      ko: "다이아",       color: "#BBE8F2", from: 7000,  to: 9000  },
  { file: "마스터.png",       en: "MASTER",       ko: "마스터",       color: "#b06fe8", from: 9000,  to: 11000 },
  { file: "그랜드마스터.png", en: "GRANDMASTER",  ko: "그랜드마스터", color: "#e85252", from: 11000, to: 15000 },
  { file: "챌린저.png",       en: "CHALLENGER",   ko: "챌린저",       color: "#6CA6D9", from: 15000, to: null  },
];

// 하위 호환 유지용
const rankMeta = Object.fromEntries(rankTiers.map(r => [r.file, { en: r.en, color: r.color }]));

function getRankImageFile(score) {
  const s = Number(score) || 0;
  const tier = rankTiers.slice().reverse().find(r => s >= r.from);
  return tier ? tier.file : "아이언.png";
}

function getRankProgress(score) {
  const s = Number(score) || 0;
  const idx = rankTiers.findIndex(r => r.to === null || s < r.to);
  const tier = rankTiers[idx];
  if (!tier || tier.to === null) {
    return { pct: 100, remaining: 0, nextKo: null, color: rankTiers[rankTiers.length - 1].color };
  }
  const pct = Math.min(100, Math.round(((s - tier.from) / (tier.to - tier.from)) * 100));
  const next = rankTiers[idx + 1];
  return { pct, remaining: tier.to - s, nextKo: next ? next.ko : null, color: tier.color };
}

// C: 폭죽(confetti) 이펙트
function launchConfetti(rankColor) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // 랭크 컬러 기반 팔레트 (메인색 + 밝은 변형 + 흰색)
  const hex = rankColor.replace("#", "");
  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
  const lighter = `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`;
  const palette = [rankColor, lighter, "#ffffff", rankColor, "#ffffff", lighter];

  const COUNT = 160;
  const cx = canvas.width / 2;
  const particles = Array.from({ length: COUNT }, (_, i) => {
    const angle = (Math.random() * 2 - 1) * Math.PI; // 왼쪽↔오른쪽 부채꼴
    const speed = 6 + Math.random() * 12;
    return {
      x: cx + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.35,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed) - 4, // 항상 위로 터짐
      w: 7 + Math.random() * 7,
      h: 3 + Math.random() * 4,
      color: palette[i % palette.length],
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
      gravity: 0.35 + Math.random() * 0.2,
    };
  });

  const DURATION = 2800;
  let start = null;
  function animate(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const alpha = Math.max(0, 1 - elapsed / DURATION);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.vy += p.gravity;
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.rotV;
      if (p.y > canvas.height + 20) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < DURATION) requestAnimationFrame(animate);
    else canvas.remove();
  }
  requestAnimationFrame(animate);
}

// A: 점수 카운트업
function animateCount(el, target, duration = 1300) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * ease).toLocaleString() + "점";
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString() + "점";
  }
  requestAnimationFrame(step);
}

// 패널 열릴 때 호출 — A·E·진행 바 동시 재생
window.playRankOpenAnimation = function () {
  // A: 카운트업
  const scoreBig = document.getElementById("info-score-big");
  if (scoreBig && currentScore >= 0) animateCount(scoreBig, currentScore);

  // E: bounce-in → floating 전환
  const imgEl = document.getElementById("rank-img");
  if (imgEl) {
    imgEl.classList.remove("rank-bounce", "rank-floating");
    void imgEl.offsetWidth; // reflow로 애니메이션 리셋
    imgEl.classList.add("rank-bounce");
    setTimeout(() => {
      imgEl.classList.remove("rank-bounce");
      imgEl.classList.add("rank-floating");
    }, 900);
  }

  // 진행 바 재생
  const barEl = document.getElementById("rank-progress-bar");
  if (barEl && barEl.dataset.targetPct) {
    barEl.style.width = "0%";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { barEl.style.width = barEl.dataset.targetPct; });
    });
  }
};

function applyRankImage(score) {
  const imgEl     = document.getElementById("rank-img");
  const nameEl    = document.getElementById("rank-name");
  const barEl     = document.getElementById("rank-progress-bar");
  const nextEl    = document.getElementById("rank-next-info");
  const curSmall  = document.getElementById("rank-cur-small");
  const nextSmall = document.getElementById("rank-next-img");
  const wrapEl    = document.getElementById("rank-card-wrap");

  if (!imgEl || !nameEl) return;

  const s = Number(score) || 0;
  const idx = rankTiers.findIndex(r => r.to === null || s < r.to);
  const tier = rankTiers[Math.max(0, idx)];
  const nextTier = rankTiers[idx + 1] ?? null;

  // C: 랭크업 감지 → 폭죽 (첫 로드 제외)
  if (currentRankIdx !== -1 && idx > currentRankIdx) {
    setTimeout(() => launchConfetti(tier.color), 400);
  }
  currentRankIdx = idx;

  imgEl.src = `./rank/${tier.file}`;
  if (curSmall) curSmall.src = `./rank/${tier.file}`;

  nameEl.textContent = tier.en;
  nameEl.style.color = tier.color;

  // C: 회전 테두리 색상 설정
  if (wrapEl) wrapEl.style.setProperty("--rc", tier.color);

  if (nextSmall) {
    if (nextTier) {
      nextSmall.src = `./rank/${nextTier.file}`;
      nextSmall.style.display = "";
    } else {
      nextSmall.style.display = "none";
    }
  }

  const { pct, remaining, nextKo, color } = getRankProgress(score);

  if (barEl) {
    barEl.dataset.targetPct = pct + "%";
    barEl.style.background = color;
    barEl.style.boxShadow = `0 0 8px ${color}88`;
    barEl.style.width = pct + "%";
  }

  if (nextEl) {
    if (nextKo) {
      const badge = pct >= 80 ? `<span class="rank-promo-badge">🔥 승급 임박!</span> ` : "";
      nextEl.innerHTML = `${badge}<span class="rank-next-pct">${pct}%</span> <span class="rank-next-txt">${nextKo}까지 <strong>${remaining.toLocaleString()}점</strong> 남았어요!</span>`;
    } else {
      nextEl.innerHTML = `<span class="rank-next-txt">🏆 최고 랭크 달성!</span>`;
    }
  }
}

function updateInfoPanel() {
  const infoSec = document.getElementById("info-section");
  const idLabel = document.getElementById("info-id-label");
  const scoreBig = document.getElementById("info-score-big");

  if (!infoSec) return;

  if (currentUser) {
    const idText = currentUserIdText || (currentUser.email ? currentUser.email.split("@")[0] : "");
    const scoreToShow = currentScore || 0;

    if (idLabel) idLabel.textContent = "아이디: " + idText;
    if (scoreBig) scoreBig.textContent = scoreToShow + "점";

    applyRankImage(scoreToShow);
  } else {
    if (idLabel) idLabel.textContent = "아이디: -";
    if (scoreBig) scoreBig.textContent = "0점";
    applyRankImage(0);
  }
}

// ====================== 로그인 / 로그아웃 ======================

async function login() {
  const userId = document.getElementById("loginId").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!userId) {
    showToast("아이디를 입력해 주세요.", 'err');
    return;
  }
  if (!password) {
    showToast("비밀번호를 입력해 주세요.", 'err');
    return;
  }

  const email = userId + "@myapp.local";
  console.log("[login] 시도 이메일:", email);

  try {
    justLoggedIn = true;
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    justLoggedIn = false;
    console.error("[login] 실패:", err.code, err.message);
    const code = err.code;
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      showToast("아이디 또는 비밀번호가 올바르지 않습니다.", 'err');
    } else if (code === 'auth/too-many-requests') {
      showToast("시도 횟수 초과. 잠시 후 다시 시도해 주세요.", 'err');
    } else {
      showToast("로그인에 실패했습니다.", 'err');
    }
  }
}

async function logout() {
  await signOut(auth);
  showToast("로그아웃 완료");
}

// ====================== 점수 불러오기 / 저장 ======================

async function loadScore(user) {
  const scoreEl = document.getElementById("score");
  try {
    const simsRef = collection(db, "users", user.uid, "simulations");
    const simsSnap = await getDocs(simsRef);
    let total = 0;
    simsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const s = Number(data.score ?? 0);
      if (!Number.isNaN(s)) total += s;
    });

    currentScore = total;
    if (scoreEl) scoreEl.innerText = currentScore;

    await saveScore(user, currentScore);
    updateInfoPanel();
  } catch (err) {
    console.error("시뮬레이션 점수 합산 오류:", err);

    try {
      const ref = doc(db, "scores", user.uid);
      const snap = await getDoc(ref);
      currentScore = snap.exists() ? (snap.data().score ?? 0) : 0;
      if (scoreEl) scoreEl.innerText = currentScore;
    } catch (err2) {
      console.error("점수 불러오기(기존) 오류:", err2);
      currentScore = 0;
      if (scoreEl) scoreEl.innerText = "0";
    }

    updateInfoPanel();
  }
}

async function saveScore(user, score) {
  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userId = userDoc.exists()
      ? userDoc.data().ID
      : user.email.split("@")[0];

    const ref = doc(db, "scores", user.uid);
    await setDoc(ref, { score: score, ID: userId }, { merge: true });
  } catch (err) {
    console.error("점수 저장 오류:", err);
  }
}

async function addPoint() {
  if (!currentUser) {
    showToast("로그인 후 사용하세요!", 'err');
    return;
  }
  currentScore += 1;
  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.innerText = currentScore;
  await saveScore(currentUser, currentScore);
  updateInfoPanel();
}

// ====================== 비밀번호 변경 패널 ======================

function openChangeMode() {
  const loginSec = document.getElementById("login-section");
  const changeSec = document.getElementById("change-section");
  const infoSec = document.getElementById("info-section");
  const changeIdInput = document.getElementById("changeId");
  const pwStatus = document.getElementById("pw-status");

  if (loginSec) loginSec.style.display = "none";
  if (infoSec) infoSec.style.display = "none";
  if (changeSec) changeSec.style.display = "flex";

  if (pwStatus) {
    pwStatus.textContent = "";
    pwStatus.className = "auth-status";
  }

  if (changeIdInput && currentUserIdText) {
    changeIdInput.value = currentUserIdText;
  }
}

function closeChangeMode() {
  const loginSec = document.getElementById("login-section");
  const changeSec = document.getElementById("change-section");
  const infoSec = document.getElementById("info-section");
  const pwStatus = document.getElementById("pw-status");

  if (changeSec) changeSec.style.display = "none";

  if (currentUser && infoSec) {
    infoSec.style.display = "flex";
  } else if (loginSec) {
    loginSec.style.display = "flex";
  }

  if (pwStatus) {
    pwStatus.textContent = "";
    pwStatus.className = "auth-status";
  }
}

async function changePassword() {
  const statusEl = document.getElementById("pw-status");
  const changeId = document.getElementById("changeId").value.trim();
  const curPw = document.getElementById("changeCurrentPassword").value;
  const newPw = document.getElementById("changeNewPassword").value;

  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "auth-status";
  }

  if (!currentUser) {
    if (statusEl) {
      statusEl.textContent = "먼저 로그인해야 합니다.";
      statusEl.classList.add("err");
    }
    return;
  }
  if (!changeId || !curPw || !newPw) {
    if (statusEl) {
      statusEl.textContent = "아이디, 현재 비밀번호, 새 비밀번호를 모두 입력해 주세요.";
      statusEl.classList.add("err");
    }
    return;
  }
  if (currentUserIdText && changeId !== currentUserIdText) {
    if (statusEl) {
      statusEl.textContent = "입력한 아이디가 현재 로그인한 아이디와 다릅니다.";
      statusEl.classList.add("err");
    }
    return;
  }
  if (newPw.length < 6) {
    if (statusEl) {
      statusEl.textContent = "새 비밀번호는 최소 6자리 이상이어야 합니다.";
      statusEl.classList.add("err");
    }
    return;
  }

  try {
    if (statusEl) statusEl.textContent = "비밀번호 변경 중…";

    const cred = EmailAuthProvider.credential(currentUser.email, curPw);
    await reauthenticateWithCredential(currentUser, cred);
    await updatePassword(currentUser, newPw);

    if (statusEl) {
      statusEl.textContent = "비밀번호가 성공적으로 변경되었습니다.";
      statusEl.classList.add("ok");
    }
    document.getElementById("changeId").value = "";
    document.getElementById("changeCurrentPassword").value = "";
    document.getElementById("changeNewPassword").value = "";
    showToast("비밀번호가 변경되었습니다.", 'ok');
  } catch (err) {
    console.error("비밀번호 변경 오류:", err);
    let msg = "비밀번호 변경 중 오류가 발생했습니다.";
    if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      msg = "현재 비밀번호가 올바르지 않습니다.";
    }
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.classList.add("err");
    }
  }
}

// ====================== 로그인 상태 감지 ======================

onAuthStateChanged(auth, async (user) => {
  if (user && user.isAnonymous) {
    showToast("이 페이지는 로그인 후에만 이용할 수 있어요.", 'err');
    await signOut(auth);
    return;
  }

  const statusEl = document.getElementById("status");
  const scoreEl = document.getElementById("score");
  const logoutBtn = document.getElementById("logout-btn");
  const openBtn = document.getElementById("open-auth");
  const suggBtn = document.getElementById("btn-sugg");

  if (user) {
    currentUser = user;
    let displayId = "";

    if (suggBtn) suggBtn.style.display = "inline-flex";

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.ID) {
          displayId = data.ID;
        } else {
          const fallbackId = user.email ? user.email.split("@")[0] : user.uid.slice(0, 6);
          await setDoc(userRef, { ID: fallbackId }, { merge: true });
          displayId = fallbackId;
        }
      } else {
        const fallbackId = user.email ? user.email.split("@")[0] : user.uid.slice(0, 6);
        await setDoc(userRef, { ID: fallbackId });
        displayId = fallbackId;
        if (suggBtn) suggBtn.style.display = "none";
      }
    } catch (err) {
      console.error("ID 불러오기 오류:", err);
      displayId = user.email ? user.email.split("@")[0] : "(ID 불러오기 실패)";
    }

    currentUserIdText = displayId;

    if (statusEl) statusEl.innerText = displayId;
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (openBtn) openBtn.textContent = "내 정보 / 점수";

    const infoSec = document.getElementById("info-section");
    const loginSec = document.getElementById("login-section");
    const changeSec = document.getElementById("change-section");
    if (infoSec) infoSec.style.display = "flex";
    if (loginSec) loginSec.style.display = "none";
    if (changeSec) changeSec.style.display = "none";

    await loadScore(user);
    updateInfoPanel();

    // 로그인 버튼으로 직접 로그인한 경우 패널 자동 닫기
    if (justLoggedIn) {
      justLoggedIn = false;
      showToast(displayId + " 님, 반갑습니다!", 'ok');
      setTimeout(() => window.closeAuthPanel?.(), 400);
    }
  } else {
    currentUser = null;
    currentUserIdText = "";
    currentScore = 0;
    currentRankIdx = -1;

    if (statusEl) statusEl.innerText = "로그인 상태: 없음";
    if (scoreEl) scoreEl.innerText = "0";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (openBtn) openBtn.textContent = "로그인";

    const infoSec = document.getElementById("info-section");
    const loginSec = document.getElementById("login-section");
    const changeSec = document.getElementById("change-section");
    if (infoSec) infoSec.style.display = "none";
    if (loginSec) loginSec.style.display = "flex";
    if (changeSec) changeSec.style.display = "none";

    updateInfoPanel();
  }
});

// ====================== 전역 함수 등록 ======================
window.login = login;
window.logout = logout;
window.addPoint = addPoint;
window.changePassword = changePassword;
window.openChangeMode = openChangeMode;
window.closeChangeMode = closeChangeMode;

// ====================== 건의사항 기능 ======================

function openSugg() {
  const m = document.getElementById("modal-sugg");
  if (m) m.style.display = "flex";
}

function closeSugg() {
  const m = document.getElementById("modal-sugg");
  if (m) m.style.display = "none";
  document.getElementById("s-title").value = "";
  document.getElementById("s-content").value = "";
}

async function sendSugg() {
  if (!currentUser) { showToast("로그인이 필요합니다.", 'err'); return; }

  const title = document.getElementById("s-title").value.trim();
  const content = document.getElementById("s-content").value.trim();

  if (!title || !content) { showToast("제목과 내용을 모두 적어주세요.", 'err'); return; }

  try {
    await addDoc(collection(db, "suggestions"), {
      uid: currentUser.uid,
      writerID: currentUserIdText,
      title: title,
      content: content,
      date: serverTimestamp()
    });
    showToast("소중한 의견이 선생님께 전달되었습니다! 💌", 'ok');
    closeSugg();
  } catch (err) {
    console.error(err);
    showToast("전송 중 오류가 발생했습니다.", 'err');
  }
}

window.openSugg = openSugg;
window.closeSugg = closeSugg;
window.sendSugg = sendSugg;
window.getCurrentUser = () => currentUser;
window.getCurrentUserIdText = () => currentUserIdText;