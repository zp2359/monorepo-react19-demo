import Link from "next/link";
import React, { useActionState, useDeferredValue, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { FieldRow } from "../features/form/FieldRow";
import {
  buildAutoValues,
  buildDefaults,
  buildZodSchema,
  calcScores,
  flattenFields,
  submitForm,
} from "../features/form/logic";
import { formSchema } from "../features/form/schema";
import type { FormValues } from "../features/form/types";

export default function FormDemoPage() {
  const groups = formSchema.groups;

  const allFields = useMemo(() => flattenFields(groups), [groups]);
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
        <p className="mt-2 text-sm leading-6 text-slate-600">技术方案：React 19 + React Hook Form + Zod</p>
        <ul className="mt-2 text-sm leading-6 text-slate-600">
          <li className="list-decimal">
            渲染优化：避免不必要的渲染，并尽可能降低每次渲染的成本：
            <ul className="list-disc">
              <li className="list-item">使用 react-hook-form 的非受控组件减少 render 触发</li>
              <li className="list-item">使用 useMemo 缓存计算结果并稳定引用类型的 props</li>
              <li className="list-item">使用 React.memo 在 props 不变时跳过组件渲染</li>
            </ul>
          </li>
          <li className="list-decimal">表单联动：useWatch 订阅 + startTransition + useDeferredValue，降低输入阻塞。</li>
          <li className="list-decimal">表单提交：useActionState + useOptimistic 提升提交交互体验。</li>
          <li className="list-decimal">表单校验：使用 TypeScript 与 Zod 做运行时与类型校验。</li>
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
