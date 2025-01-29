const Camera = require("../models/Camera");
const Nvr = require("../models/Nvr");
const mongoose = require("mongoose");

// Crear una nueva cámara
const createCamera = async (req, res) => {
  try {
    // Verificar si el campo 'nvr' existe en el cuerpo de la solicitud
    // Si no existe, asignar null a nvr
    const { name, model, ipAddress, location, nvr, assignedDate } = req.body;

    // Crear un objeto con los datos, asegurándose de que 'nvr' sea null si no se pasa
    const cameraData = {
      name,
      model,
      ipAddress,
      location,
      nvr: nvr || null, // Si no se pasa 'nvr', asignamos null
      assignedDate,
    };

    // Crear la nueva cámara en la base de datos
    const camera = await Camera.create(cameraData);

    res.status(201).json(camera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las cámaras
const getAllCameras = async (req, res) => {
  try {
    const cameras = await Camera.find().populate("nvr", "name"); // Obtiene el NVR y solo su nombre
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las cámaras" });
  }
};



// Asignar una cámara a un NVR
const assignCameraToNvr = async (req, res) => {
  try {
    const { cameraId, nvrId } = req.params;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(cameraId) || !mongoose.Types.ObjectId.isValid(nvrId)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // Buscar cámara y NVR
    const camera = await Camera.findById(cameraId);
    const newNvr = await Nvr.findById(nvrId);

    if (!camera || !newNvr) {
      return res.status(404).json({ message: "Cámara o NVR no encontrado" });
    }

    // Verificar capacidad del nuevo NVR
    if (newNvr.cameras.length >= newNvr.maxChannels) {
      return res.status(400).json({ message: "El nuevo NVR alcanzó su capacidad máxima" });
    }

    // Quitar la cámara del NVR anterior
    if (camera.nvr) {
      const previousNvr = await Nvr.findById(camera.nvr);
      if (previousNvr) {
        previousNvr.cameras = previousNvr.cameras.filter(
          (id) => id.toString() !== camera._id.toString()
        );
        await previousNvr.save();
      }
    }

    // Registrar la reasignación (con historial limitado)
    if (camera.reassignments.length >= 10) {
      camera.reassignments.shift(); // Eliminar la entrada más antigua
    }

    camera.reassignments.push({
      nvr: newNvr._id,
      date: new Date(),
    });

    // Actualizar la cámara y el nuevo NVR
    camera.nvr = newNvr._id;
    camera.assignedDate = new Date();
    await camera.save();

    newNvr.cameras.push(camera._id);
    await newNvr.save();

    res.status(200).json({
      message: "Cámara reasignada con éxito",
      camera,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



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

    // Verificar si la fecha de asignación es válida
    camera.reassignments.forEach((entry) => {
      if (entry.date && isNaN(new Date(entry.date))) {
        entry.date = null;  // Si la fecha no es válida, asigna null
      }
    });

    res.status(200).json({
      message: `Historial de reasignaciones para la cámara ${camera.name}`,
      history: camera.reassignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCamera = async (req, res) => {
  try {
    const { cameraId } = req.params; // Obtenemos el ID de la cámara desde los parámetros
    const updateData = req.body;     // Los nuevos datos para la cámara

    // Validación: asegurarse de que el ID sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: 'El ID de la cámara no es válido' });
    }

    // Validación: si el campo de reasignaciones tiene más de 10 elementos, lanzamos un error
    if (updateData.reassignments && updateData.reassignments.length > 10) {
      return res.status(400).json({ message: 'Solo se permiten un máximo de 10 reasignaciones' });
    }

    // Verificar si se está enviando un valor para el NVR, si no, dejarlo como null
    if (updateData.nvr === "") {
      updateData.nvr = null; // Si el valor del NVR es una cadena vacía, asignamos null
    }

    // Actualizamos la cámara en la base de datos
    const updatedCamera = await Camera.findByIdAndUpdate(cameraId, updateData, { new: true });

    // Si no se encuentra la cámara, respondemos con un error 404
    if (!updatedCamera) {
      return res.status(404).json({ message: 'Cámara no encontrada' });
    }

    // Devolvemos la cámara actualizada
    res.status(200).json(updatedCamera);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la cámara', error: error.message });
  }
};



module.exports = { createCamera, getAllCameras, assignCameraToNvr, getCameraHistory, updateCamera };
