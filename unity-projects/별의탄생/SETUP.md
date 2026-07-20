# 별의 탄생 — Unity 씬 설정 가이드

## 1. 프로젝트 생성

Unity Hub → New Project
- 템플릿: **3D (URP)** 선택 (Universal Render Pipeline)
- 이름: `별의탄생`
- 위치: 이 폴더의 상위 디렉터리

## 2. 스크립트 복사

`Assets/Scripts/` 폴더에 다음 3개 파일 복사:
- `BlackbodyColor.cs`
- `StarBirthSimulation.cs`
- `SimulationUI.cs`

## 3. 씬 구성 (Hierarchy)

```
Scene
├── Main Camera
├── SimulationRoot          ← 빈 GameObject
│   ├── [StarBirthSimulation.cs 부착]
│   └── [Particle System 컴포넌트 부착]
├── StarLight               ← Point Light
├── Global Volume           ← Post Processing
└── Canvas (Screen Space Overlay)
    └── UIManager           ← 빈 GameObject
        └── [SimulationUI.cs 부착]
```

## 4. Particle System 설정

SimulationRoot 선택 → Add Component → Particle System

| 항목 | 값 |
|------|-----|
| Duration | 9999 |
| Looping | OFF |
| Start Lifetime | 9999 |
| Start Speed | 0 |
| Start Size | 0.3 |
| Start Color | (보라색, 반투명) |
| Max Particles | 4000 |
| Simulation Space | World |
| Renderer → Material | Particles/Standard Unlit |

**Emission 모듈**: Rate over Time = 0 (스크립트가 제어)
**Shape 모듈**: OFF

## 5. Point Light 설정

StarLight GameObject → Add Component → Light
- Type: Point
- Color: 주황 (초기, 런타임에 변경됨)
- Intensity: 0
- Range: 50
- Shadow Type: No Shadows (성능)

## 6. Post Processing Volume 설정

Global Volume 선택 → Add Component → Volume
- Is Global: ON
- Profile → New → 이름: `StarBirthPP`

Profile에 추가:
- **Bloom**: ON, Intensity = 0, Threshold = 0.8
- **Chromatic Aberration**: ON, Intensity = 0
- **Vignette**: ON, Intensity = 0.25 (선택)
- **Color Grading → Tonemapping**: ACES

## 7. Camera 설정

Main Camera:
- Clear Flags: Solid Color
- Background: #000005 (거의 검정)
- Position: (0, 0, -80)
- Rendering → Post Processing: ON (체크)

## 8. Inspector 연결

SimulationRoot (StarBirthSimulation 컴포넌트):
- Star Light → StarLight 오브젝트 드래그
- Pp Volume → Global Volume 드래그

UIManager (SimulationUI 컴포넌트):
- Sim → SimulationRoot 드래그
- 각 텍스트/슬라이더/버튼 → Canvas 하위 UI 오브젝트 연결

## 9. UI Canvas 구성 (참고)

```
Canvas
└── UIPanel (Image, 반투명 검정, 우측 고정)
    ├── StageText       (TMP, 18px bold)
    ├── TempText        (TMP, 14px)
    ├── SpectralText    (TMP, 12px)
    ├── ColorPreview    (Image, 40x40)
    ├── ──────────────
    ├── MassLabel       (TMP, "별의 질량")
    ├── MassSlider
    ├── MassInfoText    (TMP, 12px)
    ├── ──────────────
    ├── SpeedLabel      (TMP, "시간 배율")
    ├── SpeedSlider
    ├── ──────────────
    ├── RestartButton
    └── PauseButton
```

## 10. WebGL 빌드

File → Build Settings
- Platform: WebGL 선택 → Switch Platform
- Player Settings:
  - Resolution: 1280 x 720
  - WebGL Template: Default
  - Compression: Gzip
- Build → 출력 폴더 지정

빌드 결과물을 `e:/시뮬레이션/simul/별의탄생/` 에 복사 후
기존 플랫폼의 HTML에서 iframe으로 삽입.
