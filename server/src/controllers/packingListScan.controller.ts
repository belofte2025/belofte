import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

const PackingListSchema = z.object({
  items: z.array(
    z.object({
      itemName: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
    })
  ),
});

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const scanPackingList = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No image uploaded" });
    return;
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    res.status(400).json({ error: "Unsupported image type. Use JPEG, PNG, WEBP, or GIF." });
    return;
  }

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.mimetype as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: file.buffer.toString("base64"),
              },
            },
            {
              type: "text",
              text:
                "This is a photo of a packing list, invoice, or manifest for a shipping container. " +
                "Extract every line item as a row with itemName, quantity, and unitPrice. " +
                "If a row has no visible unit price, use 0. Ignore headers, totals, subtotals, and page numbers. " +
                "Use the item description exactly as printed, trimmed of extra whitespace.",
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(PackingListSchema),
      },
    });

    if (response.stop_reason === "refusal") {
      res.status(502).json({ error: "Could not analyze this image. Try a different photo." });
      return;
    }
    if (!response.parsed_output) {
      res.status(502).json({ error: "Couldn't read any items from the image. Try a clearer photo." });
      return;
    }

    res.json({ items: response.parsed_output.items });
  } catch (error) {
    console.error("Packing list scan error:", error);
    if (error instanceof Anthropic.APIError) {
      res.status(502).json({ error: "Image analysis failed. Try again." });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
