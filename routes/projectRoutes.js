const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addCameraToProject,
  addNvrToProject,
} = require("../controllers/projectController");

// Rutas para proyectos
router.post("/", createProject);
router.get("/", getAllProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Rutas para agregar cámaras y NVRs a proyectos
router.post("/add-camera", addCameraToProject);
router.post("/add-nvr", addNvrToProject);

module.exports = router;