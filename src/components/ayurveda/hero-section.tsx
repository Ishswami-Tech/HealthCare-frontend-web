"use client";

import React from 'react';
import { ArrowRight, Play, Star, Users, Award, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';

interface HeroSectionProps {
  className?: string;
  variant?: 'default' | 'video' | 'minimal';
  showStats?: boolean;
  backgroundImage?: string;
}

export function HeroSection({
  className,
  variant = 'default',
  showStats = true,
  backgroundImage = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop',
}: HeroSectionProps) {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: '5000+',
      label: 'Patients Treated',
      color: 'text-green-600',
    },
    {
      icon: <Award className="w-6 h-6" />,
      value: '15+',
      label: 'Years Experience',
      color: 'text-blue-600',
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: '4.9',
      label: 'Patient Rating',
      color: 'text-yellow-600',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      value: '24/7',
      label: 'Emergency Support',
      color: 'text-red-600',
    },
  ];

  if (variant === 'minimal') {
    return (
      <section className={cn("py-20 bg-gradient-to-br from-green-50 to-blue-50", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
                {t('hero.primaryCta')}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                {t('hero.secondaryCta')}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'video') {
    return (
      <section className={cn("relative min-h-screen flex items-center", className)}>
        {/* Background Video/Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-green-200">
              {t('hero.subtitle')}
            </p>
            <p className="text-lg mb-8 text-gray-200 max-w-2xl mx-auto">
              {t('hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center gap-2">
                {t('hero.primaryCta')}
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="flex items-center gap-3 text-white hover:text-green-200 transition-colors group">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <span className="font-medium">Watch Treatment Demo</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>5000+ Patients Treated</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>15+ Years Experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Award className="w-4 h-4" />
              <span>Authentic Ayurvedic Treatment</span>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-green-600 font-semibold mb-6">
                {t('hero.subtitle')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('hero.description')}
              </p>
            </div>

            {/* Doctor Info */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  डॉ
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('doctor.name')}</h3>
                  <p className="text-green-600 font-medium">{t('doctor.specialization')}</p>
                  <p className="text-sm text-gray-600">{t('doctor.experience')} • {t('doctor.education')}</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
                {t('hero.primaryCta')}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                {t('hero.secondaryCta')}
              </button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Mon-Fri: 11:45 AM - 11:30 PM</p>
                  <p>Emergency: 24/7 Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={backgroundImage}
                alt="Ayurvedic Treatment"
                className="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl"
              />
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <div>
                    <p className="font-bold text-gray-900">4.9/5</p>
                    <p className="text-xs text-gray-600">Patient Rating</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-bold text-gray-900">5000+</p>
                    <p className="text-xs text-gray-600">Patients Treated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-blue-200 rounded-2xl transform rotate-3 scale-105 -z-10" />
          </div>
        </div>

        {/* Stats Section */}
        {showStats && (
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-4", stat.color)}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
