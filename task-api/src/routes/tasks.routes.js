const express = require("express");
const router = express.Router();
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getAnalytics,
} = require("../controllers/tasks.controller");

// IMPORTANT: /analytics must be registered before /:id-style routes in this
// file would otherwise shadow it — here we have no /: id GET route, but this
// ordering convention is kept so future routes don't accidentally break it.
router.get("/analytics", getAnalytics);

router.get("/", listTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
