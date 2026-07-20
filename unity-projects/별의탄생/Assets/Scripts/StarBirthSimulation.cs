using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

/// <summary>
/// 별의 탄생 시뮬레이션 메인 컨트롤러
/// Hierarchy: 빈 GameObject에 이 스크립트 + ParticleSystem 컴포넌트 부착
/// </summary>
[RequireComponent(typeof(ParticleSystem))]
public class StarBirthSimulation : MonoBehaviour
{
    // ──────────────────────────────────────────
    // Inspector 노출 변수
    // ──────────────────────────────────────────

    [Header("별 파라미터")]
    [Tooltip("태양 질량 배수 (0.1 = 적색왜성 / 1 = 태양 / 30 = 청색초거성)")]
    [Range(0.1f, 50f)] public float starMass = 1f;

    [Header("시간 설정")]
    [Range(0.1f, 10f)] public float timeScale = 1f;
    public bool autoPlay = true;

    [Header("파티클 설정")]
    [Range(500, 8000)] public int particleCount = 4000;
    [Range(10f, 80f)]  public float cloudRadius  = 45f;

    [Header("씬 참조 - 직접 연결")]
    public Light        starLight;       // Point Light
    public Volume       ppVolume;        // Post-processing Volume
    public Transform    cameraTransform; // Main Camera

    // ──────────────────────────────────────────
    // 시뮬레이션 단계 정의
    // ──────────────────────────────────────────

    public enum Stage
    {
        GasCloud,       // 0: 성간 가스 구름 (정적)
        Collapse,       // 1: 중력 수축
        Protostar,      // 2: 원시별 형성
        Ignition,       // 3: 핵융합 점화
        StellarWind,    // 4: 항성풍 분출
        MainSequence    // 5: 주계열성 안정화
    }

    // 각 단계 시작 시간 (초, timeScale=1 기준)
    private readonly float[] _stageStart = { 0f, 6f, 18f, 30f, 32f, 42f };

    // ──────────────────────────────────────────
    // 내부 상태
    // ──────────────────────────────────────────

    private ParticleSystem           _ps;
    private ParticleSystem.Particle[] _particles;
    private GameObject               _starCore;
    private MeshRenderer             _starRenderer;
    private Material                 _starMat;

    private Bloom          _bloom;
    private ChromaticAberration _ca;

    private Stage  _stage      = Stage.GasCloud;
    private float  _simTime    = 0f;
    private float  _starTemp   = 800f;
    private float  _starRadius = 0f;
    private float  _targetTemp = 5778f;

    private bool   _ignitionFlashDone = false;

    // ──────────────────────────────────────────
    // 공개 프로퍼티 (UI에서 읽음)
    // ──────────────────────────────────────────

    public Stage  CurrentStage  => _stage;
    public float  Temperature   => _starTemp;
    public float  SimTime       => _simTime;
    public float  StarMass      => starMass;

    // ──────────────────────────────────────────
    // 초기화
    // ──────────────────────────────────────────

    void Awake()
    {
        _ps = GetComponent<ParticleSystem>();
    }

    void Start()
    {
        BuildStarCore();
        SetupPostProcessing();
        CalculateTargetTemp();
        InitParticles();
    }

    // 별 구체 생성
    void BuildStarCore()
    {
        _starCore = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        _starCore.name = "StarCore";
        _starCore.transform.SetParent(transform);
        _starCore.transform.localPosition = Vector3.zero;
        _starCore.transform.localScale    = Vector3.zero;
        Destroy(_starCore.GetComponent<SphereCollider>());

        _starMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        _starMat.EnableKeyword("_EMISSION");

        _starRenderer = _starCore.GetComponent<MeshRenderer>();
        _starRenderer.material         = _starMat;
        _starRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
    }

    // 포스트 프로세싱 참조 획득
    void SetupPostProcessing()
    {
        if (ppVolume == null) return;
        ppVolume.profile.TryGet(out _bloom);
        ppVolume.profile.TryGet(out _ca);

        if (_bloom != null) _bloom.intensity.value = 0f;
        if (_ca   != null) _ca.intensity.value     = 0f;
    }

    // 목표 온도 계산 (질량-온도 관계)
    void CalculateTargetTemp()
    {
        // 주계열 근사: T ∝ M^0.57
        _targetTemp = 5778f * Mathf.Pow(starMass, 0.57f);
        _targetTemp = Mathf.Clamp(_targetTemp, 2400f, 50000f);
    }

    // 파티클 초기 배치 (구형 분포)
    void InitParticles()
    {
        _ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);

        var main = _ps.main;
        main.maxParticles      = particleCount;
        main.simulationSpace   = ParticleSystemSimulationSpace.World;
        main.startLifetime     = 9999f;
        main.startSpeed        = 0f;

        _ps.Emit(particleCount);
        _particles = new ParticleSystem.Particle[particleCount];
        int n = _ps.GetParticles(_particles);

