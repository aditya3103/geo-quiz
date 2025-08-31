// src/App.jsx
import { useState } from "react"
import CapitalsQuiz from "./components/CapitalsQuiz"
import FlagsQuiz from "./components/FlagsQuiz"

function App() {
  const [mode, setMode] = useState("capitals") // capitals | flags

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setMode("capitals")}
            className={`px-4 py-2 rounded ${
              mode === "capitals" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"
            }`}
          >
            Capitals Quiz
          </button>
          <button
            onClick={() => setMode("flags")}
            className={`px-4 py-2 rounded ${
              mode === "flags" ? "bg-blue-500 text-white" : "bg-gray-700 text-white"
            }`}
          >
            Flags Quiz
          </button>
        </div>

        {mode === "capitals" && <CapitalsQuiz />}
        {mode === "flags" && <FlagsQuiz />}
      </div>
    </div>
  )
}

export default App
