const mongoose = require('mongoose');
const JobPostModel = require('../model/jobspostmodel');

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 154500,
// });

// app.use(limiter);

const jobPost = async (req, res) => {
  const {
    jobTitle,
    jobType,
    jobTiming,
    jobRequirements,
    salaryType,
    salaryMin,
    salaryMax,
    salaryRate,
    supplementalPay,
    benefits,
    language,
    hiringAmount,
    hiringUrgency,
  } = req.body;

  const _jobPost = new JobPostModel({
    userId: req.user._id, // from authenticate middleware
    jobTitle,
    jobType,
    jobTiming,
    jobRequirements,
    salaryType,
    salaryMin,
    salaryMax,
    salaryRate,
    supplementalPay,
    benefits,
    language,
    hiringAmount,
    hiringUrgency,
  });

  try {
    await _jobPost.save();
    res.status(201).json({
      status: true,
      message: 'Job posted successfully',
      jobId: _jobPost._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating job post' });
  }
};

const getJobUsingUserId = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(404).send({ status: false, msg: 'Invalid userID' });
  }

  if (req.user._id.toString() !== userId.toString()) {
    return res.status(401).json({ status: false, msg: 'Unauthorized' });
  }

  try {
    const jobPosts = await JobPostModel.find({ userId });
    if (jobPosts.length === 0) {
      return res
        .status(404)
        .json({ status: false, msg: 'No jobs found with this userId' });
    }
    res
      .status(200)
      .json({ msg: 'Job posts fetched successfully', data: jobPosts });
  } catch (error) {
    res.status(500).json({ status: false, error: 'Error fetching job posts' });
  }
};

const getjobsjobId = async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(jobId))
    return res.status(404).send({ msg: 'Invalid ID' });
  try {
    const job = await JobPostModel.findById(jobId).populate(
      'userId',
      ' UserName email ',
    );

    if (!job) {
      return res
        .status(404)
        .send({ status: false, msg: 'Job not with this jobId found' });
    }
    res
      .status(200)
      .json({ status: true, msg: 'job fetch successfully', data: job });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: false, msg: 'Server error' });
  }
};

const getJobs = async (req, res) => {
  const page = Number(req.query.page) || 1; // la pagina corrente, default 1
  const limit = Number(req.query.limit) || 10; // il numero di elementi per pagina, default 10

  try {
    const jobPosts = await JobPostModel.find({})
      .populate('userId', ' UserName country')
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await JobPostModel.countDocuments(); // conta il totale dei documenti

    res.json({
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      jobPosts,
    });
  } catch (error) {
    res.status(500).json({ status: false, error: 'Error fetching job posts' });
  }
};

const updateJob = async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ error: 'Invalid Job ID' });
  }

  try {
    const updatedJob = await JobPostModel.findByIdAndUpdate(jobId, req.body, {
      new: true,
    });
    if (!updatedJob) return res.status(404).json({ error: 'Job not found' });
    res
      .status(200)
      .json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    res.status(500).json({ error: 'Error updating job' });
  }
};

const deletedJob = async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ error: 'Invalid Job ID' });
  }

  try {
    const deletedJobs = await JobPostModel.findByIdAndDelete(jobId);
    if (!deletedJobs) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting job' });
  }
};

const search = async (req, res, next) => {
  const {
    keyword,
    salaryMin,
    jobTitle,
    salaryMax,
    page = 1,
    limit = 10,
  } = req.query;
  const searchCriteria = {};

  if (keyword) {
    searchCriteria.jobTitle = { $regex: keyword, $options: 'i' };
  }
  if (salaryMin) searchCriteria.salaryMin = { $gte: salaryMin };
  if (salaryMax) searchCriteria.salaryMax = { $lte: salaryMax };
  if (jobTitle) {
    searchCriteria.jobTitle = { $regex: jobTitle, $options: 'i' };
  }
  try {
    const jobs = await JobPostModel.find(searchCriteria)
      .populate('userId', 'UserName email')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const count = await JobPostModel.countDocuments(searchCriteria);

    res.status(200).json({
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      jobs: jobs.map(job => ({
        _id: job._id,
        jobTitle: job.jobTitle,
        jobType: job.jobType,
        jobTiming: job.jobTiming,
        jobRequirements: job.jobRequirements,
        salaryType: job.salaryType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryRate: job.salaryRate,
        supplementalPay: job.supplementalPay,
        benefits: job.benefits,
        language: job.language,
        hiringAmount: job.hiringAmount,
        hiringUrgency: job.hiringUrgency,
        userId: job.userId,
      })),
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
};

module.exports = {
  jobPost,
  getJobUsingUserId,
  getJobs,
  getjobsjobId,
  search,
  deletedJob,
  updateJob,
};
