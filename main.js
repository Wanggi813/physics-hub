/**
 * [스타일 주입]
 * 글래스모피즘 + 진동(Vibration) 효과 + 순차 등장 애니메이션 + [NEW] 로그인 모달 스타일
 */
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
      /* 5. 글래스모피즘 & 카드 기본 스타일 */
      .card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        border-radius: 16px;
        overflow: hidden;
        transition: box-shadow 0.3s ease, transform 0.2s ease;
        position: relative;
      }
  
      @keyframes vibrate {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(-1deg); }
        50% { transform: rotate(1deg); }
        75% { transform: rotate(-0.5deg); }
        100% { transform: rotate(0deg); }
      }
  
      .card:hover {
        animation: vibrate 0.3s linear;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255,255,255,0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .card-entry { opacity: 0; transform: translateY(30px); }
      .card-entry-active {
        opacity: 1; transform: translateY(0);
        transition: opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
      }
  
      /* [NEW] 로그인 모달 & 백드롭 스타일 */
      #auth-backdrop {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(3px);
        z-index: 9998;
        opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
      }
      #auth-backdrop.visible { opacity: 1; pointer-events: auto; }
  
      #auth-panel {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -40%) scale(0.95);
        width: 320px;
        max-width: 90%;
        background: rgba(30, 30, 35, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        padding: 25px;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
  
      #auth-panel.open {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        pointer-events: auto;
      }
    `;
  document.head.appendChild(style);
})();

// ===== 프로젝트 카드 렌더링 (기존 유지) =====
const projects = [
  // ===== ALL =====
  { title: "물리 공식 맞추기", category: "게임", desc: "떨어지는 물리 공식을 맞추자!", tags: ["물리", "공식"], emoji: "❤️", demo: "./simul/물리 공식 맞추기.html", curriculumId: "ALL", thumb: "./thumb_nail/물리 공식 맞추기.png" },

  // ===== 12물리 =====
  { title: "토크와 평형", category: "역학", desc: "여러 물체를 이용해 토크평형 만들기", tags: ["토크", "평형"], emoji: "🧗‍♀️", demo: "./simul/토크와 평형.html", curriculumId: "[12물리01-01]", thumb: "./thumb_nail/토크와_평형.png" },
  { title: "위치와 변위", category: "역학", desc: "선을 그려 이동거리와 변위의 차이를 눈으로 확인하기 (직선 그리기 도전!)", tags: ["이동거리", "변위", "벡터"], emoji: "📏", demo: "./simul/위치와 변위.html", curriculumId: "[12물리01-02]", thumb: "./thumb_nail/위치와 변위.png" },
  { title: "우주 미아 생존기", category: "역학", desc: "공구를 던져 장애물을 피하고 귀환하라! 운동량 보존 법칙 퍼즐 게임", tags: ["운동량보존", "작용반작용", "벡터", "게임"], emoji: "👨‍🚀", demo: "./simul/우주 미아.html", curriculumId: "[12물리01-03]", thumb: "./thumb_nail/우주 미아.png" },
  { title: "일과 운동에너지", category: "역학", desc: "용수철을 이용해 일과 운동에너지 비교하기", tags: ["일", "운동에너지"], emoji: "🧗‍♀️", demo: "./simul/일과 운동에너지.html", curriculumId: "[12물리01-04]", thumb: "./thumb_nail/일과_운동에너지.png" },
  { title: "줄의 실험", category: "열", desc: "줄의 일의 열당량을 알아보기", tags: ["줄", "일의 열당량"], emoji: "🧗‍♀️", demo: "./simul/줄의 실험.html", curriculumId: "[12물리01-05]", thumb: "./thumb_nail/줄의_실험.png" },
  { title: "열역학", category: "열", desc: "등압, 등적, 등온, 단열과정 확인하기", tags: ["열기관", "열과정"], emoji: "🐦‍🔥", demo: "./simul/열역학.html", curriculumId: "[12물리01-06], [12역학02-02]", thumb: "./thumb_nail/열역학.png" },
  { title: "전기장과 등전위면", category: "전자/반도체", desc: "전하가 만드는 전기장과 등전위면을 알아보기", tags: ["전기장", "등전위면"], emoji: "⚡", demo: "./simul/전기장과 등전위면.html", curriculumId: "[12물리02-01], [12전자01-01]", thumb: "./thumb_nail/전기장과_등전위면.png" },
  { title: "옴의 법칙", category: "전자/반도체", desc: "V=IR, 직렬/병렬 에 따른 옴의 법칙 확인하기", tags: ["전압", "전류"], emoji: "⚡", demo: "./simul/옴의 법칙.html", curriculumId: "[12물리02-02]", thumb: "./thumb_nail/옴의_법칙.png" },
  { title: "전자기유도", category: "전자/반도체", desc: "전자기 유도현상과 정류자의 역할 알아보기", tags: ["전자기유도", "정류자"], emoji: "⚡", demo: "./simul/전자기유도.html", curriculumId: "[12물리02-05], [12전자01-05]", thumb: "./thumb_nail/전자기유도.png" },
  { title: "간섭무늬", category: "광학", desc: "파장과 파원의 간격 조절로 간섭 패턴 관찰.", tags: ["파동", "무늬"], emoji: "🎯", demo: "./simul/간섭무늬.html", curriculumId: "[12물리03-01]", thumb: "./thumb_nail/간섭무늬.png" },
  { title: "렌즈의 굴절", category: "광학", desc: "렌즈의 종류에 따라 어떤 상이 맺히는지 확인하기", tags: ["렌즈", "상"], emoji: "🔭", demo: "./simul/렌즈의 굴절.html", curriculumId: "[12물리03-02]", thumb: "./thumb_nail/렌즈의_법칙.png" },
  { title: "스넬의 법칙", category: "광학", desc: "굴절률 변화에 따른 입사/굴절/임계각 확인하기", tags: ["n1,n2", "TIR"], emoji: "📐", demo: "./simul/스넬의 법칙.html", curriculumId: "[12물리03-02]", thumb: "./thumb_nail/스넬의_법칙.png" },
  { title: "다이오드", category: "전자/반도체", desc: "PN 접합·공핍층·I–V 특성 직관", tags: ["PN", "I–V"], emoji: "🔌", demo: "./simul/다이오드.html", curriculumId: "[12물리03-05]", thumb: "./thumb_nail/다이오드.png" },
  { title: "상대성이론", category: "상대성", desc: "우주선의 속력에 따라 행성의 변화 관찰하기", tags: ["특수", "일반"], emoji: "🚀", demo: "./simul/상대성이론.html", curriculumId: "[12물리03-06]", thumb: "./thumb_nail/상대성이론.png" },

  // ===== 12역학 =====
  { title: "힘의 합력", category: "역학", desc: "여러 힘의 합력 알아보기", tags: ["힘", "알짜힘"], emoji: "🧗‍♀️", demo: "./simul/힘의 평형.html", curriculumId: "[12역학01-01]", thumb: "./thumb_nail/힘의_평형.png" },
  { title: "포물선 운동", category: "역학", desc: "대포를 쏴서 과녁을 맞추자.", tags: ["포물선운동", "게임"], emoji: "🌈", demo: "./simul/포물선 운동.html", curriculumId: "[12역학01-02]", thumb: "./thumb_nail/포물선_운동.png" },
  { title: "진화하는 로켓", category: "역학", desc: "내가 그린 미로를 탈출하라! 유전 알고리즘으로 길을 찾는 AI 로켓", tags: ["유전알고리즘", "인공지능", "그리기"], emoji: "🧬", demo: "./simul/경로찾기.html", curriculumId: "[12역학01-02]", thumb: "./thumb_nail/경로찾기.png" },
  { title: "궤도 올리기", category: "역학", desc: "행성의 탈출속도와 위성의 궤도 알아보기", tags: ["중력", "탈출속도", "궤도"], emoji: "🧗‍♀️", demo: "./simul/궤도 올리기.html", curriculumId: "[12역학01-04], [12역학01-05]", thumb: "./thumb_nail/궤도 올리기.png" },
  { title: "블랙홀과 중력렌즈", category: "상대성", desc: "공간이 휘어진다! 블랙홀이 만드는 아인슈타인 링과 중력 렌즈 효과", tags: ["일반상대성", "블랙홀", "중력렌즈", "빛"], emoji: "🕳️", demo: "./simul/중력렌즈.html", curriculumId: "[12역학01-06]", thumb: "./thumb_nail/중력렌즈.png" },
  { title: "맥스웰의 도깨비", category: "열", desc: "엔트로피를 거슬러라! 뜨거운 공과 차가운 공을 분류하는 미니 게임", tags: ["엔트로피", "열역학", "게임"], emoji: "😈", demo: "./simul/멕스웰 도깨비.html", curriculumId: "[12역학02-05]", thumb: "./thumb_nail/멕스웰 도깨비.png" },
  { title: "극한의 번지점프", category: "역학", desc: "가속도와 변위의 관계! 바닥에 닿지도, 기절하지도 않게 k값을 조절하라", tags: ["단진동", "용수철", "가속도", "G-Force"], emoji: "🪂", demo: "./simul/번지점프.html", curriculumId: "[12역학03-01]", thumb: "./thumb_nail/번지점프.png" },
  { title: "도플러효과", category: "광학", desc: "음원의 속도와 진동수에 따른 관측 음원의 변화 관찰하기", tags: ["도플러", "파동"], emoji: "🎵", demo: "./simul/도플러효과.html", curriculumId: "[12역학03-03]", thumb: "./thumb_nail/도플러효과.png" },

  // ===== 12전자 =====
  { title: "로런츠 힘과 오로라", category: "전자/반도체", desc: "자기장 속 전하의 원운동(F=qvB) 실험부터 태양풍이 만드는 오로라의 원리까지!", tags: ["로런츠힘", "자기장", "오로라",], emoji: "🌌", demo: "./simul/로런츠 힘.html", curriculumId: "[12전자01-04]", thumb: "./thumb_nail/로런츠 힘.png" },
  { title: "RLC 공명", category: "전자/반도체", desc: "직렬 RLC 회로의 공명/위상·전류 변화 시각화하기", tags: ["회로", "공명"], emoji: "🔄", demo: "./simul/RLC 공명.html", curriculumId: "[12전자01-06]", thumb: "./thumb_nail/RLC회로.png" },
  { title: "러더퍼드 알파입자 산란실험", category: "시뮬레이션", desc: "러더퍼드의 알파입자 산란실험 확인하기", tags: ["산란", "쿨롱"], emoji: "🧪", demo: "./simul/러더퍼드 알파입자 산란실험.html", curriculumId: "[12전자01-06]", thumb: "./thumb_nail/러더퍼드_산란실험.png" },
  { title: "편광과 LCD", category: "광학", desc: "편광의 원리와 LCD의 원리 알아보기", tags: ["편광", "LCD"], emoji: "🔭", demo: "./simul/편광과 LCD.html", curriculumId: "[12전자02-03]", thumb: "./thumb_nail/편광과 LCD.png" },
  { title: "광전효과", category: "전자/반도체", desc: "파장/세기에 따른 광전자 방출과 임계 주파수 확인하기", tags: ["광자", "금속"], emoji: "📸", demo: "./simul/광전효과.html", curriculumId: "[12전자02-04]", thumb: "./thumb_nail/광전효과.png" },
  { title: "발광 다이오드", category: "전자/반도체", desc: "파장별 전압·밴드갭과 발광.", tags: ["LED", "밴드갭"], emoji: "💡", demo: "./simul/발광 다이오드.html", curriculumId: "[12전자02-04]", thumb: "./thumb_nail/발광_다이오드.png" },
  { title: "LASER", category: "광학, 전자/반도체", desc: "빛의 복제 공장! 유도 방출과 반전 분포로 만드는 강력한 빛", tags: ["레이저", "증폭", "유도방출"], emoji: "🔦", demo: "./simul/레이저.html", curriculumId: "[12전자02-05]", thumb: "./thumb_nail/레이저.png" },
  { title: "이중슬릿", category: "광학", desc: "이중슬릿을 통과한 전자의 간섭무늬 확인하기", tags: ["슬릿", "간섭"], emoji: "〰️", demo: "./simul/이중슬릿.html", curriculumId: "[12전자03-01]", thumb: "./thumb_nail/이중슬릿.png" },
  { title: "양자 터널링", category: "현대물리", desc: "입자가 벽을 뚫고 지나간다? 양자 터널 효과와 확률 파동", tags: ["양자역학", "터널링", "파동함수"], emoji: "👻", demo: "./simul/양자 터널링.html", curriculumId: "[12전자03-03]", thumb: "./thumb_nail/양자_터널링.png" },
  { title: "원자모형", category: "시뮬레이션", desc: "보어/오비탈/전자구름 개념 확인하기", tags: ["원자", "준위"], emoji: "🧬", demo: "./simul/원자모형.html", curriculumId: "[12전자03-04]", thumb: "./thumb_nail/원자모형.png" },
  { title: "나만의 별 키우기", category: "현대물리", desc: "가스를 모아 별을 점화하라! 중력과 압력의 균형(정역학 평형) 게임", tags: ["핵융합", "별의진화", "흑체복사"], emoji: "🌟", demo: "./simul/별의 탄생.html", curriculumId: "[12전자03-05]", thumb: "./thumb_nail/별의 탄생.png" },

  // ===== 현대물리 =====
  { title: "베타붕괴", category: "현대물리", desc: "베타붕괴 현상 알아보기", tags: ["베타붕괴", "입자물리"], emoji: "☢️", demo: "./simul/베타붕괴.html", curriculumId: " ", thumb: "./thumb_nail/베타붕괴.png" },
  { title: "입자가속기", category: "현대물리", desc: "입자가속기 속에서 생기는 표준모형 알아보기", tags: ["입자가속기", "입자물리"], emoji: "🌀", demo: "./simul/입자가속기.html", curriculumId: " ", thumb: "./thumb_nail/입자가속기.png" },



];


const grid = document.getElementById('grid');
const q = document.getElementById('q');
const cat = document.getElementById('cat');
const sortSel = document.getElementById('sort');
const count = document.getElementById('count');
const empty = document.getElementById('empty');

// ====================== SEED 수업 설계 상태 ======================
let curriculumData = null;
const curriculumIndex = new Map();



function normalizeCurriculumCodes(raw) {
  if (!raw || raw === "ALL") return [];
  return String(raw)
    .split(",")
    .map(v => v.replace(/\[|\]/g, "").trim())
    .filter(Boolean);
}

async function loadCurriculumData() {
  if (curriculumData) return curriculumData;

  const res = await fetch("./science_curriculum_2022_checkbox.json");
  if (!res.ok) throw new Error("교육과정 JSON을 불러오지 못했습니다.");
  curriculumData = await res.json();

  curriculumIndex.clear();
  curriculumData.courses.forEach(course => {
    course.units.forEach(unit => {
      unit.standards.forEach(std => {
        curriculumIndex.set(std.achievement_code, {
          school_level: course.school_level,
          course: course.course,
          unit: unit.unit,
          ...std
        });
      });
    });
  });

  return curriculumData;
}

function getSchoolLevels() {
  if (!curriculumData?.courses) return [];
  return [...new Set(curriculumData.courses.map(course => course.school_level))];
}

function getCoursesBySchoolLevel(schoolLevel) {
  if (!curriculumData?.courses) return [];
  return curriculumData.courses.filter(course => course.school_level === schoolLevel);
}

function getCourseBySchoolLevelAndName(schoolLevel, courseName) {
  if (!curriculumData?.courses) return null;
  return curriculumData.courses.find(
    course => course.school_level === schoolLevel && course.course === courseName
  ) || null;
}

function getStandardsByCourse(schoolLevel, courseName) {
  const courseObj = getCourseBySchoolLevelAndName(schoolLevel, courseName);
  if (!courseObj?.units) return [];

  return courseObj.units.flatMap(unit =>
    (unit.standards || []).map(standard => ({
      unit: unit.unit,
      achievement_code: standard.achievement_code,
      achievement_text: standard.achievement_text,
      display_text: standard.display_text
    }))
  );
}

function fillSelectOptions(selectEl, items, placeholder, getValue, getLabel) {
  if (!selectEl) return;

  selectEl.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = placeholder;
  selectEl.appendChild(firstOption);

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    selectEl.appendChild(option);
  });
}

function renderSeedCurriculumSelectors() {
  const schoolLevels = getSchoolLevels();

  if (!seedState.schoolLevel && schoolLevels.length) {
    seedState.schoolLevel = schoolLevels[0];
  }

  fillSelectOptions(
    elSeed.schoolLevel,
    schoolLevels,
    "학교급 선택",
    item => item,
    item => item
  );

  elSeed.schoolLevel.value = seedState.schoolLevel || "";

  const courseList = getCoursesBySchoolLevel(seedState.schoolLevel);

  if (!courseList.some(course => course.course === seedState.course)) {
    seedState.course = courseList[0]?.course || "";
  }

  fillSelectOptions(
    elSeed.course,
    courseList,
    "과목 선택",
    item => item.course,
    item => item.course
  );

  elSeed.course.value = seedState.course || "";

  const standards = getStandardsByCourse(seedState.schoolLevel, seedState.course);

  if (!standards.some(std => std.achievement_code === seedState.selectedStandardCode)) {
    seedState.selectedStandardCode = standards[0]?.achievement_code || "";
  }

  fillSelectOptions(
    elSeed.standard,
    standards,
    "성취기준 선택",
    item => item.achievement_code,
    item => `${item.display_text} (${item.unit})`
  );

  elSeed.standard.value = seedState.selectedStandardCode || "";

  renderSelectedStandardPreview();
}

function getSelectedStandardObject() {
  const standards = getStandardsByCourse(seedState.schoolLevel, seedState.course);
  return standards.find(std => std.achievement_code === seedState.selectedStandardCode) || null;
}

function renderSelectedStandardPreview() {
  if (!elSeed.standardPreview) return;

  const selected = getSelectedStandardObject();

  if (!selected) {
    elSeed.standardPreview.textContent = "성취기준을 선택하면 여기에 표시됩니다.";
    return;
  }

  elSeed.standardPreview.innerHTML = `
    <strong>[${selected.achievement_code}]</strong><br>
    ${escapeHtml(selected.achievement_text)}<br>
    <span style="color:#9db3ec;">단원: ${escapeHtml(selected.unit)}</span>
  `;
}

function buildRecommendedPrompt() {
  const std = getSelectedStandardObject();

  if (!std) return "";

  const school = seedState.schoolLevel || "고등학교";
  const course = seedState.course || "과학";

  const simulationPart = seedState.project
    ? `${seedState.project.title} 시뮬레이션을 활용하여 `
    : "";

  return `${school} ${course} 수업에서
