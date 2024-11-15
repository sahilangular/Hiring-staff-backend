const { client, ObjectId } = require("../config/db");
const recruitersCollection = client
  .db("hiringStaffDB")
  .collection("recruiters");
const jobsCollection = client.db("hiringStaffDB").collection("jobs");

// function for sending responses
const sendResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json(data);
};

exports.addRecruiter = async (req, res) => {
  try {
    const recruiter = req.body;
    const query = { _id: recruiter._id };
    const existingRecruiter = await recruitersCollection.findOne(query);

    if (existingRecruiter) {
      return sendResponse(
        res,
        { message: "Recruiter Already Exists", insertId: null },
        409
      );
    }

    const result = await recruitersCollection.insertOne(recruiter);
    sendResponse(
      res,
      { message: "Recruiter added successfully", insertId: result.insertedId },
      201
    );
  } catch (error) {
    console.error("Error adding Recruiter:", error);
    sendResponse(res, { message: "Failed to add Recruiter" }, 500);
  }
};

// Get current user by email
exports.getCurrentRecruiter = async (req, res) => {
  const email = req.params.email;

  try {
    const result = await recruitersCollection.findOne({ email });

    if (!result) {
      return sendResponse(res, { message: "recruiter not found." }, 404);
    }

    sendResponse(res, result);
  } catch (error) {
    console.error("Error fetching recruiter:", error);
    sendResponse(res, { message: "Failed to fetch recruiter" }, 500);
  }
};

// Get a specific recruiter by ID
exports.getRecruiterById = async (req, res) => {
  const recruiterId = req.params.id;

  // Validate the ObjectId
  if (!ObjectId.isValid(recruiterId)) {
    return sendResponse(res, { message: "Invalid Recruiter ID." }, 400);
  }

  try {
    const result = await recruitersCollection.findOne({
      _id: new ObjectId(recruiterId),
    });

    if (!result) {
      return sendResponse(res, { message: "Recruiter not found." }, 404);
    }

    sendResponse(res, result);
  } catch (error) {
    console.error("Error fetching recruiter by ID: ", error);
    sendResponse(res, { message: "An error occurred." }, 500);
  }
};

// get all recruiter with filtering
exports.getAllRecruiters = async (req, res) => {
  try {
    const industry = req.query.industry || "";
    const location = req.query.location || "";
    const numberOfEmployees = req.query.numberOfEmployees || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const query = {};

    if (industry) {
      query.industry = { $regex: industry, $options: "i" };
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (numberOfEmployees) {
      query.numberOfEmployees = { $regex: numberOfEmployees, $options: "i" };
    }

    const recruiters = await recruitersCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    if (recruiters.length === 0) {
      return res.status(404).json({ message: "No recruiters found" });
    }

    const totalRecruiters = await recruitersCollection.countDocuments(query);

    res.json({
      totalPages: Math.ceil(totalRecruiters / limit),
      currentPage: page,
      totalRecruiters,
      recruiters,
    });
  } catch (error) {
    console.error("Error fetching recruiters:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch recruiters", error: error.message });
  }
};


exports.getRecruitersData = async (req, res) => {
  try {
    const [industries, locations, numberOfEmployees] = await Promise.all([
      recruitersCollection
        .aggregate([
          {
            $group: {
              _id: { $ifNull: ["$industry", "Unknown Industry"] },
            },
          },
          {
            $project: {
              _id: 0,
              industry: "$_id",
            },
          },
          {
            $sort: { industry: 1 },
          },
        ])
        .toArray(),

      recruitersCollection
        .aggregate([
          {
            $group: {
              _id: { $ifNull: ["$location", "Unknown Location"] },
            },
          },
          {
            $project: {
              _id: 0,
              location: "$_id",
            },
          },
          {
            $sort: { location: 1 },
          },
        ])
        .toArray(),

      recruitersCollection
        .aggregate([
          {
            $group: {
              _id: { $ifNull: ["$numberOfEmployees", "Unknown Team Size"] },
            },
          },
          {
            $project: {
              _id: 0,
              numberOfEmployees: "$_id",
            },
          },
          {
            $sort: { numberOfEmployees: 1 },
          },
        ])
        .toArray(),
    ]);


    const flatIndustries = industries.map((i) => i.industry);
    const flatLocations = locations.map((l) => l.location);
    const flatNumberOfEmployees = numberOfEmployees.map((ts) => ts.numberOfEmployees);

    res.json({
      industries: flatIndustries,
      locations: flatLocations,
      numberOfEmployees: flatNumberOfEmployees,
    });
  } catch (error) {
    console.error("Error fetching recruiters data:", error);
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
};

// delete recruiters data
exports.deleteRecruiters = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return sendResponse(res, { message: "Invalid Recruiters ID" }, 400);
  }

  try {
    const query = { _id: new ObjectId(id) };
    const result = await recruitersCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return sendResponse(res, { message: "Recruiters not found" }, 404);
    }

    sendResponse(res, {
      message: "Recruiters deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting Recruiters:", error);
    sendResponse(res, { message: "Failed to delete user" }, 500);
  }
};

exports.getRecruiterOpenJobsById = async (req, res) => {
  try {
    const jobId = req.params.id || "";

    if (!ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid Job ID" });
    }

    const jobs = await jobsCollection
      .find({
        recruiter_id: jobId,
      })
      .toArray();

    if (jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found for this recruiter" });
    }

    res.json(jobs);
  } catch (error) {
    console.error("Error retrieving Recruiter Open Jobs:", error);

    return res.status(500).json({
      message: "Failed to retrieve open jobs for this recruiter",
    });
  }
};

// Update Recruiter profile
exports.updateRecruiterProfile = async (req, res) => {
  const email = req.params.email;
  const updatedData = req.body;
  try {
    const result = await recruitersCollection.updateOne(
      { email },
      { $set: updatedData }
    );

    if (result.modifiedCount === 0) {
      return sendResponse(res, { message: "No changes made" }, 204);
    }

    sendResponse(res, { modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error updating Recruiter profile:", error);
    sendResponse(res, { message: "Failed to update Recruiter profile" }, 500);
  }
};