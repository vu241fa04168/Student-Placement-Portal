const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true
        },
        status: {
            type: String,
            enum: ["applied", "shortlisted", "rejected"],
            default: "applied"
        },
        resumeLink: {
            type: String,
            default: "",
            trim: true
        },
        coverLetter: {
            type: String,
            default: "",
            trim: true
        }
    },
    { timestamps: true }
);

applicationSchema.index({ student: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
