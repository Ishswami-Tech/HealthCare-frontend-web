"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface Testimonial {
  id: string;
  name: string;
  location: string;
  treatment: string;
  rating: number;
  content: string;
  image?: string;
  videoUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "testimonial-1",
    name: "Rajiv Mehta",
    location: "Mumbai, India",
    treatment: "Panchakarma Therapy",
    rating: 5,
    content:
      "After struggling with chronic back pain for years, the Panchakarma treatment at Shri Vishwamurthi Ayurvedalay has been life-changing. The doctors are extremely knowledgeable and caring.",
    videoUrl: "/videos/testimonials/testimonial-1.mp4",
  },
  {
    id: "testimonial-2",
    name: "Priya Sharma",
    location: "Delhi, India",
    treatment: "Stress Management Program",
    rating: 5,
    content:
      "The holistic approach to stress management helped me regain balance in my life. The combination of treatments, diet, and lifestyle changes has made a remarkable difference.",
  },
  {
    id: "testimonial-3",
    name: "John Smith",
    location: "London, UK",
    treatment: "Arthritis Management",
    rating: 5,
    content:
      "I traveled from London specifically for their arthritis treatment program. The results have exceeded my expectations. My mobility has improved significantly.",

    videoUrl: "/videos/testimonials/testimonial-3.mp4",
  },
  {
    id: "testimonial-4",
    name: "Anita Desai",
    location: "Bangalore, India",
    treatment: "Weight Management",
    rating: 5,
    content:
      "The personalized diet and treatment plan helped me achieve my weight goals naturally. The doctors take time to understand your body constitution and lifestyle.",
  },
];

const VideoTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!testimonial.videoUrl) return null;

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden">
      {!isPlaying ? (
        <div className="relative h-full">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent flex items-center justify-center">
            <button
              onClick={() => setIsPlaying(true)}
              className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-400 active:bg-primary-600 transition transform hover:scale-110 duration-300"
              aria-label={`Play testimonial video from ${testimonial.name}`}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <video
          src={testimonial.videoUrl}
          controls
          autoPlay
          className="w-full h-full"
        />
      )}
    </div>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="card card-hover">
      <div className="flex items-center gap-4 mb-4">
        <div>
          <h4 className="text-lg font-medium text-white">{testimonial.name}</h4>
          <p className="text-sm text-neutral-400">{testimonial.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <svg
            key={i}
            className="w-5 h-5 text-accent-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-neutral-300 mb-4 line-clamp-4">
        {testimonial.content}
      </p>
      <p className="text-sm text-primary-300 font-medium">
        {testimonial.treatment}
      </p>
    </motion.div>
  );
};

export const TestimonialSection = () => {
  return (
    <section
      className="py-24 bg-gradient-to-br from-neutral-900 to-primary-900/30"
      id="testimonials"
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-primary-300">Success Stories</h2>
          <p className="section-subtitle">
            Hear from our patients about their transformative healing journeys
            at Shri Vishwamurthi Ayurvedalay.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials
            .filter((t) => t.videoUrl)
            .map((testimonial) => (
              <VideoTestimonial
                key={testimonial.id}
                testimonial={testimonial}
              />
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};
