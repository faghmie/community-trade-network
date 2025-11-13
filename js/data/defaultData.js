// Default contractors data
const defaultContractors = [
    {
        id: '1',
        name: 'John Smith Plumbing',
        category: 'Plumbing',
        email: 'john@smithplumbing.com',
        phone: '(555) 123-4567',
        website: 'https://smithplumbing.com',
        location: 'Johannesburg, Gauteng',
        rating: 4.5,
        reviews: [
            {
                id: 'r1',
                reviewerName: 'Sarah Johnson',
                rating: 5,
                comment: 'Excellent work! Fixed my leaky faucet quickly and professionally.',
                date: new Date('2024-01-15').toISOString(),
                status: 'approved'
            },
            {
                id: 'r2',
                reviewerName: 'Mike Chen',
                rating: 4,
                comment: 'Good service, fair pricing. Would hire again.',
                date: new Date('2024-02-20').toISOString(),
                status: 'approved'
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
        rating: 4.2,
        reviews: [
            {
                id: 'r3',
                reviewerName: 'Lisa Rodriguez',
                rating: 4,
                comment: 'Fixed my electrical issues efficiently. Professional team.',
                date: new Date('2024-01-22').toISOString(),
                status: 'approved'
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
        rating: 4.8,
        reviews: [
            {
                id: 'r4',
                reviewerName: 'Robert Wilson',
                rating: 5,
                comment: 'Outstanding work on our home renovation! Highly recommended.',
                date: new Date('2024-03-01').toISOString(),
                status: 'approved'
            },
            {
                id: 'r5',
                reviewerName: 'Emily Davis',
                rating: 5,
                comment: 'Professional, timely, and great quality work.',
                date: new Date('2024-03-10').toISOString(),
                status: 'approved'
            },
            {
                id: 'r6',
                reviewerName: 'James Brown',
                rating: 4,
                comment: 'Good work but slightly over budget.',
                date: new Date('2024-03-15').toISOString(),
                status: 'pending'
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
        rating: 4.6,
        reviews: [
            {
                id: 'r7',
                reviewerName: 'Amanda White',
                rating: 5,
                comment: 'Beautiful paint job! Very clean and professional.',
                date: new Date('2024-02-14').toISOString(),
                status: 'approved'
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
        rating: 0,
        reviews: [
            {
                id: 'r8',
                reviewerName: 'Thomas Green',
                rating: 4,
                comment: 'Great landscaping work! My yard looks amazing.',
                date: new Date('2024-03-20').toISOString(),
                status: 'pending'
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
        rating: 4.0,
        reviews: [
            {
                id: 'r9',
                reviewerName: 'Jennifer Lee',
                rating: 4,
                comment: 'Fixed my AC unit quickly. Fair price.',
                date: new Date('2024-03-05').toISOString(),
                status: 'approved'
            },
            {
                id: 'r10',
                reviewerName: 'David Miller',
                rating: 3,
                comment: 'Service was okay but took longer than expected.',
                date: new Date('2024-03-25').toISOString(),
                status: 'rejected'
            }
        ],
        createdAt: new Date().toISOString()
    }
];

// South African provinces and areas
const southAfricanProvinces = {
    'Gauteng': [
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
    'Western Cape': [
        'Cape Town',
        'Stellenbosch',
        'Paarl',
        'Worcester',
        'George',
        'Stellenbosch',
        'Somerset West',
        'Bellville',
        'Durbanville',
        'Constantia'
    ],
    'KwaZulu-Natal': [
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
    'Eastern Cape': [
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
    'Free State': [
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
    'Mpumalanga': [
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
    'Limpopo': [
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
    'North West': [
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
    'Northern Cape': [
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
    ]
};