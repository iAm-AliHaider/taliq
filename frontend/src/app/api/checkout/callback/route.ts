import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (!id) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const moyasarSecretKey = process.env.MOYASAR_SECRET_API_KEY;

    if (!moyasarSecretKey) {
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 });
    }

    const verifyResponse = await fetch(`https://api.moyasar.com/v1/payments/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(moyasarSecretKey + ":").toString("base64")}`,
      },
    });

    const paymentData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error("Moyasar verify error:", paymentData);
      return NextResponse.redirect(
        new URL(`/checkout?error=${encodeURIComponent(paymentData.message || "Payment verification failed")}`, request.url)
      );
    }

    const subscriptionStatus = paymentData.status === "paid" ? "active" : "failed";

    await sql`CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      moyasar_payment_id TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL,
      email TEXT NOT NULL,
      company_name TEXT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    const metadata = paymentData.metadata || {};
    const email = metadata.email || "";
    const companyName = metadata.company_name || "";
    const plan = metadata.plan || "starter";

    await sql`
      INSERT INTO subscriptions (
        moyasar_payment_id,
        plan,
        email,
        company_name,
        amount,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${plan},
        ${email},
        ${companyName},
        ${paymentData.amount / 100},
        ${subscriptionStatus},
        NOW(),
        NOW()
      )
      ON CONFLICT (moyasar_payment_id)
      DO UPDATE SET
        status = ${subscriptionStatus},
        updated_at = NOW()
    `;

    if (paymentData.status === "paid") {
      return NextResponse.redirect(new URL(`/checkout?success=true&plan=${paymentData.metadata?.plan || "starter"}`, request.url));
    } else {
      return NextResponse.redirect(
        new URL(`/checkout?error=${encodeURIComponent(message || "Payment failed")}`, request.url)
      );
    }
  } catch (e: any) {
    console.error("Checkout callback error:", e);
    return NextResponse.redirect(new URL("/checkout?error=Internal+server+error", request.url));
  }
}
