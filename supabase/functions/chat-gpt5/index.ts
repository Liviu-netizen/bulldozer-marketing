import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================
   ENV + CLIENTS
========================= */

const azureEndpoint =
  Deno.env.get("AZURE_OPENAI_ENDPOINT") ??
  "https://liviu-mkfxdm5h-eastus2.cognitiveservices.azure.com/";
const azureApiKey = Deno.env.get("AZURE_OPENAI_KEY");
const azureApiVersion =
  Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-12-01-preview";
const chatDeployment =
  Deno.env.get("AZURE_OPENAI_CHAT_DEPLOYMENT") ?? "gpt-5.2-chat";
const embeddingsDeployment =
  Deno.env.get("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT");

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/* =========================
   CORS
========================= */

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowAllOrigins = allowedOrigins.includes("*");

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": allowAllOrigins
    ? "*"
    : origin || allowedOrigins[0] || "",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

/* =========================
   SCOPE + BUDGET LOGIC
========================= */

const parseBudgetValue = (message: string): number | null => {
  const text = message.toLowerCase();
  const match = text.match(/\$?\s?(\d+(\.\d+)?)\s?k?/);
  if (!match) return null;

  let value = parseFloat(match[1]);
  if (text.includes("k")) value *= 1000;
  return value;
};

const classifyBudget = (value: number | null) => {
  if (!value) return "unknown";
  if (value < 2000) return "low";
  if (value < 5000) return "mid";
  if (value < 10000) return "high";
  return "enterprise";
};

const hasBudgetSignal = (message: string) => {
  const text = message.toLowerCase();
  return (
    text.includes("$") ||
    /\b\d+(\.\d+)?\s?k\b/.test(text) ||
    /\b\d+(\.\d+)?\s?(usd|eur|gbp)\b/.test(text) ||
    ["budget", "pricing", "price", "cost"].some((w) => text.includes(w))
  );
};

/* =========================
   HARD OUT-OF-SCOPE ONLY
========================= */

const isClearlyOutOfScope = (message: string) => {
  const text = message.toLowerCase();
  const hardBlocked = [
    "recipe",
    "cook",
    "homework",
    "algebra",
    "calculus",
    "lyrics",
    "poem",
    "story",
    "diagnose",
    "medical",
    "legal",
  ];
  return hardBlocked.some((term) => text.includes(term));
};

/* isInScope removed - let the AI handle context gracefully via improved prompt */

/* =========================
   PROMPTS
========================= */

const buildSystemPrompt = (
  page: { title?: string; url?: string } | null
) => {
  const pageLine = page?.title
    ? `Current page: ${page.title}${page.url ? ` (${page.url})` : ""}`
    : "Current page: unknown";

  return `You are the Bulldozer Marketing growth consultant chatbot. Your goal is to help visitors, answer their questions, and guide qualified prospects toward booking a 15-minute growth call.

## Your Personality
- Friendly, knowledgeable, and direct. You're a growth expert who genuinely wants to help.
- Consultative: understand their challenge first, then offer value.
- Confident but not pushy. Let the value speak for itself.

## How to Handle Conversations
1. **Listen first**: Understand what they're struggling with before pitching.
2. **Provide real value**: Answer their question with actionable advice, even if brief.
3. **Relate to Bulldozer**: After helping, naturally mention how Bulldozer could help further if relevant.
4. **Guide toward action**: When appropriate, suggest booking a 15-min call for deeper help.

## What Bulldozer Does
- B2B SaaS growth agency specializing in: positioning, acquisition, activation, onboarding, retention, lifecycle
- Three packages: Foundation (€1.2-1.5k), Traction Engine (€2.8-3.5k), Bulldozer Launch System (€5.5-7k)
- Works with PLG, sales-led, and hybrid SaaS companies
- Weekly experiment-driven approach with clear deliverables

## Handling Different Topics
- **SaaS/B2B/growth questions**: Give helpful advice, relate to Bulldozer's expertise
- **Pricing questions**: Share the package ranges, suggest a call for custom fit
- **General business questions**: Help if you can, then redirect to SaaS growth focus
- **Completely unrelated (recipes, medical, legal)**: Politely decline and redirect

## Never Do
- Invent specific guarantees or exact results
- Be robotic or give canned responses
- Block reasonable business conversations just because they don't mention "SaaS"

${pageLine}`;
};

