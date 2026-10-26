/**
 * EduStack Lite Server-Side Client
 * Used by the Next.js Route Handler to communicate with OpenClaw or the Python BFF.
 */

const EDUSTACK_URL = process.env.EDUSTACK_BFF_URL || "http://localhost:8080";
const GATEWAY_URL = process.env.OPENCLAW_URL || "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_TOKEN || "";

export async function checkEduStackHealth(): Promise<{ ok: boolean; mode?: string }> {
  try {
    const res = await fetch(`${EDUSTACK_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, mode: data.mode };
  } catch {
    return { ok: false };
  }
}

export async function proxyToOrchestration(text: string): Promise<string> {
  if (!GATEWAY_TOKEN) {
    throw new Error("OPENCLAW_TOKEN is not configured on the server.");
  }

  const prompt = `Please simplify this document for everyday readers:\n\n${text}`;

  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      model: "openclaw",
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    throw new Error(`OpenClaw returned HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
