const Camera = require("../models/Camera");
const Project = require("../models/Project");
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



// función para asignr camara a un projecto 
const assignCameraToProject = async (camera, newProjectId) => {
  // Si la cámara tiene un proyecto asignado y es diferente al nuevo proyecto
  if (camera.project && camera.project._id.toString() !== newProjectId) {
      const oldProject = await Project.findById(camera.project._id);
      if (oldProject) {
          // Eliminar la cámara del proyecto antiguo
          oldProject.cameras = oldProject.cameras.filter(
              (cam) => cam.toString() !== camera._id.toString()
          );
          await oldProject.save();
      }
  }

  // Asignar la cámara al nuevo proyecto
  const newProject = await Project.findById(newProjectId);
  if (newProject) {
      newProject.cameras.push(camera._id);
      await newProject.save();
  }
};




const createCamera = async (req, res) => {
  try {
    const {
      name,
      model,
      ipAddress,
      location,
      nvr,
      assignedDate,
      macAddress,
      serialNumber,
      firmware,
      resolution,
      fps,
      username,
      password,
      project, // Nuevo campo: ID del proyecto
    } = req.body;

    // Validar campos obligatorios
    if (!name || !model || !ipAddress || !location || !macAddress || !serialNumber) {
      return res.status(400).json({
        message:
          "Los campos name, model, ipAddress, location, macAddress y serialNumber son obligatorios",
      });
    }

    // Crear el objeto de datos de la cámara
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
      fps,
      username,
      password,
      project: project || null, // Asignar el proyecto si se proporciona
      createdBy: req.user ? req.user.userId : null,
    };

    // Crear la cámara en la base de datos
    const camera = await Camera.create(cameraData);

    // **Actualizar el NVR si es necesario**
    if (nvr) {
      const nvrToUpdate = await Nvr.findById(nvr);
      if (nvrToUpdate) {
        // Verificar si el NVR tiene capacidad para agregar la cámara
        if (nvrToUpdate.channelsOccupied >= nvrToUpdate.maxChannels) {
          return res.status(400).json({
            message: "El NVR ha alcanzado su capacidad máxima",
          });
        }

        // Agregar la cámara al NVR
        nvrToUpdate.cameras.push(camera._id);
        nvrToUpdate.channelsOccupied += 1; // Incrementar el contador de canales ocupados
        await nvrToUpdate.save();
      }
    }

    // Si se proporcionó un proyecto, agregar la cámara al proyecto
    if (project) {
      const projectToUpdate = await Project.findById(project);
      if (projectToUpdate) {
        projectToUpdate.cameras.push(camera._id);
        await projectToUpdate.save();
      }
    }

    res.status(201).json(camera);
  } catch (error) {
    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Error de validación", errors });
    }

    // Manejar errores de duplicación
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Error de duplicación",
        details: "El serialNumber o macAddress ya están en uso",
      });
    }

    // Manejar otros errores
    console.error("Error en createCamera:", error);
    res.status(500).json({ message: "Error al crear la cámara", error: error.message });
  }
};




