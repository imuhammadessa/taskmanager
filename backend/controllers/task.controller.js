const Task = require("../models/task.model");

/**
 * @desc Create a new task (Admin only)
 * @route POST /api/tasks
 * @access Private
 */

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      todoChecklist,
      attachments,
    } = req.body;

    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one assigned user is required" });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      todoChecklist,
      attachments,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get all tasks (Admin: all, User: only assigned tasks)
 * @route GET /api/tasks
 * @access Private
 */

const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    let tasks;
    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl",
      );
    } else {
      tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
        "assignedTo",
        "name email profileImageUrl",
      );
    }

    // Add completed todoChecklist count to each task
    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter(
          (item) => item.completed,
        ).length;
        return { ...task._doc, completedTodoCount: completedCount };
      }),
    );

    const allTasks = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user._id },
    );

    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "Pending",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "In Progress",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "Completed",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    res.status(200).json({
      tasks,
      statusSummary: {
        all: allTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get a task by ID (Admin: any task, User: only assigned tasks)
 * @route GET /api/tasks/:id
 * @access Private
 */

const getTaskByID = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate(
      "assignedTo",
      "name email profileImageUrl",
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Update a task (Admin: any task, User: only assigned tasks)
 * @route PUT /api/tasks/:id
 * @access Private
 */

// const updateTask = async (req, res) => {
//   try {
//     const taskId = req.params.id;
//     const task = await Task.findById(taskId);

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     const {
//       title,
//       description,
//       priority,
//       dueDate,
//       assignedTo,
//       todoChecklist,
//       attachments,
//     } = req.body || {};

//     task.title = req.body.title || task.title;
//     task.description = req.body.description || task.description;
//     task.priority = req.body.priority || task.priority;
//     task.dueDate = req.body.dueDate || task.dueDate;
//     task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
//     task.attachments = req.body.attachments || task.attachments;

//     if (req.body.assignedTo) {
//       if (
//         !Array.isArray(req.body.assignedTo) ||
//         req.body.assignedTo.length === 0
//       ) {
//         return res
//           .status(400)
//           .json({ message: "At least one assigned user is required" });
//       }
//       task.assignedTo = req.body.assignedTo;
//     }

//     const updatedTask = await task.save();
//     res
//       .status(200)
//       .json({ message: "Task updated successfully", task: updatedTask });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const updateTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      todoChecklist,
      attachments,
      status,
    } = req.body ?? {};

    // Validate assigned users if provided
    if (assignedTo !== undefined) {
      if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
        return res.status(400).json({
          message: "At least one assigned user is required",
        });
      }

      task.assignedTo = assignedTo;
    }

    // Update only provided fields
    if (title !== undefined) {
      task.title = title;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    if (todoChecklist !== undefined) {
      task.todoChecklist = todoChecklist;
    }

    if (attachments !== undefined) {
      task.attachments = attachments;
    }

    if (status !== undefined) {
      task.status = status;
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

/**
 * @desc Delete a task (Admin: any task)
 * @route DELETE /api/tasks/:id
 * @access Private (admin)
 */

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    await task.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * @desc Update task status
 * @route PUT /api/tasks/:id/status
 * @access Private (assigned user or admin)
 */

const updateTaskStatus = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check if current user is assigned
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    // Only assigned users or admin can update
    if (!isAssigned && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // Validate status
    const allowedStatuses = ["Pending", "In Progress", "Completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    // Update status
    task.status = status;

    // Auto-complete checklist when task completes
    if (status === "Completed") {
      task.todoChecklist.forEach((item) => {
        item.completed = true;
      });

      task.progress = 100;
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Status Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc Update task checklist
 * @route PUT /api/tasks/:id/todo
 * @access Private (assigned user or admin)
 */

const updateTaskChecklist = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { todoChecklist } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Check authorization
    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (!isAssigned && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // Validate checklist
    if (!Array.isArray(todoChecklist)) {
      return res.status(400).json({
        message: "todoChecklist must be an array",
      });
    }

    // Update checklist
    task.todoChecklist = todoChecklist;

    // Calculate progress
    const totalItems = todoChecklist.length;

    const completedItems = todoChecklist.filter(
      (item) => item.completed,
    ).length;

    task.progress =
      totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    // Auto update status
    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    const updatedTask = await Task.findById(taskId).populate(
      "assignedTo",
      "name email profileImageUrl",
    );

    return res.status(200).json({
      success: true,
      message: "Checklist updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update Checklist Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * @desc Get dashboard data (Admin: overall stats, User: personal stats)
 * @route GET /api/tasks/dashboard
 * @access Private
 */

const getDashboardData = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    // Filter based on role
    const filter = isAdmin ? {} : { assignedTo: req.user._id };

    const now = new Date();

    // Run queries in parallel
    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      taskDistributionRaw,
      taskPriorityLevelsRaw,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments(filter),

      Task.countDocuments({
        ...filter,
        status: "Pending",
      }),

      Task.countDocuments({
        ...filter,
        status: "Completed",
      }),

      Task.countDocuments({
        ...filter,
        status: { $ne: "Completed" },
        dueDate: { $lt: now },
      }),

      Task.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Task.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),

      Task.find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate progress createdAt")
        .populate("assignedTo", "name email profileImageUrl"),
    ]);

    // Status distribution
    const taskStatuses = ["Pending", "In Progress", "Completed"];

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const count =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;

      const key = status.toLowerCase().replace(/\s+/g, "");

      acc[key] = count;

      return acc;
    }, {});

    taskDistribution.all = totalTasks;

    // Priority distribution
    const taskPriorities = ["Low", "Medium", "High"];

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority.toLowerCase()] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;

      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

/**
 * @desc Get user dashboard data (Admin: overall stats, User: personal stats)
 * @route GET /api/tasks/dashboard/user
 * @access Private
 */

const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const filter = {
      assignedTo: userId,
    };

    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      taskDistributionRaw,
      taskPriorityLevelsRaw,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments(filter),

      Task.countDocuments({
        ...filter,
        status: "Pending",
      }),

      Task.countDocuments({
        ...filter,
        status: "Completed",
      }),

      Task.countDocuments({
        ...filter,
        status: { $ne: "Completed" },
        dueDate: { $lt: now },
      }),

      // Task status distribution
      Task.aggregate([
        {
          $match: {
            assignedTo: userId,
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Task priority distribution
      Task.aggregate([
        {
          $match: {
            assignedTo: userId,
          },
        },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]),

      // Recent tasks
      Task.find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate progress createdAt"),
    ]);

    // Status distribution
    const taskStatuses = ["Pending", "In Progress", "Completed"];

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const key = status.toLowerCase().replace(/\s+/g, "");

      acc[key] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;

      return acc;
    }, {});

    taskDistribution.all = totalTasks;

    // Priority distribution
    const taskPriorities = ["Low", "Medium", "High"];

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority.toLowerCase()] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;

      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    console.error("User Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user dashboard data",
      error: error.message,
    });
  }
};

module.exports = {
  getTasks,
  getTaskByID,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
