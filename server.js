import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando ✅' });
});

const PORT = process.env.PORT || 5000;

// Conectar a MySQL y arrancar servidor
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL conectado');

    // Sincronizar modelos
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ Tablas creadas/actualizadas');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });