import sequelize from './config/database.js';
import { DataTypes } from 'sequelize';

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unidad: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'kg' },
  categoria: { type: DataTypes.STRING(100), allowNull: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  imagen: { type: DataTypes.STRING(500), allowNull: true },
  disponible: { type: DataTypes.BOOLEAN, defaultValue: true },
  vendedorId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: true, tableName: 'Products' });

// IDs de vendedores reales
const V = {
  juanFrutas:      '34d59fe5-c14e-493c-9059-0e69520d2748', // Juan Jurado Ruíz
  salvadorFrutas:  '819ce9c1-ce5a-448e-8362-598fbbcc6fe3', // Salvador Molina Barbero
  rosendoFrutas:   'a9f57f59-bbd3-43dd-8bba-2c92bbc1286e', // Rosendo López Alaminos
  franciscoFrutas: 'bfa9c04f-c6c4-4803-99a0-faace7612128', // Francisco Padilla Quesada
  ginesFrutas:     'c1070484-ff1d-4a8b-8bf4-85e4bb9bb439', // Ginés Juan Cortés
  gasparFrutas:    'dd1991e7-ae8a-4b7d-8bda-e56f2c3084f9', // Gaspar Molina Muñoz
  gabriel:         '12416d4a-961f-47d6-aaa0-316488afe60a', // Gabriel Martínez - Carnicería
  jeronimo:        '0ba98505-4f35-4152-8ff1-442e57b4bcc5', // Jerónimo Ruíz - Pescadería
  felicia:         '128c014c-7cda-4924-8716-04c6dc4190a6', // Felicia García - Charcutería
  dolores:         'f82d133b-e9c3-4264-8acc-2682a368bd0f', // Dolores Muñoz - Panadería
  bartolome:       'ce8544ae-f625-4b5e-866c-e2d9aee24c10', // Bartolomé Moyano - Especias
  isabel:          'f9cf88a3-8892-423a-9c65-c143c9012fc2', // Isabel Mendoza - Charcutería
  manuelCarnes:    '56567ea1-e06f-4f55-b5f5-464b13977b11', // Manuel Domínguez - Carnes
};

