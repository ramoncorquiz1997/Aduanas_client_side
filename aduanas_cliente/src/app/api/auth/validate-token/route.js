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
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
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
        'res.partner', 'portal_validate_token',
        [token], {},
      ], (err, result) => {
        if (err) return resolve(NextResponse.json({ error: 'Error validando token' }, { status: 500 }));
        if (result?.error) return resolve(NextResponse.json({ error: result.error }, { status: 400 }));
        resolve(NextResponse.json(result));
      });
    });
  });
}
