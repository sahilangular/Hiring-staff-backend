const express = require("express");
const { getAllRecruiters, getRecruiterById, addRecruiter, getCurrentRecruiter, getRecruitersData } = require("../controllers/recruitersController");

const router = express.Router();

// POST /recruiters
router.post("/", addRecruiter);

// GET current recruiter by email
router.get("/currentRecruiter/:email", getCurrentRecruiter);

// GET all recruiters
router.get("/", getAllRecruiters);
//unique data
router.get("/unique",getRecruitersData)
// GET recruiter by id
router.get('/:id',getRecruiterById)

module.exports = router;
