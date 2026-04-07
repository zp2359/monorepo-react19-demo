import { z } from "zod";
import type { FieldDef, FieldValue, FormResult, FormValues, GroupDef, ScoreSnapshot } from "./types";

export async function submitForm(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  await new Promise((r) => setTimeout(r, 450));
  const keys = new Set(formData.keys());
  return {
    ok: true,
    message: `已接收 ${keys.size} 个命名字段（RHF + Zod）`,
    at: Date.now(),
  };
}

function toDefaultValue(field: FieldDef): FieldValue {
  if (field.type === "checkbox") return false;
  if (field.type === "number" || field.type === "range") return field.min ?? 0;
  if (field.type === "color") return "#000000";
  if (field.type === "select" || field.type === "radio") return field.options?.[0]?.value ?? "";
  return "";
}

export function buildDefaults(groups: GroupDef[]): FormValues {
  const defaults: FormValues = {};
  for (const group of groups) {
    for (const section of group.sections) {
      for (const field of section.fields) {
        defaults[field.id] = toDefaultValue(field);
      }
    }
  }
  return defaults;
}

function toAutoValue(field: FieldDef): FieldValue {
  switch (field.type) {
    case "checkbox":
      return true;
    case "number":
      return typeof field.min === "number" ? Math.max(field.min, 1) : 1;
    case "range":
      return typeof field.max === "number" ? field.max : 100;
    case "color":
      return "#2563eb";
    case "email":
      return "demo@example.com";
    case "url":
      return "https://example.com";
    case "tel":
      return "13800138000";
    case "date":
      return "2026-04-08";
    case "time":
      return "10:30";
    case "datetime-local":
      return "2026-04-08T10:30";
    case "textarea":
      return "自动填充文本";
    case "select":
    case "radio":
      return field.options?.[0]?.value ?? "";
    default:
      return "auto-value";
  }
}

export function buildAutoValues(groups: GroupDef[]): FormValues {
  const values: FormValues = {};
  for (const group of groups) {
    for (const section of group.sections) {
      for (const field of section.fields) {
        values[field.id] = toAutoValue(field);
      }
    }
  }
  return values;
}

export function buildZodSchema(groups: GroupDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const group of groups) {
    for (const section of group.sections) {
      for (const field of section.fields) {
        if (field.type === "checkbox") {
          shape[field.id] = field.required ? z.boolean().refine((v) => v === true, "必选") : z.boolean();
          continue;
        }

        if (field.type === "number" || field.type === "range") {
          let numSchema = z.coerce.number();
          if (typeof field.min === "number") numSchema = numSchema.min(field.min, `不能小于 ${field.min}`);
          if (typeof field.max === "number") numSchema = numSchema.max(field.max, `不能大于 ${field.max}`);
          shape[field.id] = numSchema;
          continue;
        }

        if (field.type === "select" || field.type === "radio") {
          const optionValues = (field.options ?? []).map((o) => o.value);
          const optionSchema = (field.required ? z.string().min(1, "必填") : z.string()).refine(
            (v) => optionValues.includes(v),
            "无效选项"
          );
          shape[field.id] = optionSchema;
          continue;
        }

        let strSchema = z.string();
        if (field.required) strSchema = strSchema.min(1, "必填");
        if (field.type === "email") strSchema = strSchema.email("邮箱格式不正确");
        if (field.type === "url") strSchema = strSchema.url("URL 格式不正确");
        shape[field.id] = strSchema;
      }
    }
  }
  return z.object(shape);
}

function isFilled(value: FieldValue | undefined) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return true;
  return String(value ?? "").trim() !== "";
}

export function calcScores(groups: GroupDef[], values: FormValues | undefined): ScoreSnapshot {
  const sectionScores: Record<string, number> = {};
  const groupScores: Record<string, number> = {};
  let total = 0;
  let filled = 0;

  for (const group of groups) {
    let groupBase = 0;
    for (const section of group.sections) {
      let sectionFilled = 0;
      for (const field of section.fields) {
        if (isFilled(values?.[field.id])) {
          sectionFilled += 1;
          filled += 1;
        }
      }
      const sectionScore = sectionFilled * section.multiplier;
      sectionScores[section.id] = sectionScore;
      groupBase += sectionScore;
    }

    const groupScore = groupBase * group.weight;
    groupScores[group.id] = groupScore;
    total += groupScore;
  }

  return { sectionScores, groupScores, total, filled };
}

export function flattenFields(groups: GroupDef[]): FieldDef[] {
  const list: FieldDef[] = [];
  for (const group of groups) {
    for (const section of group.sections) {
      list.push(...section.fields);
    }
  }
  return list;
}
