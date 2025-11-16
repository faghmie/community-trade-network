-- Create contractors table with JSONB for flexible data
CREATE TABLE contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data JSONB NOT NULL,  -- All contractor data in one flexible document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table with JSONB  
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
    data JSONB NOT NULL,  -- All review data in one flexible document
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table with JSONB
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data JSONB NOT NULL,  -- All category data in one flexible document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on contractors" ON contractors FOR ALL USING (true);
CREATE POLICY "Allow all operations on reviews" ON reviews FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_contractors_data ON contractors USING gin(data);
CREATE INDEX idx_reviews_contractor_id ON reviews(contractor_id);
CREATE INDEX idx_reviews_data ON reviews USING gin(data);
CREATE INDEX idx_categories_data ON categories USING gin(data);