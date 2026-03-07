const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for different file types
const directories = ["photos", "documents"];
directories.forEach((dir) => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload directory based on fieldname
    let uploadPath = uploadDir;

    if (file.fieldname === "studentPhoto") {
      uploadPath = path.join(uploadDir, "photos");
    } else {
      uploadPath = path.join(uploadDir, "documents");
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log("Uploading file:", file.fieldname, file.originalname);

  // Check file type based on fieldname
  if (file.fieldname === "studentPhoto") {
    // Accept images only
    const allowedImageTypes = /jpeg|jpg|png/;
    const extname = allowedImageTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedImageTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(
        new Error(
          "Only JPEG, JPG, and PNG images are allowed for student photo",
        ),
      );
    }
  } else {
    // Accept PDFs only for documents
    const allowedDocTypes = /pdf/;
    const extname = allowedDocTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedDocTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb(new Error("Only PDF files are allowed for documents"));
    }
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Define upload fields
const uploadFields = upload.fields([
  { name: "studentPhoto", maxCount: 1 },
  { name: "tenthMarksheet", maxCount: 1 },
  { name: "tenthAdmitCard", maxCount: 1 },
  { name: "transferCertificate", maxCount: 1 },
  { name: "characterCertificate", maxCount: 1 },
  { name: "migration", maxCount: 1 },
  { name: "casteCertificate", maxCount: 1 },
  { name: "bplCertificate", maxCount: 1 },
  { name: "aadharCardDoc", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadFields,
};
