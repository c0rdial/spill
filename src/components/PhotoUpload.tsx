import { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
};

export function PhotoUpload({ onUploaded, currentUrl }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.type.split("/")[1] ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  }

  return (
    <label className="block cursor-pointer">
      <div className="w-24 h-24 rounded-full bg-spill-card border-2 border-dashed border-spill-border flex items-center justify-center overflow-hidden">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-spill-muted text-xs">
            {uploading ? "..." : "+ Photo"}
          </span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
      />
    </label>
  );
}
