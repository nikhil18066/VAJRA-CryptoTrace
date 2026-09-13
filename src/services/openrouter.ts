// Direct OpenRouter API endpoint (supports CORS on both Web and Mobile Capacitor)
const BASE = (import.meta.env.VITE_OPENROUTER_BASE_URL as string) || 'https://openrouter.ai/api/v1';
const KEY  = (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '';

// High-speed, high-availability free models prioritized by latency and token completion capacity
const MODELS = [
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5-8b:free',
  'deepseek/deepseek-chat:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'mistralai/mistral-small-24b-instruct-2501:free',
  'openrouter/free',
] as const;

let modelCursor = 0;

export function nextModel() {
  const m = MODELS[modelCursor % MODELS.length];
  modelCursor++;
  return m;
}

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

// Strip <think>...</think> blocks that reasoning models prepend
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trimStart();
}

// Stateful streaming filter for partial <think> blocks split across SSE chunks
function makeThinkFilter() {
  let inside = false;
  let buf = '';

  return function filter(raw: string): string {
    let out = '';
    let s = buf + raw;
    buf = '';

    while (s.length > 0) {
      if (inside) {
        const end = s.indexOf('</think>');
        if (end === -1) { buf = s; break; }
        s = s.slice(end + 8);
        inside = false;
      } else {
        const start = s.indexOf('<think>');
        if (start === -1) { out += s; break; }
        out += s.slice(0, start);
        s = s.slice(start + 7);
        inside = true;
      }
    }
    return out;
  };
}

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://vajra-cryptotrace.app',
    'X-Title': 'VAJRA CryptoTrace',
  };
  if (KEY) {
    headers['Authorization'] = `Bearer ${KEY}`;
  }
  return headers;
}

// Non-streaming completion for messages array with high max_tokens to prevent mid-response cutoffs
export async function completeChat(messages: ChatMessage[], attempt = 0): Promise<string> {
  const model = MODELS[attempt % MODELS.length];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9s rapid timeout

    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 3500,
        temperature: 0.3,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (attempt < MODELS.length - 1) {
        return completeChat(messages, attempt + 1);
      }
      const errText = await res.text().catch(() => '');
      throw new Error(`AI model request failed (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return stripThinking(content);
  } catch (err) {
    if (attempt < MODELS.length - 1) {
      return completeChat(messages, attempt + 1);
    }
    throw err;
  }
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  attempt = 0,
): Promise<void> {
  const model = MODELS[attempt % MODELS.length];
  const filterChunk = makeThinkFilter();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9s rapid timeout

    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: 3500,
        temperature: 0.3,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok || !res.body) {
      if (attempt < MODELS.length - 1) {
        return streamChat(messages, onChunk, onDone, onError, attempt + 1);
      }
      try {
        const fullReply = await completeChat(messages, 0);
        if (fullReply) {
          onChunk(fullReply);
          onDone();
          return;
        }
      } catch {
        // Fallback to error
      }
      throw new Error(`Model stream failed with status ${res.status}`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';
    let receivedAnyChunk = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(raw);
          const chunk  = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            const filtered = filterChunk(chunk);
            if (filtered) {
              receivedAnyChunk = true;
              onChunk(filtered);
            }
          }
        } catch {
          // skip malformed chunk
        }
      }
    }

    if (!receivedAnyChunk && attempt < MODELS.length - 1) {
      return streamChat(messages, onChunk, onDone, onError, attempt + 1);
    }

    onDone();
  } catch (err) {
    if (attempt < MODELS.length - 1) {
      return streamChat(messages, onChunk, onDone, onError, attempt + 1);
    }
    try {
      const fullReply = await completeChat(messages, 0);
      if (fullReply) {
        onChunk(fullReply);
        onDone();
        return;
      }
    } catch {
      // Fallback
    }
    onError(err instanceof Error ? err.message : 'AI service error');
  }
}

// One-shot non-streaming call (for risk narrative generation)
export async function complete(prompt: string): Promise<string> {
  return completeChat([{ role: 'user', content: prompt }]);
}
