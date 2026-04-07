import type { AppProps, NextWebVitalsMetric } from "next/app";
import "../../../packages/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.info(`[web-vitals][home] ${metric.name}`, {
    id: metric.id,
    value: metric.value,
    label: metric.label,
  });
}