${simulationPart}[${std.achievement_code}] ${std.achievement_text}
개념을 학생이 스스로 탐구하도록 수업안을 설계해줘.
모둠 활동, 질문 생성, 데이터 해석, 형성평가 요소를 포함해줘.`;
}

function applyRecommendedPrompt() {
  const prompt = buildRecommendedPrompt();
  if (!prompt) return;

  elSeed.prompt.value = prompt;
}

function buildPromptWithCurriculumContext(rawPrompt) {
  const selected = getSelectedStandardObject();

  const curriculumBlock = selected
    ? `[선택 정보]
- 학교급: ${seedState.schoolLevel}
- 과목: ${seedState.course}
- 성취기준: [${selected.achievement_code}] ${selected.achievement_text}
- 단원: ${selected.unit}`
    : `[선택 정보]
- 학교급: ${seedState.schoolLevel || "미선택"}
- 과목: ${seedState.course || "미선택"}`;

  const simulationBlock = seedState.project
    ? `
[사용 시뮬레이션]
- 제목: ${seedState.project.title}
- 설명: ${seedState.project.desc}
`
    : "";

  return `${curriculumBlock}
${simulationBlock}

[교사 추가 요청]
${rawPrompt || "학생 활동 중심의 탐구형 수업안을 설계해줘."}`;
}

// ====================== SEED (Gemini 자유입력형) ======================
const seedState = {
  project: null,
  schoolLevel: "",
  course: "",
  selectedStandardCode: "",
  lastResultText: "",
  ideaOptions: [],
  selectedIdea: null,
  stage: "idle" // idle | ideas | lesson
};

function resetSeedState() {
  seedState.project = null;
  seedState.schoolLevel = "고등학교";
  seedState.course = "";
  seedState.selectedStandardCode = "";
  seedState.lastResultText = "";
  seedState.ideaOptions = [];
  seedState.selectedIdea = null;
  seedState.stage = "idle";

  if (elSeed.prompt) elSeed.prompt.value = "";
  if (elSeed.output) {
    elSeed.output.innerHTML = `
      <div class="seed-muted">
        <p style="margin:0;">왼쪽에 조건을 입력하고 <strong>아이디어 4개 생성</strong>을 눌러 주세요.</p>
      </div>
    `;
  }

  renderSeedProjectCard();
  renderSeedCurriculumSelectors();
}

const elSeed = {
  openBtn: document.getElementById("open-seed"),
  backdrop: document.getElementById("seed-backdrop"),
  panel: document.getElementById("seed-panel"),
  closeBtn: document.getElementById("seed-close"),
  projectCard: document.getElementById("seed-project-card"),

  schoolLevel: document.getElementById("seed-school-level"),
  course: document.getElementById("seed-course"),
  standard: document.getElementById("seed-standard"),
  standardPreview: document.getElementById("seed-standard-preview"),

  prompt: document.getElementById("seed-user-prompt"),
  generateBtn: document.getElementById("seed-generate"),
  copyBtn: document.getElementById("seed-copy"),
  output: document.getElementById("seed-output")
};

function getStandardsForProject(project) {
  if (!project) return [];
  const codes = normalizeCurriculumCodes(project.curriculumId);
  return codes
    .map(code => curriculumIndex.get(code))
    .filter(Boolean);
}

function renderSeedProjectCard() {
  if (!elSeed.projectCard) return;

  const p = seedState.project;
  if (!p) {
    elSeed.projectCard.innerHTML = `<div class="seed-muted">선택된 시뮬레이션이 없습니다. 상단 '수업 설계' 버튼으로 일반 설계를 시작하거나 카드의 '수업설계' 버튼을 눌러 주세요.</div>`;
    return;
  }

  const standards = getStandardsForProject(p);
  const codesHtml = standards.length
    ? standards.map(s => `<span class="seed-badge">[${s.achievement_code}]</span>`).join("")
    : `<span class="seed-badge">성취기준 연결 없음</span>`;

  elSeed.projectCard.innerHTML = `
    <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${escapeHtml(p.title)}</div>
    <div style="color:#9db3ec;margin-bottom:8px;">${escapeHtml(p.desc)}</div>
    <div class="seed-badges">${codesHtml}</div>
  `;
}

function openSeedPanel(project = null) {
  stopSeedLoadingUI();
  resetSeedState();

  seedState.project = project;

  if (project) {
    const standards = getStandardsForProject(project);
    if (standards.length) {
      seedState.schoolLevel = standards[0].school_level;
      seedState.course = standards[0].course;
      seedState.selectedStandardCode = standards[0].achievement_code;
      renderSeedCurriculumSelectors();
      applyRecommendedPrompt();
    }
  }

  renderSeedProjectCard();

  document.body.style.overflow = "hidden";
  elSeed.backdrop.hidden = false;
  elSeed.panel.classList.add("open");
  elSeed.panel.setAttribute("aria-hidden", "false");
}

function closeSeedPanel() {
  stopSeedLoadingUI();
  resetSeedState();

  elSeed.panel.classList.remove("open");
  elSeed.panel.setAttribute("aria-hidden", "true");
  elSeed.backdrop.hidden = true;
  document.body.style.overflow = "";
}

function getProjectContextText(project) {
  if (!project) {
    return "현재 선택된 시뮬레이션 없음";
  }

  const standards = getStandardsForProject(project);
  const standardText = standards.length
    ? standards.map(s => `[${s.achievement_code}] ${s.achievement_text}`).join("\n")
    : "연결된 성취기준 없음";

  return `
