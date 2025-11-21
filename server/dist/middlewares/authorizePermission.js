"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAllPermissions = exports.requirePermission = void 0;
/**
 * Middleware to check if user has at least ONE of the required permissions
 * @param requiredPermissions - Array of permission codes (e.g., ['sales.create', 'sales.edit'])
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.user?.permissions || [];
        // Check if user has at least one of the required permissions
        const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
        if (!hasPermission) {
            res.status(403).json({
                error: "Forbidden: insufficient permissions",
                required: requiredPermissions,
                message: `You need one of these permissions: ${requiredPermissions.join(', ')}`
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has ALL of the required permissions
 * @param requiredPermissions - Array of permission codes that ALL must be present
 */
const requireAllPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.user?.permissions || [];
        // Check if user has all required permissions
        const missingPermissions = requiredPermissions.filter(perm => !userPermissions.includes(perm));
        if (missingPermissions.length > 0) {
            res.status(403).json({
                error: "Forbidden: insufficient permissions",
                required: requiredPermissions,
                missing: missingPermissions,
                message: `You are missing these permissions: ${missingPermissions.join(', ')}`
            });
            return;
        }
        next();
    };
};
exports.requireAllPermissions = requireAllPermissions;
/**
 * Middleware to check if user is an admin (has roles.manage permission)
 */
const requireAdmin = () => {
    return (0, exports.requirePermission)('roles.manage');
};
exports.requireAdmin = requireAdmin;
