import { createRoute } from "@tanstack/react-router";
import { useState } from "react";
import { protectedLayout } from "./_protected";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useInterestTags } from "../hooks/useInterestTags";
import { useQueryClient } from "@tanstack/react-query";
import { PhotoUpload } from "../components/PhotoUpload";
import { GenderSelect } from "../components/GenderSelect";
import { ShowMeSelect } from "../components/ShowMeSelect";
import { InterestPicker } from "../components/InterestPicker";
import type { User, InterestTag } from "../lib/types";

export const profileRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/profile",
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: tags } = useInterestTags();

  if (!user) return null;

  return <ProfileForm key={user.id} user={user} tags={tags ?? []} />;
}

function ProfileForm({ user, tags }: { user: User; tags: InterestTag[] }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.photo_url);
  const [gender, setGender] = useState<string | null>(user.gender);
  const [showMe, setShowMe] = useState<string[]>(user.show_me);
  const [interests, setInterests] = useState<string[]>(user.interests);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({
        name,
        bio: bio || null,
        photo_url: photoUrl,
        gender,
        show_me: showMe,
        interests,
      })
      .eq("id", user.id);
    if (error) {
      alert(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-spill-text">Profile</h1>
      </div>
      <div className="px-6 space-y-6">
        <div className="flex justify-center">
          <PhotoUpload onUploaded={setPhotoUrl} currentUrl={photoUrl} />
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

        {tags.length > 0 && (
          <div>
            <label className="block text-spill-text text-sm font-medium mb-2">
              Interests
            </label>
            <InterestPicker
              tags={tags}
              selected={interests}
              onChange={setInterests}
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={
            saving ||
            !name ||
            !gender ||
            showMe.length === 0 ||
            interests.length < 3
          }
          className="w-full bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full border border-spill-border text-spill-muted font-semibold py-3 rounded-lg"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
