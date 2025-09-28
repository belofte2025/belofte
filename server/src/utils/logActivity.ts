import prisma from "../utils/prisma";

export const logActivity = async (
  userId: string,
  actionType: "CREATE" | "UPDATE" | "DELETE",
  entityType: string,
  entityId: string,
  description: string
) => {
  await prisma.auditLog.create({
    data: {
      userId,
      actionType,
      entityType,
      entityId,
      description,
    },
  });
};
