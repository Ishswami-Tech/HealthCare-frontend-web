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
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("healthAssessment.results.assessmentComplete")}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
                {t("healthAssessment.results.title")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("healthAssessment.results.subtitle")}
              </p>
            </div>

            <Card className="bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-card-foreground">
                  📊 {t("healthAssessment.results.cardTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">
                      {t("healthAssessment.results.primaryDosha")}
                    </h4>
                    <p className="text-primary font-medium">
                      {results.primaryDosha}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">
                      {t("healthAssessment.results.currentImbalance")}
                    </h4>
                    <p className="text-muted-foreground">{results.imbalance}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">
                      {t("healthAssessment.results.recommendedTreatment")}
                    </h4>
                    <p className="text-primary font-medium">
                      {results.treatment}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">
                      {t("healthAssessment.results.supportingTherapies")}
                    </h4>
                    <p className="text-muted-foreground">
                      {results.supportingTherapies}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">
                      {t("healthAssessment.results.expectedTimeline")}
                    </h4>
                    <p className="text-primary font-medium">
                      {results.timeline}{" "}
                      {t("healthAssessment.results.timelineText")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-card-foreground mb-2">
                      {t("healthAssessment.results.successProbability")}
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${results.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {results.successRate}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("healthAssessment.results.basedOnCases")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {t("healthAssessment.results.bookConsultation")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-primary text-primary hover:bg-primary/10"
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
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-muted-foreground">
              Loading assessment...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Brain className="w-4 h-4 mr-2" />
              {t("healthAssessment.main.interactiveAssessment")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
              {t("healthAssessment.main.title")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("healthAssessment.main.subtitle")}
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
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

          <Card className="bg-card shadow-xl border-0">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">
                    {currentStep + 1}
                  </span>
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/20 mb-2"
                  >
                    {currentQuestion.title}
                  </Badge>
                  <CardTitle className="text-xl text-card-foreground">
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
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          answers[currentQuestion.id] === option
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {answers[currentQuestion.id] === option && (
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </Button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    ~{questions.length - currentStep}{" "}
                    {t("healthAssessment.main.minutesRemaining")}
                  </span>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-primary" />
              <span>
                {t("healthAssessment.trustIndicators.usedByPatients")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>
                {t("healthAssessment.trustIndicators.scientificallyValidated")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-primary" />
              <span>{t("healthAssessment.trustIndicators.accuracyRate")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthAssessment;
