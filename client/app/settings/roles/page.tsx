"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProtectedPage } from "@/components/auth/ProtectedPage";
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  type Permission,
  type CreateRoleData,
} from "@/services/roleService";
import { toast } from "react-hot-toast";
import { Shield, Plus, Edit, Trash2, Users, X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import clsx from "clsx";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleData>({
    name: "",
    description: "",
    permissionIds: [],
    isDefault: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      setRoles(rolesData);
      setGroupedPermissions(permsData.groupedPermissions);
    } catch (error) {
      toast.error("Failed to load roles and permissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || "",
        permissionIds: role.permissions.map((rp) => rp.permission.id),
        isDefault: role.isDefault,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        description: "",
        permissionIds: [],
        isDefault: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissionIds: [],
      isDefault: false,
    });
  };

  const handleTogglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handleSelectAllInCategory = (category: string) => {
    const categoryPerms = groupedPermissions[category] || [];
    const allSelected = categoryPerms.every((p) =>
      formData.permissionIds.includes(p.id)
    );

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        permissionIds: prev.permissionIds.filter(
          (id) => !categoryPerms.find((p) => p.id === id)
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        permissionIds: [
          ...prev.permissionIds,
          ...categoryPerms.filter((p) => !prev.permissionIds.includes(p.id)).map((p) => p.id),
        ],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (formData.permissionIds.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success("Role updated successfully");
      } else {
        await createRole(formData);
        toast.success("Role created successfully");
      }
      handleCloseModal();
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to save role")
        : "Failed to save role";
      toast.error(message);
      console.error(error);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role._count && role._count.users > 0) {
      toast.error(`Cannot delete role with ${role._count.users} assigned users`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRole(role.id);
      toast.success("Role deleted successfully");
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to delete role")
        : "Failed to delete role";
      toast.error(message);
      console.error(error);
    }
  };

  return (
    <ProtectedPage permission="roles.manage">
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
                <p className="mt-1 text-gray-600">
                  Manage roles and assign permissions
                </p>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Role
              </button>
            </div>

            {/* Roles List */}
            {loading ? (
              <div className="bg-white shadow-sm border border-gray-200 p-16">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading roles...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {role.name}
                          </h3>
                          {role.isDefault && (
                            <span className="text-xs text-green-600 font-medium">
                              Default Role
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(role)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                          disabled={role._count && role._count.users > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {role.description && (
                      <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{role._count?.users || 0} users</span>
                      </div>
                      <span className="text-gray-500">
                        {role.permissions.length} permissions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Dialog open={showModal} onClose={() => {}} className="relative z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-3xl bg-white p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  {editingRole ? "Edit Role" : "Create New Role"}
                </Dialog.Title>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Manager"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Brief description of this role"
                  />
                </div>

                {/* Default Role */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                    Set as default role for new users
                  </label>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions *
                  </label>
                  <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(groupedPermissions).map(([category, perms]) => {
                      const allSelected = perms.every((p) =>
                        formData.permissionIds.includes(p.id)
                      );
                      return (
                        <div key={category} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 capitalize">
                              {category}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleSelectAllInCategory(category)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {allSelected ? "Deselect All" : "Select All"}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {perms.map((perm) => (
                              <label
                                key={perm.id}
                                className={clsx(
                                  "flex items-center p-2 rounded cursor-pointer transition-colors",
                                  formData.permissionIds.includes(perm.id)
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissionIds.includes(perm.id)}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {perm.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Selected: {formData.permissionIds.length} permissions
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>
      </DashboardLayout>
    </ProtectedPage>
  );
}