시뮬레이션 제목: ${project.title}
설명: ${project.desc}
카테고리: ${project.category}
태그: ${(project.tags || []).join(", ")}
실행 경로: ${project.demo}
연결 성취기준:
${standardText}
`.trim();
}

function getMascotByProject(project) {
  const category = project?.category || "";

  if (category.includes("역학")) return "./image/역학시물이.png";
  if (category.includes("열")) return "./image/열시물이.png";
  if (category.includes("전자") || category.includes("반도체") || category.includes("전자기")) {
    return "./image/전기시물이.png";
  }
  return "./image/양자시물이.png";
}

function getIdeaMascotByIndex(index) {
  const mascots = [
    "./image/역학시물이.png",
    "./image/전기시물이.png",
    "./image/양자시물이.png",
    "./image/열시물이.png"
  ];
  return mascots[index % mascots.length];
}

function buildGeminiRequestBody(userPrompt, project) {
  const projectContext = getProjectContextText(project);

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `너는 한국 고등학교 과학·물리 수업 설계 전문가다.
반드시 실제 수업에 바로 적용 가능한 수준으로 작성하라.
추상적 표현, 상투적 문장, 빈약한 일반론을 피하라.
탐구 질문, 학생 활동, 교사 발문, 데이터 표현, 형성평가가 살아 있어야 한다.

[시뮬레이션/교육과정 문맥]
${projectContext}

[교사 요구 조건]
${userPrompt}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          lesson_title: { type: "string" },
          target_summary: { type: "string" },
          standards_used: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                text: { type: "string" }
              },
              required: ["code", "text"]
            }
          },
          lesson_objectives: {
            type: "array",
            items: { type: "string" }
          },
          essential_question: { type: "string" },
          prior_knowledge: {
            type: "array",
            items: { type: "string" }
          },
          inquiry_design: {
            type: "object",
            properties: {
              hypothesis_example: { type: "string" },
              independent_variables: {
                type: "array",
                items: { type: "string" }
              },
              dependent_variables: {
                type: "array",
                items: { type: "string" }
              },
              control_variables: {
                type: "array",
                items: { type: "string" }
              },
              data_representation: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: [
              "hypothesis_example",
              "independent_variables",
              "dependent_variables",
              "control_variables",
              "data_representation"
            ]
          },
          lesson_flow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: { type: "string" },
                teacher_actions: {
                  type: "array",
                  items: { type: "string" }
                },
                student_actions: {
                  type: "array",
                  items: { type: "string" }
                },
                tips: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["phase", "teacher_actions", "student_actions", "tips"]
            }
          },
          worksheet_items: {
            type: "array",
            items: { type: "string" }
          },
          formative_assessment: {
            type: "array",
            items: { type: "string" }
          },
          extension_or_reflection: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "lesson_title",
          "target_summary",
          "standards_used",
          "lesson_objectives",
          "essential_question",
          "prior_knowledge",
          "inquiry_design",
          "lesson_flow",
          "worksheet_items",
          "formative_assessment",
          "extension_or_reflection"
        ]
      }
    }
  };
}

function buildIdeaRequestBody(userPrompt, project) {
  const projectContext = getProjectContextText(project);

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `너는 한국 고등학교 과학·물리 수업 설계 전문가다.

다음 시뮬레이션과 성취기준, 교사 요청을 바탕으로
서로 다른 방향의 탐구형 수업 아이디어를 정확히 4개 제안하라.

반드시 JSON 배열 하나만 출력하라.
설명문, 머리말, 코드블록, markdown을 절대 출력하지 마라.

각 아이디어는 다음 필드를 반드시 포함한다.
- id
- title
- core_question
- inquiry_type
- manipulated_variables
- expected_data
- activity_structure
- student_mission

조건:
- 4개 아이디어는 서로 충분히 달라야 한다.
- 학생 활동 중심이어야 한다.
- 정량 데이터가 나오게 구성해야 한다.
- 교사가 바로 읽고 선택할 수 있게 짧고 명확하게 작성하라.

[시뮬레이션/교육과정 문맥]
${projectContext}

[교사 요구 조건]
${userPrompt}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            core_question: { type: "string" },
            inquiry_type: { type: "string" },
            manipulated_variables: {
              type: "array",
              items: { type: "string" }
            },
            expected_data: { type: "string" },
            activity_structure: { type: "string" },
            student_mission: { type: "string" }
          },
          required: [
            "id",
            "title",
            "core_question",
            "inquiry_type",
            "manipulated_variables",
            "expected_data",
            "activity_structure",
            "student_mission"
          ]
        }
      }
    }
  };
}

function buildLessonFromIdeaRequestBody(userPrompt, project, idea) {
  const projectContext = getProjectContextText(project);

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `너는 한국 고등학교 과학·물리 수업 설계 전문가다.
반드시 실제 수업에 바로 적용 가능한 수준으로 작성하라.
추상적 표현, 상투적 문장, 빈약한 일반론을 피하라.
탐구 질문, 학생 활동, 교사 발문, 데이터 표현, 형성평가가 살아 있어야 한다.

[시뮬레이션/교육과정 문맥]
${projectContext}

[교사 요구 조건]
${userPrompt}

[선택된 수업 아이디어]
- 제목: ${idea.title}
- 핵심 질문: ${idea.core_question}
- 탐구 유형: ${idea.inquiry_type}
- 조작 변인: ${(idea.manipulated_variables || []).join(", ")}
- 예상 데이터: ${idea.expected_data}
- 활동 구조: ${idea.activity_structure}
- 학생 미션: ${idea.student_mission}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          lesson_title: { type: "string" },
          target_summary: { type: "string" },
          standards_used: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                text: { type: "string" }
              },
              required: ["code", "text"]
            }
          },
          lesson_objectives: {
            type: "array",
            items: { type: "string" }
          },
          essential_question: { type: "string" },
          prior_knowledge: {
            type: "array",
            items: { type: "string" }
          },
          inquiry_design: {
            type: "object",
            properties: {
              hypothesis_example: { type: "string" },
              independent_variables: {
                type: "array",
                items: { type: "string" }
              },
              dependent_variables: {
                type: "array",
                items: { type: "string" }
              },
              control_variables: {
                type: "array",
                items: { type: "string" }
              },
              data_representation: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: [
              "hypothesis_example",
              "independent_variables",
              "dependent_variables",
              "control_variables",
              "data_representation"
            ]
          },
          lesson_flow: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: { type: "string" },
                teacher_actions: {
                  type: "array",
                  items: { type: "string" }
                },
                student_actions: {
                  type: "array",
                  items: { type: "string" }
                },
                tips: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["phase", "teacher_actions", "student_actions", "tips"]
            }
          },
          worksheet_items: {
            type: "array",
            items: { type: "string" }
          },
          formative_assessment: {
            type: "array",
            items: { type: "string" }
          },
          extension_or_reflection: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "lesson_title",
          "target_summary",
          "standards_used",
          "lesson_objectives",
          "essential_question",
          "prior_knowledge",
          "inquiry_design",
          "lesson_flow",
          "worksheet_items",
          "formative_assessment",
          "extension_or_reflection"
        ]
      }
    }
  };
}

