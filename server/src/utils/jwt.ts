import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  companyId: string;
  userName: string;
  email: string;
  role: string;
  roleId?: string | null;
  permissions?: string[];
  isSuperAdmin?: boolean;
}

export const generateToken = ({
  userId,
  companyId,
  userName,
  email,
  role,
  roleId,
  permissions = [],
  isSuperAdmin = false,
}: TokenPayload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  return jwt.sign(
    {
      userId,
      companyId,
      email,
      userName,
      role,
      roleId,
      permissions,
      isSuperAdmin,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};
