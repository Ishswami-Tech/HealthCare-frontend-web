"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  qualifications: string[];
  experience: string;
  specialization: string;
  image: string;
  achievements: string[];
}

const teamMembers: TeamMember[] = [
  {
    id: "dr-sharma",
    name: "Dr. Rajesh Sharma",
    role: "Chief Ayurvedic Physician",
    qualifications: ["BAMS", "MD (Ayurveda)", "Ph.D"],
    experience: "25+ years",
    specialization: "Panchakarma & Chronic Diseases",
    image: "/images/team/dr-sharma.webp",
    achievements: [
      "Published 15+ research papers",
      "National Award for Excellence in Ayurveda",
      "Visiting faculty at leading universities",
    ],
  },
  {
    id: "dr-patel",
    name: "Dr. Meera Patel",
    role: "Senior Consultant",
    qualifications: ["BAMS", "MD (Kayachikitsa)"],
    experience: "15+ years",
    specialization: "Women's Health & Rasayana",
    image: "/images/team/dr-patel.webp",
    achievements: [
      "Specialist in fertility treatments",
      "Research in women's health",
      "International speaker",
    ],
  },
];

const TeamMemberCard = ({ member }: { member: TeamMember }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-[#87A96B]/10 backdrop-blur-sm rounded-2xl p-6"
    >
      <div className="relative w-48 h-48 mx-auto mb-6">
        <Image
          src={member.image}
          alt={member.name}
          className="rounded-full object-cover"
          fill
          sizes="192px"
        />
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-serif font-bold text-[#FF6B35] mb-2">
          {member.name}
        </h3>
        <p className="text-gray-300 font-medium mb-2">{member.role}</p>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {member.qualifications.map((qual) => (
            <span
              key={qual}
              className="text-sm bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-1 rounded-full"
            >
              {qual}
            </span>
          ))}
        </div>
        <p className="text-gray-400 mb-2">
          <span className="text-[#FFD700]">Specialization:</span>{" "}
          {member.specialization}
        </p>
        <p className="text-gray-400 mb-4">
          <span className="text-[#FFD700]">Experience:</span>{" "}
          {member.experience}
        </p>
        <div className="space-y-2">
          {member.achievements.map((achievement) => (
            <p key={achievement} className="text-sm text-gray-300">
              • {achievement}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const TeamShowcase = () => {
  return (
    <section className="py-24 bg-black" id="team">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#FF6B35] mb-4">
            Our Medical Team
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Meet our experienced team of Ayurvedic practitioners dedicated to
            your holistic well-being.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
};
