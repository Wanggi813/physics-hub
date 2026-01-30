# 개선된 파일 적용 가이드 📦

이 폴더에는 보안과 아키텍처가 개선된 파일들이 들어있습니다.

## 📁 포함된 파일

```
improved/
├── firebase-auth.js       # ✅ 환경 변수 사용 (보안 개선)
├── .env.local            # 환경 변수 파일 (Git 제외 필수!)
├── .gitignore            # Git 무시 파일 목록
├── package.json          # 프로젝트 설정
├── vite.config.js        # Vite 빌드 설정
├── firestore.rules       # Firestore 보안 규칙
├── projects.json         # 프로젝트 데이터 (JSON 분리)
└── README.md            # 이 파일
```

## 🚀 빠른 시작 (30분)

### 1단계: 파일 교체 (5분)

```bash
# 현재 프로젝트 폴더에서 실행

# 1. 기존 firebase-auth.js 백업
cp firebase-auth.js firebase-auth.js.backup

# 2. 새 파일로 교체
cp improved/firebase-auth.js ./firebase-auth.js
cp improved/.env.local ./
cp improved/.gitignore ./
cp improved/package.json ./
cp improved/vite.config.js ./
cp improved/projects.json ./data/projects.json  # data 폴더 생성 필요
```

### 2단계: 의존성 설치 (5분)

```bash
# Node.js가 설치되어 있어야 합니다
# https://nodejs.org 에서 다운로드

npm install
```

### 3단계: 환경 변수 확인 (2분)

`.env.local` 파일을 열어서 Firebase 설정이 올바른지 확인하세요.

⚠️ **중요**: 보안을 위해 Firebase Console에서 새 API 키를 발급받는 것을 권장합니다!

### 4단계: 개발 서버 실행 (2분)

```bash
npm run dev
```

브라우저에서 자동으로 열립니다. (http://localhost:3000)

### 5단계: Firestore 보안 규칙 적용 (10분)

1. Firebase Console 접속: https://console.firebase.google.com
2. 프로젝트 선택: `simulation-67cd3`
3. Firestore Database → Rules 탭
4. `improved/firestore.rules` 파일 내용 복사 & 붙여넣기
5. "게시(Publish)" 버튼 클릭

### 6단계: Git 커밋 (5분)

```bash
# .env.local이 무시되는지 확인
git status  # .env.local이 목록에 없어야 함!

git add .
git commit -m "보안 개선: API 키를 환경 변수로 이동"
git push
```

---

## ✅ 점검 체크리스트

완료 후 아래를 확인하세요:

- [ ] `npm run dev`로 서버가 정상 실행되나요?
- [ ] 로그인/로그아웃이 정상 작동하나요?
- [ ] `.env.local`이 `.gitignore`에 포함되어 있나요?
- [ ] `git status`에서 `.env.local`이 보이지 않나요?
- [ ] Firestore 보안 규칙이 적용되었나요?
- [ ] 기존 API 키를 Firebase Console에서 삭제했나요?

---

## 🔧 문제 해결

### Q: "Cannot find module 'vite'" 오류

**A:** 의존성을 설치하지 않았습니다.

```bash
npm install
```

### Q: "import.meta is undefined" 오류

**A:** Vite 서버로 실행해야 합니다.

```bash
# ❌ 잘못된 방법
# 직접 HTML 파일을 브라우저에서 열기

# ✅ 올바른 방법
npm run dev
```

### Q: Firebase 연결 안 됨

**A:** 환경 변수가 제대로 로드되었는지 확인

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env-local` ❌)
3. Vite 서버를 재시작: `Ctrl+C` → `npm run dev`

### Q: "Permission denied" 오류 (Firestore)

**A:** 보안 규칙이 적용된 후 토큰 갱신 필요

1. 로그아웃
2. 다시 로그인

---

## 📊 변경 사항 요약

### 보안 개선 ✅

- **API 키 숨김**: 환경 변수로 이동
- **Firestore 보안 규칙**: 읽기/쓰기 권한 제한
- **입력값 검증**: 건의사항에 필수 필드 검증 추가

### 코드 개선 ✅

- **데이터 분리**: 프로젝트 목록을 JSON으로 분리
- **빌드 시스템**: Vite 도입으로 개발 경험 개선
- **문서화**: 주석 추가

### 아직 개선 필요 ⏳

- ES Module로 완전 전환 (전역 함수 제거)
- 파일 구조 정리 (simul/ 폴더 카테고리별 분류)
- 이미지 최적화 (WebP 전환)
- 테스트 코드 작성

---

## 🎯 다음 단계

이번 주에 할 일:

1. **projects.json 활용하기**
   - `main.js`를 수정해서 JSON 파일에서 프로젝트 로드
   - 하드코딩된 배열 제거

2. **전역 함수 제거**
   - `window.login` 등을 이벤트 리스너로 교체
   - ES Module 패턴으로 전환

3. **파일 구조 정리**
   - simul/ 폴더를 카테고리별로 분류
   - 공통 컴포넌트 분리

---

## 📚 추가 자료

- **종합 분석 보고서**: `architecture_analysis.md`
- **실전 코드 가이드**: `implementation_guide.md`
- **시각적 다이어그램**: `architecture_diagrams.md`
- **긴급 조치 가이드**: `quick_start_guide.md`

---

## 💡 팁

### 프로덕션 빌드

개발이 완료되면 프로덕션 빌드를 생성하세요:

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### GitHub Pages에 배포

```bash
# dist 폴더를 GitHub Pages에 배포
npm run build
# dist 폴더 내용을 gh-pages 브랜치에 푸시
```

또는 Netlify, Vercel 등의 플랫폼 사용을 권장합니다.

---

## 🆘 도움이 필요하면

1. **Firebase 문서**: https://firebase.google.com/docs
2. **Vite 문서**: https://vitejs.dev/guide/
3. **GitHub Issues**: 프로젝트 저장소에 이슈 등록

---

## ⚠️ 주의사항

### 절대 Git에 올리면 안 되는 것

- `.env.local` (환경 변수)
- `node_modules/` (의존성)
- API 키나 비밀번호

### 반드시 확인할 것

- `.gitignore`가 제대로 설정되어 있는지
- Firebase Console에서 기존 API 키 삭제
- Firestore 보안 규칙 적용

---

**✅ 모든 단계를 완료하면 보안이 크게 개선됩니다!**

문제가 생기면 백업 파일(`firebase-auth.js.backup`)로 복구할 수 있습니다.
