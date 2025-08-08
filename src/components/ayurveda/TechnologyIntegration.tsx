"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Brain, 
  Activity, 
  Video,
  Bell,
  Calendar,
  BookOpen,
  Users,
  Shield,
  Zap,
  Heart,
  Clock,
  Target,
  TrendingUp,
  MessageCircle,
  Camera,
  Wifi,
  Database
} from 'lucide-react';

const TechnologyIntegration = () => {
  const [activeTab, setActiveTab] = useState('ai');

  const aiFeatures = [
    {
      title: '24/7 Symptom Analysis',
      description: 'AI-powered preliminary health assessment with instant recommendations',
      icon: Brain,
      color: 'from-blue-500 to-cyan-600',
      accuracy: 94
    },
    {
      title: 'Treatment Recommendations',
      description: 'Personalized therapy suggestions based on symptoms and medical history',
      icon: Target,
      color: 'from-green-500 to-emerald-600',
      accuracy: 91
    },
    {
      title: 'Appointment Optimization',
      description: 'Smart scheduling based on condition urgency and doctor availability',
      icon: Calendar,
      color: 'from-orange-500 to-red-600',
      accuracy: 98
    },
    {
      title: 'Progress Prediction',
      description: 'Expected outcome timelines with confidence intervals',
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-600',
      accuracy: 89
    }
  ];

  const digitalHealthFeatures = [
    {
      title: 'Wearable Integration',
      description: 'Smartwatch and fitness tracker connectivity for continuous monitoring',
      icon: Activity,
      metrics: ['Heart Rate', 'Sleep Quality', 'Activity Levels', 'Stress Indicators']
    },
    {
      title: 'Real-time Tracking',
      description: 'Continuous health parameter monitoring with instant alerts',
      icon: Heart,
      metrics: ['Blood Pressure', 'Pulse Rate', 'Temperature', 'Oxygen Levels']
    },
    {
      title: 'Smart Notifications',
      description: 'Medication reminders and personalized lifestyle guidance',
      icon: Bell,
      metrics: ['Medicine Alerts', 'Exercise Reminders', 'Diet Suggestions', 'Appointment Alerts']
    },
    {
      title: 'Telehealth Platform',
      description: 'Secure video consultations and follow-ups with doctors',
      icon: Video,
      metrics: ['HD Video Calls', 'Screen Sharing', 'Digital Prescriptions', 'Report Sharing']
    }
  ];

  const mobileAppFeatures = [
    {
      category: 'Health Management',
      features: [
        'Personal Health Dashboard',
        'Complete Medical History',
        'Treatment Progress Tracking',
        'Symptom Diary with Photos'
      ],
      icon: Smartphone,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      category: 'Appointment System',
      features: [
        'Easy Booking & Rescheduling',
        'Smart Reminder System',
        'Queue Management',
        'Doctor Availability'
      ],
      icon: Calendar,
      color: 'from-green-500 to-emerald-600'
    },
    {
      category: 'Education & Community',
      features: [
        'Personalized Learning Content',
        'Patient Support Groups',
        'Success Story Sharing',
        'Ayurvedic Knowledge Base'
      ],
      icon: BookOpen,
      color: 'from-orange-500 to-red-600'
    },
    {
      category: 'Emergency Support',
      features: [
        'Instant Consultation Request',
        'Emergency Contact System',
        'Location-based Services',
        'Critical Alert System'
      ],
      icon: Shield,
      color: 'from-red-500 to-pink-600'
    }
  ];

  const tabs = [
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'monitoring', label: 'Health Monitoring', icon: Activity },
    { id: 'mobile', label: 'Mobile App', icon: Smartphone },
    { id: 'future', label: 'Future Tech', icon: Zap }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-6">
              <Brain className="w-4 h-4 mr-2" />
              Advanced Technology Integration
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-6">
              AI-Powered Healthcare Solutions for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Personalized Healing
              </span>
            </h2>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Experience the future of Ayurvedic healthcare with cutting-edge technology 
              that enhances traditional healing wisdom for optimal patient outcomes.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Zap className="w-4 h-4 mr-2" />
                AI-Powered Diagnosis
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Activity className="w-4 h-4 mr-2" />
                Real-time Monitoring
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile Health Platform
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Tabs */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    className={`${
                      activeTab === tab.id 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-blue-50"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* AI Assistant Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Intelligent Virtual Doctor Assistant
                  </h3>
                  <p className="text-lg text-gray-600">
                    24/7 AI-powered healthcare support with human-level understanding
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {aiFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    
                    return (
                      <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                        <CardHeader>
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg text-gray-900">{feature.title}</CardTitle>
                              <Badge className="bg-green-100 text-green-800 mt-1">
                                {feature.accuracy}% Accuracy
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4">{feature.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">AI Accuracy</span>
                            <span className="text-sm font-bold text-green-600">{feature.accuracy}%</span>
                          </div>
                          <Progress value={feature.accuracy} className="h-2 mt-2" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Health Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Digital Health Monitoring Platform
                  </h3>
                  <p className="text-lg text-gray-600">
                    Continuous health tracking with real-time insights and alerts
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {digitalHealthFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    
                    return (
                      <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-white">
                        <CardHeader>
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-gray-900">{feature.title}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-4">{feature.description}</p>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Monitored Parameters:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {feature.metrics.map((metric, metricIndex) => (
                                <div key={metricIndex} className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm text-gray-700">{metric}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile App Tab */}
            {activeTab === 'mobile' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Comprehensive Mobile Health Platform
                  </h3>
                  <p className="text-lg text-gray-600">
                    Your complete healthcare companion in your pocket
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {mobileAppFeatures.map((category, index) => {
                    const IconComponent = category.icon;
                    
                    return (
                      <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-white">
                        <CardHeader>
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-lg text-gray-900">{category.category}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {category.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* App Download CTA */}
                <div className="mt-12">
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-8 text-center">
                      <Smartphone className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <h4 className="text-xl font-bold text-gray-900 mb-4">
                        Download Our Mobile App
                      </h4>
                      <p className="text-gray-700 mb-6">
                        Get instant access to all features and start your digital health journey today
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          Download for iOS
                        </Button>
                        <Button variant="outline" className="border-blue-300 text-blue-600">
                          Download for Android
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Future Technology Tab */}
            {activeTab === 'future' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Future Technology Pipeline
                  </h3>
                  <p className="text-lg text-gray-600">
                    Upcoming innovations in Ayurvedic healthcare technology
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50">
                    <CardContent className="p-8">
                      <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        AI Diagnosis System
                      </h4>
                      <p className="text-gray-700 mb-4">
                        Machine learning for precise dosha assessment and treatment recommendations
                      </p>
                      <Badge className="bg-blue-100 text-blue-800">Coming 2025</Badge>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50">
                    <CardContent className="p-8">
                      <Database className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        Precision Ayurveda
                      </h4>
                      <p className="text-gray-700 mb-4">
                        Genomics-based personalized treatment protocols for optimal outcomes
                      </p>
                      <Badge className="bg-green-100 text-green-800">Coming 2026</Badge>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50">
                    <CardContent className="p-8">
                      <Camera className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-gray-900 mb-2">
                        VR Training Platform
                      </h4>
                      <p className="text-gray-700 mb-4">
                        Immersive virtual reality education for medical students and practitioners
                      </p>
                      <Badge className="bg-purple-100 text-purple-800">Coming 2027</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechnologyIntegration;
