export type Container = {
  id: string;
  number: string;
  company: string;
  deliveryDate: string;
  status: "Pending" | "Shipped" | "Arrived" | "Received" | "Done";
};
