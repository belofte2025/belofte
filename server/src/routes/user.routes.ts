import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import {
  createUser,
  listUsers,
  updateUser,
} from "../controllers/user.controller";

const router = Router();
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get list of users for the authenticated company
 * @access  Requires users.view permission
 */
router.get("/", requirePermission("users.view"), listUsers);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Requires users.create permission
 */
router.post("/", requirePermission("users.create"), createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update an existing user
 * @access  Requires users.edit permission
 */
router.put("/:id", requirePermission("users.edit"), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Requires users.delete permission
 */
router.delete("/:id", requirePermission("users.delete"), async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = (await import("../utils/prisma")).default;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
