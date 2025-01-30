const Camera = require("../models/Camera");
const Nvr = require("../models/Nvr");
const mongoose = require("mongoose");

// Crear una nueva cámara
const createCamera = async (req, res) => {
  try {
    const { name, model, ipAddress, location, nvr, assignedDate } = req.body;

    const cameraData = {
      name,
      model,
      ipAddress,
      location,
      nvr: nvr || null,
      assignedDate,
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

    if (newNvr.cameras.length >= newNvr.maxChannels) {
      return res.status(400).json({ message: "El nuevo NVR alcanzó su capacidad máxima" });
    }

    // Registrar la reasignación en el historial de la cámara
    const reassignment = {
      nvr: newNvr._id,
      date: new Date(), // Fecha de la reasignación
    };
    camera.reassignments.push(reassignment);

    // Asignar el nuevo NVR a la cámara y actualizar la fecha de asignación
    camera.nvr = newNvr._id;
    camera.assignedDate = new Date(); // Actualizamos la fecha de asignación de la cámara
    await camera.save();

    // Agregar la cámara al nuevo NVR
    newNvr.cameras.push(camera._id);
    await newNvr.save();

    // Si el NVR anterior tiene cámaras asignadas, las eliminamos
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
      .select("name reassignments") // Solo seleccionamos el nombre y las reasignaciones
      .populate("reassignments.nvr", "name maxChannels"); // Poblamos el NVR en las reasignaciones

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

    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: 'El ID de la cámara no es válido' });
    }

    // Buscar la cámara para verificar el NVR actual
    const camera = await Camera.findById(cameraId);

    if (!camera) {
      return res.status(404).json({ message: 'Cámara no encontrada' });
    }

    // Verificar si el NVR ha cambiado
    if (updateData.nvr && (camera.nvr === null || camera.nvr.toString() !== updateData.nvr.toString())) {
      const reassignment = {
        nvr: updateData.nvr, // NVR nuevo
        date: new Date(),    // Fecha de reasignación
      };
      camera.reassignments.push(reassignment);

      // Actualizar la cámara con el nuevo NVR
      camera.nvr = updateData.nvr;
      camera.assignedDate = new Date(); // Actualizamos la fecha de asignación
    }

    // Actualizar la cámara
    const updatedCamera = await Camera.findByIdAndUpdate(cameraId, camera, { new: true });

    // Si el NVR anterior tiene cámaras asignadas, las eliminamos de su lista de cámaras
    if (camera.nvr) {
      const previousNvr = await Nvr.findById(camera.nvr);
      if (previousNvr) {
        previousNvr.cameras = previousNvr.cameras.filter((id) => id.toString() !== camera._id.toString());
        await previousNvr.save();
      }
    }

    // Agregar la cámara al nuevo NVR
    const newNvr = await Nvr.findById(updateData.nvr);
    if (newNvr) {
      newNvr.cameras.push(camera._id);
      await newNvr.save();
    }

    res.status(200).json(updatedCamera);
  } catch (error) {
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

module.exports = {
  createCamera,
  getAllCameras,
  assignCameraToNvr,
  getCameraHistory,
  updateCamera,
  deleteCamera,
  getCameraById,
};
