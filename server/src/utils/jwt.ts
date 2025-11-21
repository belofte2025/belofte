import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  companyId: string;
  userName: string;
  email: string;
  role: string;
  roleId?: string | null;
  permissions?: string[];
}

export const generateToken = ({
  userId,
  companyId,
  userName,
  email,
  role,
  roleId,
  permissions = [],
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
      permissions
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};
