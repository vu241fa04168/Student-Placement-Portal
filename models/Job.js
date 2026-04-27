const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        jobTitle: {
            type: String,
            required: true,
            trim: true
        },
        jobDescription: {
            type: String,
            default: "",
            trim: true
        },
        jobLocation: {
            type: String,
            default: "",
            trim: true
        },
        employmentType: {
            type: String,
            default: "",
            trim: true
        },
        minCgpa: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        maxBacklogs: {
            type: Number,
            required: true,
            min: 0
        },
        eligibleBranches: {
            type: [String],
            default: []
        },
        eligibleYears: {
            type: [Number],
            default: []
        },
        requiredLanguages: {
            type: [String],
            default: []
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
