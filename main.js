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
{title:"물리 공식 맞추기", category:"게임", desc:"떨어지는 물리 공식을 맞추자!", tags:["물리","공식"], emoji:"❤️", demo:"./simul/물리 공식 맞추기.html", curriculumId:"ALL", thumb:"./thumb_nail/물리 공식 맞추기.png"},

// ===== 12물리 =====
{title:"토크와 평형", category:"역학", desc:"여러 물체를 이용해 토크평형 만들기", tags:["토크","평형"], emoji:"🧗‍♀️", demo:"./simul/토크와 평형.html", curriculumId:"[12물리01-01]", thumb:"./thumb_nail/토크와_평형.png"},
{title: "위치와 변위",  category: "역학",  desc: "선을 그려 이동거리와 변위의 차이를 눈으로 확인하기 (직선 그리기 도전!)",  tags: ["이동거리", "변위", "벡터"],  emoji: "📏",  demo: "./simul/위치와 변위.html",  curriculumId: "[12물리01-02]",  thumb: "./thumb_nail/위치와 변위.png"},
{title: "우주 미아 생존기",  category: "역학",  desc: "공구를 던져 장애물을 피하고 귀환하라! 운동량 보존 법칙 퍼즐 게임",  tags: ["운동량보존", "작용반작용", "벡터", "게임"],  emoji: "👨‍🚀",  demo: "./simul/우주 미아.html",  curriculumId: "[12물리01-03]",  thumb: "./thumb_nail/우주 미아.png"},
{title:"일과 운동에너지", category:"역학", desc:"용수철을 이용해 일과 운동에너지 비교하기", tags:["일","운동에너지"], emoji:"🧗‍♀️", demo:"./simul/일과 운동에너지.html", curriculumId:"[12물리01-04]", thumb:"./thumb_nail/일과_운동에너지.png"},
{title:"줄의 실험", category:"열", desc:"줄의 일의 열당량을 알아보기", tags:["줄","일의 열당량"], emoji:"🧗‍♀️", demo:"./simul/줄의 실험.html", curriculumId:"[12물리01-05]", thumb:"./thumb_nail/줄의_실험.png"},
{title:"열역학", category:"열", desc:"등압, 등적, 등온, 단열과정 확인하기", tags:["열기관","열과정"], emoji:"🐦‍🔥", demo:"./simul/열역학.html", curriculumId:"[12물리01-06], [12역학02-02]", thumb:"./thumb_nail/열역학.png"},
{title:"전기장과 등전위면", category:"전자/반도체", desc:"전하가 만드는 전기장과 등전위면을 알아보기", tags:["전기장","등전위면"], emoji:"⚡", demo:"./simul/전기장과 등전위면.html", curriculumId:"[12물리02-01], [12전자01-01]", thumb:"./thumb_nail/전기장과_등전위면.png"},
{title:"옴의 법칙", category:"전자/반도체", desc:"V=IR, 직렬/병렬 에 따른 옴의 법칙 확인하기", tags:["전압","전류"], emoji:"⚡", demo:"./simul/옴의 법칙.html", curriculumId:"[12물리02-02]", thumb:"./thumb_nail/옴의_법칙.png"},
{title:"전자기유도", category:"전자/반도체", desc:"전자기 유도현상과 정류자의 역할 알아보기", tags:["전자기유도","정류자"], emoji:"⚡", demo:"./simul/전자기유도.html", curriculumId:"[12물리02-05], [12전자01-05]", thumb:"./thumb_nail/전자기유도.png"},
{title:"간섭무늬", category:"광학", desc:"파장과 파원의 간격 조절로 간섭 패턴 관찰.", tags:["파동","무늬"], emoji:"🎯", demo:"./simul/간섭무늬.html", curriculumId:"[12물리03-01]", thumb:"./thumb_nail/간섭무늬.png"},
{title:"렌즈의 굴절", category:"광학", desc:"렌즈의 종류에 따라 어떤 상이 맺히는지 확인하기", tags:["렌즈","상"], emoji:"🔭", demo:"./simul/렌즈의 굴절.html", curriculumId:"[12물리03-02]", thumb:"./thumb_nail/렌즈의_법칙.png"},
{title:"스넬의 법칙", category:"광학", desc:"굴절률 변화에 따른 입사/굴절/임계각 확인하기", tags:["n1,n2","TIR"], emoji:"📐", demo:"./simul/스넬의 법칙.html", curriculumId:"[12물리03-02]", thumb:"./thumb_nail/스넬의_법칙.png"},
{title:"다이오드", category:"전자/반도체", desc:"PN 접합·공핍층·I–V 특성 직관", tags:["PN","I–V"], emoji:"🔌", demo:"./simul/다이오드.html", curriculumId:"[12물리03-05]", thumb:"./thumb_nail/다이오드.png"},
{title:"상대성이론", category:"상대성", desc:"우주선의 속력에 따라 행성의 변화 관찰하기", tags:["특수","일반"], emoji:"🚀", demo:"./simul/상대성이론.html", curriculumId:"[12물리03-06]", thumb:"./thumb_nail/상대성이론.png"},

