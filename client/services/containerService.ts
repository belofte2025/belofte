import api from "@/lib/api";

export const getContainers = async () => {
  const res = await api.get("/containers");
  return res.data.map((c: any) => ({
    id: c.id,
    number: c.containerNo,
    company: c.supplier?.suppliername,
    deliveryDate: c.arrivalDate?.slice(0, 10),
    status: c.status,
  }));
};

export const getAllContainers = async () => {
  const res = await api.get("/containers");
  return res.data.map((c: any) => ({
    id: c.id,
    containerNo: c.containerNo,
    arrivalDate: c.arrivalDate,
    year: c.year,
    status: c.status,
    supplier: {
      suppliername: c.supplier?.suppliername || 'Unknown Supplier'
    },
    items: c.items || [],
  }));
};

export const createContainer = async (data: any) => {
  const res = await api.post("/containers", data);
  return res.data;
};

export const markAsReceived = async (id: string) => {
  const res = await api.put(`/containers/${id}/mark-received`);
  return res.data;
};

export const markAsIncomplete = async (id: string) => {
  const res = await api.put(`/containers/${id}/mark-incomplete`);
  return res.data;
};

export const markAsDone = async (id: string) => {
  const res = await api.put(`/containers/${id}/mark-done`);
  return res.data;
};

export const getContainerById = async (id: string) => {
  const res = await api.get(`/containers/${id}`);
  return res.data;
};
export const deleteContainer = async (id: string) => {
  const res = await api.delete(`/containers/${id}`);
  return res.data;
};

export const updateReceivedQuantities = async (
  containerId: string,
  items: { itemId: string; receivedQty: number }[]
) => {
  const res = await api.put(`/containers/${containerId}/update-quantities`, {
    items,
  });
  return res.data;
};
// services/offloadService.ts
export const submitOffload = async ({
  containerId,
  items,
  isComplete,
}: {
  containerId: string;
  items: any[];
  isComplete: boolean;
}) => {
  return fetch("/api/offload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ containerId, items, isComplete }),
  });
};

export const getContainerItems = async (containerId: string) => {
  try {
    const response = await api.get(`/containers/${containerId}/items`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch container items:", error);
    throw error;
  }
};

export const saveOffload = async (
  containerId: string,
  items: { id: string; receivedQty: number }[],
  isComplete: boolean
) => {
  const res = await api.post(`/containers/${containerId}/offload`, {
    containerId,
    items,
    isComplete,
  });
  return res.data;
};
export const getOffloadSummary = async (containerId: string) => {
  const res = await api.get(`/containers/${containerId}/summary`);
  return res.data;
};
export const getContainerItemsWithSales = async (containerId: string) => {
  const res = await api.get(
    `/containers/${containerId}/containeritems/withsales`
  );
  return res.data.map((item: any) => ({
    id: item.id,
    itemName: item.itemName,
    receivedQty: item.receivedQty,
    soldQty: item.soldQty,
    remainingQty: item.remainingQty,
    unitPrice: item.unitPrice,
    supplierName: item.supplierName,
    containerNo: item.containerNo,
  }));
};
export const getContainerSalesSummary = async (id: string) => {
  const res = await api.get(`/containers/${id}/containersummary`);
  const data = res.data;

  console.log("Container summary API response:", data);

  if (!Array.isArray(data.items)) {
    throw new Error("Missing or invalid 'items' array in response");
  }

  return {
    id: data.id ?? id,
    number: data.containerNo,
    company: data.companyName ?? "Unknown",
    deliveryDate: data.arrivalDate,
    totalSales: data.totalSales ?? 0,
    items: data.items.map((item: any) => ({
      name: item.itemName,
      expected: item.quantity,
      remainingQty: item.remainingQty,
      sold: item.soldQty,
      unitPrice: item.unitPrice,
      total: item.totalAmount,
    })),
  };
};
