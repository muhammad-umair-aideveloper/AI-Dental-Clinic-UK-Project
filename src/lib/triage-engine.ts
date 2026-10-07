// =========================================================================
// Multi-Lingual Dental Triage & Clinical Intelligence Engine
// Supports English, Urdu (اردو), and Roman Urdu
// =========================================================================

export type SupportedLanguage = 'en' | 'roman_urdu' | 'urdu';

export interface TriageResult {
  detectedLanguage: SupportedLanguage;
  intent: 'EMERGENCY_PAIN' | 'PRICING' | 'BOOKING' | 'GENERAL';
  reply: string;
  isEmergency: boolean;
  emergencySoothingProtocol?: {
    title: string;
    steps: string[];
    earliestSlotNotice: string;
  };
  pricingTable?: {
    treatment: string;
    priceEstimate: string;
    duration: string;
  }[];
  priceDisclaimer?: string;
  suggestedAction?: 'open_booking' | 'call_emergency' | 'select_slot';
  treatmentRecommended?: string;
}

export function detectLanguage(input: string): SupportedLanguage {
  const text = input.trim();
  
  // 1. Arabic/Urdu Script detection (Unicode range 0600-06FF)
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'urdu';
  }

  // 2. Roman Urdu keywords
  const romanUrduKeywords = [
    'daant', 'dant', 'dard', 'kharcha', 'kitna', 'kitnay', 'hoga', 'chahiye',
    'mujhe', 'mera', 'meri', 'hai', 'bhi', 'karni', 'karna', 'shukriya', 'subah',
    'shaam', 'doctor', 'sahab', 'takleef', 'soojan', 'khoon', 'safai', 'marz',
    'paisa', 'paise', 'fees', 'waqt', 'kab', 'milega', 'slot', 'kulli', 'namak'
  ];

  const lower = text.toLowerCase();
  const tokens = lower.split(/[\s,?.!]+/);
  const matchCount = tokens.filter(t => romanUrduKeywords.includes(t)).length;

  if (matchCount >= 1 || /daant.*dard|kitna.*kharcha|appointment.*chahiye|takleef.*hai/i.test(lower)) {
    return 'roman_urdu';
  }

  return 'en';
}

