import { createRoute } from "@tanstack/react-router";
import { useState } from "react";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
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
      phone,
      token: otp,
      type: "sms",
    });
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[430px]">
        <h1 className="text-5xl font-bold mb-2">spill</h1>
        <p className="text-spill-muted mb-10">Say something real.</p>

        {step === "phone" ? (
          <>
            <label className="block text-sm font-medium mb-2">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+60 12 345 6789"
              className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 placeholder-spill-muted focus:outline-none focus:border-spill-red"
            />
            <button
              onClick={sendOtp}
              disabled={loading || !phone}
              className="w-full mt-4 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium mb-2">
              Enter the code sent to {phone}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
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
              onClick={() => setStep("phone")}
              className="w-full mt-2 text-spill-muted text-sm py-2"
            >
              Use a different number
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
