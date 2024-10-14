const { client, ObjectId } = require("../config/db");
const recruitersCollection = client
  .db("hiringStaffDB")
  .collection("recruiters");

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

// Get all recruiters - Search by jobTitle and category
exports.getAllRecruiters = async (req, res) => {
  const { jobTitle, category } = req.query;

  const query = {};

  if (jobTitle || category) {
    const jobPostingsQuery = [];

    if (jobTitle) {
      jobPostingsQuery.push({
        "jobPostings.jobTitle": { $regex: jobTitle, $options: "i" },
      });
    }

    if (category) {
      jobPostingsQuery.push({
        "jobPostings.category": { $regex: category, $options: "i" },
      });
    }

    query.jobPostings = { $or: jobPostingsQuery };
  }

  try {
    const result = await recruitersCollection.find(query).toArray();
    sendResponse(res, result);
  } catch (error) {
    console.error("Error fetching recruiters: ", error);
    sendResponse(
      res,
      { message: "An error occurred while fetching recruiters.", error },
      500
    );
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
