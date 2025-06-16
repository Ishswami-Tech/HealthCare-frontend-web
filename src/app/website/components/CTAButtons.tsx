"use client";

import { motion } from "framer-motion";

export const CTAButtons = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
    >
      <a
        href="#book-appointment"
        className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-[#FF6B35] rounded-full hover:bg-[#FF8B55] transition-colors duration-300 transform hover:scale-105"
      >
        Book Consultation
        <svg
          className="w-5 h-5 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </a>
      <a
        href="#learn-more"
        className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white/10 transition-colors duration-300 transform hover:scale-105"
      >
        Learn More
        <svg
          className="w-5 h-5 ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </a>
    </motion.div>
  );
};
