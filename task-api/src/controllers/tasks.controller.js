const prisma = require("../lib/prismaClient");

// GET /tasks?search=&filter=Active|Completed&categoryId=
async function listTasks(req, res) {
  try {
    const { search, filter, categoryId } = req.query;
    const where = {};

    if (search) where.title = { contains: search, mode: "insensitive" };
    if (filter === "Active") where.completed = false;
    else if (filter === "Completed") where.completed = true;
    if (categoryId)
      where.categoryId = categoryId === "none" ? null : categoryId;

    const tasks = await prisma.task.findMany({
      where,
      include: { category: true },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    });

    res.json(tasks);
  } catch (error) {
    console.error("[tasks.list]", error);
    res.status(500).json({ error: "Couldn't load tasks. Please try again." });
  }
}

// POST /tasks
async function createTask(req, res) {
  try {
    const { title, description, dueDate, categoryId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required." });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return res
          .status(400)
          .json({ error: "Selected category does not exist." });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("[tasks.create]", error);
    res
      .status(500)
      .json({ error: "Couldn't create the task. Please try again." });
  }
}

// PUT /tasks/:id
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, completed, dueDate, categoryId } = req.body;

    if (title !== undefined && title.trim() === "") {
      return res.status(400).json({ error: "Title cannot be empty." });
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return res
          .status(400)
          .json({ error: "Selected category does not exist." });
      }
    }

    const completedChanged =
      completed !== undefined && completed !== existingTask.completed;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description:
          description !== undefined ? description.trim() || null : undefined,
        completed: completed !== undefined ? completed : undefined,
        completedAt: completedChanged
          ? completed
            ? new Date()
            : null
          : undefined,
        dueDate:
          dueDate !== undefined
            ? dueDate
              ? new Date(dueDate)
              : null
            : undefined,
        categoryId: categoryId !== undefined ? categoryId || null : undefined,
      },
      include: { category: true },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("[tasks.update]", error);
    res
      .status(500)
      .json({ error: "Couldn't update the task. Please try again." });
  }
}

// DELETE /tasks/:id
async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("[tasks.delete]", error);
    res
      .status(500)
      .json({ error: "Couldn't delete the task. Please try again." });
  }
}

// Builds the trend chart's date buckets for a given window, at the right
// granularity (day/week/month), then counts created/completed tasks that
// fall into each bucket. Keeping this separate from getAnalytics so the
// range-to-bucket logic stays easy to read.
function buildTrend(rawTasks, start, end, bucketUnit) {
  const buckets = [];

  if (bucketUnit === "day") {
    const cursor = new Date(start);
    while (cursor <= end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(bucketStart.getTime() + 86400000);
      buckets.push({ label: bucketStart, start: bucketStart, end: bucketEnd });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (bucketUnit === "week") {
    const cursor = new Date(start);
    while (cursor <= end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(bucketStart.getTime() + 7 * 86400000);
      buckets.push({ label: bucketStart, start: bucketStart, end: bucketEnd });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    // month
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endMonth) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        1,
      );
      buckets.push({ label: bucketStart, start: bucketStart, end: bucketEnd });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return buckets.map((b) => ({
    date: b.label.toISOString().slice(0, 10),
    created: rawTasks.filter(
      (t) => t.createdAt >= b.start && t.createdAt < b.end,
    ).length,
    completed: rawTasks.filter(
      (t) => t.completedAt && t.completedAt >= b.start && t.completedAt < b.end,
    ).length,
  }));
}

// GET /tasks/analytics?range=7d|30d|90d|year|all
//
// Current-state stats (active/overdue/total/etc.) are always a live
// snapshot regardless of `range` — that's "what's true right now", not a
// historical window. `range` only controls the trend chart's window and
// bucket granularity, which is the one part of the dashboard that's
// genuinely about "over time".
async function getAnalytics(req, res) {
  try {
    const range = ["7d", "30d", "90d", "year", "all"].includes(req.query.range)
      ? req.query.range
      : "7d";

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday.getTime() + 86400000);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let trendStart;
    let bucketUnit;

    if (range === "30d") {
      trendStart = new Date(startOfToday);
      trendStart.setDate(trendStart.getDate() - 29);
      bucketUnit = "day";
    } else if (range === "90d") {
      trendStart = new Date(startOfToday);
      trendStart.setDate(trendStart.getDate() - 89);
      bucketUnit = "week";
    } else if (range === "year") {
      trendStart = new Date(now.getFullYear(), 0, 1);
      bucketUnit = "month";
    } else if (range === "all") {
      const earliest = await prisma.task.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      trendStart = earliest
        ? new Date(
            earliest.createdAt.getFullYear(),
            earliest.createdAt.getMonth(),
            1,
          )
        : startOfToday;
      bucketUnit = "month";
    } else {
      trendStart = new Date(startOfToday);
      trendStart.setDate(trendStart.getDate() - 6);
      bucketUnit = "day";
    }

    const [
      total,
      completed,
      active,
      overdue,
      dueTodayTasks,
      completedToday,
      completedThisWeek,
      byCategoryRaw,
      recentTasks,
      trendRangeRaw,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { completed: true } }),
      prisma.task.count({ where: { completed: false } }),
      prisma.task.count({
        where: { completed: false, dueDate: { lt: startOfToday } },
      }),
      // Full task list due today, not just a count — lets the dashboard
      // show what those tasks actually are, not just how many.
      prisma.task.findMany({
        where: {
          completed: false,
          dueDate: { gte: startOfToday, lt: endOfToday },
        },
        select: { id: true, title: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.count({ where: { completedAt: { gte: startOfToday } } }),
      prisma.task.count({ where: { completedAt: { gte: startOfWeek } } }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { tasks: true } },
          tasks: { select: { completed: true } },
        },
      }),
      prisma.task.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { category: true },
      }),
      prisma.task.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true, completedAt: true },
      }),
    ]);

    const byCategory = byCategoryRaw.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      total: c._count.tasks,
      completed: c.tasks.filter((t) => t.completed).length,
    }));

    const trend = buildTrend(trendRangeRaw, trendStart, now, bucketUnit);

    res.json({
      range,
      totals: {
        total,
        completed,
        active,
        overdue,
        dueToday: dueTodayTasks.length,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      dueTodayTasks,
      completedToday,
      completedThisWeek,
      byCategory,
      recentTasks,
      trend,
    });
  } catch (error) {
    console.error("[tasks.analytics]", error);
    res
      .status(500)
      .json({ error: "Couldn't load dashboard analytics. Please try again." });
  }
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getAnalytics,
};
