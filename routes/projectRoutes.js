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
const protect = require("../middleware/authMiddleware"); // Asegúrate de importar el middleware de protección


// Rutas para proyectos
router.post("/", protect(["admin"]), createProject);
router.get("/", protect(["admin", "junior", "readOnly"]), getAllProjects);
router.get("/:id", protect(["admin", "junior"]), getProjectById);
router.put("/:id", protect(["admin", "junior"]), updateProject);
router.delete("/:id", protect(["admin",]), deleteProject);

// Rutas para agregar cámaras y NVRs a proyectos
router.post("/add-camera", addCameraToProject);
router.post("/add-nvr", addNvrToProject);

module.exports = router;