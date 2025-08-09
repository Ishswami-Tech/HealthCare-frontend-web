"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  ExternalLink,
  Car,
  Train,
  Bus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const GoogleMap = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  // Clinic coordinates for Chinchwad location
  const clinicLocation = {
    lat: 18.6298,
    lng: 73.7997,
    address: "Dr. Chandrakumar Deshmukh, Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra 411033, India"
  };

  const handleGetDirections = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinicLocation.address)}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleCallClinic = () => {
    window.open('tel:+919860370961', '_self');
  };

  const transportOptions = [
    {
      icon: Car,
      title: "By Car",
      description: "Free parking available",
      time: "Varies by location"
    },
    {
      icon: Bus,
      title: "By Bus",
      description: "Multiple bus routes available",
      time: "PMPML Bus Service"
    },
    {
      icon: Train,
      title: "By Train",
      description: "Chinchwad Railway Station",
      time: "2 km from station"
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 mb-4">
            <MapPin className="w-4 h-4 mr-2" />
            Find Us
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gray-900 dark:text-white mb-4">
            Visit Our Clinic
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Located in the heart of Chinchwad, easily accessible by all modes of transport
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Clinic Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-96 bg-gray-100 dark:bg-gray-700">
                  {/* Google Maps Embed */}
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3781.8234567890123!2d73.7997!3d18.6298!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDM3JzQ3LjMiTiA3M8KwNDcnNTguOSJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin&q=${encodeURIComponent(clinicLocation.address)}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-b-lg"
                    onLoad={() => setIsLoading(false)}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={handleGetDirections}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      {t.common.getDirections}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(clinicLocation.address)}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Transport Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.contact.location}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {t.contact.address}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Phone Numbers</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t.contact.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t.contact.opdTiming}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Mon-Fri: 11:45 AM – 11:30 PM</p>
                    <p className="text-sm text-red-500 dark:text-red-400">Sat-Sun: {t.contact.closed}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleCallClinic}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {t.common.callNow}: 9860370961
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transport Options */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  How to Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transportOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{option.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{option.description}</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{option.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Free parking available for patients
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleMap;
