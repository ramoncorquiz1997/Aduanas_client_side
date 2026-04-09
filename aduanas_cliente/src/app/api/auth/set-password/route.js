import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const config = {
  url: 'http://127.0.0.1:8069',
  db: 'aduanex_pro_v1',
  username: 'admin',
  password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
};

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
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
          'res.partner', 'portal_set_password',
          [token, password], {},
        ], (err, result) => {
          if (err) return resolve(NextResponse.json({ error: 'Error del servidor' }, { status: 500 }));
          if (result?.error) return resolve(NextResponse.json({ error: result.error }, { status: 400 }));
          resolve(NextResponse.json(result));
        });
      });
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
