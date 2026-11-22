/* ============================================================
   STAND TALL REALTY — website settings
   This is the only file you normally need to edit.
   ============================================================ */
window.SITE = {
  // 1) Paste your Google Apps Script "Web app URL" between the quotes.
  //    While this is empty the website runs in DEMO mode (nothing is saved for real).
  API_URL: 'https://script.google.com/macros/s/AKfycbwEZTEPXclsJSffHqelHOfu9BfXry9UbpQxHAc1AaKBtoMhwZ00kbxJxDdVsEKRRPjt/exec',

  name: 'Stand Tall Realty',
  slogan: 'Where Your Dreams Stand Tall',
  domain: 'https://www.standtallrealty.com',

  // Main number for Call + WhatsApp buttons (10 digits)
  phone: '9920079048',
  whatsapp: '9920079048',
  // Company numbers shown on the Contact page (with a role label, no personal names)
  contacts: [
    { label: 'Property consultant', phone: '9920079048' },
    { label: 'Enquiries & site visits', phone: '9822033795' }
  ],
  email: 'shahzebinamdar@standtallrealty.com',   // shown on the Contact page and footer (leave empty to hide)
  address: 'Unity Splendour, Salunke Vihar Rd, Borade Nagar, Wanowrie, Pune, Maharashtra 411040',
  mapQuery: 'Unity Splendour, Salunke Vihar Road, Borade Nagar, Wanowrie, Pune 411040',
  hours: 'Open all 7 days, 10:00 am – 7:30 pm',

  instagram: 'standtallrealty',   // handle only
  facebook: '',                   // full page URL (optional)
  youtube: '',                    // full channel URL (optional)

  reraAgentNo: '',           // your MahaRERA agent registration no. — shown in the footer, the Promise and project boxes when filled
  reraExamPassed: true,      // until the number arrives, the Promise says the founder has passed MahaRERA's agent competency exam
  approvalTime: 'within 24 hours',

  // The Stand Tall Promise. Change a value here and the website follows.
  replyMins: 15,             // "a real person replies within 15 minutes" during office hours
  openTime: '10:00',         // office hours, India time: replies sent at night say when we will call
  closeTime: '19:30',
  verifiedDays: 30,          // a "Stand Tall Verified" badge drops off this many days after the last check
  priceCheckTime: 'within 24 hours',   // free price check for owners
  googleReviewUrl: '',       // your Google "Write a review" link: shows "Review us on Google" buttons when filled
  // Real reviews only (copy them from Google), newest first. The reviews section stays hidden while this is empty.
  // Example: { name: 'Priya S.', area: 'NIBM', stars: 5, text: 'They found us a 2 BHK in a week.', date: 'Nov 2026' }
  reviews: [],
  defaultCity: 'Pune',
  focusAreas: ['Baner', 'Wakad', 'Hinjewadi', 'Kothrud', 'Kharadi', 'Viman Nagar', 'Wagholi', 'Hadapsar', 'Kondhwa', 'NIBM', 'Undri', 'Wanowrie'],
  // Building / society name search (Geoapify, OpenStreetMap data). The key is meant to be public; limit it to the site's address in the Geoapify dashboard.
  geoKey: '47fa867637bd4c1c813cd3ec1bdc8eeb',
  // Areas offered as quick answers in the website chat (green WhatsApp button), in this order
  chatAreas: ['Kondhwa', 'NIBM', 'Undri', 'Wanowrie', 'Hadapsar', 'Kharadi', 'Baner', 'Wakad'],

  // Ads tracking (optional): paste IDs to measure leads from Facebook / Google ads
  metaPixelId: '',
  googleAnalyticsId: ''
};
