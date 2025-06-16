"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";

const trustStats = [
  {
    label: "Patients Treated",
    value: 50000,
    suffix: "+",
  },
  {
    label: "Years of Experience",
    value: 25,
    suffix: "+",
  },
  {
    label: "Success Rate",
    value: 98,
    suffix: "%",
  },
  {
    label: "Expert Doctors",
    value: 15,
    suffix: "+",
  },
];

const Counter = ({ value, suffix }: { value: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <span ref={ref} className="text-4xl font-bold text-cream">
      {count}
      {suffix}
    </span>
  );
};

export const TrustIndicatorBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="bg-black/30 backdrop-blur-sm rounded-xl p-6 mt-12"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {trustStats.map((stat) => (
          <div key={stat.label} className="text-center">
            <Counter value={stat.value} suffix={stat.suffix} />
            <p className="text-cream/80 mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
