// Category/option configuration for the classical-examination sections of the
// case-sheet. One generic component renders every section from this data.
//
// `categoryKey` values are what the backend stores in
// `classical_exam_findings.categoryKey`; they must stay stable once data
// exists. Labels are the Devanagari terms used clinically.

export type ClassicalExamType =
  | "ASHTAVIDHA_PARIKSHA"
  | "DASHAVIDHA_PARIKSHA"
  | "SROTAS_PARIKSHA"
  | "SAMPRAPTI_GHATAKA"
  | "PAIN_ASSESSMENT"
  | "PERSONAL_HISTORY";

export interface ClassicalExamCategoryConfig {
  key: string;
  label: string;
  hint?: string;
  options: readonly string[];
  selection: "single" | "multi";
}

export interface ClassicalExamSectionConfig {
  examType: ClassicalExamType;
  title: string;
  subtitle: string;
  categories: readonly ClassicalExamCategoryConfig[];
}

const multi = (
  key: string,
  label: string,
  options: readonly string[],
  hint?: string
): ClassicalExamCategoryConfig => ({ key, label, options, selection: "multi", ...(hint ? { hint } : {}) });

const single = (
  key: string,
  label: string,
  options: readonly string[],
  hint?: string
): ClassicalExamCategoryConfig => ({ key, label, options, selection: "single", ...(hint ? { hint } : {}) });

export const ASHTAVIDHA_PARIKSHA: ClassicalExamSectionConfig = {
  examType: "ASHTAVIDHA_PARIKSHA",
  title: "Ashtavidha Pariksha",
  subtitle: "Eight-fold examination",
  categories: [
    multi("nadi", "नाडी", [
      "साम", "निराम", "क्षीण", "द्रुत", "गुरु", "वात", "पित्त", "कफ", "वातपित्त",
      "पित्तकफ", "कफवात", "त्रिदोष", "सर्पवत्", "मण्डूकवत्", "हंसवत्",
    ], "Pulse"),
    multi("jihva", "जिह्वा", [
      "साम", "निराम", "दारुण", "पिच्छिल", "स्फुटित", "श्याम", "नीलवर्ण", "शुष्क",
      "वर्ण", "मुखपाक", "सम्यक्", "नील", "श्वेत", "रक्तवर्ण",
    ], "Tongue"),
    multi("mala", "मल", [
      "सविबन्ध", "मुहुर्मुहु", "द्रव", "बद्ध", "सरक्त", "भोजनोत्तर", "सपूय", "पिच्छिल",
      "सम्यक्", "वेदनायुक्त", "Daily", "Alternate day", "शुष्क", "अपक्व", "दौर्गन्ध्य",
      "रक्तवर्ण", "पीताभवर्ण", "श्वेतवर्ण",
    ], "Stool"),
    multi("mutra", "मूत्र", [
      "सदाह", "अल्पमूत्रता", "बहुमूत्रता", "सशूल", "रात्रिकालीन बहुमूत्रता", "शय्यामूत्रता",
      "मेहयुक्त", "अवरोधित", "अनियंत्रित", "दीर्घकालीन", "सरक्त", "फेनिल", "पीतवर्ण",
      "सम्यक्", "तैलसम", "श्वेत वर्ण",
    ], "Urine"),
    multi("netra", "नेत्र", [
      "कण्डु", "पिच्छिल", "मलिन", "पीत", "नील", "स्राव", "श्याव", "शुष्क", "प्रकाश असहत्व",
      "सशूल", "दाह", "क्षीण", "नेत्रविकार", "सम्यक्", "संकुचित", "विस्फारित", "श्वेत",
      "अरुण",
    ], "Eyes"),
    multi("akruti", "आकृति", ["कृश", "स्थूल", "मध्यम"], "Build"),
    multi("shabda", "शब्द", ["गम्भीर", "स्निग्ध", "गद्गद", "रूक्ष", "मिन्मिन"], "Voice"),
    multi("sparsha", "स्पर्श", ["स्निग्ध", "शीत", "अनुष्णाशीत", "रूक्ष", "उष्ण", "शुष्क"], "Touch"),
  ],
};

const UTTAMA_MADHYAMA_HINA = ["उत्तम", "मध्यम", "हीन"] as const;