// ===== 12역학 =====
{title:"힘의 합력", category:"역학", desc:"여러 힘의 합력 알아보기", tags:["힘","알짜힘"], emoji:"🧗‍♀️", demo:"./simul/힘의 평형.html", curriculumId:"[12역학01-01]", thumb:"./thumb_nail/힘의_평형.png"},
{title:"포물선 운동", category:"역학", desc:"대포를 쏴서 과녁을 맞추자.", tags:["포물선운동","게임"], emoji:"🌈", demo:"./simul/포물선 운동.html", curriculumId:"[12역학01-02]", thumb:"./thumb_nail/포물선_운동.png"},
{title: "진화하는 로켓",category: "역학",  desc: "내가 그린 미로를 탈출하라! 유전 알고리즘으로 길을 찾는 AI 로켓",tags: ["유전알고리즘", "인공지능", "그리기"], emoji: "🧬", demo: "./simul/경로찾기.html", curriculumId: "[12역학01-02]", thumb: "./thumb_nail/경로찾기.png"},
{title:"궤도 올리기", category:"역학", desc:"행성의 탈출속도와 위성의 궤도 알아보기", tags:["중력","탈출속도", "궤도"], emoji:"🧗‍♀️", demo:"./simul/궤도 올리기.html", curriculumId:"[12역학01-04], [12역학01-05]", thumb:"./thumb_nail/궤도 올리기.png"},
{title:"맥스웰의 도깨비", category:"열", desc:"엔트로피를 거슬러라! 뜨거운 공과 차가운 공을 분류하는 미니 게임", tags:["엔트로피", "열역학", "게임"], emoji:"😈", demo:"./simul/멕스웰 도깨비.html", curriculumId:"[12역학02-05]", thumb:"./thumb_nail/멕스웰 도깨비.png"},
{title: "극한의 번지점프", category: "역학", desc: "가속도와 변위의 관계! 바닥에 닿지도, 기절하지도 않게 k값을 조절하라",  tags: ["단진동", "용수철", "가속도", "G-Force"],  emoji: "🪂",  demo: "./simul/번지점프.html",  curriculumId: "[12역학03-01]", thumb: "./thumb_nail/번지점프.png"},
{title:"도플러효과", category:"광학", desc:"음원의 속도와 진동수에 따른 관측 음원의 변화 관찰하기", tags:["도플러","파동"], emoji:"🎵", demo:"./simul/도플러효과.html", curriculumId:"[12역학03-03]", thumb:"./thumb_nail/도플러효과.png"},

