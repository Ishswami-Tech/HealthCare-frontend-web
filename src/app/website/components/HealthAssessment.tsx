"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Question {
  id: string;
  text: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: "body-type",
    text: "How would you describe your body frame?",
    options: [
      "Thin and lean, difficulty gaining weight",
      "Medium build, good muscle tone",
      "Large frame, gains weight easily",
    ],
  },
  {
    id: "digestion",
    text: "How would you describe your digestion?",
    options: [
      "Variable, irregular appetite",
      "Strong appetite, good digestion",
      "Slow digestion, feel heavy after meals",
    ],
  },
  {
    id: "sleep",
    text: "How is your sleep pattern?",
    options: [
      "Light sleep, tendency to wake up",
      "Moderate sleep, wake up refreshed",
      "Deep sleep, difficulty waking up",
    ],
  },
  {
    id: "stress",
    text: "How do you typically handle stress?",
    options: [
      "Anxiety, worry easily",
      "Get irritated or impatient",
      "Calm, take time to react",
    ],
  },
  {
    id: "climate",
    text: "Which climate suits you best?",
    options: [
      "Prefer warm weather",
      "Prefer cool weather",
      "Adapt well to any climate",
    ],
  },
];

export const HealthAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const getDosha = () => {
    const scores = [0, 0, 0]; // [vata, pitta, kapha]
    Object.values(answers).forEach((answer) => {
      scores[answer]++;
    });
    const maxScore = Math.max(...scores);
    const dominantDoshas = scores
      .map((score, index) => ({ score, dosha: index }))
      .filter((item) => item.score === maxScore)
      .map((item) =>
        item.dosha === 0 ? "Vata" : item.dosha === 1 ? "Pitta" : "Kapha"
      );
    return dominantDoshas.join("-");
  };

  return (
    <section className="py-24 bg-gradient-to-br from-neutral-900 to-primary-900/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-primary-300">
            Discover Your Dosha Type
          </h2>
          <p className="section-subtitle">
            Take our quick assessment to understand your unique body
            constitution and receive personalized wellness recommendations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div></div>

          <div className="card">
            {!showResults ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Question {currentQuestion + 1} of {questions.length}
                  </h3>
                  <span className="text-sm text-neutral-400">
                    {Math.round(
                      ((currentQuestion + 1) / questions.length) * 100
                    )}
                    % Complete
                  </span>
                </div>

                <div className="relative h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 bg-primary-500"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${
                        ((currentQuestion + 1) / questions.length) * 100
                      }%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div>
                  <h4 className="text-xl text-white mb-6">
                    {questions[currentQuestion].text}
                  </h4>
                  <div className="space-y-4">
                    {questions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleAnswer(questions[currentQuestion].id, index)
                        }
                        className="w-full text-left p-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-medium text-white mb-4">
                  Your Dominant Dosha: {getDosha()}
                </h3>
                <p className="text-neutral-400 mb-8">
                  Understanding your dosha type is the first step towards
                  achieving balance and optimal health through Ayurveda.
                </p>
                <div className="space-y-4">
                  <a href="#contact" className="btn btn-primary w-full">
                    Book a Consultation
                  </a>
                  <button
                    onClick={resetQuiz}
                    className="btn btn-outline w-full"
                  >
                    Retake Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
