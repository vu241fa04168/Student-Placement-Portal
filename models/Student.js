const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        rollNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        branch: {
            type: String,
            required: true,
            trim: true
        },
        yearOfStudy: {
            type: Number,
            required: true,
            min: 1,
            max: 6
        },
        cgpa: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        currentBacklogs: {
            type: Number,
            required: true,
            min: 0
        },
        pastBacklogs: {
            type: Number,
            default: 0,
            min: 0
        },
        programmingLanguages: {
            type: [String],
            default: []
        },
        email: {
            type: String,
            default: "",
            trim: true
        },
        phone: {
            type: String,
            default: "",
            trim: true
        },
        address: {
            type: String,
            default: "",
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
