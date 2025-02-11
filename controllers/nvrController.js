const mongoose = require("mongoose"); // Importa mongoose
const NVR = require("../models/Nvr");

// Crear un nuevo NVR
const createNvr = async (req, res) => {
  try {
    const { name, ipAddress, macAddress, model, maxChannels, capacity, location, branch } = req.body;

    // Validar campos requeridos
    if (!name || !ipAddress || !macAddress || !model || !maxChannels || !capacity || !location || !branch) {
      return res.status(400).json({ message: "Todos los campos requeridos deben estar completos." });
    }

    // Crear nuevo NVR
    const nvr = new NVR(req.body);
    await nvr.save();

    res.status(201).json(nvr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todos los NVRs
const getAllNvrs = async (req, res) => {
  try {
    const nvrs = await NVR.find().populate("cameras"); // Asegura que las cámaras sean incluidas
    res.status(200).json(nvrs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un NVR por ID
const getNvrById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de NVR no válido." });
    }

    // Buscar el NVR y poblar las cámaras
    const nvr = await NVR.findById(id).populate("cameras");

    if (!nvr) {
      return res.status(404).json({ message: "NVR no encontrado." });
    }

    res.status(200).json(nvr);
  } catch (error) {
    console.error("Error en getNvrById:", error);
    res.status(500).json({ message: "Error al obtener el NVR." });
  }
};

// Actualizar un NVR
const updateNvr = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de NVR no válido." });
    }

    // Buscar y actualizar el NVR
    const nvr = await NVR.findByIdAndUpdate(id, updatedData, { new: true });

    if (!nvr) {
      return res.status(404).json({ message: "NVR no encontrado." });
    }

    res.status(200).json(nvr);
  } catch (error) {
    console.error("Error en updateNvr:", error);
    res.status(500).json({ message: "Error al actualizar el NVR." });
  }
};

// Eliminar un NVR (solo si no tiene cámaras asignadas)
const deleteNvr = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de NVR no válido." });
    }

    // Buscar el NVR y verificar si tiene cámaras asignadas
    const nvr = await NVR.findById(id).populate("cameras");

    if (!nvr) {
      return res.status(404).json({ message: "NVR no encontrado." });
    }

    // Verificar si el NVR tiene cámaras asignadas
    if (nvr.cameras && nvr.cameras.length > 0) {
      return res.status(400).json({ message: "No se puede eliminar un NVR con cámaras asignadas." });
    }

    // Eliminar el NVR
    await NVR.findByIdAndDelete(id);
    res.status(200).json({ message: "NVR eliminado correctamente." });
  } catch (error) {
    console.error("Error en deleteNvr:", error);
    res.status(500).json({ message: "Error al eliminar el NVR." });
  }
};

module.exports = { createNvr, getAllNvrs, getNvrById, updateNvr, deleteNvr };