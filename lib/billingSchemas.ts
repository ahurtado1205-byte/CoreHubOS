import { z } from "zod";

export const moneySchema = z.object({
  amount: z.number().finite(),
  currency: z.string().length(3),
  exchangeRate: z.number().positive().default(1),
});

export const versionedCommandSchema = z.object({
  version: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(128),
});

export const createChargeSchema = versionedCommandSchema.extend({
  folioId: z.string().uuid().or(z.string().min(1)),
  entryType: z.enum(["room_charge", "extra_charge", "discount", "adjustment"]),
  sourceType: z.string().min(1),
  sourceId: z.string().uuid().or(z.string().min(1)).optional(),
  serviceDate: z.string(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitAmount: z.number(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export const issueInvoiceSchema = versionedCommandSchema.extend({
  invoiceId: z.string().uuid().or(z.string().min(1)),
  mode: z.enum(["proforma", "fiscal"]),
  documentClass: z.enum(["A", "B", "C", "E", "T", "NC", "ND", "RCPT"]).optional(),
  pointOfSale: z.number().int().positive().optional(),
});

export const createPaymentSchema = versionedCommandSchema.extend({
  folioId: z.string().uuid().or(z.string().min(1)),
  provider: z.string().min(1),
  methodType: z.string().min(1),
  money: moneySchema,
  externalReference: z.string().max(128).optional(),
  capture: z.boolean().default(true),
});
