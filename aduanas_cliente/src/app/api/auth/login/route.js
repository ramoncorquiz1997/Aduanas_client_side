import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function POST(request) {
  try {
    const { rfc, password } = await request.json();

    // Configuración corregida para entornos Linux/Server
    const config = {
      url: 'http://127.0.0.1:8069', 
      db: 'odoo18',
      username: 'admin',
      password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
    };

    return new Promise((resolve) => {
      // Usamos el endpoint /xmlrpc/2/common para autenticar
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
      
      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (error, uid) => {
        if (error) {
          console.error('Error de conexión Odoo (Common):', error);
          return resolve(NextResponse.json({ error: 'Error de conexión con Odoo' }, { status: 500 }));
        }

        if (!uid || typeof uid !== 'number') {
          console.error('Fallo de autenticación: UID no recibido. Revisa credenciales de ADMIN.');
          return resolve(NextResponse.json({ error: 'Error de autenticación API' }, { status: 401 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
        
        // Buscar el contacto por RFC (vat)
        models.methodCall('execute_kw', [
          config.db, uid, config.password,
          'res.partner', 'search_read',
          [[['vat', '=', rfc]]],
          { fields: ['name', 'vat', 'email', 'id'], limit: 1 }
        ], (err, partners) => {
          if (err) {
            console.error('Error al consultar partners:', err);
            return resolve(NextResponse.json({ error: 'Error en base de datos' }, { status: 500 }));
          }

          if (!partners || partners.length === 0) {
            return resolve(NextResponse.json({ error: 'RFC no registrado' }, { status: 401 }));
          }

          const user = partners[0];
          
          // Validación: Primeros 4 caracteres del RFC (asegurando que exista vat)
          const userVat = user.vat || "";
          const validPassword = userVat.substring(0, 4);

          if (password === validPassword && userVat !== "") {
            return resolve(NextResponse.json({ 
              success: true, 
              user: { id: user.id, name: user.name } 
            }));
          } else {
            return resolve(NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 }));
          }
        });
      });
    });
  } catch (globalError) {
    console.error('Error crítico en API Login:', globalError);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}