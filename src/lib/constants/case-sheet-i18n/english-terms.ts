// Hindi and Marathi labels for the English-source case-sheet options: past
// history conditions, habit levels, personal history, side and stool-frequency
// options. Keys are the exact English strings stored today; the English label
// is the key itself.
//
// DRAFT: translations are for display only and should be reviewed by a
// clinician or native speaker before wider rollout.

export interface LocalizedLabels {
  readonly hi: string;
  readonly mr: string;
}

export const ENGLISH_TERM_TRANSLATIONS: Readonly<Record<string, LocalizedLabels>> = {
  // Past history conditions
  "DM-IDDM": { hi: "मधुमेह (IDDM)", mr: "मधुमेह (IDDM)" },
  "DM-NIDDM": { hi: "मधुमेह (NIDDM)", mr: "मधुमेह (NIDDM)" },
  "Ischemic heart disease (IHD)": { hi: "इस्केमिक हृदय रोग (IHD)", mr: "इस्केमिक हृदयरोग (IHD)" },
  "Hyperlipidemia": { hi: "हाइपरलिपिडेमिया (रक्त में अधिक वसा)", mr: "हायपरलिपिडेमिया (रक्तातील जास्त चरबी)" },
  "Paralysis": { hi: "लकवा (पक्षाघात)", mr: "पक्षाघात (अर्धांगवायू)" },
  "Depression": { hi: "अवसाद (डिप्रेशन)", mr: "नैराश्य (डिप्रेशन)" },
  "Psoriasis": { hi: "सोरायसिस", mr: "सोरायसिस" },
  "Renal Parenchymal Disease": { hi: "वृक्क पैरेन्काइमल रोग", mr: "मूत्रपिंड पॅरेन्कायमल रोग" },
  "Mixed Connective Tissue Disease": { hi: "मिश्रित संयोजी ऊतक रोग", mr: "मिश्र संयोजी ऊतक रोग" },
  "Hemiplegia": { hi: "अर्धांगघात (हेमिप्लेजिया)", mr: "अर्धांगवायू (हेमिप्लेजिया)" },
  "Neuropathy": { hi: "न्यूरोपैथी (नस रोग)", mr: "न्यूरोपॅथी (मज्जातंतू विकार)" },
  "Hyperthyroidism": { hi: "हाइपरथायरॉइडिज़्म", mr: "हायपरथायरॉईडीझम" },
  "Hypothyroidism": { hi: "हाइपोथायरॉइडिज़्म", mr: "हायपोथायरॉईडीझम" },
  "Retinopathy": { hi: "रेटिनोपैथी (दृष्टिपटल रोग)", mr: "रेटिनोपॅथी (दृष्टिपटल विकार)" },
  "Obsessive-compulsive disorder (O.C.D)": {
    hi: "ऑब्सेसिव-कम्पल्सिव डिसऑर्डर (OCD)",
    mr: "ऑब्सेसिव्ह-कम्पल्सिव्ह डिसऑर्डर (OCD)",
  },
  "Hypertension": { hi: "उच्च रक्तचाप", mr: "उच्च रक्तदाब" },
  "Anemia": { hi: "रक्ताल्पता (एनीमिया)", mr: "रक्तक्षय (ॲनिमिया)" },
  "Liver disease": { hi: "यकृत रोग", mr: "यकृताचे आजार" },
  "Jaundice": { hi: "पीलिया (कामला)", mr: "कावीळ" },
  "Tuberculosis (TB)": { hi: "क्षय रोग (टीबी)", mr: "क्षयरोग (टीबी)" },
  "Asthma": { hi: "दमा (अस्थमा)", mr: "दमा (अस्थमा)" },
  "Osteoarthritis": { hi: "ऑस्टियोआर्थराइटिस (जोड़ों का घिसाव)", mr: "ऑस्टिओआर्थरायटिस (सांध्यांची झीज)" },
  "Chicken Pox": { hi: "चेचक (छोटी माता)", mr: "कांजिण्या" },
  "Measles": { hi: "खसरा", mr: "गोवर" },
  "Acid Peptic Disease": { hi: "अम्लपित्त रोग (एसिड पेप्टिक)", mr: "अम्लपित्त (ॲसिड पेप्टिक आजार)" },
  "Malignancy": { hi: "कैंसर (दुर्दम रोग)", mr: "कर्करोग" },
  "Allergy": { hi: "एलर्जी", mr: "ॲलर्जी" },
  "Chronic cough": { hi: "पुरानी खांसी", mr: "जुनाट खोकला" },

  // Habit levels
  "Mild": { hi: "हल्का", mr: "थोडे" },
  "Moderate": { hi: "मध्यम", mr: "मध्यम" },
  "Heavy": { hi: "अधिक", mr: "जास्त" },
  "Normal": { hi: "सामान्य", mr: "सामान्य" },
  "Overeating": { hi: "अधिक खाना", mr: "जास्त खाणे" },
  "Less": { hi: "कम", mr: "कमी" },
  "Sometimes": { hi: "कभी-कभी", mr: "कधीकधी" },
  "Twice in week": { hi: "सप्ताह में दो बार", mr: "आठवड्यातून दोनदा" },
  "Once in week": { hi: "सप्ताह में एक बार", mr: "आठवड्यातून एकदा" },
  "Not regular": { hi: "अनियमित", mr: "अनियमित" },
  "Regular": { hi: "नियमित", mr: "नियमित" },

  // Personal history and general examination
  "Vegetarian": { hi: "शाकाहारी", mr: "शाकाहारी" },
  "Non-vegetarian": { hi: "मांसाहारी", mr: "मांसाहारी" },
  "Mixed": { hi: "मिश्र", mr: "मिश्र" },
  "Good": { hi: "अच्छा", mr: "चांगले" },
  "Poor": { hi: "कम", mr: "कमी" },
  "Sound": { hi: "गहरी", mr: "गाढ" },
  "Interrupted": { hi: "बाधित", mr: "विस्कळीत" },
  "Disturbed": { hi: "बाधित", mr: "विस्कळीत" },
  "Insomnia": { hi: "अनिद्रा", mr: "निद्रानाश" },
  "Medium": { hi: "मध्यम", mr: "मध्यम" },
  "Irregular": { hi: "अनियमित", mr: "अनियमित" },
  "Constipated": { hi: "कब्ज़", mr: "बद्धकोष्ठ" },
  "Painful": { hi: "दर्दनाक", mr: "वेदनादायक" },
  "Burning": { hi: "जलन", mr: "जळजळ" },
  "Frequent": { hi: "बार-बार", mr: "वारंवार" },

  // Pain assessment sides and stool frequency
  "Left": { hi: "बायाँ", mr: "डावा" },
  "Right": { hi: "दायाँ", mr: "उजवा" },
  "Daily": { hi: "प्रतिदिन", mr: "दररोज" },
  "Alternate day": { hi: "एक दिन छोड़कर", mr: "एक दिवसाआड" },
};
