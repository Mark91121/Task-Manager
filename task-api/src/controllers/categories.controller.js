const prisma = require("../lib/prismaClient");

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Shapes a raw Prisma category (with the Prisma-generated `_count` wrapper)
 * into the flat object the frontend expects.
 */
function shapeCategory(category) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    taskCount: category._count?.tasks ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

// GET /categories
// Returns every category along with how many tasks belong to it, so the
// sidebar / dashboard can show counts without a second round trip.
async function listCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tasks: true } } },
    });

    res.json(categories.map(shapeCategory));
  } catch (error) {
    console.error("[categories.list]", error);
    res
      .status(500)
      .json({ error: "Couldn't load categories. Please try again." });
  }
}

// POST /categories
async function createCategory(req, res) {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required." });
    }
    if (color && !HEX_COLOR_RE.test(color)) {
      return res.status(400).json({ error: "Color must be a valid hex code." });
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), color: color || undefined },
    });

    res.status(201).json({ ...category, taskCount: 0 });
  } catch (error) {
    // P2002 = unique constraint violation (duplicate category name)
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A category with that name already exists." });
    }
    console.error("[categories.create]", error);
    res
      .status(500)
      .json({ error: "Couldn't create the category. Please try again." });
  }
}

// PUT /categories/:id
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: "Category name cannot be empty." });
    }
    if (color && !HEX_COLOR_RE.test(color)) {
      return res.status(400).json({ error: "Color must be a valid hex code." });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Category not found." });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        color: color !== undefined ? color : undefined,
      },
      include: { _count: { select: { tasks: true } } },
    });

    res.json(shapeCategory(updated));
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A category with that name already exists." });
    }
    console.error("[categories.update]", error);
    res
      .status(500)
      .json({ error: "Couldn't update the category. Please try again." });
  }
}

// DELETE /categories/:id?reassign=true
//
// Validation rule requested by the team: a category that still has tasks
// attached to it cannot be silently deleted. We block the delete with 409
// Conflict and tell the caller how many tasks are affected. The client can
// then ask the user to confirm, and resend the request with ?reassign=true
// to proceed — at which point those tasks fall back to "Uncategorized"
// (categoryId set to null, matching the onDelete: SetNull relation).
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const reassign = req.query.reassign === "true";

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Category not found." });
    }

    if (existing._count.tasks > 0 && !reassign) {
      return res.status(409).json({
        error: `"${existing.name}" still has ${existing._count.tasks} task(s) assigned to it.`,
        code: "CATEGORY_HAS_TASKS",
        taskCount: existing._count.tasks,
      });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("[categories.delete]", error);
    res
      .status(500)
      .json({ error: "Couldn't delete the category. Please try again." });
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
