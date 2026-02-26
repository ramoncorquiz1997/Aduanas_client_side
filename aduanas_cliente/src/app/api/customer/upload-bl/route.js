import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const partnerIdRaw = formData.get('partnerId');
    const file = formData.get('file');

    const partnerId = Number(partnerIdRaw);
    if (!partnerId || Number.isNaN(partnerId)) {
      return NextResponse.json({ error: 'partnerId invalido' }, { status: 400 });
    }

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Archivo BL requerido' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: 'Archivo vacio' }, { status: 400 });
    }

    const fileBase64 = buffer.toString('base64');

    const config = {
      url: 'http://127.0.0.1:8069',
      db: 'odoo18',
      username: 'admin',
      password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
    };

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authError, uid) => {
        if (authError || !uid) {
          return resolve(NextResponse.json({ error: 'Auth failed' }, { status: 500 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
        models.methodCall('execute_kw', [
          config.db,
          uid,
          config.password,
          'res.partner',
          'write',
          [[partnerId], { x_csf_file: fileBase64 }],
        ], (writeError, writeOk) => {
          if (writeError || !writeOk) {
            return resolve(NextResponse.json({ error: 'No se pudo guardar el BL en Odoo' }, { status: 500 }));
          }

          return resolve(NextResponse.json({ success: true }));
        });
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
