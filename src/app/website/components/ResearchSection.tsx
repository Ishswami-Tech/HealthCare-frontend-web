"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  link: string;
}

interface Recognition {
  id: string;
  title: string;
  organization: string;
  year: number;
  description: string;
  image: string;
}

const researchPapers: ResearchPaper[] = [
  {
    id: "paper-1",
    title: "Clinical Efficacy of Panchakarma in Management of Chronic Diseases",
    authors: ["Dr. Rajesh Sharma", "Dr. Meera Patel"],
    journal: "International Journal of Ayurvedic Medicine",
    year: 2023,
    abstract:
      "A comprehensive study on the effectiveness of traditional Panchakarma treatments in managing chronic conditions, with a focus on modern clinical validation.",
    link: "#research-paper-1",
  },
  {
    id: "paper-2",
    title: "Ayurvedic Herbs in Modern Healthcare: A Systematic Review",
    authors: ["Dr. Arun Kumar", "Dr. Priya Singh"],
    journal: "Journal of Alternative and Complementary Medicine",
    year: 2022,
    abstract:
      "An extensive review of traditional Ayurvedic herbs and their applications in contemporary healthcare settings.",
    link: "#research-paper-2",
  },
];

const recognitions: Recognition[] = [
  {
    id: "recognition-1",
    title: "Excellence in Ayurvedic Healthcare",
    organization: "National Ayurvedic Medical Association",
    year: 2023,
    description:
      "Recognized for outstanding contribution to Ayurvedic healthcare and research.",
    image: "/images/recognitions/award-1.webp",
  },
  {
    id: "recognition-2",
    title: "Best Ayurvedic Hospital",
    organization: "Healthcare Excellence Awards",
    year: 2022,
    description:
      "Awarded for maintaining highest standards in Ayurvedic treatment and patient care.",
    image: "/images/recognitions/award-2.webp",
  },
];

const ResearchCard = ({ paper }: { paper: ResearchPaper }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-[#87A96B]/10 backdrop-blur-sm rounded-2xl p-6"
    >
      <h3 className="text-2xl font-serif font-bold text-[#FF6B35] mb-2">
        {paper.title}
      </h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {paper.authors.map((author) => (
          <span
            key={author}
            className="text-sm bg-[#FF6B35]/20 text-[#FF6B35] px-3 py-1 rounded-full"
          >
            {author}
          </span>
        ))}
      </div>
      <p className="text-gray-400 text-sm mb-4">
        {paper.journal} • {paper.year}
      </p>
      <p className="text-gray-300 mb-6">{paper.abstract}</p>
      <a
        href={paper.link}
        className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80"
      >
        Read Full Paper
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
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </motion.div>
  );
};

const RecognitionCard = ({ recognition }: { recognition: Recognition }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-[#87A96B]/10 backdrop-blur-sm rounded-2xl p-6 flex gap-6"
    >
      <div className="relative w-24 h-24">
        <Image
          src={recognition.image}
          alt={recognition.title}
          className="object-contain"
          fill
          sizes="96px"
        />
      </div>
      <div>
        <h3 className="text-xl font-serif font-bold text-[#FF6B35] mb-2">
          {recognition.title}
        </h3>
        <p className="text-gray-400 text-sm mb-2">
          {recognition.organization} • {recognition.year}
        </p>
        <p className="text-gray-300">{recognition.description}</p>
      </div>
    </motion.div>
  );
};

export const ResearchSection = () => {
  return (
    <section
      className="py-24 bg-gradient-to-br from-[#87A96B]/20 to-black"
      id="research"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#FF6B35] mb-4">
            Research & Recognition
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our commitment to advancing Ayurvedic science through research and
            maintaining the highest standards of healthcare.
          </p>
        </motion.div>

        {/* Research Papers */}
        <div className="mb-16">
          <h3 className="text-2xl font-serif font-bold text-[#FFD700] mb-8">
            Published Research
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {researchPapers.map((paper) => (
              <ResearchCard key={paper.id} paper={paper} />
            ))}
          </div>
        </div>

        {/* Recognitions */}
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#FFD700] mb-8">
            Awards & Recognition
          </h3>
          <div className="grid grid-cols-1 gap-8">
            {recognitions.map((recognition) => (
              <RecognitionCard key={recognition.id} recognition={recognition} />
            ))}
          </div>
        </div>

        {/* Academic Partnerships */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-serif font-bold text-[#FFD700] mb-8">
            Academic Partnerships
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="bg-[#87A96B]/10 backdrop-blur-sm rounded-lg p-4 relative w-[200px] h-16">
              <Image
                src="/images/partnerships/university-1.webp"
                alt="Partner University 1"
                className="grayscale hover:grayscale-0 transition-all"
                fill
                sizes="200px"
              />
            </div>
            <div className="bg-[#87A96B]/10 backdrop-blur-sm rounded-lg p-4 relative w-[200px] h-16">
              <Image
                src="/images/partnerships/university-2.webp"
                alt="Partner University 2"
                className="grayscale hover:grayscale-0 transition-all"
                fill
                sizes="200px"
              />
            </div>
            <div className="bg-[#87A96B]/10 backdrop-blur-sm rounded-lg p-4 relative w-[200px] h-16">
              <Image
                src="/images/partnerships/university-3.webp"
                alt="Partner University 3"
                className="grayscale hover:grayscale-0 transition-all"
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
