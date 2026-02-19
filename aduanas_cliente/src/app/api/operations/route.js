import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');

  if (!partnerId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  const config = {
    url: 'http://127.0.0.1:8069',
    db: 'odoo18',
    username: 'admin',
    password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
  };

  return new Promise((resolve) => {
    const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
    
    models.methodCall('execute_kw', [
      config.db, 2, config.password, // el '2' es el UID de admin, cámbialo si es distinto
      'crm.lead', // EJEMPLO: 'helpdesk.ticket' o 'x_operacion_aduanal'
      'search_read',
      [[['partner_id', '=', parseInt(partnerId)]]], 
      { fields: ['name', 'x_pedimento', 'x_estatus', 'x_vencimiento', 'display_name'] }
    ], (err, docs) => {
      if (err) return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      resolve(NextResponse.json(docs));
    });
  });
}