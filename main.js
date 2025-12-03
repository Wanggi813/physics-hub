// ===== 프로젝트 카드 렌더링 =====
  const projects = [
    {title:"토크와 평형", category:"역학", desc:"물체를 이용해 토크평형 만들기", tags:["토크","평형"], emoji:"🧗‍♀️", demo:"./토크와 평형.html", curriculumId:"[12물리01-01]", thumb:"./thumb_nail/토크와_평형.png"},
    {title:"힘의 합력", category:"역학", desc:"여러 힘의 합력 알아보기", tags:["힘","알짜힘"], emoji:"🧗‍♀️", demo:"./힘의 평형.html", curriculumId:"[12역학01-01]", thumb:"./thumb_nail/힘의_평형.png"},
    {title:"탈출 속도", category:"역학", desc:"행성의 탈출속도 알아보기", tags:["중력","탈출속도"], emoji:"🧗‍♀️", demo:"./탈출 속도.html", curriculumId:"[12물리03-06]", thumb:"./thumb_nail/탈출속도.png"},
    {title:"일과 운동에너지", category:"역학", desc:"용수철을 이용해 일과 운동에너지를 비교", tags:["일","운동에너지"], emoji:"🧗‍♀️", demo:"./일과 운동에너지.html", curriculumId:"[12물리01-04]", thumb:"./thumb_nail/일과_운동에너지.png"},
    {title:"줄의 실험", category:"열", desc:"줄의 일의 열당량을 알아보자", tags:["줄","일의 열당량"], emoji:"🧗‍♀️", demo:"./줄의 실험.html", curriculumId:"[12물리01-05]", thumb:"./thumb_nail/줄의_실험.png"},
    {title:"RLC 공명", category:"전자/반도체", desc:"직렬 RLC 공명/위상·전류 변화 시각화.", tags:["회로","공명"], emoji:"🔄", demo:"./RLC 공명.html", curriculumId:"[12전자01-06]", thumb:"./thumb_nail/RLC회로.png"},
    {title:"간섭무늬", category:"광학", desc:"파장·슬릿 간격 조절로 간섭 패턴 관찰.", tags:["파동","무늬"], emoji:"🎯", demo:"./간섭무늬.html", curriculumId:"[12물리03-01]", thumb:"./thumb_nail/간섭무늬.png"},
    {title:"광전효과", category:"전자/반도체", desc:"파장/세기에 따른 광전자 방출과 임계 주파수.", tags:["광자","금속"], emoji:"📸", demo:"./광전효과.html", curriculumId:"[12전자02-04]", thumb:"./thumb_nail/광전효과.png"},
    {title:"다이오드", category:"전자/반도체", desc:"PN 접합·공핍층·I–V 특성 직관.", tags:["PN","I–V"], emoji:"🔌", demo:"./다이오드.html", curriculumId:"[12물리03-05]", thumb:"./thumb_nail/다이오드.png"},
    {title:"도플러효과", category:"광학", desc:"이동 음원/관측자 주파수 변화와 마하 콘.", tags:["도플러","파동"], emoji:"🎵", demo:"./도플러효과.html", curriculumId:"[12역학03-03]", thumb:"./thumb_nail/도플러효과.png"},
    {title:"러더퍼드 알파입자 산란실험", category:"시뮬레이션", desc:"금박 통과·대각 산란·반사 확률 시각화.", tags:["산란","쿨롱"], emoji:"🧪", demo:"./러더퍼드 알파입자 산란실험.html", curriculumId:"[12전자01-06]", thumb:"./thumb_nail/러더퍼드_산란실험.png"},
    {title:"렌즈의 굴절", category:"광학", desc:"볼록/오목·실상/허상 구성과 보조선.", tags:["렌즈","상"], emoji:"🔭", demo:"./렌즈의 굴절.html", curriculumId:"[12물리03-02]", thumb:"./thumb_nail/렌즈의_법칙.png"},
    {title:"발광 다이오드", category:"전자/반도체", desc:"파장별 전압·밴드갭과 발광.", tags:["LED","밴드갭"], emoji:"💡", demo:"./발광 다이오드.html", curriculumId:"[12전자02-04]", thumb:"./thumb_nail/발광_다이오드.png"},
    {title:"상대성이론", category:"상대성", desc:"길이수축·시공간 시각화(우주선/별).", tags:["특수","일반"], emoji:"🚀", demo:"./상대성이론.html", curriculumId:"[12물리03-06]", thumb:"./thumb_nail/상대성이론.png"},
    {title:"스넬의 법칙", category:"광학", desc:"굴절률 변화에 따른 입사/굴절/임계각.", tags:["n1,n2","TIR"], emoji:"📐", demo:"./스넬의 법칙.html", curriculumId:"[12물리03-02]", thumb:"./thumb_nail/스넬의_법칙.png"},
    {title:"포물선 운동", category:"역학", desc:"대포를 쏴서 과녁을 맞추자.", tags:["포물선운동","게임"], emoji:"🌈", demo:"./포물선 운동.html", curriculumId:"[12역학01-02]", thumb:"./thumb_nail/포물선_운동.png"},
    {title:"열역학", category:"열", desc:"등압, 등적, 등온, 단열과정을 확인.", tags:["열기관","열과정"], emoji:"🐦‍🔥", demo:"./열역학.html", curriculumId:"[12물리01-06], [12역학02-02]", thumb:"./thumb_nail/열역학.png"},
    {title:"옴의 법칙", category:"전자/반도체", desc:"V=IR, 직렬/병렬 직관, 전류 흐름 애니메이션.", tags:["전압","전류"], emoji:"⚡", demo:"./옴의 법칙.html", curriculumId:"[12물리02-02]", thumb:"./thumb_nail/옴의_법칙.png"},
    {title:"원자모형", category:"시뮬레이션", desc:"보어/오비탈/전자구름 개념 시각화.", tags:["원자","준위"], emoji:"🧬", demo:"./원자모형.html", curriculumId:"[12전자03-04]", thumb:"./thumb_nail/원자모형.png"},
    {title:"이중슬릿", category:"광학", desc:"확률파동·간섭무늬·파라미터 조절.", tags:["슬릿","간섭"], emoji:"〰️", demo:"./이중슬릿.html", curriculumId:"[12전자03-01]", thumb:"./thumb_nail/이중슬릿.png"},
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
  for(const p of list){ grid.append(makeCard(p)); }
}
q.addEventListener('input', render);
cat.addEventListener('change', render);
sortSel.addEventListener('change', render);
render();

