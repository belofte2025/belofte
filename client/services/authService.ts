import api from "@/lib/api";

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  companyId: string
) => {
  const res = await api.post("/auth/register", {
    name,
    email,
    password,
    companyId,
  });
  return res.data;
};
