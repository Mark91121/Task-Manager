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
// Also stamps/clears `completedAt` whenever `completed` flips, so the
// dashboard can answer "how many tasks were completed today / this week"
// without inferring it from updatedAt (which changes on every edit).
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

// GET /tasks/analytics
//
// Single aggregated payload for the dashboard so the frontend doesn't have
// to fetch all tasks and crunch numbers client-side. Runs everything in one
// Promise.all batch to keep the round trip fast.
async function getAnalytics(req, res) {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      total,
      completed,
      active,
      overdue,
      dueToday,
      completedToday,
      completedThisWeek,
      byCategoryRaw,
      recentTasks,
      last7DaysRaw,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { completed: true } }),
      prisma.task.count({ where: { completed: false } }),
      prisma.task.count({
        where: { completed: false, dueDate: { lt: startOfToday } },
      }),
      prisma.task.count({
        where: {
          completed: false,
          dueDate: {
            gte: startOfToday,
            lt: new Date(startOfToday.getTime() + 86400000),
          },
        },
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
        where: { createdAt: { gte: sevenDaysAgo } },
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

    // Build a 7-day trend of created vs completed counts, oldest -> newest,
    // for a simple bar/line chart on the dashboard.
    const trend = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dayStart = new Date(startOfToday);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      trend.push({
        date: dayStart.toISOString().slice(0, 10),
        created: last7DaysRaw.filter(
          (t) => t.createdAt >= dayStart && t.createdAt < dayEnd,
        ).length,
        completed: last7DaysRaw.filter(
          (t) =>
            t.completedAt &&
            t.completedAt >= dayStart &&
            t.completedAt < dayEnd,
        ).length,
      });
    }

    res.json({
      totals: {
        total,
        completed,
        active,
        overdue,
        dueToday,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
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
