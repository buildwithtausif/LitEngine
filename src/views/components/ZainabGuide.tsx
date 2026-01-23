import { useEffect, useState } from "react";
import { useTutorial } from "../contexts/TutorialContext";
import {
  ChevronRight,
  CheckCircle,
  Minimize2,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import zainabImg from "../assets/zainab-3d.png";

const ZainabGuide = () => {
  const { isActive, currentStep, setStep, toggleTutorial } = useTutorial();
  const navigate = useNavigate();
  const [minimized, setMinimized] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-minimize interaction
  useEffect(() => {
    // Start maximized to introduce, but allow user control
  }, [isActive]);

  // Auto-dismiss confetti
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (!isActive) return null;

  // --- Gamified Quest Steps ---
  const quests = {
    welcome: {
      level: 1,
      title: "New Beginnings",
      msg: "Hi! I'm Zainab. Welcome to LitEngine! 🌸 Let's turn this empty space into a thriving library. Ready to plant the first seed?",
      actionLabel: "Let's Grow!",
      action: () => {
        setStep("members");
        navigate("/members");
      },
    },
    members: {
      level: 2,
      title: "The Reader",
      msg: "A library needs life! Go to the 'Members' section and register your first patron. They are the roots of our garden.",
      actionLabel: "I Added One!",
      action: () => {
        setStep("books");
        navigate("/add-books");
      },
    },
    books: {
      level: 3,
      title: "The Story",
      msg: "Now for the books! 🌱 Use the form to add a new title. Tip: If you set the 'Stock' number here, we handle the inventory automatically!",
      actionLabel: "Books Added!",
      action: () => {
        setStep("inventory");
        navigate("/inventory");
      },
    },
    inventory: {
      level: 4,
      title: "The Harvest",
      msg: "See that? The Inventory tracks your physical copies separately. It's like managing the fruit on the tree versus the tree itself.",
      actionLabel: "Understood",
      action: () => {
        setStep("checkout");
        navigate("/checkout");
      },
    },
    checkout: {
      level: 5,
      title: "Blooming",
      msg: "The final step! Select your member and book to lend a copy. Watch the garden bloom as knowledge spreads!",
      actionLabel: "Complete!",
      action: () => {
        setStep("complete");
        setShowConfetti(true);
      },
    },
    complete: {
      level: 6,
      title: "Full Bloom! 🌺",
      msg: "You did it! Your library is officially open. I'll stick around in the header if you ever need a hand. Happy reading!",
      actionLabel: "Bye Zainab!",
      action: () => toggleTutorial(),
    },
  };

  const currentQuest = quests[currentStep as keyof typeof quests];

  // Progress Bar Calculation
  const progress =
    ((Object.keys(quests).indexOf(currentStep) + 1) /
      Object.keys(quests).length) *
    100;

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] transition-all duration-500 ease-in-out flex flex-col items-end ${
        minimized ? "translate-y-20" : ""
      }`}
    >
      {/* Minimized Toggle */}
      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="bg-white dark:bg-slate-800 text-purple-600 p-2 sm:p-3 rounded-full shadow-lg border-2 border-purple-200 hover:scale-110 transition-transform animate-bounce relative z-50 mb-16 sm:mb-20 mr-1 sm:mr-2"
        >
          <Sparkles size={20} className="sm:w-6 sm:h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping" />
        </button>
      )}

      {/* Main Container */}
      {!minimized && (
        <div className="relative flex flex-col items-end animate-in slide-in-from-right-10 duration-500">
          {/* Celebration Overlay (Auto-dismisses, No Blur) */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20" />
              <Trophy
                size={150}
                className="text-yellow-400 animate-bounce drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] relative z-10"
              />
            </div>
          )}

          {/* Speech Bubble */}
          <div className="mr-4 sm:mr-8 mb-3 sm:mb-4 relative max-w-[280px] sm:max-w-[300px] w-full origin-bottom-right animate-float">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl rounded-br-none shadow-2xl border border-slate-100 dark:border-slate-700 relative z-10">
              {/* Header / Level */}
              <div className="flex justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-500">
                  Level {currentQuest.level}
                </span>
                <button
                  onClick={() => setMinimized(true)}
                  className="text-slate-300 hover:text-slate-500 p-1"
                  aria-label="Minimize"
                >
                  <Minimize2 size={14} />
                </button>
              </div>

              {/* Message */}
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-1">
                {currentQuest.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                {currentQuest.msg}
              </p>

              {/* Action Button */}
              <button
                onClick={currentQuest.action}
                className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                <span>{currentQuest.actionLabel}</span>
                {currentStep === "complete" ? (
                  <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                ) : (
                  <ChevronRight
                    size={14}
                    className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform"
                  />
                )}
              </button>
            </div>

            {/* Bubble Tail */}
            <div className="absolute -bottom-2 right-0 w-6 h-6 bg-white dark:bg-slate-800 transform rotate-45 border-r border-b border-slate-100 dark:border-slate-700 z-0"></div>
          </div>

          {/* 3D Character Avatar (Responsive) */}
          <div
            className="relative mr-2 sm:mr-4 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => setShowConfetti(true)}
          >
            {/* Easter egg click */}
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
            {/* Image Container - Smaller on mobile */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden bg-white dark:bg-slate-800">
              <img
                src={zainabImg}
                alt="Zainab"
                className="w-full h-full object-cover object-center transform scale-110"
              />
            </div>
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none scale-125 sm:scale-[1.35] z-10">
              <circle
                cx="50%"
                cy="50%"
                r="46"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-slate-200 dark:text-slate-700"
              />
              <circle
                cx="50%"
                cy="50%"
                r="46"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-purple-500 transition-all duration-1000 ease-out"
                strokeDasharray="290"
                strokeDashoffset={290 - (290 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZainabGuide;
