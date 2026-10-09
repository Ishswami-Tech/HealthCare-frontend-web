// Hindi and Marathi labels for case-sheet text that is NOT stored data: fixed
// list names (habit names, questionnaire, relations, flags), exam headings and
// hints, card titles and buttons. Keys are the English strings shown today.
//
// DRAFT: translations are for display only and should be reviewed by a
// clinician or native speaker before wider rollout.

import type { LocalizedLabels } from "./english-terms";

type LabelTable = Readonly<Record<string, LocalizedLabels>>;

const L = (hi: string, mr: string): LocalizedLabels => ({ hi, mr });

/** Fixed lists and exam headings. The coverage script checks these. */
export const FIXED_LIST_LABELS: LabelTable = {
  // Habit names
  "Chocolate": L("चॉकलेट", "चॉकलेट"),
  "Coffee": L("कॉफ़ी", "कॉफी"),
  "Cold drink": L("कोल्ड ड्रिंक", "कोल्ड्रिंक"),
  "Drug addict": L("नशे की लत", "अंमली पदार्थांचे व्यसन"),
  "Eating habits": L("खान-पान की आदतें", "खाण्याच्या सवयी"),
  "Fast food": L("फास्ट फूड", "फास्ट फूड"),
  "Late night sleep": L("देर रात तक जागना", "रात्री उशिरा झोपणे"),
  "Pan masala": L("पान मसाला", "पान मसाला"),
  "Salty food": L("नमकीन भोजन", "खारट पदार्थ"),
  "Smoking": L("धूम्रपान", "धूम्रपान"),
  "Tea": L("चाय", "चहा"),
  "Tobacco": L("तंबाकू", "तंबाखू"),

  // Family relations
  "Father": L("पिता", "वडील"),
  "Mother": L("माता", "आई"),
  "Brother": L("भाई", "भाऊ"),
  "Sister": L("बहन", "बहीण"),
  "Spouse": L("जीवनसाथी", "जोडीदार"),
  "Son": L("पुत्र", "मुलगा"),
  "Daughter": L("पुत्री", "मुलगी"),
  "Grandfather": L("दादा / नाना", "आजोबा"),
  "Grandmother": L("दादी / नानी", "आजी"),
  "Uncle": L("चाचा / मामा", "काका / मामा"),
  "Aunt": L("चाची / मौसी", "काकू / मावशी"),

  // Special case flags
  "Minor (age 12 or below)": L("नाबालिग (12 वर्ष या उससे कम)", "अल्पवयीन (१२ वर्षे किंवा कमी)"),
  "Physically handicapped": L("शारीरिक रूप से दिव्यांग", "शारीरिकदृष्ट्या दिव्यांग"),
  "Pregnant woman / senior citizen": L("गर्भवती महिला / वरिष्ठ नागरिक", "गर्भवती महिला / ज्येष्ठ नागरिक"),

  // Prakriti questionnaire: questions
  "Body frame": L("शारीरिक ढांचा", "शरीरयष्टी"),
  "Skin": L("त्वचा", "त्वचा"),
  "Hair": L("बाल", "केस"),
  "Appetite": L("भूख", "भूक"),
  "Digestion": L("पाचन", "पचन"),
  "Sleep": L("नींद", "झोप"),
  "Temperament": L("स्वभाव", "स्वभाव"),
  "Memory": L("स्मरण शक्ति", "स्मरणशक्ती"),
  "Speech": L("वाणी", "वाणी"),
  "Sweating": L("पसीना", "घाम"),
  "Bowel": L("मल त्याग", "शौच"),
  "Weather": L("मौसम", "हवामान"),

  // Prakriti questionnaire: answers (Vata, Pitta, Kapha order)
  "Thin, light": L("दुबला, हल्का", "बारीक, हलके"),
  "Medium, muscular": L("मध्यम, मांसल", "मध्यम, पिळदार"),
  "Broad, heavy": L("चौड़ा, भारी", "रुंद, जड"),
  "Dry, rough, cool": L("रूखी, खुरदरी, ठंडी", "कोरडी, खरखरीत, थंड"),
  "Warm, oily, reddish": L("गर्म, तैलीय, लालिमायुक्त", "उबदार, तेलकट, लालसर"),
  "Thick, smooth, cool": L("मोटी, चिकनी, ठंडी", "जाड, गुळगुळीत, थंड"),
  "Dry, thin": L("रूखे, पतले", "कोरडे, पातळ"),
  "Fine, early greying": L("महीन, जल्दी सफ़ेद होने वाले", "बारीक, लवकर पांढरे होणारे"),
  "Thick, oily": L("घने, तैलीय", "दाट, तेलकट"),
  "Strong, sharp": L("प्रबल, तीव्र", "प्रबळ, तीव्र"),
  "Steady, low": L("स्थिर, कम", "स्थिर, कमी"),
  "Variable, gas": L("अनियमित, गैस", "बदलते, वायू"),
  "Quick, acidity": L("तेज़, अम्लता", "जलद, आम्लपित्त"),
  "Slow, heavy": L("धीमा, भारीपन", "मंद, जडपणा"),
  "Light, interrupted": L("हल्की, बाधित", "हलकी, विस्कळीत"),
  "Moderate, sound": L("मध्यम, गहरी", "मध्यम, शांत"),
  "Deep, long": L("गहरी, लंबी", "गाढ, दीर्घ"),
  "Anxious, quick": L("चिंतित, फुर्तीला", "चिंताग्रस्त, चपळ"),
  "Intense, focused": L("तीव्र, एकाग्र", "तीव्र, एकाग्र"),
  "Calm, steady": L("शांत, स्थिर", "शांत, स्थिर"),
  "Learns fast, forgets fast": L("जल्दी सीखता, जल्दी भूलता", "पटकन शिकतो, पटकन विसरतो"),
  "Sharp": L("तेज़", "तीक्ष्ण"),
  "Learns slow, never forgets": L("धीरे सीखता, कभी नहीं भूलता", "हळू शिकतो, कधी विसरत नाही"),
  "Fast, talkative": L("तेज़, बातूनी", "जलद, बडबड्या"),
  "Sharp, precise": L("तीखी, स्पष्ट", "तीक्ष्ण, नेमकी"),
  "Slow, measured": L("धीमी, नपी-तुली", "हळू, मोजकी"),
  "Scanty": L("अल्प", "अल्प"),
  "Profuse": L("अधिक", "भरपूर"),
  "Dry, constipated": L("सूखा, कब्ज़", "कोरडे, बद्धकोष्ठ"),
  "Loose, frequent": L("पतला, बार-बार", "पातळ, वारंवार"),
  "Regular, heavy": L("नियमित, भारी", "नियमित, जड"),
  "Dislikes cold": L("ठंड नापसंद", "थंडी आवडत नाही"),
  "Dislikes heat": L("गर्मी नापसंद", "उष्णता आवडत नाही"),
  "Dislikes damp": L("नमी नापसंद", "दमटपणा आवडत नाही"),

  // Exam section titles and subtitles
  "Ashtavidha Pariksha": L("अष्टविध परीक्षा", "अष्टविध परीक्षा"),
  "Eight-fold examination": L("आठ प्रकार की परीक्षा", "आठ प्रकारची परीक्षा"),
  "Dashavidha Pariksha": L("दशविध परीक्षा", "दशविध परीक्षा"),
  "Ten-fold examination": L("दस प्रकार की परीक्षा", "दहा प्रकारची परीक्षा"),
  "Srotas Pariksha": L("स्रोतस परीक्षा", "स्रोतस परीक्षा"),
  "Channel examination": L("स्रोतों की परीक्षा", "स्रोतसांची परीक्षा"),
  "Samprapti Ghataka": L("सम्प्राप्ति घटक", "सम्प्राप्ति घटक"),
  "Pathogenesis components": L("रोगोत्पत्ति के घटक", "रोगोत्पत्तीचे घटक"),
  "Pain Assessment": L("दर्द का आकलन", "वेदनांचे मूल्यांकन"),
  "Areas of problem": L("समस्या वाले क्षेत्र", "त्रास होणारे भाग"),
  "Personal History": L("व्यक्तिगत इतिहास", "वैयक्तिक इतिहास"),
  "Daily routine": L("दैनिक दिनचर्या", "दैनंदिन दिनचर्या"),

  // Exam category hints and English category names
  "Pulse": L("नाड़ी", "नाडी"),
  "Tongue": L("जीभ", "जीभ"),
  "Stool": L("मल", "शौच"),
  "Urine": L("मूत्र", "लघवी"),
  "Eyes": L("नेत्र", "डोळे"),
  "Build": L("शारीरिक बनावट", "शरीरयष्टी"),
  "Voice": L("आवाज़", "आवाज"),
  "Touch": L("स्पर्श", "स्पर्श"),
  "Constitution": L("प्रकृति", "प्रकृती"),
  "Satmya: intake capacity": L("सात्म्य: आहार ग्रहण क्षमता", "सात्म्य: आहार ग्रहण क्षमता"),
  "Satmya: digestive capacity": L("सात्म्य: पाचन क्षमता", "सात्म्य: पचनशक्ती"),
  "Tissue excellence": L("धातु सारता", "धातू सारता"),
  "Age": L("आयु", "वय"),
  "Habitat": L("देश (निवास क्षेत्र)", "देश (निवासक्षेत्र)"),
  "Season": L("ऋतु", "ऋतू"),
  "Mental strength": L("मानसिक बल", "मानसिक बळ"),
  "Body compactness": L("शरीर की सुगठितता", "शरीराची सुघटता"),
  "Body proportion": L("शरीर अनुपात", "शरीराचे प्रमाण"),
  "Physical strength": L("शारीरिक बल", "शारीरिक बळ"),
  "Mental constitution": L("मानसिक प्रकृति", "मानसिक प्रकृती"),
  "Cervical": L("ग्रीवा (गर्दन)", "ग्रीवा (मान)"),
  "Thoracic": L("वक्ष (पीठ का ऊपरी भाग)", "वक्ष (पाठीचा वरचा भाग)"),
  "Lumbar": L("कटि (कमर)", "कटी (कंबर)"),
  "Arm": L("ऊपरी बाँह", "दंड (वरचा हात)"),
  "Forearm": L("अग्रबाहु", "कोपराखालचा हात"),
  "Wrist and hand": L("कलाई और हाथ", "मनगट आणि हात"),
  "Hip": L("कूल्हा", "नितंब"),
  "Leg": L("पैर (टांग)", "पाय"),
  "Thigh": L("जांघ", "मांडी"),
  "Knee": L("घुटना", "गुडघा"),
  "Ankle and foot": L("टखना और पैर", "घोटा आणि पाऊल"),
  "Diet": L("आहार", "आहार"),
  "Thirst": L("प्यास", "तहान"),
  "Micturition": L("मूत्र त्याग", "लघवी"),
};