export const DASHAVIDHA_PARIKSHA: ClassicalExamSectionConfig = {
  examType: "DASHAVIDHA_PARIKSHA",
  title: "Dashavidha Pariksha",
  subtitle: "Ten-fold examination",
  categories: [
    multi("prakriti", "प्रकृति", ["वात", "पित्त", "कफ", "वातपित्त", "वातकफ", "पित्तकफ", "त्रिदोष", "हीन"], "Constitution"),
    single("satmya_abhyavaharana", "सात्म्य — आभ्यवहरण", UTTAMA_MADHYAMA_HINA, "Satmya: intake capacity"),
    single("satmya_jarana", "सात्म्य — जरण", ["मन्द", "विषम", "तीक्ष्ण", "सम"], "Satmya: digestive capacity"),
    multi("sara", "सार", ["त्वक्", "रक्त", "मांस", "मेद", "अस्थि", "मज्जा", "शुक्र", "ओज"], "Tissue excellence"),
    single("vaya", "वय", ["शैशव", "बाल्य", "कौमार", "युवा", "मध्यम", "वार्धक्य"], "Age"),
    single("desha", "देश", ["जाङ्गल", "अनूप", "साधारण"], "Habitat"),
    single("kala", "काल", ["शिशिर", "वसन्त", "ग्रीष्म", "वर्षा", "शरद", "हेमन्त"], "Season"),
    single("satva", "सत्त्व", UTTAMA_MADHYAMA_HINA, "Mental strength"),
    single("sanhanan", "संहनन", UTTAMA_MADHYAMA_HINA, "Body compactness"),
    single("pramana", "प्रमाण", UTTAMA_MADHYAMA_HINA, "Body proportion"),
    single("sharir_bala", "शरीर बल", ["उत्तम", "मध्यम"], "Physical strength"),
    single("manas_prakriti", "मानस प्रकृति", ["सात्त्विक", "राजसिक", "तामसिक"], "Mental constitution"),
  ],
};

export const SROTAS_PARIKSHA: ClassicalExamSectionConfig = {
  examType: "SROTAS_PARIKSHA",
  title: "Srotas Pariksha",
  subtitle: "Channel examination",
  categories: [
    multi("pranavaha", "प्राणवह", ["अल्पाल्प श्वास", "कुपित श्वास", "सशब्द", "सशूल", "अभीक्ष्ण श्वास"]),
    multi("udakavaha", "उदकवह", ["जिह्वाशोष", "कण्ठशोष", "ओष्ठशोष", "तृष्णा", "तालुशोष"]),
    multi("annavaha", "अन्नवह", ["अन्नाभिलाष", "अविपाक", "अरुचि", "छर्दि"]),
    multi("rasavaha", "रसवह", [
      "मुखवैरस्य", "ज्वर", "अरसज्ञता", "पाण्डु", "हृल्लास", "अवसाद", "गौरव", "क्लैब्य",
      "तन्द्रा", "अंगमर्द", "अग्निमांद्य", "वलित", "पालित्य", "अरुचि", "अश्रद्धा",
    ]),
    multi("raktavaha", "रक्तवह", [
      "पिडका", "कुष्ठ", "रक्तप्रदर", "चर्मरोग", "मुखपाक", "कामला", "वीसर्प", "गुदपाक",
      "प्लीहा", "पामा", "रक्तपित्त", "गुल्म", "नीलिका", "व्यङ्ग", "चर्मदल", "श्वित्र",
      "तिलकालक", "कोठ",
    ]),
    multi("mamsavaha", "मांसवह", ["अर्बुद", "उपजिह्विका", "अलजी", "पूतिमांस", "गण्डमाला", "अधिमांस", "कील", "गलशालूक"]),
    multi("medovaha", "मेदोवह", ["मलाधिक्य", "तन्द्रा", "हस्तपाददाह", "गात्रस्निग्धता", "हस्तपादसुप्तता", "आलस्य", "प्रमेह", "स्थौल्य"]),
    multi("asthivaha", "अस्थिवह", ["अध्यस्थि", "अस्थिशूल", "अधिदन्त", "दन्तशूल", "खालित्य", "पालित्य", "अस्थिभेद", "केश लोम श्मश्रु दोष", "नख विकार"]),
    multi("majjavaha", "मज्जावह", ["पर्वशूल", "मूर्च्छा", "भ्रम", "मिथ्याज्ञान", "तिमिर", "अरुषाम स्थूल मूलानाम्"]),
    multi("shukravaha", "शुक्रवह", ["क्लैब्य", "गर्भपात", "अहर्षण", "संतानविकृति"]),
    multi("artavavaha", "आर्तववह", ["अल्पार्तव", "अत्यार्तव", "अनार्तव", "वन्ध्यत्व", "विषमार्तव"]),
    multi("mutravaha", "मूत्रवह", ["बहुलमूत्रता", "अभीक्ष्ण", "अल्पमूत्रता", "सशूलमूत्रता"]),
    multi("purishavaha", "पुरीषवह", ["अल्पाल्प", "अतिद्रव", "सशूल", "ग्रथित"]),
    multi("swedavaha", "स्वेदवह", ["अस्वेद", "लोमहर्ष", "अतिस्वेद", "अङ्गपरिदाह"]),
  ],
};

