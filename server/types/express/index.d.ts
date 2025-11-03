import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        userName: string;
        companyId: string;
        role: string;
      };
    }
  }
}

export {};
