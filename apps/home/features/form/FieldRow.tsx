import React, { memo } from "react";
import type { UseFormRegister } from "react-hook-form";
import type { FieldDef, FieldValue, FormValues } from "./types";

type FieldRowProps = {
  field: FieldDef;
  register: UseFormRegister<FormValues>;
  currentValue: FieldValue | undefined;
  error?: string;
};

export const FieldRow = memo(function FieldRow({ field, register, currentValue, error }: FieldRowProps) {
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
          <textarea
            {...base}
            rows={2}
            placeholder={field.placeholder}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
          />
        ) : field.type === "select" ? (
          <select
            {...base}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
          >
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
