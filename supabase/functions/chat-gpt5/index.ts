import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const azureEndpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "https://liviu-mkfxdm5h-eastus2.cognitiveservices.azure.com/";
const azureApiKey = Deno.env.get("AZURE_OPENAI_KEY");
const azureApiVersion = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-12-01-preview";
const chatDeployment = Deno.env.get("AZURE_OPENAI_CHAT_DEPLOYMENT") ?? "gpt-5.2-chat";
const embeddingsDeployment = Deno.env.get("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT");

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes("*");

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": allowAllOrigins ? "*" : (origin || allowedOrigins[0] || ""),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
});

const getBudgetMention = (message: string) => {
  const text = message.toLowerCase();
  const shortMatch = text.match(/\b\$?\d+(\.\d+)?\s?k\b/);
  if (shortMatch) {
    return shortMatch[0].replace(/\s+/g, "");
  }
  const currencyMatch = text.match(/\b\d+(\.\d+)?\s?(usd|eur|gbp)\b/);
  if (currencyMatch) {
    return currencyMatch[0];
  }
  return null;
};

const hasBudgetSignal = (message: string) => {
  const text = message.toLowerCase();
  if (text.includes("$")) return true;
  if (/\b\d+(\.\d+)?\s?k\b/.test(text)) return true;
  if (/\b\d+(\.\d+)?\s?(usd|eur|gbp)\b/.test(text)) return true;
  if (text.includes("budget") || text.includes("pricing") || text.includes("price") || text.includes("cost")) {
    return true;
  }
  return false;
};

const isClearlyOutOfScope = (message: string) => {
  const text = message.toLowerCase();
  const blocked = [
    "recipe",
    "cook",
    "homework",
    "math",
    "algebra",
    "calculus",
    "python",
    "javascript",
    "code",
    "program",
    "script",
    "essay",
    "poem",
    "story",
    "translate",
    "lyrics",
    "diagnose",
    "medical",
    "legal"
  ];

  return blocked.some((term) => text.includes(term));
};

const isInScope = (message: string) => {
  const text = message.toLowerCase();
  const allowed = [
    "bulldozer",
    "saas",
    "b2b",
    "growth",
    "marketing",
    "positioning",
    "acquisition",
    "activation",
    "onboarding",
    "lifecycle",
    "retention",
    "conversion",
    "funnel",
    "messaging",
    "landing page",
    "case study",
    "scorecard",
    "growth call",
    "pricing",
    "price",
    "cost",
    "budget",
    "engagement",
    "service",
    "services",
    "work with",
    "fit"
  ];

  return hasBudgetSignal(text) || allowed.some((term) => text.includes(term));
};

const buildSystemPrompt = (page: { title?: string; url?: string; description?: string } | null) => {
  const pageLine = page?.title
    ? `Current page: ${page.title}${page.url ? ` (${page.url})` : ""}`
    : "Current page: unknown";

  return [
    "You are the Bulldozer Marketing website assistant.",
    "Voice: concise, confident, direct, and practical. Short sentences. No fluff. No emojis.",
    "Focus on B2B SaaS growth: positioning, acquisition, activation, onboarding, and lifecycle.",
    "Use the site context below as the source of truth. If it is not in context, refuse and suggest booking a 15-min growth call.",
    "Refuse unrelated requests (recipes, homework, coding help, general knowledge). Only answer questions about Bulldozer Marketing and our SaaS growth services.",
    "Do not invent pricing, timelines, or guarantees. If asked, say engagements are tailored and suggest a 15-min growth call.",
    "Ask a question only if it unlocks the next step. Ask one at a time, and avoid generic check-ins.",
    "Prefer bullets for multi-step answers. Keep responses under 120 words unless the user asks for depth.",
    pageLine
  ].join("\n");
};

