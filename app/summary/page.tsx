"use client";

import Link from "next/link";
import SummaryApp from "../components/SummaryApp";
import { LanguageSwitcher, useLanguage } from "../components/LanguageProvider";

export default function SummaryPage() {
  const { t } = useLanguage();

  return (
    <main className="app-shell">
      <div className="app-container">
        <header className="tool-header">
          <Link className="brand tool-back-link" href="/">
            <span className="brand-mark" aria-hidden="true">←</span>
            {t("backHome")}
          </Link>
          <LanguageSwitcher />
        </header>
        <section className="tool-intro">
          <p className="hero-eyebrow">{t("summaryEyebrow")}</p>
          <h1 className="tool-title">
            {t("summaryTitle")}
          </h1>
          <p className="hero-description">
            {t("summaryDescription")}
          </p>
        </section>
        <SummaryApp />
        <footer className="app-footer">{t("summaryFooter")}</footer>
      </div>
    </main>
  );
}
