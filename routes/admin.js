const express = require("express");

const Student = require("../models/Student");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);
router.use(requireRole("admin"));

router.get("/users", async (req, res) => {
    try {
        const [students, companies] = await Promise.all([
            Student.find().select("-passwordHash").sort({ createdAt: -1 }),
            Company.find().select("-passwordHash").sort({ createdAt: -1 })
        ]);

        res.json({
            students,
            companies
        });
    } catch (error) {
        console.error("Admin users error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/applications", async (req, res) => {
    try {
        const applications = await Application.find()
            .populate("student")
            .populate({
                path: "job",
                populate: { path: "company" }
            })
            .sort({ createdAt: -1 });

        const formattedApplications = applications.map((application) => ({
            id: application._id,
            status: application.status,
            appliedAt: application.createdAt,
            studentName: application.student
                ? `${application.student.firstName} ${application.student.lastName}`
                : "Unknown student",
            companyName: application.job && application.job.company
                ? application.job.company.companyName
                : "Unknown company",
            jobTitle: application.job ? application.job.jobTitle : "Unknown Job",
            studentBranch: application.student ? application.student.branch : "",
            studentCgpa: application.student ? application.student.cgpa : ""
        }));

        res.json(formattedApplications);
    } catch (error) {
        console.error("Admin applications error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        await Application.deleteMany({ student: id });

        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error("Admin delete student error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/companies/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const company = await Company.findByIdAndDelete(id);

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }

        const companyJobs = await Job.find({ company: id });
        const jobIds = companyJobs.map(j => j._id);
        
        await Application.deleteMany({ job: { $in: jobIds } });
        await Job.deleteMany({ company: id });

        res.json({ message: "Company and related jobs deleted successfully" });
    } catch (error) {
        console.error("Admin delete company error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
