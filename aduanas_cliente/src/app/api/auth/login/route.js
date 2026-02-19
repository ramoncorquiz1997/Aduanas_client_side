import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(request) {
  const { rfc, password } = await request.json();

  // Configuración de Odoo (Ajústalo a tu server)
  const config = {
    url: 'http://localhost:8069', // O el dominio interno de tu DB
    db: 'odoo18',
    username: 'ADMIN',
    password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
  };

  return new Promise((resolve) => {
    const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
    
    // 1. Autenticar como admin para buscar
    common.methodCall('authenticate', [config.db, config.username, config.password, {}], (error, uid) => {
      if (error || !uid) return resolve(NextResponse.json({ error: 'Error de conexión' }, { status: 500 }));

      const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
      
      // 2. Buscar contacto por RFC (en Odoo suele ser el campo 'vat')
      models.methodCall('execute_kw', [
        config.db, uid, config.password,
        'res.partner', 'search_read',
        [[['vat', '=', rfc]]],
        { fields: ['name', 'vat', 'email', 'id'], limit: 1 }
      ], (err, partners) => {
        if (err || partners.length === 0) {
          return resolve(NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 }));
        }

        const user = partners[0];
        // Lógica temporal: Contraseña = primeros 4 del RFC
        const validPassword = user.vat.substring(0, 4);

        if (password === validPassword) {
          // Aquí podrías generar un JWT o Set-Cookie más adelante
          return resolve(NextResponse.json({ 
            success: true, 
            user: { id: user.id, name: user.name } 
          }));
        } else {
          return resolve(NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 }));
        }
      });
    });
  });
}