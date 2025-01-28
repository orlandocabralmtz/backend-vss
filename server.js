// Importar las dependencias necesarias
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
const cameraRoutes = require("./routes/cameraRoutes");
const nvrRoutes = require("./routes/nvrRoutes");

// Configurar dotenv para usar variables de entorno
dotenv.config();

// Crear una instancia de Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Permitir recibir datos JSON en las solicitudes

// Puerto del servidor (desde variables de entorno o por defecto en 5000)
const PORT = process.env.PORT || 5000;

// Ruta de prueba inicial
app.get("/", (req, res) => {
  res.send("Servidor VSS-HXM2 funcionando correctamente");
});


// Importar las rutas de los recursos
app.use("/api/cameras", cameraRoutes);
app.use("/api/nvrs", nvrRoutes);



// Conectar a MongoDB
connectDB();

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
