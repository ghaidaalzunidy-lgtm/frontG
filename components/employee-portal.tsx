"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock, CheckCircle2, Bot, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { ProcessingIndicator } from "@/components/loading-screen";
import { useApp, translations, emotions } from "@/lib/app-context";
import { submitReflection } from "@/lib/api";

type PortalState = "form" | "processing" | "success";

const MIN_LEN = 100;
const MAX_LEN = 1000;

// Backend EmotionEnum → frontend emotions[] id
const backendToFrontendEmotionId: Record<string, string> = {
  happiness: "happiness",
  motivation: "motivation",
  cooperation: "cooperation",
  neutral: "calmness",
  stress: "stress",
  anger: "frustration",
  sadness: "sadness",
};

export function EmployeePortal() {
  const { user, language } = useApp();
  const t = translations[language];

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [portalState, setPortalState] = useState<PortalState>("form");
  const [predictedEmotionId, setPredictedEmotionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [wellnessTip, setWellnessTip] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const charCountClass =
    message.length === 0
      ? "text-muted-foreground"
      : message.length < MIN_LEN || message.length > MAX_LEN
      ? "text-red-500"
      : "text-muted-foreground";
  const lengthValid = message.length >= MIN_LEN && message.length <= MAX_LEN;
  const canSubmit = !!selectedEmotion && lengthValid && portalState === "form";

  const userEmotion = emotions.find((e) => e.id === selectedEmotion);
  const aiEmotion = predictedEmotionId
    ? emotions.find((e) => e.id === predictedEmotionId)
    : null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    setPortalState("processing");
    try {
      const result = await submitReflection(message, selectedEmotion);
      const backendEmotion = (result.predicted_emotion ?? "").toLowerCase();
      setPredictedEmotionId(backendToFrontendEmotionId[backendEmotion] ?? null);
      setConfidence(result.confidence ?? null);
       setWellnessTip(result.wellness_tip ?? null);
      setPortalState("success");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submit failed");
      setPortalState("form");
    }
  };

  const handleReset = () => {
    setSelectedEmotion(null);
    setMessage("");
    setPortalState("form");
    setPredictedEmotionId(null);
    setConfidence(null);
    setWellnessTip(null);
    setSubmitError(null);
  };

  return (
    <div className="min-h-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {portalState === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {t.howFeeling}
                    </h1>
                    <p className="text-muted-foreground">{t.selectEmotion}</p>
                  </div>

                  {!selectedEmotion && (
                    <p className="text-sm text-muted-foreground">
                      {t.selectEmotionFirst}
                    </p>
                  )}

                  {/* Emotion Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {emotions.map((emotion) => (
                      <motion.button
                        key={emotion.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedEmotion(emotion.id)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                          selectedEmotion === emotion.id
                            ? "border-primary bg-primary/5 shadow-lg"
                            : "border-border hover:border-primary/30 bg-card"
                        }`}
                        style={{
                          boxShadow:
                            selectedEmotion === emotion.id
                              ? `0 0 20px ${emotion.color}30`
                              : undefined,
                        }}
                      >
                        <span className="text-4xl">{emotion.emoji}</span>
                        <span className="text-sm font-medium text-foreground text-center">
                          {language === "en" ? emotion.label : emotion.labelAr}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Message Box */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t.shareThoughts}
                    </label>
                    <Textarea
                      placeholder={t.writePlaceholder}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[120px] resize-none"
                      dir="auto"
                      maxLength={MAX_LEN + 50}
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className={charCountClass}>
                        {language === "en"
                          ? `${message.length} / ${MAX_LEN} characters (min ${MIN_LEN}, Arabic required)`
                          : `${message.length} / ${MAX_LEN} حرف (الحد الأدنى ${MIN_LEN}، يجب أن يكون باللغة العربية)`}
                      </span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  )}

                  {/* Anonymous Notice */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                    <div className="flex items-start gap-3">
                      <Lock
                        className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                        strokeWidth={1.5}
                      />
                      <p className="text-sm text-muted-foreground">
                        {t.anonymousNote}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full h-12 text-base font-semibold gap-2 cursor-pointer"
                  >
                    <Send className="h-5 w-5" strokeWidth={1.5} />
                    {t.submitFeedback}
                  </Button>
                </CardContent>
              </Card>

              {/* User Info Card */}
              <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    {t.yourInfo}
                  </h3>
                  <p className="text-sm text-foreground">
                    {t.department}: {user?.department}
                  </p>
                  <p className="text-sm text-primary mt-2">{t.deptInfo}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {portalState === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto pt-20"
            >
              <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
                <CardContent className="p-8 flex flex-col items-center space-y-6">
                  <ProcessingIndicator
                    text={
                      language === "en"
                        ? "AI analyzing your reflection..."
                        : "الذكاء الاصطناعي يحلل انعكاسك..."
                    }
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {language === "en"
                      ? "AraBERT is detecting the emotion in your text"
                      : "نموذج AraBERT يحلل المشاعر في نصك"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {portalState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <CheckCircle2
                        className="h-8 w-8 text-primary"
                        strokeWidth={1.5}
                      />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-primary">
                      {t.thankYou}
                    </h2>
                    <p className="text-muted-foreground text-center">
                      {t.feedbackSubmitted}
                    </p>
                  </div>

                  {/* You said vs AI detected */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {language === "en" ? "You said" : "ما اخترته"}
                      </h3>
                      {userEmotion ? (
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{userEmotion.emoji}</span>
                          <span className="text-sm font-medium text-foreground">
                            {language === "en" ? userEmotion.label : userEmotion.labelAr}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {language === "en" ? "AI detected" : "اكتشف الذكاء الاصطناعي"}
                        </h3>
                      </div>
                      {aiEmotion ? (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{aiEmotion.emoji}</span>
                            <span className="text-sm font-medium text-foreground">
                              {language === "en" ? aiEmotion.label : aiEmotion.labelAr}
                            </span>
                          </div>
                          {confidence != null && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {language === "en" ? "Confidence" : "الثقة"}: {Math.round(confidence * 100)}%
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>

                  {wellnessTip && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          {language === "en" ? "Wellness Tip" : "نصيحة للعافية"}
                        </h3>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed" dir="rtl">
                        {wellnessTip}
                      </p>
                    </div>
                  )} 

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full cursor-pointer"
                  >
                    {language === "en" ? "Submit another reflection" : "إرسال انعكاس آخر"}
                  </Button>
                </CardContent>
              </Card>

              {/* User Info Card */}
              <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    {t.yourInfo}
                  </h3>
                  <p className="text-sm text-foreground">
                    {t.department}: {user?.department}
                  </p>
                  <p className="text-sm text-primary mt-2">{t.deptInfo}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

