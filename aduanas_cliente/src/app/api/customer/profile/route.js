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
  const partnerId = Number(searchParams.get('partnerId'));

  if (!partnerId || isNaN(partnerId)) {
    return NextResponse.json({ error: 'partnerId inválido' }, { status: 400 });
  }

  return new Promise((resolve) => {
    const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

    common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authErr, uid) => {
      if (authErr || !uid) {
        return resolve(NextResponse.json({ error: 'Auth failed' }, { status: 500 }));
      }

      const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

      models.methodCall('execute_kw', [
        config.db, uid, config.password,
        'res.partner', 'read',
        [[partnerId]],
        {
          fields: [
            'name', 'vat', 'email', 'phone', 'mobile',
            'street', 'city', 'zip', 'state_id', 'country_id',
            'is_company', 'ref', 'comment',
          ],
        },
      ], (err, partners) => {
        if (err || !Array.isArray(partners) || partners.length === 0) {
          return resolve(NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 }));
        }
        resolve(NextResponse.json(partners[0]));
      });
    });
  });
}
