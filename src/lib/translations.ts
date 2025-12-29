export type Language = 'en' | 'hi' | 'mr';

export interface Translation {
  // Navigation
  nav: {
    home: string;
    treatments: string;
    panchakarma: string;
    agnikarma: string;
    viddhakarma: string;
    ourTeam: string;
    about: string;
    contact: string;
    bookConsultation: string;
    liveChat: string;
  };
  
  // Hero Section
  hero: {
    title1: string;
    title2: string;
    title3: string;
    subtitle: string;
    description: string;
    bookConsultation: string;
    callNow: string;
    experience: string;
    livesTransformed: string;
    certified: string;
  };
  
  // Services & Treatments
  services: {
    title: string;
    subtitle: string;
    categories: {
      neurological: {
        title: string;
        conditions: string[];
      };
      jointBone: {
        title: string;
        conditions: string[];
      };
      spinal: {
        title: string;
        conditions: string[];
      };
      respiratory: {
        title: string;
        conditions: string[];
      };
      digestive: {
        title: string;
        conditions: string[];
      };
      kidneyGallbladder: {
        title: string;
        conditions: string[];
      };
      skin: {
        title: string;
        conditions: string[];
      };
      obesity: {
        title: string;
        conditions: string[];
      };
      metabolic: {
        title: string;
        conditions: string[];
      };
      stress: {
        title: string;
        conditions: string[];
      };
      gynecological: {
        title: string;
        conditions: string[];
      };
      hair: {
        title: string;
        conditions: string[];
      };
      panchakarma: {
        title: string;
        conditions: string[];
      };
      beauty: {
        title: string;
        conditions: string[];
      };
      other: {
        title: string;
        conditions: string[];
      };
    };
  };
  
  // Doctor Information
  doctor: {
    name: string;
    title: string;
    specialization: string;
    experience: string;
    description: string;
  };
  
  // Location & Contact
  contact: {
    location: string;
    address: string;
    phone: string;
    opdTiming: string;
    days: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
    closed: string;
  };
  
  // Specialty Treatments
  specialties: {
    viddhakarmaAutism: {
      title: string;
      description: string;
    };
    viddhakarmaCP: {
      title: string;
      description: string;
    };
    mentalHealth: {
      title: string;
      description: string;
    };
    panchakarmaSpecial: {
      title: string;
      description: string;
    };
    affordability: {
      title: string;
      description: string;
    };
    wellnessRetreats: {
      title: string;
      description: string;
    };
  };
  
  // Why Choose Us
  whyChooseUs: {
    title: string;
    subtitle: string;
    features: {
      certified: {
        title: string;
        description: string;
      };
      experience: {
        title: string;
        description: string;
      };
      transformed: {
        title: string;
        description: string;
      };
      personalized: {
        title: string;
        description: string;
      };
      natural: {
        title: string;
        description: string;
      };
      holistic: {
        title: string;
        description: string;
      };
    };
  };

  // Common
  common: {
    readMore: string;
    bookNow: string;
    learnMore: string;
    contactUs: string;
    viewAll: string;
    loading: string;
    error: string;
    success: string;
    freeConsultation: string;
    callNow: string;
    bookAppointment: string;
    getDirections: string;
    noCharges: string;
  };
}

