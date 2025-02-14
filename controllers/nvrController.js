const mongoose = require("mongoose"); // Importa mongoose
const NVR = require("../models/Nvr");
const Project = require("../models/Project"); // Importa el modelo Project

// Crear un nuevo NVR
const createNvr = async (req, res) => {
  try {
    const {
      name,
      ipAddress,
      macAddress,
      model,
      maxChannels,
      capacity,
      location,
      brand,
      platform,
      windowsUser,
      windowsPassword,
      softwareUser,
      softwarePassword,
      project, // ID del proyecto
    } = req.body;

    // Validar campos requeridos
    if (
      !name ||
      !ipAddress ||
      !macAddress ||
      !model ||
      !maxChannels ||
      !capacity ||
      !location ||
      !brand ||
      !platform ||
      !windowsUser ||
      !windowsPassword ||
      !softwareUser ||
      !softwarePassword
    ) {
      return res.status(400).json({ message: "Todos los campos requeridos deben estar completos." });
    }

    // Validar que el projectId sea un ObjectId válido (si se proporciona)
    if (project && !mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({ message: "ID de proyecto no válido." });
    }

    // Crear nuevo NVR
    const nvr = new NVR({
      name,
      ipAddress,
      macAddress,
      model,
      maxChannels,
      capacity,
      location,
      brand,
      platform,
      windowsUser,
      windowsPassword,
      softwareUser,
      softwarePassword,
      project: project || null, // Asignar el proyecto si se proporciona
    });

    // Guardar el NVR en la base de datos
    await nvr.save();

    // Si se proporcionó un proyecto, agregar el NVR al proyecto
    if (project) {
      const projectToUpdate = await Project.findById(project);
      if (projectToUpdate) {
        if (!projectToUpdate.nvrs.includes(nvr._id)) {
          projectToUpdate.nvrs.push(nvr._id);
          await projectToUpdate.save();
        }
      } else {
        console.error("Proyecto no encontrado");
        return res.status(404).json({ message: "Proyecto no encontrado." });
      }
    }

    res.status(201).json(nvr);
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
        details: "La IP o MAC ya están en uso",
      });
    }

    // Manejar otros errores
    console.error("Error en createNvr:", error);
    res.status(500).json({ message: "Error al crear el NVR", error: error.message });
  }
};


// Obtener todos los NVRs
const getAllNvrs = async (req, res) => {
  try {
    const nvrs = await NVR.find().populate("cameras").populate("project"); // Poblar cámaras y proyecto
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

    // Buscar el NVR y poblar cámaras y proyecto
    const nvr = await NVR.findById(id).populate("cameras").populate("project");

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

    // Buscar el NVR
    const nvr = await NVR.findById(id);

    if (!nvr) {
      return res.status(404).json({ message: "NVR no encontrado." });
    }

    // Actualizar el proyecto si es necesario
    if (updatedData.project && nvr.project?.toString() !== updatedData.project) {
      // Verificar si el nuevo proyecto existe
      const newProject = await Project.findById(updatedData.project);
      if (!newProject) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      // Eliminar el NVR del proyecto anterior (si existe)
      if (nvr.project) {
        const previousProject = await Project.findById(nvr.project);
        if (previousProject) {
          previousProject.nvrs = previousProject.nvrs.filter(
            (nvrId) => nvrId.toString() !== id
          );
          await previousProject.save();
        }
      }

      // Actualizar el proyecto del NVR
      nvr.project = updatedData.project;

      // Agregar el NVR al nuevo proyecto si no está ya incluido
      if (!newProject.nvrs.includes(id)) {
        newProject.nvrs.push(id);
        await newProject.save();
      }
    }

    // Guardar los cambios en el NVR
    const updatedNvr = await nvr.save();

    res.status(200).json(updatedNvr);
  } catch (error) {
    console.error("Error en updateNvr:", error);
    res.status(500).json({ message: "Error al actualizar el NVR.", error: error.message });
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

    // Eliminar el NVR de los proyectos que lo tengan asignado
    if (nvr.project) {
      const project = await Project.findById(nvr.project);
      if (project) {
        project.nvrs = project.nvrs.filter((nvrId) => nvrId.toString() !== id);
        await project.save();
      }
    }

    // Eliminar el NVR
    await NVR.findByIdAndDelete(id);

    res.status(200).json({ message: "NVR eliminado correctamente." });
  } catch (error) {
    console.error("Error en deleteNvr:", error);
    res.status(500).json({ message: "Error al eliminar el NVR.", error: error.message });
  }
};



// const assignNvrToProject = async (req, res) => {
//   try {
//     const { nvrId, projectId } = req.body;

//     // Validar que los IDs sean válidos
//     if (
//       !mongoose.Types.ObjectId.isValid(nvrId) ||
//       !mongoose.Types.ObjectId.isValid(projectId)
//     ) {
//       return res.status(400).json({ message: "IDs no válidos." });
//     }

//     // Buscar el NVR y el proyecto
//     const nvr = await NVR.findById(nvrId);
//     const project = await Project.findById(projectId);

//     if (!nvr || !project) {
//       return res.status(404).json({ message: "NVR o proyecto no encontrado." });
//     }

//     // Verificar si el NVR ya está asignado a otro proyecto
//     if (nvr.project && nvr.project.toString() !== projectId) {
//       // Eliminar el NVR del proyecto anterior
//       const previousProject = await Project.findById(nvr.project);
//       if (previousProject) {
//         previousProject.nvrs = previousProject.nvrs.filter(
//           (id) => id.toString() !== nvrId
//         );
//         await previousProject.save();
//       }
//     }

//     // Asignar el NVR al nuevo proyecto
//     nvr.project = projectId;
//     await nvr.save();

//     // Agregar el NVR al proyecto si no está ya incluido
//     if (!project.nvrs.includes(nvrId)) {
//       project.nvrs.push(nvrId);
//       await project.save();
//     }

//     res.status(200).json({ message: "NVR asignado al proyecto correctamente.", nvr, project });
//   } catch (error) {
//     console.error("Error en assignNvrToProject:", error);
//     res.status(500).json({ message: "Error al asignar el NVR al proyecto.", error: error.message });
//   }
// };

module.exports = { createNvr, getAllNvrs, getNvrById, updateNvr, deleteNvr };