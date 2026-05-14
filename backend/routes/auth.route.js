const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const {
  upload,
  uploadErrorHandler,
} = require("../middlewares/upload.middleware");

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     responses:
 *       201:
 *         description: User registered successfully
 *      400:
 *        description: Bad request
 *     500:
 *      description: Internal server error
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /login:
 *  post:
 *    summary: Login a user
 *   responses:
 *    200:
 *     description: User logged in successfully
 *   401:
 *    description: Unauthorized
 *  500:
 *   description: Internal server error
 * */
router.post("/login", loginUser);

/**
 * @swagger
 * /profile
 *  get:
 *   summary: Get user profile
 *  responses:
 *  200:
 *  description: User profile retrieved successfully
 *  401:
 * description: Unauthorized
 * 500:
 * description: Internal server error
 * */
router.get("/profile", protect, getUserProfile);

/**
 * @swagger
 * /profile
 *  put:
 *  summary: Update user profile
 * responses:
 * 200:
 * description: User profile updated successfully
 * 401:
 * description: Unauthorized
 * 500:
 * description: Internal server error
 * */
router.put("/profile", protect, updateUserProfile);

/**
 * /upload-image
 * post:
 * summary: Upload an image
 * responses:
 * 200:
 * description: Image uploaded successfully
 * 400:
 * description: Bad request
 * 500:
 * description: Internal server error
 */

router.post("/upload-image", upload.single("image"), (req, res) => {
  if(!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(200).json({
    message: "Image uploaded successfully",
    file: req.file,
    imageUrl,
  });
});

// Error middleware
router.use(uploadErrorHandler);

module.exports = router;
