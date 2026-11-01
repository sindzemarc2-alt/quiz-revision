"use client";

import { useState } from "react";
import SummaryMarkdown from "./SummaryMarkdown";
import { useLanguage } from "./LanguageProvider";

const MAX_BYTES = 4 * 1024 * 1024;
const TIMEOUT_MS = 125000;

type SummaryResult = {
  summary: string;
  pages: number;
};

export default function SummaryApp() {
  const { language, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createSummary() {
    setError(null);
    setCopied(false);

    if (!file) {
      setError(t("choosePdfFirst"));
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdfOnly"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("fileTooLarge"));
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", language);
      const response = await fetch("/api/summary", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || typeof data?.summary !== "string") {
        setError(data?.error?.message ?? t("summaryFallbackError"));
        return;
      }

      setSummary({ summary: data.summary, pages: data.pages });
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === "AbortError";
      setError(
        timedOut
          ? t("summaryTimeout")
          : t("connectionError")
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.summary);
      setCopied(true);
    } catch {
      setError(t("copyError"));
    }
  }

  const card = "quiz-card";
  const primary = "quiz-primary";

  return (
    <div className="summary-stack">
      <section className={card} aria-label={t("createSummaryRegion")}>
        <label className="quiz-form-label" htmlFor="summary-pdf">
        01 <span className="quiz-muted">/</span> {t("uploadTitle")}
        </label>
        <input
          id="summary-pdf"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setSummary(null);
            setError(null);
          }}
          className="quiz-file-input"
          disabled={loading}
        />
        {file && (
          <p className="quiz-hint">
            {t("selectedFile", { name: file.name, size: (file.size / 1024).toFixed(0) })}
          </p>
        )}
        {error && <p role="alert" className="quiz-alert">{error}</p>}
        <button
          type="button"
          onClick={() => void createSummary()}
          disabled={!file || loading}
          className={primary + " quiz-full-width"}
          style={{ marginTop: 22 }}
        >
          {loading ? t("summaryLoadingButton") : t("summarizePdf")}
        </button>
        <p className="quiz-hint">
          {t("pdfHint")}
        </p>
      </section>

      {loading && (
        <section className={card + " quiz-loading"} role="status">
          <div className="loading-orbit" aria-hidden="true">✦</div>
          <p className="text-lg font-semibold">{t("summaryLoading")}</p>
          <p className="quiz-hint">{t("summaryLoadingHint")}</p>
        </section>
      )}

      {summary && !loading && (
        <section className={card + " summary-result"} aria-live="polite">
          <div className="summary-result-header">
            <div>
              <p className="hero-eyebrow">{t("summaryReady")}</p>
              <h2 className="quiz-review-title">{file?.name}</h2>
              <p className="quiz-hint">
                {summary.pages === 1 ? t("pageAnalyzed") : t("pagesAnalyzed", { count: summary.pages })}
              </p>
            </div>
            <button type="button" className="quiz-secondary" onClick={() => void copySummary()}>
              {copied ? t("copied") : t("copySummary")}
            </button>
          </div>
          <SummaryMarkdown content={summary.summary} />
        </section>
      )}
    </div>
  );
}
