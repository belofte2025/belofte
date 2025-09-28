import prisma from "../utils/prisma";

export const getSupplierItemsById = async (supplierId: string) => {
  return prisma.supplierItem.findMany({ where: { supplierId } });
};
