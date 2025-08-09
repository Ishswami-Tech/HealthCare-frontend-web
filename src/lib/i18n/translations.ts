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
    title: {
      line1: string;
      line2: string;
      line3: string;
    };
    subtitle: string;
    description: string;
    cta: {
      primary: string;
      secondary: string;
    };
    stats: {
      experience: string;
      livesTransformed: string;
      successRate: string;
      patientRating: string;
    };
  };
  
  // Doctor Information
  doctor: {
    name: string;
    title: string;
    specialization: string;
    experience: string;
    expertise: string[];
    contact: {
      phone1: string;
      phone2: string;
      location: string;
      address: string;
    };
    opdTiming: {
      title: string;
      days: string[];
      hours: string;
      closed: string;
    };
  };
  
  // Treatments
  treatments: {
    viddhakarma: {
      title: string;
      subtitle: string;
      description: string;
      autism: {
        title: string;
        description: string;
        uniqueEffect: string;
        expertise: string;
      };
      cerebralPalsy: {
        title: string;
        description: string;
        causes: string[];
        benefits: string;
      };
      mentalHealth: {
        title: string;
        description: string;
        services: string[];
      };
    };
    agnikarma: {
      title: string;
      subtitle: string;
      description: string;
    };
    panchakarma: {
      title: string;
      subtitle: string;
      description: string;
      specialization: string;
      treatments: string[];
    };
  };
  
  // Services
  services: {
    title: string;
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
      stressSleep: {
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
      beauty: {
        title: string;
        conditions: string[];
      };
      chronic: {
        title: string;
        conditions: string[];
      };
    };
  };
  
  // Special Features
  features: {
    affordability: {
      title: string;
      description: string;
    };
    wellnessRetreats: {
      title: string;
      description: string;
    };
  };
  
  // Common
  common: {
    readMore: string;
    bookNow: string;
    contactUs: string;
    learnMore: string;
    viewAll: string;
    close: string;
    open: string;
    loading: string;
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
      title: {
        line1: "Ancient Wisdom.",
        line2: "Complete Healing.",
        line3: "Transform Your Life"
      },
      subtitle: "Experience Authentic Panchakarma, Agnikarma, Viddhakarma & Complete Ayurvedic Solutions",
      description: "Where 5000-Year Healing Wisdom Meets Modern Excellence",
      cta: {
        primary: "Book Free Consultation",
        secondary: "Call Now: +91-9860370961"
      },
      stats: {
        experience: "20+ Years Experience",
        livesTransformed: "5000+ Lives Transformed",
        successRate: "95% Success Rate",
        patientRating: "4.9★ Patient Rating"
      }
    },
    doctor: {
      name: "Dr. Chandrakumar Deshmukh",
      title: "Leading Viddhakarma & Agnikarma Specialist",
      specialization: "Specialized in Neurological Disorders, Autism, Cerebral Palsy",
      experience: "Student of The Great Dr. R.B. Gogate Sir",
      expertise: [
        "Viddhakarma in Autism - Revolutionary Treatment",
        "Cerebral Palsy Rehabilitation through Viddhakarma",
        "Mental Health Services with Ayurvedic Approach",
        "Advanced Panchakarma Therapies",
        "Agnikarma for Pain Management"
      ],
      contact: {
        phone1: "9860370961",
        phone2: "7709399925",
        location: "Chinchwad, Pune",
        address: "Moraya Ganapati Mandir Road, Gandhi Peth, Chinchwad Gaon, Chinchwad, Pimpri-Chinchwad, Maharashtra, India"
      },
      opdTiming: {
        title: "OPD Timing - Chinchwad",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        hours: "11:45 AM – 11:30 PM",
        closed: "Saturday & Sunday - Closed"
      }
    },
    treatments: {
      viddhakarma: {
        title: "Viddhakarma",
        subtitle: "Revolutionary Surgical Procedures in Ayurveda",
        description: "Advanced Ayurvedic surgical techniques with proven results in neurological conditions",
        autism: {
          title: "Viddhakarma in Autism",
          description: "A groundbreaking approach to autism treatment that few doctors understand. Viddhakarma has unique effects on brain-related disorders when performed with precision.",
          uniqueEffect: "Unique neurological impact with precise application",
          expertise: "Very few students of Dr. Chandrakumar Deshmukh in India know how to perform Viddhakarma in autistic patients."
        },
        cerebralPalsy: {
          title: "Viddhakarma in Cerebral Palsy",
          description: "Cerebral palsy results from birth brain injury due to hypoxic conditions. Viddhakarma offers successful treatment for regeneration and rehabilitation.",
          causes: ["Hypoglycemia", "Viral encephalitis", "Post-fever complications"],
          benefits: "Regeneration and rehabilitation through precise Viddhakarma techniques"
        },
        mentalHealth: {
          title: "Mental Health Services",
          description: "Mental health is as important as physical health. We offer comprehensive mental health services through Viddhakarma.",
          services: ["Counseling and Therapy", "Stress Management", "Anxiety Treatment", "Depression Support"]
        }
      },
      agnikarma: {
        title: "Agnikarma",
        subtitle: "Thermal Cautery Therapy",
        description: "Ancient fire therapy for pain management and healing"
      },
      panchakarma: {
        title: "Panchakarma",
        subtitle: "Complete Detoxification & Rejuvenation",
        description: "Panchakarma is the life of Ayurveda, just like Viddhakarma and Agnikarma.",
        specialization: "Dr. Chandrakumar Deshmukh has mastery in carrying out Vaman for special children",
        treatments: ["Basti", "Virechan", "Vaman", "Nasya", "Raktamokshana"]
      }
    },
    services: {
      title: "Comprehensive Treatment Categories",
      categories: {
        neurological: {
          title: "Paralysis & Neurological Disorders",
          conditions: ["Paralysis", "Nervous system ailments", "Autism", "Cerebral Palsy"]
        },
        jointBone: {
          title: "Joint & Bone Problems",
          conditions: ["Joint pain", "Arthritis", "Gout", "Cervical spondylosis"]
        },
        spinal: {
          title: "Spinal Disorders",
          conditions: ["Sciatica", "Lumbar spondylosis"]
        },
        respiratory: {
          title: "Respiratory Issues",
          conditions: ["Asthma", "Bronchitis"]
        },
        digestive: {
          title: "Digestive System Disorders",
          conditions: ["Acidity", "Piles (hemorrhoids)", "Fistula", "Constipation"]
        },
        kidneyGallbladder: {
          title: "Kidney & Gallbladder Problems",
          conditions: ["Kidney stones", "Gallbladder stones"]
        },
        skin: {
          title: "Skin Diseases",
          conditions: ["Psoriasis", "Eczema", "Fungal infections", "Allergies"]
        },
        obesity: {
          title: "Obesity & Weight Issues",
          conditions: ["Weight loss treatments", "Weight management"]
        },
        metabolic: {
          title: "Metabolic & Hormonal Disorders",
          conditions: ["Diabetes management", "Thyroid-related issues"]
        },
        stressSleep: {
          title: "Stress & Sleep Disorders",
          conditions: ["Stress", "Insomnia", "Anxiety"]
        },
        gynecological: {
          title: "Gynecological Disorders",
          conditions: ["Menstrual problems", "Infertility support"]
        },
        hair: {
          title: "Hair Problems",
          conditions: ["Hair fall", "Dandruff"]
        },
        beauty: {
          title: "Beauty & Cosmetic Treatments",
          conditions: ["Skin glow therapies", "Anti-aging treatments"]
        },
        chronic: {
          title: "Other Ayurvedic Specialties",
          conditions: ["Chronic ailments", "Lifestyle disease management"]
        }
      }
    },
    features: {
      affordability: {
        title: "Affordable Excellence",
        description: "We don't charge for daily Viddhakarma and Agnikarma treatments. Quality healthcare should be accessible to all."
      },
      wellnessRetreats: {
        title: "Wellness Retreats",
        description: "Take a break from everyday stress. Our retreats help you relax, rejuvenate, and connect with like-minded individuals through nature, healthy food, and transformative experiences."
      }
    },
    common: {
      readMore: "Read More",
      bookNow: "Book Now",
      contactUs: "Contact Us",
      learnMore: "Learn More",
      viewAll: "View All",
      close: "Close",
      open: "Open",
      loading: "Loading..."
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
      title: {
        line1: "प्राचीन ज्ञान।",
        line2: "संपूर्ण उपचार।",
        line3: "अपना जीवन बदलें"
      },
      subtitle: "प्रामाणिक पंचकर्म, अग्निकर्म, विद्धकर्म और संपूर्ण आयुर्वेदिक समाधान का अनुभव करें",
      description: "जहाँ 5000 साल का उपचार ज्ञान आधुनिक उत्कृष्टता से मिलता है",
      cta: {
        primary: "निःशुल्क परामर्श बुक करें",
        secondary: "अभी कॉल करें: +91-9860370961"
      },
      stats: {
        experience: "20+ साल का अनुभव",
        livesTransformed: "5000+ जीवन बदले गए",
        successRate: "95% सफलता दर",
        patientRating: "4.9★ मरीज़ रेटिंग"
      }
    },
    doctor: {
      name: "डॉ. चंद्रकुमार देशमुख",
      title: "अग्रणी विद्धकर्म और अग्निकर्म विशेषज्ञ",
      specialization: "न्यूरोलॉजिकल डिसऑर्डर, ऑटिज्म, सेरेब्रल पाल्सी में विशेषज्ञता",
      experience: "महान डॉ. आर.बी. गोगटे सर के शिष्य",
      expertise: [
        "ऑटिज्म में विद्धकर्म - क्रांतिकारी उपचार",
        "विद्धकर्म के माध्यम से सेरेब्रल पाल्सी पुनर्वास",
        "आयुर्वेदिक दृष्टिकोण के साथ मानसिक स्वास्थ्य सेवाएं",
        "उन्नत पंचकर्म चिकित्सा",
        "दर्द प्रबंधन के लिए अग्निकर्म"
      ],
      contact: {
        phone1: "9860370961",
        phone2: "7709399925",
        location: "चिंचवड, पुणे",
        address: "मोरया गणपति मंदिर रोड, गांधी पेठ, चिंचवड गांव, चिंचवड, पिंपरी-चिंचवड, महाराष्ट्र, भारत"
      },
      opdTiming: {
        title: "ओपीडी समय - चिंचवड",
        days: ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार"],
        hours: "11:45 AM – 11:30 PM",
        closed: "शनिवार और रविवार - बंद"
      }
    },
    treatments: {
      viddhakarma: {
        title: "विद्धकर्म",
        subtitle: "आयुर्वेद में क्रांतिकारी शल्य प्रक्रियाएं",
        description: "न्यूरोलॉजिकल स्थितियों में सिद्ध परिणामों के साथ उन्नत आयुर्वेदिक शल्य तकनीकें",
        autism: {
          title: "ऑटिज्म में विद्धकर्म",
          description: "ऑटिज्म उपचार के लिए एक अभूतपूर्व दृष्टिकोण जिसे कुछ डॉक्टर समझते हैं। विद्धकर्म का मस्तिष्क संबंधी विकारों पर अनूठा प्रभाव होता है जब सटीकता से किया जाता है।",
          uniqueEffect: "सटीक अनुप्रयोग के साथ अनूठा न्यूरोलॉजिकल प्रभाव",
          expertise: "भारत में डॉ. चंद्रकुमार देशमुख के बहुत कम छात्र जानते हैं कि ऑटिस्टिक रोगियों में विद्धकर्म कैसे करना है।"
        },
        cerebralPalsy: {
          title: "सेरेब्रल पाल्सी में विद्धकर्म",
          description: "सेरेब्रल पाल्सी हाइपोक्सिक स्थितियों के कारण जन्म के समय मस्तिष्क की चोट का परिणाम है। विद्धकर्म पुनर्जनन और पुनर्वास के लिए सफल उपचार प्रदान करता है।",
          causes: ["हाइपोग्लाइसीमिया", "वायरल एन्सेफलाइटिस", "बुखार के बाद की जटिलताएं"],
          benefits: "सटीक विद्धकर्म तकनीकों के माध्यम से पुनर्जनन और पुनर्वास"
        },
        mentalHealth: {
          title: "मानसिक स्वास्थ्य सेवाएं",
          description: "मानसिक स्वास्थ्य शारीरिक स्वास्थ्य जितना ही महत्वपूर्ण है। हम विद्धकर्म के माध्यम से व्यापक मानसिक स्वास्थ्य सेवाएं प्रदान करते हैं।",
          services: ["परामर्श और चिकित्सा", "तनाव प्रबंधन", "चिंता उपचार", "अवसाद सहायता"]
        }
      },
      agnikarma: {
        title: "अग्निकर्म",
        subtitle: "थर्मल कॉटरी थेरेपी",
        description: "दर्द प्रबंधन और उपचार के लिए प्राचीन अग्नि चिकित्सा"
      },
      panchakarma: {
        title: "पंचकर्म",
        subtitle: "संपूर्ण विषहरण और कायाकल्प",
        description: "पंचकर्म आयुर्वेद का जीवन है, जैसे विद्धकर्म और अग्निकर्म।",
        specialization: "डॉ. चंद्रकुमार देशमुख को विशेष बच्चों के लिए वमन करने में महारत हासिल है",
        treatments: ["बस्ति", "विरेचन", "वमन", "नस्य", "रक्तमोक्षण"]
      }
    },
    services: {
      title: "व्यापक उपचार श्रेणियां",
      categories: {
        neurological: {
          title: "पक्षाघात और न्यूरोलॉजिकल विकार",
          conditions: ["पक्षाघात", "तंत्रिका तंत्र की बीमारियां", "ऑटिज्म", "सेरेब्रल पाल्सी"]
        },
        jointBone: {
          title: "जोड़ों और हड्डियों की समस्याएं",
          conditions: ["जोड़ों का दर्द", "गठिया", "गाउट", "सर्वाइकल स्पॉन्डिलोसिस"]
        },
        spinal: {
          title: "रीढ़ की हड्डी के विकार",
          conditions: ["साइटिका", "लम्बर स्पॉन्डिलोसिस"]
        },
        respiratory: {
          title: "श्वसन संबंधी समस्याएं",
          conditions: ["अस्थमा", "ब्रोंकाइटिस"]
        },
        digestive: {
          title: "पाचन तंत्र के विकार",
          conditions: ["एसिडिटी", "बवासीर", "फिस्टुला", "कब्ज"]
        },
        kidneyGallbladder: {
          title: "किडनी और पित्ताशय की समस्याएं",
          conditions: ["किडनी स्टोन", "पित्त की पथरी"]
        },
        skin: {
          title: "त्वचा रोग",
          conditions: ["सोरायसिस", "एक्जिमा", "फंगल इन्फेक्शन", "एलर्जी"]
        },
        obesity: {
          title: "मोटापा और वजन की समस्याएं",
          conditions: ["वजन घटाने का उपचार", "वजन प्रबंधन"]
        },
        metabolic: {
          title: "चयापचय और हार्मोनल विकार",
          conditions: ["मधुमेह प्रबंधन", "थायराइड संबंधी समस्याएं"]
        },
        stressSleep: {
          title: "तनाव और नींद के विकार",
          conditions: ["तनाव", "अनिद्रा", "चिंता"]
        },
        gynecological: {
          title: "स्त्री रोग संबंधी विकार",
          conditions: ["मासिक धर्म की समस्याएं", "बांझपन सहायता"]
        },
        hair: {
          title: "बालों की समस्याएं",
          conditions: ["बाल झड़ना", "रूसी"]
        },
        beauty: {
          title: "सौंदर्य और कॉस्मेटिक उपचार",
          conditions: ["त्वचा की चमक चिकित्सा", "एंटी-एजिंग उपचार"]
        },
        chronic: {
          title: "अन्य आयुर्वेदिक विशेषताएं",
          conditions: ["पुरानी बीमारियां", "जीवनशैली रोग प्रबंधन"]
        }
      }
    },
    features: {
      affordability: {
        title: "किफायती उत्कृष्टता",
        description: "हम दैनिक विद्धकर्म और अग्निकर्म उपचार के लिए शुल्क नहीं लेते। गुणवत्तापूर्ण स्वास्थ्य सेवा सभी के लिए सुलभ होनी चाहिए।"
      },
      wellnessRetreats: {
        title: "कल्याण रिट्रीट",
        description: "रोजमर्रा के तनाव से ब्रेक लें। हमारे रिट्रीट आपको प्रकृति, स्वस्थ भोजन और परिवर्तनकारी अनुभवों के माध्यम से आराम करने, कायाकल्प करने और समान विचारधारा वाले व्यक्तियों से जुड़ने में मदद करते हैं।"
      }
    },
    common: {
      readMore: "और पढ़ें",
      bookNow: "अभी बुक करें",
      contactUs: "संपर्क करें",
      learnMore: "और जानें",
      viewAll: "सभी देखें",
      close: "बंद करें",
      open: "खुला",
      loading: "लोड हो रहा है..."
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
      title: {
        line1: "प्राचीन ज्ञान।",
        line2: "संपूर्ण उपचार।",
        line3: "तुमचे जीवन बदला"
      },
      subtitle: "प्रामाणिक पंचकर्म, अग्निकर्म, विद्धकर्म आणि संपूर्ण आयुर्वेदिक उपायांचा अनुभव घ्या",
      description: "जिथे 5000 वर्षांचे उपचार ज्ञान आधुनिक उत्कृष्टतेला भेटते",
      cta: {
        primary: "मोफत सल्ला बुक करा",
        secondary: "आता कॉल करा: +91-9860370961"
      },
      stats: {
        experience: "20+ वर्षांचा अनुभव",
        livesTransformed: "5000+ जीवन बदलले",
        successRate: "95% यश दर",
        patientRating: "4.9★ रुग्ण रेटिंग"
      }
    },
    doctor: {
      name: "डॉ. चंद्रकुमार देशमुख",
      title: "आघाडीचे विद्धकर्म आणि अग्निकर्म तज्ञ",
      specialization: "न्यूरोलॉजिकल डिसऑर्डर, ऑटिझम, सेरेब्रल पाल्सीमध्ये तज्ञता",
      experience: "महान डॉ. आर.बी. गोगटे सरांचे शिष्य",
      expertise: [
        "ऑटिझममध्ये विद्धकर्म - क्रांतिकारी उपचार",
        "विद्धकर्माद्वारे सेरेब्रल पाल्सी पुनर्वसन",
        "आयुर्वेदिक दृष्टिकोनासह मानसिक आरोग्य सेवा",
        "प्रगत पंचकर्म चिकित्सा",
        "वेदना व्यवस्थापनासाठी अग्निकर्म"
      ],
      contact: {
        phone1: "9860370961",
        phone2: "7709399925",
        location: "चिंचवड, पुणे",
        address: "मोरया गणपती मंदिर रोड, गांधी पेठ, चिंचवड गाव, चिंचवड, पिंपरी-चिंचवड, महाराष्ट्र, भारत"
      },
      opdTiming: {
        title: "ओपीडी वेळ - चिंचवड",
        days: ["सोमवार", "मंगळवार", "बुधवार", "गुरुवार", "शुक्रवार"],
        hours: "11:45 AM – 11:30 PM",
        closed: "शनिवार आणि रविवार - बंद"
      }
    },
    treatments: {
      viddhakarma: {
        title: "विद्धकर्म",
        subtitle: "आयुर्वेदातील क्रांतिकारी शस्त्रक्रिया प्रक्रिया",
        description: "न्यूरोलॉजिकल स्थितींमध्ये सिद्ध परिणामांसह प्रगत आयुर्वेदिक शस्त्रक्रिया तंत्र",
        autism: {
          title: "ऑटिझममध्ये विद्धकर्म",
          description: "ऑटिझम उपचारासाठी एक अभूतपूर्व दृष्टिकोन जो काही डॉक्टरांना समजतो. विद्धकर्माचा मेंदूशी संबंधित विकारांवर अनोखा प्रभाव असतो जेव्हा अचूकतेने केला जातो.",
          uniqueEffect: "अचूक अनुप्रयोगासह अनोखा न्यूरोलॉजिकल प्रभाव",
          expertise: "भारतात डॉ. चंद्रकुमार देशमुखांचे फार कमी विद्यार्थी जाणतात की ऑटिस्टिक रुग्णांमध्ये विद्धकर्म कसे करावे."
        },
        cerebralPalsy: {
          title: "सेरेब्रल पाल्सीमध्ये विद्धकर्म",
          description: "सेरेब्रल पाल्सी हा हायपोक्सिक परिस्थितींमुळे जन्माच्या वेळी मेंदूच्या दुखापतीचा परिणाम आहे. विद्धकर्म पुनर्जनन आणि पुनर्वसनासाठी यशस्वी उपचार देतो.",
          causes: ["हायपोग्लायसेमिया", "व्हायरल एन्सेफलायटिस", "तापानंतरच्या गुंतागुंती"],
          benefits: "अचूक विद्धकर्म तंत्राद्वारे पुनर्जनन आणि पुनर्वसन"
        },
        mentalHealth: {
          title: "मानसिक आरोग्य सेवा",
          description: "मानसिक आरोग्य हे शारीरिक आरोग्याइतकेच महत्त्वाचे आहे. आम्ही विद्धकर्माद्वारे व्यापक मानसिक आरोग्य सेवा देतो.",
          services: ["समुपदेशन आणि चिकित्सा", "तणाव व्यवस्थापन", "चिंता उपचार", "नैराश्य सहाय्य"]
        }
      },
      agnikarma: {
        title: "अग्निकर्म",
        subtitle: "थर्मल कॉटरी थेरपी",
        description: "वेदना व्यवस्थापन आणि उपचारासाठी प्राचीन अग्नि चिकित्सा"
      },
      panchakarma: {
        title: "पंचकर्म",
        subtitle: "संपूर्ण विषहरण आणि कायाकल्प",
        description: "पंचकर्म हे आयुर्वेदाचे जीवन आहे, जसे विद्धकर्म आणि अग्निकर्म.",
        specialization: "डॉ. चंद्रकुमार देशमुखांना विशेष मुलांसाठी वमन करण्यात प्रभुत्व आहे",
        treatments: ["बस्ती", "विरेचन", "वमन", "नस्य", "रक्तमोक्षण"]
      }
    },
    services: {
      title: "व्यापक उपचार श्रेणी",
      categories: {
        neurological: {
          title: "अर्धांगवायू आणि न्यूरोलॉजिकल विकार",
          conditions: ["अर्धांगवायू", "मज्जासंस्थेचे आजार", "ऑटिझम", "सेरेब्रल पाल्सी"]
        },
        jointBone: {
          title: "सांधे आणि हाडांच्या समस्या",
          conditions: ["सांध्यांचे दुखणे", "संधिवात", "गाउट", "ग्रीवा स्पॉन्डिलोसिस"]
        },
        spinal: {
          title: "पाठीच्या कण्याचे विकार",
          conditions: ["सायटिका", "लंबर स्पॉन्डिलोसिस"]
        },
        respiratory: {
          title: "श्वसन संबंधी समस्या",
          conditions: ["दमा", "ब्राँकायटिस"]
        },
        digestive: {
          title: "पचनसंस्थेचे विकार",
          conditions: ["आम्लपित्त", "मूळव्याध", "भगंदर", "बद्धकोष्ठता"]
        },
        kidneyGallbladder: {
          title: "मूत्रपिंड आणि पित्ताशयाच्या समस्या",
          conditions: ["मूत्रपिंडाचे दगड", "पित्ताशयाचे दगड"]
        },
        skin: {
          title: "त्वचा रोग",
          conditions: ["सोरायसिस", "एक्जिमा", "बुरशीजन्य संसर्ग", "ऍलर्जी"]
        },
        obesity: {
          title: "लठ्ठपणा आणि वजनाच्या समस्या",
          conditions: ["वजन कमी करण्याचे उपचार", "वजन व्यवस्थापन"]
        },
        metabolic: {
          title: "चयापचय आणि हार्मोनल विकार",
          conditions: ["मधुमेह व्यवस्थापन", "थायरॉईड संबंधी समस्या"]
        },
        stressSleep: {
          title: "तणाव आणि झोपेचे विकार",
          conditions: ["तणाव", "निद्रानाश", "चिंता"]
        },
        gynecological: {
          title: "स्त्रीरोग संबंधी विकार",
          conditions: ["मासिक पाळीच्या समस्या", "वंध्यत्व सहाय्य"]
        },
        hair: {
          title: "केसांच्या समस्या",
          conditions: ["केस गळणे", "कोंडा"]
        },
        beauty: {
          title: "सौंदर्य आणि कॉस्मेटिक उपचार",
          conditions: ["त्वचेची चमक चिकित्सा", "वयोवृद्धत्व विरोधी उपचार"]
        },
        chronic: {
          title: "इतर आयुर्वेदिक विशेषता",
          conditions: ["जुनाट आजार", "जीवनशैली रोग व्यवस्थापन"]
        }
      }
    },
    features: {
      affordability: {
        title: "परवडणारी उत्कृष्टता",
        description: "आम्ही दैनंदिन विद्धकर्म आणि अग्निकर्म उपचारांसाठी शुल्क आकारत नाही. दर्जेदार आरोग्य सेवा सर्वांसाठी उपलब्ध असावी."
      },
      wellnessRetreats: {
        title: "कल्याण रिट्रीट",
        description: "दैनंदिन तणावापासून विश्रांती घ्या. आमचे रिट्रीट तुम्हाला निसर्ग, आरोग्यदायी अन्न आणि परिवर्तनकारी अनुभवांद्वारे आराम करण्यास, कायाकल्प करण्यास आणि समान विचारसरणीच्या व्यक्तींशी जोडण्यास मदत करतात."
      }
    },
    common: {
      readMore: "अधिक वाचा",
      bookNow: "आता बुक करा",
      contactUs: "आमच्याशी संपर्क साधा",
      learnMore: "अधिक जाणून घ्या",
      viewAll: "सर्व पहा",
      close: "बंद करा",
      open: "उघडा",
      loading: "लोड होत आहे..."
    }
  }
};

export const getTranslation = (language: Language): Translation => {
  return translations[language] || translations.en;
};
