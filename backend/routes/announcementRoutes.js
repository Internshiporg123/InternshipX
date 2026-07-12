const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement
} = require("../controllers/announcementController");

router.get("/", authMiddleware, getAnnouncements);

router.post("/", authMiddleware, roleMiddleware("admin"), createAnnouncement);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateAnnouncement);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteAnnouncement);

module.exports = router;