import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { companyName, address, phone } = req.body;
    if (!companyName?.trim()) {
      res.status(400).json({ error: "Company name is required" });
      return;
    }
    const company = await prisma.company.create({
      data: { companyName: companyName.trim(), address, phone },
    });
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ error: "Failed to create company", detail: err });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    res.json(company ? [company] : []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch companies" });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (id !== companyId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch company" });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (id !== companyId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { companyName, address, phone } = req.body;
    const company = await prisma.company.update({
      where: { id },
      data: { companyName, address, phone },
    });
    res.json(company);
  } catch (err) {
    res.status(400).json({ error: "Failed to update company" });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    if (id !== companyId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.company.delete({ where: { id } });
    res.json({ message: "Company deleted" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete company" });
  }
};
