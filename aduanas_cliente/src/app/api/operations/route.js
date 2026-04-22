import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');

  if (!partnerId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  const config = {
    url: 'http://127.0.0.1:8069',
    db: 'aduanex_pro_v1',
    username: 'admin',
    password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
  };

  return new Promise((resolve) => {
    const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });
    
    // Autenticamos dinámicamente para obtener el UID real
    common.methodCall('authenticate', [config.db, config.username, config.password, {}], (error, uid) => {
      if (error || !uid) {
        console.error("Error de Auth en Operations:", error);
        return resolve(NextResponse.json({ error: 'Auth failed' }, { status: 500 }));
      }

      const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
      
      console.log(`Buscando leads para partner_id: ${partnerId}`);

      models.methodCall('execute_kw', [
        config.db, uid, config.password,
        'crm.lead', 
        'search_read',
        // Filtramos por partner_id (el ID del cliente)
        [[['partner_id', '=', parseInt(partnerId)]]], 
        { 
          // Usamos campos estándar de Odoo para asegurar que no falle por campos x_ inexistentes
          fields: ['name', 'stage_id', 'create_date', 'priority', 'display_name'],
          limit: 20
        }
      ], (err, docs) => {
        if (err) {
          console.error("Error en execute_kw:", err);
          return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        }
        
        console.log(`Operaciones encontradas: ${docs.length}`);
        resolve(NextResponse.json(docs));
      });
    });
  });
}