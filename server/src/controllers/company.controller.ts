import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const createCompany = async (req: Request, res: Response) => {
  try {
    const { companyName, address, phone } = req.body;
    const company = await prisma.company.create({
      data: { companyName, address, phone },
    });
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ error: "Failed to create company", detail: err });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  const companies = await prisma.company.findMany();
  res.json(companies);
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({ where: { id } });

    if (!company) {
      res.status(404).json({ error: "Company not found" });
    }

    res.json(company);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch company", detail: err });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyName, address, phone } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: { companyName, address, phone },
    });

    res.json(company);
  } catch (err) {
    res.status(400).json({ error: "Failed to update company", detail: err });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.company.delete({ where: { id } });
    res.json({ message: "Company deleted" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete company", detail: err });
  }
};
