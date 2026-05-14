"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import Image from "next/image";

export function VerifyEmailSuccess() {
    const { setView } = useApp();

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{
                background: "linear-gradient(-45deg, #C3B4FF, #D4CCFF, #E8EAF6, #EDE9FF, #B8AEEE)",
                backgroundSize: "400% 400%",
                animation: "gradient-shift 18s ease infinite",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center space-y-6"
            >
                <div className="flex justify-center">
                    <Image src="/assets/logo.png" alt="MoodLoop" width={140} height={36} className="object-contain" />
                </div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex justify-center"
                >
                    <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-14 h-14 text-green-500" strokeWidth={1.5} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-3"
                >
                    <h1 className="text-2xl font-bold text-[#2C2A4A] dark:text-white">
                        Email Verified Successfully!
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Your email has been verified and your account is now active.
                        You can now sign in to MoodLoop.
                    </p>
                </motion.div>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2 text-left"
                >
                    {[
                        "Account successfully created ✅",
                        "Email verification complete ✅",
                        "Ready to use MoodLoop 🎉",
                    ].map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.15 }}
                            className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"
                        >
                            <div className="w-5 h-5 rounded-full bg-[#614EA9]/10 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-[#614EA9]" />
                            </div>
                            {step}
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <Button
                        onClick={() => setView("login")}
                        className="w-full h-12 text-base font-semibold gap-2 cursor-pointer bg-[#614EA9] hover:bg-[#4e3d87]"
                    >
                        Go to Sign In
                        <ArrowRight className="w-5 h-5" strokeWidth={2} />
                    </Button>
                </motion.div>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                    🔒 Your data is encrypted and secure
                </p>
            </motion.div>
        </div>
    );
}