async function requestSeedJson(body) {
  const res = await fetch("/api/generate-lesson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Server API error:", data);
    throw new Error(data?.error || "서버 호출에 실패했습니다.");
  }

  const rawText = data?.result || "";
  if (!rawText) {
    console.error("Empty server result:", data);
    throw new Error("서버 응답이 비어 있습니다.");
  }

  seedState.lastResultText = rawText;

  try {
    return JSON.parse(rawText);
  } catch (parseErr) {
    console.error("JSON parse error:", parseErr, rawText);
    throw new Error("AI 응답이 JSON 형식이 아닙니다.");
  }
}


async function generateIdeaOptionsWithGemini() {
  const rawPrompt = elSeed.prompt.value.trim();
  const userPrompt = buildPromptWithCurriculumContext(rawPrompt);

  if (!userPrompt) {
    alert("수업 조건을 입력해 주세요.");
    return;
  }

  elSeed.generateBtn.disabled = true;
  showSeedLoadingUI();

  try {
    const body = buildIdeaRequestBody(userPrompt, seedState.project);
    const ideas = await requestSeedJson(body);

    if (!Array.isArray(ideas) || !ideas.length) {
      throw new Error("아이디어 목록을 생성하지 못했습니다.");
    }

    renderIdeaSelection(ideas);
  } catch (err) {
    console.error(err);
    elSeed.output.innerHTML = `
      <div class="seed-muted" style="color:#ffb4b4;">
        생성 실패: ${escapeHtml(err.message)}
      </div>
      <div class="seed-help">서버 연결 또는 응답 형식을 확인해 주세요.</div>
    `;
  } finally {
    stopSeedLoadingUI();
    elSeed.generateBtn.disabled = false;
  }
}

async function generateLessonFromIdea(idea) {
  const rawPrompt = elSeed.prompt.value.trim();
  const userPrompt = buildPromptWithCurriculumContext(rawPrompt);

  if (!idea) return;

  seedState.selectedIdea = idea;
  elSeed.generateBtn.disabled = true;
  showSeedLoadingUI();

  try {
    const body = buildLessonFromIdeaRequestBody(userPrompt, seedState.project, idea);
    const lesson = await requestSeedJson(body);

    seedState.stage = "lesson";

    renderLessonResult(lesson);

    const backRow = document.createElement("div");
    backRow.className = "seed-back-row";
    backRow.innerHTML = `<button type="button" class="seed-back-btn">← 아이디어 4개 다시 보기</button>`;

    const resultRoot = elSeed.output.querySelector(".seed-result");
    if (resultRoot) {
      resultRoot.prepend(backRow);
      backRow.querySelector("button").addEventListener("click", () => {
        renderIdeaSelection(seedState.ideaOptions);
      });
    }
  } catch (err) {
    console.error(err);
    elSeed.output.innerHTML = `
      <div class="seed-muted" style="color:#ffb4b4;">
        생성 실패: ${escapeHtml(err.message)}
      </div>
      <div class="seed-help">서버 연결 또는 응답 형식을 확인해 주세요.</div>
    `;
  } finally {
    stopSeedLoadingUI();
    elSeed.generateBtn.disabled = false;
  }
}

let seedLoadingTimer = null;

function showSeedLoadingUI() {
  const mascots = [
    "./image/역학시물이.png",
    "./image/전기시물이.png",
    "./image/양자시물이.png",
    "./image/열시물이.png"
  ];

  const messages = [
    "탐구 질문을 정리하고 있어요...",
    "성취기준과 연결하는 중입니다...",
    "시뮬레이션 변인을 설계하는 중...",
    "형성평가 문항을 구성하고 있어요...",
    "학생 활동 흐름을 다듬는 중입니다...",
    "수업 구조를 최적화하고 있어요..."
  ];

  let i = 0;

  elSeed.output.innerHTML = `
    <div class="seed-loading-wrap">
      <img id="seed-loading-img" class="seed-loading-mascot" src="${mascots[0]}">
      <div class="seed-loading-text">수업을 설계하는 중입니다</div>
      <div id="seed-loading-msg" class="seed-loading-sub">${messages[0]}</div>
    </div>
  `;

  seedLoadingTimer = setInterval(() => {
    i++;

    const img = document.getElementById("seed-loading-img");
    const msg = document.getElementById("seed-loading-msg");

    if (!img || !msg) return;

    img.style.opacity = "0";
    img.style.transform = "scale(.9)";

    setTimeout(() => {
      img.src = mascots[i % mascots.length];
      img.style.opacity = "1";
      img.style.transform = "scale(1)";
      msg.textContent = messages[i % messages.length];
    }, 250);

  }, 1700);
}

function stopSeedLoadingUI() {
  if (seedLoadingTimer) {
    clearInterval(seedLoadingTimer);
    seedLoadingTimer = null;
  }
}

