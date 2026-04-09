import { NextResponse } from 'next/server';

const ODOO_URL = 'http://127.0.0.1:8069';

/**
 * POST /api/auth/extract-csf
 * Body: { file_b64: string }   <- PDF del CSF codificado en base64
 *
 * Llama al controlador público de Odoo /portal/extract-csf (type=json)
 * y retorna los valores extraídos del QR del CSF (RFC, CURP, domicilio, etc.)
 */
export async function POST(request) {
  try {
    const { file_b64 } = await request.json();

    if (!file_b64) {
      return NextResponse.json({ error: 'No se recibió el archivo' }, { status: 400 });
    }

    // El controlador Odoo usa type='json' → espera formato JSON-RPC 2.0
    const odooResponse = await fetch(`${ODOO_URL}/portal/extract-csf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        id: 1,
        params: { file_b64 },
      }),
    });

    if (!odooResponse.ok) {
      console.error('Odoo extract-csf HTTP error:', odooResponse.status);
      return NextResponse.json({ error: 'Error al conectar con el servidor de extracción' }, { status: 502 });
    }

    const odooData = await odooResponse.json();

    if (odooData.error) {
      console.error('Odoo extract-csf RPC error:', JSON.stringify(odooData.error));
      return NextResponse.json({ error: 'El servidor no pudo procesar el CSF' }, { status: 422 });
    }

    const result = odooData.result;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    if (!result?.data || Object.keys(result.data).length === 0) {
      return NextResponse.json(
        { error: 'No se pudo leer el QR del CSF. Verifica que el PDF sea el original del SAT.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('extract-csf route error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
