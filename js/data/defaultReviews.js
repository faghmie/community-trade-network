// js/data/defaultReviews.js
// Default reviews data with UUIDs for Supabase integration

export const defaultReviews = [
    {
        id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
        contractor_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
        id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
        contractor_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
    },
    {
        id: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
        contractor_id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
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
    },
    {
        id: 'g7h8i9j0-k1l2-3456-ghij-789012345678',
        contractor_id: 'f6g7h8i9-j0k1-2345-fghi-678901234567',
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
        id: 'h8i9j0k1-l2m3-4567-hijk-890123456789',
        contractor_id: 'f6g7h8i9-j0k1-2345-fghi-678901234567',
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
        id: 'i9j0k1l2-m3n4-5678-ijkl-901234567890',
        contractor_id: 'f6g7h8i9-j0k1-2345-fghi-678901234567',
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
    },
    {
        id: 'k1l2m3n4-o5p6-7890-klmn-123456789012',
        contractor_id: 'j0k1l2m3-n4o5-6789-jklm-012345678901',
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
    },
    {
        id: 'm3n4o5p6-q7r8-9012-mnop-345678901234',
        contractor_id: 'l2m3n4o5-p6q7-8901-lmno-234567890123',
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
    },
    {
        id: 'o5p6q7r8-s9t0-1234-opqr-567890123456',
        contractor_id: 'n4o5p6q7-r8s9-0123-nopq-456789012345',
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
        id: 'p6q7r8s9-t0u1-2345-pqrs-678901234567',
        contractor_id: 'n4o5p6q7-r8s9-0123-nopq-456789012345',
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
    },
    {
        id: 'r8s9t0u1-v2w3-4567-rstu-890123456789',
        contractor_id: 'q7r8s9t0-u1v2-3456-qrst-789012345678',
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
        id: 's9t0u1v2-w3x4-5678-stuv-901234567890',
        contractor_id: 'q7r8s9t0-u1v2-3456-qrst-789012345678',
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
    },
    {
        id: 'u1v2w3x4-y5z6-7890-uvwx-123456789012',
        contractor_id: 't0u1v2w3-x4y5-6789-tuvw-012345678901',
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
        id: 'v2w3x4y5-z6a7-8901-vwxy-234567890123',
        contractor_id: 't0u1v2w3-x4y5-6789-tuvw-012345678901',
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
        id: 'w3x4y5z6-a7b8-9012-wxyz-345678901234',
        contractor_id: 't0u1v2w3-x4y5-6789-tuvw-012345678901',
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
];
