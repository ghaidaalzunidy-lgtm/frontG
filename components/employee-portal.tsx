"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock, CheckCircle2, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { ProcessingIndicator } from "@/components/loading-screen";
import { useApp, translations, emotions } from "@/lib/app-context";

type PortalState = "form" | "processing" | "success";

export function EmployeePortal() {
  const { user, language } = useApp();
  const t = translations[language];

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [portalState, setPortalState] = useState<PortalState>("form");
  const [aiResponse, setAiResponse] = useState("");

  const handleSubmit = async () => {
    if (!selectedEmotion) return;

    setPortalState("processing");

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate AI response based on emotion
    const responses: Record<string, string> = {
      happiness:
        "We're thrilled to hear you're feeling positive! Your enthusiasm contributes to our workplace culture. Thank you for sharing the good vibes!",
      motivation:
        "Your motivation is inspiring! We appreciate your drive and energy. Keep up the great work!",
      cooperation:
        "It's wonderful to hear about positive teamwork! Strong collaboration makes our organization thrive.",
      calmness:
        "Thank you for sharing. We value your balanced perspective and appreciate your feedback.",
      stress:
        "We're sorry to hear you're experiencing stress. Your well-being matters to us. Our management team will review your feedback to identify ways to help reduce workplace pressure.",
      frustration:
        "We're sorry to hear you're experiencing frustration. Your feelings are valid, and we take this seriously. Our management team will review your feedback to address the underlying issues and find solutions.",
      sadness:
        "We're concerned about your well-being. Please know that support is available. Our HR team will review this feedback to understand how we can better support you.",
    };

    setAiResponse(responses[selectedEmotion] || responses.calmness);
    setPortalState("success");
  };

  const handleReset = () => {
    setSelectedEmotion(null);
    setMessage("");
    setPortalState("form");
    setAiResponse("");
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
                    />
                  </div>

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
                    disabled={!selectedEmotion}
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
                        ? "Rewriting for Anonymity..."
                        : "إعادة الكتابة للسرية..."
                    }
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    {language === "en"
                      ? "AI is processing your feedback to ensure complete anonymity"
                      : "الذكاء الاصطناعي يعالج ملاحظاتك لضمان السرية الكاملة"}
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

                  {/* AI Response */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="h-5 w-5 text-primary" strokeWidth={1.5} />
                      <h3 className="font-semibold text-foreground">
                        {t.aiResponse}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {aiResponse}
                    </p>
                  </div>
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

