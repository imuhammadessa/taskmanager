const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/auth.middleware");
const {
  getTasks,
  getTaskByID,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
} = require("../controllers/task.controller");

/**
 * @desc Task management routes
 * @route /api/tasks
 * @access Private (admin only)
 */

router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", protect, getTasks); // Get all tasks (Admin: all, User: assigned)
router.get("/:id", protect, getTaskByID); // Get task by ID
router.post("/", protect, createTask); // Create a new task (Admin only)
router.put("/:id", protect, updateTask); // Update task details
router.delete("/:id", protect, adminOnly, deleteTask); // Delete a task (Admin only)
router.put("/:id/status", protect, updateTaskStatus); // Update task status (e.g., mark as completed)
router.put("/:id/todo", protect, updateTaskChecklist); // Update task checklist (e.g., add/remove checklist items)

module.exports = router;
