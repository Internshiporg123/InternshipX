const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    getDashboardStats,
    getDashboardCharts,
    getAllStudents,
    getAllCompanies,
    toggleBlockUser,
    deleteUser,
    getAllInternships,
    deleteInternship,
    getAllApplications,
    deleteApplication,
    getUserDetails
} = require("../controllers/adminController");

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/stats", getDashboardStats);
router.get("/charts", getDashboardCharts);
router.get("/students", getAllStudents);
router.get("/companies", getAllCompanies);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);
router.get("/internships", getAllInternships);
router.delete("/internships/:id", deleteInternship);
router.get("/applications", getAllApplications);
router.delete("/applications/:id", deleteApplication);

module.exports = router;