export const SAMPRAPTI_GHATAKA: ClassicalExamSectionConfig = {
  examType: "SAMPRAPTI_GHATAKA",
  title: "Samprapti Ghataka",
  subtitle: "Pathogenesis components",
  categories: [
    multi("dosha", "दोष", ["वात", "पित्त", "कफ", "वातपित्त", "वातकफ", "पित्तकफ", "त्रिदोष"]),
    multi("dushya", "दूष्य", ["रस", "रक्त", "मांस", "मेद", "अस्थि", "मज्जा", "शुक्र"]),
    multi("srotas", "स्रोतस", [
      "प्राणवह", "उदकवह", "अन्नवह", "रसवह", "रक्तवह", "मांसवह", "मेदोवह", "अस्थिवह",
      "मज्जावह", "शुक्रवह", "आर्तववह", "मूत्रवह", "पुरीषवह", "स्वेदवह",
    ]),
    multi("mala", "मल", ["पुरीष", "मूत्र", "स्वेद"]),
    single("adhishthana", "अधिष्ठान", ["आभ्यन्तर", "मध्यम", "बाह्य"]),
    multi("srotodushti", "स्रोतोदुष्टि", ["संग", "ग्रन्थि", "विमार्गगमन", "अतिप्रवृत्ति"]),
    single("swabhava", "स्वभाव", ["आशुकारी", "दारुण", "चिरकारी"]),
    single("sadhyasadhyatva", "साध्यासाध्यत्व", ["सुखसाध्य", "कष्टसाध्य", "याप्य", "असाध्य"]),
    single("samata", "सामता", ["आमाजीर्ण", "रसशेषाजीर्ण", "दिनपाकी अजीर्ण", "विदग्धाजीर्ण", "विष्टब्धाजीर्ण"]),
    multi("agni", "अग्नि", [
      "जठराग्नि", "रसाग्नि", "रक्ताग्नि", "मांसाग्नि", "मेदोऽग्नि", "मज्जाग्नि", "शुक्राग्नि",
      "आकाशमहाभूताग्नि", "वायुमहाभूताग्नि", "तेजोमहाभूताग्नि", "जलमहाभूताग्नि", "पृथ्वीमहाभूताग्नि",
    ]),
  ],
};

const SIDES = ["Left", "Right"] as const;

export const PAIN_ASSESSMENT: ClassicalExamSectionConfig = {
  examType: "PAIN_ASSESSMENT",
  title: "Pain Assessment",
  subtitle: "Areas of problem",
  categories: [
    multi("cervical", "Cervical", SIDES),
    multi("thoracic", "Thoracic", SIDES),
    multi("lumbar", "Lumbar", SIDES),
    multi("arm", "Arm", SIDES),
    multi("forearm", "Forearm", SIDES),
    multi("wrist_hand", "Wrist and hand", SIDES),
    multi("hip", "Hip", SIDES),
    multi("leg", "Leg", SIDES),
    multi("thigh", "Thigh", SIDES),
    multi("knee", "Knee", SIDES),
    multi("ankle_foot", "Ankle and foot", SIDES),
  ],
};

export const PERSONAL_HISTORY: ClassicalExamSectionConfig = {
  examType: "PERSONAL_HISTORY",
  title: "Personal History",
  subtitle: "Daily routine",
  categories: [
    single("diet", "Diet", ["Vegetarian", "Non-vegetarian", "Mixed"]),
    single("appetite", "Appetite", ["Good", "Normal", "Poor"]),
    single("sleep", "Sleep", ["Sound", "Interrupted", "Insomnia"]),
    single("thirst", "Thirst", ["Normal", "Medium", "Heavy", "Poor"]),
    single("bowel", "Bowel", ["Regular", "Irregular", "Constipated"]),
    single("micturition", "Micturition", ["Normal", "Poor", "Painful", "Burning", "Frequent"]),
  ],
};

export const CLASSICAL_EXAM_SECTIONS: readonly ClassicalExamSectionConfig[] = [
  ASHTAVIDHA_PARIKSHA,
  DASHAVIDHA_PARIKSHA,
  SROTAS_PARIKSHA,
  SAMPRAPTI_GHATAKA,
  PAIN_ASSESSMENT,
  PERSONAL_HISTORY,
];

export const CLASSICAL_EXAM_SECTION_BY_TYPE: Record<ClassicalExamType, ClassicalExamSectionConfig> = {
  ASHTAVIDHA_PARIKSHA,
  DASHAVIDHA_PARIKSHA,
  SROTAS_PARIKSHA,
  SAMPRAPTI_GHATAKA,
  PAIN_ASSESSMENT,
  PERSONAL_HISTORY,
};
