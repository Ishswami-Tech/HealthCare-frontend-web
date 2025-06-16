"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Home", href: "#home" },
  { name: "Treatments", href: "#treatments" },
  { name: "Health Assessment", href: "#assessment" },
  { name: "Our Team", href: "#team" },
  { name: "Facilities", href: "#facilities" },
  { name: "Research", href: "#research" },
  { name: "Contact", href: "#contact" },
];

const quickLinks = [
  { name: "About Us", href: "#about" },
  { name: "Book Appointment", href: "#contact" },
  { name: "Patient Stories", href: "#testimonials" },
  { name: "Blog", href: "#blog" },
  { name: "Privacy Policy", href: "#privacy" },
  { name: "Terms of Service", href: "#terms" },
];

const treatmentOfferings = [
  { name: "Panchakarma", href: "#treatments" },
  { name: "Massage Therapy", href: "#treatments" },
  { name: "Shirodhara", href: "#treatments" },
  { name: "Herbal Treatment", href: "#treatments" },
  { name: "Wellness Program", href: "#treatments" },
  { name: "Consultation", href: "#treatments" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-800">
        <nav className="container h-20">
          <div className="flex items-center justify-between h-full">
            <a href="#home" className="flex items-center gap-2">
              <span className="text-lg font-medium text-white">
                Shri Vishwamurthi
              </span>
            </a>

            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm text-neutral-300 hover:text-primary-300 transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white p-2"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-800"
            >
              <div className="container py-4">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block py-2 text-neutral-300 hover:text-primary-300 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20">{children}</main>

      <footer className="bg-neutral-900 border-t border-neutral-800">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Contact Us
              </h3>
              <address className="not-italic text-sm text-neutral-400 space-y-2">
                <p>123 Ayurveda Street</p>
                <p>Bangalore, Karnataka 560001</p>
                <p>India</p>
                <p className="mt-4">
                  <a
                    href="tel:+919876543210"
                    className="text-primary-300 hover:text-primary-400"
                  >
                    +91 98765 43210
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:info@vishwamurthi.com"
                    className="text-primary-300 hover:text-primary-400"
                  >
                    info@vishwamurthi.com
                  </a>
                </p>
              </address>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-neutral-400 hover:text-primary-300 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Treatment Offerings
              </h3>
              <ul className="space-y-2">
                {treatmentOfferings.map((treatment) => (
                  <li key={treatment.name}>
                    <a
                      href={treatment.href}
                      className="text-sm text-neutral-400 hover:text-primary-300 transition-colors"
                    >
                      {treatment.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Certifications
              </h3>
              <div className="grid grid-cols-3 gap-4"></div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-neutral-400">
                © {new Date().getFullYear()} Shri Vishwamurthi Ayurvedalay. All
                rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#facebook"
                  className="text-neutral-400 hover:text-primary-300 transition-colors"
                  aria-label="Follow us on Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" />
                  </svg>
                </a>
                <a
                  href="#instagram"
                  className="text-neutral-400 hover:text-primary-300 transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12,2.16c3.2,0,3.58,0,4.85.07,3.25.15,4.77,1.69,4.92,4.92.06,1.27.07,1.65.07,4.85s0,3.58-.07,4.85c-.15,3.23-1.69,4.77-4.92,4.92-1.27.06-1.65.07-4.85.07s-3.58,0-4.85-.07c-3.25-.15-4.77-1.69-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s0-3.58.07-4.85C2.38,3.92,3.92,2.38,7.15,2.23,8.42,2.18,8.8,2.16,12,2.16ZM12,0C8.74,0,8.33,0,7.05.07c-4.27.2-6.78,2.71-7,7C0,8.33,0,8.74,0,12s0,3.67.07,4.95c.2,4.27,2.71,6.78,7,7C8.33,24,8.74,24,12,24s3.67,0,4.95-.07c4.27-.2,6.78-2.71,7-7C24,15.67,24,15.26,24,12s0-3.67-.07-4.95c-.2-4.27-2.71-6.78-7-7C15.67,0,15.26,0,12,0Zm0,5.84A6.16,6.16,0,1,0,18.16,12,6.16,6.16,0,0,0,12,5.84ZM12,16a4,4,0,1,1,4-4A4,4,0,0,1,12,16ZM18.41,4.15a1.44,1.44,0,1,0,1.44,1.44A1.44,1.44,0,0,0,18.41,4.15Z" />
                  </svg>
                </a>
                <a
                  href="#twitter"
                  className="text-neutral-400 hover:text-primary-300 transition-colors"
                  aria-label="Follow us on Twitter"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.95,4.57a10,10,0,0,1-2.82.77,4.93,4.93,0,0,0,2.16-2.72,9.78,9.78,0,0,1-3.12,1.19,4.92,4.92,0,0,0-8.39,4.49A14,14,0,0,1,1.64,3.16,4.92,4.92,0,0,0,3.19,9.72a4.86,4.86,0,0,1-2.23-.61v.06A4.92,4.92,0,0,0,4.9,14a5,5,0,0,1-2.21.08,4.93,4.93,0,0,0,4.6,3.42,9.85,9.85,0,0,1-7.29,2A13.87,13.87,0,0,0,7.54,22c9.05,0,14-7.5,14-14,0-.21,0-.43,0-.64A10,10,0,0,0,23.95,4.57Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
