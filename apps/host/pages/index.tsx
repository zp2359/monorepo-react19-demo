import dynamic from "next/dynamic";
import React from "react";
import Link from "next/link";

const RemoteHome = dynamic(() => import("home/HomePage"), {
  ssr: false,
  loading: () => <p className="text-slate-500">正在加载远程模块（需先启动 home :3001）…</p>,
});

export default function IndexPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold text-slate-900">基座应用（Host）</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            下面区域通过 webpack5 Module Federation 从首页微前端加载：
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/vitals"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              查看 Web Vitals 性能图表
            </Link>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <RemoteHome />
        </section>
      </section>
    </main>
  );
}

