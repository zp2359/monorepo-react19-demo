import type { AppProps, NextWebVitalsMetric } from "next/app";
import "../../../packages/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window !== "undefined") {
    const key = "__WEB_VITALS_LOG__";
    const existing = (window as any)[key] as NextWebVitalsMetric[] | undefined;
    const next = [...(existing ?? []), metric];
    (window as any)[key] = next;
  }
  console.info(`[web-vitals][host] ${metric.name}`, {
    id: metric.id,
    value: metric.value,
    label: metric.label,
  });
}
