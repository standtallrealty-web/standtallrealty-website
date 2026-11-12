/* Location data: all Indian states, every district of Maharashtra with its talukas/towns,
   and localities for the main cities. Any locality not listed can still be typed in. */
window.ST_LOC = (function () {
  var states = ['Maharashtra', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

  // District → cities / towns / talukas (first entry = main city of the district)
  var districts = [
    ['Pune', ['Pune', 'Pimpri-Chinchwad', 'Lonavala', 'Talegaon Dabhade', 'Chakan', 'Baramati', 'Daund', 'Indapur', 'Junnar', 'Manchar', 'Rajgurunagar (Khed)', 'Shirur', 'Saswad (Purandar)', 'Jejuri', 'Bhor', 'Velhe (Rajgad)', 'Paud (Mulshi)', 'Vadgaon Maval', 'Kamshet', 'Alandi', 'Dehu', 'Uruli Kanchan', 'Ambegaon', 'Haveli']],
    ['Mumbai', ['Mumbai']],
    ['Thane', ['Thane', 'Navi Mumbai', 'Kalyan-Dombivli', 'Mira-Bhayandar', 'Bhiwandi', 'Ulhasnagar', 'Ambernath', 'Badlapur', 'Titwala', 'Shahapur', 'Murbad', 'Kasara']],
    ['Palghar', ['Vasai-Virar', 'Palghar', 'Boisar', 'Dahanu', 'Talasari', 'Jawhar', 'Mokhada', 'Vikramgad', 'Wada', 'Safale']],
    ['Raigad', ['Panvel', 'Alibag', 'Karjat', 'Khopoli', 'Pen', 'Uran', 'Neral', 'Khalapur', 'Murud', 'Roha', 'Pali (Sudhagad)', 'Mangaon', 'Tala', 'Mhasala', 'Shrivardhan', 'Mahad', 'Poladpur', 'Matheran']],
    ['Ratnagiri', ['Ratnagiri', 'Chiplun', 'Dapoli', 'Khed', 'Guhagar', 'Sangameshwar', 'Lanja', 'Rajapur', 'Mandangad']],
    ['Sindhudurg', ['Sawantwadi', 'Kudal', 'Malvan', 'Vengurla', 'Kankavli', 'Devgad', 'Vaibhavwadi', 'Dodamarg', 'Oros']],
    ['Satara', ['Satara', 'Karad', 'Wai', 'Mahabaleshwar', 'Panchgani', 'Phaltan', 'Koregaon', 'Patan', 'Khandala', 'Khatav', 'Man (Dahiwadi)', 'Jaoli (Medha)']],
    ['Sangli', ['Sangli', 'Miraj', 'Islampur (Walwa)', 'Tasgaon', 'Vita (Khanapur)', 'Jat', 'Atpadi', 'Kavathe Mahankal', 'Palus', 'Kadegaon', 'Shirala']],
    ['Kolhapur', ['Kolhapur', 'Ichalkaranji', 'Jaysingpur', 'Gadhinglaj', 'Kagal', 'Panhala', 'Hatkanangale', 'Shirol', 'Chandgad', 'Ajara', 'Gargoti (Bhudargad)', 'Radhanagari', 'Gaganbawada', 'Shahuwadi', 'Karvir']],
    ['Solapur', ['Solapur', 'Pandharpur', 'Barshi', 'Akkalkot', 'Mohol', 'Madha', 'Karmala', 'Mangalwedha', 'Sangola', 'Malshiras', 'Akluj', 'Kurduwadi']],
    ['Nashik', ['Nashik', 'Malegaon', 'Sinnar', 'Igatpuri', 'Niphad', 'Yeola', 'Manmad', 'Nandgaon', 'Chandwad', 'Deola', 'Dindori', 'Kalwan', 'Satana (Baglan)', 'Trimbakeshwar', 'Peth', 'Surgana', 'Ozar', 'Deolali']],
    ['Ahilyanagar', ['Ahilyanagar (Ahmednagar)', 'Shirdi', 'Sangamner', 'Kopargaon', 'Shrirampur', 'Rahuri', 'Rahata', 'Nevasa', 'Shevgaon', 'Pathardi', 'Parner', 'Shrigonda', 'Karjat (Ahilyanagar)', 'Jamkhed', 'Akole']],
    ['Dhule', ['Dhule', 'Shirpur', 'Sakri', 'Shindkheda', 'Dondaicha']],
    ['Nandurbar', ['Nandurbar', 'Shahada', 'Navapur', 'Taloda', 'Akkalkuwa', 'Dhadgaon (Akrani)']],
    ['Jalgaon', ['Jalgaon', 'Bhusawal', 'Chalisgaon', 'Amalner', 'Pachora', 'Jamner', 'Chopda', 'Yawal', 'Raver', 'Erandol', 'Dharangaon', 'Parola', 'Muktainagar', 'Bodwad', 'Bhadgaon']],
    ['Chhatrapati Sambhajinagar', ['Chhatrapati Sambhajinagar (Aurangabad)', 'Paithan', 'Vaijapur', 'Gangapur', 'Kannad', 'Sillod', 'Soegaon', 'Phulambri', 'Khuldabad', 'Waluj']],
    ['Jalna', ['Jalna', 'Ambad', 'Bhokardan', 'Badnapur', 'Ghansawangi', 'Partur', 'Mantha', 'Jafrabad']],
    ['Beed', ['Beed', 'Ambajogai', 'Parli', 'Majalgaon', 'Georai', 'Kaij', 'Ashti', 'Patoda', 'Shirur Kasar', 'Wadwani', 'Dharur']],
    ['Dharashiv', ['Dharashiv (Osmanabad)', 'Tuljapur', 'Umarga', 'Kalamb', 'Paranda', 'Bhum', 'Washi', 'Lohara']],
    ['Latur', ['Latur', 'Udgir', 'Ausa', 'Nilanga', 'Ahmedpur', 'Chakur', 'Renapur', 'Deoni', 'Jalkot', 'Shirur Anantpal']],
    ['Nanded', ['Nanded', 'Deglur', 'Mukhed', 'Kinwat', 'Hadgaon', 'Bhokar', 'Loha', 'Kandhar', 'Biloli', 'Dharmabad', 'Mudkhed', 'Ardhapur', 'Umri', 'Naigaon', 'Himayatnagar', 'Mahur']],
    ['Parbhani', ['Parbhani', 'Gangakhed', 'Jintur', 'Selu', 'Pathri', 'Manwath', 'Purna', 'Palam', 'Sonpeth']],
    ['Hingoli', ['Hingoli', 'Basmat', 'Kalamnuri', 'Sengaon', 'Aundha Nagnath']],
    ['Amravati', ['Amravati', 'Achalpur', 'Paratwada', 'Anjangaon Surji', 'Daryapur', 'Morshi', 'Warud', 'Chandur Railway', 'Dhamangaon Railway', 'Chandur Bazar', 'Nandgaon Khandeshwar', 'Teosa', 'Bhatkuli', 'Dharni', 'Chikhaldara']],
    ['Akola', ['Akola', 'Akot', 'Murtijapur', 'Balapur', 'Telhara', 'Patur', 'Barshitakli']],
    ['Washim', ['Washim', 'Karanja', 'Risod', 'Mangrulpir', 'Malegaon (Washim)', 'Manora']],
    ['Buldhana', ['Buldhana', 'Khamgaon', 'Shegaon', 'Malkapur', 'Chikhli', 'Mehkar', 'Deulgaon Raja', 'Nandura', 'Jalgaon Jamod', 'Sindkhed Raja', 'Lonar', 'Motala', 'Sangrampur']],
    ['Yavatmal', ['Yavatmal', 'Pusad', 'Wani', 'Umarkhed', 'Darwha', 'Digras', 'Pandharkawada (Kelapur)', 'Arni', 'Ner', 'Ghatanji', 'Ralegaon', 'Babhulgaon', 'Kalamb (Yavatmal)', 'Mahagaon', 'Maregaon', 'Zari Jamni']],
    ['Nagpur', ['Nagpur', 'Kamptee', 'Hingna', 'Butibori', 'Katol', 'Kalmeshwar', 'Savner', 'Umred', 'Ramtek', 'Mouda', 'Parseoni', 'Narkhed', 'Kuhi', 'Bhiwapur', 'Wadi']],
    ['Wardha', ['Wardha', 'Hinganghat', 'Arvi', 'Deoli', 'Pulgaon', 'Seloo', 'Samudrapur', 'Karanja (Ghadge)', 'Ashti (Wardha)']],
    ['Bhandara', ['Bhandara', 'Tumsar', 'Sakoli', 'Pauni', 'Mohadi', 'Lakhani', 'Lakhandur']],
    ['Gondia', ['Gondia', 'Tirora', 'Amgaon', 'Goregaon (Gondia)', 'Arjuni Morgaon', 'Sadak Arjuni', 'Salekasa', 'Deori']],
    ['Chandrapur', ['Chandrapur', 'Ballarpur', 'Warora', 'Bhadravati', 'Brahmapuri', 'Chimur', 'Rajura', 'Mul', 'Nagbhid', 'Sindewahi', 'Gondpipri', 'Korpana', 'Saoli', 'Pombhurna', 'Jiwati']],
    ['Gadchiroli', ['Gadchiroli', 'Desaiganj (Wadsa)', 'Armori', 'Chamorshi', 'Aheri', 'Kurkheda', 'Dhanora', 'Etapalli', 'Sironcha', 'Mulchera', 'Korchi', 'Bhamragad']]
  ];

  var L = {};
  L['Pune'] = ['NIBM', 'NIBM Annexe', 'NIBM Road', 'Kondhwa', 'Kondhwa Budruk', 'Kondhwa Khurd', 'Undri', 'Parge Nagar', 'Kausar Baug', 'Lulla Nagar',
    'Wanowrie', 'Salunke Vihar', 'Mohammadwadi', 'Pisoli', 'Handewadi', 'Hadapsar', 'Magarpatta', 'Amanora', 'Fatima Nagar', 'Ramtekdi',
    'Bibwewadi', 'Upper Indira Nagar', 'Gangadham', 'Katraj', 'Yewalewadi', 'Autadwadi Handewadi', 'Holkarwadi', 'Mitha Nagar',
    'Shivneri Nagar', 'Bhagyoday Nagar', 'Tilekar Nagar', 'Uruli Devachi', 'Fursungi', 'Manjri', 'Mundhwa', 'Keshav Nagar', 'Kharadi',
    'Chandan Nagar', 'Wagholi', 'Kesnand', 'Lohegaon', 'Dhanori', 'Vishrantwadi', 'Tingre Nagar', 'Viman Nagar', 'Kalyani Nagar',
    'Yerawada', 'Vadgaon Sheri', 'Koregaon Park', 'Ghorpadi', 'Camp', 'Pune Station', 'Bund Garden', 'Sangamwadi', 'Shivaji Nagar',
    'Deccan Gymkhana', 'FC Road', 'JM Road', 'Model Colony', 'Gokhale Nagar', 'Prabhat Road', 'Law College Road', 'Erandwane',
    'Kothrud', 'Karve Nagar', 'Warje', 'Bavdhan', 'Pashan', 'Sus', 'Mahalunge', 'Baner', 'Balewadi', 'Aundh', 'Bopodi', 'Khadki',
    'Hinjewadi', 'Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Hinjewadi Phase 3', 'Maan', 'Marunji', 'Bhugaon', 'Bhukum', 'Pirangut',
    'Sinhagad Road', 'Vadgaon Budruk', 'Dhayari', 'Narhe', 'Ambegaon Budruk', 'Ambegaon Khurd', 'Nanded City', 'Kirkatwadi',
    'Khadakwasla', 'Hingne Khurd', 'Anand Nagar', 'Dhankawadi', 'Sahakar Nagar', 'Parvati', 'Market Yard', 'Swargate', 'Mukund Nagar',
    'Salisbury Park', 'Gultekdi', 'Sadashiv Peth', 'Narayan Peth', 'Shaniwar Peth', 'Kasba Peth', 'Budhwar Peth', 'Raviwar Peth',
    'Shukrawar Peth', 'Guruwar Peth', 'Ganesh Peth', 'Nana Peth', 'Bhawani Peth', 'Rasta Peth', 'Somwar Peth', 'Mangalwar Peth',
    'Dattawadi', 'Sopan Baug', 'Balaji Nagar', 'Loni Kalbhor', 'Theur', 'Shewalewadi', 'Kale Padal', 'Satavwadi', 'Sasane Nagar',
    'Wanwadi', 'Range Hills', 'Wakadewadi', 'Aundh Road', 'Sanewadi', 'Sutarwadi', 'Sus Road', 'Pashan Sus Road', 'Chandani Chowk', 'Mayur Colony',
    'Paud Road', 'Bhusari Colony', 'Hingne Budruk', 'Karve Road', 'Dahanukar Colony', 'Ideal Colony', 'Shivane', 'Uttam Nagar', 'NDA Road',
    'Lavale', 'Bhilarewadi', 'Jambhulwadi', 'Kolewadi', 'Gujarwadi', 'Padmavati', 'Tilak Road', 'Navi Peth', 'Laxmi Road', 
    'Ramwadi', 'Nagar Road', 'Airport Road', 'Bakori', 'Lonikand', 'Tadiwala Road', 'Boat Club Road', 'Sassoon Road', 'Ghorpade Peth',
    'Pune Cantonment', 'Sade Satra Nali', 'Solapur Road', 'Bhosale Nagar', 'Aundh Gaon', 'Baner Gaon', 'Kondhwa Road', 'Khadi Machine Chowk', 'Kalas', 'Wadgaon Budruk'];
  L['Pimpri-Chinchwad'] = ['Wakad', 'Pimple Saudagar', 'Pimple Nilakh', 'Pimple Gurav', 'Pimpri', 'Chinchwad', 'Akurdi', 'Nigdi',
    'Pradhikaran', 'Ravet', 'Punawale', 'Tathawade', 'Thergaon', 'Rahatani', 'Kalewadi', 'Sangvi', 'New Sangvi', 'Dapodi', 'Kasarwadi',
    'Bhosari', 'Moshi', 'Chikhali', 'Charholi', 'Dighi', 'Dudulgaon', 'Talawade', 'Kiwale', 'Mamurdi', 'Gahunje', 'Dehu Road',
    'Chinchwad Gaon', 'Nehru Nagar', 'Indrayani Nagar', 'Spine Road', 'Wakad Road'];
  // Pune by part of the city, for the "Other area" picker in the quick chat. Every locality above sits in exactly one part.
  var puneZones = {
    'Central Pune': ['Camp', 'Pune Station', 'Bund Garden', 'Sangamwadi', 'Shivaji Nagar', 'Deccan Gymkhana', 'FC Road', 'JM Road', 'Model Colony', 'Gokhale Nagar', 'Prabhat Road', 'Law College Road', 'Erandwane', 'Karve Road',
      'Sadashiv Peth', 'Narayan Peth', 'Shaniwar Peth', 'Kasba Peth', 'Budhwar Peth', 'Raviwar Peth', 'Shukrawar Peth', 'Guruwar Peth', 'Ganesh Peth', 'Nana Peth', 'Bhawani Peth', 'Rasta Peth', 'Somwar Peth', 'Mangalwar Peth', 'Navi Peth',
      'Laxmi Road', 'Tilak Road', 'Swargate', 'Market Yard', 'Gultekdi', 'Parvati', 'Sahakar Nagar', 'Dattawadi', 'Sopan Baug', 'Pune Cantonment', 'Wakadewadi', 'Sassoon Road', 'Boat Club Road', 'Ghorpade Peth', 'Mukund Nagar', 'Salisbury Park', 'Fatima Nagar', 'Padmavati'],
    'East Pune': ['Koregaon Park', 'Tadiwala Road', 'Ghorpadi', 'Mundhwa', 'Keshav Nagar', 'Hadapsar', 'Magarpatta', 'Amanora', 'Ramtekdi', 'Ramwadi', 'Sade Satra Nali', 'Solapur Road', 'Kharadi', 'Chandan Nagar', 'Vadgaon Sheri', 'Nagar Road', 'Wagholi', 'Kesnand',
      'Bakori', 'Lonikand', 'Manjri', 'Fursungi', 'Uruli Devachi', 'Loni Kalbhor', 'Theur', 'Shewalewadi', 'Kale Padal', 'Satavwadi', 'Sasane Nagar', 'Handewadi', 'Autadwadi Handewadi', 'Holkarwadi'],
    'North Pune': ['Viman Nagar', 'Kalyani Nagar', 'Yerawada', 'Dhanori', 'Lohegaon', 'Vishrantwadi', 'Tingre Nagar', 'Kalas', 'Airport Road', 'Aundh', 'Aundh Road', 'Aundh Gaon', 'Sanewadi', 'Bopodi', 'Khadki', 'Range Hills', 'Bhosale Nagar'],
    'West Pune': ['Kothrud', 'Karve Nagar', 'Warje', 'Bavdhan', 'Pashan', 'Sus', 'Sus Road', 'Pashan Sus Road', 'Sutarwadi', 'Chandani Chowk', 'Mahalunge', 'Baner', 'Baner Gaon', 'Balewadi', 'Hinjewadi', 'Hinjewadi Phase 1', 'Hinjewadi Phase 2', 'Hinjewadi Phase 3',
      'Maan', 'Marunji', 'Bhugaon', 'Bhukum', 'Pirangut', 'Lavale', 'Mayur Colony', 'Paud Road', 'Bhusari Colony', 'Dahanukar Colony', 'Ideal Colony', 'Shivane', 'Uttam Nagar', 'NDA Road'],
    'South Pune': ['NIBM', 'NIBM Annexe', 'NIBM Road', 'Kondhwa', 'Kondhwa Budruk', 'Kondhwa Khurd', 'Kondhwa Road', 'Undri', 'Parge Nagar', 'Kausar Baug', 'Lulla Nagar', 'Wanowrie', 'Wanwadi', 'Salunke Vihar', 'Mohammadwadi', 'Pisoli', 'Khadi Machine Chowk',
      'Bibwewadi', 'Upper Indira Nagar', 'Gangadham', 'Katraj', 'Yewalewadi', 'Mitha Nagar', 'Shivneri Nagar', 'Bhagyoday Nagar', 'Tilekar Nagar', 'Ambegaon Budruk', 'Ambegaon Khurd', 'Nanded City', 'Kirkatwadi', 'Khadakwasla', 'Hingne Khurd', 'Hingne Budruk',
      'Anand Nagar', 'Dhankawadi', 'Balaji Nagar', 'Dhayari', 'Narhe', 'Vadgaon Budruk', 'Wadgaon Budruk', 'Sinhagad Road', 'Bhilarewadi', 'Jambhulwadi', 'Kolewadi', 'Gujarwadi'],
    'Pimpri-Chinchwad': L['Pimpri-Chinchwad']
  };
  L['Mumbai'] = ['Colaba', 'Cuffe Parade', 'Nariman Point', 'Fort', 'Churchgate', 'Marine Lines', 'Girgaon', 'Charni Road', 'Grant Road',
    'Malabar Hill', 'Walkeshwar', 'Peddar Road', 'Breach Candy', 'Napean Sea Road', 'Tardeo', 'Mumbai Central', 'Byculla', 'Mazgaon',
    'Agripada', 'Mahalaxmi', 'Worli', 'Lower Parel', 'Parel', 'Lalbaug', 'Sewri', 'Wadala', 'Prabhadevi', 'Dadar East', 'Dadar West',
    'Matunga East', 'Matunga West', 'Mahim', 'Sion', 'Antop Hill', 'Bandra East', 'Bandra West', 'Bandra Kurla Complex', 'Khar East',
    'Khar West', 'Santacruz East', 'Santacruz West', 'Kalina', 'Vile Parle East', 'Vile Parle West', 'Juhu', 'Andheri East',
    'Andheri West', 'Versova', 'Lokhandwala', 'Oshiwara', 'Jogeshwari East', 'Jogeshwari West', 'Goregaon East', 'Goregaon West',
    'Malad East', 'Malad West', 'Marve', 'Kandivali East', 'Kandivali West', 'Charkop', 'Borivali East', 'Borivali West', 'Gorai',
    'Dahisar East', 'Dahisar West', 'Marol', 'Chakala', 'Saki Naka', 'Powai', 'Chandivali', 'Kurla East', 'Kurla West', 'Chembur',
    'Tilak Nagar', 'Govandi', 'Mankhurd', 'Deonar', 'Trombay', 'Ghatkopar East', 'Ghatkopar West', 'Vidyavihar', 'Vikhroli East',
    'Vikhroli West', 'Kanjurmarg', 'Bhandup East', 'Bhandup West', 'Nahur', 'Mulund East', 'Mulund West'];
  L['Thane'] = ['Thane West', 'Thane East', 'Ghodbunder Road', 'Majiwada', 'Manpada', 'Hiranandani Estate', 'Kolshet Road', 'Balkum',
    'Kapurbawdi', 'Vartak Nagar', 'Naupada', 'Panchpakhadi', 'Kopri', 'Wagle Estate', 'Kasarvadavali', 'Waghbil', 'Owale', 'Patlipada',
    'Pokhran Road', 'Vasant Vihar', 'Upvan', 'Louiswadi', 'Brahmand', 'Kalwa', 'Mumbra', 'Diva'];
  L['Navi Mumbai'] = ['Vashi', 'Sanpada', 'Juinagar', 'Nerul', 'Seawoods', 'CBD Belapur', 'Kharghar', 'Kamothe', 'Kalamboli',
    'Khandeshwar', 'Ulwe', 'Dronagiri', 'Taloja', 'Airoli', 'Ghansoli', 'Koparkhairane', 'Turbhe', 'Rabale', 'Mahape'];
  L['Kalyan-Dombivli'] = ['Kalyan West', 'Kalyan East', 'Dombivli East', 'Dombivli West', 'Thakurli', 'Khadakpada', 'Adharwadi', 'Shahad',
    'Kalyan-Shil Road', 'Palava', 'Titwala'];
  L['Mira-Bhayandar'] = ['Mira Road East', 'Kashimira', 'Shanti Nagar', 'Naya Nagar', 'Beverly Park', 'Bhayandar East', 'Bhayandar West', 'Uttan'];
  L['Vasai-Virar'] = ['Vasai East', 'Vasai West', 'Virar East', 'Virar West', 'Nalasopara East', 'Nalasopara West', 'Naigaon East', 'Naigaon West', 'Evershine City'];
  L['Panvel'] = ['New Panvel', 'Old Panvel', 'Karanjade', 'Kalamboli', 'Kamothe', 'Khanda Colony', 'Sukapur', 'Usarli', 'Palaspe', 'Kon',
    'Vichumbe', 'Nere', 'Shedung', 'Taloja Phase 1', 'Taloja Phase 2', 'Ulwe'];
  L['Badlapur'] = ['Badlapur East', 'Badlapur West', 'Katrap', 'Kulgaon'];
  L['Ambernath'] = ['Ambernath East', 'Ambernath West'];
  L['Nagpur'] = ['Dharampeth', 'Civil Lines', 'Sadar', 'Ramdaspeth', 'Bajaj Nagar', 'Shankar Nagar', 'Laxmi Nagar', 'Pratap Nagar',
    'Trimurti Nagar', 'Manish Nagar', 'Besa', 'Beltarodi', 'Wardha Road', 'Hingna Road', 'Wadi', 'Koradi Road', 'Kamptee Road',
    'Manewada', 'Nandanvan', 'Sakkardara', 'Mahal', 'Itwari', 'Sitabuldi', 'Gandhibagh', 'Jaripatka', 'Mankapur', 'Katol Road',
    'Amravati Road', 'Gorewada', 'Dighori', 'Narendra Nagar', 'Somalwada', 'Khamla', 'Jaitala', 'MIHAN', 'Pardi', 'Wathoda', 'Ajni', 'Godhni'];
  L['Nashik'] = ['Gangapur Road', 'College Road', 'Panchavati', 'Nashik Road', 'Indira Nagar', 'Pathardi Phata', 'Govind Nagar',
    'Satpur', 'Ambad', 'Cidco', 'Jail Road', 'Upnagar', 'Mumbai Naka', 'Dwarka', 'Adgaon', 'Makhmalabad', 'Mhasrul', 'Anandvalli',
    'Tidke Colony', 'Canada Corner', 'Sharanpur Road', 'Trimbak Road', 'Dindori Road', 'Deolali Camp'];
  L['Chhatrapati Sambhajinagar (Aurangabad)'] = ['CIDCO', 'Jalna Road', 'Beed Bypass', 'Garkheda', 'Osmanpura', 'Samarth Nagar',
    'Kranti Chowk', 'Jawahar Colony', 'Padegaon', 'Mukundwadi', 'Chikalthana', 'Satara Parisar', 'Waluj', 'Bajaj Nagar', 'Paithan Road',
    'Harsul', 'Cantonment', 'Nirala Bazar', 'Bansilal Nagar', 'Pundalik Nagar', 'Gajanan Nagar', 'Ulkanagari', 'Jyoti Nagar', 'Shahanoorwadi'];
  L['Kolhapur'] = ['Rajarampuri', 'Shahupuri', 'Tarabai Park', 'Nagala Park', 'Kasaba Bawada', 'Ruikar Colony', 'Sane Guruji Vasahat',
    'Mangalwar Peth', 'Shivaji Peth', 'Laxmipuri', 'Kalamba', 'Pachgaon', 'Ujalaiwadi', 'Uchgaon', 'Kadamwadi', 'Jarag Nagar', 'Takala',
    'Shiroli', 'Gandhinagar', 'RK Nagar', 'Rankala', 'Phulewadi'];
  L['Solapur'] = ['Railway Lines', 'Murarji Peth', 'Hotgi Road', 'Vijapur Road', 'Akkalkot Road', 'Jule Solapur', 'Saat Rasta',
    'Navi Peth', 'Bhavani Peth', 'Kumtha Naka', 'Majrewadi'];
  L['Lonavala'] = ['Lonavala', 'Khandala', 'Tungarli', 'Bhushi', 'Valvan', 'Kurvande', 'Kune'];
  L['Talegaon Dabhade'] = ['Talegaon Station', 'Talegaon Gaon', 'Induri', 'Varale', 'Ambi'];
  L['Chakan'] = ['Chakan', 'Kuruli', 'Medankarwadi', 'Kharabwadi', 'Mahalunge Ingale'];
  L['Satara'] = ['Shahupuri', 'Sadar Bazar', 'Karanje', 'Godoli', 'Powai Naka', 'Shahu Nagar', 'Koregaon Road'];
  L['Sangli'] = ['Vishrambag', 'Vijaynagar', 'Gaonbhag', 'Sangli-Miraj Road', 'Kupwad', 'Madhavnagar'];
  L['Alibag'] = ['Alibag', 'Kihim', 'Nagaon', 'Varsoli', 'Awas', 'Mandwa', 'Chondi', 'Thal'];
  L['Karjat'] = ['Karjat', 'Neral', 'Kashele', 'Bhivpuri', 'Kadav'];

  var cityDistrict = {};
  districts.forEach(function (d) { d[1].forEach(function (c) { if (!cityDistrict[c]) cityDistrict[c] = d[0]; }); });
  var popular = ['Pune', 'Pimpri-Chinchwad', 'Mumbai', 'Thane', 'Navi Mumbai', 'Kalyan-Dombivli', 'Panvel', 'Mira-Bhayandar',
    'Vasai-Virar', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar (Aurangabad)', 'Kolhapur', 'Solapur', 'Lonavala'];
  var aliases = { 'aurangabad': 'Chhatrapati Sambhajinagar (Aurangabad)', 'chhatrapati sambhajinagar': 'Chhatrapati Sambhajinagar (Aurangabad)',
    'ahmednagar': 'Ahilyanagar (Ahmednagar)', 'ahilyanagar': 'Ahilyanagar (Ahmednagar)', 'osmanabad': 'Dharashiv (Osmanabad)',
    'dharashiv': 'Dharashiv (Osmanabad)', 'pimpri chinchwad': 'Pimpri-Chinchwad', 'pimpri-chinchwad': 'Pimpri-Chinchwad',
    'greater mumbai': 'Mumbai', 'mumbai suburban': 'Mumbai', 'mumbai city': 'Mumbai', 'bombay': 'Mumbai', 'poona': 'Pune',
    'kalyan': 'Kalyan-Dombivli', 'dombivli': 'Kalyan-Dombivli', 'mira bhayandar': 'Mira-Bhayandar', 'vasai': 'Vasai-Virar', 'virar': 'Vasai-Virar',
    'vasai virar': 'Vasai-Virar', 'new mumbai': 'Navi Mumbai' };

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function matchCity(name) {
    var n = norm(name);
    if (!n) return '';
    if (aliases[n]) return aliases[n];
    var all = Object.keys(cityDistrict);
    for (var i = 0; i < all.length; i++) if (norm(all[i]) === n) return all[i];
    for (i = 0; i < all.length; i++) { var c = norm(all[i].replace(/\(.*?\)/g, '')); if (c === n) return all[i]; }
    return '';
  }
  function matchLocality(city, name) {
    var n = norm(name), list = L[city] || [];
    if (!n) return '';
    for (var i = 0; i < list.length; i++) if (norm(list[i]) === n) return list[i];
    for (i = 0; i < list.length; i++) if (n.indexOf(norm(list[i])) === 0 || norm(list[i]).indexOf(n) === 0) return list[i];
    return '';
  }
  function districtOf(city) { return cityDistrict[city] || ''; }
  return { puneZones: puneZones, states: states, districts: districts, localities: L, popular: popular, districtOf: districtOf, matchCity: matchCity, matchLocality: matchLocality };
})();
