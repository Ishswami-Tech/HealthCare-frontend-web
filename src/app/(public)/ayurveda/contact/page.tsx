"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Calendar,
  User,
  Heart,
  CheckCircle,
  Send,
  Star,
} from "lucide-react";
import { LanguageProvider } from "@/lib/i18n/context";
import { ClinicInfo } from "@/components/clinic/clinic-info";
import { GoogleMaps } from "@/components/maps/google-maps";
import { WhatsAppButton } from "@/components/contact/whatsapp-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    condition: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone Numbers",
      details: ["9860370961", "7709399925", "Call for appointment"],
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: Mail,
      title: "Email Addresses",
      details: [
        "vishwamurthiayurveda@gmail.com",
        "For appointments & queries",
        "Quick response guaranteed",
      ],
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: MapPin,
      title: "Location",
      details: [
        "Moraya Ganapati Mandir Road",
        "Gandhi Peth, Chinchwad Gaon",
        "Pimpri-Chinchwad, Maharashtra",
      ],
      color: "from-orange-500 to-red-600",
    },
    {
      icon: Clock,
      title: "Working Hours",
      details: [
        "Monday - Friday: 11:45 AM - 11:30 PM",
        "Saturday & Sunday: Closed",
        "Emergency consultations available",
      ],
      color: "from-purple-500 to-indigo-600",
    },
  ];

  const quickActions = [
    {
      title: "Book Consultation",
      description: "Schedule your appointment with our experts",
      icon: Calendar,
      action: "Book Now",
      color: "from-orange-500 to-red-600",
    },
    {
      title: "WhatsApp Support",
      description: "Get instant help and quick responses",
      icon: MessageCircle,
      action: "Chat Now",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Emergency Care",
      description: "24/7 emergency consultation available",
      icon: Phone,
      action: "Call Emergency",
      color: "from-red-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-6">
              <Heart className="w-4 h-4 mr-2" />
              Contact Shri Vishwamurthi Ayurvedalay
            </Badge>

            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900 mb-6">
              Get in Touch for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Authentic Healing
              </span>
            </h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Ready to begin your journey to complete wellness? Our expert team
              is here to guide you every step of the way with personalized
              Ayurvedic solutions.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-4 h-4 mr-2" />
                24/7 Support Available
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Star className="w-4 h-4 mr-2" />
                4.9/5 Patient Rating
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <User className="w-4 h-4 mr-2" />
                Expert Consultation
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <p className="text-lg text-gray-600">
                Choose the fastest way to connect with us
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;

                return (
                  <Card
                    key={index}
                    className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50"
                  >
                    <CardContent className="p-8">
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${action.color} rounded-full flex items-center justify-center mx-auto mb-6`}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 mb-6">{action.description}</p>
                      <Button
                        className={`bg-gradient-to-r ${action.color} hover:opacity-90 text-white w-full`}
                      >
                        {action.action}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card className="bg-white shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="text-2xl font-playfair font-bold text-gray-900">
                      Send Us a Message
                    </CardTitle>
                    <p className="text-gray-600">
                      Fill out the form below and we'll get back to you within
                      24 hours
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91-XXXXX-XXXXX"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Health Condition/Concern
                        </label>
                        <Input
                          name="condition"
                          value={formData.condition}
                          onChange={handleInputChange}
                          placeholder="Brief description of your health concern"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Tell us more about how we can help you..."
                          rows={4}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg py-6"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;

                  return (
                    <Card key={index} className="bg-white shadow-lg border-0">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`w-12 h-12 bg-gradient-to-r ${info.color} rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                              {info.title}
                            </h3>
                            <div className="space-y-1">
                              {info.details.map((detail, detailIndex) => (
                                <p key={detailIndex} className="text-gray-700">
                                  {detail}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Emergency Notice */}
                <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-900 mb-2">
                          Emergency Consultation
                        </h3>
                        <p className="text-red-700 mb-4">
                          For urgent health concerns, our expert doctors are
                          available 24/7 for immediate consultation and
                          guidance.
                        </p>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Emergency Line
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Visit Our Clinic
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Located in the heart of Chinchwad, our clinic is easily accessible
              and provides a peaceful environment for healing.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Map */}
            <div>
              <GoogleMaps
                address="Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India"
                latitude={18.6298}
                longitude={73.7997}
                zoom={15}
                height="400px"
                showInfoWindow={true}
                clinicName="Shri Vishwamurthi Ayurvedalay"
                clinicPhone="9860370961, 7709399925"
                clinicHours="Mon-Fri: 11:45 AM – 11:30 PM"
              />
            </div>

            {/* Contact Info */}
            <div>
              <ClinicInfo
                variant="card"
                showDoctor={false}
                showTimings={true}
                showContact={true}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
