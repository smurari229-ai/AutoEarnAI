import { withSupabase } from "npm:@supabase/server@^1";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function env(name: string): string | null {
  const value = Deno.env.get(name);
  return value && value.trim() ? value.trim() : null;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const keyId = env("RAZORPAY_KEY_ID");
    const keySecret = env("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return json({
        error: "Razorpay provider is not configured. No payment order was created.",
        code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      }, 503);
    }

    let body: { amountMinor?: unknown; currency?: unknown; idempotencyKey?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body", code: "INVALID_JSON" }, 400);
    }

    const amountMinor = Number(body.amountMinor);
    const currency = String(body.currency ?? "INR").toUpperCase();
    const idempotencyKey = String(body.idempotencyKey ?? "").trim();
    const userId = String((ctx.userClaims as unknown as { sub?: string } | null)?.sub ?? "");

    if (!userId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || currency !== "INR") {
      return json({ error: "Invalid amount or currency", code: "INVALID_PAYMENT_ORDER" }, 400);
    }
    if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return json({ error: "Valid idempotency key is required", code: "INVALID_IDEMPOTENCY_KEY" }, 400);
    }

    const { data: existing, error: existingError } = await ctx.supabaseAdmin
      .from("payment_orders")
      .select("id,amount_minor,currency,status,provider,provider_order_id,provider_payment_id,idempotency_key,created_at")
      .eq("user_id", userId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingError) return json({ error: "Unable to check payment idempotency", code: "PAYMENT_IDEMPOTENCY_CHECK_FAILED" }, 500);
    if (existing) {
      if (Number(existing.amount_minor) !== amountMinor || existing.currency !== currency || existing.provider !== "razorpay") {
        return json({ error: "Idempotency key was already used for a different payment", code: "IDEMPOTENCY_KEY_REUSED" }, 409);
      }
      return json({ order: existing, reused: true }, 200);
    }

    const receipt = `ae_${userId.slice(0, 8)}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const basic = btoa(`${keyId}:${keySecret}`);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountMinor,
        currency,
        receipt,
        notes: { autoearn_user_id: userId, idempotency_key: idempotencyKey },
      }),
    });

    const razorpayBody = await razorpayResponse.json().catch(() => null) as Record<string, unknown> | null;
    if (!razorpayResponse.ok || typeof razorpayBody?.id !== "string") {
      return json({ error: "Payment provider order creation failed", code: "PAYMENT_PROVIDER_ORDER_FAILED" }, 502);
    }

    const { data: order, error: insertError } = await ctx.supabaseAdmin
      .from("payment_orders")
      .insert({
        user_id: userId,
        amount_minor: amountMinor,
        currency,
        status: "pending",
        provider: "razorpay",
        provider_order_id: razorpayBody.id,
        idempotency_key: idempotencyKey,
        metadata: { source: "supabase/functions/create-razorpay-order", receipt },
      })
      .select("id,amount_minor,currency,status,provider,provider_order_id,idempotency_key,created_at")
      .single();

    if (insertError || !order) {
      return json({
        error: "Provider order was created but could not be recorded safely. Do not retry with a new idempotency key; reconcile the provider order.",
        code: "PAYMENT_ORDER_RECORD_FAILED",
      }, 500);
    }

    return json({
      order,
      payment: { keyId, providerOrderId: razorpayBody.id },
      reused: false,
    }, 201);
  }),
};
