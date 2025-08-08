"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  CheckCircle, 
  Clock, 
  Star,
  ArrowRight,
  Target,
  Zap,
  Shield,
  Award,
  Users,
  TrendingUp,
  Heart
} from 'lucide-react';

export default function AgnikarmaPage() {
  const processSteps = [
    {
      step: 1,
      title: 'Precise Diagnosis',
      description: 'Marma point identification + modern assessment',
      icon: Target,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      step: 2,
      title: 'Controlled Heat Application',
      description: 'Gold, silver, copper instruments at exact temperatures',
      icon: Flame,
      color: 'from-orange-500 to-red-600'
    },
    {
      step: 3,
      title: 'Immediate Pain Relief',
      description: 'Blocking pain signals and stimulating healing',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600'
    },
    {
      step: 4,
      title: 'Natural Healing',
      description: 'Activating body\'s repair mechanisms',
      icon: Heart,
      color: 'from-green-500 to-emerald-600'
    },
    {
      step: 5,
      title: 'Long-term Recovery',
      description: 'Strengthening tissues and preventing recurrence',
      icon: Shield,
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  const conditionsData = [
    { condition: 'Chronic Knee Pain', successRate: 95, avgSessions: '3-5 sessions', recoveryTime: '2-3 weeks', patientStory: 'Watch Rekha\'s Journey' },
    { condition: 'Sciatica', successRate: 92, avgSessions: '4-6 sessions', recoveryTime: '3-4 weeks', patientStory: 'Read Suresh\'s Recovery' },
    { condition: 'Frozen Shoulder', successRate: 88, avgSessions: '5-7 sessions', recoveryTime: '4-6 weeks', patientStory: 'See Priya\'s Movement' },
    { condition: 'Tennis Elbow', successRate: 94, avgSessions: '2-4 sessions', recoveryTime: '1-2 weeks', patientStory: 'Athlete Success Stories' },
    { condition: 'Plantar Fasciitis', successRate: 90, avgSessions: '3-5 sessions', recoveryTime: '2-3 weeks', patientStory: 'Back to Running' },
    { condition: 'Cervical Spondylosis', successRate: 87, avgSessions: '4-6 sessions', recoveryTime: '3-5 weeks', patientStory: 'Pain-Free Working' },
    { condition: 'Arthritis', successRate: 89, avgSessions: '6-8 sessions', recoveryTime: '4-6 weeks', patientStory: 'Dancing Again at 70' }
  ];

  const advantages = [
    {
      title: 'Instant Results',
      description: 'Pain relief felt immediately after first session',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600'
    },
    {
      title: 'Precision Targeting',
      description: 'Exact problem areas without affecting healthy tissue',
      icon: Target,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Zero Side Effects',
      description: 'No drugs, no invasive procedures, completely natural',
      icon: Shield,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Cost-Effective',
      description: 'One-time treatment vs. lifetime medication costs',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-6">
              <Flame className="w-4 h-4 mr-2" />
              Agnikarma - Therapeutic Heat Healing
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-6">
              Precision Fire Therapy for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Instant Pain Relief
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Experience the ancient art of therapeutic heat healing. Mentioned in Sushruta Samhita 
              5000+ years ago, now scientifically proven for immediate and lasting pain relief.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                92% Success Rate
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Zap className="w-4 h-4 mr-2" />
                Instant Relief
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Shield className="w-4 h-4 mr-2" />
                Zero Side Effects
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8"
              >
                Book Agnikarma Session
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 text-lg px-8"
              >
                Free Pain Assessment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Foundation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Scientific Foundation
              </h2>
              <p className="text-lg text-gray-600">
                Ancient wisdom validated by modern science
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Ancient Text Reference</h3>
                  <p className="text-sm text-gray-600">Mentioned in Sushruta Samhita 5000+ years ago</p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Modern Validation</h3>
                  <p className="text-sm text-gray-600">Scientifically proven pain relief mechanism</p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Precision Technology</h3>
                  <p className="text-sm text-gray-600">Controlled micro-cauterization for targeted healing</p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Zero Side Effects</h3>
                  <p className="text-sm text-gray-600">Completely natural, drug-free approach</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                How Agnikarma Works - Step-by-Step Process
              </h2>
              <p className="text-lg text-gray-600">
                Precision healing through controlled therapeutic heat application
              </p>
            </div>

            <div className="space-y-8">
              {processSteps.map((step, index) => {
                const IconComponent = step.icon;
                
                return (
                  <Card key={index} className="bg-white shadow-lg border-0 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid lg:grid-cols-4">
                        <div className={`bg-gradient-to-br ${step.color} text-white p-8 flex flex-col justify-center`}>
                          <div className="text-center lg:text-left">
                            <div className="text-4xl font-bold mb-2">{step.step}</div>
                            <IconComponent className="w-12 h-12 mx-auto lg:mx-0 mb-4" />
                          </div>
                        </div>
                        
                        <div className="lg:col-span-3 p-8 flex flex-col justify-center">
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                          <p className="text-lg text-gray-700 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Conditions & Success Rates */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Conditions Treated with Proven Success Rates
              </h2>
              <p className="text-lg text-gray-600">
                Real data from thousands of successful treatments
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid gap-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold">
                    <div>Condition</div>
                    <div className="text-center">Success Rate</div>
                    <div className="text-center">Avg Sessions</div>
                    <div className="text-center">Recovery Time</div>
                    <div className="text-center">Patient Stories</div>
                  </div>

                  {/* Table Rows */}
                  {conditionsData.map((item, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-5 gap-4 items-center">
                          <div className="font-semibold text-gray-900">{item.condition}</div>
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Progress value={item.successRate} className="w-16 h-2" />
                              <span className="font-bold text-green-600">{item.successRate}%</span>
                            </div>
                          </div>
                          <div className="text-center text-gray-700">{item.avgSessions}</div>
                          <div className="text-center text-gray-700">{item.recoveryTime}</div>
                          <div className="text-center">
                            <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                              {item.patientStory}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Agnikarma is Superior */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Why Agnikarma is Superior
              </h2>
              <p className="text-lg text-gray-600">
                Advantages over conventional pain management approaches
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {advantages.map((advantage, index) => {
                const IconComponent = advantage.icon;
                
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 bg-gradient-to-r ${advantage.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {advantage.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {advantage.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="mt-16">
              <Card className="bg-white shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-playfair font-bold text-center text-gray-900">
                    Treatment Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Treatment Method</th>
                          <th className="text-center py-4 px-4 font-semibold text-gray-900">Duration</th>
                          <th className="text-center py-4 px-4 font-semibold text-gray-900">Success Rate</th>
                          <th className="text-center py-4 px-4 font-semibold text-gray-900">Side Effects</th>
                          <th className="text-center py-4 px-4 font-semibold text-gray-900">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 bg-orange-50">
                          <td className="py-4 px-4 font-semibold text-orange-600">Agnikarma Therapy</td>
                          <td className="text-center py-4 px-4 text-green-600 font-semibold">3-5 sessions</td>
                          <td className="text-center py-4 px-4 text-green-600 font-semibold">92%</td>
                          <td className="text-center py-4 px-4 text-green-600 font-semibold">None</td>
                          <td className="text-center py-4 px-4 text-green-600 font-semibold">Low</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-4 px-4">Surgery + Recovery</td>
                          <td className="text-center py-4 px-4 text-gray-600">6-12 months</td>
                          <td className="text-center py-4 px-4 text-gray-600">70%</td>
                          <td className="text-center py-4 px-4 text-red-600">High Risk</td>
                          <td className="text-center py-4 px-4 text-red-600">Very High</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-4 px-4">Medications</td>
                          <td className="text-center py-4 px-4 text-gray-600">Ongoing</td>
                          <td className="text-center py-4 px-4 text-gray-600">60%</td>
                          <td className="text-center py-4 px-4 text-red-600">Multiple</td>
                          <td className="text-center py-4 px-4 text-red-600">High (Ongoing)</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-4">Physiotherapy</td>
                          <td className="text-center py-4 px-4 text-gray-600">6-18 months</td>
                          <td className="text-center py-4 px-4 text-gray-600">50%</td>
                          <td className="text-center py-4 px-4 text-yellow-600">Minimal</td>
                          <td className="text-center py-4 px-4 text-yellow-600">Moderate</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Experience Instant Pain Relief Today
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Don't let chronic pain control your life. Experience the power of Agnikarma 
              and feel the difference from your very first session.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8"
              >
                Book Agnikarma Session
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Free Pain Assessment
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-orange-100">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Instant Relief</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Zero Side Effects</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>92% Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
