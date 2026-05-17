const Task = require("../models/task.model");
const User = require("../models/user.model");
const ExcelJS = require("exceljs");

/**
 * @desc Export all tasks as Excel file
 * @route GET /api/reports/export/tasks
 * @access Private (Admin)
 */
const exportTaskReport = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");

    worksheet.columns = [
      {
        header: "Task ID",
        key: "_id",
        width: 28,
      },
      {
        header: "Title",
        key: "title",
        width: 30,
      },
      {
        header: "Description",
        key: "description",
        width: 50,
      },
      {
        header: "Priority",
        key: "priority",
        width: 15,
      },
      {
        header: "Status",
        key: "status",
        width: 20,
      },
      {
        header: "Due Date",
        key: "dueDate",
        width: 20,
      },
      {
        header: "Assigned To",
        key: "assignedTo",
        width: 40,
      },
      {
        header: "Created By",
        key: "createdBy",
        width: 30,
      },
    ];

    // Style header row
    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // Add rows
    tasks.forEach((task) => {
      worksheet.addRow({
        _id: task._id.toString(),
        title: task.title,
        description: task.description || "N/A",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "N/A",
        assignedTo:
          task.assignedTo
            ?.map((user) => `${user.name} (${user.email})`)
            .join(", ") || "Unassigned",
        createdBy: task.createdBy
          ? `${task.createdBy.name} (${task.createdBy.email})`
          : "Unknown",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tasks-report.xlsx"',
    );

    await workbook.xlsx.write(res);

    return res.end();
  } catch (error) {
    console.error("Export Tasks Error:", error);

    return res.status(500).json({
      message: "Error exporting tasks",
      error: error.message,
    });
  }
};

/**
 * @desc Export users report
 * @route GET /api/reports/export/users
 * @access Private (Admin)
 */
const exportUserReport = async (req, res) => {
  try {
    const users = await User.find().select("name email _id").lean();

    const userTasks = await Task.find()
      .populate("assignedTo", "name email _id")
      .lean();

    const userTaskMap = {};

    // Initialize user map
    users.forEach((user) => {
      userTaskMap[user._id.toString()] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    // Count tasks
    userTasks.forEach((task) => {
      if (task.assignedTo?.length) {
        task.assignedTo.forEach((assignedUser) => {
          const userId = assignedUser._id.toString();

          if (userTaskMap[userId]) {
            userTaskMap[userId].taskCount += 1;

            switch (task.status) {
              case "Pending":
                userTaskMap[userId].pendingTasks += 1;
                break;

              case "In Progress":
                userTaskMap[userId].inProgressTasks += 1;
                break;

              case "Completed":
                userTaskMap[userId].completedTasks += 1;
                break;

              default:
                break;
            }
          }
        });
      }
    });

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("User Task Report");

    worksheet.columns = [
      {
        header: "User Name",
        key: "name",
        width: 30,
      },
      {
        header: "Email",
        key: "email",
        width: 35,
      },
      {
        header: "Total Tasks",
        key: "taskCount",
        width: 20,
      },
      {
        header: "Pending",
        key: "pendingTasks",
        width: 20,
      },
      {
        header: "In Progress",
        key: "inProgressTasks",
        width: 20,
      },
      {
        header: "Completed",
        key: "completedTasks",
        width: 20,
      },
    ];

    // Header styling
    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.getRow(1).alignment = {
      horizontal: "center",
    };

    // Add rows
    Object.values(userTaskMap).forEach((user) => {
      worksheet.addRow(user);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="user-report.xlsx"',
    );

    await workbook.xlsx.write(res);

    return res.end();
  } catch (error) {
    console.error("Export Users Error:", error);

    return res.status(500).json({
      message: "Error exporting users",
      error: error.message,
    });
  }
};

module.exports = {
  exportTaskReport,
  exportUserReport,
};
