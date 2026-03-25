import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const PLANS = {
  starter: { price: 299, name: "Starter", maxEmployees: 50 },
  growth: { price: 799, name: "Growth", maxEmployees: 200 },
};

export async function POST(request: NextRequest) {
  try {
    const { plan, email, companyName } = await request.json();

    if (!plan || !email || !companyName) {
      return NextResponse.json(
        { error: "Plan, email, and company name are required" },
        { status: 400 }
      );
    }

    if (!PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'starter' or 'growth'" },
        { status: 400 }
      );
    }

    const planData = PLANS[plan as keyof typeof PLANS];
    const amount = planData.price * 100;

    const moyasarSecretKey = process.env.MOYASAR_SECRET_API_KEY;

    if (!moyasarSecretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    const moyasarResponse = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(moyasarSecretKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        amount,
        currency: "SAR",
        description: `${planData.name} Plan - ${planData.maxEmployees} employees`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://taliq.middlemind.ai"}/api/checkout/callback`,
        source: {
          type: "creditcard",
        },
        metadata: {
          plan,
          email,
          companyName,
        },
      }),
    });

    const moyasarData = await moyasarResponse.json();

    if (!moyasarResponse.ok) {
      console.error("Moyasar error:", moyasarData);
      return NextResponse.json(
        { error: moyasarData.message || "Failed to create payment session" },
        { status: 500 }
      );
    }

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

    await sql`
      INSERT INTO subscriptions (
        moyasar_payment_id,
        plan,
        email,
        company_name,
        amount,
        status,
        created_at
      ) VALUES (
        ${moyasarData.id},
        ${plan},
        ${email},
        ${companyName},
        ${planData.price},
        ${moyasarData.status},
        NOW()
      )
    `;

    return NextResponse.json({
      sessionId: moyasarData.id,
      status: moyasarData.status,
    });
  } catch (e: any) {
    console.error("Checkout create error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
