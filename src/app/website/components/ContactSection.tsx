"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialFormData: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const contactInfo = {
  address: "123 Ayurveda Street, Wellness District, Mumbai, India - 400001",
  phone: ["+91 98765 43210", "+91 98765 43211"],
  email: [
    "info@vishwamurthiayurveda.com",
    "appointments@vishwamurthiayurveda.com",
  ],
  hours: "Monday - Saturday: 9:00 AM - 7:00 PM",
  emergencyNumber: "+91 98765 43212",
};

export const ContactSection = () => {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Here you would typically send the form data to your backend
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulated API call
      setSubmitStatus("success");
      setFormData(initialFormData);
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 bg-black" id="contact">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#FF6B35] mb-4">
            Contact Us
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get in touch with us for appointments, inquiries, or to learn more
            about our treatments and services.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#87A96B]/10 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#87A96B]/10 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#87A96B]/10 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-[#87A96B]/10 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="">Select a subject</option>
                    <option value="appointment">Book Appointment</option>
                    <option value="inquiry">General Inquiry</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full bg-[#87A96B]/10 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-8 py-4 rounded-lg text-white font-medium transition-colors ${
                  isSubmitting
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-[#FF6B35] hover:bg-[#FF8B55]"
                }`}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
              {submitStatus === "success" && (
                <p className="text-green-500 text-center">
                  Message sent successfully! We&apos;ll get back to you soon.
                </p>
              )}
              {submitStatus === "error" && (
                <p className="text-red-500 text-center">
                  Something went wrong. Please try again later.
                </p>
              )}
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#87A96B]/10 backdrop-blur-sm rounded-2xl p-8"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-serif font-bold text-[#FF6B35] mb-4">
                Visit Us
              </h3>
              <p className="text-gray-300">{contactInfo.address}</p>
              <div className="mt-4">
                <iframe
                  title="Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1885.8867961876164!2d72.8554!3d19.0748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDA0JzI5LjMiTiA3MsKwNTEnMTkuNCJF!5e0!3m2!1sen!2sin!4v1625136086578!5m2!1sen!2sin"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-serif font-bold text-[#FF6B35] mb-4">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[#FFD700] font-medium mb-2">Phone</h4>
                  {contactInfo.phone.map((number) => (
                    <p key={number} className="text-gray-300">
                      {number}
                    </p>
                  ))}
                </div>
                <div>
                  <h4 className="text-[#FFD700] font-medium mb-2">Email</h4>
                  {contactInfo.email.map((email) => (
                    <p key={email} className="text-gray-300">
                      {email}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-serif font-bold text-[#FF6B35] mb-4">
                Hours of Operation
              </h3>
              <p className="text-gray-300 mb-4">{contactInfo.hours}</p>
              <div>
                <h4 className="text-[#FFD700] font-medium mb-2">
                  24/7 Emergency Contact
                </h4>
                <p className="text-gray-300">{contactInfo.emergencyNumber}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
