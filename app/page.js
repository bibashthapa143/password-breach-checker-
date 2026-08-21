"use client";

import { useState } from "react";
import zxcvbn from "zxcvbn";

export default function Home() {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(null);
  const [breachCount, setBreachCount] = useState(null); // null = not checked, -1 = error
  const [checking, setChecking] = useState(false);

  // --- 1. Strength scoring using zxcvbn (made by Dropbox) ---
  // zxcvbn checks against real leaked-password patterns, common words,
  // keyboard patterns (like "qwerty"), dates, and repeated characters -
  // much smarter than plain regex rules.
  // It returns a score from 0 (worst) to 4 (best).
  function getStrength(pwd) {
    const result = zxcvbn(pwd);
    if (result.score <= 1) return "Weak";
    if (result.score <= 3) return "Medium";
    return "Strong";
  }

  // --- 2. Turn the password into a SHA-1 hash ---
  // We never send the real password anywhere. We only send the first
  // 5 characters of its hash to the breach API (this is called
  // "k-anonymity" - it's how haveibeenpwned.com protects your password).
  async function sha1(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  // --- 3. Ask the "Have I Been Pwned" API if this password leaked before ---
  async function checkBreach() {
    if (!password) return;
    setChecking(true);
    setBreachCount(null);

    try {
      const hash = await sha1(password);
      const prefix = hash.slice(0, 5); // first 5 chars, sent to API
      const suffix = hash.slice(5); // rest, kept on our side only

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();

      // API returns many lines like: "SUFFIX:COUNT"
      const lines = text.split("\n");
      let found = 0;
      for (const line of lines) {
        const [lineSuffix, count] = line.split(":");
        if (lineSuffix.trim() === suffix) {
          found = parseInt(count, 10);
          break;
        }
      }
      setBreachCount(found);

      // Even if the password looks complex, a leaked password is never
      // actually safe. Force the label to "Weak" if it's been breached.
      if (found > 0) {
        setStrength("Weak");
      }
    } catch (error) {
      setBreachCount(-1); // something went wrong (e.g. no internet)
    }

    setChecking(false);
  }

  function handleChange(e) {
    const value = e.target.value;
    setPassword(value);
    setStrength(null); // clear old result whenever password changes
    setBreachCount(null);
  }

  // Runs when the "Check strength" button is clicked
  function handleCheckStrength() {
    if (!password) return;
    setStrength(getStrength(password));
  }

  // Color + fill-width for each strength level (used for the little bar below the input)
  const strengthStyle = {
    Weak: { color: "#e53935", width: "33%" },
    Medium: { color: "#fb8c00", width: "66%" },
    Strong: { color: "#43a047", width: "100%" },
  };

  return (
    // Gray full-page background, card centered in the middle
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: 16,
      }}
    >
      {/* White card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>🔐 Password Checker</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>
          Check your password's strength and see if it has leaked in a known
          data breach.
        </p>

        <input
          type="text"
          value={password}
          onChange={handleChange}
          placeholder="Enter password"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 16,
            boxSizing: "border-box",
            marginTop: 20,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            outline: "none",
          }}
        />

        <button
          onClick={handleCheckStrength}
          disabled={!password}
          style={{
            width: "100%",
            padding: "12px 16px",
            marginTop: 16,
            fontSize: 15,
            fontWeight: "bold",
            color: "#374151",
            background: !password ? "#e5e7eb" : "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            cursor: !password ? "not-allowed" : "pointer",
          }}
        >
          Check strength
        </button>

        {/* Strength bar, only shows after clicking "Check strength" */}
        {strength && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                height: 8,
                background: "#e5e7eb",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: strengthStyle[strength].width,
                  background: strengthStyle[strength].color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p
              style={{
                color: strengthStyle[strength].color,
                fontWeight: "bold",
                fontSize: 14,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              {strength}
            </p>
          </div>
        )}

        <button
          onClick={checkBreach}
          disabled={!password || checking}
          style={{
            width: "100%",
            padding: "12px 16px",
            marginTop: 20,
            fontSize: 15,
            fontWeight: "bold",
            color: "#fff",
            background: !password || checking ? "#9ca3af" : "#4f46e5",
            border: "none",
            borderRadius: 8,
            cursor: !password || checking ? "not-allowed" : "pointer",
          }}
        >
          {checking ? "Checking..." : "Check if breached"}
        </button>

        {/* Result box, color-coded and only shown after a check */}
        {breachCount !== null && breachCount >= 0 && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
              background: breachCount > 0 ? "#fef2f2" : "#f0fdf4",
              color: breachCount > 0 ? "#b91c1c" : "#15803d",
            }}
          >
            {breachCount > 0
              ? `⚠️ Found in ${breachCount.toLocaleString()} breaches. Marked as Weak — leaked passwords are unsafe no matter how complex they look.`
              : "✅ Not found in any known breach."}
          </div>
        )}

        {breachCount === -1 && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
              background: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            Couldn't check right now. Check your internet connection and try
            again.
          </div>
        )}
      </div>
    </main>
  );
}