// Obtener todas las cámaras
const getAllCameras = async (req, res) => {
  try {
    const cameras = await Camera.find()
      .populate("nvr", "name")          // Poblamos solo el nombre del NVR
      .populate("createdBy", "name")    // Poblamos solo el nombre del usuario creador
      .populate("updatedBy", "name")   // Poblamos solo el nombre del usuario que actualizó
      .populate("project", "name");     // Poblamos solo el nombre del proyecto

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
    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: "ID de cámara inválido" });
    }
    if (!mongoose.Types.ObjectId.isValid(nvrId)) {
      return res.status(400).json({ message: "ID de NVR inválido" });
    }

    // Buscar la cámara y el NVR
    const camera = await Camera.findById(cameraId);
    const newNvr = await Nvr.findById(nvrId);

    if (!camera) {
      return res.status(404).json({ message: "Cámara no encontrada" });
    }
    if (!newNvr) {
      return res.status(404).json({ message: "NVR no encontrado" });
    }

    // Verificar si el NVR seleccionado es el mismo que el actual
    if (camera.nvr?.toString() === newNvr._id.toString()) {
      return res.status(400).json({ message: "La cámara ya está asignada a este NVR" });
    }

    // Verificar si el NVR tiene capacidad
    if (newNvr.cameras.length >= newNvr.maxChannels) {
      return res.status(400).json({ message: "El NVR ha alcanzado su capacidad máxima" });
    }

    // Crear una nueva reasignación
    const reassignment = {
      nvr: newNvr._id,
      date: new Date(),
    };

    // Verificar si ya existe una reasignación para este NVR
    const existingReassignment = camera.reassignments.find(
      (r) => r.nvr.toString() === newNvr._id.toString()
    );

    if (!existingReassignment) {
      // Agregar la nueva reasignación solo si no existe
      camera.reassignments.push(reassignment);
    }

    // Guardar el NVR anterior antes de actualizar
    const previousNvrId = camera.nvr;

    // Actualizar el NVR de la cámara
    camera.nvr = newNvr._id;
    camera.assignedDate = new Date();

    // Guardar la cámara actualizada
    await camera.save();

    // Agregar la cámara al nuevo NVR
    if (!newNvr.cameras.includes(camera._id)) {
      newNvr.cameras.push(camera._id);
      await newNvr.save();
    }

    // Eliminar la cámara del NVR anterior (si existe)
    if (previousNvrId) {
      const previousNvr = await Nvr.findById(previousNvrId);
      if (previousNvr) {
        previousNvr.cameras = previousNvr.cameras.filter(
          (id) => id.toString() !== camera._id.toString()
        );
        await previousNvr.save();
      }
    }

    res.status(200).json({
      message: "Cámara reasignada al nuevo NVR con éxito",
      camera,
      newNvr,
    });
  } catch (error) {
    console.error("Error en assignCameraToNvr:", error);
    res.status(500).json({ message: "Error interno del servidor" });
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

    // Objeto para almacenar los cambios realizados
    const changes = [];

    // Función para registrar cambios
    const logChange = (field, oldValue, newValue) => {
      changes.push(`Cambio de ${field}: de '${oldValue}' a '${newValue}'`);
    };

    // Función para actualizar un campo si ha cambiado
    const updateField = (field, newValue) => {
      if (newValue !== undefined && camera[field] !== newValue) {
        logChange(field, camera[field], newValue);
        camera[field] = newValue;
      }
    };

    // Actualizar campos básicos
    updateField('name', updateData.name);
    updateField('model', updateData.model);
    updateField('ipAddress', updateData.ipAddress);
    updateField('location', updateData.location);
    updateField('macAddress', updateData.macAddress);
    updateField('serialNumber', updateData.serialNumber);
    updateField('firmware', updateData.firmware);
    updateField('resolution', updateData.resolution);
    updateField('fps', updateData.fps);

    // Actualizar campos opcionales (username y password)
    updateField('username', updateData.username);
    updateField('password', updateData.password);

    // **Actualizar el NVR si es necesario**
    if (updateData.nvr && (camera.nvr === null || camera.nvr.toString() !== updateData.nvr.toString())) {
      // Verificar si el nuevo NVR existe
      const newNvr = await Nvr.findById(updateData.nvr);
      if (!newNvr) {
        return res.status(404).json({ message: 'NVR no encontrado' });
      }

      // Verificar si el nuevo NVR tiene capacidad
      if (newNvr.channelsOccupied >= newNvr.maxChannels) {
        return res.status(400).json({ message: 'El NVR ha alcanzado su capacidad máxima' });
      }

      // Verificar si ya existe una reasignación para este NVR
      const existingReassignment = camera.reassignments.find(
        (r) => r.nvr.toString() === updateData.nvr.toString()
      );

      // Si no existe una reasignación para este NVR, agregar una nueva
      if (!existingReassignment) {
        const reassignment = {
          nvr: updateData.nvr,
          date: new Date(),
          updatedBy: req.user ? req.user.userId : null, // Registrar quién hace la actualización
        };
        camera.reassignments.push(reassignment);
      }

      // Obtener el nombre del NVR anterior
      let oldNvrName = 'Sin asignar';  // Valor por defecto

      // Si la cámara tiene un NVR asignado, obtener el nombre del NVR
      if (camera.nvr) {
        const oldNvr = await Nvr.findById(camera.nvr);  // Buscar el NVR completo
        if (oldNvr) {
          oldNvrName = oldNvr.name || 'Sin asignar';  // Usar el nombre del NVR o 'Sin asignar'
        }
      }

      // Registrar el cambio de NVR
      logChange('NVR', oldNvrName, newNvr.name);

      // Guardar la cámara antes de continuar con la eliminación del NVR anterior
      const oldNvrId = camera.nvr;
      camera.nvr = updateData.nvr;
      camera.assignedDate = new Date();

      // Guardar la cámara actualizada
      await camera.save();

      // Eliminar la cámara del NVR anterior
      if (oldNvrId) {
        const previousNvr = await Nvr.findById(oldNvrId);
        if (previousNvr) {
          previousNvr.cameras = previousNvr.cameras.filter((id) => id.toString() !== camera._id.toString());
          previousNvr.channelsOccupied -= 1; // Decrementar los canales ocupados
          await previousNvr.save();
        }
      }

      // Agregar la cámara al nuevo NVR
      newNvr.cameras.push(camera._id);
      newNvr.channelsOccupied += 1; // Incrementar los canales ocupados
      await newNvr.save(); // Guarda el NVR después de agregar la cámara
    }

    // **Actualizar el proyecto solo si ha cambiado**
    if (updateData.project && camera.project?.toString() !== updateData.project) {
      // Usar la función assignCameraToProject para gestionar el cambio de proyecto
      await assignCameraToProject(camera, updateData.project);
      
      // Registrar el cambio de proyecto (usando el nombre en lugar del ID)
      const newProject = await Project.findById(updateData.project);
      const newProjectName = newProject ? newProject.name : 'Sin asignar';
      logChange('proyecto', camera.project ? camera.project.name : 'Sin asignar', newProjectName);

      // Actualizar el proyecto de la cámara
      camera.project = updateData.project;
    }

    // Registrar quién actualiza la cámara
    camera.updatedBy = req.user ? req.user.userId : null;

    // Agregar los cambios al historial de actualizaciones solo si hay cambios
    if (changes.length > 0) {
      camera.updateHistory.push({
        user: req.user ? req.user.userId : null,
        date: new Date(),
        changes: changes.join(', '),
      });
    }

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




// // Asignar una camara a un proyecto
// const assignCameraToProject = async (req, res) => {
//   try {
//     const { cameraId, projectId } = req.params;

//     // Validar IDs
//     if (!mongoose.Types.ObjectId.isValid(cameraId)) {
//       return res.status(400).json({ message: "ID de cámara inválido." });
//     }
//     if (!mongoose.Types.ObjectId.isValid(projectId)) {
//       return res.status(400).json({ message: "ID de proyecto inválido." });
//     }

//     // Buscar la cámara y el proyecto
//     const camera = await Camera.findById(cameraId);
//     const project = await Project.findById(projectId);

//     if (!camera) {
//       return res.status(404).json({ message: "Cámara no encontrada." });
//     }
//     if (!project) {
//       return res.status(404).json({ message: "Proyecto no encontrado." });
//     }

//     // Verificar si la cámara ya está asignada a otro proyecto
//     if (camera.project && camera.project.toString() !== projectId) {
//       return res.status(400).json({ message: "La cámara ya está asignada a otro proyecto." });
//     }

//     // Asignar la cámara al proyecto
//     camera.project = projectId;
//     await camera.save();

//     // Agregar la cámara al proyecto (si no está ya incluida)
//     if (!project.cameras.includes(cameraId)) {
//       project.cameras.push(cameraId);
//       await project.save();
//     }

//     res.status(200).json({ message: "Cámara asignada al proyecto con éxito.", camera, project });
//   } catch (error) {
//     console.error("Error en assignCameraToProject:", error);
//     res.status(500).json({ message: "Error al asignar la cámara al proyecto.", error: error.message });
//   }
// };




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
