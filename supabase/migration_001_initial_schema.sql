-- =============================================================================
-- MIGRATION 001: INITIAL SCHEMA SETUP
-- =============================================================================
-- Description: Complete initial database schema for Restricted Diet App
-- Version: 1.0.0
-- Date: 2025-01-08
-- Safety Level: PRODUCTION
-- =============================================================================

-- This migration combines all schema components into a single deployable file
-- Execute this file to set up the complete database structure

BEGIN;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================

CREATE TYPE restriction_severity AS ENUM (
    'mild',
    'moderate',
    'severe',
    'life_threatening'
);

CREATE TYPE restriction_type AS ENUM (
    'allergy',
    'intolerance',
    'medical',
    'lifestyle',
    'religious',
    'preference'
);

CREATE TYPE safety_level AS ENUM (
    'safe',
    'caution',
    'warning',
    'danger'
);

CREATE TYPE account_type AS ENUM (
    'individual',
    'family',
    'caregiver'
);

CREATE TYPE restaurant_safety_category AS ENUM (
    'excellent',
    'good',
    'fair',
    'poor',
    'unknown'
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    account_type account_type DEFAULT 'individual',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    medical_conditions TEXT[],
    allergist_name TEXT,
    allergist_phone TEXT,
    preferred_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    privacy_settings JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family member profiles
CREATE TABLE public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_admin_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date_of_birth DATE,
    relationship TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_conditions TEXT[],
    allergist_name TEXT,
    allergist_phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master dietary restrictions
CREATE TABLE public.dietary_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category restriction_type NOT NULL,
    description TEXT,
    common_names TEXT[],
    cross_contamination_risk BOOLEAN DEFAULT FALSE,
    medical_severity_default restriction_severity DEFAULT 'moderate',
    icon_url TEXT,
    educational_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User dietary restrictions
CREATE TABLE public.user_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    severity restriction_severity NOT NULL DEFAULT 'moderate',
    diagnosed_date DATE,
    doctor_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, restriction_id)
);

-- Family member dietary restrictions
CREATE TABLE public.family_member_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    severity restriction_severity NOT NULL DEFAULT 'moderate',
    diagnosed_date DATE,
    doctor_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_member_id, restriction_id)
);

-- Master ingredient database
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    common_names TEXT[],
    scientific_name TEXT,
    category TEXT,
    description TEXT,
    source TEXT,
    nutritional_info JSONB,
    allergen_info JSONB,
    cross_contamination_sources TEXT[],
    regulatory_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredient risk assessments
CREATE TABLE public.ingredient_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    risk_level safety_level NOT NULL,
    risk_description TEXT,
    cross_contamination_risk BOOLEAN DEFAULT FALSE,
    regulatory_threshold DECIMAL(10,4),
    verified_by_expert BOOLEAN DEFAULT FALSE,
    expert_notes TEXT,
    last_reviewed_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ingredient_id, restriction_id)
);

-- Products database
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT,
    manufacturer TEXT,
    category TEXT,
    subcategory TEXT,
    description TEXT,
    ingredients_list TEXT,
    allergen_warnings TEXT[],
    nutrition_facts JSONB,
    package_size TEXT,
    serving_size TEXT,
    country_of_origin TEXT,
    manufacturing_date DATE,
    expiration_date DATE,
    certification_labels TEXT[],
    product_images TEXT[],
    data_source TEXT,
    data_quality_score INTEGER DEFAULT 50,
    last_verified_date TIMESTAMPTZ,
    verification_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product ingredients mapping
CREATE TABLE public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    ingredient_text TEXT,
    percentage DECIMAL(5,2),
    is_allergen BOOLEAN DEFAULT FALSE,
    is_may_contain BOOLEAN DEFAULT FALSE,
    confidence_score INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, ingredient_id)
);

-- Product safety assessments
CREATE TABLE public.product_safety_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    overall_safety_level safety_level NOT NULL,
    risk_factors JSONB,
    safe_ingredients_count INTEGER DEFAULT 0,
    warning_ingredients_count INTEGER DEFAULT 0,
    dangerous_ingredients_count INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 50,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_user_or_family_member CHECK (
        (user_id IS NOT NULL AND family_member_id IS NULL) OR
        (user_id IS NULL AND family_member_id IS NOT NULL)
    )
);

-- Restaurants database
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    chain_name TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'US',
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone_number TEXT,
    website_url TEXT,
    cuisine_types TEXT[],
    price_range INTEGER,
    has_allergen_menu BOOLEAN DEFAULT FALSE,
    has_allergen_training BOOLEAN DEFAULT FALSE,
    has_separate_prep_area BOOLEAN DEFAULT FALSE,
    allergen_protocols TEXT,
    dietary_accommodations TEXT[],
    hours_of_operation JSONB,
    reservation_url TEXT,
    online_ordering_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    google_places_id TEXT,
    yelp_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant safety ratings
