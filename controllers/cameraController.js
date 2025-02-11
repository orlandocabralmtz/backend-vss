const Camera = require("../models/Camera");
const Nvr = require("../models/Nvr");
const mongoose = require("mongoose");
const multer = require('multer');
const xlsx = require('xlsx'); // Librería para leer archivos Excel
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Configuración de multer para la subida del archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single('file'); // Se espera que el archivo Excel se envíe con el campo "file"

// Función para verificar los nombres de las columnas en el Excel
const validateExcelHeaders = (data) => {
  const expectedHeaders = [
    'name',
    'model',
    'ipAddress',
    'location',
    'macAddress',
    'serialNumber',
    'firmware',
    'resolution',
    'fps',
  ];
  console.log("Datos importados desde el archivo:", data); // Muestra los datos antes de validarlos


  const headers = Object.keys(data[0]); // Obtenemos las claves de la primera fila del archivo
  console.log("Encabezados del archivo:", headers); // Verifica los encabezados en la consola


  // Verifica que todos los encabezados esperados estén presentes
  return expectedHeaders.every(header => headers.includes(header));
};

// Crear una nueva cámara
const createCamera = async (req, res) => {
  try {
    const { name, model, ipAddress, location, nvr, assignedDate, macAddress, serialNumber, firmware, resolution, fps } = req.body;

    if (!macAddress || !serialNumber) {
      return res.status(400).json({ message: "macAddress y serialNumber son obligatorios" });
    }

    const cameraData = {
      name,
      model,
      ipAddress,
      location,
      nvr: nvr || null,
      assignedDate,
      macAddress,
      serialNumber,
      firmware,
      resolution,
      fps
    };

    const camera = await Camera.create(cameraData);

    res.status(201).json(camera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las cámaras
const getAllCameras = async (req, res) => {
  try {
    const cameras = await Camera.find().populate("nvr", "name"); // Poblamos solo el nombre del NVR
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las cámaras" });
  }
};

// Asignar una cámara a un NVR
const assignCameraToNvr = async (req, res) => {
  try {
    const { cameraId, nvrId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cameraId) || !mongoose.Types.ObjectId.isValid(nvrId)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const camera = await Camera.findById(cameraId);
    const newNvr = await Nvr.findById(nvrId);

    if (!camera || !newNvr) {
      return res.status(404).json({ message: "Cámara o NVR no encontrado" });
    }

    // Verificar si el NVR tiene capacidad
    if (newNvr.cameras.length >= newNvr.maxChannels) {
      return res.status(400).json({ message: "El nuevo NVR alcanzó su capacidad máxima" });
    }

    // Reasignar la cámara al NVR
    const reassignment = {
      nvr: newNvr._id,
      date: new Date(),
    };
    camera.reassignments.push(reassignment);
    camera.nvr = newNvr._id;
    camera.assignedDate = new Date();
    await camera.save();

    newNvr.cameras.push(camera._id);
    await newNvr.save();

    // Eliminar la cámara del NVR anterior
    if (camera.nvr) {
      const previousNvr = await Nvr.findById(camera.nvr);
      if (previousNvr) {
        previousNvr.cameras = previousNvr.cameras.filter((id) => id.toString() !== camera._id.toString());
        await previousNvr.save();
      }
    }

    res.status(200).json({
      message: "Cámara reasignada al nuevo NVR con éxito",
      camera,
      newNvr,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener historial de una cámara
const getCameraHistory = async (req, res) => {
  try {
    const { cameraId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: "El ID de la cámara no es válido" });
    }

    const camera = await Camera.findById(cameraId)
      .select("name reassignments")
      .populate("reassignments.nvr", "name maxChannels");

    if (!camera) {
      return res.status(404).json({ message: "Cámara no encontrada" });
    }

    res.status(200).json({
      message: `Historial de reasignaciones para la cámara ${camera.name}`,
      history: camera.reassignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una cámara
const updateCamera = async (req, res) => {
  try {
    const { cameraId } = req.params;
    const updateData = req.body;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: 'El ID de la cámara no es válido' });
    }

    // Buscar la cámara
    const camera = await Camera.findById(cameraId);

    if (!camera) {
      return res.status(404).json({ message: 'Cámara no encontrada' });
    }

    // Validar que los campos obligatorios estén presentes
    if (!updateData.name || !updateData.macAddress || !updateData.serialNumber) {
      return res.status(400).json({ message: 'Los campos "name", "macAddress" y "serialNumber" son obligatorios' });
    }

    // Validar que la dirección MAC tenga el formato correcto (simple validación con expresión regular)
    const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (updateData.macAddress && !macAddressRegex.test(updateData.macAddress)) {
      return res.status(400).json({ message: 'La dirección MAC no tiene un formato válido' });
    }

    // Validar que el número de serie no esté duplicado
    const existingSerial = await Camera.findOne({ serialNumber: updateData.serialNumber });
    if (existingSerial && existingSerial._id.toString() !== camera._id.toString()) {
      return res.status(400).json({ message: 'El número de serie ya está registrado en otra cámara' });
    }

    // Validar que el NVR existe si se proporciona
    if (updateData.nvr) {
      const newNvr = await Nvr.findById(updateData.nvr);
      if (!newNvr) {
        return res.status(404).json({ message: 'NVR no encontrado' });
      }

      // Verificar si el NVR tiene capacidad para la cámara
      if (newNvr.cameras.length >= newNvr.maxChannels) {
        return res.status(400).json({ message: 'El NVR ha alcanzado su capacidad máxima' });
      }

      // Si el NVR es diferente, registrar la reasignación
      if (camera.nvr && camera.nvr.toString() !== updateData.nvr.toString()) {
        const reassignment = {
          nvr: updateData.nvr,
          date: new Date(),
        };
        camera.reassignments.push(reassignment);
        camera.nvr = updateData.nvr;
        camera.assignedDate = new Date();

        // Eliminar la cámara del NVR anterior
        const previousNvr = await Nvr.findById(camera.nvr);
        if (previousNvr) {
          previousNvr.cameras = previousNvr.cameras.filter((id) => id.toString() !== camera._id.toString());
          await previousNvr.save();
        }

        // Agregar la cámara al nuevo NVR
        newNvr.cameras.push(camera._id);
        await newNvr.save();
      }
    }

    // Actualizar campos de la cámara con los datos proporcionados
    if (updateData.name) camera.name = updateData.name;
    if (updateData.location) camera.location = updateData.location;
    if (updateData.model) camera.model = updateData.model;
    if (updateData.ipAddress) camera.ipAddress = updateData.ipAddress;
    if (updateData.macAddress) camera.macAddress = updateData.macAddress;
    if (updateData.serialNumber) camera.serialNumber = updateData.serialNumber;
    if (updateData.firmware) camera.firmware = updateData.firmware;
    if (updateData.resolution) camera.resolution = updateData.resolution;
    if (updateData.fps) camera.fps = updateData.fps;
    if (updateData.status) camera.status = updateData.status;

    // Guardar los cambios en la cámara
    const updatedCamera = await camera.save();

    res.status(200).json(updatedCamera);
  } catch (error) {
    console.error('Error en updateCamera:', error);
    res.status(500).json({ message: 'Error al actualizar la cámara', error: error.message });
  }
};

// Eliminar una cámara
const deleteCamera = async (req, res) => {
  try {
    const { cameraId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: "El ID de la cámara no es válido" });
    }

    const deletedCamera = await Camera.findByIdAndDelete(cameraId);

    if (!deletedCamera) {
      return res.status(404).json({ message: "Cámara no encontrada" });
    }

    res.status(200).json({ message: "Cámara eliminada correctamente", deletedCamera });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la cámara", error: error.message });
  }
};

// Obtener una cámara por su ID
const getCameraById = async (req, res) => {
  try {
    const { cameraId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: "El ID de la cámara no es válido" });
    }

    const camera = await Camera.findById(cameraId).populate("nvr", "name");

    if (!camera) {
      return res.status(404).json({ message: "Cámara no encontrada" });
    }

    res.status(200).json(camera);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la cámara", error: error.message });
  }
};

// Importar cámaras desde un archivo Excel
const importCamerasFromExcel = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Error de Multer:", err.message);
      return res.status(400).json({ message: "Error al subir el archivo", error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No se ha enviado ningún archivo." });
    }

    const filePath = path.join(__dirname, "..", "uploads", req.file.filename);

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!validateExcelHeaders(data)) {
        return res.status(400).json({ message: "El archivo Excel no contiene las columnas correctas." });
      }

      let importedCameras = 0;
      let skippedCameras = 0;
      const importedCamerasData = [];

      for (let cameraData of data) {
        if (!cameraData.macAddress || !cameraData.serialNumber) {
          console.log("Fila omitida (campos faltantes):", cameraData);
          skippedCameras++;
          continue;
        }

        try {
          // Verificar si la IP ya existe
          const existingCamera = await Camera.findOne({ ipAddress: cameraData.ipAddress });

          if (existingCamera) {
            console.log(`Cámara con IP ${cameraData.ipAddress} ya existe. Omitiendo...`);
            skippedCameras++;
            continue;
          }

          const camera = await Camera.create(cameraData);
          importedCameras++;
          importedCamerasData.push(camera);
        } catch (cameraErr) {
          console.error("Error al importar la cámara:", cameraErr.message);
          skippedCameras++; // Si hay error en una cámara, se cuenta como omitida
        }
      }

      fs.unlinkSync(filePath);

      if (importedCameras === 0) {
        return res.status(400).json({ message: "No se han importado cámaras o todas ya existían en la base de datos." });
      }

      res.status(201).json({
        message: `Importación completada.`,
        importedCount: importedCameras,
        skippedCount: skippedCameras,
        cameras: importedCamerasData,
      });
    } catch (err) {
      console.error("Error al procesar el archivo Excel:", err.message);
      return res.status(500).json({ message: "Error al procesar el archivo Excel", error: err.message });
    }
  });
};


module.exports = {
  createCamera,
  getAllCameras,
  assignCameraToNvr,
  getCameraHistory,
  updateCamera,
  deleteCamera,
  getCameraById,
  importCamerasFromExcel,
};
