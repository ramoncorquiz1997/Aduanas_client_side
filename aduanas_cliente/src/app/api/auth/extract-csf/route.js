import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const config = {
  url: 'http://127.0.0.1:8069',
  db: 'aduanex_pro_v1',
  username: 'admin',
  password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
};

/**
 * POST /api/auth/extract-csf
 * Body: { file_b64: string }
 *
 * Llama a res.partner.portal_extract_csf() vía XML-RPC para extraer
 * el RFC y datos fiscales del QR del CSF.
 */
export async function POST(request) {
  try {
    const { file_b64 } = await request.json();

    if (!file_b64) {
      return NextResponse.json({ error: 'No se recibió el archivo' }, { status: 400 });
    }

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authErr, uid) => {
        if (authErr || !uid || typeof uid !== 'number') {
          console.error('extract-csf auth error:', authErr);
          return resolve(NextResponse.json({ error: 'Error de autenticación con el servidor' }, { status: 500 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

        models.methodCall('execute_kw', [
          config.db, uid, config.password,
          'res.partner', 'portal_extract_csf',
          [file_b64],
          {},
        ], (err, result) => {
          if (err) {
            console.error('extract-csf xmlrpc error:', err.message || err);
            return resolve(NextResponse.json({ error: 'Error procesando el CSF en el servidor' }, { status: 500 }));
          }

          if (!result || Object.keys(result).length === 0) {
            return resolve(NextResponse.json(
              { error: 'No se pudo leer el QR del CSF. Verifica que sea el PDF original del SAT.' },
              { status: 422 }
            ));
          }

          resolve(NextResponse.json({ success: true, data: result }));
        });
      });
    });
  } catch (err) {
    console.error('extract-csf route error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