// ===== 12전자 =====
{title:"RLC 공명", category:"전자/반도체", desc:"직렬 RLC 회로의 공명/위상·전류 변화 시각화하기", tags:["회로","공명"], emoji:"🔄", demo:"./simul/RLC 공명.html", curriculumId:"[12전자01-06]", thumb:"./thumb_nail/RLC회로.png"},
{title:"러더퍼드 알파입자 산란실험", category:"시뮬레이션", desc:"러더퍼드의 알파입자 산란실험 확인하기", tags:["산란","쿨롱"], emoji:"🧪", demo:"./simul/러더퍼드 알파입자 산란실험.html", curriculumId:"[12전자01-06]", thumb:"./thumb_nail/러더퍼드_산란실험.png"},
{title:"편광과 LCD", category:"광학", desc:"편광의 원리와 LCD의 원리 알아보기", tags:["편광","LCD"], emoji:"🔭", demo:"./simul/편광과 LCD.html", curriculumId:"[12전자02-03]", thumb:"./thumb_nail/편광과 LCD.png"},
{title:"광전효과", category:"전자/반도체", desc:"파장/세기에 따른 광전자 방출과 임계 주파수 확인하기", tags:["광자","금속"], emoji:"📸", demo:"./simul/광전효과.html", curriculumId:"[12전자02-04]", thumb:"./thumb_nail/광전효과.png"},
{title:"발광 다이오드", category:"전자/반도체", desc:"파장별 전압·밴드갭과 발광.", tags:["LED","밴드갭"], emoji:"💡", demo:"./simul/발광 다이오드.html", curriculumId:"[12전자02-04]", thumb:"./thumb_nail/발광_다이오드.png"},
{title:"LASER", category:"광학, 전자/반도체", desc:"빛의 복제 공장! 유도 방출과 반전 분포로 만드는 강력한 빛", tags:["레이저", "증폭", "유도방출"], emoji:"🔦", demo:"./simul/레이저.html", curriculumId:"[12전자02-05]", thumb:"./thumb_nail/레이저.png"},
{title:"이중슬릿", category:"광학", desc:"이중슬릿을 통과한 전자의 간섭무늬 확인하기", tags:["슬릿","간섭"], emoji:"〰️", demo:"./simul/이중슬릿.html", curriculumId:"[12전자03-01]", thumb:"./thumb_nail/이중슬릿.png"},
{title:"양자 터널링", category:"현대물리", desc:"입자가 벽을 뚫고 지나간다? 양자 터널 효과와 확률 파동", tags:["양자역학","터널링","파동함수"], emoji:"👻", demo:"./simul/양자 터널링.html", curriculumId:"[12전자03-03]", thumb:"./thumb_nail/양자_터널링.png"},
{title:"원자모형", category:"시뮬레이션", desc:"보어/오비탈/전자구름 개념 확인하기", tags:["원자","준위"], emoji:"🧬", demo:"./simul/원자모형.html", curriculumId:"[12전자03-04]", thumb:"./thumb_nail/원자모형.png"}

  ];
  
  
  const grid   = document.getElementById('grid');
  const q      = document.getElementById('q');
  const cat    = document.getElementById('cat');
  const sortSel= document.getElementById('sort');
  const count  = document.getElementById('count');
  const empty  = document.getElementById('empty');
  
  function makeCard(p){
    const node = document.getElementById('card-tpl').content.firstElementChild.cloneNode(true);
    const $ = s => node.querySelector(s);
  
    const thumb = node.querySelector('.thumb');
    thumb.innerHTML = '';

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

    if (p.thumb) {
      const img = document.createElement('img');
      img.src = p.thumb;
      img.alt = p.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'thumb-img';
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
    const tags = node.querySelector('.tags'); tags.innerHTML='';
  
    (p.tags||[]).forEach(t=>{
      const chip=document.createElement('span'); chip.className='tag'; chip.textContent=t; tags.append(chip);
    });
    node.querySelector('.demo').href = p.demo || '#';
  
    node.classList.add('card'); 
  
    return node;
  }
  
  function pickEmoji(cat){
    return ({'시뮬레이션':'🧪','전자/반도체':'🔌','광학':'🔬','상대성':'🛰️','데이터도구':'📊','웹앱':'🧩','열':'🌡️','역학':'⚙️'})[cat] || '🧩';
  }
  
  function render(){
    grid.innerHTML = '';
    let list = [...projects];
    const term = q.value.trim().toLowerCase();
    if(term){ list = list.filter(p=> (p.title+p.desc+p.category+(p.tags||[]).join(',')).toLowerCase().includes(term)); }
    if(cat.value){ list = list.filter(p=> p.category===cat.value); }
    const by = sortSel.value;
    list.sort((a,b)=>{
      if(by==='title') return a.title.localeCompare(b.title,'ko');
      if(by==='category') return a.category.localeCompare(b.category,'ko') || a.title.localeCompare(b.title,'ko');
      return (b.updated||'').localeCompare(a.updated||'');
    });
    count.textContent = list.length;
    empty.style.display = list.length? 'none':'flex'; // [수정] none or flex
  
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
  (function(){
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

    const factEl  = document.getElementById('fact-text');
    const nextBtn = document.getElementById('next-fact');
    const copyBtn = document.getElementById('copy-fact');
    const mascotEl = document.getElementById('fact-mascot'); // 이미지 태그
    
    let last = -1;
    let typingTimer = null; 
    let currentFactText = ""; 
  
    function pick(){ 
        let i=Math.floor(Math.random()*FACTS.length); 
        if(i===last) i=(i+1)%FACTS.length; 
        last=i; 
        return FACTS[i]; 
    }
  
    // 타자기 효과 함수
    function typeWriter(text, element) {
        if(typingTimer) clearTimeout(typingTimer);
        
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
  
    function next(){ 
        currentFactText = pick();
        typeWriter(currentFactText, factEl);

        // [추가] 마스코트 랜덤 변경 + 애니메이션
        if(mascotEl) {
            const randomMascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
            mascotEl.src = randomMascot;
            
            // 살짝 튀어오르는 애니메이션
            mascotEl.style.transform = "scale(0.8)";
            setTimeout(() => mascotEl.style.transform = "scale(1)", 150);
        }
    }
  
    nextBtn.addEventListener('click', next);
    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(currentFactText || factEl.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent='복사됨!'; 
        setTimeout(()=>copyBtn.textContent=originalText, 900);
      }catch(e){
        alert('복사 실패: '+e.message);
      }
    });
  
    next();
  })();
  
  // ===== 인터랙티브 중력 배경 (기존 유지) =====
  (function(){
    const canvas=document.getElementById('gravity-bg');
    const ctx=canvas.getContext('2d');
    const dpr=Math.min(window.devicePixelRatio||1,2);
    let W=0,H=0;
    new ResizeObserver(()=>{
      const r=canvas.getBoundingClientRect();
      W=r.width|0; H=r.height|0;
      canvas.width=(W*dpr)|0; canvas.height=(H*dpr)|0;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }).observe(canvas);
  
    let PARTICLE_COUNT=260;
    const particles=[];
    function resetParticles(){
      particles.length=0;
      for(let i=0;i<PARTICLE_COUNT;i++){
        particles.push({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5, m:1+Math.random()*1 });
      }
    }
  
    const runBtn=document.getElementById('toggle-run');
    const trailBtn=document.getElementById('toggle-trail');
    const resetBtn=document.getElementById('reset');
    const slider=document.getElementById('particle-count');
    const label=document.getElementById('particle-label');
    let running=true, trails=true, pointerActive=false;
  
    runBtn.addEventListener('click',()=>{ running=!running; runBtn.textContent= running? '⏸︎ 일시정지':'▶ 재생'; });
    trailBtn.addEventListener('click',()=>{ trails=!trails; trailBtn.textContent='트레일: '+(trails?'켜짐':'꺼짐'); });
    resetBtn.addEventListener('click',()=>{ points.length=0; cursorPoint=null; resetParticles(); });
    slider.addEventListener('input',()=>{ PARTICLE_COUNT=+slider.value; label.textContent=PARTICLE_COUNT; resetParticles(); });
  
    function pos(ev){
      const r=canvas.getBoundingClientRect();
      const x=(ev.touches? ev.touches[0].clientX:ev.clientX)-r.left;
      const y=(ev.touches? ev.touches[0].clientY:ev.clientY)-r.top;
      return {x,y};
    }
  
    const points=[];
    let cursorPoint=null;
    function start(x,y){ pointerActive=true; cursorPoint={x,y,m:240}; points[0]=cursorPoint; }
    function move(x,y){ if(pointerActive && cursorPoint){ cursorPoint.x=x; cursorPoint.y=y; } }
    function end(){ pointerActive=false; cursorPoint=null; points.length=0; }
  
    canvas.addEventListener('pointerdown', e=>{ const p=pos(e); start(p.x,p.y); }, {passive:true});
    canvas.addEventListener('pointermove', e=>{ if(pointerActive){ const p=pos(e); move(p.x,p.y);} }, {passive:true});
    canvas.addEventListener('pointerup', end, {passive:true});
    canvas.addEventListener('pointercancel', end, {passive:true});
    canvas.addEventListener('mouseleave', end);
  
    canvas.addEventListener('touchstart', e=>{ const p=pos(e); start(p.x,p.y); }, {passive:true});
    canvas.addEventListener('touchmove',  e=>{ if(pointerActive){ const p=pos(e); move(p.x,p.y);} }, {passive:true});
    canvas.addEventListener('touchend', end, {passive:true});
    canvas.addEventListener('touchcancel', end, {passive:true});
  
    const G=120, FRICTION=0.995, MAX_SPEED=3.6;
    function step(dt){
      for(const a of particles){
        let ax=0, ay=0;
        for(const p of points){
          let dx=p.x-a.x, dy=p.y-a.y;
          let r2=dx*dx+dy*dy;
          r2=Math.max(36, Math.min(r2, 50000));
          const invr=1/Math.sqrt(r2);
          const force=(G*p.m*a.m)/r2;
          ax+=force*dx*invr*0.0015; ay+=force*dy*invr*0.0015;
        }
        a.vx=(a.vx+ax*dt)*FRICTION; a.vy=(a.vy+ay*dt)*FRICTION;
        const sp=Math.hypot(a.vx,a.vy); if(sp>MAX_SPEED){ a.vx*=MAX_SPEED/sp; a.vy*=MAX_SPEED/sp; }
        a.x+=a.vx*dt*60/1000*16; a.y+=a.vy*dt*60/1000*16;
        if(a.x<0){a.x=0;a.vx*=-.8} if(a.x>W){a.x=W;a.vx*=-.8}
        if(a.y<0){a.y=0;a.vy*=-.8} if(a.y>H){a.y=H;a.vy*=-.8}
      }
    }
    function draw(){
      if(!trails){ ctx.clearRect(0,0,W,H);} else { ctx.fillStyle='rgba(11,16,32,0.12)'; ctx.fillRect(0,0,W,H); }
      for(const p of points){
        const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,28);
        grd.addColorStop(0,'rgba(107,230,117,0.9)'); grd.addColorStop(1,'rgba(107,230,117,0)');
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(p.x,p.y,28,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(107,230,117,0.35)'; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.beginPath();
      for(const a of particles){ ctx.moveTo(a.x+1.5,a.y); ctx.arc(a.x,a.y,1.5,0,Math.PI*2); }
      ctx.fillStyle='rgba(200,220,240,0.9)'; ctx.fill();
    }
  
    let last=performance.now();
    function loop(now){ 
      const dt=Math.min(32, now-last); 
      last=now; 
      if(running){ step(dt); draw(); } 
      requestAnimationFrame(loop); 
    }
    if(canvas.getBoundingClientRect().width===0) canvas.style.width='100%';
    resetParticles();
    requestAnimationFrame(loop);
    new ResizeObserver(()=>{ resetParticles(); }).observe(canvas);
  })();
  
  // ===== 로그인 모달 UI 동작 (기존 유지) =====
  (function(){
    const panel = document.getElementById('auth-panel');
    const openBtn = document.getElementById('open-auth');
    const closeBtn = panel ? panel.querySelector('.auth-close') : null;
  
    if(!panel || !openBtn) return;
  
    let backdrop = document.getElementById('auth-backdrop');
    if(!backdrop) {
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
      if(panel.classList.contains('open')) closeModal();
      else openModal();
    });
  
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
  
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && panel.classList.contains('open')) {
        closeModal();
      }
    });
  })();