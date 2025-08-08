"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Droplets, 
  CheckCircle, 
  Clock, 
  Star,
  ArrowRight,
  Heart,
  Brain,
  Leaf,
  Shield,
  Target,
  Users,
  Award
} from 'lucide-react';

export default function PanchakarmaPage() {
  const phases = [
    {
      name: 'Purva Karma',
      subtitle: 'Preparation Phase',
      duration: 'Days 1-7',
      color: 'from-blue-500 to-cyan-600',
      activities: [
        'Detailed consultation & pulse diagnosis',
        'Abhyanga (Synchronized oil massage)',
        'Swedana (Herbal steam therapy)',
        'Dietary preparation and mental readiness'
      ]
    },
    {
      name: 'Pradhana Karma',
      subtitle: 'Main Procedures',
      duration: 'Days 8-14',
      color: 'from-orange-500 to-red-600',
      activities: [
        'Customized detoxification protocols',
        'Expert monitoring throughout process',
        'Daily assessment and adjustments',
        'Gentle, natural elimination methods'
      ]
    },
    {
      name: 'Paschat Karma',
      subtitle: 'Post-Treatment Care',
      duration: 'Days 15-21',
      color: 'from-green-500 to-emerald-600',
      activities: [
        'Gradual lifestyle reintegration',
        'Rejuvenative therapies (Rasayana)',
        'Long-term wellness planning',
        'Follow-up consultations'
      ]
    }
  ];

  const conditions = [
    { category: 'Chronic Diseases', items: ['Diabetes', 'Hypertension', 'Arthritis', 'Autoimmune disorders'], successRate: 92 },
    { category: 'Digestive Disorders', items: ['IBS', 'Chronic constipation', 'Liver diseases', 'Acidity'], successRate: 95 },
    { category: 'Skin Conditions', items: ['Eczema', 'Psoriasis', 'Chronic allergies', 'Dermatitis'], successRate: 88 },
    { category: 'Mental Health', items: ['Stress', 'Anxiety', 'Depression', 'Insomnia'], successRate: 90 },
    { category: 'Respiratory Issues', items: ['Asthma', 'Bronchitis', 'Chronic cough', 'Allergies'], successRate: 87 },
    { category: 'Hormonal Imbalances', items: ['PCOD', 'Thyroid disorders', 'Fertility issues'], successRate: 89 }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-6">
              <Droplets className="w-4 h-4 mr-2" />
              Panchakarma - The Ultimate Detoxification
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-6">
              Complete Body-Mind-Soul{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                Purification & Rejuvenation
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Experience the most comprehensive detoxification system known to humanity. 
              5000-year-old science meets modern wellness protocols for complete transformation.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                95% Success Rate
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Users className="w-4 h-4 mr-2" />
                2000+ Patients Treated
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Award className="w-4 h-4 mr-2" />
                Scientifically Validated
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-lg px-8"
              >
                Book 21-Day Program
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 text-lg px-8"
              >
                Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What is Panchakarma */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-6">
                  What is Panchakarma?
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Ancient Science</h3>
                      <p className="text-gray-700">5000-year-old complete detoxification system rooted in Ayurvedic wisdom</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Five Sacred Procedures</h3>
                      <p className="text-gray-700">Vamana, Virechana, Basti, Nasya, Raktamokshana - each targeting specific toxins</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Holistic Approach</h3>
                      <p className="text-gray-700">Treats root cause, not just symptoms, for lasting transformation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Modern Application</h3>
                      <p className="text-gray-700">Scientifically validated wellness protocols adapted for contemporary lifestyle</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Droplets className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Complete Transformation
                      </h3>
                      <p className="text-gray-700 mb-6">
                        Experience the most comprehensive healing system that addresses physical, 
                        mental, and spiritual well-being simultaneously.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">21</div>
                          <div className="text-sm text-gray-600">Days Program</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">95%</div>
                          <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Comprehensive Panchakarma Process
              </h2>
              <p className="text-lg text-gray-600">
                A carefully structured 21-day journey to complete wellness
              </p>
            </div>

            <div className="space-y-8">
              {phases.map((phase, index) => (
                <Card key={index} className="bg-white shadow-lg border-0 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid lg:grid-cols-3">
                      <div className={`bg-gradient-to-br ${phase.color} text-white p-8 flex flex-col justify-center`}>
                        <div className="text-center lg:text-left">
                          <div className="text-3xl font-bold mb-2">{index + 1}</div>
                          <h3 className="text-2xl font-playfair font-bold mb-2">{phase.name}</h3>
                          <p className="text-lg opacity-90 mb-4">{phase.subtitle}</p>
                          <Badge className="bg-white/20 text-white border-white/30">
                            <Clock className="w-4 h-4 mr-2" />
                            {phase.duration}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-2 p-8">
                        <h4 className="font-semibold text-gray-900 mb-4">Key Activities:</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {phase.activities.map((activity, actIndex) => (
                            <div key={actIndex} className="flex items-start space-x-3">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{activity}</span>
                            </div>
                          ))}
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

      {/* Conditions Treated */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Conditions Transformed Through Panchakarma
              </h2>
              <p className="text-lg text-gray-600">
                Comprehensive healing for a wide range of health challenges
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conditions.map((condition, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 flex items-center justify-between">
                      {condition.category}
                      <Badge className="bg-green-100 text-green-800">
                        {condition.successRate}% Success
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {condition.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Ready to Begin Your Transformation?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands who have experienced complete healing through authentic Panchakarma. 
              Start your 21-day journey to optimal health today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8"
              >
                Book 21-Day Program
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Free Consultation
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>95% Success Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>2000+ Patients Treated</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Government Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
