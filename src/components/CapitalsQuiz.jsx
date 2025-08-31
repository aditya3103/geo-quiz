import React, { useEffect, useState, useRef, useMemo } from "react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

import { fetchCountries } from "../utils/api"; // your util
import correctSound from "../assets/correct.mp3";
import wrongSound from "../assets/wrong.mp3";
import skipSound from "../assets/skip.mp3";

export default function CapitalsQuiz({ onBack }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [region, setRegion] = useState("All");
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);

  // UI-only overlay states (do NOT change layout)
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', text }
  const [shake, setShake] = useState(false);

  const correctRef = useRef(null);
  const wrongRef = useRef(null);
  const skipRef = useRef(null);
  const timeoutRef = useRef(null);

  // simple shuffle
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // load audio once
  useEffect(() => {
    correctRef.current = new Audio(correctSound);
    wrongRef.current = new Audio(wrongSound);
    skipRef.current = new Audio(skipSound);
  }, []);

  // load countries — use fetchCountries(), but if region is missing, fetch with region
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let data = await fetchCountries(); // uses your api.js

        // If fetchCountries didn't include region, fetch the richer payload:
        if (data.length && data[0].region === undefined) {
          const r = await fetch(
            "https://restcountries.com/v3.1/all?fields=name,capital,flags,region"
          );
          const raw = await r.json();
          data = raw
            .filter((c) => c.capital && Array.isArray(c.capital) && c.capital.length > 0)
            .map((c) => ({
              name: c.name?.common || "Unknown",
              capital: c.capital[0],
              flag: (c.flags && (c.flags.svg || c.flags.png)) || "",
              region: c.region || "Other",
            }));
        } else {
          // ensure region exists for each entry
          data = data.map((c) => ({ ...c, region: c.region || "Other" }));
        }

        if (!mounted) return;
        setCountries(shuffle(data));
        setLoading(false);
      } catch (err) {
        console.error("Failed to load countries:", err);
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // region list (derived)
  const regions = useMemo(() => {
    const s = new Set(countries.map((c) => c.region).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [countries]);

  // pool (derived) for current region
  const pool = useMemo(
    () => (region === "All" ? countries : countries.filter((c) => c.region === region)),
    [countries, region]
  );

  // reset index/score/input when region changes
  useEffect(() => {
    setIndex(0);
    setInput("");
    setScore(0);
    setToast(null);
    setShowConfetti(false);
    clearTimeout(timeoutRef.current);
  }, [region]);

  // guard - current item
  const current = pool[index];

  // advance to next question
  const advance = ({ countScore = false } = {}) => {
    clearTimeout(timeoutRef.current);
    setShowConfetti(false);
    setToast(null);
    setInput("");
    if (countScore) setScore((s) => s + 1);
    setIndex((i) => i + 1);
  };

  // helper: play audio safely
  const play = (ref) => {
    try {
      if (ref && ref.current) {
        ref.current.currentTime = 0;
        ref.current.play().catch(() => {});
      }
    } catch (e) {}
  };

  // success flow (auto-advance)
  const onCorrect = () => {
    play(correctRef);
    if (navigator.vibrate) navigator.vibrate(120);
    setShowConfetti(true);
    setToast({ type: "success", text: `Correct — ${current.capital}` });
    timeoutRef.current = setTimeout(() => advance({ countScore: true }), 900);
  };

  // wrong flow: shake input and show toast, do NOT auto-advance
  const onWrong = () => {
    play(wrongRef);
    setShake(true);
    setToast({ type: "error", text: `Wrong — ${current.capital}` });
    // clear shake after animation
    timeoutRef.current = setTimeout(() => setShake(false), 350);
  };

  // typed input handler (auto-advance if exact match)
  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (!current) return;
    if (val.trim().toLowerCase() === current.capital.toLowerCase()) {
      onCorrect();
    }
  };

  // Enter key: validate explicitly
  const handleKeyDown = (e) => {
    if (e.key !== "Enter" || !current) return;
    if (input.trim().toLowerCase() === current.capital.toLowerCase()) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  const handleShowAnswer = () => {
    if (!current) return;
    setToast({ type: "info", text: `Answer: ${current.capital}` });
    // show for a short time then advance without scoring
    play(skipRef);
    timeoutRef.current = setTimeout(() => advance({ countScore: false }), 1400);
  };

  const handleSkip = () => {
    if (!current) return;
    setToast({ type: "info", text: `Skipped — ${current.capital}` });
    play(skipRef);
    timeoutRef.current = setTimeout(() => advance({ countScore: false }), 800);
  };

  const handleRestart = () => {
    setScore(0);
    setIndex(0);
    setInput("");
    setToast(null);
    setShowConfetti(false);
    setCountries((prev) => shuffle(prev));
  };

  if (loading) {
    return (
      <div className="quiz-card bg-gray-800 p-6 rounded-2xl shadow-md w-full max-w-md">
        <p className="text-gray-400">Loading countries…</p>
      </div>
    );
  }

  if (!pool || pool.length === 0) {
    return (
      <div className="quiz-card bg-gray-800 p-6 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-xl mb-2">No countries in this region</h2>
        <p className="text-gray-400 mb-4">Try another region or reset.</p>
        <div className="flex gap-2">
          <button onClick={() => setRegion("All")} className="btn-primary">
            Show all
          </button>
          <button onClick={onBack} className="btn-secondary">
            ⬅ Back
          </button>
        </div>
      </div>
    );
  }

  // finished
  if (index >= pool.length) {
    return (
      <div className="quiz-card bg-gray-800 p-6 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-3">Finished 🎉</h2>
        <p className="text-gray-300 mb-4">Score: <span className="font-semibold">{score}</span> / {pool.length}</p>
        <div className="flex gap-2">
          <button onClick={handleRestart} className="btn-primary">Restart</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confetti overlay + center badge (absolutely positioned, does not affect layout) */}
      <AnimatePresence>
        {showConfetti && (
          // full-screen confetti behind the badge so the badge remains visible
          <>
            <div className="fixed inset-0 z-40 pointer-events-none">
              <Confetti
                recycle={false}
                numberOfPieces={420}
                gravity={0.28}
                colors={["#F59E0B", "#10B981", "#60A5FA", "#F472B6", "#F97316", "#A78BFA", "#22C55E"]}
              />
            </div>
            <motion.div
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <div className="rounded-full bg-white/6 px-6 py-3 shadow-lg text-xl text-green-300 font-bold backdrop-blur-sm">
                ✅ Correct
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main card (no forced centering added here; parent controls page layout) */}
      <div className="quiz-card bg-gray-800 p-6 rounded-2xl shadow-md w-full max-w-md">

        {/* shuffle + region selector + counter (single row) */}
        <div className="flex gap-2 items-center justify-evenly mb-4">
          <button onClick={handleRestart} className="btn-secondary text-sm px-3 py-2 inline-flex items-center justify-center">Shuffle</button>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="select-box"
          >
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="text-sm text-gray-400">{index + 1}/{pool.length}</div>
        </div>

        {/* Flag */}
        <div className="mb-4">
          <img src={current.flag} alt={`Flag of ${current.name}`} className="flag-img" />
        </div>

  <p className="mb-2 text-gray-300 text-center">What is the capital of</p>
  <h3 className="text-lg font-bold mb-4 text-center">{current.name}</h3>

        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type the capital..."
          className={`quiz-input ${shake ? "shake" : ""}`}
          aria-label="Type the capital"
          autoFocus
        />

        <div className="mt-4 flex gap-2 justify-center">
          <button onClick={handleShowAnswer} className="btn-warning">Show answer</button>
          <button onClick={handleSkip} className="btn-secondary">Skip</button>
        </div>

        <div className="mt-3 text-sm text-gray-400">
          Score: <span className="text-white font-medium">{score}</span> • Region: <span className="text-white font-medium">{region}</span>
        </div>
      </div>

      {/* TOAST overlay outside card — does not affect layout */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.text}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`px-4 py-2 rounded-md shadow-lg text-sm font-medium pointer-events-auto max-w-[90vw] sm:max-w-md w-auto break-words text-center whitespace-normal ${
                toast.type === "success" ? "bg-green-600 text-white" :
                toast.type === "error" ? "bg-red-600 text-white" :
                "bg-yellow-500 text-black"
              }`}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