export function processDentalTriage(input: string, preferredLanguage?: SupportedLanguage): TriageResult {
  const lang = preferredLanguage || detectLanguage(input);
  const lower = input.toLowerCase();

  // 1. EMERGENCY PAIN DETECTION
  const emergencyKeywords = [
    'pain', 'toothache', 'severe', 'swelling', 'bleeding', 'throbbing', 'abscess', 'emergency',
    'dard', 'shadeed', 'soojan', 'khoon', 'takleef', 'bardasht nahi', 'bohot dard',
    'درد', 'سوجن', 'خون', 'تکلیف', 'شدید', 'ایمرجنسی'
  ];

  const isEmergency = emergencyKeywords.some(k => lower.includes(k) || input.includes(k));

  if (isEmergency) {
    if (lang === 'urdu') {
      return {
        detectedLanguage: 'urdu',
        intent: 'EMERGENCY_PAIN',
        isEmergency: true,
        reply: `ہمیں آپ کی تکلیف کا شدید احساس ہے۔ ورٹیکس ڈینٹل لیب میں 24/7 ایمرجنسی ٹرائیج دستیاب ہے۔\n\nفوری گھریلو آرام کے لیے:\n1. نیم گرم پانی میں آدھا چمچ نمک ملا کر کلیاں کریں۔\n2. گال کے بیرونی حصے پر 15 منٹ کے لیے برف کی ٹکور کریں۔\n3. اسپرین کو براہ راست مسوڑھوں پر مت رکھیں۔\n\nہم نے آپ کے لیے صبح کا پہلا ترجیحی ایمرجنسی سلاٹ مختص کر دیا ہے۔`,
        emergencySoothingProtocol: {
          title: 'فوری گھریلو آرام کی ہدایات (Emergency Pain Protocol)',
          steps: [
            'نیم گرم پانی میں آدھا چائے کا چمچ نمک ملا کر نرمی سے کلیاں کریں تاکہ جراثیم کم ہوں۔',
            'گال کے باہر برف کی پوٹلی (Cold Compress) 15 منٹ لگائیں، 15 منٹ ہٹائیں۔',
            'براہ راست مسوڑھے پر درد کش گولی مت رگڑیں ورنہ کیمیکل برن ہو سکتا ہے۔',
            'سوتے وقت سر تھوڑا اونچا رکھیں تاکہ دانت میں خون کا دباؤ اور دھڑکن کم ہو۔',
          ],
          earliestSlotNotice: 'صبح 09:00 بجے کا پہلا ترجیحی ایمرجنسی سلاٹ آپ کے لیے اوپن ہے۔',
        },
        suggestedAction: 'open_booking',
        treatmentRecommended: '24/7 Overnight Emergency Triage',
      };
    }

    if (lang === 'roman_urdu') {
      return {
        detectedLanguage: 'roman_urdu',
        intent: 'EMERGENCY_PAIN',
        isEmergency: true,
        reply: `Aapki takleef sun kar afsos hua. Vertex Dental Lab me emergency patient care pehli priority hai.\n\nForan aaraam ke liye:\n1. Neem garam paani me aadha chamach namak daal kar kulli karein.\n2. Gaal par baraf (cold compress) 15 minute ke liye lagayein.\n3. Dard wali jagah par direct aspirin ya goli mat rakhein.\n\nHumne aapke liye subah 09:00 AM ka pehla emergency priority slot reserve kar diya hai.`,
        emergencySoothingProtocol: {
          title: 'Fori Aaram Ki Hidayat (Immediate Soothing Protocol)',
          steps: [
            'Neem garam paani me 1/2 chamach namak daal kar narmi se kulli karein.',
            'Gaal ke bahar thandi patti ya baraf (ice compress) 15 min lagayein.',
            'Dard wale masooray par direct tablet mat rakhein taake chhaala na banay.',
            'Sir thora ooncha rakh kar leetein taake khoon ka dabao kam ho.',
          ],
          earliestSlotNotice: 'Subah 09:00 AM ka pehla emergency slot aapke liye reserved hai.',
        },
        suggestedAction: 'open_booking',
        treatmentRecommended: '24/7 Overnight Emergency Triage',
      };
    }

    // Default English
    return {
      detectedLanguage: 'en',
      intent: 'EMERGENCY_PAIN',
      isEmergency: true,
      reply: `We understand how debilitating acute dental pain can be. Vertex Dental Lab provides immediate same-day priority triage.\n\nImmediate Soothing Recommendations:\n1. Warm Salt Water: Rinse gently with 1/2 tsp salt in warm water to reduce oral bacterial load.\n2. Cold Compress: Apply an ice pack to the exterior cheek (15 mins on, 15 mins off) to reduce tissue inflammation.\n3. Never place aspirin directly onto gum tissue, as this causes chemical ulceration.\n\nOur earliest morning priority emergency slot (09:00 AM) is held for you.`,
      emergencySoothingProtocol: {
        title: 'Clinical Overnight Soothing Protocol',
        steps: [
          'Gently rinse mouth with warm saline solution (1/2 tsp salt in warm water).',
          'Apply an external cold compress to the cheek for 15 minutes to reduce swelling.',
          'Keep your head elevated on pillows to reduce localized throbbing arterial pressure.',
          'Avoid chewing on the affected side and avoid extremely hot or cold beverages.',
        ],
        earliestSlotNotice: 'Priority emergency slot available tomorrow morning at 09:00 AM.',
      },
      suggestedAction: 'open_booking',
      treatmentRecommended: '24/7 Overnight Emergency Triage',
    };
  }

  // 2. PRICING & ESTIMATES DETECTION
  const pricingKeywords = [
    'price', 'cost', 'fee', 'how much', 'quote', 'charges', 'finance', 'expensive',
    'kharcha', 'kitna', 'paisa', 'paise', 'fees', 'charges kya hain',
    'فیس', 'خرچہ', 'قیمت', 'کتنا'
  ];

  const isPricing = pricingKeywords.some(k => lower.includes(k) || input.includes(k));

  if (isPricing) {
    const pricingTable = [
      { treatment: 'Comprehensive Exam & 3D Scan', priceEstimate: 'From £95', duration: '45 mins' },
      { treatment: 'Airflow® Hygiene & Scaling', priceEstimate: 'From £110', duration: '50 mins' },
      { treatment: 'Microscopic Root Canal (RCT)', priceEstimate: 'From £450', duration: '90 mins' },
      { treatment: 'Surgical Extraction & Socket Care', priceEstimate: 'From £180', duration: '45 mins' },
      { treatment: 'In-Chair Laser Teeth Whitening', priceEstimate: 'From £350', duration: '60 mins' },
      { treatment: 'Invisalign® Clear Aligners', priceEstimate: 'From £1,800 (0% APR £75/mo)', duration: '3-9 months' },
      { treatment: 'Straumann® Titanium Dental Implant', priceEstimate: 'From £1,500', duration: '12 weeks' },
    ];

    if (lang === 'urdu') {
      return {
        detectedLanguage: 'urdu',
        intent: 'PRICING',
        isEmergency: false,
        reply: `ورٹیکس ڈینٹل لیب میں تمام فیسیں شفاف اور پیشگی واضح کی جاتی ہیں۔\n\nاہم علاج کے تخمینہ جات:\n• دانت کا مکمل معائنہ اور 3D اسکین: £95 سے شروع\n• دانتوں کی صفائی اور پالش (Scaling): £110 سے شروع\n• روٹ کینال ٹریٹمنٹ (RCT): £450 سے شروع\n• دانت نکالنا (Extraction): £180 سے شروع\n• دانت سفید کرنا (Teeth Whitening): £350 سے شروع\n• انویزلائن سیدھے دانت (Invisalign): £1,800 سے شروع (0% سود پر اقساط دستیاب)\n\nاہم نوٹ: حتمی فیس کلینیکل معائنے اور 3D تشخیصی اسکین کے بعد طے ہوگی۔`,
        pricingTable,
        priceDisclaimer: 'اہم قانونی و کلینیکل نوٹ: حتمی فیس کا تعین ڈاکٹر کے باقاعدہ معائنے اور 3D ڈیجیٹل اسکین کے بعد کیا جاتا ہے۔',
        suggestedAction: 'open_booking',
      };
    }

    if (lang === 'roman_urdu') {
      return {
        detectedLanguage: 'roman_urdu',
        intent: 'PRICING',
        isEmergency: false,
        reply: `Vertex Dental Lab me transparent UK pricing follow hoti hai. Koi hidden charges nahi hotay.\n\nAhem treatments ka estimated kharcha:\n• Complete Checkup & 3D Scan: £95 se shuru\n• Danton ki Safai (Scaling & Airflow): £110 se shuru\n• Root Canal Treatment (RCT): £450 se shuru\n• Daant Nikalna (Extraction): £180 se shuru\n• Teeth Whitening: £350 se shuru\n• Invisalign Aligners: £1,800 se shuru (0% interest installment £75/month)\n\nNote: Final fee physical examination aur digital scan ke baad confirm hoti hai.`,
        pricingTable,
        priceDisclaimer: 'Zaroori Clinical Note: Final kharcha doctor ke physical muainay aur 3D digital scan ke baad confirm hoga.',
        suggestedAction: 'open_booking',
      };
    }

    return {
      detectedLanguage: 'en',
      intent: 'PRICING',
      isEmergency: false,
      reply: `At Vertex Dental Lab Marylebone, all fees are transparent and compliant with UK GDC standards with 0% APR finance available.\n\nFee Estimates for Common Procedures:\n• Comprehensive Exam + 3D Scan: From £95\n• Hygiene Therapy & Airflow® Scaling: From £110\n• Same-Day Root Canal Therapy (RCT): From £450\n• Surgical Tooth Extraction: From £180\n• Philips Zoom!® Teeth Whitening: From £350\n• Invisalign® Clear Aligners: From £1,800 (or £75/mo at 0% APR)\n• Straumann® Dental Implant: From £1,500\n\nImportant Clinical Disclaimer: Final fee depends on physical clinical examination and 3D digital diagnostic assessment.`,
      pricingTable,
      priceDisclaimer: 'Clinical Governance Disclaimer: Final fee depends on physical clinical examination and in-person diagnostic radiography.',
      suggestedAction: 'open_booking',
    };
  }

  // 3. BOOKING / SLOT QUERY
  const bookingKeywords = [
    'book', 'appointment', 'slot', 'schedule', 'doctor', 'visit', 'time',
    'karni', 'karna', 'chahiye', 'waqt', 'kab', 'miley',
    'بکنگ', 'اپائنٹمنٹ', 'وقت', 'ملے گی'
  ];

  const isBooking = bookingKeywords.some(k => lower.includes(k) || input.includes(k));

  if (isBooking) {
    if (lang === 'urdu') {
      return {
        detectedLanguage: 'urdu',
        intent: 'BOOKING',
        isEmergency: false,
        reply: `آپ باآسانی اپنی مرضی کا دن اور وقت منتخب کر سکتے ہیں۔ ڈاکٹر ایلسٹر وینس کے ساتھ اپائنٹمنٹ محفوظ کرنے کے لیے نیچے دیے گئے کیلنڈر سے سلاٹ منتخب کریں۔`,
        suggestedAction: 'select_slot',
      };
    }

    if (lang === 'roman_urdu') {
      return {
        detectedLanguage: 'roman_urdu',
        intent: 'BOOKING',
        isEmergency: false,
        reply: `Aap asani se apna pasandeeda din aur time slot chun sakte hain. Dr. Alistair Vance ke sath slot book karne ke liye neeche diye gaye interactive calendar ko use karein.`,
        suggestedAction: 'select_slot',
      };
    }

    return {
      detectedLanguage: 'en',
      intent: 'BOOKING',
      isEmergency: false,
      reply: `I can reserve your clinical appointment right away. Please select your preferred date and time from our live diary below.`,
      suggestedAction: 'select_slot',
    };
  }

  // 4. GENERAL GREETING / INQUIRY
  if (lang === 'urdu') {
    return {
      detectedLanguage: 'urdu',
      intent: 'GENERAL',
      isEmergency: false,
      reply: `خوش آمدید! میں ورٹیکس ڈینٹل لیب کا AI اسسٹنٹ ہوں۔ میں آپ کو علاج کی قیمتوں، ایمرجنسی میں دانت کے درد کے فوری علاج، اور ڈاکٹر کے ساتھ اپائنٹمنٹ بک کرنے میں مدد کر سکتا ہوں۔ میں آپ کی کیا مدد کروں؟`,
    };
  }

  if (lang === 'roman_urdu') {
    return {
      detectedLanguage: 'roman_urdu',
      intent: 'GENERAL',
      isEmergency: false,
      reply: `Khush Amdeed! Main Vertex Dental Lab ka AI assistant hoon. Main aapko treatment ke kharchay, emergency danton ke dard ke fori aaram, aur doctor ke sath appointment book karne me madad de sakta hoon. Aapko kis cheez me madad chahiye?`,
    };
  }

  return {
    detectedLanguage: 'en',
    intent: 'GENERAL',
    isEmergency: false,
    reply: `Hello! I am the Vertex Dental Lab clinical AI concierge in Marylebone, London. I can assist you with fee guides, emergency overnight toothache triage, or booking a consultation with Dr. Vance. How may I help you today?`,
  };
}
