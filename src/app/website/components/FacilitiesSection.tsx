"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

interface Facility {
  id: string;
  name: string;
  description: string;
  image: string;
  features: string[];
}

const facilities: Facility[] = [
  {
    id: "panchakarma-center",
    name: "Panchakarma Center",
    description:
      "State-of-the-art facilities for traditional Panchakarma treatments with modern amenities.",
    image: "/images/facilities/panchakarma.webp",
    features: [
      "Specialized treatment rooms",
      "Steam chambers",
      "Therapeutic oil preparation unit",
      "Recovery rooms",
    ],
  },
  {
    id: "consultation-rooms",
    name: "Consultation Rooms",
    description:
      "Private consultation spaces designed for detailed patient assessments and discussions.",
    image: "/images/facilities/consultation.webp",
    features: [
      "Digital health records",
      "Modern diagnostic equipment",
      "Comfortable seating",
      "Sound-proof environment",
    ],
  },
  {
    id: "pharmacy",
    name: "Ayurvedic Pharmacy",
    description:
      "In-house pharmacy preparing traditional medicines using authentic ingredients.",
    image: "/images/facilities/pharmacy.webp",
    features: [
      "Quality-controlled production",
      "Traditional preparation methods",
      "Wide range of medicines",
      "Expert pharmacists",
    ],
  },
  {
    id: "yoga-center",
    name: "Yoga & Meditation Center",
    description:
      "Peaceful space for yoga, meditation, and mindfulness practices.",
    image: "/images/facilities/yoga.webp",
    features: [
      "Spacious yoga hall",
      "Meditation rooms",
      "Natural lighting",
      "Therapeutic atmosphere",
    ],
  },
];

const FacilityCard = ({ facility }: { facility: Facility }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-[#87A96B]/10 backdrop-blur-sm"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    >
      <div className="aspect-[16/9] relative">
        <Image
          src={facility.image}
          alt={facility.name}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font- font-serif font-bold text-[#FF6B35] mb-2">
            {facility.name}
          </h3>
          <p className="text-gray-300">{facility.description}</p>
        </div>
      </div>
      <motion.div
        className="p-6 bg-[#87A96B]/10"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : 0 }}
      >
        <h4 className="text-[#FFD700] font-medium mb-4">Key Features:</h4>
        <ul className="space-y-2">
          {facility.features.map((feature) => (
            <li key={feature} className="flex items-center text-gray-300">
              <svg
                className="w-4 h-4 text-[#FFD700] mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
};

export const FacilitiesSection = () => {
  return (
    <section className="py-24 bg-black" id="facilities">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#FF6B35] mb-4">
            Our Facilities
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience authentic Ayurvedic treatments in our modern,
            well-equipped facilities designed for your comfort and healing.
          </p>
        </motion.div>

        {/* Virtual Tour Button */}
        <div className="text-center mb-16">
          <a
            href="#virtual-tour"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-[#87A96B] rounded-full hover:bg-[#87A96B]/80 transition-colors"
          >
            Take a Virtual Tour
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </a>
        </div>

        {/* Facility Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {facilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-serif font-bold text-[#FF6B35] mb-4">
            Certifications & Standards
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="bg-[#87A96B]/10 backdrop-blur-sm rounded-lg p-4 relative w-[200px] h-16">
              <Image
                src="/images/certifications/iso.webp"
                alt="ISO Certified"
                className="object-contain"
                fill
                sizes="200px"
              />
            </div>
            <div className="bg-[#87A96B]/10 backdrop-blur-sm rounded-lg p-4 relative w-[200px] h-16">
              <Image
                src="/images/certifications/ayush.webp"
                alt="AYUSH Certified"
                className="object-contain"
                fill
                sizes="200px"
              />
            </div>
            <div className="bg-[#87A96B]/10 backdrop-blur-sm rounded-lg p-4 relative w-[200px] h-16">
              <Image
                src="/images/certifications/gmp.webp"
                alt="GMP Certified"
                className="object-contain"
                fill
                sizes="200px"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
