"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Award,
  BookOpen,
  Users,
  Star,
  CheckCircle,
  GraduationCap,
  Globe,
  Calendar,
} from "lucide-react";

import { YouTubeVideoGrid } from "@/components/media/youtube-video";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function TeamPage() {
  const t = useTranslations();

  // Sample videos for demonstration
  const sampleVideos = [
    {
      id: "1",
      videoId: "dQw4w9WgXcQ", // Sample YouTube video ID
      title: t("team.videos.panchakarma.title"),
      description: t("team.videos.panchakarma.description"),
    },
    {
      id: "2",
      videoId: "dQw4w9WgXcQ",
      title: t("team.videos.viddhakarma.title"),
      description: t("team.videos.viddhakarma.description"),
    },
    {
      id: "3",
      videoId: "dQw4w9WgXcQ",
      title: t("team.videos.agnikarma.title"),
      description: t("team.videos.agnikarma.description"),
    },
  ];

  const chiefMedicalOfficers = [
    {
      name: t("team.teamMembers.drDeshmukh.name"),
      title: t("team.teamMembers.drDeshmukh.title"),
      specialization: t("team.teamMembers.drDeshmukh.specialization"),
      experience: t("team.teamMembers.drDeshmukh.experience"),
      image: "/api/placeholder/150/150",
      credentials: t("team.teamMembers.drDeshmukh.credentials"),
      achievements: t("team.teamMembers.drDeshmukh.achievements"),
      color: "from-blue-500 to-cyan-600",
    },
    {
      name: t("team.teamMembers.vaidyaKrishnamurthy.name"),
      title: t("team.teamMembers.vaidyaKrishnamurthy.title"),
      specialization: t("team.teamMembers.vaidyaKrishnamurthy.specialization"),
      experience: t("team.teamMembers.vaidyaKrishnamurthy.experience"),
      image: "/api/placeholder/150/150",
      credentials: t("team.teamMembers.vaidyaKrishnamurthy.credentials"),
      achievements: t("team.teamMembers.vaidyaKrishnamurthy.achievements"),
      color: "from-orange-500 to-red-600",
    },
    {
      name: t("team.teamMembers.drPriyaSharma.name"),
      title: t("team.teamMembers.drPriyaSharma.title"),
      specialization: t("team.teamMembers.drPriyaSharma.specialization"),
      experience: t("team.teamMembers.drPriyaSharma.experience"),
      image: "/api/placeholder/150/150",
      credentials: t("team.teamMembers.drPriyaSharma.credentials"),
      achievements: t("team.teamMembers.drPriyaSharma.achievements"),
      color: "from-purple-500 to-indigo-600",
    },
    {
      name: "Dr. Sunita Patel",
      title: "Women's Health & Fertility Expert",
      specialization: "Reproductive Health Specialist",
      experience: "15+ years",
      image: "/api/placeholder/150/150",
      credentials: ["BAMS", "Fertility Specialist", "Hormonal Balance Expert"],
      achievements: [
        "500+ successful pregnancies",
        "PCOD treatment expert",
        "Women wellness advocate",
      ],
      color: "from-pink-500 to-rose-600",
    },
  ];

  const advisoryBoard = [
    {
      name: "Dr. Ashok Kumar",
      title: "Retired AIIMS Professor",
      role: "Modern Medicine Integration",
      expertise: "Bridging Ayurveda with modern medicine",
    },
    {
      name: "Dr. Meera Joshi",
      title: "Government Ayurveda College Principal",
      role: "Academic Excellence",
      expertise: "Educational standards and curriculum development",
    },
    {
      name: "Dr. James Wilson",
      title: "International Ayurveda Expert",
      role: "Global Best Practices",
      expertise: "International standards and protocols",
    },
    {
      name: "Dr. Ravi Gupta",
      title: "Research Director",
      role: "Clinical Studies & Innovation",
      expertise: "Scientific validation and research methodology",
    },
  ];

  const teamStats = [
    {
      number: t("team.teamStats.experience.value"),
      label: t("team.teamStats.experience.label"),
      icon: Calendar,
    },
    {
      number: t("team.teamStats.patients.value"),
      label: t("team.teamStats.patients.label"),
      icon: Users,
    },
    {
      number: t("team.teamStats.publications.value"),
      label: t("team.teamStats.publications.label"),
      icon: BookOpen,
    },
    {
      number: t("team.teamStats.conferences.value"),
      label: t("team.teamStats.conferences.label"),
      icon: Globe,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-6">
              <Users className="w-4 h-4 mr-2" />
              {t("team.badge")}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-6">
              {t("team.title")}
            </h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              {t("team.description")}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                Government Certified
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Award className="w-4 h-4 mr-2" />
                Published Researchers
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                <GraduationCap className="w-4 h-4 mr-2" />
                Certified Teachers
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {teamStats.map((stat, index) => {
                const IconComponent = stat.icon;

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
                  >
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {stat.number}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Chief Medical Officers */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Chief Medical Officers
              </h2>
              <p className="text-lg text-gray-600">
                Leading experts in their respective specializations
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {chiefMedicalOfficers.map((doctor, index) => (
                <Card
                  key={index}
                  className="bg-white shadow-xl border-0 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-3">
                      <div
                        className={`bg-gradient-to-br ${doctor.color} text-white p-6 flex flex-col justify-center items-center`}
                      >
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
                          <User className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold mb-1">
                            {doctor.experience}
                          </div>
                          <div className="text-sm opacity-90">Experience</div>
                        </div>
                      </div>

                      <div className="md:col-span-2 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {doctor.name}
                        </h3>
                        <p className="text-gray-600 mb-2">{doctor.title}</p>
                        <Badge className="bg-blue-100 text-blue-800 mb-4">
                          {doctor.specialization}
                        </Badge>

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Credentials:
                            </h4>
                            <ul className="space-y-1">
                              {doctor.credentials.map(
                                (credential, credIndex) => (
                                  <li
                                    key={credIndex}
                                    className="flex items-center space-x-2"
                                  >
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    <span className="text-sm text-gray-700">
                                      {credential}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Key Achievements:
                            </h4>
                            <ul className="space-y-1">
                              {doctor.achievements.map(
                                (achievement, achIndex) => (
                                  <li
                                    key={achIndex}
                                    className="flex items-center space-x-2"
                                  >
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-sm text-gray-700">
                                      {achievement}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Medical Advisory Board */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Medical Advisory Board
              </h2>
              <p className="text-lg text-gray-600">
                Distinguished experts guiding our clinical excellence and
                research initiatives
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {advisoryBoard.map((advisor, index) => (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow duration-300 border border-gray-100"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">
                          {advisor.name}
                        </CardTitle>
                        <p className="text-gray-600">{advisor.title}</p>
                        <Badge className="bg-blue-100 text-blue-800 mt-1">
                          {advisor.role}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{advisor.expertise}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Consult with Our Expert Team
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Get personalized treatment recommendations from our world-class
              medical team. Your healing journey begins with expert guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8"
              >
                Book Expert Consultation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Schedule Team Meeting
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>150+ Years Combined Experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Published Researchers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>International Recognition</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Demonstration Videos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Treatment Demonstrations
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Watch Dr. Chandrakumar Deshmukh demonstrate various Ayurvedic
              treatments and explain their benefits for different health
              conditions.
            </p>
          </div>
          <YouTubeVideoGrid
            videos={sampleVideos}
            columns={3}
            aspectRatio="16:9"
          />
        </div>
      </section>
    </div>
  );
}
