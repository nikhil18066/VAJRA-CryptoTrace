// Direct OpenRouter API endpoint (supports CORS on both Web and Mobile Capacitor)
const BASE = (import.meta.env.VITE_OPENROUTER_BASE_URL as string) || 'https://openrouter.ai/api/v1';
const KEY  = (import.meta.env.VITE_OPENROUTER_API_KEY as string) || '';

// High-speed, high-availability free models prioritized by direct response quality without safety wrapper prefixes
const MODELS = [
  'stealth/space-bunny-alpha',
  'dots-studio/dots-3-note-preview:free',
  'inclusionai/ling-3.0-flash-sante:free',
  'liquid/lfm-2.5-2.6b:free',
  'cohere/north-mini-code:free',
  'openrouter/free',
] as const;

let modelCursor = 0;

export function nextModel() {
  const m = MODELS[modelCursor % MODELS.length];
  modelCursor++;
  return m;
}

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

// Comprehensive cleaner for raw LLM outputs (strips <think> blocks, unclosed thinking traces, and moderation safety headers)
export function cleanAIResponse(text: string): string {
  if (!text) return '';
  let out = text;
  
  // 1. Strip explicit <think>...</think> blocks
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // 2. Strip raw "Here's a thinking process: ... " or "Thinking Process: ..." before main response
  out = out.replace(/^(?:Here's a thinking process|Thinking Process|Thinking Log)[\s\S]*?(?=\n\n(?:[#\*\-A-Za-z0-9]|$))/i, '');
  
  // 3. Strip "User Safety: safe", "Response Safety: safe", "Safety Assessment: ...", etc.
  out = out.replace(/^\s*(?:User Safety|Response Safety|Content Safety|Safety Assessment|Safety):\s*(?:safe|unsafe|pass|fail|low|medium|high|unknown|n\/a)[^\r\n]*\r?\n?/gmi, '');
  out = out.replace(/^\s*(?:User Safety|Response Safety|Content Safety|Safety Assessment|Safety):\s*(?:safe|unsafe|pass|fail|low|medium|high|unknown|n\/a)[^\r\n]*$/gmi, '');
  
  // 4. Strip leftover blank lines at the start/end
  return out.trim();
}

// Stateful streaming filter for partial <think> blocks and safety headers split across SSE chunks
function makeStreamFilter() {
  let insideThink = false;
  let buf = '';

  return function filter(raw: string): string {
    let s = buf + raw;
    buf = '';

    // Handle think block start/end
    while (s.length > 0) {
      if (insideThink) {
        const end = s.indexOf('</think>');
        if (end === -1) { buf = s; return ''; }
        s = s.slice(end + 8);
        insideThink = false;
      } else {
        const start = s.indexOf('<think>');
        if (start === -1) { break; }
        const before = s.slice(0, start);
        s = s.slice(start + 7);
        insideThink = true;
        s = before; // Process content before <think>
      }
    }

    // Filter safety evaluation lines
    s = s.replace(/^\s*(?:User Safety|Response Safety|Content Safety|Safety Assessment):\s*(?:safe|unsafe|pass|fail|low|medium|high)[^\r\n]*\r?\n?/gmi, '');

    return s;
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

// Non-streaming completion for messages array with clean output verification
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
    const rawContent = data.choices?.[0]?.message?.content ?? '';
    const cleaned = cleanAIResponse(rawContent);

    // If cleaned response is empty or invalid safety text, try next model
    if ((!cleaned || cleaned.length < 15) && attempt < MODELS.length - 1) {
      return completeChat(messages, attempt + 1);
    }

    return cleaned;
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
  const filterChunk = makeStreamFilter();

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
        if (fullReply && fullReply.length >= 15) {
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
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') {
          const cleaned = cleanAIResponse(accumulated);
          if (cleaned.length >= 15) {
            onDone();
            return;
          } else if (attempt < MODELS.length - 1) {
            return streamChat(messages, onChunk, onDone, onError, attempt + 1);
          } else {
            onDone();
            return;
          }
        }
        try {
          const parsed = JSON.parse(raw);
          const chunk  = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            const filtered = filterChunk(chunk);
            if (filtered) {
              accumulated += filtered;
              onChunk(filtered);
            }
          }
        } catch {
          // skip malformed chunk
        }
      }
    }

    const cleaned = cleanAIResponse(accumulated);
    if ((!cleaned || cleaned.length < 15) && attempt < MODELS.length - 1) {
      return streamChat(messages, onChunk, onDone, onError, attempt + 1);
    }

    onDone();
  } catch (err) {
    if (attempt < MODELS.length - 1) {
      return streamChat(messages, onChunk, onDone, onError, attempt + 1);
    }
    try {
      const fullReply = await completeChat(messages, 0);
      if (fullReply && fullReply.length >= 15) {
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
