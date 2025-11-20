-- Insert default categories for Community Trade Network
INSERT INTO categories (id, data, created_at) VALUES
-- Home Services - Construction & Renovation
('550e8400-e29b-41d4-a716-446655440010', '{"name": "General Contractors", "type": "Construction & Renovation", "subtype": "General Contracting", "description": "Professional contractors for home construction and major renovation projects"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440011', '{"name": "Home Renovators", "type": "Construction & Renovation", "subtype": "Home Renovation", "description": "Specialists in home remodeling and renovation work"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440012', '{"name": "Kitchen & Bath Specialists", "type": "Construction & Renovation", "subtype": "Kitchen & Bath", "description": "Experts in kitchen and bathroom remodeling and installation"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440013', '{"name": "Deck & Fence Builders", "type": "Construction & Renovation", "subtype": "Outdoor Structures", "description": "Professionals for outdoor deck, fence, and patio construction"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Home Services - Repair & Maintenance
('550e8400-e29b-41d4-a716-446655440014', '{"name": "Plumbers", "type": "Repair & Maintenance", "subtype": "Plumbing", "description": "Licensed plumbing professionals for repairs and installations"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440015', '{"name": "Electricians", "type": "Repair & Maintenance", "subtype": "Electrical", "description": "Certified electrical contractors for wiring and electrical systems"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440016', '{"name": "Garage Doors & Gates", "type": "Repair & Maintenance", "subtype": "HVAC", "description": "Heating, ventilation, and air conditioning specialists"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440017', '{"name": "Appliance Repair", "type": "Repair & Maintenance", "subtype": "Appliance Repair", "description": "Technicians for home appliance repair and maintenance"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440018', '{"name": "Handyman Services", "type": "Repair & Maintenance", "subtype": "General Repair", "description": "Multi-skilled professionals for various home repair tasks"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Home Services - Home Improvement
('550e8400-e29b-41d4-a716-446655440019', '{"name": "Painters", "type": "Home Improvement", "subtype": "Painting", "description": "Professional painting services for interior and exterior"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440020', '{"name": "Carpenters", "type": "Home Improvement", "subtype": "Carpentry", "description": "Skilled woodworkers for custom carpentry and finishing"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440021', '{"name": "Flooring Installers", "type": "Home Improvement", "subtype": "Flooring", "description": "Experts in floor installation, repair, and refinishing"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440022', '{"name": "Roofers", "type": "Home Improvement", "subtype": "Roofing", "description": "Professional roofing contractors for installation and repair"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440023', '{"name": "Landscapers", "type": "Home Improvement", "subtype": "Landscaping", "description": "Landscape design, installation, and maintenance professionals"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Professional Services - Business Services
('550e8400-e29b-41d4-a716-446655440024', '{"name": "Accountants & Bookkeepers", "type": "Business Services", "subtype": "Accounting", "description": "Financial professionals for accounting and bookkeeping services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440025', '{"name": "IT Support & Tech Services", "type": "Business Services", "subtype": "IT Support", "description": "Technology support and IT consulting services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440026', '{"name": "Marketing Consultants", "type": "Business Services", "subtype": "Marketing", "description": "Marketing strategy and digital marketing professionals"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440027', '{"name": "Web Developers & Designers", "type": "Business Services", "subtype": "Web Development", "description": "Website development, design, and digital presence services"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Professional Services - Creative Services
('550e8400-e29b-41d4-a716-446655440028', '{"name": "Photographers", "type": "Creative Services", "subtype": "Photography", "description": "Professional photography services for events and portraits"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440029', '{"name": "Graphic Designers", "type": "Creative Services", "subtype": "Graphic Design", "description": "Visual design professionals for branding and marketing materials"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440030', '{"name": "Event Planners", "type": "Creative Services", "subtype": "Event Planning", "description": "Professional event coordination and planning services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440031', '{"name": "Music Teachers & Tutors", "type": "Creative Services", "subtype": "Music Instruction", "description": "Music education and instrument instruction services"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Personal & Wellness Services - Home Services
('550e8400-e29b-41d4-a716-446655440032', '{"name": "Cleaners & Maids", "type": "Home Care Services", "subtype": "Cleaning", "description": "Professional cleaning and housekeeping services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440033', '{"name": "Professional Organizers", "type": "Home Care Services", "subtype": "Organization", "description": "Home organization and decluttering specialists"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440034', '{"name": "Pet Sitters & Walkers", "type": "Home Care Services", "subtype": "Pet Care", "description": "Professional pet care and animal services"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Personal & Wellness Services - Wellness Services
('550e8400-e29b-41d4-a716-446655440035', '{"name": "Personal Trainers", "type": "Wellness Services", "subtype": "Fitness Training", "description": "Personal fitness training and exercise instruction"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440036', '{"name": "Massage Therapists", "type": "Wellness Services", "subtype": "Massage Therapy", "description": "Professional massage and therapeutic bodywork"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440037', '{"name": "Yoga Instructors", "type": "Wellness Services", "subtype": "Yoga Instruction", "description": "Yoga classes and mindfulness instruction"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440038', '{"name": "Nutritionists", "type": "Wellness Services", "subtype": "Nutrition", "description": "Nutrition counseling and dietary planning services"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Specialized Services - Automotive
('550e8400-e29b-41d4-a716-446655440039', '{"name": "Mechanics & Auto Repair", "type": "Automotive Services", "subtype": "Auto Repair", "description": "Automotive repair and maintenance services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440040', '{"name": "Auto Detailers", "type": "Automotive Services", "subtype": "Auto Detailing", "description": "Professional automotive cleaning and detailing"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440041', '{"name": "Body Shops", "type": "Automotive Services", "subtype": "Auto Body", "description": "Automotive body repair and collision services"}'::jsonb, '2024-01-01T00:00:00.000Z'),

-- Specialized Services - Outdoor Services
('550e8400-e29b-41d4-a716-446655440042', '{"name": "Gardeners", "type": "Outdoor Services", "subtype": "Gardening", "description": "Professional gardening and lawn care services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440043', '{"name": "Tree Services", "type": "Outdoor Services", "subtype": "Tree Care", "description": "Tree trimming, removal, and arborist services"}'::jsonb, '2024-01-01T00:00:00.000Z'),
('550e8400-e29b-41d4-a716-446655440044', '{"name": "Pool Maintenance", "type": "Outdoor Services", "subtype": "Pool Care", "description": "Swimming pool maintenance and cleaning services"}'::jsonb, '2024-01-01T00:00:00.000Z');