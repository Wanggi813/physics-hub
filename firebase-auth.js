import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
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
const firebaseConfig = {
  apiKey: "AIzaSyCO36JgPpNz8swADxTMVJUFVALWM5o171w",
  authDomain: "simulation-67cd3.firebaseapp.com",
  projectId: "simulation-67cd3",
  storageBucket: "simulation-67cd3.appspot.com",
  messagingSenderId: "615983461615",
  appId: "1:615983461615:web:002e07bcea878eb6d5571a",
  measurementId: "G-9RGN7LYE5W"
};

const app = initializeApp(firebaseConfig);
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Firebase Analytics 초기화 실패 (지원되지 않는 환경일 수 있음):", e);
}
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentScore = 0;
let currentUserIdText = ""; // Firestore에 저장된 ID (혹은 email 앞부분)

// ====================== 랭크 메타 / 이미지 / 이름 ======================

// 파일명 → 영어 이름 / 대표 색상
const rankMeta = {
  "아이언.png":         { en: "IRON",        color: "#594946" },
  "브론즈.png":         { en: "BRONZE",      color: "#593C39" },
  "실버.png":           { en: "SILVER",      color: "#A3B4BF" },
  "골드.png":           { en: "GOLD",        color: "#FBEBBC" },
  "에메랄드.png":       { en: "EMERALD",     color: "#7ABFB3" },
  "다이아.png":     { en: "DIAMOND",     color: "#BBE8F2" },
  "마스터.png":         { en: "MASTER",      color: "#885BA6" },
  "그랜드마스터.png":   { en: "GRANDMASTER", color: "#A62626" },
  "챌린저.png":         { en: "CHALLENGER",  color: "#6CA6D9" }
};

// 점수 → 랭크 이미지 파일명
function getRankImageFile(score) {
  const s = Number(score) || 0;

  if (s < 500)   return "아이언.png";
  if (s < 1000)  return "브론즈.png";
  if (s < 2000)  return "실버.png";
  if (s < 3500)  return "골드.png";
  if (s < 5000)  return "에메랄드.png";
  if (s < 7000)  return "다이아.png";
  if (s < 9000)  return "마스터.png";
  if (s < 10000) return "그랜드마스터.png";
  return "챌린저.png";
}

// 이미지와 아래 영어 이름/색상 적용
function applyRankImage(score) {
  const imgEl  = document.getElementById("rank-img");
  const nameEl = document.getElementById("rank-name");
  if (!imgEl || !nameEl) return;

  const fileName = getRankImageFile(score);
  imgEl.src = `./rank/${fileName}`;

  const meta = rankMeta[fileName];
  if (meta) {
    nameEl.textContent = meta.en;
    nameEl.style.color = meta.color;
  } else {
    nameEl.textContent = "";
  }
}

// 점수/아이디 표시 + 랭크 이미지 업데이트
function updateInfoPanel() {
  const infoSec   = document.getElementById("info-section");
  const idLabel   = document.getElementById("info-id-label");
  const scoreBig  = document.getElementById("info-score-big");

  if (!infoSec) return;

  if (currentUser) {
    const idText      = currentUserIdText || (currentUser.email ? currentUser.email.split("@")[0] : "");
    const scoreToShow = currentScore || 0;

    if (idLabel)  idLabel.textContent  = "아이디: " + idText;
    if (scoreBig) scoreBig.textContent = scoreToShow + "점";

    applyRankImage(scoreToShow);
  } else {
    if (idLabel)  idLabel.textContent  = "아이디: -";
    if (scoreBig) scoreBig.textContent = "0점";
    applyRankImage(0); // 로그아웃 상태에서는 기본 랭크(0점 기준)
  }
}

// ====================== 로그인 / 로그아웃 ======================

async function login() {
  const userId = document.getElementById("loginId").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!userId) {
    alert("아이디를 입력해 주세요 (선생님이 준 ID).");
    return;
  }
  if (!password) {
    alert("비밀번호를 입력해 주세요.");
    return;
  }

  // 현재 구조: 아이디 + 고정 도메인
  const email = userId + "@myapp.local";
  console.log("[login] 시도 이메일:", email);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("로그인 성공: " + userId);
  } catch (err) {
    console.error("[login] 실패:", err.code, err.message);
    alert("로그인 오류: " + err.message);
  }
}

async function logout() {
  await signOut(auth);
  alert("로그아웃 완료");
}

// ====================== 점수 불러오기 / 저장 ======================

// (새) 시뮬레이션 점수 합산 불러오기
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

    // 합산 실패 시 예전 scores 컬렉션에서 불러오기
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

// 점수 저장 (총점 기준)
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

