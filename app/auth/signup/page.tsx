"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { createAccount } from "../../lib/auth";
import "../auth.css";

export default function SignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm"))) {
      setStatus("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await createAccount({
        parentName: String(data.get("parentName")),
        email: String(data.get("email")),
        childName: String(data.get("childName")),
        password,
      });
      if (result.needsConfirmation) {
        setStatus(
          "Check your email to confirm your portal account, then sign in.",
        );
        setBusy(false);
      } else router.push("/dashboard");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to activate access.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <Image
          src="/images/msa-real-login.jpg"
          alt="Miami Skate Academy skaters and coaches"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
        />
        <div className="auth-visual-copy">
          <h2>
            YOUR CREW.
            <br />
            <em>YOUR PROGRESS.</em>
          </h2>
          <p>
            <Check size={17} /> For currently enrolled MSA skaters and their
            families.
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">MSA</span>
          <span>
            <b>MIAMI SKATE</b>
            <small>SKATER PORTAL</small>
          </span>
        </Link>
        <Link href="/" className="back-link home-button">
          <ArrowLeft size={15} /> Home
        </Link>
        <div className="auth-card">
          <p className="eyebrow">
            <span /> Enrolled members only
          </p>
          <h1>ACTIVATE.</h1>
          <p>
            Create private access for your enrolled skater and keep every
            session, milestone, and coach update in one place.
          </p>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="parentName">Parent name</label>
                <input
                  id="parentName"
                  name="parentName"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="childName">Skater name</label>
                <input id="childName" name="childName" required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Parent email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="password">Create password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
                <small className="field-hint">Use at least 8 characters.</small>
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <label className="member-confirm">
              <input type="checkbox" required /> I confirm this skater is
              already enrolled with Miami Skate Academy.
            </label>
            {status && (
              <div className="form-status error" role="alert">
                {status}
              </div>
            )}
            <button className="button" disabled={busy}>
              {busy ? (
                /*
                "Activating your portal…"
                */
                "Activating your portal..."
              ) : (
                <>
                  Activate portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            Already have access? <Link href="/auth/login">Sign in</Link>
          </p>
          <div className="not-enrolled">
            <b>New to Miami Skate Academy?</b>
            <a
              href="https://miamiskateacademy.com"
              target="_blank"
              rel="noreferrer"
            >
              Enroll at MiamiSkateAcademy.com
            </a>
            <a href="sms:+17863947314">Text 786-394-7314</a>
          </div>
        </div>
      </section>
    </main>
  );
}
