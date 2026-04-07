import React from "react";
import FormDemoPage from "./form";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="text-2xl font-semibold">首页微前端（Home）</h1>
      <p className="mt-2 text-slate-600">这是通过 webpack5 联邦模块暴露给基座的页面。</p>
      <FormDemoPage />
    </main>
  );
}