// 필요시 호출용 포인트 추가 함수
async function addPoint() {
  if (!currentUser) {
    alert("로그인 후 사용하세요!");
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
  const loginSec   = document.getElementById("login-section");
  const changeSec  = document.getElementById("change-section");
  const infoSec    = document.getElementById("info-section");
  const changeIdInput = document.getElementById("changeId");
  const pwStatus   = document.getElementById("pw-status");

  if (loginSec)  loginSec.style.display  = "none";
  if (infoSec)   infoSec.style.display   = "none";
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
  const loginSec   = document.getElementById("login-section");
  const changeSec  = document.getElementById("change-section");
  const infoSec    = document.getElementById("info-section");
  const pwStatus   = document.getElementById("pw-status");

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

// 비밀번호 변경
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
    alert("로그인 후 비밀번호를 변경할 수 있습니다.");
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
    document.getElementById("changeCurrentPassword").value = "";
    document.getElementById("changeNewPassword").value = "";
    alert("비밀번호가 변경되었습니다.");
  } catch (err) {
    console.error("비밀번호 변경 오류:", err);
    let msg = "비밀번호 변경 중 오류가 발생했습니다.";
    if (err.code === "auth/wrong-password") {
      msg = "현재 비밀번호가 올바르지 않습니다.";
    }
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.classList.add("err");
    }
    alert(msg);
  }
}

// ====================== 로그인 상태 감지 ======================

onAuthStateChanged(auth, async (user) => {
  // ✅ 이 페이지는 익명 로그인 금지 (익명이면 즉시 로그아웃)
  if (user && user.isAnonymous) {
    alert("이 페이지는 로그인 후에만 이용할 수 있어요.");
    await signOut(auth);
    return;
  }

  const statusEl = document.getElementById("status");
  const scoreEl  = document.getElementById("score");
  const logoutBtn = document.getElementById("logout-btn");
  const openBtn   = document.getElementById("open-auth");
  const suggBtn   = document.getElementById("btn-sugg");

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

    const infoSec   = document.getElementById("info-section");
    const loginSec  = document.getElementById("login-section");
    const changeSec = document.getElementById("change-section");
    if (infoSec)  infoSec.style.display  = "flex";
    if (loginSec) loginSec.style.display = "none";
    if (changeSec) changeSec.style.display = "none";

    await loadScore(user);
    updateInfoPanel();
  } else {
    currentUser = null;
    currentUserIdText = "";
    currentScore = 0;

    if (statusEl) statusEl.innerText = "로그인 상태: 없음";
    if (scoreEl)  scoreEl.innerText  = "0";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (openBtn) openBtn.textContent = "로그인";

    const infoSec   = document.getElementById("info-section");
    const loginSec  = document.getElementById("login-section");
    const changeSec = document.getElementById("change-section");
    if (infoSec)  infoSec.style.display  = "none";
    if (loginSec) loginSec.style.display = "flex";
    if (changeSec) changeSec.style.display = "none";

    updateInfoPanel();
  }
});

// ====================== 전역 함수 등록 (onclick에서 사용) ======================
window.login = login;
window.logout = logout;
window.addPoint = addPoint;
window.changePassword = changePassword;
window.openChangeMode = openChangeMode;
window.closeChangeMode = closeChangeMode;

// 1. 모달 열기/닫기
function openSugg() {
  const m = document.getElementById("modal-sugg");
  if(m) m.style.display = "flex";
}
function closeSugg() {
  const m = document.getElementById("modal-sugg");
  if(m) m.style.display = "none";
  document.getElementById("s-title").value = "";
  document.getElementById("s-content").value = "";
}

// 2. 파이어베이스로 전송
async function sendSugg() {
  if (!currentUser) { alert("로그인이 필요합니다."); return; }
  
  const title = document.getElementById("s-title").value.trim();
  const content = document.getElementById("s-content").value.trim();
  
  if (!title || !content) { alert("제목과 내용을 모두 적어주세요."); return; }

  try {
    // Firestore 'suggestions' 컬렉션에 저장
    await addDoc(collection(db, "suggestions"), {
      uid: currentUser.uid,
      writerID: currentUserIdText, // 학생 ID (예: s1A_01)
      title: title,
      content: content,
      date: serverTimestamp()
    });
    alert("소중한 의견이 선생님께 전달되었습니다!");
    closeSugg();
  } catch (err) {
    console.error(err);
    alert("오류 발생: " + err.message);
  }
}

// 3. HTML에서 쓸 수 있게 등록
window.openSugg = openSugg;
window.closeSugg = closeSugg;
window.sendSugg = sendSugg;

