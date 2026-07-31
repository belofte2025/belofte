import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { getCurrentUser } from "@/lib/auth";

/**
 * Standard PDF Template Configuration
 * Provides consistent branding and formatting across all reports
 */

export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: "portrait" | "landscape";
  companyInfo?: CompanyInfo;
  pageSize?: "a4" | "letter";
}

export interface TableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

/**
 * Default company information (fallback)
 */
const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "PETROS",
};

/**
 * Get company information from the currently logged-in user
 * Falls back to DEFAULT_COMPANY_INFO if no user is logged in
 */
export function getCompanyInfo(): CompanyInfo {
  const user = getCurrentUser();
  if (user?.company?.companyName) {
    return {
      name: user.company.companyName,
    };
  }
  return DEFAULT_COMPANY_INFO;
}

/**
 * Color scheme for professional reports
 */
const COLORS = {
  primary: [30, 58, 138] as const, // Blue
  secondary: [79, 70, 229] as const, // Indigo
  success: [5, 150, 105] as const, // Green
  danger: [220, 38, 38] as const, // Red
  warning: [245, 158, 11] as const, // Amber
  gray: [107, 114, 128] as const,
  lightGray: [249, 250, 251] as const,
  white: [255, 255, 255] as const,
  text: [17, 24, 39] as const,
};

/**
 * Add professional header with company branding to PDF
 */
export function addPDFHeader(doc: jsPDF, options: PDFReportOptions): number {
  const companyInfo = options.companyInfo || getCompanyInfo();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 15;

  // Company Name (Large, Bold)
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;

  // Horizontal line separator
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, yPosition, pageWidth - 14, yPosition);
  yPosition += 7;

  // Report Title
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text(options.title, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  // Subtitle and Generation date on same line
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.setFont("helvetica", "normal");

  const generatedText = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

  if (options.subtitle) {
    const combinedText = `${options.subtitle} | ${generatedText}`;
    doc.text(combinedText, pageWidth / 2, yPosition, { align: "center" });
  } else {
    doc.text(generatedText, pageWidth / 2, yPosition, { align: "center" });
  }
  yPosition += 5;

  return yPosition; // Return next available Y position
}

/**
 * Add professional footer with page numbers
 */
export function addPDFFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Footer line
  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.setFont("helvetica", "normal");

  // Left: Company name
  doc.text("Powered by PETROS | EYO SOLUTIONS", 14, pageHeight - 10);

  // Right: Page number
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth - 14,
    pageHeight - 10,
    { align: "right" }
  );
}

/**
 * Create a professional PDF report with automatic page handling
 * Enhanced with high-quality settings for crisp, sharp output
 * @returns Object containing the jsPDF document and the Y position where the header ends
 */
export function createPDFReport(options: PDFReportOptions): {
  doc: jsPDF;
  headerEndY: number;
} {
  const doc = new jsPDF({
    orientation: options.orientation || "portrait",
    format: options.pageSize || "a4",
    unit: "pt", // Use points for better precision
    compress: true, // Enable compression while maintaining quality
    precision: 16, // Higher precision for sharper rendering
  });

  // Add header and get the ending Y position
  const headerEndY = addPDFHeader(doc, options);

  return { doc, headerEndY };
}

/**
 * Add a professional table to PDF with automatic page breaks
 */
export function addPDFTable(
  doc: jsPDF,
  data: RowInput[],
  columns: string[],
  startY: number,
  options?: {
    headerColor?: [number, number, number];
    alternateRowColor?: [number, number, number];
    footerRows?: RowInput[];
    columnStyles?: {
      [key: string]: {
        cellWidth?: number;
        halign?: "left" | "center" | "right";
      };
    };
  }
): void {
  autoTable(doc, {
    startY: startY,
    head: [columns],
    body: data,
    foot: options?.footerRows,
    theme: "grid",
    headStyles: {
      fillColor:
        options?.headerColor ||
        ([...COLORS.primary] as [number, number, number]),
      textColor: [...COLORS.white] as [number, number, number],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [...COLORS.text] as [number, number, number],
    },
    alternateRowStyles: {
      fillColor:
        options?.alternateRowColor ||
        ([...COLORS.lightGray] as [number, number, number]),
    },
    footStyles: {
      fillColor: [...COLORS.secondary] as [number, number, number],
      textColor: [...COLORS.white] as [number, number, number],
      fontSize: 10,
      fontStyle: "bold",
    },
    columnStyles: options?.columnStyles,
    margin: { left: 14, right: 14 },
    // Page break handling
    didDrawPage: (data) => {
      // Add footer to each page
      const pageCount = doc.getNumberOfPages();
      addPDFFooter(doc, data.pageNumber, pageCount);
    },
    // Prevent rows from breaking across pages where possible
    rowPageBreak: "avoid",
    // Add spacing between rows for readability
    styles: {
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
  });
}

/**
 * Add a summary section to PDF
 */
export function addPDFSummarySection(
  doc: jsPDF,
  summaryData: { label: string; value: string | number; highlight?: boolean }[],
  startY: number,
  title?: string
): number {
  let yPosition = startY;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Calculate box width to fit 5 items per row with proper spacing
  const itemsPerRow = Math.min(5, summaryData.length);
  const totalMargin = 14 * 2; // Left and right margins
  const gapBetweenBoxes = 8;
  const totalGaps = (itemsPerRow - 1) * gapBetweenBoxes;
  const boxWidth = (pageWidth - totalMargin - totalGaps) / itemsPerRow;

  if (title) {
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.text);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, yPosition);
    yPosition += 8;
  }

  // Draw summary boxes in a grid (5 per row)
  let xPosition = 14;
  const rowHeight = 20; // Further reduced for more compact display

  summaryData.forEach((item, index) => {
    // Start new row every 5 items
    if (index > 0 && index % itemsPerRow === 0) {
      xPosition = 14;
      yPosition += rowHeight + 4;
    }

    // Draw box
    const fillColor = item.highlight ? COLORS.primary : COLORS.lightGray;
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(xPosition, yPosition, boxWidth, rowHeight, "F");

    // Draw border
    doc.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.setLineWidth(0.1);
    doc.rect(xPosition, yPosition, boxWidth, rowHeight, "S");

    // Add label
    doc.setFontSize(6.5);
    const labelColor = item.highlight ? COLORS.white : COLORS.gray;
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, xPosition + 3, yPosition + 7);

    // Add value
    doc.setFontSize(10);
    const valueColor = item.highlight ? COLORS.white : COLORS.text;
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(String(item.value), xPosition + 3, yPosition + 15);

    xPosition += boxWidth + gapBetweenBoxes;
  });

  return yPosition + rowHeight + 6;
}

