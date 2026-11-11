/* ============================================================
   STAND TALL REALTY — website settings
   This is the only file you normally need to edit.
   ============================================================ */
window.SITE = {
  // 1) Paste your Google Apps Script "Web app URL" between the quotes.
  //    While this is empty the website runs in DEMO mode (nothing is saved for real).
  API_URL: 'https://script.google.com/macros/s/AKfycbw4HTPNUBrSwHNOhLTkQ2rfoPw_qtXo0q8rOm3tcq3RGkS3XKL082djyVM9Xf249VTGgw/exec',

  name: 'Stand Tall Realty',
  slogan: 'Where Your Dreams Stand Tall',
  domain: 'https://www.standtallrealty.com',

  // Main number for Call + WhatsApp buttons (10 digits)
  phone: '9920079048',
  whatsapp: '9920079048',
  // People shown on the Contact page and footer
  contacts: [
    { name: 'Kafil Shaikh', phone: '9920079048' },
    { name: 'Shahzeb Inamdar', phone: '9822033795' }
  ],
  email: '',                 // e.g. 'info@standtallrealty.com' (leave empty to hide)
  address: 'Unity Splendour, Salunke Vihar Rd, Borade Nagar, Wanowrie, Pune, Maharashtra 411040',
  mapQuery: 'Unity Splendour, Salunke Vihar Road, Borade Nagar, Wanowrie, Pune 411040',
  hours: 'Mon–Sat, 10:00 am – 7:30 pm',

  instagram: 'standtallrealty',   // handle only
  facebook: '',                   // full page URL (optional)
  youtube: '',                    // full channel URL (optional)

  reraAgentNo: '',           // your MahaRERA agent registration no. — shown in the footer when filled
  approvalTime: 'within 24 hours',
  defaultCity: 'Pune',
  focusAreas: ['NIBM', 'NIBM Annexe', 'Kondhwa', 'Undri', 'Parge Nagar', 'Kausar Baug', 'Lulla Nagar', 'Wanowrie', 'Mohammadwadi', 'Pisoli'],

  // Ads tracking (optional): paste IDs to measure leads from Facebook / Google ads
  metaPixelId: '',
  googleAnalyticsId: ''
};
