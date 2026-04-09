import { NextResponse } from 'next/server';

const ODOO_URL = 'http://127.0.0.1:8069';

/**
 * POST /api/auth/extract-csf
 * Body: { file_b64: string }   <- PDF del CSF codificado en base64
 *
 * Llama al endpoint de Odoo /portal/extract-csf y retorna los valores
 * extraídos del QR del CSF (RFC, CURP, domicilio, etc.)
 */
export async function POST(request) {
  try {
    const { file_b64 } = await request.json();

    if (!file_b64) {
      return NextResponse.json({ error: 'No se recibió el archivo' }, { status: 400 });
    }

    // Llamar al endpoint JSON-RPC de Odoo
    const odooResponse = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        id: 1,
        params: {
          model: 'res.partner',
          method: '_extract_csf_values',
          args: [file_b64],
          kwargs: {},
        },
      }),
    });

    if (!odooResponse.ok) {
      return NextResponse.json({ error: 'Error al conectar con el servidor de extracción' }, { status: 502 });
    }

    const odooData = await odooResponse.json();

    if (odooData.error) {
      console.error('Odoo extract-csf error:', odooData.error);
      return NextResponse.json({ error: 'El servidor no pudo procesar el CSF' }, { status: 422 });
    }

    const extracted = odooData.result;

    if (!extracted || Object.keys(extracted).length === 0) {
      return NextResponse.json(
        { error: 'No se pudo leer el QR del CSF. Verifica que el PDF sea el original del SAT.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: extracted });
  } catch (err) {
    console.error('extract-csf route error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
