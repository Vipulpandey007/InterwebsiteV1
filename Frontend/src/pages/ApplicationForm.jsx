import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applicationAPI } from "../services/api";
import toast from "react-hot-toast";

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    email: "",
    mobile: "",
    address: "",
    course: "",
    twelfthMarks: "",
  });

  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      const response = await applicationAPI.getMyApplications();
      if (response.data.data.applications.length > 0) {
        const app = response.data.data.applications[0];
        if (app.status === "submitted") {
          toast.error("You have already submitted an application");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking application:", error);
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.fullName || formData.fullName.length < 2) {
      toast.error("Please enter a valid full name");
      return false;
    }
    if (!formData.fatherName || formData.fatherName.length < 2) {
      toast.error("Please enter father's name");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (formData.mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (!formData.address || formData.address.length < 10) {
      toast.error("Please enter a complete address (min 10 characters)");
      return false;
    }
    if (!formData.course) {
      toast.error("Please select a course");
      return false;
    }
    const marks = parseFloat(formData.twelfthMarks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      toast.error("Please enter valid 12th marks (0-100)");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await applicationAPI.create(formData);
      if (response.data.success) {
        toast.success("Application created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create application",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Admission Application Form
              </h1>
              <p className="text-gray-600 mt-2">
                Fill in your details carefully
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-8"
        >
          {/* Personal Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Father's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter father's name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "mobile",
                        value: e.target.value.replace(/\D/g, "").slice(0, 10),
                      },
                    })
                  }
                  className="input-field"
                  placeholder="10-digit mobile number"
                  required
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your complete address"
                  rows="3"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Academic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="input-field"
                  required
                  disabled={loading}
                >
                  <option value="">Select Course</option>
                  <option value="B.Tech Computer Science">
                    B.Tech Computer Science
                  </option>
                  <option value="B.Tech Mechanical Engineering">
                    B.Tech Mechanical Engineering
                  </option>
                  <option value="B.Tech Civil Engineering">
                    B.Tech Civil Engineering
                  </option>
                  <option value="B.Tech Electrical Engineering">
                    B.Tech Electrical Engineering
                  </option>
                  <option value="B.Com">B.Com</option>
                  <option value="BBA">BBA</option>
                  <option value="BA">BA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  12th Marks (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="twelfthMarks"
                  value={formData.twelfthMarks}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter marks (0-100)"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
