"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type CoachRequest = {
  user_id: string;
  email: string;
  coach_name: string | null;
  status: "pending" | "approved" | "declined";
  created_at: string;
  reviewed_at: string | null;
};

type CoachActivity = {
  id: string;
  actor_user_id: string;
  action_type: string;
  entity_type: string;
  skater_id: string | null;
  details: Record<string, string | null>;
  created_at: string;
};

type CoachProfile = {
  id: string;
  email: string;
  parent_name: string | null;
};

type SkaterRef = {
  id: string;
  name: string;
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CoachTeamPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [items, setItems] = useState<CoachRequest[]>([]);
  const [activity, setActivity] = useState<CoachActivity[]>([]);
  const [coachProfiles, setCoachProfiles] = useState<CoachProfile[]>([]);
  const [skaterRefs, setSkaterRefs] = useState<SkaterRef[]>([]);
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

    const [requestsResult, activityResult, coachesResult, skatersResult] =
      await Promise.all([
        supabase
          .from("coach_requests")
          .select("user_id,email,coach_name,status,created_at,reviewed_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("coach_activity")
          .select(
            "id,actor_user_id,action_type,entity_type,skater_id,details,created_at",
          )
          .order("created_at", { ascending: false })
          .limit(250),
        supabase
          .from("profiles")
          .select("id,email,parent_name")
          .eq("role", "coach")
          .order("created_at"),
        supabase.from("skaters").select("id,name").order("name"),
      ]);

    const firstError =
      requestsResult.error ||
      activityResult.error ||
      coachesResult.error ||
      skatersResult.error;

    if (firstError) {
      setMessage(firstError.message);
      return;
    }

    setItems((requestsResult.data || []) as CoachRequest[]);
    setActivity((activityResult.data || []) as CoachActivity[]);
    setCoachProfiles((coachesResult.data || []) as CoachProfile[]);
    setSkaterRefs((skatersResult.data || []) as SkaterRef[]);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const coachById = useMemo(
    () => new Map(coachProfiles.map((coach) => [coach.id, coach])),
    [coachProfiles],
  );
  const skaterById = useMemo(
    () => new Map(skaterRefs.map((skater) => [skater.id, skater])),
    [skaterRefs],
  );

  async function review(userId: string, decision: "approved" | "declined") {
    setBusyId(userId);
    setMessage("");
    const { error } = await supabase.rpc("review_coach_request", {
      target_user_id: userId,
      decision,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(
        decision === "approved" ? "Coach approved." : "Coach declined.",
      );
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
            <strong style={{ fontSize: 13, letterSpacing: ".08em" }}>
              JT HEAD COACH
            </strong>
          </div>
          <h1
            style={{ fontSize: "clamp(32px,6vw,58px)", margin: "8px 0" }}
          >
            COACH PROFILES
          </h1>
          <p style={{ maxWidth: 680, lineHeight: 1.55, margin: 0 }}>
            Coaches who activate through the MSA coach portal appear here. New
            profiles stay pending until the JT head coach approves them. Coach
            work is now recorded automatically with the coach, action, skater,
            and time.
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

          {items.map((item) => {
            const recent = activity
              .filter((entry) => entry.actor_user_id === item.user_id)
              .slice(0, 3);
            return (
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
                  <div
                    style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                  >
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
                      <span style={{ display: "block", marginTop: 3 }}>
                        {item.email}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          marginTop: 8,
                          fontSize: 13,
                        }}
                      >
                        {item.status === "approved" ? (
                          <CheckCircle2 size={15} />
                        ) : item.status === "declined" ? (
                          <XCircle size={15} />
                        ) : (
                          <Clock3 size={15} />
                        )}
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
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

                {item.status === "approved" && (
                  <div
                    style={{
                      borderTop: "1px solid #ecece8",
                      marginTop: 16,
                      paddingTop: 14,
                    }}
                  >
                    <strong
                      style={{
                        display: "flex",
                        gap: 7,
                        alignItems: "center",
                        fontSize: 13,
                      }}
                    >
                      <Activity size={15} /> RECENT WORK
                    </strong>
                    {recent.length === 0 ? (
                      <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                        No recorded portal work yet.
                      </p>
                    ) : (
                      <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
                        {recent.map((entry) => (
                          <div key={entry.id} style={{ fontSize: 13 }}>
                            <b>{entry.action_type}</b>
                            {entry.skater_id && skaterById.get(entry.skater_id)
                              ? ` · ${skaterById.get(entry.skater_id)?.name}`
                              : ""}
                            <span style={{ opacity: 0.65 }}>
                              {` · ${formatWhen(entry.created_at)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <section style={{ marginTop: 34 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 12,
            }}
          >
            <Activity size={22} />
            <h2 style={{ margin: 0, fontSize: 24 }}>Coach Activity Log</h2>
          </div>
          <p style={{ margin: "0 0 14px", lineHeight: 1.5, maxWidth: 700 }}>
            Read-only history of coach work inside the portal. New actions are
            recorded automatically and do not replace or alter client data.
          </p>

          <div style={{ display: "grid", gap: 8 }}>
            {activity.length === 0 && (
              <div style={{ background: "#fff", padding: 18, borderRadius: 14 }}>
                No coach activity has been recorded yet. New work will appear
                here automatically.
              </div>
            )}
            {activity.map((entry) => {
              const coach = coachById.get(entry.actor_user_id);
              const skater = entry.skater_id
                ? skaterById.get(entry.skater_id)
                : null;
              return (
                <div
                  key={entry.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e1e2dc",
                    borderRadius: 14,
                    padding: "13px 15px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong style={{ display: "block" }}>
                      {coach?.parent_name || coach?.email || "MSA Coach"}
                    </strong>
                    <span style={{ display: "block", marginTop: 3 }}>
                      {entry.action_type}
                      {skater ? ` · ${skater.name}` : ""}
                    </span>
                    {entry.details?.title && (
                      <small style={{ display: "block", marginTop: 4 }}>
                        {entry.details.title}
                        {entry.details.location
                          ? ` · ${entry.details.location}`
                          : ""}
                      </small>
                    )}
                  </div>
                  <time style={{ fontSize: 13, opacity: 0.7 }}>
                    {formatWhen(entry.created_at)}
                  </time>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
