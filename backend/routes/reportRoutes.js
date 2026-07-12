const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    submitReport,
    getReports,
    updateReportStatus,
    deleteReport
} = require("../controllers/reportController");

router.post("/", authMiddleware, roleMiddleware("student"), submitReport);

router.get("/", authMiddleware, roleMiddleware("admin"), getReports);
router.put("/:id/status", authMiddleware, roleMiddleware("admin"), updateReportStatus);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteReport);

module.exports = router;