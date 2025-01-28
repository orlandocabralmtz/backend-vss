const NVR = require("../models/Nvr");

// Crear un nuevo NVR
const createNvr = async (req, res) => {
  try {
    const nvr = await NVR.create(req.body);
    res.status(201).json(nvr);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todos los NVRs
const getAllNvrs = async (req, res) => {
  try {
    const nvrs = await NVR.find().populate("cameras");
    res.status(200).json(nvrs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNvr, getAllNvrs };