/** Card titles, descriptions and buttons. Not covered by the coverage script. */
export const CHROME_LABELS: LabelTable = {
  "Basic Details": L("मूल विवरण", "मूलभूत तपशील"),
  "Present Complaints": L("वर्तमान शिकायतें", "सध्याच्या तक्रारी"),
  "Past History": L("पूर्व इतिहास", "पूर्वइतिहास"),
  "Habits": L("आदतें", "सवयी"),
  "Family History": L("पारिवारिक इतिहास", "कौटुंबिक इतिहास"),
  "Medicine History": L("दवा इतिहास", "औषध इतिहास"),
  "General Examination": L("सामान्य परीक्षण", "सर्वसाधारण तपासणी"),
  "Physical Measurement": L("शारीरिक माप", "शारीरिक मोजमाप"),
  "Lab Investigation": L("प्रयोगशाला जाँच", "प्रयोगशाळा चाचण्या"),
  "Therapy / Panchakarma": L("थेरेपी / पंचकर्म", "थेरपी / पंचकर्म"),
  "Diet Chart": L("आहार तालिका", "आहार तक्ता"),
  "Treatment History": L("उपचार इतिहास", "उपचार इतिहास"),

  "Symptoms, known conditions and allergies": L(
    "लक्षण, ज्ञात बीमारियाँ और एलर्जी",
    "लक्षणे, ज्ञात आजार आणि ॲलर्जी"
  ),
  "Tap one level per habit; tap again to clear.": L(
    "हर आदत के लिए एक स्तर चुनें; हटाने के लिए फिर दबाएँ।",
    "प्रत्येक सवयीसाठी एक पातळी निवडा; काढण्यासाठी पुन्हा दाबा."
  ),
  "Sleep pattern": L("नींद का स्वरूप", "झोपेचा प्रकार"),
  "Conditions in blood relatives": L("रक्त संबंधियों में बीमारियाँ", "रक्ताच्या नातेवाईकांमधील आजार"),
  "Medicines the patient is currently taking": L(
    "रोगी द्वारा वर्तमान में ली जा रही दवाएँ",
    "रुग्ण सध्या घेत असलेली औषधे"
  ),
  "Circumferences in centimetres": L("परिधि सेंटीमीटर में", "घेर सेंटीमीटरमध्ये"),
  "Details that apply to this OPD visit only": L(
    "केवल इस OPD विज़िट पर लागू विवरण",
    "फक्त या OPD भेटीसाठी लागू तपशील"
  ),
  "Values are recorded in General Exam on each visit.": L(
    "मान प्रत्येक विज़िट पर सामान्य परीक्षण में दर्ज किए जाते हैं।",
    "मूल्ये प्रत्येक भेटीत सर्वसाधारण तपासणीत नोंदवली जातात."
  ),

  "Allergies": L("एलर्जी", "ॲलर्जी"),
  "Food allergy": L("खाद्य एलर्जी", "अन्न ॲलर्जी"),
  "Drug allergy": L("दवा एलर्जी", "औषध ॲलर्जी"),
  "Notes": L("टिप्पणियाँ", "टिपा"),
  "Present complaints": L("वर्तमान शिकायतें", "सध्याच्या तक्रारी"),
  "Present illness": L("वर्तमान बीमारी", "सध्याचा आजार"),
  "Known case of": L("ज्ञात रोग", "ज्ञात आजार"),
  "Vitals": L("महत्वपूर्ण संकेत", "जीवनावश्यक चिन्हे"),
  "Past history notes": L("पूर्व इतिहास नोट्स", "पूर्वइतिहासाच्या टिपा"),
  "Medicines on record": L("दर्ज दवाएँ", "नोंदवलेली औषधे"),
  "Lab reports on record": L("दर्ज जाँच रिपोर्ट", "नोंदवलेले चाचणी अहवाल"),
  "No notes were written in this case sheet yet.": L(
    "इस केस शीट में अभी कोई नोट नहीं लिखा गया।",
    "या केस शीटमध्ये अजून टिपा लिहिलेल्या नाहीत."
  ),
  "The case sheet could not be loaded.": L("केस शीट लोड नहीं हो सकी।", "केस शीट लोड करता आली नाही."),

  "Save": L("सहेजें", "जतन करा"),
  "Saving...": L("सहेजा जा रहा है...", "जतन होत आहे..."),
  "Save visit": L("विज़िट सहेजें", "भेट जतन करा"),
  "Save notes": L("नोट्स सहेजें", "टिपा जतन करा"),
};
