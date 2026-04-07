import Link from "next/link";
import React, { memo, useActionState, useDeferredValue, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import schema from "../data/form-fields.json";

type FieldOption = { value: string; label: string };

type FieldDef = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  checkboxLabel?: string;
};

type SectionDef = {
  id: string;
  label: string;
  multiplier: number;
  fields: FieldDef[];
};

type GroupDef = {
  id: string;
  label: string;
  weight: number;
  sections: SectionDef[];
};

type FormSchema = {
  version: number;
  title: string;
  groups: GroupDef[];
};

type FieldValue = string | number | boolean;
type FormValues = Record<string, FieldValue>;
type FormResult = { ok: true; message: string; at: number };

type ScoreSnapshot = {
  sectionScores: Record<string, number>;
  groupScores: Record<string, number>;
  total: number;
  filled: number;
};

const formSchema = schema as FormSchema;

async function submitForm(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
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

function buildDefaults(groups: GroupDef[]): FormValues {
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

function buildAutoValues(groups: GroupDef[]): FormValues {
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

function buildZodSchema(groups: GroupDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const group of groups) {
    for (const section of group.sections) {
      for (const field of section.fields) {
        if (field.type === "checkbox") {
          shape[field.id] = field.required
            ? z.boolean().refine((v) => v === true, "必选")
            : z.boolean();
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

function calcScores(groups: GroupDef[], values: FormValues | undefined): ScoreSnapshot {
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

const FieldRow = memo(function FieldRow({
  field,
  register,
  currentValue,
  error,
}: {
  field: FieldDef;
  register: UseFormRegister<FormValues>;
  currentValue: FieldValue | undefined;
  error?: string;
}) {
  const id = field.id;
  const label = (
    <label htmlFor={id} className="mb-2 block text-xs font-medium text-slate-700">
      {field.label}
      {field.required ? <span className="text-rose-600"> *</span> : null}
    </label>
  );

  const base = {
    id,
    ...register(id),
  };

  return (
    <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      {label}
      <div className="space-y-1">
        {field.type === "textarea" ? (
          <textarea {...base} rows={2} placeholder={field.placeholder} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500" />
        ) : field.type === "select" ? (
          <select {...base} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500">
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : field.type === "checkbox" ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register(id)} />
            <span>{field.checkboxLabel ?? "启用"}</span>
          </label>
        ) : field.type === "radio" ? (
          <div className="flex flex-wrap gap-3">
            {(field.options ?? []).map((o) => (
              <label key={o.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="radio" value={o.value} {...register(id)} />
                {o.label}
              </label>
            ))}
          </div>
        ) : field.type === "range" ? (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              {...register(id, { valueAsNumber: true })}
              className="w-full"
            />
            <output className="min-w-10 text-sm text-slate-700">{String(currentValue ?? field.min ?? 0)}</output>
          </div>
        ) : (
          <input
            type={field.type}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            {...register(id, field.type === "number" ? { valueAsNumber: true } : undefined)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
          />
        )}
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
});

export default function FormDemoPage() {
  const groups = formSchema.groups;

  const allFields = useMemo(() => {
    const list: FieldDef[] = [];
    for (const g of groups) {
      for (const s of g.sections) {
        list.push(...s.fields);
      }
    }
    return list;
  }, [groups]);

  const defaults = useMemo(() => buildDefaults(groups), [groups]);
  const autoValues = useMemo(() => buildAutoValues(groups), [groups]);
  const zodSchema = useMemo(() => buildZodSchema(groups), [groups]);

  const { register, handleSubmit, control, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(zodSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const watchedValues = useWatch({ control }) as FormValues | undefined;
  const deferredValues = useDeferredValue(watchedValues);

  const scores = useMemo(() => calcScores(groups, deferredValues), [groups, deferredValues]);

  const [result, formAction, isPending] = useActionState(submitForm, null);
  const [statusLine, setStatusLine] = useState("");
  const [optimisticLine, addOptimisticLine] = useOptimistic(statusLine, (_current, pending: string) => pending);
  const [isNavPending, startTransition] = useTransition();

  useEffect(() => {
    if (result?.ok) {
      setStatusLine(`服务端已确认：${result.message}`);
    }
  }, [result]);

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) {
      fd.append(k, String(v));
    }

    startTransition(() => {
      addOptimisticLine("已乐观提交：等待 useActionState 完成…");
      formAction(fd);
    });
  });

  const resetAll = () => {
    startTransition(() => {
      reset(defaults);
    });
  };

  const fillAllForTest = () => {
    startTransition(() => {
      reset(autoValues);
    });
  };

  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
      <header className="mb-5">
        <p className="mb-2">
          <Link href="/" className="text-blue-600 hover:underline">
            ← 返回首页
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">大规模表单（300 控件，双层数组结构）</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          技术方案：React 19 + React Hook Form + Zod
        </p>
        <ul className="mt-2 text-sm leading-6 text-slate-600">
          <li className="list-decimal">渲染优化：避免不必要的渲染，并尽可能降低每次渲染的成本：
            <ul className="list-disc">
              <li className="list-item">使用 react-hook-form 的非受控组件减少 render 触发</li>
              <li className="list-item">使用 useCallback 稳定函数类型的 props</li>
              <li className="list-item">使用 useMemo 缓存计算结果并稳定引用类型的 props</li>
              <li className="list-item">使用 React.memo 在 props 不变时跳过组件渲染</li>
            </ul>
          </li>
          <li className="list-decimal">表单联动：使用react-hook-form的useWatch订阅模式减少联动时render范围，使用startTransition降低更新的优先级和useDeferredValue延迟值的更新，让重计算和联动不阻塞输入</li>
          <li className="list-decimal">
            表单提交：
            <ul className="list-disc">
              <li className="list-item">使用 startTransition 将提交后的更新设为低优先级，避免阻塞界面渲染；</li>
              <li className="list-item">使用 useActionState 管理提交流程状态；</li>
              <li className="list-item">使用 useOptimistic 提供乐观更新，从而提升提交过程中的用户体验。</li>
            </ul>
          </li>
          <li className="list-decimal">表单校验：使用typescript、zod做运行时数据校验和表单校验。</li>
          <li className="list-decimal">AI生成：使用cursor vibe coding模式，代码100% AI生成。</li>
        </ul>
      </header>

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div>
          <strong>状态：</strong>
          {isPending || isNavPending ? "处理中…" : "就绪"}
        </div>
        <div className="mt-2">
          <strong>useOptimistic 文案：</strong>
          {optimisticLine || "（提交后会先显示乐观提示，再与 useActionState 结果对齐）"}
        </div>
        {result?.ok ? (
          <div className="mt-2 text-emerald-600">
            {result.message}（{new Date(result.at).toLocaleTimeString()}）
          </div>
        ) : null}
        <p className="mt-2">
          非空字段数（deferred）: <strong>{scores.filled}</strong> / {allFields.length}
        </p>
        <p className="mt-1">
          总分（全部 group 加总）: <strong>{scores.total}</strong>
        </p>
      </section>

      <form onSubmit={onSubmit} className="mb-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
            提交（RHF + Zod + useActionState）
          </button>
          <button type="button" onClick={fillAllForTest} disabled={isNavPending} className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60">
            自动填充（测试）
          </button>
          <button type="button" onClick={resetAll} disabled={isNavPending} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
            重置（startTransition）
          </button>
        </div>

        {groups.map((group) => (
          <section key={group.id} className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {group.label}（weight={group.weight}，groupScore={scores.groupScores[group.id] ?? 0}）
            </h2>

            {group.sections.map((section) => (
              <div key={section.id} className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  {section.label}（multiplier={section.multiplier}，sectionScore={scores.sectionScores[section.id] ?? 0}）
                </h3>
                <div className="grid grid-cols-12 gap-3">
                  {section.fields.map((field) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      register={register}
                      currentValue={deferredValues?.[field.id]}
                      error={(formState.errors as FieldErrors<FormValues>)[field.id]?.message as string | undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </form>
    </section>
  );
}
