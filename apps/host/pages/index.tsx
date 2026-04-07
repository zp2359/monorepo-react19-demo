import dynamic from "next/dynamic";
import React from "react";

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
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <RemoteHome />
        </section>
      </section>
    </main>
  );
}

