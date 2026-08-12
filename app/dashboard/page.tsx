"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarPlus,
  Check,
  CheckCircle2,
  Download,
  LockKeyhole,
  MessageCircle,
  Share2,
  ShoppingBag,
  Smartphone,
  Trophy,
  X,
} from "lucide-react";
import { getAccount, ParentAccount, signOut } from "../lib/auth";
import { supabase } from "../lib/supabase";
import "./dashboard.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type ProgressItem = {
  trick_id: string;
  status: string;
  progress: number;
  coach_note: string;
  tricks: { name: string; sort_order: number } | null;
};
type Notice = {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};
type CoachNote = { id: string; body: string; created_at: string };
type NextSession = {
  skater_id: string;
  session_date: string | null;
  weekly_day: number | null;
  start_time: string;
  location: string;
  title: string;
};
type AddonSession = {
  id: string;
  session_date: string;
  start_time: string;
  location: string;
  title: string;
  status: string;
};
const labelStatus = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const weeklyDayLabel = (day: number | null) =>
  day === null || day === undefined
    ? "Weekly day"
    : weekDays[day] || "Weekly day";

export default function Dashboard() {
  const router = useRouter();
  const [account, setAccount] = useState<ParentAccount | null>(null);
  const [trickProgress, setTrickProgress] = useState<ProgressItem[]>([]);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [coachNote, setCoachNote] = useState<CoachNote | null>(null);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [addonSessions, setAddonSessions] = useState<AddonSession[]>([]);
  const [toast, setToast] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const isIos =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    let active = true;
    async function load() {
      const current = await getAccount();
      if (!current) {
        router.replace("/auth/login");
        return;
      }
      if (!active) return;
      setAccount(current);
      const [
        { data: progress },
        { data: notices },
        { data: latestNote },
        { data: upcomingSession },
        { data: reservedSessions },
      ] = await Promise.all([
        supabase
          .from("skater_tricks")
          .select(
            "trick_id, status, progress, coach_note, tricks(name, sort_order)",
          )
          .eq("skater_id", current.skaterId),
        supabase
          .from("notifications")
          .select("id, message, created_at, is_read")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("skater_notes")
          .select("id, body, created_at")
          .eq("skater_id", current.skaterId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("skater_next_sessions")
          .select("skater_id,session_date,weekly_day,start_time,location,title")
          .eq("skater_id", current.skaterId)
          .maybeSingle(),
        supabase
          .from("skater_addon_sessions")
          .select("id,session_date,start_time,location,title,status")
          .eq("skater_id", current.skaterId)
          .in("status", ["requested", "reserved"])
          .order("session_date")
          .order("start_time"),
      ]);
      if (!active) return;
      setTrickProgress(
        ((progress || []) as unknown as ProgressItem[]).sort(
          (a, b) => (a.tricks?.sort_order || 0) - (b.tricks?.sort_order || 0),
        ),
      );
      setNotifications((notices || []) as Notice[]);
      setCoachNote((latestNote || null) as CoachNote | null);
      setNextSession((upcomingSession || null) as NextSession | null);
      setAddonSessions((reservedSessions || []) as AddonSession[]);
    }
    void load();
    const channel = supabase
      .channel("family-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skater_tricks" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skater_notes" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skater_next_sessions" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "skater_addon_sessions" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        load,
      )
      .subscribe();
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      supabase.removeChannel(channel);
    };
  }, [router]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  async function installApp() {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted")
      notify("MSA Skater Portal was added to your device.");
    setInstallPrompt(null);
  }
  if (!account) return null;
  const childName = account.childName;

  function messageCoach() {
    const body = encodeURIComponent(
      `Hi JT, I have a question about ${childName}'s MSA progress.`,
    );
    window.location.href = `sms:+17863947314?body=${body}`;
  }

  function addReminder() {
    if (!nextSession) {
      notify("Your coach has not scheduled the next session yet.");
      return;
    }
    const pad = (value: number) => String(value).padStart(2, "0");
    const sessionDate =
      nextSession.weekly_day === null || nextSession.weekly_day === undefined
        ? nextSession.session_date
        : (() => {
            const date = new Date();
            const daysUntil = (nextSession.weekly_day - date.getDay() + 7) % 7;
            date.setDate(date.getDate() + daysUntil);
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
          })();
    if (!sessionDate) {
      notify("Your coach has not finished setting the primary session.");
      return;
    }
    const start = new Date(`${sessionDate}T${nextSession.start_time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const toIcsLocal = (date: Date) =>
      `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Miami Skate Academy//Skater Portal//EN",
      "BEGIN:VEVENT",
      `UID:msa-${nextSession.skater_id}-${sessionDate}-${nextSession.start_time}@miamiskateacademy.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsLocal(start)}`,
      `DTEND:${toIcsLocal(end)}`,
      `SUMMARY:${nextSession.title}`,
      `LOCATION:${nextSession.location}`,
      `DESCRIPTION:Miami Skate Academy session for ${childName}.`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `msa-${sessionDate}-primary-session.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Calendar reminder downloaded.");
  }

  function viewMilestones() {
    document
      .getElementById("milestones")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    notify("Showing your live milestones.");
  }

  const completedSkills = trickProgress.filter(
    (item) => item.status === "mastered" || item.progress >= 100,
  ).length;
  const overallProgress = trickProgress.length
    ? Math.round(
        trickProgress.reduce((sum, item) => sum + item.progress, 0) /
          trickProgress.length,
      )
    : 0;
  const currentFocus =
    trickProgress.find(
      (item) => item.status !== "mastered" && item.progress < 100,
    )?.tricks?.name || "Keep rolling and building consistency";
  const checklistCoachNote =
    coachNote?.body ||
    "Your coach will add one overall checklist note after the next session.";
  const sessionDay = nextSession
    ? weeklyDayLabel(nextSession.weekly_day).toUpperCase()
    : "TBD";
  const sessionTime = nextSession
    ? new Date("1970-01-01T" + nextSession.start_time).toLocaleTimeString(
        "en-US",
        { hour: "numeric", minute: "2-digit" },
      )
    : "Set by your coach";

  return (
    <main className="dashboard">
      <nav className="dash-nav">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">MSA</span>
          <span>
            <b>MIAMI SKATE</b>
            <small>SKATER PORTAL</small>
          </span>
        </Link>
        <div className="dash-user">
          <button className="install-nav-button" onClick={installApp}>
            <Download size={16} /> Install app
          </button>
          <span>{account.parentName}</span>
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <div className="dash-main">
        <header className="dash-greeting">
          <div>
            <p className="eyebrow">
              <span /> Family dashboard
            </p>
            <h1>HEY, {account.parentName.split(" ")[0]}!</h1>
            <p>
              Here&apos;s what&apos;s happening with {account.childName} at MSA.
            </p>
          </div>
          <a
            className="button button-small"
            href={
              "sms:+17863947314?body=" +
              encodeURIComponent(
                "Hi JT, I would like to book a skate session for " +
                  account.childName +
                  ".",
              )
            }
          >
            Book a session
          </a>
        </header>
        <section className="install-app-card">
          <div className="install-app-icon">
            <Smartphone />
          </div>
          <div>
            <small>NEW</small>
            <b>Take the MSA portal with you</b>
            <span>
              Install it on your home screen for quick access to every update.
            </span>
          </div>
          <button className="button button-small" onClick={installApp}>
            <Download size={17} /> Install
          </button>
        </section>
        <section className="dashboard-grid">
          <div className="dash-card live-next-session">
            <div className="card-heading-row">
              <div>
                <small>YOUR SCHEDULE</small>
                <h2>Next sessions</h2>
              </div>
              <CalendarPlus />
            </div>
            {nextSession ? (
              <div className="primary-session-block">
                <div className="session-label">PRIMARY SESSION</div>
                <div className="session-info">
                  <div>
                    <div className="session-date">
                      {sessionDay} · EVERY WEEK
                    </div>
                    <p>
                      {sessionTime} · {nextSession.location}
                    </p>
                    <b>{nextSession.title}</b>
                  </div>
                  <CheckCircle2 size={48} />
                </div>
              </div>
            ) : (
              <div className="session-empty">
                <p>Your primary session is not scheduled yet.</p>
                <span>Check back here for the weekly day, time, and location.</span>
              </div>
            )}
            {addonSessions.length > 0 && (
              <div className="reserved-sessions">
                <div className="session-label">OTHER SESSIONS RESERVED</div>
                {addonSessions.map((session) => {
                  const date = new Date(session.session_date + "T12:00:00");
                  const time = new Date(
                    "1970-01-01T" + session.start_time,
                  ).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return (
                    <div className="reserved-session-row" key={session.id}>
                      <div>
                        <b>
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </b>
                        <span>
                          {time} · {session.location}
                        </span>
                      </div>
                      <small>
                        {session.status === "requested"
                          ? "REQUESTED"
                          : session.title}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="dash-card next-session">
            <h2>Next session</h2>
            <div className="session-info">
              <div>
                <div className="session-date">SAT 15</div>
                <p>10:00 AM · Kendall Skatepark</p>
                <b>MSA Member Session</b>
              </div>
              <CheckCircle2 size={48} />
            </div>
          </div>
          <div className="dash-card">
            <h2>Skater profile</h2>
            <p>
              <b>{account.childName}</b>
            </p>
            <p className="muted">Active MSA member · All set</p>
            <div className="profile-focus">
              <small>CURRENT FOCUS</small>
              <b>{currentFocus}</b>
            </div>
          </div>
          <div id="milestones" className="dash-card progress-summary">
            <div className="card-heading-row">
              <div>
                <small>MSA PROGRESSION</small>
                <h2>Your path</h2>
              </div>
              <Trophy />
            </div>
            <div className="summary-metrics">
              <div>
                <b>{overallProgress}%</b>
                <span>overall progress</span>
              </div>
              <div>
                <b>
                  {completedSkills}/{trickProgress.length || 0}
                </b>
                <span>skills mastered</span>
              </div>
            </div>
            <div className="summary-bar">
              <span style={{ width: overallProgress + "%" }} />
            </div>
            <p className="muted">
              Your coach updates this roadmap after each session.
            </p>
          </div>
          <div className="dash-card trick-card">
            <div className="card-heading-row">
              <div>
                <small>LIVE SKATER ROADMAP</small>
                <h2>Main trick checklist</h2>
              </div>
              <Trophy />
            </div>
            <div className="trick-list">
              {trickProgress.map((item) => {
                const level = labelStatus(item.status);
                return (
                  <div className="trick-row" key={item.trick_id}>
                    <span
                      className={
                        "trick-check " +
                        (item.status === "mastered" ? "done" : "")
                      }
                    >
                      {item.status === "mastered" && <Check size={15} />}
                    </span>
                    <div className="trick-details">
                      <div>
                        <b>{item.tricks?.name}</b>
                        <span
                          className={
                            "status-pill status-" +
                            item.status.replace("_", "-")
                          }
                        >
                          {level}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <span style={{ width: item.progress + "%" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="checklist-coach-note">
              <MessageCircle size={18} />
              <div>
                <small>
                  COACH NOTE
                  {coachNote
                    ? " · " +
                      new Date(coachNote.created_at).toLocaleDateString()
                    : ""}
                </small>
                <p>{checklistCoachNote}</p>
              </div>
            </div>
            <p className="coach-lock">
              <LockKeyhole size={15} /> Progress is updated live by your MSA
              coach after sessions.
            </p>
          </div>
          <div className="dash-card notification-card">
            <div className="card-heading-row">
              <div>
                <small>COACH UPDATES</small>
                <h2>Notifications</h2>
              </div>
              <Bell />
            </div>
            {notifications.length ? (
              <div className="notification-list">
                {notifications.map((notice) => (
                  <div
                    className={
                      "notification-row " + (notice.is_read ? "" : "unread")
                    }
                    key={notice.id}
                  >
                    <span />
                    <div>
                      <b>{notice.message}</b>
                      <small>
                        {new Date(notice.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                New coach updates will appear here automatically.
              </p>
            )}
          </div>
          <div className="dash-card">
            <h2>Quick actions</h2>
            <div className="quick-actions">
              <button onClick={messageCoach}>
                <MessageCircle size={20} /> Message coach
              </button>
              <button onClick={addReminder}>
                <CalendarPlus size={20} /> Add reminder
              </button>
              <button onClick={viewMilestones}>
                <CheckCircle2 size={20} /> View milestones
              </button>
              <button
                onClick={() =>
                  window.open(
                    "https://www.yointcounty.com/collections/skate-lessons",
                    "_blank",
                  )
                }
              >
                <ShoppingBag size={20} /> MSA gear
              </button>
            </div>
          </div>
        </section>
      </div>
      {showInstallHelp && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setShowInstallHelp(false)}
        >
          <section
            className="install-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close install instructions"
              onClick={() => setShowInstallHelp(false)}
            >
              <X />
            </button>
            <div className="install-app-icon">
              <Smartphone />
            </div>
            <p className="eyebrow">
              <span /> Install MSA
            </p>
            <h2 id="install-title">ADD IT TO YOUR HOME SCREEN.</h2>
            {isIos ? (
              <ol>
                <li>
                  Tap the <b>Share</b> button <Share2 size={17} />.
                </li>
                <li>
                  Scroll and choose <b>Add to Home Screen</b>.
                </li>
                <li>
                  Tap <b>Add</b>.
                </li>
              </ol>
            ) : (
              <ol>
                <li>Open your browser menu.</li>
                <li>
                  Choose <b>Install app</b> or <b>Add to Home screen</b>.
                </li>
                <li>
                  Confirm <b>Install</b>.
                </li>
              </ol>
            )}
            <p className="muted">
              The MSA icon will appear with your other apps and open directly to
              the portal.
            </p>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
