import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { applicationAPI } from "../services/api";
import toast from "react-hot-toast";

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    appliedFor: "",
    session: "2026-2027",
    referenceNumber: "",
    fullName: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "",
    category: "",
    religion: "",
    contactNo: "",
    whatsappNo: "",
    guardianContactNo: "",
    email: "",
    aadharCard: "",
    bloodGroup: "",
    motherTongue: "",
    studentHeight: "",
    studentWeight: "",
    presentAddress: "",
    permanentAddress: "",
    aaparId: "",
    nationality: "Indian",
    schoolName: "",
    board: "",
    subject: "",
    marksObtained: "",
    totalMarks: "",
    percentage: "",
    grade: "",
    yearOfPassing: "",
    division: "",
    disclaimerAgreed: false,
  });

  const [files, setFiles] = useState({
    studentPhoto: null,
    tenthMarksheet: null,
    tenthAdmitCard: null,
    transferCertificate: null,
    characterCertificate: null,
    migration: null,
    casteCertificate: null,
    bplCertificate: null,
    aadharCardDoc: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    const file = uploadedFiles[0];
    if (file) {
      if (name === "studentPhoto") {
        if (!file.type.startsWith("image/")) {
          toast.error("Please upload an image file");
          return;
        }
      } else if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFiles((prev) => ({ ...prev, [name]: file }));
      toast.success(`${file.name} uploaded`);
    }
  };

  const removeFile = (fieldName) => {
    setFiles((prev) => ({ ...prev, [fieldName]: null }));
    toast.success("File removed");
  };

  const handleMarksChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    if (name === "marksObtained" || name === "totalMarks") {
      const marks = parseFloat(
        name === "marksObtained" ? value : newFormData.marksObtained,
      );
      const total = parseFloat(
        name === "totalMarks" ? value : newFormData.totalMarks,
      );
      if (marks && total && total > 0) {
        newFormData.percentage = ((marks / total) * 100).toFixed(2);
      }
    }
    setFormData(newFormData);
  };

  const copyAddress = () => {
    setFormData((prev) => ({ ...prev, permanentAddress: prev.presentAddress }));
    toast.success("Address copied");
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.appliedFor || !formData.session) {
        toast.error("Please fill all required fields");
        return false;
      }
    }
    if (step === 2) {
      const required = [
        "fullName",
        "fatherName",
        "motherName",
        "dateOfBirth",
        "gender",
        "category",
        "religion",
        "contactNo",
        "guardianContactNo",
        "email",
        "aadharCard",
        "motherTongue",
        "studentHeight",
        "studentWeight",
      ];
      for (let field of required) {
        if (!formData[field]) {
          toast.error("Please fill all required personal details");
          return false;
        }
      }
      if (!/^[0-9]{10}$/.test(formData.contactNo)) {
        toast.error("Contact number must be 10 digits");
        return false;
      }
      if (!/^[0-9]{12}$/.test(formData.aadharCard)) {
        toast.error("Aadhar card must be 12 digits");
        return false;
      }
    }
    if (step === 3) {
      if (
        !formData.presentAddress ||
        !formData.permanentAddress ||
        !formData.nationality
      ) {
        toast.error("Please fill all address details");
        return false;
      }
    }
    if (step === 4) {
      const required = [
        "schoolName",
        "board",
        "subject",
        "marksObtained",
        "totalMarks",
        "percentage",
        "yearOfPassing",
      ];
      for (let field of required) {
        if (!formData[field]) {
          toast.error("Please fill all educational qualification details");
          return false;
        }
      }
    }
    if (step === 5) {
      if (!files.studentPhoto) {
        toast.error("Please upload student photo");
        return false;
      }
      if (!files.tenthMarksheet) {
        toast.error("Please upload 10th marksheet");
        return false;
      }
      if (!files.aadharCardDoc) {
        toast.error("Please upload Aadhar card document");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(5)) return;
    if (!formData.disclaimerAgreed) {
      toast.error("You must agree to the disclaimer");
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          submitData.append(key, formData[key]);
        }
      });
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      const response = await applicationAPI.createWithFiles(submitData);
      if (response.data.success) {
        toast.success("Application submitted successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit application",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center">
              <img
                src="/logo.svg"
                alt="College Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                GOSSNER INTERMEDIATE COLLEGE, RANCHI
              </h1>
              <p className="text-sm text-gray-600">
                Niral Enem Horo Marg, G.E.L. Church Compound, Ranchi-834001,
                Jharkhand
              </p>
              <p className="text-sm text-gray-600">
                Fill the application form carefully
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="w-full overflow-x-auto">
            <div className="flex items-center justify-between min-w-[420px] sm:min-w-full mb-6 px-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center flex-shrink-0">
                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base
          ${
            currentStep >= step
              ? "bg-blue-600 text-white"
              : "bg-gray-300 text-gray-600"
          }`}
                  >
                    {step}
                  </div>

                  {/* Step Line */}
                  {step < 6 && (
                    <div
                      className={`w-8 sm:w-12 md:w-16 h-1 ${
                        currentStep > step ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            Step {currentStep} of 6:{" "}
            {currentStep === 1
              ? "Basic Information"
              : currentStep === 2
                ? "Personal Details"
                : currentStep === 3
                  ? "Address Details"
                  : currentStep === 4
                    ? "Educational Qualification"
                    : currentStep === 5
                      ? "Upload Documents"
                      : "Review & Submit"}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6"
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Applied For <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="appliedFor"
                    value={formData.appliedFor}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Stream</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="If any"
                  />
                </div> */}
              </div>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Student's Personal Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                    required
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mother's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Religion <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: "contactNo",
                          value: e.target.value.replace(/\D/g, "").slice(0, 10),
                        },
                      })
                    }
                    className="input-field"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp No.
                  </label>
                  <input
                    type="tel"
                    name="whatsappNo"
                    value={formData.whatsappNo}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: "whatsappNo",
                          value: e.target.value.replace(/\D/g, "").slice(0, 10),
                        },
                      })
                    }
                    className="input-field"
                    placeholder="10-digit mobile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Guardian Contact No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="guardianContactNo"
                    value={formData.guardianContactNo}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: "guardianContactNo",
                          value: e.target.value.replace(/\D/g, "").slice(0, 10),
                        },
                      })
                    }
                    className="input-field"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Aadhar Card <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadharCard"
                    value={formData.aadharCard}
                    onChange={(e) =>
                      handleChange({
                        target: {
                          name: "aadharCard",
                          value: e.target.value.replace(/\D/g, "").slice(0, 12),
                        },
                      })
                    }
                    className="input-field"
                    placeholder="12-digit Aadhar"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mother Tongue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="motherTongue"
                    value={formData.motherTongue}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Height (in cm){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="studentHeight"
                    value={formData.studentHeight}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 165"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student Weight (in kg){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="studentWeight"
                    value={formData.studentWeight}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 55"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Address Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Present Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="presentAddress"
                    value={formData.presentAddress}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Permanent Address <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Same as Present Address
                    </button>
                  </div>
                  <textarea
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      AAPAR ID (Optional)
                    </label>
                    <input
                      type="text"
                      name="aaparId"
                      value={formData.aaparId}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="If applicable"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nationality <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Educational Qualification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Educational Qualification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Board <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="board"
                    value={formData.board}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="JAC">JAC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., All Subjects"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Marks Obtained <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="marksObtained"
                    value={formData.marksObtained}
                    onChange={handleMarksChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleMarksChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Percentage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="percentage"
                    value={formData.percentage}
                    className="input-field bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., A1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year of Passing <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="yearOfPassing"
                    value={formData.yearOfPassing}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 2025"
                    min="2000"
                    max="2030"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Division
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Division</option>
                    <option value="First">First</option>
                    <option value="Second">Second</option>
                    <option value="Third">Third</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Upload Documents */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Upload Documents
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Student photo must be an image
                  (JPG/PNG, max 5MB). All documents must be PDF files (max 5MB
                  each).
                </p>
              </div>

              {/* Student Photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="studentPhoto"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  id="studentPhoto"
                />
                <label
                  htmlFor="studentPhoto"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Choose Photo
                </label>
                {files.studentPhoto && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {files.studentPhoto.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile("studentPhoto")}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "tenthMarksheet",
                    label: "10th Marksheet",
                    required: true,
                  },
                  {
                    name: "tenthAdmitCard",
                    label: "10th Admit Card",
                    required: false,
                  },
                  {
                    name: "transferCertificate",
                    label: "Transfer Certificate",
                    required: false,
                  },
                  {
                    name: "characterCertificate",
                    label: "Character Certificate",
                    required: false,
                  },
                  {
                    name: "migration",
                    label: "Migration Certificate",
                    required: false,
                  },
                  {
                    name: "casteCertificate",
                    label: "Caste Certificate",
                    required: false,
                  },
                  {
                    name: "bplCertificate",
                    label: "BPL Certificate",
                    required: false,
                  },
                  {
                    name: "aadharCardDoc",
                    label: "Aadhar Card",
                    required: true,
                  },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    className="border border-gray-300 rounded-lg p-4"
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {doc.label}{" "}
                      {doc.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="file"
                      name={doc.name}
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="hidden"
                      id={doc.name}
                    />
                    <label
                      htmlFor={doc.name}
                      className="cursor-pointer inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Upload PDF
                    </label>
                    {files[doc.name] && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-600 truncate">
                          {files[doc.name].name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.name)}
                          className="text-red-500 hover:text-red-700 text-xs ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Review & Submit
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Application Summary
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    {formData.fullName}
                  </div>
                  <div>
                    <span className="font-semibold">Applied For:</span>{" "}
                    {formData.appliedFor}
                  </div>
                  <div>
                    <span className="font-semibold">Session:</span>{" "}
                    {formData.session}
                  </div>
                  <div>
                    <span className="font-semibold">Contact:</span>{" "}
                    {formData.contactNo}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {formData.email}
                  </div>
                  <div>
                    <span className="font-semibold">Percentage:</span>{" "}
                    {formData.percentage}%
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2">
                  Uploaded Documents
                </h3>
                <ul className="text-sm space-y-1">
                  {Object.entries(files).map(
                    ([key, file]) =>
                      file && (
                        <li key={key} className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>{file.name}</span>
                        </li>
                      ),
                  )}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-3">
                  Disclaimer By Applicant
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  This is to certify that the above information given by me is
                  true to my knowledge. If it is found incorrect then the
                  administration has the right to cancel my admission at any
                  time. No claim will be applied by me or my family or friend in
                  future.
                </p>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="disclaimerAgreed"
                    checked={formData.disclaimerAgreed}
                    onChange={handleChange}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the above disclaimer and confirm that all
                    information provided is true and correct.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Previous
              </button>
            )}
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto btn-primary"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
