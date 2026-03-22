export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "서버 환경변수 GEMINI_API_KEY가 설정되지 않았습니다."
      });
    }

    const model = "gemini-2.5-flash";
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const googleRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await googleRes.json();

    if (!googleRes.ok) {
      console.error("Gemini API error:", data);
      return res.status(googleRes.status).json({
        error: data?.error?.message || "Gemini 호출 실패",
        raw: data
      });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.error("Empty Gemini response:", data);
      return res.status(500).json({
        error: "Gemini 응답이 비어 있습니다.",
        raw: data
      });
    }

    return res.status(200).json({
      result: rawText
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: err.message || "서버 오류가 발생했습니다."
    });
  }
}
