import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM letter_templates WHERE is_active = TRUE ORDER BY name`;
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, body_html, body_html_ar, header, footer } = body;
    if (!type) return NextResponse.json({ error: "Template type required" }, { status: 400 });

    await sql`UPDATE letter_templates SET
      name = COALESCE(${name || null}, name),
      body_html = COALESCE(${body_html || null}, body_html),
      body_html_ar = COALESCE(${body_html_ar || null}, body_html_ar),
      header = COALESCE(${header ? JSON.stringify(header) : null}::jsonb, header),
      footer = COALESCE(${footer ? JSON.stringify(footer) : null}::jsonb, footer),
      updated_at = NOW(),
      updated_by = 'admin'
      WHERE type = ${type}`;

    const [updated] = await sql`SELECT * FROM letter_templates WHERE type = ${type}`;
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, name, body_html, variables, header, footer } = await request.json();
    if (!type || !name || !body_html) {
      return NextResponse.json({ error: "type, name, and body_html required" }, { status: 400 });
    }
    await sql`INSERT INTO letter_templates (type, name, body_html, variables, header, footer)
      VALUES (${type}, ${name}, ${body_html}, ${variables || []}, ${JSON.stringify(header || {})}::jsonb, ${JSON.stringify(footer || {})}::jsonb)`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
