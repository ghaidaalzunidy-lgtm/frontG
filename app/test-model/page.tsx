"use client";

import { useState } from "react";
import { predictEmotion, type EmotionPrediction } from "@/lib/api";

export default function TestModelPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<EmotionPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!text.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await predictEmotion(text);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const sortedScores = result
    ? Object.entries(result.all_scores).sort(([, a], [, b]) => b - a)
    : [];
  const maxScore = sortedScores[0]?.[1] ?? 1;

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground">AraBERT Model — Debug</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Direct call to <code>POST /reflections/predict-only</code>. No DB write, no cooldown.
            Requires being logged in (uses <code>access_token</code> from localStorage).
          </p>
        </header>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Arabic text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب نصاً عربياً للاختبار..."
            dir="auto"
            className="w-full min-h-[140px] p-3 rounded-lg border border-border bg-card text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="text-xs text-muted-foreground">{text.length} characters</div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading || !text.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Predicting…" : "Predict emotion"}
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <section className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                Top prediction
              </div>
              <div className="text-xl font-bold text-foreground">{result.emotion}</div>
              <div className="text-sm text-muted-foreground">
                Confidence: {(result.intensity * 100).toFixed(1)}%
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                All 7 class probabilities
              </div>
              {sortedScores.map(([label, score]) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {(score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(score / maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Raw JSON</summary>
              <pre className="mt-2 p-3 rounded-lg bg-secondary/50 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
