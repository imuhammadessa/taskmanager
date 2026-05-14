const Task = require("../models/task.model");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "member" }).select("-password");
    const usersWithTaskCount = await Promise.all(
      users.map(async (user) => {
        const pendingTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "pending",
        });
        const inProgressTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "in-progress",
        });
        const completedTask = await Task.countDocuments({
          assignedTo: user._id,
          status: "completed",
        });
        const taskCount = {
          pending: pendingTask,
          inProgress: inProgressTask,
          completed: completedTask,
        };
        return { ...user.toObject(), taskCount };
      }),
    );
    res.status(200).json({ users: usersWithTaskCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.remove();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUsers,
  getUserById,
  deleteUser,
};
