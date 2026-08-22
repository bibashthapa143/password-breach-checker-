"use client";

import { useState, useEffect } from "react";
import zxcvbn from "zxcvbn";

export default function Home() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [strength, setStrength] = useState(null);
  const [crackTime, setCrackTime] = useState(null);
  const [breachCount, setBreachCount] = useState(null);
  const [checking, setChecking] = useState(false);

  const [theme, setTheme] = useState("system");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState("dark");

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
    pageBg: isDark ? "#0D1117" : "#F6F5F2",
    cardBg: isDark ? "#151B23" : "#FFFFFF",
    border: isDark ? "#2A313C" : "#E4E1D8",
    text: isDark ? "#E8EAED" : "#1B1F24",
    subtext: isDark ? "#8B94A3" : "#68707C",
    inputBg: isDark ? "#0D1117" : "#FBFAF7",
    trackBg: isDark ? "#232B35" : "#ECE9E1",
    accent: "#D9A441",
    accentText: "#1B1300",
    danger: isDark ? "#F87171" : "#C0362C",
    dangerBg: isDark ? "rgba(248,113,113,0.08)" : "#FBEEEC",
    success: isDark ? "#4ADE80" : "#1E8E5A",
    successBg: isDark ? "rgba(74,222,128,0.08)" : "#EAF7EF",
  };

  const mono = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";
  const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  function formatCrackTime(seconds) {
    if (seconds < 0.01) return "instantly";
    if (seconds < 1) return "less than a second";

    const units = [
      { label: "seconds", secs: 1 },
      { label: "minutes", secs: 60 },
      { label: "hours", secs: 60 * 60 },
      { label: "days", secs: 60 * 60 * 24 },
      { label: "months", secs: 60 * 60 * 24 * 30 },
      { label: "years", secs: 60 * 60 * 24 * 365 },
      { label: "centuries", secs: 60 * 60 * 24 * 365 * 100 },
    ];

    let chosen = units[0];
    for (const unit of units) {
      if (seconds >= unit.secs) chosen = unit;
    }

    const value = seconds / chosen.secs;
    return `${value.toFixed(2)} ${chosen.label}`;
  }

  function getStrength(pwd) {
    const result = zxcvbn(pwd);
    let label = "Weak";
    if (result.score >= 4) label = "Strong";
    else if (result.score >= 2) label = "Medium";

    const rawSeconds = result.crack_times_seconds.offline_fast_hashing_1e10_per_second;

    return {
      label,
      crackTime: formatCrackTime(rawSeconds),
    };
  }

  function getChecklist(pwd) {
    return [
      { label: "8+ characters", passed: pwd.length >= 8 },
      { label: "Uppercase letter", passed: /[A-Z]/.test(pwd) },
      { label: "Number", passed: /[0-9]/.test(pwd) },
      { label: "Symbol", passed: /[^A-Za-z0-9]/.test(pwd) },
    ];
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

  // One button: checks strength instantly, then breach status via API
  async function checkPassword() {
    if (!password) return;

    const result = getStrength(password);
    setStrength(result.label);
    setCrackTime(result.crackTime);

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
    setCrackTime(null);
    setBreachCount(null);
  }

  const checklist = getChecklist(password);

  const strengthLevels = ["Weak", "Medium", "Strong"];
  const strengthColor = {
    Weak: colors.danger,
    Medium: colors.accent,
    Strong: colors.success,
  };
  const activeSegments = strength ? strengthLevels.indexOf(strength) + 1 : 0;

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: sans,
        padding: 16,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          style={{
            width: 38,
            height: 38,
            fontSize: 15,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            background: colors.cardBg,
            color: colors.subtext,
            cursor: "pointer",
          }}
        >
          {isDark ? "◐" : "◑"}
        </button>

        {themeMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: 46,
              right: 0,
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
              minWidth: 120,
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
                  padding: "9px 14px",
                  fontSize: 13,
                  fontWeight: theme === option.value ? 700 : 400,
                  border: "none",
                  background: theme === option.value ? colors.pageBg : "transparent",
                  color: theme === option.value ? colors.accent : colors.text,
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
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
          boxShadow: isDark
            ? "0 20px 60px rgba(0,0,0,0.45)"
            : "0 20px 50px rgba(20,20,10,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: colors.accent }} />

        <div style={{ padding: "28px 28px 32px" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.14em",
              fontWeight: 700,
              color: colors.accent,
              textTransform: "uppercase",
            }}
          >
            Password Security
          </p>
          <h1
            style={{
              fontSize: 22,
              margin: "6px 0 0",
              color: colors.text,
              letterSpacing: "-0.01em",
            }}
          >
            Strength &amp; Breach Check
          </h1>
          <p style={{ color: colors.subtext, fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
            Score your password and confirm it hasn't surfaced in a known leak.
          </p>

          <div style={{ position: "relative", marginTop: 22 }}>
            <input
              type={visible ? "text" : "password"}
              value={password}
              onChange={handleChange}
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "12px 44px 12px 14px",
                fontSize: 15,
                fontFamily: mono,
                boxSizing: "border-box",
                border: `1px solid ${colors.border}`,
                borderRadius: 9,
                outline: "none",
                background: colors.inputBg,
                color: colors.text,
              }}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: mono,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: colors.subtext,
                padding: "6px 8px",
              }}
            >
              {visible ? "HIDE" : "SHOW"}
            </button>
          </div>

          {password && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 14,
              }}
            >
              {checklist.map((item) => (
                <span
                  key={item.label}
                  style={{
                    fontSize: 11.5,
                    fontFamily: mono,
                    padding: "4px 9px",
                    borderRadius: 6,
                    border: `1px solid ${item.passed ? colors.success : colors.border}`,
                    color: item.passed ? colors.success : colors.subtext,
                    background: item.passed ? colors.successBg : "transparent",
                  }}
                >
                  {item.passed ? "✓" : "·"} {item.label}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={checkPassword}
            disabled={!password || checking}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "12px 14px",
              fontSize: 14,
              fontWeight: 700,
              color: colors.accentText,
              background: !password || checking ? colors.trackBg : colors.accent,
              border: "none",
              borderRadius: 9,
              cursor: !password || checking ? "not-allowed" : "pointer",
              opacity: !password || checking ? 0.6 : 1,
            }}
          >
            {checking ? "Checking…" : "Check password"}
          </button>

          {strength && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: i < activeSegments ? strengthColor[strength] : colors.trackBg,
                      transition: "background 0.25s ease",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 9,
                }}
              >
                <span
                  style={{
                    color: strengthColor[strength],
                    fontWeight: 700,
                    fontSize: 13.5,
                  }}
                >
                  {strength}
                </span>
                {crackTime && (
                  <span style={{ color: colors.subtext, fontSize: 12, fontFamily: mono }}>
                    crack time ≈ {crackTime}
                  </span>
                )}
              </div>
            </div>
          )}

          {breachCount !== null && breachCount >= 0 && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                borderRadius: 9,
                fontSize: 13,
                lineHeight: 1.5,
                background: breachCount > 0 ? colors.dangerBg : colors.successBg,
                color: breachCount > 0 ? colors.danger : colors.success,
                border: `1px solid ${breachCount > 0 ? colors.danger : colors.success}22`,
              }}
            >
              {breachCount > 0 ? (
                <>
                  <strong>{breachCount.toLocaleString()}</strong> known breaches contain this
                  password. Treat it as compromised regardless of how complex it looks.
                </>
              ) : (
                "No matches found in known breach data."
              )}
            </div>
          )}

          {breachCount === -1 && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                borderRadius: 9,
                fontSize: 13,
                background: colors.dangerBg,
                color: colors.danger,
                border: `1px solid ${colors.danger}22`,
              }}
            >
              Couldn't reach the breach check. Confirm your connection and try again.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}