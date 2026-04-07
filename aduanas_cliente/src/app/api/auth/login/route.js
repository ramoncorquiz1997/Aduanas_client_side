import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(request) {
  try {
    const { rfc, password } = await request.json();

    const config = {
      url: 'http://127.0.0.1:8069', 
      db: 'aduanex_pro_v1',
      username: 'admin', // Asegúrate que este usuario tenga permisos sobre res.partner
      password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
    };

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
      
      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (error, uid) => {
        if (error || !uid || typeof uid !== 'number') {
          console.error('Error Auth Odoo:', error || 'UID Inválido');
          return resolve(NextResponse.json({ error: 'Fallo de autenticación sistema' }, { status: 401 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
        
        models.methodCall('execute_kw', [
          config.db, uid, config.password,
          'res.partner', 'search_read',
          [[['vat', '=', rfc]]],
          { fields: ['name', 'vat', 'email', 'id'], limit: 1 }
        ], (err, partners) => {
          if (err || !partners || partners.length === 0) {
            return resolve(NextResponse.json({ error: 'RFC no encontrado' }, { status: 401 }));
          }

          const user = partners[0];
          const userVat = user.vat || "";
          const validPassword = userVat.substring(0, 4).toUpperCase();

          if (password.toUpperCase() === validPassword && userVat !== "") {
            // DEVOLVEMOS EL ID PARA EL DASHBOARD
            return resolve(NextResponse.json({ 
              success: true, 
              user: { id: user.id, name: user.name, rfc: user.vat } 
            }));
          } else {
            return resolve(NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 }));
          }
        });
      });
    });
  } catch (globalError) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}