import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useUser(session?.user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || userLoading) return;
    if (!session) {
      navigate({ to: "/login" });
    } else if (!user) {
      navigate({ to: "/onboarding" });
    }
  }, [session, user, authLoading, userLoading, navigate]);

  if (authLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-spill-muted text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !user) return null;

  return <>{children}</>;
}
