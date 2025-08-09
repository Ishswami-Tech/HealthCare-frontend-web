"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Award,
  Users,
  Clock,
  Heart,
  Star,
  CheckCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  ScrollReveal,
  HoverAnimation,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animated-wrapper";
import { useLanguage } from "@/contexts/LanguageContext";

const WhyChooseUsSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: t.whyChooseUs.features.certified.title,
      description: t.whyChooseUs.features.certified.description,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      icon: Award,
      title: t.whyChooseUs.features.experience.title,
      description: t.whyChooseUs.features.experience.description,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      icon: Users,
      title: t.whyChooseUs.features.transformed.title,
      description: t.whyChooseUs.features.transformed.description,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    {
      icon: Heart,
      title: t.whyChooseUs.features.personalized.title,
      description: t.whyChooseUs.features.personalized.description,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      borderColor: "border-pink-200 dark:border-pink-800",
    },
    {
      icon: Sparkles,
      title: t.whyChooseUs.features.natural.title,
      description: t.whyChooseUs.features.natural.description,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    {
      icon: Target,
      title: t.whyChooseUs.features.holistic.title,
      description: t.whyChooseUs.features.holistic.description,
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
  ];

  const stats = [
    { number: "5000+", label: "Lives Transformed", icon: Users },
    { number: "20+", label: "Years Legacy", icon: Clock },
    { number: "95%", label: "Success Rate", icon: TrendingUp },
    { number: "4.9★", label: "Patient Rating", icon: Star },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900/10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <ScrollReveal direction="up" className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4" />
            {t.whyChooseUs.title}
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t.whyChooseUs.title}
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t.whyChooseUs.subtitle}
          </p>
        </ScrollReveal>

        {/* Stats Row */}
        <ScrollReveal direction="up" delay={0.2} className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <HoverAnimation type="scale">
                  <motion.div
                    className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3"
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <motion.div
                      className="text-3xl font-bold text-gray-900 dark:text-white mb-1"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      {stat.number}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                </HoverAnimation>
              </StaggerItem>
            ))}
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <StaggerContainer
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          staggerDelay={0.1}
        >
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <HoverAnimation type="glow">
                <motion.div
                  className={`p-8 rounded-2xl ${feature.bgColor} ${feature.borderColor} border-2 h-full group cursor-pointer`}
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(249, 115, 22, 0)",
                        "0 0 0 10px rgba(249, 115, 22, 0.1)",
                        "0 0 0 0 rgba(249, 115, 22, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>

                  <motion.div
                    className="mt-4 flex items-center text-orange-600 dark:text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified Excellence
                  </motion.div>
                </motion.div>
              </HoverAnimation>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <ScrollReveal direction="up" delay={0.4} className="text-center mt-16">
          <motion.div
            className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Transform Your Life?
            </h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Join thousands who have experienced the healing power of authentic
              Ayurveda. Your wellness journey begins with a single step.
            </p>
            <motion.button
              className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Healing Journey
            </motion.button>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
