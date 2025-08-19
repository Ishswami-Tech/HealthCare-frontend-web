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
import { useTranslation } from "@/lib/i18n/context";

const HealthAssessment = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const questions = [
    {
      id: "physical",
      title: t("healthAssessment.questions.physical.title"),
      question: t("healthAssessment.questions.physical.question"),
      type: "body-map",
      options: [
        t("healthAssessment.questions.physical.options.headNeck"),
        t("healthAssessment.questions.physical.options.shoulders"),
        t("healthAssessment.questions.physical.options.back"),
        t("healthAssessment.questions.physical.options.joints"),
        t("healthAssessment.questions.physical.options.digestive"),
        t("healthAssessment.questions.physical.options.noIssues"),
      ],
    },
    {
      id: "energy",
      title: t("healthAssessment.questions.energy.title"),
      question: t("healthAssessment.questions.energy.question"),
      type: "multiple-choice",
      options: [
        t("healthAssessment.questions.energy.options.morning"),
        t("healthAssessment.questions.energy.options.afternoon"),
        t("healthAssessment.questions.energy.options.evening"),
        t("healthAssessment.questions.energy.options.night"),
        t("healthAssessment.questions.energy.options.variesDaily"),
      ],
    },
    {
      id: "digestion",
      title: t("healthAssessment.questions.digestion.title"),
      question: t("healthAssessment.questions.digestion.question"),
      type: "multiple-choice",
      options: [
        t("healthAssessment.questions.digestion.options.strongRegular"),
        t("healthAssessment.questions.digestion.options.variable"),
        t("healthAssessment.questions.digestion.options.weak"),
        t("healthAssessment.questions.digestion.options.irregular"),
        t("healthAssessment.questions.digestion.options.problematic"),
      ],
    },
    {
      id: "mental",
      title: t("healthAssessment.questions.mental.title"),
      question: t("healthAssessment.questions.mental.question"),
      type: "scale",
      options: [
        t("healthAssessment.questions.mental.options.veryLow"),
        t("healthAssessment.questions.mental.options.low"),
        t("healthAssessment.questions.mental.options.moderate"),
        t("healthAssessment.questions.mental.options.high"),
        t("healthAssessment.questions.mental.options.veryHigh"),
      ],
    },
    {
      id: "goals",
      title: t("healthAssessment.questions.goals.title"),
      question: t("healthAssessment.questions.goals.question"),
      type: "multiple-choice",
      options: [
        t("healthAssessment.questions.goals.options.painRelief"),
        t("healthAssessment.questions.goals.options.detoxification"),
        t("healthAssessment.questions.goals.options.weightManagement"),
        t("healthAssessment.questions.goals.options.stressRelief"),
        t("healthAssessment.questions.goals.options.overallWellness"),
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
    const primaryDosha = t("healthAssessment.results.primaryDosha");
    const imbalance = t("healthAssessment.results.imbalance");
    const treatment = t("healthAssessment.results.treatment");
    const supportingTherapies = t(
      "healthAssessment.results.supportingTherapies"
    );
    const timeline = t("healthAssessment.results.timeline");
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
                {t("healthAssessment.results.assessmentComplete")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                {t("healthAssessment.results.title")}
              </h2>
              <p className="text-lg text-gray-600">
                {t("healthAssessment.results.subtitle")}
              </p>
            </div>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-gray-900">
                  📊 {t("healthAssessment.results.cardTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("healthAssessment.results.primaryDosha")}
                    </h4>
                    <p className="text-orange-600 font-medium">
                      {results.primaryDosha}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("healthAssessment.results.currentImbalance")}
                    </h4>
                    <p className="text-gray-700">{results.imbalance}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("healthAssessment.results.recommendedTreatment")}
                    </h4>
                    <p className="text-blue-600 font-medium">
                      {results.treatment}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("healthAssessment.results.supportingTherapies")}
                    </h4>
                    <p className="text-gray-700">
                      {results.supportingTherapies}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("healthAssessment.results.expectedTimeline")}
                    </h4>
                    <p className="text-green-600 font-medium">
                      {results.timeline}{" "}
                      {t("healthAssessment.results.timelineText")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("healthAssessment.results.successProbability")}
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${results.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {results.successRate}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t("healthAssessment.results.basedOnCases")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                  >
                    {t("healthAssessment.results.bookConsultation")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    {t("healthAssessment.results.downloadReport")}
                  </Button>
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

  // Early return if no current question (shouldn't happen but TypeScript safety)
  if (!currentQuestion) {
    return (
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Loading assessment...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 mb-4">
              <Brain className="w-4 h-4 mr-2" />
              {t("healthAssessment.main.interactiveAssessment")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
              {t("healthAssessment.main.title")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t("healthAssessment.main.subtitle")}
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  {t("healthAssessment.main.step")} {currentStep + 1}{" "}
                  {t("healthAssessment.main.of")} {questions.length}
                </span>
                <span>
                  {Math.round(progress)}% {t("healthAssessment.main.complete")}
                </span>
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
                    ~{questions.length - currentStep}{" "}
                    {t("healthAssessment.main.minutesRemaining")}
                  </span>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  {currentStep === questions.length - 1
                    ? t("healthAssessment.main.getResults")
                    : t("healthAssessment.main.nextQuestion")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>
                {t("healthAssessment.trustIndicators.usedByPatients")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>
                {t("healthAssessment.trustIndicators.scientificallyValidated")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span>{t("healthAssessment.trustIndicators.accuracyRate")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthAssessment;
