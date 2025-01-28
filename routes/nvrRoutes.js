const express = require("express");
const router = express.Router();
const { createNvr, getAllNvrs } = require("../controllers/nvrController");

// Ruta para crear un nuevo NVR
router.post("/", createNvr);

// Ruta para obtener todos los NVRs
router.get("/", getAllNvrs);

module.exports = router;
