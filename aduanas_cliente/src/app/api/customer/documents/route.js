import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const partnerIdRaw = searchParams.get('partnerId');
  const partnerId = Number(partnerIdRaw);

  if (!partnerId || Number.isNaN(partnerId)) {
    return NextResponse.json({ error: 'partnerId invalido' }, { status: 400 });
  }

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
        'read',
        [[partnerId]],
        { fields: ['x_csf_file', 'x_csf_filename'] },
      ], (readError, partners) => {
        if (readError || !Array.isArray(partners) || partners.length === 0) {
          return resolve(NextResponse.json({ error: 'No se pudo leer documentos del cliente' }, { status: 500 }));
        }

        const partner = partners[0];
        const hasCsf = Boolean(partner.x_csf_file);
        const csfFileName = partner.x_csf_filename || '';

        return resolve(NextResponse.json({
          documents: [
            {
              key: 'csf',
              label: 'CSF',
              status: hasCsf ? 'cargado' : 'pendiente_faltante',
              filename: hasCsf ? (csfFileName || 'Archivo sin nombre') : '',
            },
          ],
        }));
      });
    });
  });
}
