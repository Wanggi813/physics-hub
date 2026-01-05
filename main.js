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
    {title:"물리 공식 맞추기", category:"게임", desc:"떨어지는 물리 공식을 맞추자!", tags:["물리","공식"], emoji:"❤️", demo:"./simul/물리 공식 맞추기.html", curriculumId:"ALL", thumb:"./thumb_nail/물리 공식 맞추기.png"},
    {title:"토크와 평형", category:"역학", desc:"여러 물체를 이용해 토크평형 만들기", tags:["토크","평형"], emoji:"🧗‍♀️", demo:"./simul/토크와 평형.html", curriculumId:"[12물리01-01]", thumb:"./thumb_nail/토크와_평형.png"},
    {title:"힘의 합력", category:"역학", desc:"여러 힘의 합력 알아보기", tags:["힘","알짜힘"], emoji:"🧗‍♀️", demo:"./simul/힘의 평형.html", curriculumId:"[12역학01-01]", thumb:"./thumb_nail/힘의_평형.png"},
    {title:"궤도 올리기", category:"역학", desc:"행성의 탈출속도와 위성의 궤도 알아보기", tags:["중력","탈출속도", "궤도"], emoji:"🧗‍♀️", demo:"./simul/궤도 올리기.html", curriculumId:"[12역학01-04], [12역학01-05]", thumb:"./thumb_nail/궤도 올리기.png"},
    {title:"일과 운동에너지", category:"역학", desc:"용수철을 이용해 일과 운동에너지 비교하기", tags:["일","운동에너지"], emoji:"🧗‍♀️", demo:"./simul/일과 운동에너지.html", curriculumId:"[12물리01-04]", thumb:"./thumb_nail/일과_운동에너지.png"},
    {title:"줄의 실험", category:"열", desc:"줄의 일의 열당량을 알아보기", tags:["줄","일의 열당량"], emoji:"🧗‍♀️", demo:"./simul/줄의 실험.html", curriculumId:"[12물리01-05]", thumb:"./thumb_nail/줄의_실험.png"},
    {title:"RLC 공명", category:"전자/반도체", desc:"직렬 RLC 회로의 공명/위상·전류 변화 시각화하기", tags:["회로","공명"], emoji:"🔄", demo:"./simul/RLC 공명.html", curriculumId:"[12전자01-06]", thumb:"./thumb_nail/RLC회로.png"},
    {title:"간섭무늬", category:"광학", desc:"파장과 파원의 간격 조절로 간섭 패턴 관찰.", tags:["파동","무늬"], emoji:"🎯", demo:"./simul/간섭무늬.html", curriculumId:"[12물리03-01]", thumb:"./thumb_nail/간섭무늬.png"},
    {title:"광전효과", category:"전자/반도체", desc:"파장/세기에 따른 광전자 방출과 임계 주파수 확인하기", tags:["광자","금속"], emoji:"📸", demo:"./simul/광전효과.html", curriculumId:"[12전자02-04]", thumb:"./thumb_nail/광전효과.png"},
    {title:"다이오드", category:"전자/반도체", desc:"PN 접합·공핍층·I–V 특성 직관", tags:["PN","I–V"], emoji:"🔌", demo:"./simul/다이오드.html", curriculumId:"[12물리03-05]", thumb:"./thumb_nail/다이오드.png"},
    {title:"도플러효과", category:"광학", desc:"음원의 속도와 진동수에 따른 관측 음원의 변화 관찰하기", tags:["도플러","파동"], emoji:"🎵", demo:"./simul/도플러효과.html", curriculumId:"[12역학03-03]", thumb:"./thumb_nail/도플러효과.png"},
    {title:"러더퍼드 알파입자 산란실험", category:"시뮬레이션", desc:"러더퍼드의 알파입자 산란실험 확인하기", tags:["산란","쿨롱"], emoji:"🧪", demo:"./simul/러더퍼드 알파입자 산란실험.html", curriculumId:"[12전자01-06]", thumb:"./thumb_nail/러더퍼드_산란실험.png"},
    {title:"렌즈의 굴절", category:"광학", desc:"렌즈의 종류에 따라 어떤 상이 맺히는지 확인하기", tags:["렌즈","상"], emoji:"🔭", demo:"./simul/렌즈의 굴절.html", curriculumId:"[12물리03-02]", thumb:"./thumb_nail/렌즈의_법칙.png"},
    {title:"발광 다이오드", category:"전자/반도체", desc:"파장별 전압·밴드갭과 발광.", tags:["LED","밴드갭"], emoji:"💡", demo:"./simul/발광 다이오드.html", curriculumId:"[12전자02-04]", thumb:"./thumb_nail/발광_다이오드.png"},
    {title:"상대성이론", category:"상대성", desc:"우주선의 속력에 따라 행성의 변화 관찰하기", tags:["특수","일반"], emoji:"🚀", demo:"./simul/상대성이론.html", curriculumId:"[12물리03-06]", thumb:"./thumb_nail/상대성이론.png"},
    {title:"스넬의 법칙", category:"광학", desc:"굴절률 변화에 따른 입사/굴절/임계각 확인하기", tags:["n1,n2","TIR"], emoji:"📐", demo:"./simul/스넬의 법칙.html", curriculumId:"[12물리03-02]", thumb:"./thumb_nail/스넬의_법칙.png"},
    {title:"포물선 운동", category:"역학", desc:"대포를 쏴서 과녁을 맞추자.", tags:["포물선운동","게임"], emoji:"🌈", demo:"./simul/포물선 운동.html", curriculumId:"[12역학01-02]", thumb:"./thumb_nail/포물선_운동.png"},
    {title:"열역학", category:"열", desc:"등압, 등적, 등온, 단열과정 확인하기", tags:["열기관","열과정"], emoji:"🐦‍🔥", demo:"./simul/열역학.html", curriculumId:"[12물리01-06], [12역학02-02]", thumb:"./thumb_nail/열역학.png"},
    {title:"옴의 법칙", category:"전자/반도체", desc:"V=IR, 직렬/병렬 에 따른 옴의 법칙 확인하기", tags:["전압","전류"], emoji:"⚡", demo:"./simul/옴의 법칙.html", curriculumId:"[12물리02-02]", thumb:"./thumb_nail/옴의_법칙.png"},
    {title:"원자모형", category:"시뮬레이션", desc:"보어/오비탈/전자구름 개념 확인하기", tags:["원자","준위"], emoji:"🧬", demo:"./simul/원자모형.html", curriculumId:"[12전자03-04]", thumb:"./thumb_nail/원자모형.png"},
    {title:"이중슬릿", category:"광학", desc:"이중슬릿을 통과한 전자의 간섭무늬 확인하기", tags:["슬릿","간섭"], emoji:"〰️", demo:"./simul/이중슬릿.html", curriculumId:"[12전자03-01]", thumb:"./thumb_nail/이중슬릿.png"},
    {title:"전자기유도", category:"전자/반도체", desc:"전자기 유도현상과 정류자의 역할 알아보기", tags:["전자기유도","정류자"], emoji:"⚡", demo:"./simul/전자기유도.html", curriculumId:"[12물리02-05], [12전자01-05]", thumb:"./thumb_nail/전자기유도.png"},
    {title:"전기장과 등전위면", category:"전자/반도체", desc:"전하가 만드는 전기장과 등전위면을 알아보기", tags:["전기장","등전위면"], emoji:"⚡", demo:"./simul/전기장과 등전위면.html", curriculumId:"[12물리02-01], [12전자01-01]", thumb:"./thumb_nail/전기장과_등전위면.png"},
    {title:"편광과 LCD", category:"광학", desc:"편광의 원리와 LCD의 원리 알아보기", tags:["편광","LCD"], emoji:"🔭", demo:"./simul/편광과 LCD.html", curriculumId:"[12전자02-03]", thumb:"./thumb_nail/편광과 LCD.png"}
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
    if (p.thumb) {
      const img = document.createElement('img');
      img.src = p.thumb;
      img.alt = p.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'thumb-img';
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
    empty.style.display = list.length? 'none':'block';
  
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
  
  // ===== [수정됨] 오늘의 물리 (타자기 효과 유지) =====
  (function(){
    const FACTS = [
        "태양빛이 태양에서 지구까지 도달하는 데 약 8분 20초가 걸립니다(≈ 499초).",
        "상온에서 소리는 공기 중 약 343 m/s로 이동하지만, 강철에서는 그보다 10배 이상 빠릅니다.",
        "진공에서는 깃털과 쇳덩이도 같은 가속도로 떨어집니다. (갈릴레이의 관성 법칙)",
        "빛의 속도는 약 299,792,458 m/s이며, 진공에서 이보다 더 빠르게 이동할 수 없습니다.",
        "전자는 파동성과 입자성을 동시에 지니며, 이중 슬릿 실험이 이를 잘 보여줍니다.",
        "1eV(전자볼트)는 약 1.602×10⁻¹⁹ J의 에너지입니다.",
        "지구의 중력 가속도 g는 위도·고도에 따라 약간 달라지며, 해수면에서는 대략 9.81 m/s²입니다.",
        "초전도체는 임계온도 이하에서 전기저항이 0이 됩니다.",
        "적외선은 가시광보다 파장이 길고, 자외선은 가시광보다 파장이 짧습니다.",
        "상대론에 따르면 운동하는 시계는 정지한 시계보다 느리게 갑니다(시간 지연).",
        "국제우주정거장에서 떨어진 나사가 지구로 떨어지지 않는 이유는, 나사도 우주인과 똑같이 지구를 향해 계속 자유낙하하며 지구를 공전하고 있기 때문입니다.",
        "번개의 순간 온도는 태양 표면(≈ 6,000 K)보다 다섯 배 이상 뜨거운 약 30,000 K에 달합니다.",
        "전자레인지에 있는 ‘그물망 문’은 구멍 크기가 마이크로파 파장보다 작아 전자기파는 막고, 눈에 보이는 빛은 통과시킵니다.",
        "흑체 복사 이론에 따르면, 우리가 보는 모든 색은 사실 ‘온도’와 깊이 연결돼 있습니다. 적색별은 차갑고, 청백색별은 뜨겁습니다.",
        "국제우주정거장(ISS)은 초속 약 7.7 km로 지구를 돌고 있어, 서울에서 부산까지 1분도 안 걸립니다.",
        "자석에 온도를 계속 올리면 어느 순간(큐리 온도)에서 자성이 완전히 사라져 일반 금속처럼 됩니다.",
        "바나나에는 칼륨-40이 있어 아주 미세한 방사선을 내뿜습니다. 매일 바나나를 먹어도 전혀 해롭지 않습니다.",
        "풀밭에서 귀를 대고 누우면 지구가 ‘윙~’ 하는 소리를 낼 수도 있는데, 이는 지각을 통해 전해지는 초저주파 지진파 때문입니다.",
        "달은 매년 약 3.8 cm씩 지구에서 멀어지고 있습니다. 수억 년 뒤엔 개기일식은 사라집니다.",
        "우주배경복사(빅뱅의 잔광)는 TV 안테나 잡음 속에도 섞여 있었는데, 옛날 브라운관 TV의 ‘지지직’ 화면에 우주 탄생의 흔적이 있었습니다.",
        "레고 블록 두 개를 눌러 붙이면 떼어내는 데 힘이 너무 큰데, 계산해보면 실제로는 미세한 접촉면의 ‘진공흡착’ 효과가 작용합니다.",
        "손바닥을 탁 치면 순간적으로 작은 음속 파동(충격파)이 생기는데, 이때 아주 약한 초음속 미니 ‘소닉붐’이 발생합니다.",
        "스마트폰의 화면을 기울여 보면, 액정 구조 때문에 무지개빛 간섭 무늬가 보입니다.",
        "전구의 필라멘트는 2500℃ 이상에서 빛나는데도 녹지 않는 이유는 텅스텐의 녹는점이 3400℃가 넘기 때문입니다.",
        "냉장고 문을 세게 닫으면 옆방에서 다른 문이 살짝 열리기도 하는데, 이는 순간 압력 차이로 공기가 밀려났다가 다시 흡수되기 때문입니다.",
        "음악 콘서트에서 ‘저음’이 가슴을 울리는 이유는 공기뿐 아니라 우리 몸 조직도 같이 진동하기 때문입니다.",
        "손으로 강철 자를 튕겨 울리면 ‘팅~’ 하는 소리가 나는데, 이는 금속이 진동하면서 공기를 밀어내는 공명 현상입니다.",
        "우산에 떨어지는 빗방울 소리는 사실 빗방울 속의 공기방울이 터지면서 나는 소리입니다.",
        "불을 붙이면 불꽃 색깔이 다른 이유는 온도뿐 아니라 금속 원소의 발광 스펙트럼 때문입니다. (나트륨=노란색, 구리=푸른색)",
        "촛불을 불면 순간적으로 불꽃이 꺼진 자리에서 연기가 올라오는데, 그 연기만 다시 불 붙여도 불꽃이 되살아납니다.",
        "우주에서 사람은 울어도 눈물이 볼을 타고 흐르지 않고, 둥근 방울로 눈에 달라붙습니다.",
        "헬륨 풍선을 손에 들고 자동차를 출발하면, 풍선은 뒤로 가지 않고 오히려 앞으로 움직입니다(공기 밀도 차이 때문).",
        "플라즈마 TV나 네온사인 속 빛은 사실 기체가 이온화되어 방출하는 전자 전이에 의한 빛입니다.",
        "지진파는 지구 내부에서 굴절·반사되어, 실제로 지구 내부의 구조를 알아내는 ‘CT 촬영기’ 같은 역할을 합니다.",
        "전자레인지에 금속 숟가락을 넣으면 불꽃이 튀는 건, 날카로운 끝에서 전하가 집중되어 방전이 일어나기 때문입니다.",
        "별빛은 수천 년, 수백만 년을 날아와 지금 우리 눈에 들어옵니다. 우리가 보는 건 ‘별의 현재’가 아니라 과거 모습입니다.",
        "밤하늘 은하수가 희미한 구름처럼 보이는 건, 사실 수천억 개의 별빛이 한데 모여 보이는 것입니다.",
        "태양은 매초 약 400만 톤의 질량을 에너지로 전환하며, 이 과정에서 실제로 가벼워지고 있습니다.",
        "금성에서는 하루(자전 주기)가 1년(공전 주기)보다 더 길어, 해가 한 번 뜨고 지는 데 1년 이상이 걸립니다.",
        "우주 공간에서도 완전한 ‘0’의 에너지는 존재하지 않으며, 이를 영점에너지라고 부릅니다.",
        "중성미자는 물질과 거의 상호작용하지 않아, 태양에서 나온 중성미자가 지금도 우리의 몸을 통과하고 있습니다.",
        "우주에 존재하는 모든 전자는 서로 완전히 동일하여, 어떤 전자도 다른 전자와 구별할 수 없습니다.",
        "유리는 아주 느리게 흐르는 액체가 아니라, 무질서한 구조를 가진 비정질 고체입니다.",
        "금속이 차갑게 느껴지는 이유는 온도가 낮아서가 아니라, 열을 빠르게 빼앗아 가는 높은 열전도율 때문입니다.",
        "얼음이 미끄러운 이유는 단순히 녹아서가 아니라, 압력과 마찰로 인해 표면 구조가 순간적으로 변하기 때문입니다.",
        "다이아몬드는 매우 단단하지만 고온에서는 흑연보다 안정하지 않아 쉽게 손상될 수 있습니다.",
        "빛은 유리 속에서 느려지지만 멈추지는 않으며, 이는 빛이 물질과 상호작용하기 때문입니다.",
        "우리는 실제 세계를 연속적으로 인식하지 못하고, 뇌가 초당 수십 장의 ‘프레임’으로 재구성해 인식합니다.",
        "무지개는 실제로 완전한 원 모양이지만, 지면에 가려져 보통 반원으로만 관측됩니다.",
        "샤워할 때 커튼이 몸 쪽으로 달라붙는 현상은 베르누이 효과와 온도 차에 의한 공기 흐름 때문입니다.",
        "회전하는 의자에서 팔을 벌리면 각운동량 보존 법칙에 따라 회전 속도가 느려집니다.",
        "레이저 포인터의 빛은 아주 멀리까지 퍼지지만, 우리가 보는 점은 극히 일부의 산란광에 불과합니다.",
        "트랜지스터는 단순한 스위치가 아니라, 전기장을 이용해 전류를 정밀하게 조절하는 장치입니다.",
        "MRI는 X선을 사용하는 장치가 아니라, 원자핵의 스핀과 자기 공명을 이용해 몸속을 영상화합니다.",
        "Wi-Fi 신호는 벽을 통과할 수 있지만, 인체의 물 분자에 의해 일부 흡수되어 약해집니다.",
        "우주에서는 중력이 거의 없어도 물체가 멈추는 것이 아니라, 계속 같은 속도로 움직입니다.",
        "자전거가 넘어지지 않고 달릴 수 있는 이유는 바퀴의 회전 안정성과 조향 반응이 결합된 결과입니다."
    ];
    const factEl  = document.getElementById('fact-text');
    const nextBtn = document.getElementById('next-fact');
    const copyBtn = document.getElementById('copy-fact');
    
    let last = -1;
    let typingTimer = null; // 타이머 참조 변수
    let currentFactText = ""; // 현재 표시 중인 전체 텍스트 저장용
  
    function pick(){ 
        let i=Math.floor(Math.random()*FACTS.length); 
        if(i===last) i=(i+1)%FACTS.length; 
        last=i; 
        return FACTS[i]; 
    }
  
    // 타자기 효과 함수
    function typeWriter(text, element) {
        // 기존 타이머가 돌고 있다면 취소 (빠르게 넘길 때 겹침 방지)
        if(typingTimer) clearTimeout(typingTimer);
        
        element.textContent = '';
        let i = 0;
        const speed = 25; // 글자당 25ms
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                typingTimer = setTimeout(type, speed);
            } else {
                typingTimer = null; // 완료됨
            }
        }
        type();
    }
  
    function next(){ 
        currentFactText = pick();
        typeWriter(currentFactText, factEl);
    }
  
    nextBtn.addEventListener('click', next);
    copyBtn.addEventListener('click', async ()=>{
      try{
        // 화면에 다 안 써졌어도 전체 문구를 복사하도록 currentFactText 사용
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