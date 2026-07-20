using UnityEngine;

/// <summary>
/// 흑체 복사 법칙 기반 온도 → 색상 변환 유틸리티
/// Tanner Helland 알고리즘 (1000K ~ 40000K)
/// </summary>
public static class BlackbodyColor
{
    /// <summary>
    /// 온도(K)를 RGB 색상으로 변환
    /// </summary>
    public static Color TempToColor(float tempK)
    {
        float temp = Mathf.Clamp(tempK, 1000f, 40000f) / 100f;
        float r, g, b;

        // 빨강
        if (temp <= 66f)
            r = 255f;
        else
        {
            r = 329.698727446f * Mathf.Pow(temp - 60f, -0.1332047592f);
            r = Mathf.Clamp(r, 0f, 255f);
        }

        // 초록
        if (temp <= 66f)
        {
            g = 99.4708025861f * Mathf.Log(temp) - 161.1195681661f;
            g = Mathf.Clamp(g, 0f, 255f);
        }
        else
        {
            g = 288.1221695283f * Mathf.Pow(temp - 60f, -0.0755148492f);
            g = Mathf.Clamp(g, 0f, 255f);
        }

        // 파랑
        if (temp >= 66f)
            b = 255f;
        else if (temp <= 19f)
            b = 0f;
        else
        {
            b = 138.5177312231f * Mathf.Log(temp - 10f) - 305.0447927307f;
            b = Mathf.Clamp(b, 0f, 255f);
        }

        return new Color(r / 255f, g / 255f, b / 255f);
    }

    /// <summary>
    /// 온도(K)로 분광형 문자열 반환
    /// </summary>
    public static string GetSpectralType(float tempK)
    {
        if (tempK >= 30000f) return "O형  청색 초거성  >30,000 K";
        if (tempK >= 10000f) return "B형  청백색      10,000~30,000 K";
        if (tempK >= 7500f)  return "A형  백색        7,500~10,000 K";
        if (tempK >= 6000f)  return "F형  황백색      6,000~7,500 K";
        if (tempK >= 5200f)  return "G형  황색 (태양) 5,200~6,000 K";
        if (tempK >= 3700f)  return "K형  주황색      3,700~5,200 K";
        return                      "M형  적색 왜성   <3,700 K";
    }

    /// <summary>
    /// 온도에 따른 발광 강도 배수 (별 밝기)
    /// 슈테판-볼츠만 법칙: L ∝ T^4
    /// </summary>
    public static float GetLuminosityFactor(float tempK, float solarMass)
    {
        float tempRatio = tempK / 5778f;
        return Mathf.Pow(tempRatio, 4f) * Mathf.Pow(solarMass, 0.7f);
    }
}
