using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// 별의 탄생 시뮬레이션 UI 컨트롤러
/// Canvas 아래 빈 GameObject에 부착
/// </summary>
public class SimulationUI : MonoBehaviour
{
    [Header("시뮬레이션 참조")]
    public StarBirthSimulation sim;

    [Header("정보 표시 (TextMeshPro)")]
    public TextMeshProUGUI stageText;
    public TextMeshProUGUI tempText;
    public TextMeshProUGUI spectralText;
    public TextMeshProUGUI massInfoText;
    public TextMeshProUGUI timeText;

    [Header("컨트롤")]
    public Slider massSlider;        // 0.1 ~ 50 (태양 질량 배수)
    public Slider speedSlider;       // 0.1 ~ 10 (시간 배율)
    public Button restartBtn;
    public Button pauseBtn;
    public TextMeshProUGUI pauseBtnText;

    [Header("색상 미리보기")]
    public Image  colorPreview;      // 별 색상 실시간 표시

    // 단계별 설명 텍스트
    private static readonly string[] StageNames =
    {
        "1단계 — 성간 가스 구름",
        "2단계 — 중력 수축",
        "3단계 — 원시별 형성",
        "4단계 — 핵융합 점화 🔥",
        "5단계 — 항성풍 분출",
        "6단계 — 주계열성 안정화 ✨"
    };

    private static readonly string[] StageDesc =
    {
        "수소와 헬륨 기체가 성간 공간에 퍼져 있습니다.",
        "자체 중력으로 가스가 중심부로 수축합니다.",
        "중심부 압력과 온도가 상승해 원시별이 빛나기 시작합니다.",
        "핵심부 온도가 1,000만 K를 초과 — 수소 핵융합 시작!",
        "복사압으로 주변 가스가 바깥으로 날아갑니다.",
        "핵융합과 중력이 균형을 이루며 안정된 별이 됩니다."
    };

    private bool _isPaused = false;

    void Start()
    {
        // 슬라이더 초기값
        if (massSlider != null)
        {
            massSlider.minValue = 0.1f;
            massSlider.maxValue = 50f;
            massSlider.value    = sim != null ? sim.StarMass : 1f;
            massSlider.onValueChanged.AddListener(OnMassChanged);
        }

        if (speedSlider != null)
        {
            speedSlider.minValue = 0.1f;
            speedSlider.maxValue = 10f;
            speedSlider.value    = 1f;
            speedSlider.onValueChanged.AddListener(v => sim?.SetTimeScale(v));
        }

        if (restartBtn != null)
            restartBtn.onClick.AddListener(OnRestart);

        if (pauseBtn != null)
            pauseBtn.onClick.AddListener(OnPauseToggle);

        UpdateMassInfo(sim != null ? sim.StarMass : 1f);
    }

    void Update()
    {
        if (sim == null) return;

        int stageIdx = (int)sim.CurrentStage;

        // 단계 텍스트
        if (stageText    != null) stageText.text   = StageNames[stageIdx];

        // 온도
        float temp = sim.Temperature;
        if (tempText != null)
            tempText.text = FormatTemp(temp);

        // 분광형
        if (spectralText != null)
            spectralText.text = BlackbodyColor.GetSpectralType(temp);

        // 시간
        if (timeText != null)
            timeText.text = $"경과: {sim.SimTime:F1} s";

        // 색상 미리보기
        if (colorPreview != null)
            colorPreview.color = BlackbodyColor.TempToColor(temp);
    }

    // ──────────────────────────────────────────
    // 이벤트 핸들러
    // ──────────────────────────────────────────

    void OnMassChanged(float value)
    {
        sim?.SetMass(value);
        UpdateMassInfo(value);
    }

    void UpdateMassInfo(float mass)
    {
        if (massInfoText == null) return;

        string type;
        if      (mass < 0.3f)  type = "갈색 왜성 (핵융합 실패)";
        else if (mass < 0.8f)  type = "적색 왜성";
        else if (mass < 1.5f)  type = "태양형 항성";
        else if (mass < 8f)    type = "중질량 항성";
        else if (mass < 20f)   type = "대질량 항성";
        else                   type = "초대질량 항성 (초신성 후보)";

        massInfoText.text = $"질량: {mass:F1} M☉  ({type})";
    }

    void OnRestart()
    {
        _isPaused = false;
        if (pauseBtnText != null) pauseBtnText.text = "일시정지";
        sim?.Restart();
    }

    void OnPauseToggle()
    {
        _isPaused = !_isPaused;
        sim?.SetPaused(_isPaused);
        if (pauseBtnText != null)
            pauseBtnText.text = _isPaused ? "재개" : "일시정지";
    }

    // ──────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────

    string FormatTemp(float k)
    {
        if (k >= 10000f) return $"온도: {k / 1000f:F1} × 10³ K";
        return $"온도: {k:N0} K";
    }
}
