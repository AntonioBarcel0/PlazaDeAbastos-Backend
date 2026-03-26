import dotenv from 'dotenv';
import sequelize from './config/database.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import OrderItem from './models/OrderItem.js';

dotenv.config();

// Relaciones necesarias para que Sequelize no rompa al sincronizar
User.hasMany(Product, { foreignKey: 'vendedorId', as: 'productos' });
Product.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });
User.hasMany(Order, { foreignKey: 'clienteId', as: 'pedidosCliente' });
User.hasMany(Order, { foreignKey: 'vendedorId', as: 'pedidosVendedor' });
Order.belongsTo(User, { foreignKey: 'clienteId', as: 'cliente' });
Order.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'pedido' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'producto' });

const puestos = [
  {
    nombre: 'Alonso',
    apellidos: 'Moreno Manjón',
    email: 'alonso.moreno@plazaabastos.es',
    especialidad: 'Jardinería',
  },
  {
    nombre: 'Antonio',
    apellidos: 'Martos Muro',
    email: 'antonio.martos@plazaabastos.es',
    especialidad: 'Pescadería, mariscos',
  },
  {
    nombre: 'Bartolomé',
    apellidos: 'Moyano Hurtado',
    email: 'bartolome.moyano@plazaabastos.es',
    especialidad: 'Especias',
  },
  {
    nombre: 'Diego',
    apellidos: 'Sierra Orcera',
    email: 'diego.sierra@plazaabastos.es',
    especialidad: 'Pescadería, mariscos',
  },
  {
    nombre: 'Dolores',
    apellidos: 'Muñoz Guerrero',
    email: 'dolores.munoz@plazaabastos.es',
    especialidad: 'Panadería',
  },
  {
    nombre: 'Felicia',
    apellidos: 'García Gómez',
    email: 'felicia.garcia@plazaabastos.es',
    especialidad: 'Charcutería, comestibles',
  },
  {
    nombre: 'Francisco',
    apellidos: 'Padilla Quesada',
    email: 'francisco.padilla@plazaabastos.es',
    especialidad: 'Frutas',
  },
  {
    nombre: 'Gabriel',
    apellidos: 'Martínez Cartas',
    email: 'gabriel.martinez@plazaabastos.es',
    especialidad: 'Carnicería',
  },
  {
    nombre: 'Gaspar',
    apellidos: 'Molina Muñoz',
    email: 'gaspar.molina@plazaabastos.es',
    especialidad: 'Frutas',
  },
  {
    nombre: 'Ginés',
    apellidos: 'Juan Cortés',
    email: 'gines.juan@plazaabastos.es',
    especialidad: 'Frutas',
  },
  {
    nombre: 'Isabel',
    apellidos: 'Mendoza Suárez',
    email: 'isabel.mendoza@plazaabastos.es',
    especialidad: 'Charcutería, comestibles',
  },
  {
    nombre: 'Jerónimo',
    apellidos: 'Ruíz Martos',
    email: 'jeronimo.ruiz.martos@plazaabastos.es',
    especialidad: 'Pescadería, mariscos',
  },
  {
    nombre: 'Jerónimo',
    apellidos: 'Ruíz Pascual',
    email: 'jeronimo.ruiz.pascual@plazaabastos.es',
    especialidad: 'Pescadería, mariscos',
  },
  {
    nombre: 'Juan Antonio',
    apellidos: 'Millán Herrador',
    email: 'juanantonio.millan@plazaabastos.es',
    especialidad: 'Carnes',
  },
  {
    nombre: 'Juan',
    apellidos: 'Jurado Ruíz',
    email: 'juan.jurado@plazaabastos.es',
    especialidad: 'Frutas',
  },
  {
    nombre: 'María del Mar',
    apellidos: 'Molina Higueras',
    email: 'mardelmar.molina@plazaabastos.es',
    especialidad: 'Panadería',
  },
  {
    nombre: 'Manuel',
    apellidos: 'Domínguez Sevilla',
    email: 'manuel.dominguez@plazaabastos.es',
    especialidad: 'Carnes',
  },
  {
    nombre: 'María del Mar',
    apellidos: 'Madrid Valera',
    email: 'mardelmar.madrid@plazaabastos.es',
    especialidad: 'Carnes',
  },
  {
    nombre: 'María Dolores',
    apellidos: 'Ruíz Pascual',
    email: 'mariadolores.ruiz@plazaabastos.es',
    especialidad: 'Comestibles',
  },
  {
    nombre: 'María Josefa',
    apellidos: 'Molina Hipólito',
    email: 'mariajosefa.molina@plazaabastos.es',
    especialidad: 'Comestibles',
  },
  {
    nombre: 'Rosa María',
    apellidos: 'Rodríguez Rodríguez',
    email: 'rosamaria.rodriguez@plazaabastos.es',
    especialidad: 'Comestibles, quesos',
  },
  {
    nombre: 'Rosendo',
    apellidos: 'López Alaminos',
    email: 'rosendo.lopez@plazaabastos.es',
    especialidad: 'Frutas',
  },
  {
    nombre: 'Salvador',
    apellidos: 'Molina Barbero',
    email: 'salvador.molina@plazaabastos.es',
    especialidad: 'Frutas',
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas\n');

    let creados = 0;
    let existentes = 0;

    for (const puesto of puestos) {
      const [, created] = await User.findOrCreate({
        where: { email: puesto.email },
        defaults: {
          ...puesto,
          password: 'plaza2024',
          role: 'comerciante',
        },
      });

      const nombreCompleto = `${puesto.nombre} ${puesto.apellidos}`;
      if (created) {
        console.log(`✅ Creado: ${nombreCompleto} (${puesto.especialidad})`);
        creados++;
      } else {
        console.log(`⚠️  Ya existe: ${nombreCompleto}`);
        existentes++;
      }
    }

    console.log(`\n📊 Resultado: ${creados} creados, ${existentes} ya existían`);
    await sequelize.close();
    console.log('✅ Seed completado');
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