const buildContextMessage = (
  matches: Array<{
    id: string;
    content: string;
    source: string;
    page_title: string | null;
    section_title: string | null;
    metadata: Record<string, unknown> | null;
    similarity: number;
  }>,
  page: { description?: string } | null
) => {
  const parts: string[] = [];

  if (page?.description) {
    parts.push(`Page summary: ${page.description}`);
  }

  if (!matches.length) {
    parts.push("Site context: No relevant chunks found.");
    return parts.join("\n");
  }

  parts.push("Site context (use these facts, do not invent):");

  matches.forEach((match, index) => {
    const labelParts = [
      match.page_title || match.source,
      match.section_title ? `> ${match.section_title}` : ""
    ].filter(Boolean).join(" ");

    const url = match.metadata && typeof match.metadata === "object"
      ? (match.metadata as Record<string, string>).url
      : undefined;

    parts.push(`[${index + 1}] ${labelParts}${url ? ` (${url})` : ""}\n${match.content}`);
  });

  return parts.join("\n\n");
};

const buildSources = (
  matches: Array<{
    id: string;
    source: string;
    page_title: string | null;
    section_title: string | null;
    metadata: Record<string, unknown> | null;
    similarity: number;
  }>
) => matches.map((match) => ({
  id: match.id,
  source: match.source,
  title: match.page_title,
  section: match.section_title,
  url: match.metadata && typeof match.metadata === "object"
    ? (match.metadata as Record<string, string>).url
    : null,
  similarity: match.similarity
}));

const toAzureUrl = (path: string) => {
  const url = new URL(path, azureEndpoint);
  url.searchParams.set("api-version", azureApiVersion);
  return url.toString();
};

const embedText = async (text: string) => {
  if (!azureApiKey || !embeddingsDeployment) {
    throw new Error("Missing Azure embeddings configuration.");
  }

  const response = await fetch(
    toAzureUrl(`/openai/deployments/${embeddingsDeployment}/embeddings`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey
      },
      body: JSON.stringify({ input: text })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Embedding request failed.");
  }

  return data?.data?.[0]?.embedding as number[] | undefined;
};

const completeChat = async (messages: Array<{ role: string; content: string }>) => {
  if (!azureApiKey) {
    throw new Error("Missing Azure API key.");
  }

  const response = await fetch(
    toAzureUrl(`/openai/deployments/${chatDeployment}/chat/completions`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey
      },
      body: JSON.stringify({
        messages,
        max_completion_tokens: 500
      })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Chat completion failed.");
  }

  return data;
};

