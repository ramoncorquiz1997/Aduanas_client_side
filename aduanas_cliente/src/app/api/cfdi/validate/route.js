import { NextResponse } from 'next/server';

function parseBackendBody(rawText) {
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    if (!payload?.uuid) {
      return NextResponse.json({ error: 'UUID requerido para validar CFDI' }, { status: 400 });
    }

    const upstream = process.env.CFDI_VALIDATE_URL;
    if (!upstream) {
      return NextResponse.json({
        status: 'pendiente',
        message: 'Validacion SAT no configurada en servidor (CFDI_VALIDATE_URL)',
      });
    }

    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await response.text();
    const data = parseBackendBody(rawText);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || data?.message || 'Error en validacion SAT' },
        { status: response.status },
      );
    }

    return NextResponse.json({
      status: data?.status || 'pendiente',
      message: data?.message || 'Validacion SAT enviada',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'Error interno validando CFDI' },
      { status: 500 },
    );
  }
}
