// js/data/defaultData.js
// Default contractors data with enhanced location data for map integration
const defaultContractors = [
    {
        id: '1',
        name: 'John Smith Plumbing',
        category: 'Plumbing',
        email: 'john@smithplumbing.com',
        phone: '(555) 123-4567',
        website: 'https://smithplumbing.com',
        location: 'Johannesburg, Gauteng',
        address: '123 Main Street, Johannesburg, Gauteng, 2000',
        serviceAreas: ['Johannesburg', 'Sandton', 'Randburg', 'Roodepoort'],
        coordinates: [-26.2041, 28.0473], // Johannesburg coordinates
        rating: 4.5,
        reviewCount: 2,
        overallRating: 4.5,
        reviews: [
            {
                id: 'r1',
                reviewerName: 'Sarah Johnson',
                rating: 5,
                comment: 'Excellent work! Fixed my leaky faucet quickly and professionally.',
                date: new Date('2024-01-15').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 4,
                    timeliness: 5,
                    value: 5
                }
            },
            {
                id: 'r2',
                reviewerName: 'Mike Chen',
                rating: 4,
                comment: 'Good service, fair pricing. Would hire again.',
                date: new Date('2024-02-20').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 4,
                    communication: 4,
                    timeliness: 4,
                    value: 4
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Quality Electric LLC',
        category: 'Electrical',
        email: 'info@qualityelectric.com',
        phone: '(555) 987-6543',
        website: 'https://qualityelectric.com',
        location: 'Cape Town, Western Cape',
        address: '456 Long Street, Cape Town, Western Cape, 8001',
        serviceAreas: ['Cape Town', 'Bellville', 'Somerset West', 'Durbanville'],
        coordinates: [-33.9249, 18.4241], // Cape Town coordinates
        rating: 4.2,
        reviewCount: 1,
        overallRating: 4.2,
        reviews: [
            {
                id: 'r3',
                reviewerName: 'Lisa Rodriguez',
                rating: 4,
                comment: 'Fixed my electrical issues efficiently. Professional team.',
                date: new Date('2024-01-22').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 4,
                    communication: 5,
                    timeliness: 4,
                    value: 4
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Dream Home Builders',
        category: 'General Contracting',
        email: 'contact@dreamhome.com',
        phone: '(555) 456-7890',
        website: 'https://dreamhomebuilders.com',
        location: 'Durban, KwaZulu-Natal',
        address: '789 Marine Parade, Durban, KwaZulu-Natal, 4001',
        serviceAreas: ['Durban', 'Umhlanga', 'Pinetown', 'Amanzimtoti'],
        coordinates: [-29.8587, 31.0218], // Durban coordinates
        rating: 4.8,
        reviewCount: 3,
        overallRating: 4.8,
        reviews: [
            {
                id: 'r4',
                reviewerName: 'Robert Wilson',
                rating: 5,
                comment: 'Outstanding work on our home renovation! Highly recommended.',
                date: new Date('2024-03-01').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 5,
                    timeliness: 5,
                    value: 5
                }
            },
            {
                id: 'r5',
                reviewerName: 'Emily Davis',
                rating: 5,
                comment: 'Professional, timely, and great quality work.',
                date: new Date('2024-03-10').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 4,
                    timeliness: 5,
                    value: 5
                }
            },
            {
                id: 'r6',
                reviewerName: 'James Brown',
                rating: 4,
                comment: 'Good work but slightly over budget.',
                date: new Date('2024-03-15').toISOString(),
                status: 'pending',
                categoryRatings: {
                    quality: 4,
                    communication: 3,
                    timeliness: 4,
                    value: 3
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '4',
        name: 'Perfect Paint Pros',
        category: 'Painting',
        email: 'info@perfectpaint.com',
        phone: '(555) 234-5678',
        website: 'https://perfectpaint.co.za',
        location: 'Pretoria, Gauteng',
        address: '321 Church Street, Pretoria, Gauteng, 0002',
        serviceAreas: ['Pretoria', 'Centurion', 'Midrand', 'Irene'],
        coordinates: [-25.7479, 28.2293], // Pretoria coordinates
        rating: 4.6,
        reviewCount: 1,
        overallRating: 4.6,
        reviews: [
            {
                id: 'r7',
                reviewerName: 'Amanda White',
                rating: 5,
                comment: 'Beautiful paint job! Very clean and professional.',
                date: new Date('2024-02-14').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 4,
                    timeliness: 5,
                    value: 4
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '5',
        name: 'Green Thumb Landscaping',
        category: 'Landscaping',
        email: 'info@greenthumb.com',
        phone: '(555) 345-6789',
        website: '',
        location: 'Port Elizabeth, Eastern Cape',
        address: '654 Beach Road, Port Elizabeth, Eastern Cape, 6001',
        serviceAreas: ['Port Elizabeth', 'Uitenhage', 'Jeffreys Bay', 'Stutterheim'],
        coordinates: [-33.9608, 25.6022], // Port Elizabeth coordinates
        rating: 4.0,
        reviewCount: 1,
        overallRating: 4.0,
        reviews: [
            {
                id: 'r8',
                reviewerName: 'Thomas Green',
                rating: 4,
                comment: 'Great landscaping work! My yard looks amazing.',
                date: new Date('2024-03-20').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 4,
                    communication: 4,
                    timeliness: 4,
                    value: 4
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '6',
        name: 'Cool Breeze HVAC',
        category: 'HVAC',
        email: 'service@coolbreeze.com',
        phone: '(555) 456-7891',
        website: 'https://coolbreeze-sa.co.za',
        location: 'Bloemfontein, Free State',
        address: '987 President Street, Bloemfontein, Free State, 9301',
        serviceAreas: ['Bloemfontein', 'Welkom', 'Bethlehem', 'Sasolburg'],
        coordinates: [-29.0852, 26.1596], // Bloemfontein coordinates
        rating: 4.0,
        reviewCount: 2,
        overallRating: 4.0,
        reviews: [
            {
                id: 'r9',
                reviewerName: 'Jennifer Lee',
                rating: 4,
                comment: 'Fixed my AC unit quickly. Fair price.',
                date: new Date('2024-03-05').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 4,
                    communication: 4,
                    timeliness: 5,
                    value: 4
                }
            },
            {
                id: 'r10',
                reviewerName: 'David Miller',
                rating: 3,
                comment: 'Service was okay but took longer than expected.',
                date: new Date('2024-03-25').toISOString(),
                status: 'rejected',
                categoryRatings: {
                    quality: 3,
                    communication: 2,
                    timeliness: 2,
                    value: 3
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '7',
        name: 'Master Roofing Solutions',
        category: 'Roofing',
        email: 'info@masterroofing.co.za',
        phone: '(555) 567-8901',
        website: 'https://masterroofing.co.za',
        location: 'Nelspruit, Mpumalanga',
        address: '147 Riverside Road, Nelspruit, Mpumalanga, 1200',
        serviceAreas: ['Nelspruit', 'White River', 'Malelane', 'Hazyview'],
        coordinates: [-25.4745, 30.9703], // Nelspruit coordinates
        rating: 4.7,
        reviewCount: 2,
        overallRating: 4.7,
        reviews: [
            {
                id: 'r11',
                reviewerName: 'Paul van der Merwe',
                rating: 5,
                comment: 'Excellent roofing repair after the storm damage.',
                date: new Date('2024-02-28').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 4,
                    timeliness: 5,
                    value: 5
                }
            },
            {
                id: 'r12',
                reviewerName: 'Susan Khoza',
                rating: 4,
                comment: 'Good quality work, fair pricing.',
                date: new Date('2024-03-12').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 4,
                    communication: 5,
                    timeliness: 4,
                    value: 4
                }
            }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '8',
        name: 'Precision Carpentry Works',
        category: 'Carpentry',
        email: 'craft@precisioncarpentry.co.za',
        phone: '(555) 678-9012',
        website: '',
        location: 'Stellenbosch, Western Cape',
        address: '258 Dorp Street, Stellenbosch, Western Cape, 7600',
        serviceAreas: ['Stellenbosch', 'Paarl', 'Franschhoek', 'Somerset West'],
        coordinates: [-33.9347, 18.8669], // Stellenbosch coordinates
        rating: 4.9,
        reviewCount: 3,
        overallRating: 4.9,
        reviews: [
            {
                id: 'r13',
                reviewerName: 'Michael Botha',
                rating: 5,
                comment: 'Beautiful custom cabinets! Exceptional craftsmanship.',
                date: new Date('2024-01-30').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 5,
                    timeliness: 5,
                    value: 5
                }
            },
            {
                id: 'r14',
                reviewerName: 'Sarah Petersen',
                rating: 5,
                comment: 'Transformed our living room with custom woodwork.',
                date: new Date('2024-02-15').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 4,
                    timeliness: 5,
                    value: 5
                }
            },
            {
                id: 'r15',
                reviewerName: 'John de Villiers',
                rating: 4,
                comment: 'Good work, minor delays but worth the wait.',
                date: new Date('2024-03-08').toISOString(),
                status: 'approved',
                categoryRatings: {
                    quality: 5,
                    communication: 3,
                    timeliness: 3,
                    value: 4
                }
            }
        ],
        createdAt: new Date().toISOString()
    }
];

// South African provinces and areas with coordinates
const southAfricanProvinces = {
    'Gauteng': {
        cities: [
            'Johannesburg',
            'Pretoria',
            'Sandton',
            'Randburg',
            'Roodepoort',
            'Centurion',
            'Midrand',
            'Soweto',
            'Germiston',
            'Boksburg'
        ],
        coordinates: [-26.2708, 28.1123] // Central Gauteng
    },
    'Western Cape': {
        cities: [
            'Cape Town',
            'Stellenbosch',
            'Paarl',
            'Worcester',
            'George',
            'Somerset West',
            'Bellville',
            'Durbanville',
            'Constantia'
        ],
        coordinates: [-33.9249, 18.4241] // Cape Town
    },
    'KwaZulu-Natal': {
        cities: [
            'Durban',
            'Pietermaritzburg',
            'Ballito',
            'Umhlanga',
            'Richards Bay',
            'Pinetown',
            'Amanzimtoti',
            'Margate',
            'Scottburgh',
            'Empangeni'
        ],
        coordinates: [-29.8587, 31.0218] // Durban
    },
    'Eastern Cape': {
        cities: [
            'Port Elizabeth',
            'East London',
            'Grahamstown',
            'Mthatha',
            'Queenstown',
            'Uitenhage',
            'Graaff-Reinet',
            'Jeffreys Bay',
            'Stutterheim',
            'Butterworth'
        ],
        coordinates: [-33.9608, 25.6022] // Port Elizabeth
    },
    'Free State': {
        cities: [
            'Bloemfontein',
            'Welkom',
            'Bethlehem',
            'Kroonstad',
            'Sasolburg',
            'Virginia',
            'Phuthaditjhaba',
            'Botshabelo',
            'Thaba Nchu',
            'Harrismith'
        ],
        coordinates: [-29.0852, 26.1596] // Bloemfontein
    },
    'Mpumalanga': {
        cities: [
            'Nelspruit',
            'Witbank',
            'Middelburg',
            'Ermelo',
            'Secunda',
            'Standerton',
            'Piet Retief',
            'Barberton',
            'Malelane',
            'Hazyview'
        ],
        coordinates: [-25.4745, 30.9703] // Nelspruit
    },
    'Limpopo': {
        cities: [
            'Polokwane',
            'Thohoyandou',
            'Tzaneen',
            'Lephalale',
            'Mokopane',
            'Louis Trichardt',
            'Giyani',
            'Phalaborwa',
            'Bela-Bela',
            'Hoedspruit'
        ],
        coordinates: [-23.9045, 29.4689] // Polokwane
    },
    'North West': {
        cities: [
            'Rustenburg',
            'Potchefstroom',
            'Klerksdorp',
            'Mahikeng',
            'Brits',
            'Zeerust',
            'Lichtenburg',
            'Stilfontein',
            'Vryburg',
            'Wolmaransstad'
        ],
        coordinates: [-26.6639, 27.0817] // Rustenburg
    },
    'Northern Cape': {
        cities: [
            'Kimberley',
            'Upington',
            'Springbok',
            'De Aar',
            'Kuruman',
            'Postmasburg',
            'Colesberg',
            'Prieska',
            'Calvinia',
            'Barkly West'
        ],
        coordinates: [-28.7419, 24.7719] // Kimberley
    }
};

// South African city coordinates for map geocoding
const southAfricanCityCoordinates = {
    'johannesburg': [-26.2041, 28.0473],
    'pretoria': [-25.7479, 28.2293],
    'cape town': [-33.9249, 18.4241],
    'durban': [-29.8587, 31.0218],
    'port elizabeth': [-33.9608, 25.6022],
    'bloemfontein': [-29.0852, 26.1596],
    'nelspruit': [-25.4745, 30.9703],
    'stellenbosch': [-33.9347, 18.8669],
    'sandton': [-26.1076, 28.0567],
    'randburg': [-26.0941, 27.9960],
    'roodepoort': [-26.1206, 27.8896],
    'centurion': [-25.8682, 28.1700],
    'midrand': [-25.9895, 28.1283],
    'soweto': [-26.2485, 27.8540],
    'germiston': [-26.2183, 28.1674],
    'boksburg': [-26.2135, 28.2597],
    'stellenbosch': [-33.9347, 18.8669],
    'paarl': [-33.7272, 18.9575],
    'worcester': [-33.6465, 19.4489],
    'george': [-33.9881, 22.4530],
    'somerset west': [-34.0794, 18.8484],
    'bellville': [-33.8954, 18.6298],
    'durbanville': [-33.8300, 18.6497],
    'constantia': [-34.0246, 18.4232],
    'pietermaritzburg': [-29.6006, 30.3794],
    'ballito': [-29.5390, 31.2087],
    'umhlanga': [-29.7180, 31.0858],
    'richards bay': [-28.7807, 32.0383],
    'pinetown': [-29.8174, 30.8866],
    'amanzimtoti': [-30.0529, 30.8903],
    'margate': [-30.8544, 30.3667],
    'scottburgh': [-30.2867, 30.7531],
    'empangeni': [-28.7625, 31.8933],
    'east london': [-33.0292, 27.8546],
    'grahamstown': [-33.3106, 26.5256],
    'mthatha': [-31.5889, 28.7844],
    'queenstown': [-31.8976, 26.8753],
    'uitenhage': [-33.7654, 25.4029],
    'graaff-reinet': [-32.2521, 24.5308],
    'jeffreys bay': [-34.0503, 24.9172],
    'stutterheim': [-32.5708, 27.4240],
    'butterworth': [-32.3306, 28.1494],
    'welkom': [-27.9865, 26.7066],
    'bethlehem': [-28.2308, 28.3071],
    'kroonstad': [-27.6504, 27.2349],
    'sasolburg': [-26.8136, 27.8165],
    'virginia': [-28.1036, 26.8659],
    'phuthaditjhaba': [-28.5242, 28.8158],
    'botshabelo': [-29.2333, 26.7000],
    'thaba nchu': [-29.2097, 26.8394],
    'harrismith': [-28.2728, 29.1294],
    'witbank': [-25.8747, 29.2333],
    'middelburg': [-25.7751, 29.4648],
    'ermelo': [-26.5333, 29.9833],
    'secunda': [-26.5500, 29.1667],
    'standerton': [-26.9500, 29.2500],
    'piet retief': [-27.0000, 30.8000],
    'barberton': [-25.7881, 31.0531],
    'malelane': [-25.4747, 31.5167],
    'hazyview': [-25.0500, 31.1167],
    'polokwane': [-23.9045, 29.4689],
    'thohoyandou': [-22.9456, 30.4850],
    'tzaneen': [-23.8333, 30.1667],
    'lephalale': [-23.6667, 27.7500],
    'mokopane': [-24.1833, 29.0167],
    'louis trichardt': [-23.0500, 29.9000],
    'giyani': [-23.3167, 30.7167],
    'phalaborwa': [-23.9500, 31.1167],
    'bela-bela': [-24.8833, 28.2833],
    'hoedspruit': [-24.3500, 30.9500],
    'rustenburg': [-25.6544, 27.2559],
    'potchefstroom': [-26.7145, 27.0970],
    'klerksdorp': [-26.8667, 26.6667],
    'mahikeng': [-25.8654, 25.6445],
    'brits': [-25.6347, 27.7803],
    'zeerust': [-25.5333, 26.0833],
    'lichtenburg': [-26.1500, 26.1667],
    'stilfontein': [-26.8444, 26.7683],
    'vryburg': [-26.9561, 24.7283],
    'wolmaransstad': [-27.2000, 25.9833],
    'kimberley': [-28.7419, 24.7719],
    'upington': [-28.4572, 21.2425],
    'springbok': [-29.6667, 17.8833],
    'de aar': [-30.6500, 24.0167],
    'kuruman': [-27.4500, 23.4333],
    'postmasburg': [-28.3333, 23.0667],
    'colesberg': [-30.7167, 25.1000],
    'prieska': [-29.6667, 22.7500],
    'calvinia': [-31.4667, 19.7667],
    'barkly west': [-28.5333, 24.5167]
};

const defaultCategories = [
    "Plumbing",
    "Electrical",
    "General Contracting",
    "Roofing",
    "Painting",
    "Landscaping",
    "HVAC",
    "Carpentry"
];