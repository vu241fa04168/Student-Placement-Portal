const express = require("express");

const Company = require("../models/Company");
const Application = require("../models/Application");
const Job = require("../models/Job");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);
router.use(requireRole("company"));

function containsIgnoreCase(values, expected) {
    return (values || []).some((item) => item.toLowerCase() === expected.toLowerCase());
}

router.get("/profile", async (req, res) => {
    try {
        const company = await Company.findById(req.user.id).select("-passwordHash");
        if (!company) return res.status(404).json({ message: "Company profile not found" });
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/profile", async (req, res) => {
    try {
        const { companyName, email } = req.body;
        const updates = {};
        if (companyName !== undefined) updates.companyName = companyName;
        if (email !== undefined) updates.email = String(email).trim().toLowerCase();

        const company = await Company.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true
        }).select("-passwordHash");

        if (!company) return res.status(404).json({ message: "Company profile not found" });
        res.json({ message: "Profile updated successfully", company });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// JOB MANAGEMENT

router.get("/jobs", async (req, res) => {
    try {
        const jobs = await Job.find({ company: req.user.id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/jobs", async (req, res) => {
    try {
        const {
            jobTitle,
            jobDescription,
            jobLocation,
            employmentType,
            minCgpa,
            maxBacklogs,
            eligibleBranches,
            eligibleYears,
            requiredLanguages
        } = req.body;

        if (!jobTitle || minCgpa === undefined || maxBacklogs === undefined) {
            return res.status(400).json({ message: "Job title, min CGPA, and max backlogs are required" });
        }

        const job = await Job.create({
            company: req.user.id,
            jobTitle,
            jobDescription,
            jobLocation,
            employmentType,
            minCgpa: Number(minCgpa),
            maxBacklogs: Number(maxBacklogs),
            eligibleBranches: Array.isArray(eligibleBranches) ? eligibleBranches.map(x=>String(x).trim()) : [],
            eligibleYears: Array.isArray(eligibleYears) ? eligibleYears.map(x=>Number(x)) : [],
            requiredLanguages: Array.isArray(requiredLanguages) ? requiredLanguages.map(x=>String(x).trim()) : [],
            isActive: true
        });

        res.status(201).json({ message: "Job created successfully", job });
    } catch (error) {
        console.error("Create job error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/jobs/:id", async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findOne({ _id: jobId, company: req.user.id });
        if (!job) return res.status(404).json({ message: "Job not found" });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/jobs/:id", async (req, res) => {
    try {
        const jobId = req.params.id;
        const {
            jobTitle,
            jobDescription,
            jobLocation,
            employmentType,
            minCgpa,
            maxBacklogs,
            eligibleBranches,
            eligibleYears,
            requiredLanguages,
            isActive
        } = req.body;
        
        const updates = {};
        if (jobTitle !== undefined) updates.jobTitle = jobTitle;
        if (jobDescription !== undefined) updates.jobDescription = jobDescription;
        if (jobLocation !== undefined) updates.jobLocation = jobLocation;
        if (employmentType !== undefined) updates.employmentType = employmentType;
        if (minCgpa !== undefined) updates.minCgpa = Number(minCgpa);
        if (maxBacklogs !== undefined) updates.maxBacklogs = Number(maxBacklogs);
        if (eligibleBranches !== undefined) updates.eligibleBranches = Array.isArray(eligibleBranches) ? eligibleBranches.map(x=>String(x).trim()) : [];
        if (eligibleYears !== undefined) updates.eligibleYears = Array.isArray(eligibleYears) ? eligibleYears.map(x=>Number(x)) : [];
        if (requiredLanguages !== undefined) updates.requiredLanguages = Array.isArray(requiredLanguages) ? requiredLanguages.map(x=>String(x).trim()) : [];
        if (isActive !== undefined) updates.isActive = isActive;

        const job = await Job.findOneAndUpdate(
            { _id: jobId, company: req.user.id },
            updates,
            { new: true }
        );

        if (!job) return res.status(404).json({ message: "Job not found" });
        
        res.json({ message: "Job updated successfully", job });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/jobs/:id", async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findOneAndDelete({ _id: jobId, company: req.user.id });
        if (!job) return res.status(404).json({ message: "Job not found" });

        await Application.deleteMany({ job: jobId });
        
        res.json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// APPLICANTS

router.get("/applicants", async (req, res) => {
    try {
        const {
            jobId,
            branch,
            yearOfStudy,
            language,
            minCgpa,
            maxCurrentBacklogs,
            maxPastBacklogs,
            status,
            sort
        } = req.query;

        // If jobId isn't provided, get all company jobs
        let jobIds = [];
        if (jobId) {
            const job = await Job.findOne({ _id: jobId, company: req.user.id });
            if (!job) return res.status(403).json({ message: "Access denied" });
            jobIds = [jobId];
        } else {
            const jobs = await Job.find({ company: req.user.id });
            jobIds = jobs.map(j => j._id);
        }

        let applications = await Application.find({ job: { $in: jobIds } })
            .populate("student")
            .populate("job")
            .sort({ createdAt: -1 });

        applications = applications.filter((application) => {
            const student = application.student;
            if (!student) return false;

            if (branch && student.branch.toLowerCase() !== branch.toLowerCase()) return false;
            if (yearOfStudy && student.yearOfStudy !== Number(yearOfStudy)) return false;
            if (language && !containsIgnoreCase(student.programmingLanguages, language)) return false;
            if (minCgpa && student.cgpa < Number(minCgpa)) return false;
            if (maxCurrentBacklogs && student.currentBacklogs > Number(maxCurrentBacklogs)) return false;
            if (maxPastBacklogs && student.pastBacklogs > Number(maxPastBacklogs)) return false;
            if (status && application.status !== status) return false;
            return true;
        });

        if (sort === "cgpa_desc") {
            applications.sort((a, b) => b.student.cgpa - a.student.cgpa);
        } else if (sort === "cgpa_asc") {
            applications.sort((a, b) => a.student.cgpa - b.student.cgpa);
        } else if (sort === "name_asc") {
            applications.sort((a, b) => {
                const nameA = `${a.student.firstName} ${a.student.lastName}`;
                const nameB = `${b.student.firstName} ${b.student.lastName}`;
                return nameA.localeCompare(nameB);
            });
        }

        const formattedApplications = applications.map((application) => ({
            id: application._id,
            status: application.status,
            resumeLink: application.resumeLink,
            coverLetter: application.coverLetter,
            appliedAt: application.createdAt,
            jobTitle: application.job ? application.job.jobTitle : "Unknown Job",
            jobId: application.job ? application.job._id : null,
            student: {
                id: application.student._id,
                firstName: application.student.firstName,
                lastName: application.student.lastName,
                rollNumber: application.student.rollNumber,
                branch: application.student.branch,
                yearOfStudy: application.student.yearOfStudy,
                cgpa: application.student.cgpa,
                currentBacklogs: application.student.currentBacklogs,
                pastBacklogs: application.student.pastBacklogs,
                programmingLanguages: application.student.programmingLanguages,
                email: application.student.email,
                phone: application.student.phone
            }
        }));

        res.json(formattedApplications);
    } catch (error) {
        console.error("Applicants error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.patch("/application/:appId", async (req, res) => {
    try {
        const { appId } = req.params;
        const { status } = req.body;

        if (!["applied", "shortlisted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const application = await Application.findById(appId).populate("job");
        if (!application || !application.job || application.job.company.toString() !== req.user.id) {
            return res.status(404).json({ message: "Application not found" });
        }

        application.status = status;
        await application.save();

        res.json({ message: "Status updated", application });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