export function formatPDFCurrency(amount: number): string {
  return `₵ ${amount.toFixed(2)}`;
}

/**
 * Save PDF with proper filename
 */
export function savePDF(doc: jsPDF, filename: string): void {
  const timestamp = new Date().toISOString().split("T")[0];
  doc.save(`${filename}_${timestamp}.pdf`);
}

/**
 * Get optimized html2pdf configuration for high-quality, sharp output
 * Use this configuration for all html2pdf reports to ensure crisp rendering
 */
export function getHTML2PDFOptions() {
  return {
    margin: [6, 8, 6, 8], // Margins in mm [top, right, bottom, left]
    filename: "report.pdf",
    image: {
      type: "jpeg",
      quality: 0.98, // High quality (0-1 scale)
    },
    html2canvas: {
      scale: 3, // Higher scale = sharper output (2-4 recommended)
      useCORS: true,
      letterRendering: true, // Better text rendering
      dpi: 300, // High DPI for sharp text
      logging: false,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true, // Enable compression
      precision: 16, // Higher precision
    },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"],
    },
  };
}

/**
 * Get standard page break CSS for html2pdf reports
 */
export const PAGE_BREAK_CSS = `
  @media print {
    @page {
      size: A4;
      margin: 15mm;
    }

    body {
      margin: 0;
      padding: 0;
    }

    /* Prevent page breaks inside important elements */
    .no-page-break,
    .summary-section,
    .report-row,
    table tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Force page breaks before major sections */
    .page-break-before {
      page-break-before: always !important;
      break-before: always !important;
    }

    /* Prevent orphaned headers */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    /* Keep table headers with content */
    thead {
      display: table-header-group !important;
    }

    /* Prevent table rows from breaking */
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Ensure footer appears at bottom */
    .report-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      page-break-after: avoid !important;
    }
  }
`;

/**
 * Standard HTML template for html2pdf reports with company branding
 */
export function createHTMLReportTemplate(
  title: string,
  content: string,
  options?: {
    subtitle?: string;
    companyInfo?: CompanyInfo;
    summaryStats?: { label: string; value: string }[];
  }
): string {
  const company = options?.companyInfo || getCompanyInfo();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${PAGE_BREAK_CSS}

          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #111827;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-smooth: always;
          }

          .report-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 5mm 10mm;
          }

          .report-header {
            text-align: center;
            margin-bottom: 6px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 4px;
          }

          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 4px;
          }

          .report-title {
            font-size: 14px;
            font-weight: bold;
            color: #111827;
            margin: 4px 0 3px 0;
          }

          .report-meta {
            font-size: 10px;
            color: #6b7280;
          }

          .summary-stats {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin: 6px 0;
            page-break-inside: avoid;
          }

          .stat-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 6px 8px;
            border-radius: 3px;
            text-align: center;
          }

          .stat-label {
            font-size: 7px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 2px;
          }

          .stat-value {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0 15px 0;
            font-size: 9px;
          }

          th {
            background-color: #1e3a8a;
            color: white;
            padding: 6px;
            text-align: left;
            font-weight: 600;
            font-size: 9px;
          }

          td {
            padding: 5px 6px;
            border-bottom: 1px solid #e5e7eb;
          }

          tr:nth-child(even) {
            background-color: #f9fafb;
          }

          .report-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
          }

          .text-right {
            text-align: right;
          }

          .text-center {
            text-align: center;
          }

          .font-bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header no-page-break">
            <div class="company-name">${company.name}</div>
            <div class="report-title">${title}</div>
            <div class="report-meta">
              ${
                options?.subtitle
                  ? `${options.subtitle} | `
                  : ""
              }Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
            </div>
          </div>

          ${
            options?.summaryStats
              ? `
            <div class="summary-stats">
              ${options.summaryStats
                .map(
                  (stat) => `
                <div class="stat-box">
                  <div class="stat-label">${stat.label}</div>
                  <div class="stat-value">${stat.value}</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${content}

          <div class="report-footer">
            <p>Powered by PETROS | EYO SOLUTIONS</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
