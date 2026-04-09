import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const config = {
  url: 'http://127.0.0.1:8069',
  db: 'aduanex_pro_v1',
  username: 'admin',
  password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ffPartnerId = parseInt(searchParams.get('ffPartnerId'), 10);

  if (!ffPartnerId) {
    return NextResponse.json({ error: 'ffPartnerId requerido' }, { status: 400 });
  }

  return new Promise((resolve) => {
    const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
    common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authErr, uid) => {
      if (authErr || !uid) {
        return resolve(NextResponse.json({ error: 'Error del servidor' }, { status: 500 }));
      }
      const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
      models.methodCall('execute_kw', [
        config.db, uid, config.password,
        'res.partner', 'portal_get_ff_clients',
        [ffPartnerId], {},
      ], (err, result) => {
        if (err) return resolve(NextResponse.json({ error: 'Error obteniendo clientes' }, { status: 500 }));
        if (result?.error) return resolve(NextResponse.json({ error: result.error }, { status: 400 }));
        resolve(NextResponse.json(result));
      });
    });
  });
}
