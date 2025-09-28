// lib/auth.ts

export type User = {
  id: string;
  userName: string;
  email: string;
  role: string;
  companyId: string;
  company: { companyName: string };
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;

  const userJson = localStorage.getItem("user");
  return userJson ? (JSON.parse(userJson) as User) : null;
};
