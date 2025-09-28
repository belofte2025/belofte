import * as XLSX from "xlsx";

export const parseExcel = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);

  return json.map((row: any) => ({
    itemName: row.Item || row.Name || row.item || "",
    quantity: parseInt(row.Quantity || row.Qty || row.quantity || "0", 10),
  }));
};
