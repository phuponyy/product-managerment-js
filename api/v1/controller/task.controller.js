const Task = require("../models/task.model");

const paginationHelper = require("../../../helpers/pagination.helper");
const searchHelper = require("../../../helpers/search.helper");
const checkValue = require("../../../helpers/isValidStatus.helper");

//NOTE: [GET] /api/v1/tasks
module.exports.index = async (req, res) => {
  let find = {
    $or: [{ createdBy: req.user.id }, { listUser: req.user.id }],
    deleted: false,
  };
  // Status
  if (req.query.status) {
    find.status = req.query.status;
  }
  // -Status

  // Sort
  const sort = {
    title: "asc",
  };

  if (req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue;
  }
  // -Sort

  // Pagination
  const countTasks = await Task.countDocuments(find);
  let initPagination = {
    currentPage: 1,
    limitItems: countTasks,
  };
  const objectPagination = paginationHelper(
    initPagination,
    req.query,
    countTasks
  );
  // -Pagination

  // Search
  let objectSearch = searchHelper(req.query);
  if (req.query.keyword) {
    find.title = objectSearch.regex;
  }
  // -Search

  const task = await Task.find(find)
    .sort(sort)
    .limit(objectPagination.limitItems)
    .skip(objectPagination.skip);

  res.json(task);
};

//NOTE: [GET] /api/v1/tasks/detail/:id
module.exports.detail = async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    deleted: false,
  });

  res.json(task);
};

//NOTE: [PATCH] /api/v1/tasks/change-status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;

    // Kiểm tra xem status có hợp lệ không
    if (!checkValue.isValidStatus(status)) {
      return res.status(400).json({
        code: 400,
        message: `Trạng thái '${status}' không hợp lệ!`,
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        code: 404,
        message: "Task không tồn tại.",
      });
    }

    if (task.status === status) {
      return res.status(400).json({
        code: 400,
        message: `Trạng thái '${status}' đã tồn tại rồi!`,
      });
    }

    await Task.updateOne(
      {
        _id: id,
      },
      {
        status: status,
      }
    );

    res.json({
      code: 200,
      message: "Thay đổi trạng thái thành công",
    });
  } catch (error) {
    console.error("Lỗi thay đổi trạng thái:", error);
    res.json({
      code: 500,
      message: "Thay đổi trạng thái không thành công",
    });
  }
};

//NOTE: [PATCH] /api/v1/tasks/change-multi
module.exports.changeMulti = async (req, res) => {
  try {
    const { ids, key, value } = req.body;

    // Kiểm tra xem status có hợp lệ không
    if (!checkValue.isValidStatus(value)) {
      return res.status(400).json({
        code: 400,
        message: `Trạng thái '${value}' không hợp lệ!`,
      });
    }

    // Tìm tất cả các task theo `ids`
    const tasks = await Task.find({ _id: { $in: ids } });
    if (tasks.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy task nào để cập nhật.",
      });
    }

    // Lọc ra các task có trạng thái khác với trạng thái mới
    const tasksToUpdate = tasks.filter((task) => task.status !== value);

    if (tasksToUpdate.length === 0) {
      return res.status(400).json({
        code: 400,
        message: `Tất cả các task đã có trạng thái '${value}' rồi!`,
      });
    }

    switch (key) {
      case "status":
        await Task.updateMany(
          {
            _id: { $in: ids },
          },
          {
            status: value,
          }
        );

        res.json({
          code: 200,
          message: "Thay đổi trạng thái thành công",
        });
        break;

      default:
        res.json({
          code: 500,
          message: "Thay đổi trạng thái không thành công",
        });
        break;
    }
  } catch (error) {
    // console.error("Lỗi thay đổi trạng thái:", error);
    res.json({
      code: 500,
      message: "Thay đổi trạng thái không thành công",
    });
  }
};

// NOTE: [POST] /api/v1/tasks/create
module.exports.createPost = async (req, res) => {
  let tasks = req.body;

  try {
    // Add the createdBy field to each task
    if (Array.isArray(tasks)) {
      tasks = tasks.map((task) => ({
        ...task,
        createdBy: req.user.id,
      }));

      // Validate status for each task in the array
      for (const task of tasks) {
        if (!checkValue.isValidStatus(task.status)) {
          return res.status(400).json({
            code: 400,
            message: `Trạng thái '${task.status}' không hợp lệ!`,
          });
        }
      }
    } else {
      // For single task objects, add createdBy directly
      tasks.createdBy = req.user.id;
      if (!checkValue.isValidStatus(tasks.status)) {
        return res.status(400).json({
          code: 400,
          message: `Trạng thái '${tasks.status}' không hợp lệ!`,
        });
      }
    }

    // Save tasks to the database (handle both single and multiple)
    const data = Array.isArray(tasks)
      ? await Task.insertMany(tasks) // Save multiple tasks
      : await new Task(tasks).save(); // Save a single task

    res.json({
      code: 200,
      message: "Tạo task thành công",
      data: data,
    });
  } catch (error) {
    console.error("Error creating task(s):", error);
    res.status(400).json({
      code: 400,
      message: "Tạo task thất bại",
    });
  }
};

//NOTE: [PATCH] /api/v1/tasks/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id;

    await Task.updateOne({ _id: id }, req.body);

    res.json({
      code: 200,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.log(`Lỗi cập nhật không thành công: ${error}`);
    res.json({
      code: 200,
      message: "Cập nhật thất bại",
    });
  }
};

//NOTE: [PATCH] /api/v1/tasks/delete/:id
module.exports.deletePatch = async (req, res) => {
  try {
    switch (req.body.key) {
      case "delete":
        await Task.updateOne({ _id: req.body.ids }, { deleted: true });
        res.json({
          code: 200,
          message: "Xoá task thành công",
        });
        break;
      case "deleteMulti":
        await Task.updateMany(
          { _id: { $in: req.body.ids } },
          { deleted: true, deletedAt: Date.now() }
        );
        res.json({
          code: 200,
          message: `Xoá ${req.body.ids.length} thành công`,
        });
        break;
      default:
        res.json({
          code: 400,
          message: `Không tồn tại!`,
        });
        break;
    }
  } catch (error) {
    console.log(`Lỗi xoá không thành công: ${error}`);
    res.json({
      code: 200,
      message: "Xoá thất bại!",
    });
  }
};
