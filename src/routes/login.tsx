import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const expoOut = [0.16, 1, 0.3, 1] as const;

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full"
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
              <button
                onClick={sendOtp}
                disabled={loading || !email}
                className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
              >
                {loading ? "Sending..." : "Send code"}
              </button>
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
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
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
