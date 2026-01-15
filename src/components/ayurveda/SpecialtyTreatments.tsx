"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Heart,
  Zap,
  Droplets,
  DollarSign,
  Mountain,
  Phone,
  Calendar,
  CheckCircle,
  Star,
  Users,
  Award,
} from "lucide-react";

const SpecialtyTreatments = () => {
  const specialties = [
    {
      id: "viddhakarma-autism",
      title: "Autism Treatment",
      description:
        "Specialized Viddhakarma treatment for autism spectrum disorders with proven results in improving communication and social skills.",
      icon: Brain,
      color: "from-purple-500 to-indigo-600",
      bgColor: "from-primary/5 to-primary/10",
      features: [
        "Unique energy restoration technique",
        "Improves communication skills",
        "Enhances social interaction",
        "Shows results in 2-4 weeks",
      ],
      stats: { patients: "200+", successRate: "85%", experience: "15 years" },
    },
    {
      id: "viddhakarma-cp",
      title: "Cerebral Palsy Care",
      description:
        "Comprehensive treatment approach for cerebral palsy using Viddhakarma techniques to improve mobility and quality of life.",
      icon: Heart,
      color: "from-red-500 to-pink-600",
      bgColor: "from-primary/5 to-primary/10",
      features: [
        "Improves motor skills",
        "Enhances coordination",
        "Reduces spasticity",
        "Better quality of life",
      ],
      stats: { patients: "150+", successRate: "78%", experience: "12 years" },
    },
    {
      id: "mental-health",
      title: "Mental Health Disorders",
      description:
        "Holistic treatment for various mental health conditions including anxiety, depression, and stress-related disorders.",
      icon: Zap,
      color: "from-green-500 to-emerald-600",
      bgColor: "from-primary/5 to-primary/10",
      features: [
        "Natural healing approach",
        "Addresses root causes",
        "No side effects",
        "Long-lasting results",
      ],
      stats: { patients: "500+", successRate: "90%", experience: "20 years" },
    },
    {
      id: "panchakarma-special",
      title: "Panchakarma Therapies",
      description:
        "Complete detoxification and rejuvenation through five traditional cleansing procedures for overall wellness.",
      icon: Droplets,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-primary/5 to-primary/10",
      features: [
        "Deep detoxification",
        "Improved immunity",
        "Mental clarity",
        "Stress relief",
      ],
      stats: { patients: "1000+", successRate: "95%", experience: "20 years" },
    },
    {
      id: "affordability",
      title: "Affordable Care",
      description:
        "We believe in making authentic Ayurvedic treatments accessible to everyone without compromising on quality.",
      icon: DollarSign,
      color: "from-orange-500 to-red-600",
      bgColor: "from-primary/5 to-primary/10",
      features: [
        "Transparent pricing",
        "No hidden costs",
        "Payment plans available",
        "Quality care guarantee",
      ],
      stats: { patients: "5000+", successRate: "95%", experience: "20 years" },
    },
    {
      id: "wellness-retreats",
      title: "Wellness Retreats",
      description:
        "Comprehensive wellness programs that combine traditional treatments with modern comfort for complete health rejuvenation.",
      icon: Mountain,
      color: "from-teal-500 to-cyan-600",
      bgColor: "from-primary/5 to-primary/10",
      features: [
        "Comprehensive programs",
        "Modern amenities",
        "Expert guidance",
        "Complete transformation",
      ],
      stats: { patients: "50+", successRate: "98%", experience: "5 years" },
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            <Star className="w-4 h-4 mr-2" />
            Our Specialties
          </Badge>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
            Specialized Treatments
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience the power of authentic Ayurvedic treatments, each
            designed to address specific health challenges with proven results
            and lasting transformation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {specialties.map((specialty) => {
            const IconComponent = specialty.icon;

            return (
              <Card
                key={specialty.id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-card h-full flex flex-col"
              >
                <CardHeader
                  className={`bg-gradient-to-br ${specialty.bgColor} relative overflow-hidden p-6`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <IconComponent className="w-full h-full" />
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 bg-gradient-to-r ${specialty.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-lg font-playfair font-bold text-foreground mb-2 line-clamp-2">
                      {specialty.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-6 flex-grow flex flex-col">
                  <p className="text-card-foreground mb-6 leading-relaxed text-sm line-clamp-3 flex-grow">
                    {specialty.description}
                  </p>

                  {/* Key Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3 text-sm">
                      Key Features
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {specialty.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-bold text-lg text-foreground">
                          {specialty.stats.patients}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Patients
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-bold text-lg text-primary">
                          {specialty.stats.successRate}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Success Rate
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="font-bold text-lg text-primary">
                          {specialty.stats.experience}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Experience
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => window.open("tel:+919860370961", "_self")}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Consult Now
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <Calendar className="w-3 h-3 mr-1" />
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 shadow-xl">
            <CardContent className="p-8">
              <div className="max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Start Your Healing Journey?
                </h3>
                <p className="text-lg text-card-foreground mb-6">
                  Take the first step towards complete wellness with our proven
                  Ayurvedic treatments. Our expert team is here to guide you
                  every step of the way.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => window.open("tel:+919860370961", "_self")}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call for Consultation
                  </Button>
                  <Button size="lg" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Join Retreat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SpecialtyTreatments;
