"use client";

import { useState } from "react";
import type { Question, Quiz } from "../../src/core/types";
import { computeScore, type Answers } from "../../src/core/score";
import { useLanguage } from "./LanguageProvider";

const MAX_BYTES = 4 * 1024 * 1024; // même limite que l'API
const TIMEOUT_MS = 125000;

type Phase = "upload" | "loading" | "quiz" | "result";

function choiceStyle(index: number, q: Question, picked: number | null) {
  if (picked === null) return "quiz-choice";
  if (index === q.correctIndex) return "quiz-choice quiz-choice-correct";
  if (index === picked) return "quiz-choice quiz-choice-wrong";
  return "quiz-choice quiz-choice-muted";
}

export default function QuizApp() {
  const { language, t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>([]);

  async function generate(previousQuestions: string[] = []) {
    setError(null);
    if (!file) {
      setError(t("choosePdf"));
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

    setPhase("loading");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("count", String(count));
      form.append("language", language);
      if (previousQuestions.length > 0) {
        form.append("previousQuestions", JSON.stringify(previousQuestions));
      }

      const res = await fetch("/api/quiz", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.quiz) {
        setError(data?.error?.message ?? t("generationError"));
        setPhase(quiz ? "result" : "upload");
        return;
      }

      const received: Quiz = data.quiz;
      setQuiz(received);
      setAnswers(new Array(received.questions.length).fill(null));
      setCurrent(0);
      setPhase("quiz");
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === "AbortError";
      setError(
        timedOut
          ? t("timeoutError")
          : t("connectionError")
      );
      setPhase(quiz ? "result" : "upload");
    } finally {
      clearTimeout(timer);
    }
  }

  function choose(index: number) {
    if (answers[current] !== null) return; // une seule réponse par question
    setAnswers((prev) => prev.map((a, i) => (i === current ? index : a)));
  }

  function next() {
    if (!quiz) return;
    if (current + 1 < quiz.questions.length) setCurrent(current + 1);
    else setPhase("result");
  }

  function retry() {
    if (!quiz) return;
    setAnswers(new Array(quiz.questions.length).fill(null));
    setCurrent(0);
    setPhase("quiz");
  }

  function retryWithNewQuestions() {
    if (!quiz) return;
    void generate(quiz.questions.map((question) => question.question));
  }

  function reset() {
    setQuiz(null);
    setFile(null);
    setAnswers([]);
    setCurrent(0);
    setError(null);
    setPhase("upload");
  }

  const card = "quiz-card";
  const primary = "quiz-primary";
  const secondary = "quiz-secondary";

  // ---------- Écran 1 : dépôt du PDF ----------
  if (phase === "upload") {
    return (
      <div className={card}>
        <label className="quiz-form-label" htmlFor="pdf">
          01 <span className="quiz-muted">/</span> {t("uploadTitle")}
        </label>
        <input
          id="pdf"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="quiz-file-input"
        />
        {file && (
          <p className="quiz-hint">{t("selectedFile", { name: file.name, size: (file.size / 1024).toFixed(0) })}</p>
        )}

        <label className="quiz-form-label" htmlFor="count" style={{ marginTop: 24 }}>
          02 <span className="quiz-muted">/</span> {t("questionCount")}
        </label>
        <select
          id="count"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="quiz-select"
        >
          {[3, 5, 8, 10].map((n) => (
            <option key={n} value={n}>
              {t("questions", { count: n })}
            </option>
          ))}
        </select>

        {error && (
          <p role="alert" className="quiz-alert">
            {error}
          </p>
        )}

        <button
          onClick={() => void generate()}
          disabled={!file}
          className={primary + " quiz-full-width"}
          style={{ marginTop: 22 }}
        >
          {t("generateQuiz")}
        </button>
        <p className="quiz-hint">
          {t("pdfHint")}
        </p>
      </div>
    );
  }

  // ---------- Écran 2 : chargement ----------
  if (phase === "loading") {
    return (
      <div className={card + " quiz-loading"} role="status">
        <div className="loading-orbit" aria-hidden="true">✦</div>
        <p className="text-lg font-semibold">{t("quizLoading")}</p>
        <p className="quiz-hint">
          {t("quizLoadingHint")}
        </p>
      </div>
    );
  }

  if (!quiz) return null;

  // ---------- Écran 4 : résultat ----------
  if (phase === "result") {
    const { correct, total, percent } = computeScore(quiz, answers);
    const mistakes = quiz.questions
      .map((q, i) => ({ q, i, picked: answers[i] }))
      .filter(({ q, picked }) => picked !== q.correctIndex);

    return (
      <div className="quiz-result-stack">
        <div className={card + " quiz-score-card"}>
          <p className="quiz-score-label">{t("yourScore")}</p>
          <p className="quiz-score-value">
            {correct} / {total}
          </p>
          <p className="quiz-score-percent">{percent} %</p>
          {error && (
            <p role="alert" className="quiz-alert">
              {error}
            </p>
          )}
          <div className="quiz-actions">
            <button onClick={retryWithNewQuestions} className={primary}>
              {t("retryNewQuestions")}
            </button>
            <button onClick={retry} className={primary}>
              {t("retryQuiz")}
            </button>
            <button onClick={reset} className={secondary}>
              {t("newPdf")}
            </button>
          </div>
        </div>

        {mistakes.length > 0 && (
          <div className={card}>
            <h2 className="quiz-review-title">{t("review", { count: mistakes.length })}</h2>
            <ul className="quiz-review-list">
              {mistakes.map(({ q, i, picked }) => (
                <li key={q.id} className="quiz-review-item">
                  <p className="quiz-review-question">
                    {i + 1}. {q.question}
                  </p>
                  {picked !== null && (
                    <p className="quiz-answer-wrong">{t("yourAnswer", { answer: q.choices[picked] })}</p>
                  )}
                  <p className="quiz-answer-correct">{t("rightAnswer", { answer: q.choices[q.correctIndex] })}</p>
                  <p className="quiz-explanation">{q.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ---------- Écran 3 : une question à la fois ----------
  const q = quiz.questions[current];
  const picked = answers[current];
  const isLast = current + 1 === quiz.questions.length;

  return (
    <div className={card}>
      <p className="quiz-progress-label">
        {t("questionProgress", { current: current + 1, total: quiz.questions.length })}
      </p>
      <div className="quiz-progress-track">
        <div
          className="quiz-progress-value"
          style={{ width: `${((current + (picked !== null ? 1 : 0)) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <h2 className="quiz-question-title">{q.question}</h2>

      <div className="quiz-choice-list">
        {q.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            disabled={picked !== null}
            className={choiceStyle(i, q, picked)}
          >
            <span className="mr-2 font-semibold">{"ABCD"[i]}.</span>
            {choice}
          </button>
        ))}
      </div>

      {picked !== null && (
        <div className="quiz-feedback">
          <p className="quiz-feedback-title">
            {picked === q.correctIndex ? `✅ ${t("correctAnswer")}` : `❌ ${t("wrongAnswer")}`}
          </p>
          <p className="quiz-feedback-copy">{q.explanation}</p>
          <button onClick={next} className={primary} style={{ marginTop: 15 }}>
            {isLast ? t("viewScore") : t("nextQuestion")}
          </button>
        </div>
      )}
    </div>
  );
}
