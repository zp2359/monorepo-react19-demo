import Link from "next/link";
import { useEffect, useState } from "react";
import type { NextWebVitalsMetric } from "next/app";

type LoggedMetric = NextWebVitalsMetric & { index: number };

const METRIC_COLORS: Record<string, string> = {
  FCP: "bg-sky-500",
  LCP: "bg-emerald-500",
  CLS: "bg-amber-500",
  INP: "bg-purple-500",
  TTFB: "bg-rose-500",
};

const METRIC_META: Record<string, { title: string; meaning: string; unit: string }> = {
  FCP: { title: "FCP", meaning: "首次内容绘制：用户首次看到页面内容的速度", unit: "ms" },
  LCP: { title: "LCP", meaning: "最大内容绘制：主内容可见所需时间", unit: "ms" },
  CLS: { title: "CLS", meaning: "累积布局偏移：页面视觉稳定性（越低越好）", unit: "score" },
  INP: { title: "INP", meaning: "交互到下一次绘制：交互响应延迟（越低越好）", unit: "ms" },
  TTFB: { title: "TTFB", meaning: "首字节时间：服务器开始返回数据的速度", unit: "ms" },
};

export default function WebVitalsPage() {
  const [metrics, setMetrics] = useState<LoggedMetric[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = (window as any).__WEB_VITALS_LOG__ as NextWebVitalsMetric[] | undefined;
    if (!raw) return;
    setMetrics(
      raw.map((m, idx) => ({
        ...m,
        index: idx,
      }))
    );
  }, []);

  const byName = metrics.reduce<Record<string, LoggedMetric[]>>((acc, m) => {
    (acc[m.name] ??= []).push(m);
    return acc;
  }, {});

  const latestValue = (name: string) => {
    const list = byName[name];
    if (!list || list.length === 0) return null;
    return list[list.length - 1]?.value ?? null;
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            <Link href="/" className="text-blue-600 hover:underline">
              ← 返回 Host 首页
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Web Vitals 性能概览（Host）</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            本页展示当前会话内采集到的 Web Vitals 指标。多刷新几次页面、在不同交互场景下回到本页，可以直观看到指标分布。
          </p>
        </div>
      </header>

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-700">
        <p>
          当前缓存的样本数：<strong>{metrics.length}</strong>
        </p>
        <p className="mt-1">
          指标按名称分组，每个条形表示一次采样（越长代表数值越大，仅用于相对对比）。
        </p>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Object.values(METRIC_META).map((meta) => {
          const value = latestValue(meta.title);
          return (
            <article key={meta.title} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">{meta.title}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {value === null ? "--" : value.toFixed(2)}
                <span className="ml-1 text-xs font-medium text-slate-500">{meta.unit}</span>
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{meta.meaning}</p>
            </article>
          );
        })}
      </section>

      {Object.keys(byName).length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          暂无数据。请在 Host 首页和 Home 表单页进行几次访问 / 交互后，再回到本页查看。
        </p>
      ) : (
        <div className="space-y-5">
          {Object.entries(byName).map(([name, rawList]) => {
            const list = rawList as LoggedMetric[];
            const max = Math.max(...list.map((m) => m.value || 0), 1);
            const color = METRIC_COLORS[name] ?? "bg-slate-500";
            return (
              <section key={name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <header className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {name} <span className="ml-2 text-xs text-slate-500">(样本 {list.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    最大值：{max.toFixed(2)}，单位依据指标（ms/秒/分数）
                  </p>
                </header>
                <div className="space-y-1.5">
                  {list.map((m) => {
                    const width = `${Math.max((m.value / max) * 100, 4).toFixed(1)}%`;
                    return (
                      <div key={m.id + m.index} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="h-3 flex-1 rounded bg-slate-100">
                          <div className={`h-3 rounded ${color}`} style={{ width }} />
                        </div>
                        <span className="w-24 text-right tabular-nums">{m.value.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

