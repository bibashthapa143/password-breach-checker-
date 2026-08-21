"use client";

import { useState } from "react";

export default function Home() {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(null);
  const [breachCount, setBreachCount] = useState(null); // null = not checked, -1 = error
  const [checking, setChecking] = useState(false);

  // --- 1. Simple strength scoring ---
  function getStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  }

  // --- 2. SHA-1 hash the password in the browser ---
  async function sha1(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  // --- 3. Ask "Have I Been Pwned" if this password leaked before ---
  async function checkBreach() {
    if (!password) return;
    setChecking(true);
    setBreachCount(null);

    try {
      const hash = await sha1(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();

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

      // A leaked password is never safe, no matter how complex it looks.
      if (found > 0) {
        setStrength("Weak");
      }
    } catch (error) {
      setBreachCount(-1);
    }

    setChecking(false);
  }

  function handleChange(e) {
    const value = e.target.value;
    setPassword(value);
    setStrength(value ? getStrength(value) : null);
    setBreachCount(null);
  }

  const strengthStyle = {
    Weak: { color: "#e53935", width: "33%" },
    Medium: { color: "#fb8c00", width: "66%" },
    Strong: { color: "#43a047", width: "100%" },
  };

  return (
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