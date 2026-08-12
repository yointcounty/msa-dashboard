"use client";
import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ImagePlus,
  LogOut,
  Save,
  Trash2,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./coach.css";

type Skater = {
  id: string;
  name: string;
  parent_user_id: string;
  profiles: { parent_name: string | null; email: string } | null;
};
type Family = {
  id: string;
  parent_name: string | null;
  email: string;
  skater: Skater | null;
};
type Progress = {
  trick_id: string;
  status: string;
  progress: number;
  coach_note: string;
  tricks: { name: string; sort_order: number } | null;
};
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
  skater_id: string;
  session_date: string;
  start_time: string;
  location: string;
  title: string;
  status: string;
};

export default function CoachPortal() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activate, setActivate] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [coachId, setCoachId] = useState("");
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyDrafts, setFamilyDrafts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");
  const [progress, setProgress] = useState<Progress[]>([]);
  const [overallNote, setOverallNote] = useState("");
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [addonSessions, setAddonSessions] = useState<AddonSession[]>([]);
  const [sessionDraft, setSessionDraft] = useState({
    weekly_day: "",
    start_time: "",
    location: "",
    title: "MSA Member Session",
  });
  const [addonDraft, setAddonDraft] = useState({
    session_date: "",
    start_time: "",
    location: "",
    title: "MSA Add-on Session",
  });

  const loadSkaters = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setAuthorized(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .single();
    if (profile?.role !== "coach") {
      await supabase.auth.signOut();
      setAuthorized(false);
      setMessage("This account does not have coach access.");
      return;
    }
    setCoachId(auth.user.id);
    setAuthorized(true);
    const [{ data }, { data: familyRows }] = await Promise.all([
      supabase
        .from("skaters")
        .select(
          "id,name,parent_user_id,profiles!skaters_parent_user_id_fkey(parent_name,email)",
        )
        .eq("active", true)
        .order("name"),
      supabase
        .from("profiles")
        .select("id,parent_name,email")
        .eq("role", "family")
        .order("parent_name"),
    ]);
    const list = (data || []) as unknown as Skater[];
    setSkaters(list);
    const nextFamilies = (
      (familyRows || []) as Array<{
        id: string;
        parent_name: string | null;
        email: string;
      }>
    ).map((family) => ({
      ...family,
      skater: list.find((item) => item.parent_user_id === family.id) || null,
    }));
    setFamilies(nextFamilies);
    setFamilyDrafts((current) =>
      Object.fromEntries(
        nextFamilies.map((family) => [
          family.id,
          current[family.id] ?? family.skater?.name ?? "",
        ]),
      ),
    );
    setSelected((current) =>
      current && list.some((item) => item.id === current)
        ? current
        : list[0]?.id || "",
    );
  }, []);

  const loadProgress = useCallback(async () => {
    if (!selected) {
      setProgress([]);
      setOverallNote("");
      setAddonSessions([]);
      return;
    }
    const [
      { data: trickRows },
      { data: noteRow },
      { data: sessionRow },
      { data: addonRows },
    ] = await Promise.all([
      supabase
        .from("skater_tricks")
        .select("trick_id,status,progress,coach_note,tricks(name,sort_order)")
        .eq("skater_id", selected),
      supabase
        .from("skater_notes")
        .select("body")
        .eq("skater_id", selected)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("skater_next_sessions")
        .select("skater_id,session_date,weekly_day,start_time,location,title")
        .eq("skater_id", selected)
        .maybeSingle(),
      supabase
        .from("skater_addon_sessions")
        .select("id,skater_id,session_date,start_time,location,title,status")
        .eq("skater_id", selected)
        .in("status", ["requested", "reserved"])
        .order("session_date")
        .order("start_time"),
    ]);
    const currentSession = (sessionRow || null) as NextSession | null;
    setProgress(
      ((trickRows || []) as unknown as Progress[]).sort(
        (a, b) => (a.tricks?.sort_order || 0) - (b.tricks?.sort_order || 0),
      ),
    );
    setOverallNote(noteRow?.body || "");
    setNextSession(currentSession);
    setAddonSessions((addonRows || []) as AddonSession[]);
    setSessionDraft(
      currentSession
        ? {
            weekly_day: String(
              currentSession.weekly_day ??
                (currentSession.session_date
                  ? new Date(currentSession.session_date + "T12:00:00").getDay()
                  : ""),
            ),
            start_time: currentSession.start_time.slice(0, 5),
            location: currentSession.location,
            title: currentSession.title,
          }
        : {
            weekly_day: "",
            start_time: "",
            location: "",
            title: "MSA Member Session",
          },
    );
  }, [selected]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSkaters();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSkaters]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProgress();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProgress]);

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).toLowerCase();
    const password = String(form.get("password"));
    if (email !== "jt@yointcounty.com") {
      setMessage("Coach access is authorized for jt@yointcounty.com.");
      setBusy(false);
      return;
    }
    const result = activate
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/coach`,
            data: { parent_name: "JT Coach" },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (activate && !result.data.session)
      setMessage(
        "Check jt@yointcounty.com to confirm the coach account, then sign in.",
      );
    else await loadSkaters();
    setBusy(false);
  }
  function edit(trickId: string, changes: Partial<Progress>) {
    setProgress((items) =>
      items.map((item) =>
        item.trick_id === trickId ? { ...item, ...changes } : item,
      ),
    );
  }
  async function save(item: Progress) {
    setMessage("Saving coach update…");
    const { error } = await supabase
      .from("skater_tricks")
      .update({
        status: item.status,
        progress: item.progress,
        coach_note: item.coach_note,
        updated_by: coachId,
        updated_at: new Date().toISOString(),
      })
      .eq("skater_id", selected)
      .eq("trick_id", item.trick_id);
    setMessage(
      error
        ? error.message
        : `${item.tricks?.name} updated. The family was notified in their portal.`,
    );
  }
  async function saveAllSkills() {
    if (!selected || !progress.length) return;
    setSavingAll(true);
    setMessage("Saving all skill updates…");
    const results = await Promise.all(
      progress.map((item) =>
        supabase
          .from("skater_tricks")
          .update({
            status: item.status,
            progress: item.progress,
            coach_note: item.coach_note,
            updated_by: coachId,
            updated_at: new Date().toISOString(),
          })
          .eq("skater_id", selected)
          .eq("trick_id", item.trick_id),
      ),
    );
    const failed = results.find((result) => result.error)?.error;
    setSavingAll(false);
    setMessage(
      failed
        ? failed.message
        : `All ${progress.length} skill updates are saved. The family portal is up to date.`,
    );
  }
  async function saveOverallNote() {
    if (!selected || !overallNote.trim()) return;
    setBusy(true);
    setMessage("Saving coach note…");
    const { error } = await supabase.from("skater_notes").insert({
      skater_id: selected,
      author_user_id: coachId,
      body: overallNote.trim(),
    });
    const active = skaters.find((item) => item.id === selected);
    if (!error && active)
      await supabase.from("notifications").insert({
        recipient_user_id: active.parent_user_id,
        skater_id: selected,
        message: "Your coach posted a new update to your skater portal.",
      });
    setBusy(false);
    setMessage(
      error ? error.message : "Coach note saved to the family portal.",
    );
  }
  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selected) return;
    setMediaBusy(true);
    setMessage("Uploading media…");
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${selected}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("skater-media")
      .upload(path, file, { upsert: false });
    if (uploadError) {
      setMediaBusy(false);
      setMessage(uploadError.message);
      return;
    }
    const { error: mediaError } = await supabase.from("media").insert({
      skater_id: selected,
      storage_path: path,
      kind: file.type.startsWith("video/") ? "video" : "photo",
      caption: file.name.replace(/\.[^.]+$/, ""),
      created_by: coachId,
    });
    setMediaBusy(false);
    setMessage(
      mediaError
        ? mediaError.message
        : "Media saved to this skater’s permanent gallery.",
    );
  }
  async function saveNextSession() {
    if (
      !selected ||
      sessionDraft.weekly_day === "" ||
      !sessionDraft.start_time ||
      !sessionDraft.location.trim()
    ) {
      setMessage("Choose the weekly day, time, and location before saving.");
      return;
    }
    setBusy(true);
    setMessage("Saving next session…");
    const { data, error } = await supabase
      .from("skater_next_sessions")
      .upsert(
        {
          skater_id: selected,
          session_date: null,
          weekly_day: Number(sessionDraft.weekly_day),
          start_time: sessionDraft.start_time,
          location: sessionDraft.location.trim(),
          title: sessionDraft.title.trim() || "MSA Member Session",
          updated_by: coachId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "skater_id" },
      )
      .select("skater_id,session_date,weekly_day,start_time,location,title")
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNextSession(data as NextSession);
    setSessionDraft((draft) => ({
      ...draft,
      location: draft.location.trim(),
      title: draft.title.trim() || "MSA Member Session",
    }));
    setMessage(
      "Next session updated. The family portal now has the new details.",
    );
  }
  async function saveAddonSession() {
    if (
      !selected ||
      !addonDraft.session_date ||
      !addonDraft.start_time ||
      !addonDraft.location.trim()
    ) {
      setMessage(
        "Add the add-on date, time, and location before reserving it.",
      );
      return;
    }
    setBusy(true);
    setMessage("Reserving add-on session…");
    const { data, error } = await supabase
      .from("skater_addon_sessions")
      .insert({
        skater_id: selected,
        session_date: addonDraft.session_date,
        start_time: addonDraft.start_time,
        location: addonDraft.location.trim(),
        title: addonDraft.title.trim() || "MSA Add-on Session",
        status: "reserved",
        created_by: coachId,
        updated_by: coachId,
      })
      .select("id,skater_id,session_date,start_time,location,title,status")
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setAddonSessions((sessions) =>
      [...sessions, data as AddonSession].sort((a, b) =>
        `${a.session_date} ${a.start_time}`.localeCompare(
          `${b.session_date} ${b.start_time}`,
        ),
      ),
    );
    setAddonDraft({
      session_date: "",
      start_time: "",
      location: "",
      title: "MSA Add-on Session",
    });
    setMessage(
      "Add-on session reserved. The family can now see it in their portal.",
    );
  }
  async function clearAddonSession(id: string) {
    if (!window.confirm("Remove this reserved add-on session?")) return;
    setBusy(true);
    const { error } = await supabase
      .from("skater_addon_sessions")
      .delete()
      .eq("id", id);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setAddonSessions((sessions) =>
      sessions.filter((session) => session.id !== id),
    );
    setMessage("Add-on session removed.");
  }
  async function clearNextSession() {
    if (
      !selected ||
      !nextSession ||
      !window.confirm("Clear this next session from the family portal?")
    )
      return;
    setBusy(true);
    setMessage("Clearing next session…");
    const { error } = await supabase
      .from("skater_next_sessions")
      .delete()
      .eq("skater_id", selected);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNextSession(null);
    setSessionDraft({
      weekly_day: "",
      start_time: "",
      location: "",
      title: "MSA Member Session",
    });
    setMessage("Next session cleared.");
  }
  async function saveFamilySkater(familyId: string) {
    const name = (familyDrafts[familyId] || "").trim();
    if (!name) {
      setMessage("Enter the skater name before saving.");
      return;
    }
    setBusy(true);
    setMessage("Saving skater link…");
    const { error: atomicError } = await supabase.rpc("coach_link_skater", {
      target_user_id: familyId,
      skater_name: name,
      existing_skater_id:
        families.find((item) => item.id === familyId)?.skater?.id || null,
    });
    if (!atomicError) {
      setBusy(false);
      setMessage(
        `${name} is linked and their roadmap is ready. Existing progress and media were preserved.`,
      );
      await loadSkaters();
      return;
    }
    const family = families.find((item) => item.id === familyId);
    if (family?.skater) {
      const { error } = await supabase
        .from("skaters")
        .update({ name, active: true })
        .eq("id", family.skater.id)
        .eq("parent_user_id", familyId);
      setBusy(false);
      setMessage(
        error
          ? error.message
          : `${name} is now linked to this family. Existing progress and media were preserved.`,
      );
      if (!error) await loadSkaters();
      return;
    }
    const { data: newSkater, error: skaterError } = await supabase
      .from("skaters")
      .insert({ parent_user_id: familyId, name, active: true })
      .select("id")
      .single();
    if (skaterError || !newSkater) {
      setBusy(false);
      setMessage(skaterError?.message || "Could not create the skater link.");
      return;
    }
    const { data: trickRows, error: tricksError } = await supabase
      .from("tricks")
      .select("id")
      .order("sort_order");
    if (tricksError) {
      setBusy(false);
      setMessage(tricksError.message);
      return;
    }
    const { error: settingsError } = await supabase
      .from("skater_settings")
      .insert({ skater_id: newSkater.id, updated_by: coachId });
    const { error: progressError } = settingsError
      ? { error: settingsError }
      : await supabase.from("skater_tricks").insert(
          (trickRows || []).map((trick) => ({
            skater_id: newSkater.id,
            trick_id: trick.id,
          })),
        );
    setBusy(false);
    const error = settingsError || progressError;
    setMessage(
      error
        ? error.message
        : `${name} is linked and their ${trickRows?.length || 0}-skill roadmap is ready.`,
    );
    if (!error) await loadSkaters();
  }
  async function moveExistingSkater(familyId: string, skaterId: string) {
    if (!skaterId) return;
    const skater = skaters.find((item) => item.id === skaterId);
    const family = families.find((item) => item.id === familyId);
    if (!skater || !family) return;
    if (
      !window.confirm(
        `Link ${skater.name} to ${family.parent_name || family.email}? Their existing progress, notes, and media will stay with them.`,
      )
    )
      return;
    setBusy(true);
    setMessage("Moving skater link…");
    const { error: atomicError } = await supabase.rpc("coach_link_skater", {
      target_user_id: familyId,
      skater_name: skater.name,
      existing_skater_id: skaterId,
    });
    if (!atomicError) {
      setBusy(false);
      setMessage(
        `${skater.name} is now linked to ${family.parent_name || family.email}. Existing progress and media were preserved.`,
      );
      await loadSkaters();
      return;
    }
    const { error } = await supabase
      .from("skaters")
      .update({ parent_user_id: familyId })
      .eq("id", skaterId);
    setBusy(false);
    setMessage(
      error
        ? error.message
        : `${skater.name} is now linked to ${family.parent_name || family.email}. Existing progress and media were preserved.`,
    );
    if (!error) await loadSkaters();
  }
  async function deleteFamilyAccount(targetUserId: string, label: string) {
    if (
      !window.confirm(
        `Delete the family account for ${label}? This permanently removes their profile, skater progress, notes, notifications, media records, and account access.`,
      )
    )
      return;
    setBusy(true);
    setMessage("Deleting family account…");
    const { error } = await supabase.rpc("delete_family_account", {
      target_user_id: targetUserId,
    });
    if (error) setMessage(error.message);
    else {
      const remainingFamilies = families.filter(
        (item) => item.id !== targetUserId,
      );
      const remainingSkaters = skaters.filter(
        (item) => item.parent_user_id !== targetUserId,
      );
      setFamilies(remainingFamilies);
      setSkaters(remainingSkaters);
      setSelected(remainingSkaters[0]?.id || "");
      setProgress([]);
      setOverallNote("");
      setMessage("Family account deleted.");
    }
    setBusy(false);
  }

  if (authorized === null)
    return <main className="coach-loading">Opening coach portal…</main>;
  if (!authorized)
    return (
      <main className="coach-auth">
        <section>
          <Link href="/" className="brand-lockup">
            <span className="brand-mark">MSA</span>
            <span>
              <b>MIAMI SKATE</b>
              <small>COACH PORTAL</small>
            </span>
          </Link>
          <p className="eyebrow">
            <span /> Private staff access
          </p>
          <h1>
            COACH
            <br />
            <em>CONTROL.</em>
          </h1>
          <p>
            Update progress, save coach notes, add media, and manage every
            family account.
          </p>
        </section>
        <form onSubmit={authenticate}>
          <h2>{activate ? "Activate coach account" : "Coach sign in"}</h2>
          <label>
            Email
            <input
              name="email"
              type="email"
              value="jt@yointcounty.com"
              readOnly
            />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          {message && <p className="coach-message">{message}</p>}
          <button className="button" disabled={busy}>
            {busy
              ? "Please wait…"
              : activate
                ? "Activate coach access"
                : "Sign in"}
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setActivate(!activate);
              setMessage("");
            }}
          >
            {activate
              ? "Already activated? Sign in"
              : "First time? Activate coach access"}
          </button>
        </form>
      </main>
    );

  const activeSkater = skaters.find((item) => item.id === selected);
  return (
    <main className="coach-shell">
      <nav className="coach-nav">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">MSA</span>
          <span>
            <b>MIAMI SKATE</b>
            <small>COACH PORTAL</small>
          </span>
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setAuthorized(false);
          }}
        >
          <LogOut size={17} /> Sign out
        </button>
      </nav>
      <div className="coach-main">
        <header>
          <div>
            <p className="eyebrow">
              <span /> Live progress control
            </p>
            <h1>
              COACH
              <br />
              PORTAL.
            </h1>
            <p>
              Every saved change updates the family portal and stays in Supabase
              across future website updates.
            </p>
          </div>
          <div className="coach-stat">
            <Users />
            <b>{families.length}</b>
            <span>Family accounts</span>
          </div>
        </header>
        <section className="account-controls">
          <div>
            <p className="eyebrow">
              <span /> Account administration
            </p>
            <h2>Family accounts</h2>
            <p>
              Every family profile stays saved until intentionally deleted. Link
              or correct a skater here if signup was incomplete.
            </p>
          </div>
          <div className="family-account-list">
            {families.length ? (
              families.map((family) => (
                <div className="family-account-row" key={family.id}>
                  <div className="family-account-main">
                    <b>{family.parent_name || family.email}</b>
                    <small>
                      {family.email} ·{" "}
                      {family.skater?.name || "No skater linked yet"}
                    </small>
                    <div className="family-link-tools">
                      <label
                        className="sr-only"
                        htmlFor={`skater-name-${family.id}`}
                      >
                        Skater name
                      </label>
                      <input
                        id={`skater-name-${family.id}`}
                        value={familyDrafts[family.id] || ""}
                        onChange={(event) =>
                          setFamilyDrafts((current) => ({
                            ...current,
                            [family.id]: event.target.value,
                          }))
                        }
                        placeholder="Skater name"
                      />
                      <button
                        className="link-button"
                        disabled={
                          busy || !(familyDrafts[family.id] || "").trim()
                        }
                        onClick={() => saveFamilySkater(family.id)}
                      >
                        {family.skater ? (
                          <>
                            <Save size={14} /> Save correction
                          </>
                        ) : (
                          <>
                            <UserRoundPlus size={14} /> Link skater
                          </>
                        )}
                      </button>
                      {!family.skater && (
                        <select
                          className="existing-skater-select"
                          defaultValue=""
                          disabled={busy}
                          onChange={(event) => {
                            void moveExistingSkater(
                              family.id,
                              event.target.value,
                            );
                            event.target.value = "";
                          }}
                          aria-label={`Link an existing skater to ${family.parent_name || family.email}`}
                        >
                          <option value="">Or link existing…</option>
                          {skaters
                            .filter((item) => item.parent_user_id !== family.id)
                            .map((item) => (
                              <option value={item.id} key={item.id}>
                                {item.name} ·{" "}
                                {item.profiles?.parent_name ||
                                  item.profiles?.email}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <button
                    className="danger-button"
                    disabled={busy}
                    onClick={() =>
                      deleteFamilyAccount(
                        family.id,
                        family.parent_name || family.email,
                      )
                    }
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              ))
            ) : (
              <p>No family profiles yet.</p>
            )}
          </div>
        </section>
        {skaters.length === 0 ? (
          <section className="empty-coach">
            <Users />
            <h2>No skater accounts yet.</h2>
            <p>
              Use “Link skater” above to create a protected roadmap for a family
              that signed up without a skater name.
            </p>
          </section>
        ) : (
          <>
            <section className="skater-picker">
              <label htmlFor="skater">Editing progress for</label>
              <select
                id="skater"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                {skaters.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} —{" "}
                    {item.profiles?.parent_name || item.profiles?.email}
                  </option>
                ))}
              </select>
              <div>
                <ClipboardCheck />
                <span>
                  <b>{activeSkater?.name}</b>
                  <small>{activeSkater?.profiles?.email}</small>
                </span>
              </div>
            </section>
            <section className="next-session-editor">
              <div>
                <p className="eyebrow">
                  <span /> Primary schedule
                </p>
                <h2>PRIMARY SESSION</h2>
                <p>
                  Change the details here and parents see the update in their
                  portal immediately.
                </p>
              </div>
              <div className="session-editor-fields">
                <label>
                  Title
                  <input
                    value={sessionDraft.title}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({
                        ...draft,
                        title: event.target.value,
                      }))
                    }
                    placeholder="MSA Member Session"
                  />
                </label>
                <label>
                  Weekly day
                  <select
                    value={sessionDraft.weekly_day}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({
                        ...draft,
                        weekly_day: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose a day</option>
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    value={sessionDraft.start_time}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({
                        ...draft,
                        start_time: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="session-location-field">
                  Location
                  <input
                    value={sessionDraft.location}
                    onChange={(event) =>
                      setSessionDraft((draft) => ({
                        ...draft,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Kendall Skatepark"
                  />
                </label>
              </div>
              <div className="session-editor-actions">
                <button onClick={saveNextSession} disabled={busy}>
                  <CalendarDays size={16} />{" "}
                  {nextSession
                    ? "Update primary session"
                    : "Set primary session"}
                </button>
                {nextSession && (
                  <button
                    className="text-button"
                    onClick={clearNextSession}
                    disabled={busy}
                  >
                    Clear primary
                  </button>
                )}
              </div>
            </section>
            <section className="addon-session-editor">
              <div>
                <p className="eyebrow">
                  <span /> Add-on reservations
                </p>
                <h2>OTHER SESSIONS RESERVED</h2>
                <p>
                  Reserve extra sessions requested by the family. They appear
                  below the primary session in their portal.
                </p>
              </div>
              <div className="session-editor-fields">
                <label>
                  Title
                  <input
                    value={addonDraft.title}
                    onChange={(event) =>
                      setAddonDraft((draft) => ({
                        ...draft,
                        title: event.target.value,
                      }))
                    }
                    placeholder="MSA Add-on Session"
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={addonDraft.session_date}
                    onChange={(event) =>
                      setAddonDraft((draft) => ({
                        ...draft,
                        session_date: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    value={addonDraft.start_time}
                    onChange={(event) =>
                      setAddonDraft((draft) => ({
                        ...draft,
                        start_time: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="session-location-field">
                  Location
                  <input
                    value={addonDraft.location}
                    onChange={(event) =>
                      setAddonDraft((draft) => ({
                        ...draft,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Kendall Skatepark"
                  />
                </label>
              </div>
              <div className="session-editor-actions">
                <button onClick={saveAddonSession} disabled={busy}>
                  <CalendarDays size={16} /> Reserve add-on
                </button>
              </div>
              {addonSessions.length > 0 && (
                <div className="coach-addon-list">
                  {addonSessions.map((session) => (
                    <div className="coach-addon-row" key={session.id}>
                      <div>
                        <b>
                          {new Date(
                            session.session_date + "T12:00:00",
                          ).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </b>
                        <span>
                          {new Date(
                            "1970-01-01T" + session.start_time,
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          · {session.location}
                        </span>
                      </div>
                      <small>{session.title}</small>
                      <button
                        className="text-button"
                        onClick={() => clearAddonSession(session.id)}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="coach-note-panel">
              <div>
                <p className="eyebrow">
                  <span /> One coach note
                </p>
                <h2>Family update</h2>
                <p>This is the single note parents see in their portal.</p>
              </div>
              <textarea
                value={overallNote}
                onChange={(event) => setOverallNote(event.target.value)}
                placeholder="What should this family know after the latest session?"
                maxLength={1200}
              />
              <button
                onClick={saveOverallNote}
                disabled={busy || !overallNote.trim()}
              >
                <Save size={16} /> Save coach note
              </button>
            </section>
            <section className="media-panel">
              <div>
                <p className="eyebrow">
                  <span /> Permanent media
                </p>
                <h2>Add a gallery photo or video</h2>
                <p>
                  Uploads stay linked to this skater until the family account is
                  deleted.
                </p>
              </div>
              <label className="media-upload">
                <ImagePlus size={17} />{" "}
                {mediaBusy ? "Uploading…" : "Choose photo or video"}
                <input
                  type="file"
                  accept="image/*,video/*"
                  disabled={mediaBusy}
                  onChange={uploadMedia}
                />
              </label>
            </section>
            <section className="coach-tricks">
              <div className="coach-section-title">
                <div>
                  <p className="eyebrow">
                    <span /> Main trick checklist
                  </p>
                  <h2>Update the roadmap</h2>
                </div>
                <div className="coach-section-actions">
                  <BellRing />
                  <button
                    className="save-all-button"
                    onClick={saveAllSkills}
                    disabled={savingAll || busy || !progress.length}
                  >
                    <Save size={16} />{" "}
                    {savingAll ? "Saving all…" : "Save all skill updates"}
                  </button>
                </div>
                <p>Saving automatically creates an in-app notification.</p>
              </div>
              <div className="coach-trick-list">
                {progress.map((item) => (
                  <article key={item.trick_id}>
                    <div className="trick-name">
                      <CheckCircle2 />
                      <b>{item.tricks?.name}</b>
                    </div>
                    <label>
                      Status
                      <select
                        value={item.status}
                        onChange={(event) =>
                          edit(item.trick_id, { status: event.target.value })
                        }
                      >
                        <option value="not_started">Not started</option>
                        <option value="learning">Learning</option>
                        <option value="landed">Landed</option>
                        <option value="consistent">Consistent</option>
                        <option value="mastered">Mastered</option>
                      </select>
                    </label>
                    <label>
                      Progress <b>{item.progress}%</b>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={item.progress}
                        onChange={(event) =>
                          edit(item.trick_id, {
                            progress: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Skill note
                      <textarea
                        value={item.coach_note}
                        onChange={(event) =>
                          edit(item.trick_id, {
                            coach_note: event.target.value,
                          })
                        }
                        placeholder="Optional skill-specific detail"
                      />
                    </label>
                    <button onClick={() => save(item)}>
                      <Save size={16} /> Save skill update
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {message && (
          <div className="coach-toast" role="status">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
