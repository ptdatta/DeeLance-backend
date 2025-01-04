const Proposal = require('../model/proposalModel');
const JobPost = require('../model/jobspostmodel');

const jobIdproposals = async (req, res) => {
  const { jobId } = req.params;
  const { coverLetter, proposedRate } = req.body;

  try {
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const newProposal = new Proposal({
      jobId,
      freelancerId: req.user._id,
      coverLetter,
      proposedRate,
    });
    await newProposal.save();
    res.status(201).json({
      message: 'Proposal submitted successfully',
      proposal: newProposal,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting proposal' });
  }
};

const getproposals = async (req, res) => {
  const { jobId } = req.params;

  try {
    const proposals = await Proposal.find({ jobId }).populate(
      'freelancerId',
      'userName email',
    );
    if (!proposals)
      return res.status(404).json({ error: 'No proposals found' });
    res.status(200).json({ proposals });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching proposals' });
  }
};
module.exports = { jobIdproposals, getproposals };
