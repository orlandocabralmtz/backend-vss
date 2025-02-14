const mongoose = require("mongoose");
const Project = require("../models/Project");
const Camera = require("../models/Camera");
const NVR = require("../models/Nvr");

// Crear un nuevo proyecto
const createProject = async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    // Validar campos requeridos
    if (!name || !createdBy) {
      return res.status(400).json({ message: "Nombre y creador son campos requeridos." });
    }

    // Validar que el ID del creador sea válido
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ message: "ID de creador no válido." });
    }

    // Verificar si el proyecto ya existe
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      return res.status(400).json({ message: "El nombre del proyecto ya está en uso." });
    }

    // Crear el nuevo proyecto
    const project = new Project({
      name,
      description,
      createdBy,
    });

    // Guardar el proyecto en la base de datos
    await project.save();

    res.status(201).json(project);
  } catch (error) {
    console.error("Error en createProject:", error);

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Error de validación", errors });
    }

    // Manejar errores de duplicación
    if (error.code === 11000) {
      return res.status(400).json({ message: "El nombre del proyecto ya está en uso." });
    }

    res.status(500).json({ message: "Error al crear el proyecto.", error: error.message });
  }
};

// Obtener todos los proyectos
const getAllProjects = async (req, res) => {
  try {
    // Obtener todos los proyectos y poblar las referencias
    const projects = await Project.find()
      .populate("cameras")
      // .populate("nvrs")
      .populate("createdBy")
      .populate("updatedBy");

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error en getAllProjects:", error);
    res.status(500).json({ message: "Error al obtener los proyectos.", error: error.message });
  }
};

// Obtener un proyecto por ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de proyecto no válido." });
    }

    // Buscar el proyecto y poblar las referencias
    const project = await Project.findById(id)
      .populate("cameras")
      .populate("nvrs")
      .populate("createdBy")
      .populate("updatedBy");

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error en getProjectById:", error);
    res.status(500).json({ message: "Error al obtener el proyecto.", error: error.message });
  }
};

// Actualizar un proyecto
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, updatedBy } = req.body;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de proyecto no válido." });
    }

    // Validar que el ID del actualizador sea válido
    if (updatedBy && !mongoose.Types.ObjectId.isValid(updatedBy)) {
      return res.status(400).json({ message: "ID de actualizador no válido." });
    }

    // Buscar el proyecto
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    // Actualizar campos
    if (name) project.name = name;
    if (description) project.description = description;
    if (updatedBy) project.updatedBy = updatedBy;

    // Guardar los cambios
    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error("Error en updateProject:", error);

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Error de validación", errors });
    }

    res.status(500).json({ message: "Error al actualizar el proyecto.", error: error.message });
  }
};

// Eliminar un proyecto
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID tenga el formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de proyecto no válido." });
    }

    // Buscar el proyecto
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    // Eliminar el proyecto
    await Project.findByIdAndDelete(id);

    res.status(200).json({ message: "Proyecto eliminado correctamente." });
  } catch (error) {
    console.error("Error en deleteProject:", error);
    res.status(500).json({ message: "Error al eliminar el proyecto.", error: error.message });
  }
};

// Agregar una cámara a un proyecto
const addCameraToProject = async (req, res) => {
  try {
    const { projectId, cameraId } = req.body;

    // Validar que los IDs sean válidos
    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(cameraId)
    ) {
      return res.status(400).json({ message: "IDs no válidos." });
    }

    // Buscar el proyecto y la cámara
    const project = await Project.findById(projectId);
    const camera = await Camera.findById(cameraId);

    if (!project || !camera) {
      return res.status(404).json({ message: "Proyecto o cámara no encontrado." });
    }

    // Verificar si la cámara ya está en el proyecto
    if (project.cameras.includes(cameraId)) {
      return res.status(400).json({ message: "La cámara ya está asignada al proyecto." });
    }

    // Agregar la cámara al proyecto
    project.cameras.push(cameraId);
    await project.save();

    res.status(200).json({ message: "Cámara agregada al proyecto correctamente.", project });
  } catch (error) {
    console.error("Error en addCameraToProject:", error);
    res.status(500).json({ message: "Error al agregar la cámara al proyecto.", error: error.message });
  }
};

// Agregar un NVR a un proyecto
const addNvrToProject = async (req, res) => {
  try {
    const { projectId, nvrId } = req.body;

    // Validar que los IDs sean válidos
    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(nvrId)
    ) {
      return res.status(400).json({ message: "IDs no válidos." });
    }

    // Buscar el proyecto y el NVR
    const project = await Project.findById(projectId);
    const nvr = await NVR.findById(nvrId);

    if (!project || !nvr) {
      return res.status(404).json({ message: "Proyecto o NVR no encontrado." });
    }

    // Verificar si el NVR ya está en el proyecto
    if (project.nvrs.includes(nvrId)) {
      return res.status(400).json({ message: "El NVR ya está asignado al proyecto." });
    }

    // Agregar el NVR al proyecto
    project.nvrs.push(nvrId);
    await project.save();

    res.status(200).json({ message: "NVR agregado al proyecto correctamente.", project });
  } catch (error) {
    console.error("Error en addNvrToProject:", error);
    res.status(500).json({ message: "Error al agregar el NVR al proyecto.", error: error.message });
  }
};

// Obtener detalles de un proyecto
const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "ID de proyecto inválido." });
    }

    // Buscar el proyecto y poblar cámaras y NVRs
    const project = await Project.findById(projectId)
      .populate("cameras")
      .populate("nvrs");

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error en getProjectDetails:", error);
    res.status(500).json({ message: "Error al obtener los detalles del proyecto.", error: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addCameraToProject,
  addNvrToProject,
  getProjectDetails,
};