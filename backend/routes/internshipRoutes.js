const express = require("express");

const router = express.Router();

const {
    createInternship,
    getCompanyInternships,
    getAllInternships,
    getPublicInternships,
    deleteInternship,
    updateInternship,
    getInternshipById
} = require("../controllers/internshipController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
    "/public/latest",
    getPublicInternships
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("company"),
    createInternship
);

router.get(
    "/company",
    authMiddleware,
    roleMiddleware("company"),
    getCompanyInternships
);

router.get(
    "/",
    authMiddleware,
    getAllInternships
);

router.get(
    "/:id",
    authMiddleware,
    getInternshipById
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("company"),
    deleteInternship
);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("company"),
    updateInternship
);
module.exports = router;