const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
{
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    companyName: {
        type: String,
        required: true
    },

    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Internship",
        required: true
    },

    internshipTitle: {
        type: String,
        required: true
    },

    reportType: {
        type: String,
        enum: ["Fake Company", "Fake Internship", "Scam", "Spam", "Inappropriate Content", "Other"],
        required: true
    },

    description: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["Pending", "Reviewed", "Resolved"],
        default: "Pending"
    }
},
{
    timestamps: true
});

reportSchema.index({ student: 1, internship: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);