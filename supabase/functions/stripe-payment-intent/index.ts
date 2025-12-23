import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const planMap: Record<string, { amount: number; currency: string; description: string }> = {
  foundation: { amount: 120000, currency: "eur", description: "Foundation" },
  traction: { amount: 280000, currency: "eur", description: "Traction Engine" },
  launch: { amount: 550000, currency: "eur", description: "Bulldozer Launch System" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Stripe secret key missing." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    const payload = await req.json();
    const plan = typeof payload.plan === "string" ? payload.plan : "";
    const mapped = plan ? planMap[plan] : undefined;

    const amount = mapped ? mapped.amount : Number(payload.amount);
    const currency = (mapped ? mapped.currency : payload.currency || "usd").toLowerCase();
    const description = mapped ? mapped.description : payload.description || "Bulldozer payment";

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!mapped) {
      const allowed = new Set(Object.values(planMap).map((p) => `${p.amount}:${p.currency}`));
      if (!allowed.has(`${amount}:${currency}`)) {
        return new Response(JSON.stringify({ error: "Invalid amount." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    const body = new URLSearchParams();
    body.set("amount", String(amount));
    body.set("currency", currency);
    body.set("description", description);
    body.set("automatic_payment_methods[enabled]", "true");
    if (plan) body.set("metadata[plan]", plan);

    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const stripeData = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: stripeData.error?.message || "Stripe error." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ clientSecret: stripeData.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
