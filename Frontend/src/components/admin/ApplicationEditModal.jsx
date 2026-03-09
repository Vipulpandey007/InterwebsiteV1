import { useState } from "react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

import ApplicationInfoSection from "./editSections/ApplicationInfoSection";
import PersonalDetailsSection from "./editSections/PersonalDetailsSection";
import ContactDetailsSection from "./editSections/ContactDetailsSection";
import AddressSection from "./editSections/AddressSection";
import AcademicSection from "./editSections/AcademicSection";

/**
 * ApplicationEditModal
 *
 * Admin-only modal for editing a student's application.
 * All editable fields are split into focused section components.
 *
 * Props:
 *  - application: the full application object from DB
 *  - onClose: () => void
 *  - onSaved: (updatedApplication) => void  — called after successful save
 */
export default function ApplicationEditModal({ application, onClose, onSaved }) {
  // Initialise form state from the application object
  const [formData, setFormData] = useState({
    // Application Info
    appliedFor: application.appliedFor || "",
    session: application.session || "",
    referenceNumber: application.referenceNumber || "",

    // Personal
    fullName: application.fullName || "",
    fatherName: application.fatherName || "",
    motherName: application.motherName || "",
    dateOfBirth: application.dateOfBirth || "",
    gender: application.gender || "",
    category: application.category || "",
    religion: application.religion || "",
    motherTongue: application.motherTongue || "",
    bloodGroup: application.bloodGroup || "",
    studentHeight: application.studentHeight || "",
    studentWeight: application.studentWeight || "",
    nationality: application.nationality || "",
    aaparId: application.aaparId || "",

    // Contact
    contactNo: application.contactNo || "",
    whatsappNo: application.whatsappNo || "",
    guardianContactNo: application.guardianContactNo || "",
    email: application.email || "",
    aadharCard: application.aadharCard || "",

    // Address
    presentAddress: application.presentAddress || "",
    permanentAddress: application.permanentAddress || "",

    // Academic
    schoolName: application.schoolName || "",
    board: application.board || "",
    subject: application.subject || "",
    yearOfPassing: application.yearOfPassing || "",
    marksObtained: application.marksObtained || "",
    totalMarks: application.totalMarks || "",
    grade: application.grade || "",
    division: application.division || "",
  });

  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Single onChange handler used by all section components
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    if (!isDirty) {
      toast("No changes to save.");
      return;
    }

    try {
      setSaving(true);
      const response = await adminAPI.updateApplication(application._id, formData);

      if (response.data.success) {
        toast.success("Application updated successfully");
        onSaved(response.data.data.application);
        onClose();
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save changes";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isDirty) {
        if (window.confirm("You have unsaved changes. Discard them?")) onClose();
      } else {
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600 rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Application</h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              #{application.applicationNumber} &nbsp;·&nbsp; {application.fullName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-xs bg-yellow-400 text-yellow-900 font-semibold px-2 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
            <button
              onClick={() => {
                if (isDirty) {
                  if (window.confirm("You have unsaved changes. Discard them?")) onClose();
                } else {
                  onClose();
                }
              }}
              className="text-white hover:text-indigo-200 text-3xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <ApplicationInfoSection data={formData} onChange={handleChange} />
          <PersonalDetailsSection data={formData} onChange={handleChange} />
          <ContactDetailsSection data={formData} onChange={handleChange} />
          <AddressSection data={formData} onChange={handleChange} />
          <AcademicSection data={formData} onChange={handleChange} />

          {/* Read-only note for documents & payment */}
          <div className="mt-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">
              📎 Documents and payment details cannot be edited here. Use the application status controls for approval/rejection.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (isDirty) {
                if (window.confirm("Discard all changes?")) onClose();
              } else {
                onClose();
              }
            }}
            className="px-5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !isDirty}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
