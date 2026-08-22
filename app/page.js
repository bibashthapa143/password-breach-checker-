"use client";

import { useState, useEffect } from "react";
import zxcvbn from "zxcvbn";

export default function Home() {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(null);
  const [breachCount, setBreachCount] = useState(null); // null = not checked, -1 = error
  const [checking, setChecking] = useState(false);

  // --- Theme: "light", "dark", or "system" ---
  const [theme, setTheme] = useState("system");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState("light");

  useEffect(() => {
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolvedTheme(prefersDark ? "dark" : "light");
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e) {
      setResolvedTheme(e.matches ? "dark" : "light");
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  const isDark = resolvedTheme === "dark";

  const colors = {
    pageBg: isDark ? "#111827" : "#f3f4f6",
    cardBg: isDark ? "#1f2937" : "#fff",
    text: isDark ? "#f9fafb" : "#111827",
    subtext: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#111827" : "#fff",
    inputBorder: isDark ? "#374151" : "#d1d5db",
    barTrack: isDark ? "#374151" : "#e5e7eb",
    strengthBtnBg: isDark ? "#374151" : "#f3f4f6",
    strengthBtnText: isDark ? "#f9fafb" : "#374151",
  };

  function getStrength(pwd) {
    const result = zxcvbn(pwd);
    if (result.score <= 1) return "Weak";
    if (result.score <= 3) return "Medium";
    return "Strong";
  }

  async function sha1(text) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

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
    setStrength(null);
    setBreachCount(null);
  }

  function handleCheckStrength() {
    if (!password) return;
    setStrength(getStrength(password));
  }

  const strengthStyle = {
    Weak: { color: "#e53935", width: "33%" },
    Medium: { color: "#fb8c00", width: "66%" },
    Strong: { color: "#43a047", width: "100%" },
  };

  const themeOptions = [
    { value: "light", label: "☀️ Light" },
    { value: "dark", label: "🌙 Dark" },
    { value: "system", label: "🖥️ System" },
  ];

  const currentIcon =
    theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🖥️";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: 16,
        transition: "background 0.2s ease",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          style={{
            width: 40,
            height: 40,
            fontSize: 18,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: "50%",
            background: colors.cardBg,
            cursor: "pointer",
          }}
        >
          {currentIcon}
        </button>

        {themeMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: 48,
              right: 0,
              background: colors.cardBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: 130,
            }}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setThemeMenuOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: theme === option.value ? "bold" : "normal",
                  border: "none",
                  background: theme === option.value ? colors.pageBg : "transparent",
                  color: colors.text,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: colors.cardBg,
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          transition: "background 0.2s ease",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0, color: colors.text }}>
          🔐 Password Checker
        </h1>
        <p style={{ color: colors.subtext, fontSize: 14, marginTop: 8 }}>
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
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 8,
            outline: "none",
            background: colors.inputBg,
            color: colors.text,
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
            color: colors.strengthBtnText,
            background: colors.strengthBtnBg,
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: 8,
            cursor: !password ? "not-allowed" : "pointer",
            opacity: !password ? 0.6 : 1,
          }}
        >
          Check strength
        </button>

        {strength && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                height: 8,
                background: colors.barTrack,
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