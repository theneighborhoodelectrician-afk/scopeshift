type ResponseInput = {
  instructions: string;
  input: string;
  model?: string;
  maxOutputTokens?: number;
};

function collectPossibleText(value: unknown): string[] {
  if (value == null) {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? [] : [trimmed];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectPossibleText(item));
  }

  if (typeof value === "object") {
    const typedValue = value as Record<string, unknown>;
    const directKeys = ["output_text", "text", "value"];
    const nestedKeys = ["content", "output", "summary"];
    const parts: string[] = [];

    for (const key of directKeys) {
      const direct = typedValue[key];
      if (typeof direct === "string") {
        const trimmed = direct.trim();
        if (trimmed !== "") {
          parts.push(trimmed);
        }
      }
    }

    for (const key of nestedKeys) {
      parts.push(...collectPossibleText(typedValue[key]));
    }

    return parts;
  }

  return [];
}

function dedupeTexts(parts: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const part of parts) {
    if (seen.has(part) === false) {
      seen.add(part);
      unique.push(part);
    }
  }

  return unique;
}

function readOutputText(payload: unknown): string {
  if (payload == null || typeof payload !== "object") {
    return "";
  }

  const typedPayload = payload as Record<string, unknown>;
  const parts = dedupeTexts([
    ...collectPossibleText(typedPayload.output_text),
    ...collectPossibleText(typedPayload.output),
    ...collectPossibleText(typedPayload.content)
  ]);

  return parts.join("\n").trim();
}

function extractJson(text: string): string {
  const fenceStart = text.indexOf("```json");
  if (fenceStart >= 0) {
    const contentStart = text.indexOf("\n", fenceStart);
    if (contentStart >= 0) {
      const fenceEnd = text.indexOf("```", contentStart + 1);
      if (fenceEnd > contentStart) {
        return text.slice(contentStart + 1, fenceEnd).trim();
      }
    }
  }

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return text.slice(objectStart, objectEnd + 1);
  }

  return text.trim();
}

export const aiClient = {
  provider: "openai",
  ready: Boolean(process.env.OPENAI_API_KEY),
  defaultModel: process.env.OPENAI_MODEL || "gpt-5-mini"
};

export async function generateText({
  instructions,
  input,
  model,
  maxOutputTokens = 500
}: ResponseInput): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey == null || apiKey === "") {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || aiClient.defaultModel,
      instructions,
      input,
      max_output_tokens: maxOutputTokens
    })
  });

  if (response.ok === false) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const payload = (await response.json()) as unknown;
  const text = readOutputText(payload);

  if (text === "") {
    const payloadPreview = JSON.stringify(payload, null, 2)?.slice(0, 4000) || "<unserializable payload>";
    console.error("OpenAI empty text payload", payloadPreview);
    return null;
  }

  return text;
}

export async function generateJson<T>(options: ResponseInput): Promise<T | null> {
  const text = await generateText(options);
  if (text == null || text === "") {
    return null;
  }

  return JSON.parse(extractJson(text)) as T;
}
