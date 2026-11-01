"use client";

import Link from "next/link";
import QuizApp from "../components/QuizApp";
import { LanguageSwitcher, useLanguage } from "../components/LanguageProvider";

export default function QuizPage() {
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
          <p className="hero-eyebrow">{t("quizEyebrow")}</p>
          <h1 className="tool-title">
            {t("quizTitle")}
          </h1>
          <p className="hero-description">
            {t("quizDescription")}
          </p>
        </section>
        <section className="app-content" aria-label={t("quizRegion")}>
          <QuizApp />
        </section>
        <footer className="app-footer">{t("quizFooter")}</footer>
      </div>
    </main>
  );
}
