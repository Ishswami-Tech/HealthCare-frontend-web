"use client";

import { motion } from "framer-motion";

interface Treatment {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  duration: string;
  price: string;
  image?: string;
}

const treatments: Treatment[] = [
  {
    id: "panchakarma",
    name: "Panchakarma",
    description:
      "A comprehensive detoxification and rejuvenation program that includes five therapeutic treatments to cleanse the body of toxins and restore balance.",
    benefits: [
      "Deep cleansing and detoxification",
      "Improved digestion and metabolism",
      "Enhanced immunity",
      "Better sleep and stress relief",
      "Rejuvenation of body and mind",
    ],
    duration: "14-21 days",
    price: "Starting from ₹45,000",
  },
  {
    id: "massage",
    name: "Therapeutic Massage",
    description:
      "Traditional Ayurvedic massage techniques using medicated oils to relieve pain, reduce stress, and promote overall wellness.",
    benefits: [
      "Pain relief and muscle relaxation",
      "Improved circulation",
      "Stress reduction",
      "Better flexibility",
      "Enhanced energy levels",
    ],
    duration: "60-90 minutes",
    price: "Starting from ₹2,500",
  },
  {
    id: "shirodhara",
    name: "Shirodhara",
    description:
      "A unique therapy where warm herbal oil is continuously poured over the forehead, calming the mind and nervous system.",
    benefits: [
      "Mental clarity and focus",
      "Relief from anxiety and insomnia",
      "Improved memory",
      "Headache relief",
      "Deep relaxation",
    ],
    duration: "45-60 minutes",
    price: "Starting from ₹3,500",
  },
  {
    id: "herbal",
    name: "Herbal Treatment",
    description:
      "Customized herbal medicine programs using authentic Ayurvedic herbs and formulations to address specific health conditions.",
    benefits: [
      "Natural healing",
      "No side effects",
      "Long-lasting results",
      "Holistic wellness",
      "Personalized care",
    ],
    duration: "Varies by condition",
    price: "Starting from ₹1,500",
  },
];

const TreatmentCard = ({ treatment }: { treatment: Treatment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="card card-hover"
    >
      <div className="relative aspect-[4/3] mb-6 rounded-xl overflow-hidden"></div>

      <h3 className="text-xl font-medium text-white mb-2">{treatment.name}</h3>
      <p className="text-neutral-400 mb-4">{treatment.description}</p>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-primary-300 mb-2">Benefits:</h4>
        <ul className="space-y-1">
          {treatment.benefits.map((benefit, index) => (
            <li
              key={index}
              className="text-sm text-neutral-300 flex items-center"
            >
              <svg
                className="w-4 h-4 text-accent-400 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-800">
        <div>
          <p className="text-sm text-neutral-400">Duration</p>
          <p className="text-sm font-medium text-white">{treatment.duration}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-400">Price</p>
          <p className="text-sm font-medium text-white">{treatment.price}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const TreatmentShowcase = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-neutral-900 to-primary-900/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-primary-300">
            Our Treatment Offerings
          </h2>
          <p className="section-subtitle">
            Experience authentic Ayurvedic treatments tailored to your unique
            constitution and health goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {treatments.map((treatment) => (
            <TreatmentCard key={treatment.id} treatment={treatment} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16"
        >
          <a href="#contact" className="btn btn-primary">
            Book a Consultation
          </a>
        </motion.div>
      </div>
    </section>
  );
};
