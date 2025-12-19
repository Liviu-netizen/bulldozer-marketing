import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "liviu3667@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, record, table, schema } = payload;

    // Only proceed if it's an INSERT event
    if (type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Not an INSERT event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let subject = "";
    let htmlContent = "";

    if (table === "bookings") {
      subject = `New Booking Request: ${record.name}`;
      htmlContent = `
        <h2>New Booking Request</h2>
        <p><strong>Name:</strong> ${record.name}</p>
        <p><strong>Email:</strong> ${record.email}</p>
        <p><strong>Company URL:</strong> ${record.company_url || "N/A"}</p>
        <p><strong>Preferred Date:</strong> ${record.preferred_date || "N/A"}</p>
        <p><strong>Notes:</strong> ${record.notes || "N/A"}</p>
      `;
    } else if (table === "scorecards") {
      subject = `New Scorecard Request: ${record.name}`;
      htmlContent = `
        <h2>New Scorecard Request</h2>
        <p><strong>Name:</strong> ${record.name}</p>
        <p><strong>Email:</strong> ${record.email}</p>
        <p><strong>Company URL:</strong> ${record.company_url || "N/A"}</p>
        <p><strong>ARR Range:</strong> ${record.arr_range}</p>
        <p><strong>SaaS Motion:</strong> ${record.saas_motion}</p>
        <p><strong>Bottleneck:</strong> ${record.bottleneck}</p>
      `;
    } else {
      return new Response(JSON.stringify({ message: "Unknown table" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Bulldozer Notifications <onboarding@resend.dev>", // Use 'resend.dev' for testing if you don't have a domain yet
        to: [NOTIFY_EMAIL],
        subject: subject,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
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
