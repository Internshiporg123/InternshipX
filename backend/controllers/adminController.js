const User = require("../models/User");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const Report = require("../models/Report");

exports.getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalCompanies = await User.countDocuments({ role: "company" });
        const totalInternships = await Internship.countDocuments();
        const totalApplications = await Application.countDocuments();
        const pendingApplications = await Application.countDocuments({ status: "Pending" });

        const activeCompanies = await User.find({ role: "company", isBlocked: false }).select("_id");
        const companyIds = activeCompanies.map(c => c._id);
        const activeInternships = await Internship.countDocuments({ postedBy: { $in: companyIds } });

        const recentRegistrations = await User.find({ role: { $in: ["student", "company"] } })
            .select("name role createdAt")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentReports = await Report.find()
            .select("reportType companyName internshipTitle createdAt")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentInternships = await Internship.find()
            .select("title companyName createdAt")
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalCompanies,
                totalInternships,
                totalApplications,
                pendingApplications,
                activeInternships
            },
            recentInsights: {
                registrations: recentRegistrations,
                reports: recentReports,
                internships: recentInternships
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDashboardCharts = async (req, res) => {
    try {
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);

        const registrations = await User.aggregate([
            {
                $match: {
                    role: { $in: ["student", "company"] },
                    createdAt: { $gte: lastYear }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        role: "$role"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        const applications = await Application.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastYear }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        const studentCount = await User.countDocuments({ role: "student" });
        const companyCount = await User.countDocuments({ role: "company" });

        const categories = await Internship.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "postedBy",
                    foreignField: "_id",
                    as: "company"
                }
            },
            {
                $unwind: "$company"
            },
            {
                $group: {
                    _id: { $ifNull: ["$company.industry", "Other"] },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            charts: {
                registrations,
                applications,
                studentsVsCompanies: {
                    students: studentCount,
                    companies: companyCount
                },
                categories
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const query = { role: "student" };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { college: { $regex: search, $options: "i" } }
            ];
        }

        const students = await User.find(query)
            .select("-password -otp -otpExpiry")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            students,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const query = { role: "company" };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { industry: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }

        const companies = await User.find(query)
            .select("-password -otp -otpExpiry")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            companies,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role === "admin") {
            return res.status(400).json({ success: false, message: "Admins cannot be blocked." });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
            isBlocked: user.isBlocked
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.role === "admin") {
            return res.status(400).json({ success: false, message: "Admins cannot be deleted." });
        }

        if (user.role === "student") {

            await Application.deleteMany({ student: user._id });
            await Report.deleteMany({ student: user._id });
        } else if (user.role === "company") {
            const internships = await Internship.find({ postedBy: user._id }).select("_id");
            const internshipIds = internships.map(i => i._id);

            await Application.deleteMany({ internship: { $in: internshipIds } });

            await Report.deleteMany({ internship: { $in: internshipIds } });

            await Internship.deleteMany({ postedBy: user._id });
        }

        await User.findByIdAndDelete(user._id);

        res.json({
            success: true,
            message: "User and all associated data deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllInternships = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const companyName = req.query.companyName || "";

        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        if (companyName) {
            query.companyName = { $regex: companyName, $options: "i" };
        }

        const internships = await Internship.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Internship.countDocuments(query);

        res.json({
            success: true,
            internships,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteInternship = async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) {
            return res.status(404).json({ success: false, message: "Internship not found." });
        }

        await Application.deleteMany({ internship: internship._id });
        await Report.deleteMany({ internship: internship._id });

        await Internship.findByIdAndDelete(internship._id);

        res.json({
            success: true,
            message: "Internship and associated applications/reports deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllApplications = async (req, res) => {
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

        let applications = await Application.find(query)
            .populate("student", "name email")
            .populate("internship", "title companyName")
            .sort({ createdAt: -1 });

        if (search) {
            applications = applications.filter(app => {
                const studentName = app.student?.name || "";
                const internshipTitle = app.internship?.title || "";
                const companyName = app.internship?.companyName || "";
                return (
                    studentName.toLowerCase().includes(search.toLowerCase()) ||
                    internshipTitle.toLowerCase().includes(search.toLowerCase()) ||
                    companyName.toLowerCase().includes(search.toLowerCase())
                );
            });
        }

        const total = applications.length;
        const paginatedApplications = applications.slice(skip, skip + limit);

        res.json({
            success: true,
            applications: paginatedApplications,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findByIdAndDelete(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        res.json({
            success: true,
            message: "Application deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password -otp -otpExpiry");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};