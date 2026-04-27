const express = require("express");

const Student = require("../models/Student");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Application = require("../models/Application");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);
router.use(requireRole("student"));

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesAny(source, target) {
    return target.length === 0 || target.some((item) => source.includes(item));
}

function matchesEligibility(student, job) {
    const normalizedLanguages = (student.programmingLanguages || []).map((item) => item.toLowerCase());
    const requiredLanguages = (job.requiredLanguages || []).map((item) => item.toLowerCase());
    const eligibleBranches = (job.eligibleBranches || []).map((item) => item.toLowerCase());
    const eligibleYears = job.eligibleYears || [];

    const branchOk =
        eligibleBranches.length === 0 ||
        eligibleBranches.includes(student.branch.toLowerCase());
    const yearOk =
        eligibleYears.length === 0 ||
        eligibleYears.includes(student.yearOfStudy);
    const languageOk = includesAny(normalizedLanguages, requiredLanguages);

    return (
        student.cgpa >= job.minCgpa &&
        student.currentBacklogs <= job.maxBacklogs &&
        branchOk &&
        yearOk &&
        languageOk
    );
}

router.get("/profile", async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select("-passwordHash");
        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/profile", async (req, res) => {
    try {
        const allowedFields = [
            "firstName",
            "lastName",
            "branch",
            "yearOfStudy",
            "cgpa",
            "currentBacklogs",
            "pastBacklogs",
            "programmingLanguages",
            "email",
            "phone",
            "address"
        ];

        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.yearOfStudy !== undefined) updates.yearOfStudy = Number(updates.yearOfStudy);
        if (updates.cgpa !== undefined) updates.cgpa = Number(updates.cgpa);
        if (updates.currentBacklogs !== undefined) updates.currentBacklogs = Number(updates.currentBacklogs);
        if (updates.pastBacklogs !== undefined) updates.pastBacklogs = Number(updates.pastBacklogs);
        if (updates.programmingLanguages !== undefined) {
            updates.programmingLanguages = Array.isArray(updates.programmingLanguages)
                ? updates.programmingLanguages.map((item) => String(item).trim()).filter(Boolean)
                : String(updates.programmingLanguages)
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean);
        }

        const student = await Student.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true
        }).select("-passwordHash");

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        res.json({ message: "Profile updated successfully", student });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/eligible-jobs", async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        const {
            companyName,
            jobTitle,
            location,
            employmentType,
            maxMinCgpa,
            maxBacklogsAllowed,
            language,
            branch,
            year,
            sort
        } = req.query;

        const query = { isActive: true };

        if (jobTitle) {
            query.jobTitle = { $regex: escapeRegex(jobTitle), $options: "i" };
        }

        if (location) {
            query.jobLocation = { $regex: escapeRegex(location), $options: "i" };
        }

        if (employmentType) {
            query.employmentType = { $regex: escapeRegex(employmentType), $options: "i" };
        }

        if (maxMinCgpa) {
            query.minCgpa = { $lte: Number(maxMinCgpa) };
        }

        if (maxBacklogsAllowed) {
            query.maxBacklogs = { $lte: Number(maxBacklogsAllowed) };
        }

        if (language) {
            query.requiredLanguages = {
                $elemMatch: { $regex: escapeRegex(language), $options: "i" }
            };
        }

        if (branch) {
            query.$or = [
                { eligibleBranches: { $size: 0 } },
                { eligibleBranches: { $elemMatch: { $regex: `^${escapeRegex(branch)}$`, $options: "i" } } }
            ];
        }

        if (year) {
            const eligibleYear = Number(year);
            query.$and = [
                { $or: [{ eligibleYears: { $size: 0 } }, { eligibleYears: eligibleYear }] }
            ];
        }

        let jobs = await Job.find(query).populate("company", "-passwordHash");

        if (companyName) {
            const regex = new RegExp(escapeRegex(companyName), "i");
            jobs = jobs.filter(j => j.company && regex.test(j.company.companyName));
        }

        jobs = jobs.filter((job) => matchesEligibility(student, job));

        if (sort === "cgpa_asc") {
            jobs.sort((a, b) => a.minCgpa - b.minCgpa);
        } else if (sort === "cgpa_desc") {
            jobs.sort((a, b) => b.minCgpa - a.minCgpa);
        } else if (sort === "company_asc") {
            jobs.sort((a, b) => {
                const cA = a.company ? a.company.companyName : "";
                const cB = b.company ? b.company.companyName : "";
                return cA.localeCompare(cB);
            });
        }

        res.json(jobs);
    } catch (error) {
        console.error("Eligible jobs error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/apply/:jobId", async (req, res) => {
    try {
        const { jobId } = req.params;
        const { resumeLink, coverLetter } = req.body;

        const [student, job] = await Promise.all([
            Student.findById(req.user.id),
            Job.findById(jobId)
        ]);

        if (!student || !job || !job.isActive) {
            return res.status(404).json({ message: "Student or active job not found" });
        }

        if (!matchesEligibility(student, job)) {
            return res.status(403).json({ message: "You are not eligible for this job" });
        }

        const existingApplication = await Application.findOne({
            student: student._id,
            job: job._id
        });

        if (existingApplication) {
            return res.status(400).json({ message: "You have already applied" });
        }

        await Application.create({
            student: student._id,
            job: job._id,
            resumeLink,
            coverLetter
        });

        res.json({ message: "Applied successfully" });
    } catch (error) {
        console.error("Apply error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
