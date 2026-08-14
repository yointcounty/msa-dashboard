"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const [isHeadCoach, setIsHeadCoach] = useState(false);

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || !active) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("email,role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!active) return;
      setIsHeadCoach(
        profile?.role === "coach" &&
          profile.email?.toLowerCase() === "jt@yointcounty.com",
      );
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {children}
      {isHeadCoach && (
        <Link
          href="/coach/team"
          aria-label="Open coach profiles"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 1000,
            borderRadius: 999,
            background: "#111",
            color: "#fff",
            padding: "11px 16px",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 28px rgba(0,0,0,.18)",
          }}
        >
          Coach Profiles
        </Link>
      )}
    </>
  );
}