        for (int i = 0; i < n; i++)
        {
            Vector3 pos = Random.insideUnitSphere * cloudRadius;
            _particles[i].position          = transform.position + pos;
            _particles[i].velocity          = Random.insideUnitSphere * 0.4f;
            _particles[i].startColor        = new Color(0.45f, 0.25f, 0.85f, 0.55f);
            _particles[i].startSize         = Random.Range(0.2f, 0.55f);
            _particles[i].remainingLifetime = 9999f;
            _particles[i].startLifetime     = 9999f;
        }
        _ps.SetParticles(_particles, n);

        // 상태 리셋
        _simTime           = 0f;
        _stage             = Stage.GasCloud;
        _starTemp          = 800f;
        _starRadius        = 0f;
        _ignitionFlashDone = false;

        if (_starCore != null)
            _starCore.transform.localScale = Vector3.zero;
        if (_bloom != null) _bloom.intensity.value = 0f;
        if (_ca    != null) _ca.intensity.value    = 0f;
        if (starLight != null) starLight.intensity  = 0f;
    }

    // ──────────────────────────────────────────
    // 매 프레임
    // ──────────────────────────────────────────

    void Update()
    {
        if (!autoPlay) return;

        _simTime += Time.deltaTime * timeScale;
        UpdateStage();
        UpdateParticles();
        UpdateStarVisual();
    }

    // 현재 단계 판별
    void UpdateStage()
    {
        for (int i = _stageStart.Length - 1; i >= 0; i--)
        {
            if (_simTime >= _stageStart[i])
            {
                _stage = (Stage)i;
                break;
            }
        }
    }

    // ──────────────────────────────────────────
    // 파티클 물리
    // ──────────────────────────────────────────

    void UpdateParticles()
    {
        int n  = _ps.GetParticles(_particles);
        float dt = Time.deltaTime * timeScale;

        for (int i = 0; i < n; i++)
        {
            Vector3 toCenter = transform.position - _particles[i].position;
            float   dist     = Mathf.Max(toCenter.magnitude, 0.5f);

            switch (_stage)
            {
                // ── 0: 성간 가스 구름 ──────────────
                case Stage.GasCloud:
                    ApplyGravity(ref _particles[i], toCenter, dist, 0.08f, dt);
                    SetParticleColor(ref _particles[i], new Color(0.45f, 0.25f, 0.85f, 0.55f), dt);
                    break;

                // ── 1: 중력 수축 ───────────────────
                case Stage.Collapse:
                {
                    float t = StageProgress(1);
                    float g = Mathf.Lerp(0.15f, 12f, t * t);
                    ApplyGravity(ref _particles[i], toCenter, dist, g, dt);

                    Color c = Color.Lerp(
                        new Color(0.45f, 0.25f, 0.85f, 0.55f),
                        new Color(1.0f,  0.35f, 0.05f, 0.75f), t);
                    SetParticleColor(ref _particles[i], c, dt);
                    break;
                }

                // ── 2: 원시별 ──────────────────────
                case Stage.Protostar:
                    if (dist < 4f)
                    {
                        _particles[i].remainingLifetime = 0f;
                        continue;
                    }
                    ApplyGravity(ref _particles[i], toCenter, dist, 14f, dt);
                    SetParticleColor(ref _particles[i], new Color(1f, 0.45f, 0.1f, 0.8f), dt);
                    break;

                // ── 3: 핵융합 점화 ─────────────────
                case Stage.Ignition:
                    if (dist < 6f)
                    {
                        _particles[i].remainingLifetime = 0f;
                        continue;
                    }
                    ApplyGravity(ref _particles[i], toCenter, dist, 18f, dt);
                    SetParticleColor(ref _particles[i], new Color(1f, 0.95f, 0.6f, 1f), dt);
                    break;

                // ── 4: 항성풍 ──────────────────────
                case Stage.StellarWind:
                {
                    // 중심에서 바깥으로 밀어냄 (음수 중력)
                    float t = StageProgress(4);
                    float g = Mathf.Lerp(-5f, -30f, t);
                    ApplyGravity(ref _particles[i], toCenter, dist, g, dt);

                    Color c = Color.Lerp(
                        new Color(1f,  0.95f, 0.6f,  1f),
                        new Color(0.7f,0.85f, 1.0f, 0.2f), t);
                    SetParticleColor(ref _particles[i], c, dt);

                    // 멀리 나간 파티클 서서히 소멸
                    if (dist > cloudRadius * 0.8f)
                        _particles[i].startColor = new Color(
                            _particles[i].startColor.r,
                            _particles[i].startColor.g,
                            _particles[i].startColor.b,
                            Mathf.Max(0f, _particles[i].startColor.a - dt * 0.5f));
                    break;
                }

                // ── 5: 주계열성 ────────────────────
                case Stage.MainSequence:
                    _particles[i].remainingLifetime -= dt * 0.8f;
                    break;
            }
        }

        _ps.SetParticles(_particles, n);
    }

    void ApplyGravity(ref ParticleSystem.Particle p,
                      Vector3 toCenter, float dist,
                      float strength, float dt)
    {
        Vector3 force = toCenter.normalized * strength / (dist * 0.4f + 1f);
        p.velocity += force * dt;
        p.velocity *= Mathf.Pow(1f - 0.25f * dt, 1f); // 감쇠
    }

    void SetParticleColor(ref ParticleSystem.Particle p, Color target, float dt)
    {
        p.startColor = Color.Lerp(p.startColor, target, dt * 1.8f);
    }

    // ──────────────────────────────────────────
    // 별 시각 효과
    // ──────────────────────────────────────────

    void UpdateStarVisual()
    {
        float dt = Time.deltaTime * timeScale;
        float t;

        switch (_stage)
        {
            case Stage.GasCloud:
                _starTemp   = 800f;
                _starRadius = 0f;
                break;

            case Stage.Collapse:
                t = StageProgress(1);
                _starTemp   = Mathf.Lerp(800f,  2800f, t);
                _starRadius = Mathf.Lerp(0f,    2.5f,  t * t);
                break;

            case Stage.Protostar:
                t = StageProgress(2);
                _starTemp   = Mathf.Lerp(2800f, 4200f, t);
                _starRadius = Mathf.Lerp(2.5f,  4.5f,  t);
                break;

            case Stage.Ignition:
                t = StageProgress(3);
                _starTemp   = Mathf.Lerp(4200f, _targetTemp * 1.6f, EaseInQuad(t));
                _starRadius = Mathf.Lerp(4.5f,  3.5f * Mathf.Sqrt(starMass), t);

                // 점화 플래시 (한 번만)
                if (!_ignitionFlashDone && t > 0.3f)
                {
                    StartCoroutine(IgnitionFlash());
                    _ignitionFlashDone = true;
                }
                break;

            case Stage.StellarWind:
                t = StageProgress(4);
                _starTemp = Mathf.Lerp(_targetTemp * 1.6f, _targetTemp, t);
                break;

            case Stage.MainSequence:
                _starTemp = Mathf.Lerp(_starTemp, _targetTemp, dt * 0.3f);
                break;
        }

        ApplyStarVisuals(dt);
    }

    void ApplyStarVisuals(float dt)
    {
        if (_starCore == null) return;

        // 크기
        float r = Mathf.Max(_starRadius, 0f);
        _starCore.transform.localScale = Vector3.Lerp(
            _starCore.transform.localScale,
            Vector3.one * r * 2f,
            dt * 4f);

        // 색상 (흑체 복사)
        Color starColor = BlackbodyColor.TempToColor(_starTemp);
        _starMat.color = starColor;

        // 발광 강도
        float lum = BlackbodyColor.GetLuminosityFactor(_starTemp, starMass);
        _starMat.SetColor("_EmissionColor", starColor * Mathf.Clamp(lum * 4f, 0f, 30f));

        // 광원
        if (starLight != null)
        {
            starLight.color     = starColor;
            starLight.intensity = Mathf.Lerp(starLight.intensity, lum * 3f, dt * 2f);
            starLight.range     = 30f + r * 10f + _starTemp / 300f;
        }

        // Bloom
        if (_bloom != null)
        {
            float targetBloom = _stage == Stage.Ignition
                ? 8f
                : Mathf.Clamp(lum * 1.5f, 0f, 4f);
            _bloom.intensity.value = Mathf.Lerp(_bloom.intensity.value, targetBloom, dt * 2f);
        }

        // Chromatic Aberration (점화 순간 효과)
        if (_ca != null)
            _ca.intensity.value = Mathf.Lerp(_ca.intensity.value, 0f, dt * 3f);
    }

    // 점화 플래시 코루틴
    IEnumerator IgnitionFlash()
    {
        // 1. 화면 밝아짐
        if (_bloom != null) _bloom.intensity.value = 20f;
        if (_ca    != null) _ca.intensity.value    = 0.7f;
        if (starLight != null) starLight.intensity  = 80f;

        yield return new WaitForSeconds(0.12f / timeScale);

        // 2. 점차 정상화 (ApplyStarVisuals가 Lerp로 처리)
    }

    // ──────────────────────────────────────────
    // 공개 제어 메서드 (UI에서 호출)
    // ──────────────────────────────────────────

    public void Restart()
    {
        StopAllCoroutines();
        CalculateTargetTemp();
        InitParticles();
    }

    public void SetMass(float mass)
    {
        starMass = mass;
        CalculateTargetTemp();
    }

    public void SetTimeScale(float ts) => timeScale = ts;

    public void SetPaused(bool paused) => autoPlay = !paused;

    // ──────────────────────────────────────────
    // 유틸
    // ──────────────────────────────────────────

    // 현재 단계의 진행률 (0~1)
    float StageProgress(int stageIdx)
    {
        int next = stageIdx + 1;
        if (next >= _stageStart.Length) return 1f;
        float duration = _stageStart[next] - _stageStart[stageIdx];
        return Mathf.Clamp01((_simTime - _stageStart[stageIdx]) / duration);
    }

    float EaseInQuad(float t) => t * t;
}
