const Application = require("../models/Application");
const User = require("../models/User");

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res) => {
  try {
    // Total students registered (users)
    const totalStudents = await User.countDocuments({ role: "user" });

    // Total forms submitted
    const totalFormsSubmitted = await Application.countDocuments({
      status: "submitted",
    });

    // Total payments completed
    const totalPaymentsCompleted = await Application.countDocuments({
      paymentStatus: "completed",
    });

    // Additional useful stats
    const totalApplications = await Application.countDocuments();
    const draftApplications = await Application.countDocuments({
      status: "draft",
    });
    const pendingPayments = await Application.countDocuments({
      paymentStatus: "pending",
    });

    // Total revenue
    const revenueResult = await Application.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);
    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentApplications = await Application.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Applications by course
    const applicationsByCourse = await Application.aggregate([
      { $match: { status: "submitted" } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        // Main stats
        totalStudents,
        totalFormsSubmitted,
        totalPaymentsCompleted,

        // Additional stats
        totalApplications,
        draftApplications,
        pendingPayments,
        totalRevenue,
        recentApplications,

        // Course distribution
        topCourses: applicationsByCourse.map((item) => ({
          course: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

/**
 * @desc    Get list of all students with applications
 * @route   GET /api/admin/dashboard/students
 * @access  Private (Admin)
 */
const getStudentsList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      paymentStatus,
      course,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Search by name, email, or mobile
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { applicationNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by course
    if (course) {
      query.course = { $regex: course, $options: "i" };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get applications with pagination
    const applications = await Application.find(query)
      .select(
        "fullName fatherName mobile email course twelfthMarks paymentStatus transactionId amount applicationNumber status submittedAt paymentDate createdAt",
      )
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "mobile email");

    // Get total count
    const totalCount = await Application.countDocuments(query);

    // Format response
    const students = applications.map((app) => ({
      id: app._id,
      applicationNumber: app.applicationNumber,
      name: app.fullName,
      fatherName: app.fatherName,
      mobile: app.mobile,
      email: app.email,
      course: app.course,
      twelfthMarks: app.twelfthMarks,
      paymentStatus: app.paymentStatus,
      transactionId: app.transactionId || "N/A",
      amount: app.amount,
      status: app.status,
      submittedAt: app.submittedAt,
      paymentDate: app.paymentDate,
      appliedOn: app.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalRecords: totalCount,
          recordsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get Students List Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students list",
    });
  }
};

/**
 * @desc    Get single student/application details
 * @route   GET /api/admin/dashboard/students/:id
 * @access  Private (Admin)
 */
const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id).populate(
      "userId",
      "mobile email name isVerified createdAt",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { application },
    });
  } catch (error) {
    console.error("Get Student Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student details",
    });
  }
};

/**
 * @desc    Get payment statistics
 * @route   GET /api/admin/dashboard/payments
 * @access  Private (Admin)
 */
const getPaymentStats = async (req, res) => {
  try {
    // Total payments
    const totalPayments = await Application.countDocuments({
      paymentStatus: "completed",
    });

    const pendingPayments = await Application.countDocuments({
      paymentStatus: "pending",
      status: "submitted",
    });

    const failedPayments = await Application.countDocuments({
      paymentStatus: "failed",
    });

    // Revenue
    const revenueResult = await Application.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);
    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent payments (last 10)
    const recentPayments = await Application.find({
      paymentStatus: "completed",
    })
      .select("applicationNumber fullName amount transactionId paymentDate")
      .sort({ paymentDate: -1 })
      .limit(10);

    // Daily revenue (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Application.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          paymentDate: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        pendingPayments,
        failedPayments,
        totalRevenue,
        recentPayments: recentPayments.map((p) => ({
          applicationNumber: p.applicationNumber,
          name: p.fullName,
          amount: p.amount,
          transactionId: p.transactionId,
          date: p.paymentDate,
        })),
        dailyRevenue: dailyRevenue.map((d) => ({
          date: d._id,
          revenue: d.revenue,
          count: d.count,
        })),
      },
    });
  } catch (error) {
    console.error("Get Payment Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
    });
  }
};

/**
 * @desc    Export students data to CSV
 * @route   GET /api/admin/dashboard/export
 * @access  Private (Admin)
 */
const exportStudentsData = async (req, res) => {
  try {
    const { paymentStatus, course } = req.query;

    // Build query
    const query = {};
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (course) query.course = { $regex: course, $options: "i" };

    // Get all applications
    const applications = await Application.find(query)
      .select(
        "applicationNumber fullName fatherName mobile email course twelfthMarks paymentStatus transactionId amount paymentDate submittedAt",
      )
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeader =
      "Application Number,Full Name,Father Name,Mobile,Email,Course,12th Marks,Payment Status,Transaction ID,Amount,Payment Date,Submitted At\n";

    const csvData = applications
      .map((app) => {
        return [
          app.applicationNumber,
          app.fullName,
          app.fatherName,
          app.mobile,
          app.email,
          app.course,
          app.twelfthMarks,
          app.paymentStatus,
          app.transactionId || "N/A",
          app.amount,
          app.paymentDate ? new Date(app.paymentDate).toLocaleString() : "N/A",
          app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "N/A",
        ].join(",");
      })
      .join("\n");

    const csv = csvHeader + csvData;

    // Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="students_${Date.now()}.csv"`,
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data",
    });
  }
};

module.exports = {
  getDashboardStats,
  getStudentsList,
  getStudentDetails,
  getPaymentStats,
  exportStudentsData,
};
