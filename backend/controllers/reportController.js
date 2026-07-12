const User = require("../models/User");
const Internship = require("../models/Internship");
const Report = require("../models/Report");

exports.submitReport = async (req, res) => {
    try {
        const { internshipId, reportType, description } = req.body;
        const studentId = req.user.id;

        if (!internshipId || !reportType || !description) {
            return res.status(400).json({
                success: false,
                message: "All report fields are required."
            });
        }

        const student = await User.findById(studentId);
        if (!student || student.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students are allowed to report internships."
            });
        }

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            return res.status(404).json({
                success: false,
                message: "Internship not found."
            });
        }

        const existingReport = await Report.findOne({ student: studentId, internship: internshipId });
        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this internship."
            });
        }

        const company = await User.findById(internship.postedBy);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company associated with this internship not found."
            });
        }

        const report = await Report.create({
            student: studentId,
            studentName: student.name,
            company: company._id,
            companyName: company.name,
            internship: internship._id,
            internshipTitle: internship.title,
            reportType,
            description
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully. Thank you for making our platform safer.",
            report
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this internship."
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const status = req.query.status || "";

        const query = {};
        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { studentName: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
                { internshipTitle: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { reportType: { $regex: search, $options: "i" } }
            ];
        }

        const reports = await Report.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Report.countDocuments(query);

        res.json({
            success: true,
            reports,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Reviewed", "Resolved"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value. Must be 'Reviewed' or 'Resolved'."
            });
        }

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        report.status = status;
        await report.save();

        res.json({
            success: true,
            message: `Report status updated to ${status}.`,
            report
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        res.json({
            success: true,
            message: "Report deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};