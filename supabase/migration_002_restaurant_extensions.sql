-- =============================================================================
-- RESTAURANT FEATURES EXTENSION - MIGRATION 002
-- =============================================================================
-- Version: 2.0.0
-- Description: Comprehensive restaurant features extension for dietary restriction management
-- Safety Level: PRODUCTION - Extends life-threatening allergy safety to restaurants
-- =============================================================================

-- Enable PostGIS extension for location-based queries
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- NEW CUSTOM TYPES AND ENUMS FOR RESTAURANT FEATURES
-- =============================================================================

-- Restaurant chain vs independent classification
CREATE TYPE restaurant_classification AS ENUM (
    'independent',    -- Independent restaurant
    'chain',         -- Chain restaurant with standardized operations
    'franchise',     -- Franchise with some local variation
    'food_truck',    -- Mobile food service
    'catering',      -- Catering service
    'ghost_kitchen'  -- Delivery-only kitchen
);

-- Restaurant verification status
CREATE TYPE verification_status AS ENUM (
    'unverified',    -- No verification completed
    'pending',       -- Verification in progress
    'community',     -- Community verified
    'expert',        -- Expert verified
    'official'       -- Official restaurant verified
);

-- Safety incident severity levels
CREATE TYPE incident_severity AS ENUM (
    'minor',         -- Minor reaction or concern
    'moderate',      -- Moderate reaction requiring attention
    'severe',        -- Severe reaction requiring medical attention
    'critical'       -- Life-threatening incident
);

-- Review moderation status
CREATE TYPE review_moderation_status AS ENUM (
    'pending',       -- Awaiting moderation
    'approved',      -- Approved by moderator
    'rejected',      -- Rejected by moderator
    'flagged',       -- Flagged for review
    'auto_approved'  -- Automatically approved
);

-- Menu item availability
CREATE TYPE menu_availability AS ENUM (
    'always',        -- Always available
    'seasonal',      -- Seasonal availability
    'limited_time',  -- Limited time offer
    'weekends_only', -- Weekend special
    'discontinued'   -- No longer available
);

-- =============================================================================
-- RESTAURANT CORE DATA EXTENSIONS
-- =============================================================================

-- Extended restaurant information (extends existing restaurants table)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS classification restaurant_classification DEFAULT 'independent';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS parent_chain_id UUID REFERENCES public.restaurants(id);
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS franchise_group TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS establishment_year INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS seating_capacity INTEGER;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS parking_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS outdoor_seating BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS takeout_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS reservations_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS dress_code TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS noise_level TEXT; -- 'quiet', 'moderate', 'loud'
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS payment_methods TEXT[]; -- 'cash', 'credit', 'mobile_pay', etc.
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS languages_spoken TEXT[]; -- Languages staff can communicate in

-- Update existing location columns to use PostGIS
ALTER TABLE public.restaurants ALTER COLUMN latitude TYPE GEOMETRY(POINT, 4326) USING ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS longitude;
ALTER TABLE public.restaurants RENAME COLUMN latitude TO location;

-- Restaurant verification and safety protocols
CREATE TABLE public.restaurant_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    verification_type verification_status NOT NULL DEFAULT 'unverified',
    verified_by UUID REFERENCES public.user_profiles(id),
    verification_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    verification_notes TEXT,
    documentation_urls TEXT[], -- URLs to verification documents
    safety_certifications TEXT[], -- Food safety, allergen training certificates
    staff_training_date TIMESTAMPTZ,
    equipment_inspection_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant safety protocols and training
