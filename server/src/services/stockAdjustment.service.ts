import prisma from "../utils/prisma";

// Adjustment types allowed
export const ADJUSTMENT_TYPES = {
  MANUAL: "manual",
  DAMAGE: "damage",
  FOUND: "found",
} as const;

type AdjustmentType = (typeof ADJUSTMENT_TYPES)[keyof typeof ADJUSTMENT_TYPES];

interface CreateAdjustmentInput {
  itemName: string;
  adjustmentQty: number;
  adjustmentType: AdjustmentType;
  reason?: string;
  notes?: string;
}

interface CreateAdjustmentResult {
  id: string;
  itemName: string;
  adjustmentQty: number;
  newAvailableQty: number;
  createdAt: Date;
}

/**
 * Calculate current available quantity for an item from a supplier
 */
async function getCurrentAvailableQty(
  supplierId: string,
  itemName: string,
  companyId: string
): Promise<number> {
  // Get total received from containers
  const containerItems = await prisma.containerItem.findMany({
    where: {
      itemName,
      container: {
        supplierId,
        companyId,
      },
    },
    select: {
      quantity: true,
      containerId: true,
    },
  });

  const totalReceived = containerItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const containerIds = containerItems.map((item) => item.containerId);

  // Get total sold
  const [containerSales, regularSales] = await Promise.all([
    // Container sales
    prisma.saleItem.findMany({
      where: {
        itemName,
        sale: {
          companyId,
          sourceType: "container",
          sourceId: { in: containerIds },
        },
      },
      select: {
        quantity: true,
      },
    }),

    // Regular sales from supplier items
    prisma.saleItem.findMany({
      where: {
        itemName,
        sale: {
          companyId,
          sourceType: "regular",
          sourceId: {
            in: await prisma.supplierItem
              .findMany({
                where: { supplierId, itemName },
                select: { id: true },
              })
              .then((items) => items.map((i) => i.id)),
          },
        },
      },
      select: {
        quantity: true,
      },
    }),
  ]);

  const totalSold =
    containerSales.reduce((sum, sale) => sum + sale.quantity, 0) +
    regularSales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Get total adjustments
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      supplierId,
      itemName,
      companyId,
    },
    select: {
      adjustmentQty: true,
    },
  });

  const totalAdjustments = adjustments.reduce(
    (sum, adj) => sum + adj.adjustmentQty,
    0
  );

  return totalReceived - totalSold + totalAdjustments;
}

/**
 * Validate an adjustment to ensure it won't result in negative stock
 */
export async function validateAdjustment(
  supplierId: string,
  itemName: string,
  adjustmentQty: number,
  companyId: string
): Promise<{ valid: boolean; currentQty: number; newQty: number; error?: string }> {
  const currentQty = await getCurrentAvailableQty(supplierId, itemName, companyId);
  const newQty = currentQty + adjustmentQty;

  if (newQty < 0) {
    return {
      valid: false,
      currentQty,
      newQty,
      error: `Adjustment would result in negative quantity for ${itemName} (current: ${currentQty}, adjustment: ${adjustmentQty}, result: ${newQty})`,
    };
  }

  return {
    valid: true,
    currentQty,
    newQty,
  };
}

/**
 * Create stock adjustments for a supplier
 */
export async function createStockAdjustments(
  supplierId: string,
  adjustments: CreateAdjustmentInput[],
  userId: string,
  companyId: string
): Promise<{ success: boolean; adjustments?: CreateAdjustmentResult[]; error?: string }> {
  // Validate all adjustments first
  for (const adj of adjustments) {
    // Validate adjustment type
    if (!Object.values(ADJUSTMENT_TYPES).includes(adj.adjustmentType)) {
      return {
        success: false,
        error: `Invalid adjustment type: ${adj.adjustmentType}. Must be one of: ${Object.values(ADJUSTMENT_TYPES).join(", ")}`,
      };
    }

    // Validate quantity won't go negative
    const validation = await validateAdjustment(
      supplierId,
      adj.itemName,
      adj.adjustmentQty,
      companyId
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }
  }

  // Verify supplier exists and belongs to company
  const supplier = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      companyId,
    },
  });

  if (!supplier) {
    return {
      success: false,
      error: "Supplier not found or does not belong to this company",
    };
  }

  // Create all adjustments
  const createdAdjustments = await Promise.all(
    adjustments.map(async (adj) => {
      const validation = await validateAdjustment(
        supplierId,
        adj.itemName,
        adj.adjustmentQty,
        companyId
      );

      const created = await prisma.stockAdjustment.create({
        data: {
          supplierId,
          itemName: adj.itemName,
          companyId,
          adjustmentQty: adj.adjustmentQty,
          adjustmentType: adj.adjustmentType,
          reason: adj.reason,
          notes: adj.notes,
          createdBy: userId,
        },
      });

      return {
        id: created.id,
        itemName: created.itemName,
        adjustmentQty: created.adjustmentQty,
        newAvailableQty: validation.newQty,
        createdAt: created.createdAt,
      };
    })
  );

  return {
    success: true,
    adjustments: createdAdjustments,
  };
}

/**
 * Get adjustment history for a supplier, optionally filtered by item
 */
export async function getAdjustmentHistory(
  supplierId: string,
  companyId: string,
  itemName?: string,
  limit: number = 50,
  offset: number = 0
) {
  const where: any = {
    supplierId,
    companyId,
  };

  if (itemName) {
    where.itemName = itemName;
  }

  const [total, adjustments] = await Promise.all([
    prisma.stockAdjustment.count({ where }),
    prisma.stockAdjustment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    total,
    adjustments: adjustments.map((adj) => ({
      id: adj.id,
      itemName: adj.itemName,
      adjustmentQty: adj.adjustmentQty,
      adjustmentType: adj.adjustmentType,
      reason: adj.reason,
      notes: adj.notes,
      createdBy: adj.user.userName,
      createdByEmail: adj.user.email,
      createdAt: adj.createdAt,
    })),
  };
}

/**
 * Get total adjustments for a specific item from a supplier
 */
export async function getAdjustmentSummary(
  supplierId: string,
  itemName: string,
  companyId: string
) {
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      supplierId,
      itemName,
      companyId,
    },
    select: {
      adjustmentQty: true,
      adjustmentType: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalAdjustments = adjustments.reduce(
    (sum, adj) => sum + adj.adjustmentQty,
    0
  );

  // Group by adjustment type
  const byType = adjustments.reduce((acc, adj) => {
    if (!acc[adj.adjustmentType]) {
      acc[adj.adjustmentType] = 0;
    }
    acc[adj.adjustmentType] += adj.adjustmentQty;
    return acc;
  }, {} as Record<string, number>);

  return {
    itemName,
    totalAdjustments,
    adjustmentCount: adjustments.length,
    byType,
    recentAdjustments: adjustments.slice(0, 5),
  };
}

/**
 * Get total stock adjustments for all items from a supplier
 */
export async function getTotalAdjustmentsBySupplierId(
  supplierId: string,
  companyId: string
): Promise<Record<string, number>> {
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      supplierId,
      companyId,
    },
    select: {
      itemName: true,
      adjustmentQty: true,
    },
  });

  // Aggregate by item name
  const totals: Record<string, number> = {};
  adjustments.forEach((adj) => {
    if (!totals[adj.itemName]) {
      totals[adj.itemName] = 0;
    }
    totals[adj.itemName] += adj.adjustmentQty;
  });

  return totals;
}
