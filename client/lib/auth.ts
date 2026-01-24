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

  try {
    const userJson = localStorage.getItem("user");
    if (!userJson || userJson === "undefined" || userJson === "null") {
      return null;
    }
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error("Failed to parse user from localStorage:", error);
    localStorage.removeItem("user");
    return null;
  }
};
