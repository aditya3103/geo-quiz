// src/components/FlagsQuiz.jsx
import { useEffect, useState, useRef } from "react"
import { fetchCountries } from "../utils/api"
import Confetti from "react-confetti"
import { AnimatePresence, motion } from "framer-motion"
import correctSound from "../assets/correct.mp3"
import wrongSound from "../assets/wrong.mp3"
import skipSound from "../assets/skip.mp3"

export default function FlagsQuiz() {
  const [countries, setCountries] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  // UI overlays + audio refs
  const [showConfetti, setShowConfetti] = useState(false)
  const [toast, setToast] = useState(null) // { type, text }
  const correctRef = useRef(null)
  const wrongRef = useRef(null)
  const skipRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    async function load() {
      const data = await fetchCountries()
      setCountries(data)
      generateQuestion(data)
    }
    load()
    // init audio
    correctRef.current = new Audio(correctSound)
    wrongRef.current = new Audio(wrongSound)
    skipRef.current = new Audio(skipSound)

    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  function generateQuestion(allCountries) {
    if (allCountries.length === 0) return

    // Pick a random country
    const randomCountry =
      allCountries[Math.floor(Math.random() * allCountries.length)]

    // Filter same region
    const sameRegion = allCountries.filter(
      (c) => c.region === randomCountry.region && c.name !== randomCountry.name
    )

    // Shuffle and pick 3 wrong options
    const wrongOptions = sameRegion
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Combine and shuffle options
    const options = [...wrongOptions, randomCountry].sort(
      () => Math.random() - 0.5
    )

    setCurrentQuestion({
      country: randomCountry,
      options,
    })
    setAnswered(false)
  }

  function handleAnswer(selected) {
    if (answered) return
    setAnswered(true)

    const correct = selected.name === currentQuestion.country.name

    if (correct) {
      // success flow: sound, confetti, toast, vibrate
      try {
        correctRef.current.currentTime = 0
        correctRef.current.play().catch(() => {})
      } catch (e) {}
      if (navigator.vibrate) navigator.vibrate(120)
      setShowConfetti(true)
      setToast({ type: "success", text: `Correct — ${currentQuestion.country.name}` })
      setScore((s) => s + 1)
    } else {
      // wrong flow: sound + toast
      try {
        wrongRef.current.currentTime = 0
        wrongRef.current.play().catch(() => {})
      } catch (e) {}
      setToast({ type: "error", text: `Wrong — ${currentQuestion.country.name}` })
    }

    // advance after a short delay (preserve existing behavior)
    timeoutRef.current = setTimeout(() => {
      setShowConfetti(false)
      setToast(null)
      generateQuestion(countries)
    }, 1000)
  }

  if (!currentQuestion) return <p>Loading...</p>

  return (
    <>
      <AnimatePresence>
        {showConfetti && (
          // full-screen confetti overlay to make celebration more prominent
          <div className="fixed inset-0 z-50 pointer-events-none">
            <Confetti
              recycle={false}
              numberOfPieces={300}
              gravity={0.25}
              colors={["#F59E0B", "#10B981", "#60A5FA", "#F472B6", "#F97316", "#A78BFA"]}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="quiz-card text-center space-y-4 mx-auto">
      <h2 className="text-xl font-semibold">Guess the Flag</h2>
      <img
        src={currentQuestion.country.flag}
        alt="Country flag"
        className="w-40 h-28 mx-auto border rounded-lg shadow"
      />
      <div className="grid grid-cols-2 gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.name}
            onClick={() => handleAnswer(option)}
            disabled={answered}
            className={`p-2 border rounded-lg text-sm ${
              answered
                ? option.name === currentQuestion.country.name
                  ? "bg-green-500 text-white"
                  : "bg-red-600 text-white"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
      <p className="font-medium">Score: {score}</p>
      </div>

      {/* Toast overlay */}
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
                  toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                }`}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
