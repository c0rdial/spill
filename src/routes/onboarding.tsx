import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { rootRoute } from "./__root";
import { supabase } from "../lib/supabase";
import { PhotoUpload } from "../components/PhotoUpload";
import { GenderSelect } from "../components/GenderSelect";
import { ShowMeSelect } from "../components/ShowMeSelect";
import { InterestPicker } from "../components/InterestPicker";
import { useInterestTags } from "../hooks/useInterestTags";

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const steps = ["basic", "preferences", "profile", "interests"] as const;
type Step = (typeof steps)[number];

const expoOut = [0.16, 1, 0.3, 1] as const;

function OnboardingPage() {
  const [step, setStep] = useState<Step>("basic");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [showMe, setShowMe] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tags } = useInterestTags();

  const stepIndex = steps.indexOf(step);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 99) {
      setError("Please enter a valid age (18–99).");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name,
      age: parsedAge,
      gender,
      show_me: showMe,
      interests,
      bio: bio || null,
      photo_url: photoUrl,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      await queryClient.refetchQueries({ queryKey: ["user", user.id] });
      navigate({ to: "/spill" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-spill-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[430px] space-y-6">
        {/* Progress bars */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= stepIndex
                  ? "bg-spill-red w-8"
                  : "bg-spill-border w-4"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: expoOut }}
            className="space-y-6"
          >
            {step === "basic" && (
              <>
                <div>
                  <h1 className="font-display text-3xl text-spill-text">
                    Let's start
                  </h1>
                  <p className="text-spill-muted mt-1">The basics.</p>
                </div>
                <div>
                  <label className="block text-spill-text text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text focus:outline-none focus:border-spill-red"
                  />
                </div>
                <div>
                  <label className="block text-spill-text text-sm font-medium mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={18}
                    max={99}
                    className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text focus:outline-none focus:border-spill-red"
                  />
                </div>
                <motion.button
                  onClick={() => setStep("preferences")}
                  disabled={!name || !age}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
                >
                  Next
                </motion.button>
              </>
            )}

            {step === "preferences" && (
              <>
                <div>
                  <h1 className="font-display text-3xl text-spill-text">
                    Preferences
                  </h1>
                  <p className="text-spill-muted mt-1">
                    Who are you, who do you want to meet?
                  </p>
                </div>
                <div>
                  <label className="block text-spill-text text-sm font-medium mb-2">
                    I am a
                  </label>
                  <GenderSelect value={gender} onChange={setGender} />
                </div>
                <div>
                  <label className="block text-spill-text text-sm font-medium mb-2">
                    Show me
                  </label>
                  <ShowMeSelect value={showMe} onChange={setShowMe} />
                </div>
                <motion.button
                  onClick={() => setStep("profile")}
                  disabled={!gender || showMe.length === 0}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
                >
                  Next
                </motion.button>
              </>
            )}

            {step === "profile" && (
              <>
                <div>
                  <h1 className="font-display text-3xl text-spill-text">
                    Your profile
                  </h1>
                  <p className="text-spill-muted mt-1">
                    This stays hidden until you match.
                  </p>
                </div>
                <div className="flex justify-center">
                  <PhotoUpload onUploaded={setPhotoUrl} currentUrl={photoUrl} />
                </div>
                <div>
                  <label className="block text-spill-text text-sm font-medium mb-2">
                    Bio{" "}
                    <span className="text-spill-muted">
                      ({140 - bio.length} left)
                    </span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={140}
                    rows={3}
                    className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text resize-none focus:outline-none focus:border-spill-red"
                  />
                </div>
                <motion.button
                  onClick={() => setStep("interests")}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg transition-opacity"
                >
                  Next
                </motion.button>
              </>
            )}

            {step === "interests" && (
              <>
                <div>
                  <h1 className="font-display text-3xl text-spill-text">
                    Interests
                  </h1>
                  <p className="text-spill-muted mt-1">Pick at least 3.</p>
                </div>
                {tags && (
                  <InterestPicker
                    tags={tags}
                    selected={interests}
                    onChange={setInterests}
                  />
                )}
                <motion.button
                  onClick={handleSubmit}
                  disabled={loading || interests.length < 3}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
                >
                  {loading ? "Saving..." : "Start spilling"}
                </motion.button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