function renderIdeaSelection(ideas) {
  seedState.ideaOptions = Array.isArray(ideas) ? ideas.slice(0, 4) : [];
  seedState.stage = "ideas";

  const cardsHtml = seedState.ideaOptions.map((idea, index) => {
    const mascot = getIdeaMascotByIndex(index);
    const varsHtml = (idea.manipulated_variables || [])
      .map(v => `<span class="seed-idea-var">${escapeHtml(v)}</span>`)
      .join("");

    return `
      <button type="button" class="seed-idea-card" data-idea-index="${index}">
        <div class="seed-idea-mascot-wrap">
          <img class="seed-idea-mascot" src="${mascot}" alt="시물이 ${index + 1}">
        </div>

        <div class="seed-idea-body">
          <div class="seed-idea-topline">
            <span class="seed-idea-number">${index + 1}</span>
            <span class="seed-idea-badge">${escapeHtml(idea.inquiry_type || "탐구형")}</span>
          </div>

          <h4 class="seed-idea-title">${escapeHtml(idea.title || `아이디어 ${index + 1}`)}</h4>

          <p class="seed-idea-line">
            <span class="seed-idea-label">핵심 질문</span><br>
            ${escapeHtml(idea.core_question || "")}
          </p>

          <div class="seed-idea-vars">${varsHtml}</div>

          <p class="seed-idea-line">
            <span class="seed-idea-label">예상 데이터</span><br>
            ${escapeHtml(idea.expected_data || "")}
          </p>

          <p class="seed-idea-line">
            <span class="seed-idea-label">학생 미션</span><br>
            ${escapeHtml(idea.student_mission || "")}
          </p>

          <span class="seed-idea-cta">이 아이디어로 상세 설계 →</span>
        </div>
      </button>
    `;
  }).join("");

  elSeed.output.innerHTML = `
    <div class="seed-idea-stage">
      <div class="seed-idea-head">
        <div>
          <h3>수업 아이디어 4가지</h3>
          <p>시물이 카드를 눌러 하나를 선택하면, 그 방향으로 상세 수업안을 생성합니다.</p>
        </div>
      </div>
      <div class="seed-idea-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  elSeed.output.querySelectorAll(".seed-idea-card").forEach(card => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.ideaIndex);
      const idea = seedState.ideaOptions[index];
      if (idea) {
        generateLessonFromIdea(idea);
      }
    });
  });
}

function renderLessonResult(data) {
  const standardsBadges = (data.standards_used || [])
    .map(s => `<span class="seed-badge">${escapeHtml(s.code)}</span>`)
    .join("");

  const standardsList = (data.standards_used || [])
    .map(s => `<li><strong>${escapeHtml(s.code)}</strong> ${escapeHtml(s.text)}</li>`)
    .join("");

  const objectivesList = (data.lesson_objectives || [])
    .map(v => `<li>${escapeHtml(v)}</li>`)
    .join("");

  const priorList = (data.prior_knowledge || [])
    .map(v => `<li>${escapeHtml(v)}</li>`)
    .join("");

  const worksheetList = (data.worksheet_items || [])
    .map(v => `<li>${escapeHtml(v)}</li>`)
    .join("");

  const formativeList = (data.formative_assessment || [])
    .map(v => `<li>${escapeHtml(v)}</li>`)
    .join("");

  const reflectionList = (data.extension_or_reflection || [])
    .map(v => `<li>${escapeHtml(v)}</li>`)
    .join("");

  const flowHtml = (data.lesson_flow || [])
    .map(step => `
      <div class="seed-flow-step">
        <h5>${escapeHtml(step.phase)}</h5>
        <div class="seed-flow-grid">
          <div class="seed-flow-box">
            <strong>교사 활동</strong>
            <ul>${(step.teacher_actions || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
          </div>
          <div class="seed-flow-box">
            <strong>학생 활동</strong>
            <ul>${(step.student_actions || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
          </div>
        </div>
        <div class="seed-tip-list">
          <strong>수업 팁</strong>
          <ul>${(step.tips || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
        </div>
      </div>
    `)
    .join("");

  elSeed.output.innerHTML = `
    <div class="seed-result">
      <div class="seed-doc">
        <div class="seed-doc-hero">
          <h3>${escapeHtml(data.lesson_title || "수업안")}</h3>
          <p class="seed-doc-summary">${escapeHtml(data.target_summary || "")}</p>
          <div class="seed-doc-meta">
            ${standardsBadges || '<span class="seed-badge">성취기준 정보 없음</span>'}
          </div>
        </div>

        <div class="seed-doc-body">
          <div class="seed-doc-grid">
            <div class="seed-card">
              <h4>핵심 질문</h4>
              <p>${escapeHtml(data.essential_question || "")}</p>
            </div>

            <div class="seed-card">
              <h4>가설 예시</h4>
              <p>${escapeHtml(data.inquiry_design?.hypothesis_example || "")}</p>
            </div>

            <div class="seed-card">
              <h4>수업 목표</h4>
              <ul>${objectivesList}</ul>
            </div>

            <div class="seed-card">
              <h4>선수학습</h4>
              <ul>${priorList}</ul>
            </div>
          </div>

          <div class="seed-section-block">
            <h4>반영 성취기준</h4>
            <ul>${standardsList}</ul>
          </div>

          <div class="seed-doc-grid">
            <div class="seed-card">
              <h4>조작 변인</h4>
              <ul>${(data.inquiry_design?.independent_variables || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
            </div>
            <div class="seed-card">
              <h4>종속 변인</h4>
              <ul>${(data.inquiry_design?.dependent_variables || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
            </div>
            <div class="seed-card">
              <h4>통제 변인</h4>
              <ul>${(data.inquiry_design?.control_variables || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
            </div>
            <div class="seed-card">
              <h4>데이터 표현</h4>
              <ul>${(data.inquiry_design?.data_representation || []).map(v => `<li>${escapeHtml(v)}</li>`).join("")}</ul>
            </div>
          </div>

          <div class="seed-section-block">
            <h4>차시 흐름</h4>
            ${flowHtml}
          </div>

          <div class="seed-doc-grid">
            <div class="seed-card">
              <h4>활동지 문항</h4>
              <ol>${worksheetList}</ol>
            </div>
            <div class="seed-card">
              <h4>형성평가</h4>
              <ul>${formativeList}</ul>
            </div>
          </div>

          <div class="seed-section-block">
            <h4>확장 및 성찰</h4>
            <ul>${reflectionList}</ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initSeedGemini() {
  try {
    await loadCurriculumData();

    seedState.schoolLevel = "고등학교";
    seedState.course = "";
    seedState.selectedStandardCode = "";

    renderSeedCurriculumSelectors();

    elSeed.schoolLevel?.addEventListener("change", (e) => {
      seedState.schoolLevel = e.target.value;
      seedState.course = "";
      seedState.selectedStandardCode = "";
      renderSeedCurriculumSelectors();
      applyRecommendedPrompt();
    });

    elSeed.course?.addEventListener("change", (e) => {
      seedState.course = e.target.value;
      seedState.selectedStandardCode = "";
      renderSeedCurriculumSelectors();
      applyRecommendedPrompt();
    });

    elSeed.standard?.addEventListener("change", (e) => {
      seedState.selectedStandardCode = e.target.value;
      renderSelectedStandardPreview();
      applyRecommendedPrompt();
    });

    elSeed.openBtn?.addEventListener("click", () => openSeedPanel(null));
    elSeed.closeBtn?.addEventListener("click", closeSeedPanel);
    elSeed.backdrop?.addEventListener("click", closeSeedPanel);
    elSeed.generateBtn?.addEventListener("click", generateIdeaOptionsWithGemini);
    elSeed.copyBtn?.addEventListener("click", async () => {
      const text = elSeed.output.innerText.trim();
      if (!text) {
        alert("복사할 내용이 없습니다.");
        return;
      }
      await navigator.clipboard.writeText(text);
      alert("수업안이 복사되었습니다.");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && elSeed.panel?.classList.contains("open")) {
        closeSeedPanel();
      }
    });

  } catch (err) {
    console.error("SEED 초기화 실패:", err);
  }
}

function getCourseListBySchoolLevel(level) {
  if (!curriculumData) return [];
  return curriculumData.courses.filter(c => c.school_level === level);
}

function getCourseByName(courseName) {
  if (!curriculumData) return null;
  return curriculumData.courses.find(c => c.course === courseName) || null;
}

function getStandardsByCurrentUnit() {
  const course = getCourseByName(seedState.course);
  if (!course) return [];
  const unit = course.units.find(u => u.unit === seedState.unit);
  return unit ? unit.standards : [];
}

function setOptions(selectEl, items, valueKey = "value", labelKey = "label") {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  items.forEach(item => {
    const option = document.createElement("option");
    if (typeof item === "string") {
      option.value = item;
      option.textContent = item;
    } else {
      option.value = item[valueKey];
      option.textContent = item[labelKey];
    }
    selectEl.appendChild(option);
  });
}

function syncSeedControlsFromState() {
  if (elSeed.period) elSeed.period.value = seedState.period;
  if (elSeed.classType) elSeed.classType.value = seedState.classType;
  if (elSeed.level) elSeed.level.value = seedState.level;
}

function renderSeedProjectSummary() {
  if (!elSeed.projectSummary) return;
  const p = seedState.project;
  if (!p) {
    elSeed.projectSummary.style.display = "none";
    elSeed.projectSummary.innerHTML = "";
    return;
  }

  const codes = normalizeCurriculumCodes(p.curriculumId);
  const chips = codes.map(code => `<span class="seed-badge">${code}</span>`).join("");

  elSeed.projectSummary.style.display = "block";
  elSeed.projectSummary.innerHTML = `
    <strong>${p.title}</strong><br>
    <span style="color:#9db3ec;">${p.desc}</span>
    <div class="seed-badge-list" style="margin-top:10px;">${chips}</div>
  `;
}

function renderSeedStandards() {
  const standards = getStandardsByCurrentUnit();
  elSeed.standards.innerHTML = "";

  if (!standards.length) {
    elSeed.standards.innerHTML = `<p class="seed-placeholder">표시할 성취기준이 없습니다.</p>`;
    return;
  }

  standards.forEach(std => {
    const checked = seedState.selectedStandards.includes(std.achievement_code);
    const label = document.createElement("label");
    label.className = "seed-standard-item";
    label.innerHTML = `
      <input type="checkbox" value="${std.achievement_code}" ${checked ? "checked" : ""}>
      <div>
        <div class="code">[${std.achievement_code}]</div>
        <div>${std.achievement_text}</div>
      </div>
    `;

    const checkbox = label.querySelector("input");
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (!seedState.selectedStandards.includes(std.achievement_code)) {
          seedState.selectedStandards.push(std.achievement_code);
        }
      } else {
        seedState.selectedStandards = seedState.selectedStandards.filter(code => code !== std.achievement_code);
      }
    });

    elSeed.standards.appendChild(label);
  });
}

function renderSeedSelectors() {
  const schoolLevels = [...new Set((curriculumData?.courses || []).map(c => c.school_level))];
  if (!seedState.schoolLevel) seedState.schoolLevel = schoolLevels[0] || "";

  setOptions(elSeed.school, schoolLevels);

  const courses = getCourseListBySchoolLevel(seedState.schoolLevel);
  if (!courses.some(c => c.course === seedState.course)) {
    seedState.course = courses[0]?.course || "";
  }
  setOptions(elSeed.course, courses.map(c => c.course));

  const currentCourse = getCourseByName(seedState.course);
  const units = currentCourse ? currentCourse.units.map(u => u.unit) : [];
  if (!units.includes(seedState.unit)) {
    seedState.unit = units[0] || "";
  }
  setOptions(elSeed.unit, units);

  renderSeedStandards();
  syncSeedControlsFromState();
}

function applySeedModeUI() {
  const isProject = seedState.mode === "project";
  elSeed.modeFree.classList.toggle("active", !isProject);
  elSeed.modeProject.classList.toggle("active", isProject);
  renderSeedProjectSummary();
}

function findProjectsByStandards(codes) {
  if (!codes?.length) return [];
  return projects.filter(project => {
    const projectCodes = normalizeCurriculumCodes(project.curriculumId);
    return codes.some(code => projectCodes.includes(code));
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateInquiryQuestions(standards, project) {
  const texts = standards.map(s => s.achievement_text).join(" ");
  const questions = [];

  if (/포물선|등가속도|운동/.test(texts) || /포물선/.test(project?.title || "")) {
    questions.push("발사각을 바꾸면 도달 거리와 최대 높이는 어떻게 변할까?");
    questions.push("초기속도를 증가시키면 비행 시간과 운동 에너지 해석은 어떻게 달라질까?");
  }

  if (/에너지|일/.test(texts)) {
    questions.push("시뮬레이션 속 운동에서 일은 어떤 조건에서 운동 에너지 변화로 연결될까?");
  }

  if (/전기|전류|자기|전자기/.test(texts)) {
    questions.push("전압이나 자기장 세기를 바꾸면 관측 결과는 어떤 경향을 보일까?");
  }

  if (/빛|간섭|굴절|렌즈/.test(texts)) {
    questions.push("매질이나 파장을 바꾸면 빛의 경로와 무늬는 어떻게 달라질까?");
  }

  if (/양자|확률|원자|터널/.test(texts)) {
    questions.push("관측 조건을 바꾸었을 때 결과를 확률적으로 어떻게 해석할 수 있을까?");
  }

  if (!questions.length) {
    questions.push("변인을 한 가지씩 바꾸었을 때 결과에 어떤 정량적 변화가 나타날까?");
    questions.push("이 시뮬레이션 결과를 실제 현상과 연결하면 어떤 과학 개념을 설명할 수 있을까?");
  }

  return questions.slice(0, 3);
}

function generateVariables(standards, project) {
  const texts = standards.map(s => s.achievement_text).join(" ");
  const title = project?.title || "";
  if (/포물선|등가속도|포물선 운동/.test(texts + title)) {
    return {
      independent: ["발사각", "초기속도"],
      dependent: ["도달 거리", "최대 높이", "비행 시간"],
      control: ["중력가속도", "질량", "시작 위치"]
    };
  }
  if (/전기|전류|옴/.test(texts + title)) {
    return {
      independent: ["전압", "저항값"],
      dependent: ["전류", "전력"],
      control: ["회로 연결 방식", "측정 위치"]
    };
  }
  if (/빛|굴절|간섭|렌즈/.test(texts + title)) {
    return {
      independent: ["파장", "굴절률", "슬릿 간격"],
      dependent: ["굴절각", "무늬 간격", "상의 위치"],
      control: ["광원 위치", "스크린 거리"]
    };
  }
  return {
    independent: ["조작 변인 1"],
    dependent: ["관찰 결과", "측정값"],
    control: ["환경 조건", "실험 절차"]
  };
}

function generateLessonPlanHtml() {
  const selected = seedState.selectedStandards
    .map(code => curriculumIndex.get(code))
    .filter(Boolean);

  if (!selected.length) {
    return `<p class="seed-placeholder">성취기준을 한 개 이상 선택해 주세요.</p>`;
  }

  const recommendedProjects = [
    ...(seedState.project ? [seedState.project] : []),
    ...findProjectsByStandards(seedState.selectedStandards)
  ].filter((item, idx, arr) => arr.findIndex(v => v.title === item.title) === idx);

  const vars = generateVariables(selected, seedState.project);
  const inquiryQuestions = generateInquiryQuestions(selected, seedState.project);

  const title = seedState.project
    ? `${seedState.project.title}를 활용한 ${seedState.classType} 수업`
    : `${seedState.unit} 단원 ${seedState.classType} 수업`;

  const standardsHtml = selected
    .map(std => `<li><strong>[${std.achievement_code}]</strong> ${escapeHtml(std.achievement_text)}</li>`)
    .join("");

  const projectHtml = recommendedProjects.length
    ? recommendedProjects.map(project => {
      return `
          <li>
            <strong>${escapeHtml(project.title)}</strong>
            <div class="seed-mini">${escapeHtml(project.desc)}</div>
            <a href="${project.demo}" target="_blank" rel="noopener">시뮬레이션 실행</a>
          </li>
        `;
    }).join("")
    : `<li>추천 시뮬레이션 없음</li>`;

  const essentialQuestion = inquiryQuestions[0];
  const periodText = seedState.period;

  return `
    <h4>수업 개요</h4>
    <div class="seed-mini">${escapeHtml(seedState.schoolLevel)} · ${escapeHtml(seedState.course)} · ${escapeHtml(seedState.unit)} · ${escapeHtml(periodText)} · ${escapeHtml(seedState.level)}</div>
    <p><strong>${escapeHtml(title)}</strong></p>
    <p><strong>핵심 질문:</strong> ${escapeHtml(essentialQuestion)}</p>

    <h4>반영 성취기준</h4>
    <ul>${standardsHtml}</ul>

    <h4>추천 시뮬레이션</h4>
    <ul>${projectHtml}</ul>

    <h4>탐구 질문</h4>
    <ol>
      ${inquiryQuestions.map(q => `<li>${escapeHtml(q)}</li>`).join("")}
    </ol>

    <h4>변인 설정</h4>
    <ul>
      <li><strong>조작 변인:</strong> ${vars.independent.map(escapeHtml).join(", ")}</li>
      <li><strong>종속 변인:</strong> ${vars.dependent.map(escapeHtml).join(", ")}</li>
      <li><strong>통제 변인:</strong> ${vars.control.map(escapeHtml).join(", ")}</li>
    </ul>

    <h4>차시 흐름</h4>
    <ol>
      <li>도입: 관련 현상 제시 및 핵심 질문 공유</li>
      <li>성취기준 확인: 오늘 탐구할 개념과 기능 명시</li>
      <li>시뮬레이션 탐구: 변인을 바꾸며 데이터 수집</li>
      <li>표현 및 해석: 표·그래프·관찰 기록 작성</li>
      <li>정리: 개념 일반화 및 실제 현상과 연결</li>
    </ol>

    <h4>활동지 문항 예시</h4>
    <ol>
      <li>탐구 문제를 한 문장으로 정리하시오.</li>
      <li>가설을 쓰고 근거를 설명하시오.</li>
      <li>조작·종속·통제 변인을 구분하시오.</li>
      <li>시뮬레이션 결과를 표 또는 그래프로 나타내시오.</li>
      <li>결과가 성취기준과 어떻게 연결되는지 서술하시오.</li>
    </ol>

    <h4>평가 포인트</h4>
    <ul>
      <li>성취기준과 탐구 질문의 정합성</li>
      <li>변인 통제의 적절성</li>
      <li>데이터 해석의 정확성</li>
      <li>개념 일반화 및 설명의 타당성</li>
    </ul>
  `;
}

function saveSeedPlan() {
  const html = elSeed.output.innerHTML.trim();
  if (!html || html.includes("성취기준을 한 개 이상")) {
    alert("먼저 수업안을 생성해 주세요.");
    return;
  }

  const payload = {
    savedAt: new Date().toISOString(),
    state: { ...seedState },
    html
  };

  const key = `seed_lesson_${Date.now()}`;
  localStorage.setItem(key, JSON.stringify(payload));
  alert("브라우저에 수업안이 저장되었습니다.");
}

function openSeedDrawer(project = null) {
  seedState.project = project;
  seedState.mode = project ? "project" : "free";

  if (project) {
    const codes = normalizeCurriculumCodes(project.curriculumId);
    const matched = codes
      .map(code => curriculumIndex.get(code))
      .filter(Boolean);

    if (matched.length) {
      seedState.schoolLevel = matched[0].school_level;
      seedState.course = matched[0].course;
      seedState.unit = matched[0].unit;
      seedState.selectedStandards = [...new Set(matched.map(v => v.achievement_code))];
    }
  }

  renderSeedSelectors();
  applySeedModeUI();
  elSeed.drawer.classList.add("open");
  elSeed.drawer.setAttribute("aria-hidden", "false");
  elSeed.backdrop.hidden = false;
}

function closeSeedDrawer() {
  elSeed.drawer.classList.remove("open");
  elSeed.drawer.setAttribute("aria-hidden", "true");
  elSeed.backdrop.hidden = true;
}

async function initSeed() {
  try {
    await loadCurriculumData();

    seedState.schoolLevel = "고등학교";
    seedState.course = "물리학";
    seedState.unit = "힘과 에너지";

    renderSeedSelectors();
    applySeedModeUI();

    elSeed.openBtn?.addEventListener("click", () => openSeedDrawer());
    elSeed.closeBtn?.addEventListener("click", closeSeedDrawer);
    elSeed.backdrop?.addEventListener("click", closeSeedDrawer);

    elSeed.modeFree?.addEventListener("click", () => {
      seedState.mode = "free";
      seedState.project = null;
      applySeedModeUI();
    });

    elSeed.modeProject?.addEventListener("click", () => {
      if (!seedState.project) return;
      seedState.mode = "project";
      applySeedModeUI();
    });

    elSeed.school?.addEventListener("change", e => {
      seedState.schoolLevel = e.target.value;
      seedState.course = "";
      seedState.unit = "";
      seedState.selectedStandards = [];
      renderSeedSelectors();
    });

    elSeed.course?.addEventListener("change", e => {
      seedState.course = e.target.value;
      seedState.unit = "";
      seedState.selectedStandards = [];
      renderSeedSelectors();
    });

    elSeed.unit?.addEventListener("change", e => {
      seedState.unit = e.target.value;
      seedState.selectedStandards = [];
      renderSeedStandards();
    });

    elSeed.period?.addEventListener("change", e => seedState.period = e.target.value);
    elSeed.classType?.addEventListener("change", e => seedState.classType = e.target.value);
    elSeed.level?.addEventListener("change", e => seedState.level = e.target.value);

    elSeed.clearStandards?.addEventListener("click", () => {
      seedState.selectedStandards = [];
      renderSeedStandards();
    });

    elSeed.generateBtn?.addEventListener("click", () => {
      elSeed.output.innerHTML = generateLessonPlanHtml();
    });

    elSeed.saveBtn?.addEventListener("click", saveSeedPlan);

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && elSeed.drawer.classList.contains("open")) {
        closeSeedDrawer();
      }
    });
  } catch (err) {
    console.error("SEED 초기화 실패:", err);
  }
}

function makeCard(p) {
  const node = document.getElementById('card-tpl').content.firstElementChild.cloneNode(true);
  const $ = s => node.querySelector(s);

  const thumb = node.querySelector('.thumb');
  thumb.innerHTML = '';

  const seedBtn = node.querySelector(".seed-btn");
  if (seedBtn) {
    seedBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openSeedPanel(p);
    });
  }

  // [수정됨] 카테고리별 시물이 매핑
  const simulMap = {
    '역학': './image/역학시물이.png',
    '열': './image/열시물이.png',
    '전자/반도체': './image/전기시물이.png',
    '전자기': './image/전기시물이.png',
    '양자': './image/양자시물이.png',
    '현대물리': './image/양자시물이.png',
    '상대성': './image/양자시물이.png',
    '광학': './image/양자시물이.png' // 광학은 빛의 성질이므로 양자와 매칭 (혹은 전기로 변경 가능)
  };

  const FALLBACK_MASCOTS = [
    "./image/역학시물이.png",
    "./image/열시물이.png",
    "./image/전기시물이.png",
    "./image/양자시물이.png"
  ];

  if (p.thumb) {
    const img = document.createElement('img');
    img.src = p.thumb;
    img.alt = p.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.className = 'thumb-img';

    // ★ [추가됨] 이미지 로드 실패 시 실행될 함수
    img.onerror = function () {
      // 1. 무한 루프 방지 (대체 이미지도 실패할 경우를 대비해 이벤트 제거)
      this.onerror = null;

      // 2. 랜덤 마스코트 이미지 선택
      const randomSrc = FALLBACK_MASCOTS[Math.floor(Math.random() * FALLBACK_MASCOTS.length)];
      this.src = randomSrc;

      // 3. 마스코트가 잘 보이도록 스타일 조정 (기존 꽉 찬 배경 스타일 -> 캐릭터 스타일)
      this.style.objectFit = 'contain';
      this.style.padding = '15px';
    };

    thumb.appendChild(img);
  } else if (simulMap[p.category]) {
    // [추가됨] 썸네일은 없지만 시물이가 있는 경우
    const img = document.createElement('img');
    img.src = simulMap[p.category];
    img.alt = p.category + ' 캐릭터';
    img.className = 'thumb-img';
    img.style.objectFit = 'contain';
    img.style.padding = '18px';
    thumb.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.textContent = p.emoji || pickEmoji(p.category);
    thumb.appendChild(span);
  }

  $('h3').textContent = p.title;
  $('.desc').textContent = p.desc || '';
  $('.category').textContent = p.category;
  node.querySelector('.curriculum').textContent = p.curriculumId ? `교육과정: ${p.curriculumId}` : '';
  const tags = node.querySelector('.tags'); tags.innerHTML = '';

  (p.tags || []).forEach(t => {
    const chip = document.createElement('span'); chip.className = 'tag'; chip.textContent = t; tags.append(chip);
  });
  node.querySelector('.demo').href = p.demo || '#';

  node.classList.add('card');

  return node;
}

function pickEmoji(cat) {
  return ({ '시뮬레이션': '🧪', '전자/반도체': '🔌', '광학': '🔬', '상대성': '🛰️', '데이터도구': '📊', '웹앱': '🧩', '열': '🌡️', '역학': '⚙️' })[cat] || '🧩';
}

function render() {
  grid.innerHTML = '';
  let list = [...projects];
  const term = q.value.trim().toLowerCase();
  if (term) { list = list.filter(p => (p.title + p.desc + p.category + (p.tags || []).join(',')).toLowerCase().includes(term)); }
  if (cat.value) { list = list.filter(p => p.category === cat.value); }
  const by = sortSel.value;
  list.sort((a, b) => {
    if (by === 'title') return a.title.localeCompare(b.title, 'ko');
    if (by === 'category') return a.category.localeCompare(b.category, 'ko') || a.title.localeCompare(b.title, 'ko');
    return (b.updated || '').localeCompare(a.updated || '');
  });
  count.textContent = list.length;
  empty.style.display = list.length ? 'none' : 'flex'; // [수정] none or flex

  list.forEach((p, index) => {
    const card = makeCard(p);
    card.classList.add('card-entry');
    grid.append(card);
    setTimeout(() => {
      requestAnimationFrame(() => {
        card.classList.add('card-entry-active');
        setTimeout(() => {
          card.classList.remove('card-entry', 'card-entry-active');
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 600);
      });
    }, index * 50);
  });
}

q.addEventListener('input', render);
cat.addEventListener('change', render);
sortSel.addEventListener('change', render);
render();

// ===== [수정됨] 오늘의 물리 (타자기 효과 + 랜덤 시물이) =====
(function () {
  const FACTS = [
    "헬륨 풍선을 든 차가 급출발하면, 풍선은 뒤가 아니라 앞으로 쏠립니다(공기 밀도 차이).",
    "금속이 차가운 건 온도가 낮아서가 아니라, 나무보다 열을 훨씬 빨리 뺏어가기 때문입니다.",
    "뜨거운 물과 차가운 물은 점성이 달라서, 귀를 기울이면 따르는 소리의 차이를 구분할 수 있습니다.",
    "전자레인지에 포도알 두 개를 붙여 넣으면 접점에서 플라즈마 불꽃이 튀는 현상을 볼 수 있습니다.",
    "거울은 좌우를 반대로 보여주는 게 아니라, 사실 앞과 뒤를 반대로 보여주는 것입니다.",
    "냉장고 문을 세게 닫으면 기압 차이로 인해 옆에 있는 냉동실 문이 툭 튀어나오기도 합니다.",
    "샤워할 때 커튼이 몸 쪽으로 달라붙는 건 베르누이 효과(공기 흐름 빨라짐 → 압력 낮아짐) 때문입니다.",
    "스마트폰 터치스크린은 손가락 끝의 미세한 정전기 변화를 감지하기 때문에 장갑을 끼면 작동하지 않습니다.",
    "높은 빌딩에서 껌을 뱉어도 공기 저항(종단 속도) 때문에 총알처럼 빨라지지 않습니다.",
    "바나나 껍질을 밟으면 터져 나오는 점액질 때문에 마찰 계수가 얼음판 수준으로 낮아집니다.",
    "원자는 99.9999%가 빈 공간이라, 인류 80억 명을 압축하면 각설탕 하나 크기에 다 들어갑니다.",
    "중성자별은 밀도가 너무 높아 티스푼 하나 분량의 무게가 에베레스트 산(약 60억 톤)과 맞먹습니다.",
    "태양 중심에서 만들어진 빛이 표면까지 뚫고 나오는 데는 수만 년이 걸립니다. 우리는 '숙성된 빛'을 보고 있습니다.",
    "국제우주정거장(ISS)은 초속 7.7km로 날아가며, 서울에서 부산까지 1분도 채 걸리지 않습니다.",
    "달은 매년 약 3.8cm씩 지구에서 멀어지고 있어, 아주 먼 미래에는 개기일식을 볼 수 없게 됩니다.",
    "금성은 자전 속도가 너무 느려, 하루(자전)가 1년(공전)보다 깁니다.",
    "우주에는 소리를 전달할 공기가 없어, 바로 옆에서 별이 폭발해도 아무 소리도 들리지 않습니다.",
    "옛날 아날로그 TV의 ‘지지직’거리는 잡음 중 약 1%는 우주 탄생(빅뱅)의 잔광인 우주배경복사입니다.",
    "태양에서 날아온 유령 입자(중성미자)가 지금 이 순간에도 엄지손가락 손톱 만한 면적에 매초 수백억 개씩 통과하고 있습니다.",
    "우주 공간에는 '위/아래'나 '동서남북' 같은 절대적인 방향이 존재하지 않습니다.",
    "전자는 입자이면서 동시에 파동이라, 두 개의 구멍을 동시에 통과하는 것 같은 간섭 무늬를 만듭니다.",
    "양자 역학적으로 입자는 벽을 뚫고 지나갈 확률(터널링)이 0이 아니지만, 사람은 불가능에 가깝습니다.",
    "유리는 고체처럼 보이지만, 물리적으로는 불규칙한 분자 구조를 가진 '비정질 고체'입니다.",
    "다이아몬드는 영원하지 않고, 상온에서 아주아주 천천히 흑연(연필심)으로 변해가고 있습니다.",
    "불꽃놀이의 색깔은 화약이 터지는 게 아니라, 금속 원자의 전자가 점프했다 떨어지며 내는 빛입니다.",
    "자석을 뜨겁게 가열하면(큐리 온도), 자성을 잃고 평범한 쇳덩이가 됩니다.",
    "반물질(Antimatter) 1g이 물질과 만나면 도시 하나를 날려버릴 만큼의 에너지가 나옵니다.",
    "연필심 흑연에서 한 겹만 떼어낸 '그래핀'은 강철보다 200배 이상 강합니다.",
    "특정 조건(삼중점)에서는 물이 끓으면서 동시에 얼음이 어는 기이한 현상이 일어납니다.",
    "우주에 있는 모든 전자는 질량과 전하량이 완벽히 똑같아서 서로 구별할 수 없습니다.",
    "무지개는 반원이 아니라 사실 완전한 원형이며, 비행기를 타면 둥근 무지개를 볼 수 있습니다.",
    "하늘이 파란 이유는 산소와 질소 분자가 파란색 빛을 더 많이 흩뿌리기(산란) 때문입니다.",
    "저녁 노을이 붉은 이유는 빛이 긴 거리를 이동하면서 파란빛은 다 사라지고 붉은빛만 살아남았기 때문입니다.",
    "물리적으로 '핑크색(Magenta)' 파장은 존재하지 않으며, 우리 뇌가 빨강과 보라를 섞어 만든 가상의 색입니다.",
    "소리는 공기 중보다 강철 속에서 10배 이상 빠르게 전달됩니다.",
    "우산에 떨어지는 빗소리는 빗방울 충돌음이 아니라, 물방울 속의 공기 방울이 진동하는 소리입니다.",
    "그림자는 물체가 아니므로 빛의 속도 제한을 받지 않고 이론상 빛보다 빠르게 길어질 수 있습니다.",
    "투명 망토의 원리는 빛이 물체를 감싸고 돌아가게 하여 뒤쪽 배경만 보이게 만드는 것입니다(메타물질).",
    "밤하늘의 별빛은 수백, 수천 년 전에 출발한 것이라, 우리는 별의 '과거'를 보고 있는 셈입니다.",
    "콘서트장에서 저음이 가슴을 울리는 이유는 저주파가 우리 몸의 장기와 공명하기 쉽기 때문입니다.",
    "빛의 속도에 가깝게 달리면 시간이 느리게 흘러, 미래로 여행하는 것과 같은 효과가 생깁니다.",
    "중력이 약한 아파트 꼭대기 층이 1층보다 시간이 아주 미세하게 더 빨리 흐릅니다.",
    "인공위성은 속도가 빠르고 중력이 약해 시간이 다르게 흐르므로, 매일 시간을 보정하지 않으면 내비게이션이 고장 납니다.",
    "깨진 컵이 다시 붙지 않는 것처럼, 우주의 무질서도(엔트로피)는 항상 증가하는 방향으로만 흐릅니다.",
    "종이 클립 하나를 100% 에너지로 바꾸면($E=mc^2$) 히로시마 원자폭탄급 위력이 나옵니다.",
    "블랙홀에 발부터 들어가면 중력 차이 때문에 몸이 국수 가닥처럼 길게 늘어나는 '스파게티화' 현상을 겪게 됩니다.",
    "블랙홀은 중력이 너무 강해 빛조차 빠져나올 수 없는 우주의 감옥 같은 곳입니다.",
    "우주정거장의 나사는 무중력이라 둥둥 떠있는 게 아니라, 지구로 계속 추락하면서 둥근 지구를 빗나가고 있는 것입니다(공전).",
    "쌍둥이 중 한 명이 우주 여행을 하고 오면, 지구에 남은 형제보다 더 젊어져 있습니다(쌍둥이 역설).",
    "이론적으로 공간을 종이처럼 접어 구멍을 뚫으면(웜홀), 수억 광년 떨어진 곳도 순식간에 갈 수 있습니다."
  ];

  // [추가] 마스코트 배열
  const MASCOTS = [
    "./image/역학시물이.png",
    "./image/열시물이.png",
    "./image/전기시물이.png",
    "./image/양자시물이.png"
  ];

  const factEl = document.getElementById('fact-text');
  const nextBtn = document.getElementById('next-fact');
  const copyBtn = document.getElementById('copy-fact');
  const mascotEl = document.getElementById('fact-mascot'); // 이미지 태그

  let last = -1;
  let typingTimer = null;
  let currentFactText = "";

  function pick() {
    let i = Math.floor(Math.random() * FACTS.length);
    if (i === last) i = (i + 1) % FACTS.length;
    last = i;
    return FACTS[i];
  }

  // 타자기 효과 함수
  function typeWriter(text, element) {
    if (typingTimer) clearTimeout(typingTimer);

    element.textContent = '';
    let i = 0;
    const speed = 25;

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        typingTimer = setTimeout(type, speed);
      } else {
        typingTimer = null;
      }
    }
    type();
  }

  function next() {
    currentFactText = pick();
    typeWriter(currentFactText, factEl);

    // [추가] 마스코트 랜덤 변경 + 애니메이션
    if (mascotEl) {
      const randomMascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      mascotEl.src = randomMascot;

      // 살짝 튀어오르는 애니메이션
      mascotEl.style.transform = "scale(0.8)";
      setTimeout(() => mascotEl.style.transform = "scale(1)", 150);
    }
  }

  nextBtn.addEventListener('click', next);
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentFactText || factEl.textContent);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '복사됨!';
      setTimeout(() => copyBtn.textContent = originalText, 900);
    } catch (e) {
      alert('복사 실패: ' + e.message);
    }
  });

  next();
})();

// ===== 인터랙티브 중력 배경 (Final Polish: Red Blur Reduced) =====
(function () {
  const canvas = document.getElementById('gravity-bg');
  const ctx = canvas.getContext('2d');

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }).observe(canvas);

  let PARTICLE_COUNT = 350;
  const particles = [];
  const attractors = [];

  // ===== 게임 상태 =====
  let consumedCount = 0;
  const TARGET_COUNT = 50;
  let sunState = 'normal';
  let explosionTimer = 0;

  // ===== 물리 상수 =====
  const INITIAL_G = 80;
  let G = INITIAL_G;
  const SOFTENING = 800;

  function initSolarSystem() {
    particles.length = 0;
    attractors.length = 0;
    consumedCount = 0;
    sunState = 'normal';
    G = INITIAL_G;

    const sun = {
      x: W / 2, y: H / 2,
      vx: 0, vy: 0,
      m: 5000,
      fixed: true,
      color: 'rgba(255, 220, 100,'
    };
    attractors.push(sun);

    spawnParticlesOrbiting(sun, PARTICLE_COUNT);
  }

  function spawnParticlesOrbiting(center, count, isExplosion = false) {
    for (let i = 0; i < count; i++) {
      const r = isExplosion ? Math.random() * 30 : 100 + Math.random() * (Math.min(W, H) / 2 - 120);
      const angle = Math.random() * Math.PI * 2;

      const px = center.x + Math.cos(angle) * r;
      const py = center.y + Math.sin(angle) * r;

      let vx, vy;
      if (isExplosion) {
        const speed = 25 + Math.random() * 45;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      } else {
        const speed = Math.sqrt((G * center.m) / r);
        vx = -Math.sin(angle) * speed + center.vx;
        vy = Math.cos(angle) * speed + center.vy;
      }

      particles.push({
        x: px, y: py,
        vx: vx, vy: vy,
        m: 0.8 + Math.random() * 1.2,
        isDebris: isExplosion
      });
    }
  }

  function triggerSupernova() {
    sunState = 'exploding';
    explosionTimer = 140;
    const sun = attractors[0];
    spawnParticlesOrbiting(sun, 700, true);
    for (let i = 1; i < attractors.length; i++) {
      const p = attractors[i];
      const dx = p.x - sun.x;
      const dy = p.y - sun.y;
      const angle = Math.atan2(dy, dx);
      p.vx += Math.cos(angle) * 40;
      p.vy += Math.sin(angle) * 40;
    }
  }

  // UI 제어
  const runBtn = document.getElementById('toggle-run');
  const trailBtn = document.getElementById('toggle-trail');
  const resetBtn = document.getElementById('reset');
  const slider = document.getElementById('particle-count');
  const label = document.getElementById('particle-label');
  let running = true, trails = true;

  runBtn.addEventListener('click', () => { running = !running; runBtn.textContent = running ? '⏸︎ 일시정지' : '▶ 재생'; });
  trailBtn.addEventListener('click', () => { trails = !trails; trailBtn.textContent = '트레일: ' + (trails ? '켜짐' : '꺼짐'); });
  resetBtn.addEventListener('click', initSolarSystem);
  slider.addEventListener('input', () => { PARTICLE_COUNT = +slider.value; label.textContent = PARTICLE_COUNT; initSolarSystem(); });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) return;
    if (sunState === 'exploding') return;

    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    const newMass = 3000;
    const center = attractors[0];
    const dx = x - center.x;
    const dy = y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const orbitSpeed = Math.sqrt((G * center.m) / dist);

    const colors = ['rgba(150, 200, 255,', 'rgba(255, 180, 180,', 'rgba(200, 180, 255,'];
    const randColor = colors[Math.floor(Math.random() * colors.length)];

    attractors.push({
      x: x, y: y,
      vx: -Math.sin(angle) * orbitSpeed,
      vy: Math.cos(angle) * orbitSpeed,
      m: newMass,
      fixed: false,
      color: randColor
    });
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (attractors.length > 1) attractors.pop();
  });

  function step() {
    const dt = 0.5;
    const center = attractors[0];

    if (sunState === 'exploding') {
      explosionTimer--;
      canvas.style.transform = `translate(${Math.random() * 8 - 4}px, ${Math.random() * 8 - 4}px)`;
      if (explosionTimer <= 0) {
        sunState = 'blackhole';
        canvas.style.transform = 'none';
        G = 600;
        center.m = 25000;
      }
    }

    for (let i = attractors.length - 1; i > 0; i--) {
      const body = attractors[i];
      const dx = center.x - body.x;
      const dy = center.y - body.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      const threshold = sunState === 'blackhole' ? 60 : 40;
      if (dist < threshold) {
        attractors.splice(i, 1);
        if (sunState === 'normal') {
          consumedCount++;
          console.log(`Mass: ${consumedCount}/${TARGET_COUNT}`);
          if (consumedCount >= TARGET_COUNT) triggerSupernova();
        }
        continue;
      }

      let ax = 0, ay = 0;
      for (let j = 0; j < attractors.length; j++) {
        if (i === j) continue;
        const other = attractors[j];
        const odx = other.x - body.x;
        const ody = other.y - body.y;
        const odistSq = odx * odx + ody * ody;
        const forceG = (j === 0) ? G : INITIAL_G;
        const force = (forceG * other.m) / (odistSq + SOFTENING);
        const oDist = Math.sqrt(odistSq);
        ax += (odx / oDist) * force;
        ay += (ody / oDist) * force;
      }

      body.vx += ax * dt;
      body.vy += ay * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;

      if (body.x < -W || body.x > W * 2 || body.y < -H || body.y > H * 2) {
        attractors.splice(i, 1);
      }
    }

    for (const p of particles) {
      let ax = 0, ay = 0;
      for (const att of attractors) {
        const dx = att.x - p.x;
        const dy = att.y - p.y;
        const distSq = dx * dx + dy * dy;
        const currentG = (att === center) ? G : INITIAL_G;
        const force = (currentG * att.m) / (distSq + SOFTENING);
        const dist = Math.sqrt(distSq);
        ax += (dx / dist) * force;
        ay += (dy / dist) * force;

        if (sunState === 'blackhole' && att === center && distSq < 2000) {
          p.x = -9999;
        }
      }

      p.vx += ax * dt;
      p.vy += ay * dt;
      if (p.isDebris) { p.vx *= 0.98; p.vy *= 0.98; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const limit = Math.max(W, H) * 2;
      if (sunState !== 'blackhole' && (p.x < -limit || p.x > W + limit || p.y < -limit || p.y > H + limit)) {
        const r = 150 + Math.random() * 200;
        const a = Math.random() * Math.PI * 2;
        p.x = center.x + Math.cos(a) * r;
        p.y = center.y + Math.sin(a) * r;
        const v = Math.sqrt((G * center.m) / r);
        p.vx = -Math.sin(a) * v;
        p.vy = Math.cos(a) * v;
      }
    }
  }

  // ★ 블러 처리된 유체 느낌의 원 그리기 함수
  function drawFluidLayer(ctx, x, y, radius, color, blurAmount, time, speed) {
    ctx.beginPath();
    ctx.shadowBlur = blurAmount;
    ctx.shadowColor = color;
    ctx.fillStyle = color;

    for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
      const noise = Math.sin(angle * 4 + time * speed) * 4
        + Math.cos(angle * 6 - time * speed * 1.5) * 3;

      const r = radius + noise;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (angle === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  function draw() {
    // 1. 배경 처리
    if (trails) {
      ctx.globalCompositeOperation = 'source-over';
      if (sunState === 'exploding') ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
      else ctx.fillStyle = 'rgba(11, 16, 32, 0.2)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    const center = attractors[0];
    const time = Date.now() / 1000;

    // 2. 태양 / 블랙홀 그리기
    if (sunState === 'normal') {
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y, 50);
      grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
      grad.addColorStop(0.5, 'rgba(255, 200, 50, 0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(center.x, center.y, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(center.x, center.y, 8, 0, Math.PI * 2); ctx.fill();

    } else if (sunState === 'exploding') {
      ctx.globalCompositeOperation = 'lighter';
      const r = 60 + Math.random() * 100;
      const grad = ctx.createRadialGradient(center.x, center.y, 10, center.x, center.y, r * 4);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, 'rgba(200, 200, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(center.x, center.y, r * 4, 0, Math.PI * 2); ctx.fill();

    } else if (sunState === 'blackhole') {
      // === [Black Hole Rendering] ===
      ctx.globalCompositeOperation = 'lighter';

      // 1. 외부 열기 (붉은색): Blur 25 -> 10 (선명하게!)
      drawFluidLayer(ctx, center.x, center.y, 50, '#ff3300', 25, time, 1.5);

      // 2. 중간 가스층 (주황색): Blur 15
      drawFluidLayer(ctx, center.x, center.y, 40, '#ff9900', 15, time, 3.0);

      // 3. 내부 핵심층 (노란색): Blur 7
      drawFluidLayer(ctx, center.x, center.y, 35, '#ffffaa', 7, time, 5.0);

      // 4. 사건의 지평선
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.beginPath();
      const holeR = 28 + Math.sin(time * 15) * 0.3;
      ctx.arc(center.x, center.y, holeR, 0, Math.PI * 2);
      ctx.fill();

      // 5. 포톤 링
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';

    // 3. 행성들
    for (let i = 1; i < attractors.length; i++) {
      const att = attractors[i];
      const grad = ctx.createRadialGradient(att.x, att.y, 2, att.x, att.y, 25);
      grad.addColorStop(0, att.color + '0.8)');
      grad.addColorStop(1, att.color + '0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(att.x, att.y, 25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(att.x, att.y, 4, 0, Math.PI * 2); ctx.fill();
    }

    // 4. 입자들
    for (const p of particles) {
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;

      const speed = Math.hypot(p.vx, p.vy);
      let hue, sat, light, alpha;

      if (sunState === 'blackhole') {
        hue = 30 - speed * 1.5;
        sat = 100;
        light = 60 + speed * 2;
        alpha = 0.5 + speed * 0.05;
      } else {
        hue = 220;
        sat = 60 + speed * 5;
        light = 40 + speed * 8;
        alpha = 0.3 + speed * 0.05;
      }

      if (light > 95) { light = 100; sat = 0; }

      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
      ctx.arc(p.x, p.y, p.m, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (running) { step(); draw(); }
    requestAnimationFrame(loop);
  }

  setTimeout(() => {
    initSolarSystem();
    requestAnimationFrame(loop);
  }, 100);

})();
// ===== 로그인 모달 UI 동작 (기존 유지) =====
(function () {
  const panel = document.getElementById('auth-panel');
  const openBtn = document.getElementById('open-auth');
  const closeBtn = panel ? panel.querySelector('.auth-close') : null;

  if (!panel || !openBtn) return;

  let backdrop = document.getElementById('auth-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'auth-backdrop';
    document.body.appendChild(backdrop);
  }

  function openModal() {
    panel.classList.add('open');
    backdrop.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    panel.classList.remove('open');
    backdrop.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
  }

  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('open')) closeModal();
    else openModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closeModal();
    }
  });
})();
initSeedGemini();