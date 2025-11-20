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

-- User Feedback Table for Contractor Review App
-- Stores customer feedback about the app experience (not contractor reviews)

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Core feedback data stored as JSONB for flexibility
  feedback_data JSONB NOT NULL,
  
  -- Status for moderation/workflow
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned', 'archived')),
  
  -- Index for better query performance
  CONSTRAINT valid_feedback_data CHECK (feedback_data ? 'rating')
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback((feedback_data->>'rating'));
CREATE INDEX IF NOT EXISTS idx_user_feedback_data ON user_feedback USING GIN (feedback_data);

-- Example of the JSONB structure:
-- {
--   "rating": 4,
--   "positive_comments": "Love the search filters!",
--   "improvement_comments": "Would like more contractor categories",
--   "contact_email": "optional@example.com",
--   "user_agent": "Mozilla/5.0...",
--   "app_version": "1.0.0",
--   "page_context": "contractor-details",
--   "feature_used": "review-submission"
-- }

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