type ResponseInput = {
  instructions: string;
  input: string;
  model?: string;
  maxOutputTokens?: number;
};

function readOutputText(payload: unknown): string {
  if (payload == null) {
    return "";
  }

  if (typeof payload === "object") {
    const directText = (payload as { output_text?: unknown }).output_text;
    if (typeof directText === "string") {
      return directText.trim();
    }

    const output = (payload as { output?: unknown[] }).output;
    if (Array.isArray(output) === false) {
      return "";
    }

    const textParts: string[] = [];

    for (const item of output) {
      if (item == null || typeof item !== "object") {
        continue;
      }

      const content = (item as { content?: unknown[] }).content;
      if (Array.isArray(content) === false) {
        continue;
      }

      for (const block of content) {
        if (block == null || typeof block !== "object") {
          continue;
        }

        const typedBlock = block as { type?: string; text?: string };
        if (typedBlock.type === "output_text" && typeof typedBlock.text === "string") {
          textParts.push(typedBlock.text);
        }
      }
    }

    return textParts.join("\n").trim();
  }

  return "";
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
  return readOutputText(payload);
}

export async function generateJson<T>(options: ResponseInput): Promise<T | null> {
  const text = await generateText(options);
  if (text == null || text === "") {
    return null;
  }

  return JSON.parse(extractJson(text)) as T;
}
