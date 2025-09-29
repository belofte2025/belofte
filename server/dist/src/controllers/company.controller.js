"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCompany = exports.updateCompany = exports.getCompanyById = exports.getCompanies = exports.createCompany = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const createCompany = async (req, res) => {
    try {
        const { companyName, address, phone } = req.body;
        const company = await prisma_1.default.company.create({
            data: { companyName, address, phone },
        });
        res.status(201).json(company);
    }
    catch (err) {
        res.status(400).json({ error: "Failed to create company", detail: err });
    }
};
exports.createCompany = createCompany;
const getCompanies = async (req, res) => {
    const companies = await prisma_1.default.company.findMany();
    res.json(companies);
};
exports.getCompanies = getCompanies;
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await prisma_1.default.company.findUnique({ where: { id } });
        if (!company) {
            res.status(404).json({ error: "Company not found" });
        }
        res.json(company);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch company", detail: err });
    }
};
exports.getCompanyById = getCompanyById;
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyName, address, phone } = req.body;
        const company = await prisma_1.default.company.update({
            where: { id },
            data: { companyName, address, phone },
        });
        res.json(company);
    }
    catch (err) {
        res.status(400).json({ error: "Failed to update company", detail: err });
    }
};
exports.updateCompany = updateCompany;
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.company.delete({ where: { id } });
        res.json({ message: "Company deleted" });
    }
    catch (err) {
        res.status(400).json({ error: "Failed to delete company", detail: err });
    }
};
exports.deleteCompany = deleteCompany;