CREATE TABLE public.restaurant_safety_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    has_dedicated_prep_area BOOLEAN DEFAULT FALSE,
    has_dedicated_equipment BOOLEAN DEFAULT FALSE,
    has_dedicated_fryer BOOLEAN DEFAULT FALSE,
    has_staff_training BOOLEAN DEFAULT FALSE,
    staff_training_frequency TEXT, -- 'monthly', 'quarterly', 'annually'
    has_ingredient_tracking BOOLEAN DEFAULT FALSE,
    has_cross_contamination_protocols BOOLEAN DEFAULT FALSE,
    protocol_description TEXT,
    last_training_date TIMESTAMPTZ,
    next_training_date TIMESTAMPTZ,
    responsible_manager TEXT,
    emergency_procedures TEXT,
    incident_response_plan TEXT,
    supplier_verification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, restriction_id)
);

-- Health department and regulatory information
CREATE TABLE public.restaurant_health_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    health_department TEXT NOT NULL,
    inspection_date TIMESTAMPTZ NOT NULL,
    rating_score INTEGER, -- Numeric score if applicable
    rating_grade TEXT, -- Letter grade (A, B, C) if applicable
    violations_count INTEGER DEFAULT 0,
    critical_violations_count INTEGER DEFAULT 0,
    violations_description TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    inspector_notes TEXT,
    report_url TEXT, -- URL to official inspection report
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- MENU AND INGREDIENTS MANAGEMENT
-- =============================================================================

-- Menu categories for organization
CREATE TABLE public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual menu items
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(8,2),
    currency_code TEXT DEFAULT 'USD',
    calories INTEGER,
    serving_size TEXT,
    preparation_time_minutes INTEGER,
    spice_level INTEGER CHECK (spice_level >= 0 AND spice_level <= 5),
    availability menu_availability DEFAULT 'always',
    dietary_tags TEXT[], -- 'vegan', 'vegetarian', 'gluten-free', 'keto', etc.
    allergen_warnings TEXT[], -- Known allergens in the dish
    may_contain_allergens TEXT[], -- Potential cross-contamination
    ingredient_list TEXT, -- Raw ingredient list
    preparation_notes TEXT, -- Special preparation instructions
    customization_options JSONB, -- Available modifications
    image_urls TEXT[], -- URLs to dish images
    nutritional_info JSONB,
    last_verified_date TIMESTAMPTZ,
    is_signature_dish BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed ingredient mapping for menu items
CREATE TABLE public.menu_item_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    ingredient_text TEXT, -- How it appears on menu
    is_removable BOOLEAN DEFAULT FALSE, -- Can be removed upon request
    is_substitutable BOOLEAN DEFAULT FALSE, -- Can be substituted
    substitution_options TEXT[], -- Available substitutions
    preparation_method TEXT, -- 'fried', 'grilled', 'raw', etc.
    source_allergen_risk BOOLEAN DEFAULT FALSE, -- Source contamination risk
    cross_contamination_risk BOOLEAN DEFAULT FALSE, -- Prep contamination risk
    confidence_score INTEGER DEFAULT 50, -- Confidence in ingredient identification
    verified_by_staff BOOLEAN DEFAULT FALSE,
    last_verified_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_item_id, ingredient_id)
);

-- Menu item safety assessments for specific restrictions
CREATE TABLE public.menu_item_safety_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    safety_level safety_level NOT NULL,
    risk_factors JSONB,
    preparation_requirements TEXT, -- Special prep needed for safety
    staff_notes TEXT, -- Notes for kitchen staff
    customer_notes TEXT, -- Notes to share with customers
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    assessed_by UUID REFERENCES public.user_profiles(id),
    verified_by_restaurant BOOLEAN DEFAULT FALSE,
    confidence_score INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_item_id, restriction_id)
);

-- =============================================================================
-- COMMUNITY AND REVIEWS ENHANCEMENT
-- =============================================================================

