import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applicationAPI, paymentAPI, pdfAPI } from "../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const response = await applicationAPI.getMyApplications();
      if (response.data.data.applications.length > 0) {
        setApplication(response.data.data.applications[0]);
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast.error("Failed to fetch application");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!application) return;

    try {
      const response = await applicationAPI.submit(application._id);
      if (response.data.success) {
        toast.success("Application submitted successfully!");
        fetchApplication();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit application",
      );
    }
  };

  // ============ RAZORPAY PAYMENT INTEGRATION ============
  const handlePayment = async () => {
    if (!application) return;

    setPaymentLoading(true);
    try {
      // Step 1: Create Razorpay order
      const orderResponse = await paymentAPI.createOrder(application._id);
      const orderData = orderResponse.data.data;

      // Step 2: Configure Razorpay checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: "College Admission",
        description: "Application Fee",
        order_id: orderData.orderId,
        prefill: {
          name: orderData.name,
          email: orderData.email,
          contact: orderData.mobile,
        },
        theme: {
          color: "#3399cc",
        },
        // Step 3: Payment success handler
        handler: async function (response) {
          try {
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              applicationId: application._id,
            });

            if (verifyResponse.data.success) {
              toast.success("Payment successful!");
              fetchApplication();
            }
          } catch (error) {
            toast.error("Payment verification failed");
          } finally {
            setPaymentLoading(false);
          }
        },
        // Step 4: Payment cancelled handler
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setPaymentLoading(false);
          },
        },
      };

      // Step 5: Open Razorpay checkout modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to initiate payment",
      );
      setPaymentLoading(false);
    }
  };

  // ============ PDF GENERATION & DOWNLOAD ============
  const handleGeneratePDF = async () => {
    if (!application) return;

    try {
      const response = await pdfAPI.generate(application._id);
      if (response.data.success) {
        toast.success("Application Form generated!");
        fetchApplication();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate application form",
      );
    }
  };

  const handleDownloadPDF = () => {
    if (!application) return;
    window.open(pdfAPI.downloadURL(application._id), "_blank");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Student Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome</p>
                <p className="text-sm font-semibold text-gray-800">
                  {user?.name}
                </p>
              </div>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No Application */}
        {!application && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Application Found
            </h2>
            <p className="text-gray-600 mb-8">
              Start your admission process by filling the application form
            </p>
            <button onClick={() => navigate("/apply")} className="btn-primary">
              Fill Application Form
            </button>
          </div>
        )}

        {/* Application Exists */}
        {application && (
          <div className="space-y-6">
            {/* Application Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Application Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Application Number
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {application.applicationNumber}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {application.fullName}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Course</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {application.appliedFor}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">12th Marks</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {application.marksObtained}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Application Status
                  </p>
                  <span className={`badge-${application.status}`}>
                    {application.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <span className={`badge-${application.paymentStatus}`}>
                    {application.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                {/* Step 1: Submit Application */}
                {application.status === "draft" && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          Submit Your Application
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Review your application details and submit it to
                          proceed with payment
                        </p>
                        <button
                          onClick={handleSubmitApplication}
                          className="btn-primary"
                        >
                          Submit Application
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Make Payment - RAZORPAY BUTTON */}
                {application.status === "submitted" &&
                  application.paymentStatus === "pending" && (
                    <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          2
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            Pay Application Fee
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Complete your payment of ₹{application.amount} to
                            proceed
                          </p>
                          <button
                            onClick={handlePayment}
                            disabled={paymentLoading}
                            className="btn-primary"
                          >
                            {paymentLoading ? (
                              <span className="flex items-center gap-2">
                                <svg
                                  className="animate-spin h-5 w-5"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Processing...
                              </span>
                            ) : (
                              `Pay ₹${application.amount}`
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Step 3: Download Application Form - PDF BUTTONS */}
                {application.paymentStatus === "completed" && (
                  <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          Download Application Form
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Your payment is completed. Generate and download your
                          application form
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {application.admitCardGenerated ? (
                            <>
                              <button
                                onClick={handleDownloadPDF}
                                className="btn-primary"
                              >
                                Download Application Form
                              </button>
                              <button
                                onClick={handleGeneratePDF}
                                className="btn-outline"
                              >
                                Regenerate
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleGeneratePDF}
                              className="btn-primary"
                            >
                              Generate Admit Card
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Details (if completed) */}
                {application.paymentStatus === "completed" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Transaction ID</p>
                        <p className="font-mono text-sm font-semibold text-gray-800">
                          {application.transactionId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount Paid</p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{application.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(application.paymentDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Mode</p>
                        <p className="font-semibold text-gray-800">
                          Online (Razorpay)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
