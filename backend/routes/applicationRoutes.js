const express = require("express");
const router = express.Router();

const {
    applyInternship,
    getCompanyApplications,
    updateApplicationStatus,
    getStudentApplications,
    cancelApplication
} = require("../controllers/applicationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post(
    "/:internshipId",
    authMiddleware,
    roleMiddleware("student"),
    applyInternship
);

router.get(
    "/company",
    authMiddleware,
    roleMiddleware("company"),
    getCompanyApplications
);
router.get(
    "/student",
    authMiddleware,
    roleMiddleware("student"),
    getStudentApplications
);
router.patch(
    "/:applicationId/status",
    authMiddleware,
    roleMiddleware("company"),
    updateApplicationStatus
);
router.delete(
    "/:applicationId",
    authMiddleware,
    roleMiddleware("student"),
    cancelApplication
);

module.exports = router;