// Supabase Edge Function: daily-summary
// This function sends a daily summary of documents to the admin.
// Deploy with: supabase functions deploy daily-summary

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Fetch summary data for the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: docs, error } = await supabase
      .from('documents')
      .select('*, sites(name)')
      .gte('created_at', yesterday.toISOString())

    if (error) throw error

    const pending = docs.filter(d => d.status === 'PENDING').length
    const approved = docs.filter(d => d.status === 'APPROVED').length
    const rejected = docs.filter(d => d.status === 'REJECTED').length
    const totalAmount = docs.reduce((sum, d) => sum + Number(d.amount), 0)

    // 2. Prepare Email Content
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #1A1B1E;">SiteStream Daily Summary</h2>
        <p>Here is the activity summary for the last 24 hours:</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Pending Bills:</strong> ${pending}</li>
          <li><strong>Approved Bills:</strong> ${approved}</li>
          <li><strong>Rejected/Queried:</strong> ${rejected}</li>
          <li><strong>Total Value Submitted:</strong> ₹${totalAmount.toLocaleString('en-IN')}</li>
        </ul>
        <hr />
        <p style="font-size: 12px; color: #666;">This is an automated report from SiteStream DMS.</p>
      </div>
    `

    // 3. Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SiteStream <onboarding@resend.dev>",
        to: ["admin@example.com"], // Should be dynamic or configurable
        subject: `SiteStream Daily Digest: ${new Date().toLocaleDateString()}`,
        html: emailHtml,
      }),
    })

    const resData = await res.json()
    return new Response(JSON.stringify(resData), { headers: { "Content-Type": "application/json" } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
