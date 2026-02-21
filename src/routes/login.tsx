import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";
import { DecoShapes } from "../components/DecoShapes";
import type { Shape } from "../components/DecoShapes";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const expoOut = [0.16, 1, 0.3, 1] as const;

const LOGIN_SHAPES: Shape[] = [
  { type: "heart", color: "#FF3B6F", x: 78, y: 6, size: 32, rotate: 15, delay: 0.1 },
  { type: "star", color: "#D7FF81", x: 10, y: 10, size: 24, rotate: -20, delay: 0.2 },
  { type: "triangle", color: "#FAFAFA", x: 85, y: 28, size: 18, rotate: 30, delay: 0.15 },
  { type: "circle", color: "#BC96FF", x: 5, y: 32, size: 22, rotate: 0, delay: 0.25 },
  { type: "blob", color: "#BC96FF", x: 90, y: 55, size: 26, rotate: -10, delay: 0.3 },
  { type: "heart", color: "#D7FF81", x: 2, y: 65, size: 20, rotate: -25, delay: 0.35 },
  { type: "star", color: "#FF3B6F", x: 88, y: 80, size: 18, rotate: 45, delay: 0.18 },
  { type: "triangle", color: "#D7FF81", x: 8, y: 85, size: 16, rotate: -15, delay: 0.28 },
];

function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    if (error) {
      setError(error.message);
    } else {
      navigate({ to: "/spill" });
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <DecoShapes shapes={LOGIN_SHAPES} />
      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: expoOut }}
      >
        <h1 className="font-display italic text-6xl tracking-tight mb-2">
          spill
        </h1>
        <p className="font-display italic text-lg text-spill-text mb-10">
          Say something real.
        </p>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: expoOut }}
            >
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && email && sendOtp()}
                placeholder="you@example.com"
                className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 placeholder-spill-muted focus:outline-none focus:border-spill-red"
              />
              <motion.button
                onClick={sendOtp}
                disabled={loading || !email}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
              >
                {loading ? "Sending..." : "Send code"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: expoOut }}
            >
              <label className="block text-sm font-medium mb-2">
                Enter the code sent to {email}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && otp.length >= 6 && verifyOtp()
                }
                placeholder="00000000"
                maxLength={8}
                className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 placeholder-spill-muted text-center text-2xl tracking-widest focus:outline-none focus:border-spill-red"
              />
              <motion.button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
              >
                {loading ? "Verifying..." : "Verify"}
              </motion.button>
              <button
                onClick={() => setStep("email")}
                className="w-full mt-2 text-spill-muted text-sm py-2"
              >
                Use a different email
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-spill-border" />
          <span className="text-spill-muted text-sm">or</span>
          <div className="flex-1 h-px bg-spill-border" />
        </div>

        <motion.button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: window.location.origin + "/spill",
              },
            })
          }
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-3 border border-spill-border rounded-lg py-3 text-spill-text font-medium transition-colors hover:bg-spill-card"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </motion.button>

        {import.meta.env.DEV && (
          <button
            onClick={async () => {
              setLoading(true);
              setError("");
              const { error } = await supabase.auth.signInWithPassword({
                email: "dev@spill.test",
                password: "devdev123",
              });
              if (error) {
                setError(error.message);
              } else {
                navigate({ to: "/spill" });
              }
              setLoading(false);
            }}
            disabled={loading}
            className="w-full mt-8 border border-spill-border text-spill-muted text-sm py-2 rounded-lg disabled:opacity-50"
          >
            Dev login
          </button>
        )}
      </motion.div>
    </div>
  );
}
