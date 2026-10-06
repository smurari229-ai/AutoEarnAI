import { withSupabase } from "npm:@supabase/server@^1";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function env(name: string): string | null {
  const value = Deno.env.get(name);
  return value && value.trim() ? value.trim() : null;
}

async function hmacHex(secret: string, raw: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, raw);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const webhookSecret = env("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return json({ error: "Webhook provider secret is not configured", code: "WEBHOOK_NOT_CONFIGURED" }, 503);
    }

    const signature = req.headers.get("x-razorpay-signature")?.trim() ?? "";
    const eventId = req.headers.get("x-razorpay-event-id")?.trim() ?? "";
    if (!signature || !eventId) {
      return json({ error: "Webhook signature and event id are required", code: "WEBHOOK_AUTH_REQUIRED" }, 401);
    }

    const raw = new Uint8Array(await req.arrayBuffer());
    const expected = await hmacHex(webhookSecret, raw);
    if (!safeEqual(expected, signature)) {
      return json({ error: "Invalid webhook signature", code: "WEBHOOK_SIGNATURE_INVALID" }, 401);
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      return json({ error: "Invalid webhook JSON", code: "WEBHOOK_INVALID_JSON" }, 400);
    }

    const eventType = typeof payload.event === "string" ? payload.event : "";
    const eventEntity = payload?.payload?.payment?.entity;
    if (!eventType || !eventEntity || typeof eventEntity !== "object") {
      return json({ error: "Unsupported webhook payload", code: "WEBHOOK_PAYLOAD_UNSUPPORTED" }, 400);
    }

    const { data: eventRecord, error: eventError } = await ctx.supabaseAdmin.rpc("record_webhook_event", {
      p_provider: "razorpay",
      p_event_id: eventId,
      p_event_type: eventType,
      p_signature_valid: true,
      p_payload: payload,
    });
    if (eventError) return json({ error: "Webhook event persistence failed", code: "WEBHOOK_EVENT_RECORD_FAILED" }, 500);

    if (eventRecord?.duplicate === true) return json({ received: true, duplicate: true }, 200);

    const orderId = typeof eventEntity.order_id === "string" ? eventEntity.order_id : "";
    const paymentId = typeof eventEntity.id === "string" ? eventEntity.id : "";
    const amountMinor = Number(eventEntity.amount);
    const currency = String(eventEntity.currency ?? "").toUpperCase();

    if (!orderId || !paymentId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || currency !== "INR") {
      return json({ error: "Webhook payment entity is invalid", code: "WEBHOOK_PAYMENT_INVALID" }, 400);
    }

    const { data: paymentOrder, error: orderError } = await ctx.supabaseAdmin
      .from("payment_orders")
      .select("id,user_id,amount_minor,currency,status,provider,provider_order_id,provider_payment_id,idempotency_key")
      .eq("provider", "razorpay")
      .eq("provider_order_id", orderId)
      .maybeSingle();

    if (orderError) return json({ error: "Payment order lookup failed", code: "PAYMENT_ORDER_LOOKUP_FAILED" }, 500);
    if (!paymentOrder) return json({ error: "Unknown provider order", code: "UNKNOWN_PROVIDER_ORDER" }, 404);
    if (Number(paymentOrder.amount_minor) !== amountMinor || paymentOrder.currency !== currency) {
      return json({ error: "Provider amount/currency mismatch", code: "PAYMENT_AMOUNT_MISMATCH" }, 409);
    }

    if (eventType === "payment.captured") {
      if (paymentOrder.status === "paid") return json({ received: true, alreadyPaid: true }, 200);

      const { data: credit, error: creditError } = await ctx.supabaseAdmin.rpc("wallet_credit", {
        p_user_id: paymentOrder.user_id,
        p_amount_minor: amountMinor,
        p_currency: currency,
        p_provider: "razorpay",
        p_provider_reference: paymentId,
        p_idempotency_key: `razorpay:payment:${paymentId}`,
        p_metadata: { payment_order_id: paymentOrder.id, provider_order_id: orderId, event_id: eventId },
      });
      if (creditError) return json({ error: "Wallet settlement failed", code: "WALLET_SETTLEMENT_FAILED" }, 500);

      const { error: updateError } = await ctx.supabaseAdmin
        .from("payment_orders")
        .update({
          status: "paid",
          provider_payment_id: paymentId,
          paid_at: new Date().toISOString(),
          metadata: { settled_by: "razorpay-webhook", event_id: eventId },
        })
        .eq("id", paymentOrder.id)
        .eq("status", "pending");

      if (updateError) return json({ error: "Payment state update failed after settlement", code: "PAYMENT_STATE_UPDATE_FAILED" }, 500);

      return json({ received: true, settled: true, transaction: credit }, 200);
    }

    if (eventType === "payment.failed") {
      await ctx.supabaseAdmin
        .from("payment_orders")
        .update({ status: "failed", provider_payment_id: paymentId })
        .eq("id", paymentOrder.id)
        .in("status", ["pending", "processing"]);

      return json({ received: true, settled: false, status: "failed" }, 200);
    }

    return json({ received: true, processed: false, event: eventType }, 200);
  }),
};