const buildContextMessage = (
  matches: Array<{
    content: string;
    source: string;
    page_title: string | null;
    section_title: string | null;
    metadata: Record<string, unknown> | null;
  }>,
  page: { description?: string } | null
) => {
  const parts: string[] = [];
  if (page?.description) {
    parts.push(`Page summary: ${page.description}`);
  }

  if (!matches.length) {
    parts.push("Site context: none.");
    return parts.join("\n");
  }

  parts.push("Site context (use these facts):");

  matches.forEach((m, i) => {
    const label = [m.page_title || m.source, m.section_title]
      .filter(Boolean)
      .join(" > ");
    parts.push(`[${i + 1}] ${label}\n${m.content}`);
  });

  return parts.join("\n\n");
};

/* =========================
   AZURE HELPERS
========================= */

const toAzureUrl = (path: string) => {
  const url = new URL(path, azureEndpoint);
  url.searchParams.set("api-version", azureApiVersion);
  return url.toString();
};

const embedText = async (text: string) => {
  const res = await fetch(
    toAzureUrl(`/openai/deployments/${embeddingsDeployment}/embeddings`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey!,
      },
      body: JSON.stringify({ input: text }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error("Embedding failed");
  return data.data[0].embedding as number[];
};

const completeChat = async (
  messages: Array<{ role: string; content: string }>
) => {
  const res = await fetch(
    toAzureUrl(`/openai/deployments/${chatDeployment}/chat/completions`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey!,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 800,
        temperature: 0.7
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Azure OpenAI API Error:", res.status, errorText);
    throw new Error(`Azure API Error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data;
};

/* =========================
   SERVER
========================= */

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const page = body?.page ?? null;

    const cleanedMessages = messages
      .filter((m: any) => m?.role && typeof m?.content === "string")
      .map((m: any) => ({
        role: m.role,
        content: m.content.trim().slice(0, 4000),
      }))
      .slice(-12);

    const latestUser = [...cleanedMessages]
      .reverse()
      .find((m) => m.role === "user");

    if (!latestUser) {
      return new Response(JSON.stringify({ error: "No user message" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const userMessage = latestUser.content;

    if (isClearlyOutOfScope(userMessage)) {
      return new Response(
        JSON.stringify({
          reply:
            "I can help with Bulldozer Marketing, SaaS growth, positioning, and engagement fit.",
        }),
        { headers: corsHeaders }
      );
    }

    const embedding = await embedText(userMessage);

    const { data: matches } = await supabase!.rpc("match_rag_chunks", {
      query_embedding: embedding,
      match_count: 6,
      match_threshold: 0.68,
    });

    if (false) { /* Removed isInScope check - let AI handle gracefully */
      return new Response(
        JSON.stringify({
          reply:
            "I focus on Bulldozer Marketing and SaaS growth work. If that’s relevant, ask away.",
        }),
        { headers: corsHeaders }
      );
    }

    const systemPrompt = buildSystemPrompt(page);
    const contextMessage = buildContextMessage(matches ?? [], page);

    const chatData = await completeChat([
      { role: "system", content: systemPrompt },
      { role: "system", content: contextMessage },
      ...cleanedMessages,
    ]);

    console.log("Chat completion raw response:", JSON.stringify(chatData));

    if (!chatData.choices || !chatData.choices[0]) {
      console.error("Invalid choice structure:", chatData);
      throw new Error("No choices returned from AI");
    }

    const firstChoice = chatData.choices[0];
    const reply = firstChoice.message?.content;
    const finishReason = firstChoice.finish_reason;

    console.log("Extracted reply:", reply, "Finish reason:", finishReason);

    if (finishReason === 'content_filter') {
      return new Response(JSON.stringify({ reply: "I can't answer that specific question, but I'm happy to discuss how we can help your B2B SaaS grow." }), {
        headers: corsHeaders,
      });
    }

    if (!reply) {
      console.error("Empty reply with finish_reason:", finishReason);
      return new Response(JSON.stringify({ reply: "I'm thinking... (No content returned)" }), {
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), {
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("Function Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