const productos = [
  // ── Juan Jurado Ruíz · Frutas ──────────────────────────────
  { nombre: 'Fresas de Huelva', descripcion: 'Fresas frescas llegadas cada mañana de Huelva. Dulces y aromáticas.', precio: 2.50, unidad: 'kg', categoria: 'Frutas', stock: 30, vendedorId: V.juanFrutas },
  { nombre: 'Naranjas de Valencia', descripcion: 'Naranjas de zumo de la huerta valenciana. Ideales para el desayuno.', precio: 1.20, unidad: 'kg', categoria: 'Frutas', stock: 50, vendedorId: V.juanFrutas },
  { nombre: 'Mandarinas Clementinas', descripcion: 'Mandarinas sin pepitas, fáciles de pelar.', precio: 1.80, unidad: 'kg', categoria: 'Frutas', stock: 40, vendedorId: V.juanFrutas },
  { nombre: 'Plátanos de Canarias', descripcion: 'Plátanos maduros de Canarias con IGP.', precio: 2.10, unidad: 'kg', categoria: 'Frutas', stock: 35, vendedorId: V.juanFrutas },
  { nombre: 'Cerezas del Jerte', descripcion: 'Cerezas de la comarca del Jerte, temporada de primavera.', precio: 5.90, unidad: 'kg', categoria: 'Frutas', stock: 15, vendedorId: V.juanFrutas },

  // ── Salvador Molina Barbero · Frutas ───────────────────────
  { nombre: 'Tomates Rama', descripcion: 'Tomates en rama de la vega granadina. Para ensaladas o cocinar.', precio: 1.90, unidad: 'kg', categoria: 'Verduras', stock: 60, vendedorId: V.salvadorFrutas },
  { nombre: 'Pimientos Rojos', descripcion: 'Pimientos rojos carnosos, perfectos para asar.', precio: 2.20, unidad: 'kg', categoria: 'Verduras', stock: 25, vendedorId: V.salvadorFrutas },
  { nombre: 'Melón Piel de Sapo', descripcion: 'Melón dulce y jugoso de la Mancha.', precio: 0.90, unidad: 'kg', categoria: 'Frutas', stock: 20, vendedorId: V.salvadorFrutas },
  { nombre: 'Sandía sin pepitas', descripcion: 'Sandía seedless, refrescante para el verano.', precio: 0.60, unidad: 'kg', categoria: 'Frutas', stock: 18, vendedorId: V.salvadorFrutas },
  { nombre: 'Guisantes frescos', descripcion: 'Guisantes tiernos recién vainados. Producto de temporada.', precio: 3.40, unidad: 'kg', categoria: 'Verduras', stock: 12, vendedorId: V.salvadorFrutas },

  // ── Rosendo López Alaminos · Frutas ───────────────────────
  { nombre: 'Espárragos trigueros', descripcion: 'Espárragos trigueros de la campiña andaluza. Temporada de primavera.', precio: 4.50, unidad: 'kg', categoria: 'Verduras', stock: 10, vendedorId: V.rosendoFrutas },
  { nombre: 'Habas frescas', descripcion: 'Habas tiernas con vaina. Recogidas esta mañana.', precio: 1.80, unidad: 'kg', categoria: 'Verduras', stock: 20, vendedorId: V.rosendoFrutas },
  { nombre: 'Alcachofas', descripcion: 'Alcachofas de Benicarló, carnosas y sin pelusa.', precio: 3.20, unidad: 'kg', categoria: 'Verduras', stock: 15, vendedorId: V.rosendoFrutas },
  { nombre: 'Limones de Murcia', descripcion: 'Limones naturales de la huerta murciana.', precio: 1.50, unidad: 'kg', categoria: 'Frutas', stock: 30, vendedorId: V.rosendoFrutas },
  { nombre: 'Fresones ecológicos', descripcion: 'Fresones cultivados sin pesticidas en finca local.', precio: 3.80, unidad: 'kg', categoria: 'Frutas', stock: 8, vendedorId: V.rosendoFrutas },

  // ── Francisco Padilla Quesada · Frutas ────────────────────
  { nombre: 'Uvas Moscatel', descripcion: 'Uvas blancas Moscatel de Málaga, dulces y aromáticas.', precio: 2.80, unidad: 'kg', categoria: 'Frutas', stock: 22, vendedorId: V.franciscoFrutas },
  { nombre: 'Manzanas Golden', descripcion: 'Manzanas Golden de Lleida, crujientes y dulces.', precio: 1.70, unidad: 'kg', categoria: 'Frutas', stock: 45, vendedorId: V.franciscoFrutas },
  { nombre: 'Peras Conferencia', descripcion: 'Peras Conferencia en su punto óptimo de maduración.', precio: 2.00, unidad: 'kg', categoria: 'Frutas', stock: 30, vendedorId: V.franciscoFrutas },
  { nombre: 'Melocotones de Calanda', descripcion: 'Melocotones IGP Calanda. Solo disponibles en verano.', precio: 3.50, unidad: 'kg', categoria: 'Frutas', stock: 0, vendedorId: V.franciscoFrutas },
  { nombre: 'Albaricoques', descripcion: 'Albaricoques de temporada, dulces y jugosos.', precio: 2.90, unidad: 'kg', categoria: 'Frutas', stock: 14, vendedorId: V.franciscoFrutas },

  // ── Ginés Juan Cortés · Frutas ────────────────────────────
  { nombre: 'Aguacates Hass', descripcion: 'Aguacates de la Costa Tropical de Granada.', precio: 3.60, unidad: 'kg', categoria: 'Frutas', stock: 20, vendedorId: V.ginesFrutas },
  { nombre: 'Espinacas baby', descripcion: 'Hojas tiernas de espinaca ecológica local.', precio: 2.40, unidad: 'kg', categoria: 'Verduras', stock: 18, vendedorId: V.ginesFrutas },
  { nombre: 'Lechugas Batavia', descripcion: 'Lechugas tiernas recién cortadas de huerta propia.', precio: 0.90, unidad: 'unidad', categoria: 'Verduras', stock: 25, vendedorId: V.ginesFrutas },
  { nombre: 'Tomate corazón de buey', descripcion: 'Tomate de la variedad Corazón de Buey, para ensaladas de lujo.', precio: 3.20, unidad: 'kg', categoria: 'Verduras', stock: 10, vendedorId: V.ginesFrutas },
  { nombre: 'Granadas Mollar', descripcion: 'Granadas de Elche, variedad Mollar sin pepitas duras.', precio: 2.60, unidad: 'kg', categoria: 'Frutas', stock: 0, vendedorId: V.ginesFrutas },

  // ── Gaspar Molina Muñoz · Frutas ──────────────────────────
  { nombre: 'Calabacines', descripcion: 'Calabacines tiernos de producción local.', precio: 1.40, unidad: 'kg', categoria: 'Verduras', stock: 30, vendedorId: V.gasparFrutas },
  { nombre: 'Pepinos', descripcion: 'Pepinos frescos para ensaladas o gazpacho.', precio: 1.10, unidad: 'kg', categoria: 'Verduras', stock: 40, vendedorId: V.gasparFrutas },
  { nombre: 'Berenjenas', descripcion: 'Berenjenas moradas de la huerta andaluza.', precio: 1.60, unidad: 'kg', categoria: 'Verduras', stock: 22, vendedorId: V.gasparFrutas },
  { nombre: 'Zanahorias', descripcion: 'Zanahorias limpias y envasadas en malla.', precio: 0.95, unidad: 'kg', categoria: 'Verduras', stock: 50, vendedorId: V.gasparFrutas },
  { nombre: 'Cebolla blanca', descripcion: 'Cebolla tierna de primavera, suave y dulce.', precio: 0.80, unidad: 'kg', categoria: 'Verduras', stock: 60, vendedorId: V.gasparFrutas },

  // ── Gabriel Martínez · Carnicería ─────────────────────────
  { nombre: 'Filetes de ternera', descripcion: 'Ternera de raza frisona, madurada 14 días en cámara.', precio: 14.90, unidad: 'kg', categoria: 'Carne', stock: 15, vendedorId: V.gabriel },
  { nombre: 'Costillas de cerdo', descripcion: 'Costillas de cerdo ibérico de bellota para barbacoa.', precio: 7.50, unidad: 'kg', categoria: 'Carne', stock: 20, vendedorId: V.gabriel },
  { nombre: 'Pechuga de pollo', descripcion: 'Pollo fresco de corral, sin antibióticos.', precio: 6.20, unidad: 'kg', categoria: 'Carne', stock: 25, vendedorId: V.gabriel },
  { nombre: 'Chuletillas de cordero', descripcion: 'Corderito lechal de la sierra de Jaén.', precio: 18.00, unidad: 'kg', categoria: 'Carne', stock: 8, vendedorId: V.gabriel },

  // ── Jerónimo Ruíz · Pescadería ────────────────────────────
  { nombre: 'Boquerones frescos', descripcion: 'Boquerones del Mediterráneo. Llegados esta mañana a las 6h.', precio: 5.50, unidad: 'kg', categoria: 'Pescado', stock: 12, vendedorId: V.jeronimo },
  { nombre: 'Merluza fileteada', descripcion: 'Merluza del Cantábrico fileteada al momento.', precio: 12.90, unidad: 'kg', categoria: 'Pescado', stock: 10, vendedorId: V.jeronimo },
  { nombre: 'Gambas blancas', descripcion: 'Gambas blancas de Huelva, producto del día.', precio: 22.00, unidad: 'kg', categoria: 'Marisco', stock: 6, vendedorId: V.jeronimo },
  { nombre: 'Atún rojo', descripcion: 'Atún rojo de almadraba, en temporada de mayo.', precio: 28.00, unidad: 'kg', categoria: 'Pescado', stock: 5, vendedorId: V.jeronimo },

  // ── Felicia García · Charcutería ──────────────────────────
  { nombre: 'Jamón ibérico de bellota', descripcion: 'Jamón 100% ibérico de bellota, curado 36 meses en bodega propia.', precio: 89.00, unidad: 'kg', categoria: 'Charcutería', stock: 5, vendedorId: V.felicia },
  { nombre: 'Lomo embuchado', descripcion: 'Lomo de cerdo ibérico embuchado artesanalmente.', precio: 32.00, unidad: 'kg', categoria: 'Charcutería', stock: 10, vendedorId: V.felicia },
  { nombre: 'Salchichón ibérico', descripcion: 'Salchichón de cerdo ibérico con especias naturales.', precio: 18.50, unidad: 'kg', categoria: 'Charcutería', stock: 12, vendedorId: V.felicia },
  { nombre: 'Queso manchego curado', descripcion: 'Queso manchego D.O.P. curado 6 meses.', precio: 14.90, unidad: 'kg', categoria: 'Quesos', stock: 8, vendedorId: V.felicia },

  // ── Dolores Muñoz · Panadería ─────────────────────────────
  { nombre: 'Pan de pueblo', descripcion: 'Hogaza artesana de masa madre, horneada desde las 5 de la mañana.', precio: 2.80, unidad: 'unidad', categoria: 'Panadería', stock: 30, vendedorId: V.dolores },
  { nombre: 'Mollete de Antequera', descripcion: 'Molletes tiernos de Antequera, perfectos para el desayuno.', precio: 0.40, unidad: 'unidad', categoria: 'Panadería', stock: 60, vendedorId: V.dolores },
  { nombre: 'Regañás con sésamo', descripcion: 'Regañás crujientes espolvoreadas con sésamo tostado.', precio: 1.20, unidad: 'unidad', categoria: 'Panadería', stock: 40, vendedorId: V.dolores },
  { nombre: 'Tortas de aceite', descripcion: 'Tortas de aceite de oliva con anís, receta tradicional de Úbeda.', precio: 1.50, unidad: 'unidad', categoria: 'Panadería', stock: 25, vendedorId: V.dolores },

  // ── Bartolomé Moyano · Especias ───────────────────────────
  { nombre: 'Pimentón de la Vera', descripcion: 'Pimentón dulce ahumado D.O.P. La Vera. Imprescindible en cocina andaluza.', precio: 4.50, unidad: 'unidad', categoria: 'Especias', stock: 20, vendedorId: V.bartolome },
  { nombre: 'Azafrán de La Mancha', descripcion: 'Azafrán D.O.P. La Mancha en hebras. El más valioso.', precio: 6.00, unidad: 'unidad', categoria: 'Especias', stock: 15, vendedorId: V.bartolome },
  { nombre: 'Comino molido', descripcion: 'Comino molido artesanalmente, base del gazpacho y los guisos.', precio: 2.20, unidad: 'unidad', categoria: 'Especias', stock: 30, vendedorId: V.bartolome },
  { nombre: 'Hierbas provenzales', descripcion: 'Mezcla de tomillo, romero, orégano y mejorana.', precio: 2.80, unidad: 'unidad', categoria: 'Especias', stock: 25, vendedorId: V.bartolome },

  // ── Isabel Mendoza · Charcutería ──────────────────────────
  { nombre: 'Morcilla de Jaén', descripcion: 'Morcilla artesana con arroz y especias típicas de Jaén.', precio: 8.90, unidad: 'kg', categoria: 'Charcutería', stock: 10, vendedorId: V.isabel },
  { nombre: 'Chorizo casero picante', descripcion: 'Chorizo elaborado con pimentón de la Vera y tripa natural.', precio: 11.50, unidad: 'kg', categoria: 'Charcutería', stock: 14, vendedorId: V.isabel },
  { nombre: 'Queso fresco de cabra', descripcion: 'Queso fresco elaborado con leche de cabra local.', precio: 9.80, unidad: 'kg', categoria: 'Quesos', stock: 8, vendedorId: V.isabel },

  // ── Manuel Domínguez · Carnes ─────────────────────────────
  { nombre: 'Hamburguesas artesanas', descripcion: 'Hamburguesas de ternera y cerdo con hierbas frescas. Pack de 4.', precio: 8.50, unidad: 'unidad', categoria: 'Carne', stock: 20, vendedorId: V.manuelCarnes },
  { nombre: 'Pollo entero de corral', descripcion: 'Pollo campero criado en libertad, sin hormonas.', precio: 9.90, unidad: 'unidad', categoria: 'Carne', stock: 12, vendedorId: V.manuelCarnes },
  { nombre: 'Chuletas de cerdo ibérico', descripcion: 'Chuletas de lomo de cerdo ibérico. Para plancha o barbacoa.', precio: 13.50, unidad: 'kg', categoria: 'Carne', stock: 15, vendedorId: V.manuelCarnes },
];

await sequelize.authenticate();
console.log('Conectado a MySQL.');

let creados = 0;
for (const p of productos) {
  await Product.create(p);
  creados++;
}

console.log(`\n✓ ${creados} productos creados correctamente.`);
await sequelize.close();
