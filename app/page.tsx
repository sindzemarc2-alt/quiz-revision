"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LanguageSwitcher, useLanguage } from "./components/LanguageProvider";

type Destination = "quiz" | "summary";

function Globe() {
  return (
    <div className="globe-stage" aria-hidden="true">
      <div className="globe-orbit globe-orbit-one" />
      <div className="globe-orbit globe-orbit-two" />
      <div className="globe">
        <div className="globe-ocean">
          <svg className="globe-map" viewBox="0 0 600 300" role="presentation">
            <defs>
              <clipPath id="globe-clip">
                <circle cx="300" cy="150" r="149" />
              </clipPath>
              <linearGradient id="land-gradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#b9e8d5" />
                <stop offset="100%" stopColor="#5db99a" />
              </linearGradient>
            </defs>
            <g clipPath="url(#globe-clip)" fill="url(#land-gradient)" opacity=".92">
              <g>
                <path d="m37 64 18-21 29-8 16-18 25 4 13 12 28-2 19 14-9 17-22 6-8 15-20 1-8 18-21 6-6 15-18-4-10-19-20-5-8-17-20-2z" />
                <path d="m144 134 23-5 18 12 13 22-4 22-12 17-5 24-14 29-10 26-15-7-7-21-9-15 3-20-12-19 2-23 13-16-2-15z" />
                <path d="m208 55 18-14 26 3 12 12 21-1 16 15-9 17-20 2-10 13-22 1-5 17-18 5-9 15-16-8-3-18 12-10-5-17 10-13z" />
                <path d="m252 112 22-12 22 8 15 21-4 20-10 18-7 25-16 20-11 24-16-8-6-23-12-19 5-19-9-18 8-20z" />
                <path d="m310 54 28-13 30 3 12 10 35-4 26 10 29-2 20 14-8 15-23 2-15 13-20-5-12 12-21-1-11 16-19-4-11-18-17 5-12-15-18 2-12-15-22 2-10-13z" />
                <path d="m427 151 24-12 26 7 11 15-8 16-19 6-12 19-17-8-13-19z" />
                <path d="m500 201 8-5 10 7-5 12-11-2z" />
              </g>
              <g transform="translate(300 0)">
                <path d="m37 64 18-21 29-8 16-18 25 4 13 12 28-2 19 14-9 17-22 6-8 15-20 1-8 18-21 6-6 15-18-4-10-19-20-5-8-17-20-2z" />
                <path d="m144 134 23-5 18 12 13 22-4 22-12 17-5 24-14 29-10 26-15-7-7-21-9-15 3-20-12-19 2-23 13-16-2-15z" />
                <path d="m208 55 18-14 26 3 12 12 21-1 16 15-9 17-20 2-10 13-22 1-5 17-18 5-9 15-16-8-3-18 12-10-5-17 10-13z" />
                <path d="m252 112 22-12 22 8 15 21-4 20-10 18-7 25-16 20-11 24-16-8-6-23-12-19 5-19-9-18 8-20z" />
                <path d="m310 54 28-13 30 3 12 10 35-4 26 10 29-2 20 14-8 15-23 2-15 13-20-5-12 12-21-1-11 16-19-4-11-18-17 5-12-15-18 2-12-15-22 2-10-13z" />
                <path d="m427 151 24-12 26 7 11 15-8 16-19 6-12 19-17-8-13-19z" />
                <path d="m500 201 8-5 10 7-5 12-11-2z" />
              </g>
            </g>
            <g className="globe-graticule" clipPath="url(#globe-clip)">
              <ellipse cx="300" cy="150" rx="149" ry="48" />
              <ellipse cx="300" cy="150" rx="149" ry="100" />
              <ellipse cx="300" cy="150" rx="54" ry="149" />
              <ellipse cx="300" cy="150" rx="105" ry="149" />
              <path d="M150 150h300M174 76h252M174 224h252" />
            </g>
          </svg>
        </div>
        <div className="globe-shine" />
        <div className="globe-shadow" />
      </div>
      <div className="globe-ground-glow" />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [active, setActive] = useState<Destination | null>(null);
  const [launching, setLaunching] = useState(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === "/") {
      const resetTimer = setTimeout(() => {
        setActive(null);
        setLaunching(false);
      }, 0);

      return () => clearTimeout(resetTimer);
    }

    return () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, [pathname]);

  function navigate(destination: Destination) {
    if (launching) return;
    setActive(destination);
    setLaunching(true);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    navigationTimer.current = setTimeout(
      () => router.push(destination === "quiz" ? "/quiz" : "/summary"),
      prefersReducedMotion ? 0 : 850
    );
  }

  return (
    <main className={`app-shell home-shell${launching ? " home-launching" : ""}`}>
      <div className="home-container">
        <header className="home-header">
          <p className="brand">
            <Image
              className="brand-logo"
              src="/revision-quiz-logo.png"
              alt=""
              width={44}
              height={44}
              priority
            />
            {t("brand")}
          </p>
          <LanguageSwitcher />
        </header>

        <section className={`home-hero${active ? ` home-active-${active}` : ""}${launching ? " home-is-launching" : ""}`}>
          <div className="home-copy">
            <p className="hero-eyebrow">{t("homeEyebrow")}</p>
            <h1 className="hero-title">
              {t("homeTitle")}<span>{t("homeTitleAccent")}</span>
            </h1>
            <p className="hero-description">
              {t("homeDescription")}
            </p>
          </div>

          <Globe />

          <div className="home-options" aria-label={t("homeEyebrow")}>
            <button
              type="button"
              className="home-option"
              onPointerEnter={() => setActive("quiz")}
              onFocus={() => setActive("quiz")}
              onPointerLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              onClick={() => navigate("quiz")}
              disabled={launching}
            >
              <span className="home-option-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M8 4.75h8A2.25 2.25 0 0 1 18.25 7v13L12 16.5 5.75 20V7A2.25 2.25 0 0 1 8 4.75Z" />
                  <path d="m9 10 2 2 4-4" />
                </svg>
              </span>
              <span className="home-option-text">
                <strong>{t("quizOptionTitle")}</strong>
                <span>{t("quizOptionDescription")}</span>
              </span>
              <span className="home-option-arrow" aria-hidden="true">↗</span>
            </button>

            <button
              type="button"
              className="home-option"
              onPointerEnter={() => setActive("summary")}
              onFocus={() => setActive("summary")}
              onPointerLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              onClick={() => navigate("summary")}
              disabled={launching}
            >
              <span className="home-option-icon home-option-icon-summary" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6.75 3.75h7.5l4 4v12.5H6.75z" />
                  <path d="M14.25 3.75v4h4M9.5 12h6M9.5 15.5h6M9.5 9h1.5" />
                </svg>
              </span>
              <span className="home-option-text">
                <strong>{t("summaryOptionTitle")}</strong>
                <span>{t("summaryOptionDescription")}</span>
              </span>
              <span className="home-option-arrow" aria-hidden="true">↗</span>
            </button>
          </div>

          <p className="home-caption">{t("homeCaption")}</p>
        </section>

        <footer className="app-footer">{t("homeFooter")}</footer>
      </div>
      <div className="home-transition" aria-hidden="true" />
    </main>
  );
}
