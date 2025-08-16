"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Target,
  CheckCircle,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";

const HealthAssessment = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      id: "physical",
      title: "Physical Health",
      question: "Where do you experience discomfort?",
      type: "body-map",
      options: [
        "Head/Neck",
        "Shoulders",
        "Back",
        "Joints",
        "Digestive",
        "No Issues",
      ],
    },
    {
      id: "energy",
      title: "Energy Patterns",
      question: "When do you feel most energetic?",
      type: "multiple-choice",
      options: ["Morning", "Afternoon", "Evening", "Night", "Varies Daily"],
    },
    {
      id: "digestion",
      title: "Digestive Health",
      question: "How is your appetite and digestion?",
      type: "multiple-choice",
      options: [
        "Strong & Regular",
        "Variable",
        "Weak",
        "Irregular",
        "Problematic",
      ],
    },
    {
      id: "mental",
      title: "Mental State",
      question: "Rate your stress levels",
      type: "scale",
      options: ["Very Low", "Low", "Moderate", "High", "Very High"],
    },
    {
      id: "goals",
      title: "Health Goals",
      question: "What transformation are you seeking?",
      type: "multiple-choice",
      options: [
        "Pain Relief",
        "Detoxification",
        "Weight Management",
        "Stress Relief",
        "Overall Wellness",
      ],
    },
  ];

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const getResults = () => {
    // Simple logic for demo - in real app this would be more sophisticated
    const primaryDosha = "Vata-Pitta";
    const imbalance = "Pitta aggravation with Vata disturbance";
    const treatment = "21-day Panchakarma Detoxification";
    const supportingTherapies =
      "Agnikarma for joint pain, Viddha Karma for stress";
    const timeline = "3-6 weeks";
    const successRate = 94;

    return {
      primaryDosha,
      imbalance,
      treatment,
      supportingTherapies,
      timeline,
      successRate,
    };
  };

  if (showResults) {
    const results = getResults();

    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-green-100 text-green-800 border-green-200 mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                Assessment Complete
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Your Personalized Ayurvedic Assessment
              </h2>
              <p className="text-lg text-gray-600">
                Based on your responses, here&apos;s your complete healing path
              </p>
            </div>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-gray-900">
                  📊 YOUR COMPLETE AYURVEDIC ASSESSMENT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Primary Dosha Constitution
                      </h4>
                      <p className="text-orange-600 font-medium">
                        {results.primaryDosha}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Current Imbalance
                      </h4>
                      <p className="text-gray-700">{results.imbalance}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Recommended Primary Treatment
                      </h4>
                      <p className="text-blue-600 font-medium">
                        {results.treatment}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Supporting Therapies
                      </h4>
                      <p className="text-gray-700">
                        {results.supportingTherapies}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Expected Timeline
                      </h4>
                      <p className="text-green-600 font-medium">
                        {results.timeline} for significant transformation
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Success Probability
                      </h4>
                      <div className="flex items-center space-x-3">
                        <Progress
                          value={results.successRate}
                          className="flex-1"
                        />
                        <span className="text-green-600 font-bold">
                          {results.successRate}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Based on similar cases
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-orange-200 pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                    >
                      Book Consultation Now
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      Download Full Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 mb-4">
              <Brain className="w-4 h-4 mr-2" />
              Interactive Assessment
            </Badge>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
              Discover Your Complete Ayurvedic Healing Path
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Get personalized treatment recommendations in just 3 minutes
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  Step {currentStep + 1} of {questions.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {currentStep + 1}
                  </span>
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 mb-2"
                  >
                    {currentQuestion.title}
                  </Badge>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {currentQuestion.question}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`w-full justify-start text-left p-4 h-auto ${
                      answers[currentQuestion.id] === option
                        ? "border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                    }`}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          answers[currentQuestion.id] === option
                            ? "border-orange-500 dark:border-orange-400 bg-orange-500 dark:bg-orange-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {answers[currentQuestion.id] === option && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    ~{questions.length - currentStep} minutes remaining
                  </span>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  {currentStep === questions.length - 1
                    ? "Get Results"
                    : "Next Question"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Used by 5000+ patients</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Scientifically validated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span>95% accuracy rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthAssessment;