// ===== 오늘의 물리 =====
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
  ];
  const factEl  = document.getElementById('fact-text');
  const nextBtn = document.getElementById('next-fact');
  const copyBtn = document.getElementById('copy-fact');
  let last = -1;
  function pick(){ let i=Math.floor(Math.random()*FACTS.length); if(i===last) i=(i+1)%FACTS.length; last=i; return FACTS[i]; }
  function next(){ factEl.textContent=pick(); }
  nextBtn.addEventListener('click', next);
  copyBtn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(factEl.textContent.trim());
      copyBtn.textContent='복사됨!'; 
      setTimeout(()=>copyBtn.textContent='복사',900);
    }catch(e){
      alert('복사 실패: '+e.message);
    }
  });

  next();
})();

// ===== 인터랙티브 중력 배경 =====
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

// ===== 로그인 패널 UI 동작 (mouseover + click) =====
(function(){
  const panel = document.getElementById('auth-panel');
  const openBtn = document.getElementById('open-auth');
  const authBar = document.getElementById('auth-bar');
  const closeBtn = panel.querySelector('.auth-close');
  let hideTimer = null;

  if(!panel || !openBtn) return;

  function openPanel(){
    clearTimeout(hideTimer);
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
  }
  function closePanel(){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
  }
  function scheduleClose(){
    clearTimeout(hideTimer);
    hideTimer = setTimeout(closePanel, 250);
  }

  // 클릭으로 토글
  openBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(panel.classList.contains('open')) closePanel();
    else openPanel();
  });

  // 마우스 올리면 자동으로 열림
  openBtn.addEventListener('mouseenter', openPanel);
  authBar.addEventListener('mouseenter', openPanel);

  // 마우스가 버튼/패널 밖으로 나가면 닫힘
  openBtn.addEventListener('mouseleave', scheduleClose);
  authBar.addEventListener('mouseleave', scheduleClose);
  panel.addEventListener('mouseenter', ()=>{ clearTimeout(hideTimer); });
  panel.addEventListener('mouseleave', scheduleClose);

  closeBtn.addEventListener('click', closePanel);

  // 바깥 클릭 시 닫기
  document.addEventListener('click', (e)=>{
    if(!panel.contains(e.target) && e.target !== openBtn){
      closePanel();
    }
  });
})();