const express = require("express");
const { protect, adminOnly } = require("../middlewares/auth.middleware");

const router = express.router();

/**
 * @desc Export all tasks as excel/PDF
 */

router.get("/export/tasks", protect, adminOnly, exportTaskReport);

/**
 * @desc Export user-task report
 */

router.get("/export/users", protect, adminOnly, exportUserReport);

module.exports = router;
