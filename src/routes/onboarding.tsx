import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

type Step = "basic" | "preferences" | "profile" | "interests";

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
  const { data: tags } = useInterestTags();

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.phone) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      phone: user.phone,
      name,
      age: parseInt(age),
      gender,
      show_me: showMe,
      interests,
      bio: bio || null,
      photo_url: photoUrl,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate({ to: "/spill" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-spill-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[430px] space-y-6">
        {step === "basic" && (
          <>
            <div>
              <h1 className="text-3xl font-bold text-spill-text">
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
            <button
              onClick={() => setStep("preferences")}
              disabled={!name || !age}
              className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
            >
              Next
            </button>
          </>
        )}

        {step === "preferences" && (
          <>
            <div>
              <h1 className="text-3xl font-bold text-spill-text">
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
            <button
              onClick={() => setStep("profile")}
              disabled={!gender || showMe.length === 0}
              className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
            >
              Next
            </button>
          </>
        )}

        {step === "profile" && (
          <>
            <div>
              <h1 className="text-3xl font-bold text-spill-text">
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
            <button
              onClick={() => setStep("interests")}
              className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg transition-opacity"
            >
              Next
            </button>
          </>
        )}

        {step === "interests" && (
          <>
            <div>
              <h1 className="text-3xl font-bold text-spill-text">Interests</h1>
              <p className="text-spill-muted mt-1">Pick at least 3.</p>
            </div>
            {tags && (
              <InterestPicker
                tags={tags}
                selected={interests}
                onChange={setInterests}
              />
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || interests.length < 3}
              className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
            >
              {loading ? "Saving..." : "Start spilling"}
            </button>
          </>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
