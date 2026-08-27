const { getEmployeeWorkload, getTeamWorkloadOverview } = require('../services/workloadEngine');

/**
 * @desc    Get team workload overview
 * @route   GET /api/workload
 * @access  Private (Manager)
 */
const getWorkloadOverview = async (req, res) => {
  try {
    const teamWorkload = await getTeamWorkloadOverview();
    res.status(200).json({
      success: true,
      teamWorkload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching workload overview',
    });
  }
};

/**
 * @desc    Get personal workload (Employee)
 * @route   GET /api/workload/my
 * @access  Private (Employee)
 */
const getMyWorkload = async (req, res) => {
  try {
    const workload = await getEmployeeWorkload(req.user._id);
    res.status(200).json({
      success: true,
      workload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching personal workload',
    });
  }
};

module.exports = {
  getWorkloadOverview,
  getMyWorkload,
};
