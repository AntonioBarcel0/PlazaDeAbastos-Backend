/**
 * Migración: modelo de pedido mono-vendedor → multi-vendedor
 *
 * - Elimina las tablas OrderItems y Orders antiguas
 * - Deja que sequelize.sync() recree la estructura nueva
 *   (Order → SubOrder → OrderItem)
 *
 * Ejecutar una sola vez: node migrate-multivendor.js
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/database.js';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    const qi = sequelize.getQueryInterface();

    // 1) Eliminar tablas en orden (respetando FK)
    console.log('Eliminando tablas antiguas...');

    // Quitar FK de OrderItems.orderId si existe
    try {
      const fks = await qi.showConstraint('OrderItems');
      for (const fk of fks) {
        if (fk.constraintName && fk.constraintName.includes('orderId')) {
          await qi.removeConstraint('OrderItems', fk.constraintName);
          console.log(`  → Eliminada FK ${fk.constraintName}`);
        }
      }
    } catch { /* tabla no existe, ok */ }

    // Eliminar tablas
    for (const table of ['OrderItems', 'SubOrders', 'Orders']) {
      try {
        await qi.dropTable(table);
        console.log(`  → Tabla ${table} eliminada`);
      } catch {
        console.log(`  → Tabla ${table} no existía`);
      }
    }

    // 2) Importar modelos para que se registren las asociaciones
    await import('./server.js');

    console.log('\n✅ Migración completada. Las nuevas tablas se han creado.');
    console.log('   Order → SubOrder (1:N) → OrderItem (1:N)');

    // Dar tiempo a que sync termine y luego salir
    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    console.error('❌ Error en la migración:', err);
    process.exit(1);
  }
}

migrate();
