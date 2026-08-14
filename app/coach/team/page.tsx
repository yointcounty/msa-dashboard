"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

type CoachRequest = {
  user_id: string;
  email: string;
  coach_name: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
  reviewed_at: string | null;
};

export default function CoachTeamPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [items, setItems] = useState<CoachRequest[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setAuthorized(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email,role")
      .eq("id", auth.user.id)
      .maybeSingle();

    const headCoach =
      profile?.role === "coach" &&
      profile.email?.toLowerCase() === "jt@yointcounty.com";
    setAuthorized(headCoach);
    if (!headCoach) return;

    const { data, error } = await supabase
      .from("coach_requests")
      .select("user_id,email,coach_name,status,created_at,reviewed_at")
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setItems((data || []) as CoachRequest[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(userId: string, decision: "approved" | "declined") {
    setBusyId(userId);
    setMessage("");
    const { error } = await supabase.rpc("review_coach_request", {
      target_user_id: userId,
      decision,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(decision === "approved" ? "Coach approved." : "Coach declined.");
      await load();
    }
    setBusyId("");
  }

  if (authorized === null) {
    return <main style={{ padding: 24 }}>Loading coach profiles…</main>;
  }

  if (!authorized) {
    return (
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1>Head coach access only</h1>
        <p>This page is available only from the JT head coach account.</p>
        <Link href="/coach">Back to coach portal</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4ef",
        padding: "24px 18px 80px",
        color: "#151515",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <Link
          href="/coach"
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            color: "inherit",
            textDecoration: "none",
            marginBottom: 22,
          }}
        >
          <ArrowLeft size={17} /> Back to coach portal
        </Link>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ShieldCheck size={24} />
            <strong style={{ fontSize: 13, letterSpacing: ".08em" }}>JT HEAD COACH</strong>
          </div>
          <h1 style={{ fontSize: "clamp(32px,6vw,58px)", margin: "8px 0" }}>
            COACH PROFILES
          </h1>
          <p style={{ maxWidth: 680, lineHeight: 1.55, margin: 0 }}>
            Coaches who activate through the MSA coach portal appear here. New profiles stay pending until the JT head coach approves them.
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#fff",
              marginBottom: 16,
              border: "1px solid #ddd",
            }}
          >
            {message}
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {items.length === 0 && (
            <div style={{ background: "#fff", padding: 20, borderRadius: 16 }}>
              No coach profiles yet.
            </div>
          )}

          {items.map((item) => (
            <article
              key={item.user_id}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 18,
                border: "1px solid #e1e2dc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "#eceee8",
                    }}
                  >
                    <UserRound size={21} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: 17 }}>
                      {item.coach_name || "MSA Coach"}
                    </strong>
                    <span style={{ display: "block", marginTop: 3 }}>{item.email}</span>
                    <span style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8, fontSize: 13 }}>
                      {item.status === "approved" ? (
                        <CheckCircle2 size={15} />
                      ) : item.status === "declined" ? (
                        <XCircle size={15} />
                      ) : (
                        <Clock3 size={15} />
                      )}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                </div>

                {item.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      disabled={busyId === item.user_id}
                      onClick={() => void review(item.user_id, "approved")}
                      style={{
                        border: 0,
                        borderRadius: 999,
                        padding: "9px 13px",
                        background: "#111",
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.user_id}
                      onClick={() => void review(item.user_id, "declined")}
                      style={{
                        border: "1px solid #bbb",
                        borderRadius: 999,
                        padding: "9px 13px",
                        background: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
