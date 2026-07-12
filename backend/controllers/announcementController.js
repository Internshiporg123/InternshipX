const Announcement = require("../models/Announcement");

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required."
            });
        }

        const announcement = await Announcement.create({
            title,
            content,
            postedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Announcement created successfully.",
            announcement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate("postedBy", "name")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            announcements
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: "Announcement not found." });
        }

        if (title) announcement.title = title;
        if (content) announcement.content = content;

        await announcement.save();

        res.json({
            success: true,
            message: "Announcement updated successfully.",
            announcement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: "Announcement not found." });
        }

        res.json({
            success: true,
            message: "Announcement deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};