-- Enhanced restaurant reviews (extends existing table structure)
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS menu_item_ids UUID[]; -- Specific items reviewed
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS server_name TEXT; -- Server who helped
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS manager_interaction BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS kitchen_accommodating BOOLEAN; -- Kitchen willingness to accommodate
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS wait_time_minutes INTEGER; -- Food prep wait time
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5);
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5);
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS cross_contamination_concerns BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS special_accommodations_made TEXT;
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS incident_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS follow_up_contact TEXT; -- Restaurant follow-up
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS moderation_status review_moderation_status DEFAULT 'pending';
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE public.restaurant_reviews ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Review helpfulness and community feedback
CREATE TABLE public.review_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL, -- Can be product or restaurant review
    review_type TEXT NOT NULL CHECK (review_type IN ('product', 'restaurant')),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('helpful', 'not_helpful', 'report', 'thank')),
    reason TEXT, -- Reason for reporting if applicable
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, review_type, user_id, interaction_type)
);

-- Expert endorsements and professional reviews
CREATE TABLE public.expert_endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    restriction_ids UUID[] NOT NULL, -- Restrictions the endorsement covers
    endorsement_type TEXT NOT NULL, -- 'safety_protocols', 'menu_accuracy', 'staff_training'
    endorsement_level INTEGER CHECK (endorsement_level >= 1 AND endorsement_level <= 5),
    endorsement_text TEXT,
    credentials_verified BOOLEAN DEFAULT FALSE,
    professional_title TEXT, -- 'Registered Dietitian', 'Allergist', etc.
    license_number TEXT,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SAFETY INCIDENTS AND TRACKING
-- =============================================================================

-- Safety incident reports
CREATE TABLE public.safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    incident_date TIMESTAMPTZ NOT NULL,
    severity incident_severity NOT NULL,
    restriction_ids UUID[] NOT NULL, -- Restrictions involved in incident
    menu_item_ids UUID[], -- Menu items involved if applicable
    incident_description TEXT NOT NULL,
    symptoms_experienced TEXT,
    medical_attention_required BOOLEAN DEFAULT FALSE,
    hospital_visit BOOLEAN DEFAULT FALSE,
    medication_used TEXT, -- EpiPen, Benadryl, etc.
    restaurant_response TEXT, -- How restaurant responded
    restaurant_contacted BOOLEAN DEFAULT FALSE,
    manager_involved BOOLEAN DEFAULT FALSE,
    compensation_offered TEXT,
    follow_up_actions TEXT,
    health_department_notified BOOLEAN DEFAULT FALSE,
    legal_action_considered BOOLEAN DEFAULT FALSE,
    photo_evidence TEXT[], -- URLs to photos
    medical_documentation TEXT[], -- URLs to medical records
    witness_contacts TEXT[], -- Contact info for witnesses
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.user_profiles(id),
    verification_notes TEXT,
    impact_on_rating BOOLEAN DEFAULT TRUE, -- Should affect restaurant rating
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident follow-up tracking
CREATE TABLE public.incident_follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.safety_incidents(id) ON DELETE CASCADE,
    follow_up_date TIMESTAMPTZ NOT NULL,
    follow_up_type TEXT NOT NULL, -- 'restaurant_contact', 'medical_update', 'legal_update'
    description TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ENHANCED INDEXES FOR PERFORMANCE
-- =============================================================================

-- Location-based queries with PostGIS
CREATE INDEX idx_restaurants_location_gist ON public.restaurants USING GIST (location);
CREATE INDEX idx_restaurants_classification ON public.restaurants(classification);
CREATE INDEX idx_restaurants_chain_id ON public.restaurants(parent_chain_id);
CREATE INDEX idx_restaurants_verification_status ON public.restaurants(is_verified);

-- Restaurant safety and protocols
CREATE INDEX idx_restaurant_verifications_restaurant_id ON public.restaurant_verifications(restaurant_id);
CREATE INDEX idx_restaurant_verifications_type ON public.restaurant_verifications(verification_type);
CREATE INDEX idx_restaurant_safety_protocols_restaurant_id ON public.restaurant_safety_protocols(restaurant_id);
CREATE INDEX idx_restaurant_safety_protocols_restriction_id ON public.restaurant_safety_protocols(restriction_id);