export const translations: Record<Language, Translation> = {
  en: {
    nav: {
      home: "Home",
      treatments: "Treatments",
      panchakarma: "Panchakarma",
      agnikarma: "Agnikarma",
      viddhakarma: "Viddhakarma",
      ourTeam: "Our Team",
      about: "About",
      contact: "Contact",
      bookConsultation: "Book Consultation",
      liveChat: "Live Chat",
    },
    hero: {
      title1: "Ancient Healing.",
      title2: "Modern Results.",
      title3: "Pain-Free Life",
      subtitle: "Experience Authentic Panchakarma, Agnikarma, Viddhakarma & Complete Ayurvedic Solutions",
      description: "Where 5000-Year Healing Wisdom Meets Modern Excellence",
      bookConsultation: "Book Free Consultation",
      callNow: "Call Now: +91-9860370961",
      experience: "20+ Years Experience",
      livesTransformed: "5000+ Lives Transformed",
      certified: "Government Certified",
    },
    services: {
      title: "Comprehensive Treatment Offerings",
      subtitle: "Ancient Healing Arts for Modern Wellness",
      categories: {
        neurological: {
          title: "Paralysis & Neurological Disorders",
          conditions: ["Paralysis", "Nervous system ailments", "Brain disorders", "Neurological rehabilitation"]
        },
        jointBone: {
          title: "Joint & Bone Problems",
          conditions: ["Joint pain", "Arthritis", "Gout", "Cervical spondylosis"]
        },
        spinal: {
          title: "Spinal Disorders",
          conditions: ["Sciatica", "Lumbar spondylosis", "Back pain", "Disc problems"]
        },
        respiratory: {
          title: "Respiratory Issues",
          conditions: ["Asthma", "Bronchitis", "Breathing problems", "Lung disorders"]
        },
        digestive: {
          title: "Digestive System Disorders",
          conditions: ["Acidity", "Piles (Hemorrhoids)", "Fistula", "Constipation"]
        },
        kidneyGallbladder: {
          title: "Kidney & Gallbladder Problems",
          conditions: ["Kidney stones", "Gallbladder stones", "Urinary disorders"]
        },
        skin: {
          title: "Skin Diseases",
          conditions: ["Psoriasis", "Eczema", "Fungal infections", "Allergies"]
        },
        obesity: {
          title: "Obesity & Weight Issues",
          conditions: ["Weight loss treatments", "Weight management", "Metabolic disorders"]
        },
        metabolic: {
          title: "Metabolic & Hormonal Disorders",
          conditions: ["Diabetes management", "Thyroid issues", "Hormonal imbalance"]
        },
        stress: {
          title: "Stress & Sleep Disorders",
          conditions: ["Stress management", "Insomnia", "Anxiety", "Depression"]
        },
        gynecological: {
          title: "Gynecological Disorders",
          conditions: ["Menstrual problems", "Infertility support", "PCOS", "Women's health"]
        },
        hair: {
          title: "Hair Problems",
          conditions: ["Hair fall", "Dandruff", "Baldness", "Scalp disorders"]
        },
        panchakarma: {
          title: "Panchakarma Therapies",
          conditions: ["Detoxification", "Rejuvenation", "Purification", "Body cleansing"]
        },
        beauty: {
          title: "Beauty & Cosmetic Treatments",
          conditions: ["Skin glow therapies", "Anti-aging", "Facial treatments", "Beauty enhancement"]
        },
        other: {
          title: "Other Ayurvedic Specialties",
          conditions: ["Chronic ailments", "Lifestyle diseases", "Preventive care", "Wellness programs"]
        }
      }
    },
    doctor: {
      name: "Dr. Chandrakumar Deshmukh",
      title: "Leading Viddhakarma & Agnikarma Specialist",
      specialization: "Panchakarma, Viddhakarma, Agnikarma Expert",
      experience: "20+ Years of Clinical Excellence",
      description: "Dr. Chandrakumar Deshmukh is a leading Viddhakarma and Agnikarma specialist in Chinchwad, Pune, who learned from the great Dr. R.B. Gogate sir and continued his research work in Viddhakarma and Agnikarma."
    },
    contact: {
      location: "Chinchwad, Pimpri-Chinchwad",
      address: "Dr. Chandrakumar Deshmukh, Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India",
      phone: "9860370961, 7709399925",
      opdTiming: "OPD Timing - Chinchwad",
      days: {
        monday: "Monday",
        tuesday: "Tuesday", 
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday"
      },
      closed: "Closed"
    },
    specialties: {
      viddhakarmaAutism: {
        title: "Viddhakarma in Autism",
        description: "Viddhakarma in autism is a new concept to many doctors and patients. Viddhakarma has its unique effect on brain-related disorders but it must be done accurately. There are very few students of Dr. Chandrakumar Deshmukh in India who know how to perform Viddhakarma in autistic patients."
      },
      viddhakarmaCP: {
        title: "Viddhakarma in Cerebral Palsy",
        description: "Cerebral palsy is a condition where there is birth brain injury due to hypoxic conditions. In such cases, Viddhakarma is a very successful treatment. Regeneration and rehabilitation is possible through Viddhakarma."
      },
      mentalHealth: {
        title: "Mental Health Services",
        description: "Mental health is just as important as physical health. We offer a range of mental health services through Viddhakarma, including counseling and therapy, to help you achieve optimal well-being."
      },
      panchakarmaSpecial: {
        title: "Specialized Panchakarma",
        description: "Panchakarma is the life of Ayurveda like Viddhakarma and Agnikarma. Dr. Chandrakumar Deshmukh has mastery in carrying out Vaman for special children and difficult patients."
      },
      affordability: {
        title: "Affordable Treatment",
        description: "We don't charge for daily Viddhakarma and Agnikarma treatments. Quality healthcare should be accessible to everyone."
      },
      wellnessRetreats: {
        title: "Wellness Retreats",
        description: "Take a break from everyday stress and join our wellness retreats. Designed to help you relax, rejuvenate, and connect with like-minded individuals through nature, healthy food, and transformative experiences."
      }
    },
    whyChooseUs: {
      title: "Why Choose Shri Vishwamurti Ayurvedalay",
      subtitle: "Experience the difference of authentic Ayurvedic healing",
      features: {
        certified: {
          title: "Government Certified",
          description: "ISO 9001:2015 certified facility with authentic Ayurvedic treatments"
        },
        experience: {
          title: "20+ Years Experience",
          description: "Expert doctors with decades of experience in traditional Ayurveda"
        },
        transformed: {
          title: "5000+ Lives Transformed",
          description: "Thousands of patients have experienced complete healing and wellness"
        },
        personalized: {
          title: "Personalized Treatment",
          description: "Customized treatment plans based on individual constitution and needs"
        },
        natural: {
          title: "100% Natural Healing",
          description: "No side effects, only pure herbal medicines and natural therapies"
        },
        holistic: {
          title: "Holistic Approach",
          description: "Complete mind-body-soul healing for lasting transformation"
        }
      }
    },
    common: {
      readMore: "Read More",
      bookNow: "Book Now",
      learnMore: "Learn More",
      contactUs: "Contact Us",
      viewAll: "View All",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      freeConsultation: "Free Consultation",
      callNow: "Call Now",
      bookAppointment: "Book Appointment",
      getDirections: "Get Directions",
      noCharges: "No Daily Charges"
    }
  },
  hi: {
    nav: {
      home: "होम",
      treatments: "उपचार",
      panchakarma: "पंचकर्म",
      agnikarma: "अग्निकर्म",
      viddhakarma: "विद्धकर्म",
      ourTeam: "हमारी टीम",
      about: "हमारे बारे में",
      contact: "संपर्क",
      bookConsultation: "परामर्श बुक करें",
      liveChat: "लाइव चैट",
    },
    hero: {
      title1: "प्राचीन उपचार।",
      title2: "आधुनिक परिणाम।",
      title3: "दर्द-मुक्त जीवन",
      subtitle: "प्रामाणिक पंचकर्म, अग्निकर्म, विद्धकर्म और संपूर्ण आयुर्वेदिक समाधान का अनुभव करें",
      description: "जहाँ 5000 साल की उपचार बुद्धि आधुनिक उत्कृष्टता से मिलती है",
      bookConsultation: "निःशुल्क परामर्श बुक करें",
      callNow: "अभी कॉल करें: +91-9860370961",
      experience: "20+ साल का अनुभव",
      livesTransformed: "5000+ जीवन बदले गए",
      certified: "सरकारी प्रमाणित",
    },
    services: {
      title: "व्यापक उपचार सेवाएं",
      subtitle: "आधुनिक कल्याण के लिए प्राचीन उपचार कलाएं",
      categories: {
        neurological: {
          title: "लकवा और न्यूरोलॉजिकल विकार",
          conditions: ["लकवा", "तंत्रिका तंत्र की बीमारियां", "मस्तिष्क विकार", "न्यूरोलॉजिकल पुनर्वास"]
        },
        jointBone: {
          title: "जोड़ों और हड्डियों की समस्याएं",
          conditions: ["जोड़ों का दर्द", "गठिया", "गाउट", "सर्वाइकल स्पॉन्डिलोसिस"]
        },
        spinal: {
          title: "रीढ़ की हड्डी के विकार",
          conditions: ["साइटिका", "लम्बर स्पॉन्डिलोसिस", "पीठ दर्द", "डिस्क की समस्याएं"]
        },
        respiratory: {
          title: "श्वसन संबंधी समस्याएं",
          conditions: ["अस्थमा", "ब्रोंकाइटिस", "सांस की समस्याएं", "फेफड़ों के विकार"]
        },
        digestive: {
          title: "पाचन तंत्र के विकार",
          conditions: ["एसिडिटी", "बवासीर", "फिस्टुला", "कब्ज"]
        },
        kidneyGallbladder: {
          title: "किडनी और पित्ताशय की समस्याएं",
          conditions: ["किडनी स्टोन", "पित्त की पथरी", "मूत्र संबंधी विकार"]
        },
        skin: {
          title: "त्वचा रोग",
          conditions: ["सोरायसिस", "एक्जिमा", "फंगल इन्फेक्शन", "एलर्जी"]
        },
        obesity: {
          title: "मोटापा और वजन की समस्याएं",
          conditions: ["वजन घटाने का उपचार", "वजन प्रबंधन", "मेटाबॉलिक विकार"]
        },
        metabolic: {
          title: "मेटाबॉलिक और हार्मोनल विकार",
          conditions: ["मधुमेह प्रबंधन", "थायराइड की समस्याएं", "हार्मोनल असंतुलन"]
        },
        stress: {
          title: "तनाव और नींद के विकार",
          conditions: ["तनाव प्रबंधन", "अनिद्रा", "चिंता", "अवसाद"]
        },
        gynecological: {
          title: "स्त्री रोग संबंधी विकार",
          conditions: ["मासिक धर्म की समस्याएं", "बांझपन सहायता", "पीसीओएस", "महिला स्वास्थ्य"]
        },
        hair: {
          title: "बालों की समस्याएं",
          conditions: ["बाल झड़ना", "रूसी", "गंजापन", "खोपड़ी के विकार"]
        },
        panchakarma: {
          title: "पंचकर्म चिकित्सा",
          conditions: ["विषहरण", "कायाकल्प", "शुद्धिकरण", "शरीर की सफाई"]
        },
        beauty: {
          title: "सौंदर्य और कॉस्मेटिक उपचार",
          conditions: ["त्वचा की चमक चिकित्सा", "एंटी-एजिंग", "फेशियल ट्रीटमेंट", "सौंदर्य वृद्धि"]
        },
        other: {
          title: "अन्य आयुर्वेदिक विशेषताएं",
          conditions: ["पुरानी बीमारियां", "जीवनशैली की बीमारियां", "निवारक देखभाल", "कल्याण कार्यक्रम"]
        }
      }
    },
    doctor: {
      name: "डॉ. चंद्रकुमार देशमुख",
      title: "अग्रणी विद्धकर्म और अग्निकर्म विशेषज्ञ",
      specialization: "पंचकर्म, विद्धकर्म, अग्निकर्म विशेषज्ञ",
      experience: "20+ साल की नैदानिक उत्कृष्टता",
      description: "डॉ. चंद्रकुमार देशमुख चिंचवड, पुणे के एक अग्रणी विद्धकर्म और अग्निकर्म विशेषज्ञ हैं, जिन्होंने महान डॉ. आर.बी. गोगटे सर से सीखा और विद्धकर्म और अग्निकर्म में अपना अनुसंधान कार्य जारी रखा।"
    },
    contact: {
      location: "चिंचवड, पिंपरी-चिंचवड",
      address: "डॉ. चंद्रकुमार देशमुख, मोराया गणपति मंदिर रोड, गांधी पेठ, चिंचवड गांव, चिंचवड, पिंपरी-चिंचवड, महाराष्ट्र, भारत",
      phone: "9860370961, 7709399925",
      opdTiming: "ओपीडी समय - चिंचवड",
      days: {
        monday: "सोमवार",
        tuesday: "मंगलवार",
        wednesday: "बुधवार", 
        thursday: "गुरुवार",
        friday: "शुक्रवार",
        saturday: "शनिवार",
        sunday: "रविवार"
      },
      closed: "बंद"
    },
    specialties: {
      viddhakarmaAutism: {
        title: "ऑटिज्म में विद्धकर्म",
        description: "ऑटिज्म में विद्धकर्म कई डॉक्टरों और मरीजों के लिए एक नई अवधारणा है। विद्धकर्म का मस्तिष्क संबंधी विकारों पर अनूठा प्रभाव है लेकिन इसे सटीक रूप से किया जाना चाहिए।"
      },
      viddhakarmaCP: {
        title: "सेरेब्रल पाल्सी में विद्धकर्म",
        description: "सेरेब्रल पाल्सी एक ऐसी स्थिति है जहां हाइपोक्सिक स्थितियों के कारण जन्म के समय मस्तिष्क की चोट होती है। ऐसे मामलों में विद्धकर्म एक बहुत सफल उपचार है।"
      },
      mentalHealth: {
        title: "मानसिक स्वास्थ्य सेवाएं",
        description: "मानसिक स्वास्थ्य शारीरिक स्वास्थ्य जितना ही महत्वपूर्ण है। हम विद्धकर्म के माध्यम से मानसिक स्वास्थ्य सेवाओं की एक श्रृंखला प्रदान करते हैं।"
      },
      panchakarmaSpecial: {
        title: "विशेष पंचकर्म",
        description: "पंचकर्म आयुर्वेद का जीवन है जैसे विद्धकर्म और अग्निकर्म। डॉ. चंद्रकुमार देशमुख को विशेष बच्चों के लिए वमन करने में महारत हासिल है।"
      },
      affordability: {
        title: "किफायती उपचार",
        description: "हम दैनिक विद्धकर्म और अग्निकर्म उपचार के लिए शुल्क नहीं लेते। गुणवत्तापूर्ण स्वास्थ्य सेवा सभी के लिए सुलभ होनी चाहिए।"
      },
      wellnessRetreats: {
        title: "कल्याण रिट्रीट",
        description: "रोजमर्रा के तनाव से ब्रेक लें और हमारे कल्याण रिट्रीट में शामिल हों। प्रकृति, स्वस्थ भोजन और परिवर्तनकारी अनुभवों के माध्यम से आराम और कायाकल्प के लिए डिज़ाइन किया गया।"
      }
    },
    whyChooseUs: {
      title: "श्री विश्वमूर्ति आयुर्वेदालय क्यों चुनें",
      subtitle: "प्रामाणिक आयुर्वेदिक उपचार का अंतर अनुभव करें",
      features: {
        certified: {
          title: "सरकारी प्रमाणित",
          description: "प्रामाणिक आयुर्वेदिक उपचार के साथ ISO 9001:2015 प्रमाणित सुविधा"
        },
        experience: {
          title: "20+ साल का अनुभव",
          description: "पारंपरिक आयुर्वेद में दशकों के अनुभव वाले विशेषज्ञ डॉक्टर"
        },
        transformed: {
          title: "5000+ जीवन बदले गए",
          description: "हजारों मरीजों ने संपूर्ण उपचार और कल्याण का अनुभव किया है"
        },
        personalized: {
          title: "व्यक्तिगत उपचार",
          description: "व्यक्तिगत संविधान और आवश्यकताओं के आधार पर अनुकूलित उपचार योजना"
        },
        natural: {
          title: "100% प्राकृतिक उपचार",
          description: "कोई साइड इफेक्ट नहीं, केवल शुद्ध हर्बल दवाएं और प्राकृतिक चिकित्सा"
        },
        holistic: {
          title: "समग्र दृष्टिकोण",
          description: "स्थायी परिवर्तन के लिए संपूर्ण मन-शरीर-आत्मा उपचार"
        }
      }
    },
    common: {
      readMore: "और पढ़ें",
      bookNow: "अभी बुक करें",
      learnMore: "और जानें",
      contactUs: "संपर्क करें",
      viewAll: "सभी देखें",
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफलता",
      freeConsultation: "निःशुल्क परामर्श",
      callNow: "अभी कॉल करें",
      bookAppointment: "अपॉइंटमेंट बुक करें",
      getDirections: "दिशा निर्देश प्राप्त करें",
      noCharges: "कोई दैनिक शुल्क नहीं"
    }
  },
  mr: {
    nav: {
      home: "होम",
      treatments: "उपचार",
      panchakarma: "पंचकर्म",
      agnikarma: "अग्निकर्म",
      viddhakarma: "विद्धकर्म",
      ourTeam: "आमची टीम",
      about: "आमच्याबद्दल",
      contact: "संपर्क",
      bookConsultation: "सल्ला बुक करा",
      liveChat: "लाइव्ह चॅट",
    },
    hero: {
      title1: "प्राचीन उपचार।",
      title2: "आधुनिक परिणाम।",
      title3: "वेदना-मुक्त जीवन",
      subtitle: "प्रामाणिक पंचकर्म, अग्निकर्म, विद्धकर्म आणि संपूर्ण आयुर्वेदिक उपायांचा अनुभव घ्या",
      description: "जिथे 5000 वर्षांचे उपचार ज्ञान आधुनिक उत्कृष्टतेला भेटते",
      bookConsultation: "मोफत सल्ला बुक करा",
      callNow: "आता कॉल करा: +91-9860370961",
      experience: "20+ वर्षांचा अनुभव",
      livesTransformed: "5000+ जीवन बदलले",
      certified: "सरकारी प्रमाणित",
    },
    services: {
      title: "व्यापक उपचार सेवा",
      subtitle: "आधुनिक कल्याणासाठी प्राचीन उपचार कला",
      categories: {
        neurological: {
          title: "अर्धांगवायू आणि न्यूरोलॉजिकल विकार",
          conditions: ["अर्धांगवायू", "मज्जासंस्थेचे आजार", "मेंदूचे विकार", "न्यूरोलॉजिकल पुनर्वसन"]
        },
        jointBone: {
          title: "सांधे आणि हाडांच्या समस्या",
          conditions: ["सांध्यांचे दुखणे", "संधिवात", "गाउट", "ग्रीवा स्पॉन्डिलोसिस"]
        },
        spinal: {
          title: "पाठीच्या कण्याचे विकार",
          conditions: ["सायटिका", "लंबर स्पॉन्डिलोसिस", "पाठदुखी", "डिस्कच्या समस्या"]
        },
        respiratory: {
          title: "श्वसन संबंधी समस्या",
          conditions: ["दमा", "ब्राँकायटिस", "श्वासाच्या समस्या", "फुफ्फुसाचे विकार"]
        },
        digestive: {
          title: "पचनसंस्थेचे विकार",
          conditions: ["आम्लपित्त", "मूळव्याध", "भगंदर", "बद्धकोष्ठता"]
        },
        kidneyGallbladder: {
          title: "मूत्रपिंड आणि पित्ताशयाच्या समस्या",
          conditions: ["मूत्रपिंडाचे दगड", "पित्ताशयाचे दगड", "मूत्र संबंधी विकार"]
        },
        skin: {
          title: "त्वचारोग",
          conditions: ["सोरायसिस", "एक्जिमा", "बुरशीजन्य संसर्ग", "ऍलर्जी"]
        },
        obesity: {
          title: "लठ्ठपणा आणि वजनाच्या समस्या",
          conditions: ["वजन कमी करण्याचे उपचार", "वजन व्यवस्थापन", "चयापचय विकार"]
        },
        metabolic: {
          title: "चयापचय आणि हार्मोनल विकार",
          conditions: ["मधुमेह व्यवस्थापन", "थायरॉईडच्या समस्या", "हार्मोनल असंतुलन"]
        },
        stress: {
          title: "तणाव आणि झोपेचे विकार",
          conditions: ["तणाव व्यवस्थापन", "निद्रानाश", "चिंता", "नैराश्य"]
        },
        gynecological: {
          title: "स्त्रीरोग संबंधी विकार",
          conditions: ["मासिक पाळीच्या समस्या", "वंध्यत्व सहाय्य", "पीसीओएस", "महिला आरोग्य"]
        },
        hair: {
          title: "केसांच्या समस्या",
          conditions: ["केस गळणे", "कोंडा", "टक्कल पडणे", "टाळूचे विकार"]
        },
        panchakarma: {
          title: "पंचकर्म चिकित्सा",
          conditions: ["विषहरण", "कायाकल्प", "शुद्धीकरण", "शरीर साफसफाई"]
        },
        beauty: {
          title: "सौंदर्य आणि कॉस्मेटिक उपचार",
          conditions: ["त्वचेची चमक चिकित्सा", "वयोवृद्धत्व विरोधी", "फेशियल ट्रीटमेंट", "सौंदर्य वाढ"]
        },
        other: {
          title: "इतर आयुर्वेदिक विशेषता",
          conditions: ["जुनाट आजार", "जीवनशैलीचे आजार", "प्रतिबंधात्मक काळजी", "कल्याण कार्यक्रम"]
        }
      }
    },
    doctor: {
      name: "डॉ. चंद्रकुमार देशमुख",
      title: "आघाडीचे विद्धकर्म आणि अग्निकर्म तज्ञ",
      specialization: "पंचकर्म, विद्धकर्म, अग्निकर्म तज्ञ",
      experience: "20+ वर्षांची क्लिनिकल उत्कृष्टता",
      description: "डॉ. चंद्रकुमार देशमुख हे चिंचवड, पुण्यातील आघाडीचे विद्धकर्म आणि अग्निकर्म तज्ञ आहेत, ज्यांनी महान डॉ. आर.बी. गोगटे सर यांच्याकडून शिकले आणि विद्धकर्म आणि अग्निकर्मातील संशोधन कार्य सुरू ठेवले."
    },
    contact: {
      location: "चिंचवड, पिंपरी-चिंचवड",
      address: "डॉ. चंद्रकुमार देशमुख, मोराया गणपती मंदिर रोड, गांधी पेठ, चिंचवड गाव, चिंचवड, पिंपरी-चिंचवड, महाराष्ट्र, भारत",
      phone: "9860370961, 7709399925",
      opdTiming: "ओपीडी वेळ - चिंचवड",
      days: {
        monday: "सोमवार",
        tuesday: "मंगळवार",
        wednesday: "बुधवार",
        thursday: "गुरुवार", 
        friday: "शुक्रवार",
        saturday: "शनिवार",
        sunday: "रविवार"
      },
      closed: "बंद"
    },
    specialties: {
      viddhakarmaAutism: {
        title: "ऑटिझममध्ये विद्धकर्म",
        description: "ऑटिझममध्ये विद्धकर्म ही अनेक डॉक्टर आणि रुग्णांसाठी नवीन संकल्पना आहे. विद्धकर्माचा मेंदू संबंधी विकारांवर अनोखा प्रभाव आहे परंतु ते अचूकपणे केले पाहिजे."
      },
      viddhakarmaCP: {
        title: "सेरेब्रल पाल्सीमध्ये विद्धकर्म",
        description: "सेरेब्रल पाल्सी ही अशी स्थिती आहे जिथे हायपोक्सिक परिस्थितीमुळे जन्माच्या वेळी मेंदूला दुखापत होते. अशा प्रकरणांमध्ये विद्धकर्म हा अतिशय यशस्वी उपचार आहे."
      },
      mentalHealth: {
        title: "मानसिक आरोग्य सेवा",
        description: "मानसिक आरोग्य हे शारीरिक आरोग्याइतकेच महत्त्वाचे आहे. आम्ही विद्धकर्माद्वारे मानसिक आरोग्य सेवांची श्रेणी प्रदान करतो."
      },
      panchakarmaSpecial: {
        title: "विशेष पंचकर्म",
        description: "पंचकर्म हे आयुर्वेदाचे जीवन आहे जसे विद्धकर्म आणि अग्निकर्म. डॉ. चंद्रकुमार देशमुख यांना विशेष मुलांसाठी वमन करण्यात प्रभुत्व आहे."
      },
      affordability: {
        title: "परवडणारे उपचार",
        description: "आम्ही दैनंदिन विद्धकर्म आणि अग्निकर्म उपचारांसाठी शुल्क आकारत नाही. दर्जेदार आरोग्य सेवा सर्वांसाठी उपलब्ध असावी."
      },
      wellnessRetreats: {
        title: "कल्याण रिट्रीट",
        description: "दैनंदिन तणावापासून विश्रांती घ्या आणि आमच्या कल्याण रिट्रीटमध्ये सामील व्हा. निसर्ग, आरोग्यदायी अन्न आणि परिवर्तनकारी अनुभवांद्वारे विश्रांती आणि कायाकल्पासाठी डिझाइन केलेले."
      }
    },
    whyChooseUs: {
      title: "श्री विश्वमूर्ति आयुर्वेदालय का निवडा",
      subtitle: "प्रामाणिक आयुर्वेदिक उपचाराचा फरक अनुभवा",
      features: {
        certified: {
          title: "सरकारी प्रमाणित",
          description: "प्रामाणिक आयुर्वेदिक उपचारांसह ISO 9001:2015 प्रमाणित सुविधा"
        },
        experience: {
          title: "20+ वर्षांचा अनुभव",
          description: "पारंपरिक आयुर्वेदात दशकांचा अनुभव असलेले तज्ञ डॉक्टर"
        },
        transformed: {
          title: "5000+ जीवन बदलले",
          description: "हजारो रुग्णांनी संपूर्ण उपचार आणि कल्याणाचा अनुभव घेतला आहे"
        },
        personalized: {
          title: "वैयक्तिक उपचार",
          description: "वैयक्तिक संविधान आणि गरजांवर आधारित सानुकूलित उपचार योजना"
        },
        natural: {
          title: "100% नैसर्गिक उपचार",
          description: "कोणतेही साइड इफेक्ट नाहीत, फक्त शुद्ध हर्बल औषधे आणि नैसर्गिक चिकित्सा"
        },
        holistic: {
          title: "समग्र दृष्टिकोन",
          description: "चिरस्थायी परिवर्तनासाठी संपूर्ण मन-शरीर-आत्मा उपचार"
        }
      }
    },
    common: {
      readMore: "अधिक वाचा",
      bookNow: "आता बुक करा",
      learnMore: "अधिक जाणून घ्या",
      contactUs: "संपर्क साधा",
      viewAll: "सर्व पहा",
      loading: "लोड होत आहे...",
      error: "त्रुटी",
      success: "यश",
      freeConsultation: "मोफत सल्ला",
      callNow: "आता कॉल करा",
      bookAppointment: "भेटीची वेळ बुक करा",
      getDirections: "दिशा निर्देश मिळवा",
      noCharges: "कोणतेही दैनिक शुल्क नाही"
    }
  }
};

export function getTranslation(language: Language): Translation {
  return translations[language] || translations.en;
}
