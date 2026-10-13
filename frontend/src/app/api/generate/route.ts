import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { BrandProfile } from "@/lib/api-client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let prompt = "";
  let tone = "authoritative";
  let platform = "LinkedIn";
  let brand_profile: BrandProfile | null = null;

  try {
    const body = await req.json();
    prompt = body.prompt || "";
    tone = body.tone || "authoritative";
    platform = body.platform || "LinkedIn";
    brand_profile = body.brand_profile;
  } catch {
    return new Response("Invalid request payload", { status: 400 });
  }

  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.NVIDIA_API_KEY ||
    process.env.GROQ_API_KEY ||
    "dummy-key";

  const baseURL =
    process.env.OPENAI_BASE_URL ||
    process.env.NVIDIA_BASE_URL ||
    process.env.LITELLM_PROXY_URL ||
    (process.env.OLLAMA_BASE_URL ? `${process.env.OLLAMA_BASE_URL}/v1` : "http://localhost:4000");

  const modelName =
    process.env.LLM_MODEL ||
    (baseURL.includes("nvidia.com") ? "meta/llama-3.2-11b-vision-instruct" : "gpt-4o-mini");

  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  let brandContext = "";
  if (brand_profile) {
    const written = brand_profile.written_identity || {};
    const pol = written.compliance_policies || {};
    const banned = written.banned_words && written.banned_words.length > 0
      ? `\n- NEVER use these banned words: ${written.banned_words.join(", ")}`
      : "";
    const rules = written.formatting_rules
      ? `\n- Formatting Rules: ${written.formatting_rules}`
      : "";
    const archetype = written.archetype
      ? `\n- Written Voice Archetype: ${written.archetype}`
      : "";
    const tones = written.tone_attributes && written.tone_attributes.length > 0
      ? `\n- Tone Attributes: ${written.tone_attributes.join(", ")}`
      : "";
    
    const blacklist = pol.competitor_blacklist && pol.competitor_blacklist.length > 0
      ? `\n- NEVER mention, praise, or validate these competitors: ${pol.competitor_blacklist.join(", ")}`
      : "";
    const sensitive = pol.sensitive_topics && pol.sensitive_topics.length > 0
      ? `\n- STRICTLY AVOID these off-limits topics: ${pol.sensitive_topics.join(", ")}`
      : "";
    const disclaimers = pol.mandatory_disclaimers && pol.mandatory_disclaimers.length > 0
      ? `\n- Adhere to mandatory disclaimers where applicable: ${pol.mandatory_disclaimers.join(" | ")}`
      : "";

    const valueProps = brand_profile.core_value_props && brand_profile.core_value_props.length > 0
      ? `\n- Core Value Propositions to highlight: ${brand_profile.core_value_props.join(" | ")}`
      : "";

    brandContext = `\n\nBrand Positioning & Compliance Guardrails for ${brand_profile.brand_name || "the brand"}:${archetype}${tones}${rules}${banned}${blacklist}${sensitive}${disclaimers}${valueProps}`;
  }

  const systemPrompt = `You are VibeAgent, an elite social media ghostwriter and marketing strategist specializing in viral, high-converting B2B ${platform} posts.
Write an authentic, punchy post based on the operator's brief.
Tone: ${tone}.${brandContext}

Structure:
- Strong 1-line hook that stops the scroll
- High-density tactical insight (short paragraphs, 1-2 lines each)
- Concrete takeaway or framework
- Thought-provoking call-to-action (CTA)
- 3-5 relevant hashtags.
Return clean, ready-to-publish copy without meta-commentary.`;

  const fallbackText = `Most founders think scaling outbound is about sending 10x more emails.\n\nIt's not.\n\nIt's about having autonomous agents vet intent in real-time before your sales reps ever open their calendar.\n\nHere is what changed when we switched to multi-agent qualification:\n1. Zero cold inquiries on calendar\n2. 89% BANT qualification rate before first call\n3. Latency dropped from 4 hours to 1.4 seconds\n\nStop optimizing for volume. Optimize for speed to high-intent signal.\n\nWhat is your team's current bottleneck in outbound?\n\n#AgenticAI #B2BGrowth #SalesAutomation #VibeAgent`;

  function createFallbackResponse() {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = fallbackText.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 40));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  try {
    const result = streamText({
      model: openai.chat(modelName),
      system: systemPrompt,
      prompt,
    });

    const encoder = new TextEncoder();
    const safeStream = new ReadableStream({
      async start(controller) {
        try {
          let hasOutput = false;
          for await (const chunk of result.textStream) {
            hasOutput = true;
            controller.enqueue(encoder.encode(chunk));
          }
          if (!hasOutput) {
            const words = fallbackText.split(" ");
            for (const word of words) {
              controller.enqueue(encoder.encode(word + " "));
              await new Promise((r) => setTimeout(r, 40));
            }
          }
          controller.close();
        } catch {
          const words = fallbackText.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((r) => setTimeout(r, 40));
          }
          controller.close();
        }
      },
    });

    return new Response(safeStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch {
    return createFallbackResponse();
  }
}