-- Health ratings
CREATE INDEX idx_restaurant_health_ratings_restaurant_id ON public.restaurant_health_ratings(restaurant_id);
CREATE INDEX idx_restaurant_health_ratings_current ON public.restaurant_health_ratings(is_current) WHERE is_current = true;
CREATE INDEX idx_restaurant_health_ratings_date ON public.restaurant_health_ratings(inspection_date);

-- Menu and ingredients
CREATE INDEX idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);
CREATE INDEX idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_categories(id);
CREATE INDEX idx_menu_items_name_trgm ON public.menu_items USING gin (name gin_trgm_ops);
CREATE INDEX idx_menu_items_dietary_tags ON public.menu_items USING gin (dietary_tags);
CREATE INDEX idx_menu_items_active ON public.menu_items(is_active) WHERE is_active = true;
CREATE INDEX idx_menu_item_ingredients_item_id ON public.menu_item_ingredients(menu_item_id);
CREATE INDEX idx_menu_item_ingredients_ingredient_id ON public.menu_item_ingredients(ingredient_id);
CREATE INDEX idx_menu_item_safety_assessments_item_id ON public.menu_item_safety_assessments(menu_item_id);
CREATE INDEX idx_menu_item_safety_assessments_restriction_id ON public.menu_item_safety_assessments(restriction_id);

-- Reviews and community features
CREATE INDEX idx_review_interactions_review_id_type ON public.review_interactions(review_id, review_type);
CREATE INDEX idx_review_interactions_user_id ON public.review_interactions(user_id);
CREATE INDEX idx_expert_endorsements_restaurant_id ON public.expert_endorsements(restaurant_id);
CREATE INDEX idx_expert_endorsements_expert_id ON public.expert_endorsements(expert_id);

-- Safety incidents
CREATE INDEX idx_safety_incidents_restaurant_id ON public.safety_incidents(restaurant_id);
CREATE INDEX idx_safety_incidents_reported_by ON public.safety_incidents(reported_by);
CREATE INDEX idx_safety_incidents_date ON public.safety_incidents(incident_date);
CREATE INDEX idx_safety_incidents_severity ON public.safety_incidents(severity);
CREATE INDEX idx_safety_incidents_restrictions ON public.safety_incidents USING gin (restriction_ids);
CREATE INDEX idx_incident_follow_ups_incident_id ON public.incident_follow_ups(incident_id);

-- =============================================================================
-- UPDATED_AT TRIGGERS FOR NEW TABLES
-- =============================================================================

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_restaurant_verifications_updated_at BEFORE UPDATE ON public.restaurant_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_safety_protocols_updated_at BEFORE UPDATE ON public.restaurant_safety_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_item_safety_assessments_updated_at BEFORE UPDATE ON public.menu_item_safety_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expert_endorsements_updated_at BEFORE UPDATE ON public.expert_endorsements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON public.safety_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.restaurant_verifications IS 'Restaurant verification status and documentation';
COMMENT ON TABLE public.restaurant_safety_protocols IS 'Detailed safety protocols for each dietary restriction';
COMMENT ON TABLE public.restaurant_health_ratings IS 'Health department inspection results and ratings';
COMMENT ON TABLE public.menu_categories IS 'Menu organization categories';
COMMENT ON TABLE public.menu_items IS 'Individual menu items with detailed information';
COMMENT ON TABLE public.menu_item_ingredients IS 'Ingredient mapping for menu items';
COMMENT ON TABLE public.menu_item_safety_assessments IS 'Safety assessments for menu items by restriction';
COMMENT ON TABLE public.review_interactions IS 'Community interactions with reviews (helpful, report, etc.)';
COMMENT ON TABLE public.expert_endorsements IS 'Professional endorsements from verified experts';
COMMENT ON TABLE public.safety_incidents IS 'Safety incident reports and tracking';
COMMENT ON TABLE public.incident_follow_ups IS 'Follow-up actions and updates for incidents';