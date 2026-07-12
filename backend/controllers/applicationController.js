const Application = require("../models/Application");
const Internship = require("../models/Internship");
const User = require("../models/User");

exports.applyInternship = async (req, res) => {
    try {

        const internshipId = req.params.internshipId;
        const studentId = req.user.id;

        const internship = await Internship.findById(internshipId);

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: "Internship not found"
            });
        }

        const existing = await Application.findOne({
            internship: internshipId,
            student: studentId
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Already applied"
            });
        }

        const student = await User.findById(studentId);

        const application = await Application.create({
            internship: internshipId,
            student: studentId,
            resume: student ? student.resumeUrl : ""
        });

        res.status(201).json({
            success: true,
            message: "Applied successfully",
            application
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.getCompanyApplications = async (req, res) => {
    try {

        const internships = await Internship.find({
            postedBy: req.user.id
        });

        const internshipIds = internships.map(i => i._id);

        const applications = await Application.find({
            internship: { $in: internshipIds }
        })
        .populate("student", "name email phone college skills resumeUrl resumeName")
        .populate("internship", "title companyName");

        res.json({
            success: true,
            count: applications.length,
            applications
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {

        const { applicationId } = req.params;
        const { status } = req.body;

        const allowedStatus = [
            "Pending",
            "Reviewed",
            "Accepted",
            "Rejected"
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        const application = await Application.findById(applicationId)
            .populate("internship");

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        if (
            application.internship.postedBy.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized."
            });
        }

        application.status = status;

        await application.save();

        res.json({
            success: true,
            message: "Application status updated.",
            application
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};
exports.getStudentApplications = async (req, res) => {
    try {

        const applications = await Application.find({
            student: req.user.id
        })
        .populate(
            "internship",
            "title companyName location stipend duration postedBy"
        )
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: applications.length,
            applications
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

exports.cancelApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const application = await Application.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        if (application.student.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized to cancel this application."
            });
        }

        await Application.findByIdAndDelete(applicationId);

        res.json({
            success: true,
            message: "Application cancelled successfully."
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};