const logTranscript = async (params: {
  sessionId: string | null;
  visitorId: string | null;
  page: { url?: string; title?: string } | null;
  referrer?: string;
  userAgent?: string;
  userMessage: string;
  assistantMessage: string;
  sources: Array<Record<string, unknown>>;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}) => {
  if (!supabase) {
    return params.sessionId;
  }

  let resolvedSessionId = params.sessionId;

  if (!resolvedSessionId) {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        visitor_id: params.visitorId,
        page_url: params.page?.url,
        page_title: params.page?.title,
        referrer: params.referrer,
        user_agent: params.userAgent,
        metadata: {}
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    resolvedSessionId = data?.id;
  }

  if (!resolvedSessionId) {
    return params.sessionId;
  }

  const { error } = await supabase.from("chat_messages").insert([
    {
      session_id: resolvedSessionId,
      role: "user",
      content: params.userMessage,
      model: params.model,
      sources: []
    },
    {
      session_id: resolvedSessionId,
      role: "assistant",
      content: params.assistantMessage,
      model: params.model,
      prompt_tokens: params.usage?.prompt_tokens,
      completion_tokens: params.usage?.completion_tokens,
      total_tokens: params.usage?.total_tokens,
      sources: params.sources
    }
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return resolvedSessionId;
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (!allowAllOrigins && origin && !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (!azureApiKey || !embeddingsDeployment || !supabase) {
    return new Response(JSON.stringify({ error: "Server configuration missing." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const page = body?.page ?? null;

    const cleanedMessages = messages
      .filter((message: { role?: string; content?: string }) =>
        (message?.role === "user" || message?.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length
      )
      .map((message: { role: string; content: string }) => ({
        role: message.role,
        content: message.content.trim().slice(0, 4000)
      }))
      .slice(-12);

    const latestUserMessage = [...cleanedMessages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return new Response(JSON.stringify({ error: "Missing user message." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userMessage = latestUserMessage.content;

    if (isClearlyOutOfScope(userMessage)) {
      const refusal = "I can only answer questions about Bulldozer Marketing, our services, and SaaS growth work. Ask about positioning, acquisition, onboarding, pricing, or case studies.";
      const sessionId = await logTranscript({
        sessionId: body?.sessionId ?? null,
        visitorId: body?.visitorId ?? null,
        page,
        referrer: body?.referrer ?? "",
        userAgent: body?.userAgent ?? "",
        userMessage,
        assistantMessage: refusal,
        sources: [],
        model: "guard",
        usage: {}
      });

      return new Response(JSON.stringify({ reply: refusal, sessionId, sources: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const embedding = await embedText(userMessage);
    if (!embedding) {
      throw new Error("Embedding lookup failed.");
    }

    const fetchMatches = async (threshold: number) => {
      const { data, error } = await supabase
        .rpc("match_rag_chunks", {
          query_embedding: embedding,
          match_count: 6,
          match_threshold: threshold
        });

      if (error) {
        throw new Error(error.message);
      }

      return Array.isArray(data) ? data : [];
    };

    let contextMatches = await fetchMatches(0.74);
    if (!contextMatches.length) {
      contextMatches = await fetchMatches(0.68);
    }
    const contextMessage = buildContextMessage(contextMatches, page);
    const systemPrompt = buildSystemPrompt(page);

    if (!contextMatches.length) {
      if (!isInScope(userMessage)) {
        const refusal = "I can only answer questions about Bulldozer Marketing, our services, and SaaS growth work. Ask about positioning, acquisition, onboarding, pricing, or case studies.";
        const sessionId = await logTranscript({
          sessionId: body?.sessionId ?? null,
          visitorId: body?.visitorId ?? null,
          page,
          referrer: body?.referrer ?? "",
          userAgent: body?.userAgent ?? "",
          userMessage,
          assistantMessage: refusal,
          sources: [],
          model: "guard",
          usage: {}
        });

        return new Response(JSON.stringify({ reply: refusal, sessionId, sources: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const budgetMention = getBudgetMention(userMessage);
      const fallback = hasBudgetSignal(userMessage)
        ? [
            `We tailor scope, but ${budgetMention ? `a ${budgetMention} budget` : "a budget in that range"} usually maps to a focused sprint on one growth lever.`,
            "Typical focus areas: positioning + messaging, an acquisition landing page + offer, or onboarding + lifecycle flow.",
            "We review your funnel, pick the biggest bottleneck, ship the change, and measure lift.",
            "What SaaS stage are you at, and which lever matters most right now?"
          ].join(" ")
        : [
            "We focus on B2B SaaS growth: positioning, acquisition, onboarding, and lifecycle.",
            "If you're a design agency, we're a fit when you're serving SaaS teams or want help growing your own SaaS-focused pipeline.",
            "Budget-wise, we tailor scope to goals, so the fastest next step is a 15-min growth call or the SaaS growth scorecard.",
            "Are you selling to SaaS teams, or trying to grow your agency's own acquisition?"
          ].join(" ");

      const sessionId = await logTranscript({
        sessionId: body?.sessionId ?? null,
        visitorId: body?.visitorId ?? null,
        page,
        referrer: body?.referrer ?? "",
        userAgent: body?.userAgent ?? "",
        userMessage,
        assistantMessage: fallback,
        sources: [],
        model: "guard",
        usage: {}
      });

      return new Response(JSON.stringify({ reply: fallback, sessionId, sources: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: contextMessage },
      ...cleanedMessages
    ];

    const chatData = await completeChat(chatMessages);
    const reply = chatData?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("No reply returned.");
    }

    const sources = buildSources(contextMatches);
    const model = chatData?.model || chatDeployment;
    const usage = chatData?.usage || {};

    const sessionId = await logTranscript({
      sessionId: body?.sessionId ?? null,
      visitorId: body?.visitorId ?? null,
      page,
      referrer: body?.referrer ?? "",
      userAgent: body?.userAgent ?? "",
      userMessage: latestUserMessage.content,
      assistantMessage: reply,
      sources,
      model,
      usage
    });

    return new Response(JSON.stringify({ reply, sessionId, sources }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