CREATE TABLE public.restaurant_safety_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    safety_category restaurant_safety_category NOT NULL DEFAULT 'unknown',
    safety_score DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    has_dedicated_menu BOOLEAN DEFAULT FALSE,
    has_staff_training BOOLEAN DEFAULT FALSE,
    has_separate_equipment BOOLEAN DEFAULT FALSE,
    cross_contamination_protocols TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, restriction_id)
);

-- Product reviews
CREATE TABLE public.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    title TEXT,
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    moderator_approved BOOLEAN DEFAULT TRUE,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant reviews
CREATE TABLE public.restaurant_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    restriction_ids UUID[],
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    knowledge_rating INTEGER CHECK (knowledge_rating >= 1 AND knowledge_rating <= 5),
    title TEXT,
    review_text TEXT,
    visited_date DATE,
    meal_type TEXT,
    dishes_ordered TEXT[],
    had_reaction BOOLEAN DEFAULT FALSE,
    reaction_description TEXT,
    would_return BOOLEAN,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    moderator_approved BOOLEAN DEFAULT TRUE,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data verifications
CREATE TABLE public.data_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    verification_type TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    verification_notes TEXT,
    evidence_photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency cards
CREATE TABLE public.emergency_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    restrictions_summary TEXT NOT NULL,
    severity_level restriction_severity NOT NULL,
    emergency_instructions TEXT NOT NULL,
    medications TEXT[],
    emergency_contact_1_name TEXT,
    emergency_contact_1_phone TEXT,
    emergency_contact_1_relationship TEXT,
    emergency_contact_2_name TEXT,
    emergency_contact_2_phone TEXT,
    emergency_contact_2_relationship TEXT,
    doctor_name TEXT,
    doctor_phone TEXT,
    insurance_info TEXT,
    additional_notes TEXT,
    card_language TEXT DEFAULT 'en',
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_user_or_family_member_emergency CHECK (
        (user_id IS NOT NULL AND family_member_id IS NULL) OR
        (user_id IS NULL AND family_member_id IS NOT NULL)
    )
);

-- Audit log
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES public.user_profiles(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings
CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- User and profile indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_account_type ON public.user_profiles(account_type);
CREATE INDEX idx_family_members_admin_id ON public.family_members(family_admin_id);

-- Restriction indexes
CREATE INDEX idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX idx_user_restrictions_restriction_id ON public.user_restrictions(restriction_id);
CREATE INDEX idx_family_member_restrictions_member_id ON public.family_member_restrictions(family_member_id);

-- Ingredient and product indexes
CREATE INDEX idx_ingredients_name_trgm ON public.ingredients USING gin (name gin_trgm_ops);
CREATE INDEX idx_ingredients_common_names ON public.ingredients USING gin (common_names);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_brand ON public.products(brand);
CREATE INDEX idx_product_ingredients_product_id ON public.product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient_id ON public.product_ingredients(ingredient_id);

-- Restaurant indexes
CREATE INDEX idx_restaurants_location ON public.restaurants(latitude, longitude);
CREATE INDEX idx_restaurants_city_state ON public.restaurants(city, state);
CREATE INDEX idx_restaurants_cuisine_types ON public.restaurants USING gin (cuisine_types);
CREATE INDEX idx_restaurant_safety_ratings_restaurant_id ON public.restaurant_safety_ratings(restaurant_id);

-- Review indexes
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_restaurant_reviews_restaurant_id ON public.restaurant_reviews(restaurant_id);
CREATE INDEX idx_restaurant_reviews_user_id ON public.restaurant_reviews(user_id);

-- Emergency and audit indexes
CREATE INDEX idx_emergency_cards_user_id ON public.emergency_cards(user_id);
CREATE INDEX idx_emergency_cards_family_member_id ON public.emergency_cards(family_member_id);
CREATE INDEX idx_audit_log_table_record ON public.audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dietary_restrictions_updated_at BEFORE UPDATE ON public.dietary_restrictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_restrictions_updated_at BEFORE UPDATE ON public.user_restrictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_member_restrictions_updated_at BEFORE UPDATE ON public.family_member_restrictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ingredient_risk_assessments_updated_at BEFORE UPDATE ON public.ingredient_risk_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_reviews_updated_at BEFORE UPDATE ON public.restaurant_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_emergency_cards_updated_at BEFORE UPDATE ON public.emergency_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

/*
This migration creates the complete initial schema for the Restricted Diet App.

After running this migration, you should:

1. Apply RLS policies: Run rls_policies.sql
2. Install business functions: Run functions.sql
3. Load sample data (optional): Run sample_data.sql

For production deployment:
- Review all security policies
- Set up proper backup procedures
- Configure monitoring and alerting
- Test with realistic data volumes

CRITICAL: This database handles life-threatening health information.
Always prioritize data accuracy and user safety.
*/