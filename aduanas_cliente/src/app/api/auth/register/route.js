import { NextResponse } from 'next/server';

const ODOO_URL = 'http://127.0.0.1:8069';

/**
 * POST /api/auth/register
 * Body: { name, email, phone, password, rfc, csf_b64, csf_filename }
 *
 * Llama al controlador público de Odoo /portal/register (type=json)
 * para crear el res.partner con estado "pending".
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, rfc, csf_b64, csf_filename } = body;

    if (!name || !email || !phone || !password || !rfc || !csf_b64) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El correo electrónico no es válido' }, { status: 400 });
    }

    // El controlador Odoo usa type='json' → espera formato JSON-RPC 2.0
    const odooResponse = await fetch(`${ODOO_URL}/portal/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        id: 1,
        params: {
          name,
          email,
          phone,
          password,
          rfc,
          csf_b64,
          csf_filename: csf_filename || 'csf.pdf',
        },
      }),
    });

    if (!odooResponse.ok) {
      console.error('Odoo register HTTP error:', odooResponse.status);
      return NextResponse.json({ error: 'Error al conectar con el servidor' }, { status: 502 });
    }

    const odooData = await odooResponse.json();

    if (odooData.error) {
      console.error('Odoo register RPC error:', JSON.stringify(odooData.error));
      return NextResponse.json({ error: 'Error en el servidor al registrar' }, { status: 500 });
    }

    const result = odooData.result;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: result?.message });
  } catch (err) {
    console.error('register route error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
