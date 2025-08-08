"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Award, 
  Star, 
  Clock,
  Heart,
  CheckCircle,
  TrendingUp,
  Shield
} from 'lucide-react';

const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      number: '5000+',
      label: 'Lives Transformed',
      description: 'Patients successfully treated',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Clock,
      number: '20+',
      label: 'Years Legacy',
      description: 'Of authentic Ayurvedic practice',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Star,
      number: '4.9★',
      label: 'Patient Rating',
      description: 'Based on 4,200+ reviews',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: Award,
      number: '95%',
      label: 'Success Rate',
      description: 'Across all treatments',
      color: 'from-purple-500 to-indigo-600'
    }
  ];

  const certifications = [
    {
      icon: Shield,
      title: 'Government Certified',
      description: 'Registered Ayurvedic Hospital'
    },
    {
      icon: Award,
      title: 'ISO 9001:2015',
      description: 'Quality Management System'
    },
    {
      icon: CheckCircle,
      title: 'NABH Accredited',
      description: 'National Accreditation Board'
    },
    {
      icon: TrendingUp,
      title: 'Teaching Hospital',
      description: 'Academic Excellence Status'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            
            return (
              <Card 
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white"
              >
                <CardContent className="p-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="font-semibold text-gray-800 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Certifications */}
        <div className="text-center mb-12">
          <Badge className="bg-green-100 text-green-800 border-green-200 mb-4">
            <CheckCircle className="w-4 h-4 mr-2" />
            Trusted & Certified
          </Badge>
          <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-8">
            Recognized Excellence in Ayurvedic Healthcare
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert, index) => {
            const IconComponent = cert.icon;
            
            return (
              <div 
                key={index}
                className="text-center p-6 rounded-lg bg-white border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {cert.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {cert.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Currently treating 8 patients</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span>400% increase in bookings this month</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Featured on leading health channels</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>147 people viewing treatments today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
