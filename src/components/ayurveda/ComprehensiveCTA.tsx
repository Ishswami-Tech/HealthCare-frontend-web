"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  Heart, 
  Brain, 
  Phone,
  MessageCircle,
  Calendar,
  BookOpen,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Clock,
  Shield,
  Award,
  Target,
  Mail,
  Video,
  Globe
} from 'lucide-react';

const ComprehensiveCTA = () => {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const engagementLevels = [
    {
      id: 'high',
      title: 'START MY HEALING JOURNEY NOW',
      subtitle: 'High Intent - Ready for Immediate Transformation',
      description: 'I\'m ready to begin my healing journey and want to start treatment immediately',
      icon: Zap,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      actions: [
        { label: 'Book Comprehensive Assessment', subtext: 'Within 24 hours', urgent: true },
        { label: 'Emergency Consultation', subtext: 'Same-day evaluation', urgent: true },
        { label: 'Panchakarma Enrollment', subtext: 'Immediate admission', urgent: false },
        { label: 'VIP Fast-Track', subtext: 'No waiting period', urgent: false }
      ]
    },
    {
      id: 'medium',
      title: 'GET COMPLETE HEALING PLAN',
      subtitle: 'Medium Intent - Seeking Detailed Information',
      description: 'I want to understand my options and get a personalized treatment plan',
      icon: Heart,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      actions: [
        { label: 'Free Health Assessment', subtext: 'Comprehensive analysis', urgent: false },
        { label: 'Personalized Treatment Plan', subtext: 'Custom roadmap', urgent: false },
        { label: 'Educational Package', subtext: 'Detailed guides', urgent: false },
        { label: 'Success Story Access', subtext: 'Similar cases', urgent: false }
      ]
    },
    {
      id: 'low',
      title: 'STAY CONNECTED FOR WELLNESS',
      subtitle: 'Low Intent - Exploring Natural Healing Options',
      description: 'I\'m interested in learning more about Ayurvedic healing and wellness',
      icon: Brain,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      actions: [
        { label: 'Weekly Newsletter', subtext: 'Health tips & guidance', urgent: false },
        { label: 'Social Media Community', subtext: 'Daily inspiration', urgent: false },
        { label: 'Free Monthly Workshops', subtext: 'Health education', urgent: false },
        { label: 'E-book Library', subtext: 'Free downloads', urgent: false }
      ]
    }
  ];

  const contactChannels = [
    {
      channel: 'WhatsApp Business',
      number: '+91-XXXX-XXXX',
      response: 'AI + Human support - replied within 2 minutes',
      icon: MessageCircle,
      color: 'from-green-500 to-emerald-600'
    },
    {
      channel: 'Main Helpline',
      number: '+91-XXXX-XXXX',
      response: 'Multi-language support - answered within 2 rings',
      icon: Phone,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      channel: 'Emergency Line',
      number: '+91-XXXX-XXXX',
      response: 'Medical emergencies - immediate response',
      icon: Phone,
      color: 'from-red-500 to-pink-600'
    },
    {
      channel: 'Video Consultation',
      number: 'Schedule Online',
      response: 'Telemedicine appointments worldwide',
      icon: Video,
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  const guarantees = [
    { icon: Shield, text: '100% Satisfaction Assurance' },
    { icon: Award, text: 'Expert Care Promise' },
    { icon: CheckCircle, text: 'International Safety Standards' },
    { icon: Users, text: 'Lifetime Wellness Partnership' },
    { icon: Star, text: 'Holistic Transformation Guarantee' }
  ];

  return (
    <div className="space-y-20">
      {/* Multi-Level Engagement Strategy */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-4">
                <Target className="w-4 h-4 mr-2" />
                Multi-Level Engagement Strategy
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Your Journey to Complete Wellness{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                  Starts with One Decision
                </span>
              </h2>
              <p className="text-lg text-gray-600">
                Choose your level of engagement and let us guide you to optimal health
              </p>
            </div>

            <div className="space-y-8">
              {engagementLevels.map((level, index) => {
                const IconComponent = level.icon;
                const isSelected = selectedIntent === level.id;
                
                return (
                  <Card 
                    key={level.id} 
                    className={`cursor-pointer transition-all duration-300 border-2 ${
                      isSelected 
                        ? 'border-orange-300 shadow-xl scale-105' 
                        : 'border-gray-200 hover:border-orange-200 hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedIntent(isSelected ? null : level.id)}
                  >
                    <CardContent className="p-0">
                      <div className="grid lg:grid-cols-3">
                        <div className={`bg-gradient-to-br ${level.bgColor} p-8 flex flex-col justify-center`}>
                          <div className={`w-16 h-16 bg-gradient-to-r ${level.color} rounded-full flex items-center justify-center mb-6`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{level.title}</h3>
                          <p className="text-sm text-gray-600 mb-4">{level.subtitle}</p>
                          <p className="text-gray-700">{level.description}</p>
                        </div>
                        
                        <div className="lg:col-span-2 p-8">
                          <div className="grid md:grid-cols-2 gap-4">
                            {level.actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                variant={action.urgent ? "default" : "outline"}
                                className={`h-auto p-4 justify-start ${
                                  action.urgent 
                                    ? `bg-gradient-to-r ${level.color} hover:opacity-90 text-white` 
                                    : `border-gray-300 text-gray-700 hover:bg-gray-50`
                                }`}
                              >
                                <div className="text-left">
                                  <div className="font-semibold">{action.label}</div>
                                  <div className="text-xs opacity-75">{action.subtext}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto" />
                              </Button>
                            ))}
                          </div>
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

      {/* Omnichannel Contact */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">
                <Phone className="w-4 h-4 mr-2" />
                Omnichannel Contact & Instant Engagement
              </Badge>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-4">
                Connect with Us Instantly - 24/7 Expert Support
              </h2>
              <p className="text-lg text-gray-600">
                Multiple ways to reach us with guaranteed response times
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {contactChannels.map((contact, index) => {
                const IconComponent = contact.icon;
                
                return (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${contact.color} rounded-full flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-gray-900">{contact.channel}</CardTitle>
                          <p className="text-gray-600 font-semibold">{contact.number}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{contact.response}</p>
                      <Button className={`w-full bg-gradient-to-r ${contact.color} hover:opacity-90 text-white`}>
                        Contact Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Response Time Guarantees */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-bold text-green-600">2 Rings</div>
                <div className="text-xs text-gray-600">Phone Answer Time</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-bold text-blue-600">30 Seconds</div>
                <div className="text-xs text-gray-600">WhatsApp AI Response</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Mail className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="font-bold text-purple-600">4 Hours</div>
                <div className="text-xs text-gray-600">Email Response</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="font-bold text-red-600">10 Minutes</div>
                <div className="text-xs text-gray-600">Emergency Callback</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="font-bold text-orange-600">30 Minutes</div>
                <div className="text-xs text-gray-600">Appointment Confirmation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ultimate Value Proposition */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6">
              Transform Your Life Completely
            </h2>
            <p className="text-xl text-orange-100 mb-8 leading-relaxed">
              At Shri Vishwamurthi Ayurvedalay, we don't just treat diseases - we transform lives completely. 
              Experience the profound healing power of authentic Ayurveda, where 5000-year-old wisdom meets 
              cutting-edge modern excellence.
            </p>

            {/* Emotional Vision */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">Imagine Your New Life...</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Waking up tomorrow without pain</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Feeling energetic throughout the day</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Sleeping peacefully through the night</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Playing actively with your children</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Pursuing passions without limitations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Living the joyful life you deserve</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {guarantees.map((guarantee, index) => {
                const IconComponent = guarantee.icon;
                return (
                  <div key={index} className="text-center">
                    <IconComponent className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                    <div className="text-sm text-orange-100">{guarantee.text}</div>
                  </div>
                );
              })}
            </div>

            {/* Final CTA */}
            <div className="space-y-6">
              <p className="text-lg text-orange-100">
                Your pain-free, vibrant, and completely healthy life is just one decision away.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-4"
                >
                  🔥 START MY HEALING JOURNEY NOW
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
                >
                  📞 Call for Free Consultation
                </Button>
              </div>

              <p className="text-sm text-orange-200">
                ✨ Thousands have already taken this transformative journey. Join them today! ✨
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Stay Connected for Wellness Wisdom
            </h3>
            <p className="text-gray-600 mb-8">
              Get weekly Ayurvedic health tips, seasonal guidance, and exclusive healing insights
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                Subscribe
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Join 50,000+ people receiving our wellness newsletter. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ComprehensiveCTA;
