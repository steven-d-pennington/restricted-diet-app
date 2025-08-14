-- =============================================================================
-- COMMUNITY REVIEW SYSTEM ENHANCEMENT - MIGRATION 003
-- =============================================================================
-- Version: 3.0.0
-- Description: Advanced community review and verification system
-- Safety Level: PRODUCTION - Comprehensive review system for life-threatening safety decisions
-- =============================================================================

-- =============================================================================
-- NEW CUSTOM TYPES FOR ENHANCED REVIEW SYSTEM
-- =============================================================================

-- Review category types for comprehensive rating
CREATE TYPE review_category AS ENUM (
    'safety',           -- Safety and allergen handling
    'service',          -- Service quality and staff knowledge
    'food_quality',     -- Food taste and preparation
    'cleanliness',      -- Restaurant cleanliness
    'communication',    -- Staff communication about restrictions
    'accommodation'     -- Willingness to accommodate special needs
);

-- Review template types for guided review creation
CREATE TYPE review_template_type AS ENUM (
    'general',          -- General dining experience
    'allergy_focused',  -- Allergy-specific review
    'incident_report',  -- Safety incident reporting
    'expert_assessment', -- Professional/expert review
    'follow_up'         -- Follow-up after incident
);

-- Photo evidence types
CREATE TYPE photo_evidence_type AS ENUM (
    'menu_item',        -- Photo of the dish
    'ingredient_label', -- Ingredient list or allergen info
    'menu_display',     -- Menu board or printed menu
    'cross_contamination', -- Evidence of contamination issues
    'safety_protocol',  -- Kitchen safety measures
    'incident_evidence', -- Evidence of safety incident
    'general'           -- General restaurant photo
);

-- Review verification levels
CREATE TYPE review_verification_level AS ENUM (
    'unverified',       -- No verification
    'user_verified',    -- Verified by community votes
    'expert_verified',  -- Verified by medical/food safety expert
    'restaurant_confirmed', -- Confirmed by restaurant
    'incident_verified' -- Incident verified by health authorities
);

-- =============================================================================
-- ENHANCED REVIEW RATING SYSTEM
-- =============================================================================

-- Multi-category rating system
CREATE TABLE public.review_category_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    category review_category NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    weight DECIMAL(3,2) DEFAULT 1.0, -- Weight for this category in overall score
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, category)
);

-- Safety-specific assessment details
CREATE TABLE public.review_safety_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    restriction_id UUID NOT NULL REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    safety_confidence INTEGER CHECK (safety_confidence >= 1 AND safety_confidence <= 10),
    staff_knowledge_level INTEGER CHECK (staff_knowledge_level >= 1 AND staff_knowledge <= 5),
    kitchen_precautions_taken BOOLEAN DEFAULT FALSE,
    dedicated_prep_area_used BOOLEAN DEFAULT FALSE,
    ingredient_verification_done BOOLEAN DEFAULT FALSE,
    manager_consulted BOOLEAN DEFAULT FALSE,
    emergency_preparedness_visible BOOLEAN DEFAULT FALSE,
    cross_contamination_risk_level INTEGER CHECK (cross_contamination_risk_level >= 1 AND cross_contamination_risk_level <= 5),
    would_recommend_for_restriction BOOLEAN,
    specific_safety_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, restriction_id)
);

-- =============================================================================
-- PHOTO EVIDENCE SYSTEM
-- =============================================================================

-- Photo uploads for reviews
CREATE TABLE public.review_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type photo_evidence_type NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    file_size_bytes INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    compression_applied BOOLEAN DEFAULT FALSE,
    moderation_status review_moderation_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo verification and credibility
CREATE TABLE public.photo_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES public.review_photos(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    verification_level review_verification_level NOT NULL,
    verification_notes TEXT,
    is_credible BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- REVIEW TEMPLATES AND GUIDED CREATION
-- =============================================================================

-- Review templates for different scenarios
CREATE TABLE public.review_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT NOT NULL,
    template_type review_template_type NOT NULL,
    restriction_types TEXT[], -- Which restriction types this template applies to
    template_structure JSONB NOT NULL, -- Template questions and structure
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.user_profiles(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User responses to template questions
CREATE TABLE public.review_template_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.review_templates(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL, -- Reference to question in template structure
    response_value JSONB NOT NULL, -- User's response (text, rating, boolean, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, template_id, question_id)
);

-- =============================================================================
-- COMMUNITY VERIFICATION AND CREDIBILITY
-- =============================================================================

-- Review helpfulness votes (enhanced from review_interactions)
ALTER TABLE public.review_interactions ADD COLUMN IF NOT EXISTS vote_weight DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE public.review_interactions ADD COLUMN IF NOT EXISTS voter_expertise_level INTEGER DEFAULT 1 CHECK (voter_expertise_level >= 1 AND voter_expertise_level <= 5);
ALTER TABLE public.review_interactions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Review credibility scoring
CREATE TABLE public.review_credibility_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    credibility_score DECIMAL(5,2) NOT NULL DEFAULT 50.0, -- 0-100 scale
    verification_level review_verification_level DEFAULT 'unverified',
    helpful_votes_count INTEGER DEFAULT 0,
    unhelpful_votes_count INTEGER DEFAULT 0,
    expert_endorsements_count INTEGER DEFAULT 0,
    community_reports_count INTEGER DEFAULT 0,
    reviewer_trust_score DECIMAL(5,2) DEFAULT 50.0,
    consistency_score DECIMAL(5,2) DEFAULT 50.0, -- Consistency with other reviews
    detail_score DECIMAL(5,2) DEFAULT 50.0, -- How detailed and informative
    recency_factor DECIMAL(3,2) DEFAULT 1.0, -- Factor based on review age
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id)
);

-- Expert reviewer credentials and verification
CREATE TABLE public.expert_reviewer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    professional_title TEXT NOT NULL, -- 'Registered Dietitian', 'Allergist', etc.
    license_number TEXT,
    license_state TEXT,
    specialty_areas TEXT[], -- Areas of expertise
    credentials_verified BOOLEAN DEFAULT FALSE,
    verification_documents TEXT[], -- URLs to credential documents
    verified_by UUID REFERENCES public.user_profiles(id), -- Admin who verified
    verification_date TIMESTAMPTZ,
    expertise_level INTEGER CHECK (expertise_level >= 1 AND expertise_level <= 5),
    reviews_contributed INTEGER DEFAULT 0,
    average_review_helpfulness DECIMAL(3,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================================================
-- SAFETY INCIDENT REPORTING ENHANCEMENT
-- =============================================================================

-- Enhanced safety incident reporting (extends existing safety_incidents table)
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES public.restaurant_reviews(id) ON DELETE SET NULL;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS incident_photos TEXT[];
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS emergency_contact_made BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS epipen_used BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS ambulance_called BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS reaction_onset_minutes INTEGER;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS reaction_duration_minutes INTEGER;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS allergen_source_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS similar_incidents_reported INTEGER DEFAULT 0;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS health_dept_case_number TEXT;

-- Incident verification by health authorities or medical professionals
CREATE TABLE public.incident_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.safety_incidents(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL, -- 'medical_professional', 'health_department', 'expert_reviewer'
    verification_details JSONB,
    medical_record_reference TEXT,
    health_dept_report_number TEXT,
    verification_confidence INTEGER CHECK (verification_confidence >= 1 AND verification_confidence <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- REVIEW MODERATION AND REPORTING SYSTEM
-- =============================================================================

-- Enhanced review reporting
CREATE TABLE public.review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    report_category TEXT NOT NULL, -- 'false_information', 'inappropriate_content', 'spam', 'dangerous_advice'
    report_reason TEXT NOT NULL,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    evidence_provided TEXT,
    additional_context TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
    reviewed_by UUID REFERENCES public.user_profiles(id),
    review_notes TEXT,
    action_taken TEXT, -- What action was taken
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review moderation queue and workflow
CREATE TABLE public.review_moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 10 = highest priority
    auto_flagged_reasons TEXT[], -- Reasons why it was auto-flagged
    assigned_moderator UUID REFERENCES public.user_profiles(id),
    estimated_review_time_minutes INTEGER DEFAULT 15,
    complexity_score INTEGER DEFAULT 1 CHECK (complexity_score >= 1 AND complexity_score <= 5),
    requires_expert_review BOOLEAN DEFAULT FALSE,
    safety_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- =============================================================================
-- USER INTERACTION AND FOLLOW SYSTEM
-- =============================================================================

-- User follow relationships for trusted reviewers
CREATE TABLE public.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    follow_reason TEXT, -- Why they're following (similar restrictions, expert, etc.)
    notification_preferences JSONB, -- What notifications they want
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Review acknowledgments and thanks
CREATE TABLE public.review_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    acknowledged_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    acknowledgment_type TEXT NOT NULL, -- 'thank_you', 'helpful', 'life_saving'
    personal_message TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_id, acknowledged_by, acknowledgment_type)
);

-- =============================================================================
-- REAL-TIME NOTIFICATIONS SYSTEM
-- =============================================================================

-- Review-related notifications
CREATE TABLE public.review_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'new_review', 'review_response', 'safety_alert', 'expert_endorsement'
    reference_id UUID NOT NULL, -- ID of the review/incident/etc.
    reference_type TEXT NOT NULL, -- 'review', 'incident', 'photo', 'report'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 5 = urgent
    is_safety_critical BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    action_url TEXT, -- Deep link to relevant screen
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- DUPLICATE DETECTION AND REVIEW CLUSTERING
-- =============================================================================

-- Review similarity detection for duplicate prevention
CREATE TABLE public.review_similarity_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_1_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    review_2_id UUID NOT NULL REFERENCES public.restaurant_reviews(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    similarity_factors JSONB, -- What factors contributed to similarity
    is_potential_duplicate BOOLEAN DEFAULT FALSE,
    reviewed_by_human BOOLEAN DEFAULT FALSE,
    human_assessment TEXT, -- Human judgment on whether it's a duplicate
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(review_1_id, review_2_id),
    CHECK (review_1_id < review_2_id) -- Ensure consistent ordering
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Review category ratings
CREATE INDEX idx_review_category_ratings_review_id ON public.review_category_ratings(review_id);
CREATE INDEX idx_review_category_ratings_category ON public.review_category_ratings(category);

-- Safety assessments
CREATE INDEX idx_review_safety_assessments_review_id ON public.review_safety_assessments(review_id);
CREATE INDEX idx_review_safety_assessments_restriction_id ON public.review_safety_assessments(restriction_id);

-- Photo system
CREATE INDEX idx_review_photos_review_id ON public.review_photos(review_id);
CREATE INDEX idx_review_photos_type ON public.review_photos(photo_type);
CREATE INDEX idx_review_photos_moderation_status ON public.review_photos(moderation_status) WHERE moderation_status = 'pending';

-- Templates and responses
CREATE INDEX idx_review_templates_type ON public.review_templates(template_type);
CREATE INDEX idx_review_templates_active ON public.review_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_review_template_responses_review_id ON public.review_template_responses(review_id);

-- Credibility and verification
CREATE INDEX idx_review_credibility_scores_review_id ON public.review_credibility_scores(review_id);
CREATE INDEX idx_review_credibility_scores_score ON public.review_credibility_scores(credibility_score);
CREATE INDEX idx_expert_reviewer_profiles_user_id ON public.expert_reviewer_profiles(user_id);
CREATE INDEX idx_expert_reviewer_profiles_verified ON public.expert_reviewer_profiles(credentials_verified) WHERE credentials_verified = true;

-- Incident reporting
CREATE INDEX idx_incident_verifications_incident_id ON public.incident_verifications(incident_id);
CREATE INDEX idx_incident_verifications_verified_by ON public.incident_verifications(verified_by);

-- Moderation system
CREATE INDEX idx_review_reports_review_id ON public.review_reports(review_id);
CREATE INDEX idx_review_reports_status ON public.review_reports(status) WHERE status = 'pending';
CREATE INDEX idx_review_moderation_queue_priority ON public.review_moderation_queue(priority, created_at);
CREATE INDEX idx_review_moderation_queue_assigned ON public.review_moderation_queue(assigned_moderator) WHERE assigned_moderator IS NOT NULL;

-- User interactions
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_review_acknowledgments_review_id ON public.review_acknowledgments(review_id);

-- Notifications
CREATE INDEX idx_review_notifications_user_id ON public.review_notifications(user_id);
CREATE INDEX idx_review_notifications_unread ON public.review_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_review_notifications_priority ON public.review_notifications(priority, created_at) WHERE priority >= 4;

-- Similarity detection
CREATE INDEX idx_review_similarity_scores_potential_duplicates ON public.review_similarity_scores(is_potential_duplicate) WHERE is_potential_duplicate = true;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER update_review_templates_updated_at BEFORE UPDATE ON public.review_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_review_credibility_scores_updated_at BEFORE UPDATE ON public.review_credibility_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expert_reviewer_profiles_updated_at BEFORE UPDATE ON public.expert_reviewer_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Review category ratings
ALTER TABLE public.review_category_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all review category ratings" ON public.review_category_ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage their own review category ratings" ON public.review_category_ratings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_reviews rr 
        WHERE rr.id = review_id AND rr.user_id = auth.uid()
    )
);

-- Review safety assessments
ALTER TABLE public.review_safety_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all review safety assessments" ON public.review_safety_assessments FOR SELECT USING (true);
CREATE POLICY "Users can manage their own review safety assessments" ON public.review_safety_assessments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_reviews rr 
        WHERE rr.id = review_id AND rr.user_id = auth.uid()
    )
);

-- Review photos
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view approved review photos" ON public.review_photos FOR SELECT USING (moderation_status = 'approved');
CREATE POLICY "Users can manage their own review photos" ON public.review_photos FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_reviews rr 
        WHERE rr.id = review_id AND rr.user_id = auth.uid()
    )
);

-- Expert reviewer profiles
ALTER TABLE public.expert_reviewer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view verified expert profiles" ON public.expert_reviewer_profiles FOR SELECT USING (credentials_verified = true);
CREATE POLICY "Users can manage their own expert profile" ON public.expert_reviewer_profiles FOR ALL USING (user_id = auth.uid());

-- Review reports
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reports" ON public.review_reports FOR SELECT USING (reported_by = auth.uid());
CREATE POLICY "Users can create reports" ON public.review_reports FOR INSERT WITH CHECK (reported_by = auth.uid());

-- Notifications
ALTER TABLE public.review_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own notifications" ON public.review_notifications FOR ALL USING (user_id = auth.uid());

-- User follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all follow relationships" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON public.user_follows FOR ALL USING (follower_id = auth.uid());

-- =============================================================================
-- FUNCTIONS FOR REVIEW SCORING AND ANALYTICS
-- =============================================================================

-- Function to calculate review credibility score
CREATE OR REPLACE FUNCTION calculate_review_credibility_score(review_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    base_score DECIMAL(5,2) := 50.0;
    helpful_votes INT := 0;
    unhelpful_votes INT := 0;
    expert_endorsements INT := 0;
    reviewer_trust DECIMAL(5,2) := 50.0;
    final_score DECIMAL(5,2);
BEGIN
    -- Get vote counts
    SELECT 
        COALESCE(SUM(CASE WHEN interaction_type = 'helpful' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN interaction_type = 'not_helpful' THEN 1 ELSE 0 END), 0)
    INTO helpful_votes, unhelpful_votes
    FROM public.review_interactions 
    WHERE review_id = review_uuid AND review_type = 'restaurant';
    
    -- Get expert endorsements count
    SELECT COUNT(*) INTO expert_endorsements
    FROM public.review_interactions ri
    JOIN public.expert_reviewer_profiles erp ON ri.user_id = erp.user_id
    WHERE ri.review_id = review_uuid AND ri.interaction_type = 'helpful' AND erp.credentials_verified = true;
    
    -- Calculate final score
    final_score := base_score 
                 + (helpful_votes * 5.0) 
                 - (unhelpful_votes * 10.0) 
                 + (expert_endorsements * 15.0);
    
    -- Ensure score is between 0 and 100
    final_score := GREATEST(0.0, LEAST(100.0, final_score));
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update review credibility scores
CREATE OR REPLACE FUNCTION update_review_credibility_scores()
RETURNS void AS $$
BEGIN
    INSERT INTO public.review_credibility_scores (review_id, credibility_score)
    SELECT 
        rr.id,
        calculate_review_credibility_score(rr.id)
    FROM public.restaurant_reviews rr
    WHERE NOT EXISTS (
        SELECT 1 FROM public.review_credibility_scores rcs 
        WHERE rcs.review_id = rr.id
    )
    ON CONFLICT (review_id) DO UPDATE SET
        credibility_score = calculate_review_credibility_score(review_credibility_scores.review_id),
        last_calculated = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.review_category_ratings IS 'Multi-category rating system for comprehensive restaurant reviews';
COMMENT ON TABLE public.review_safety_assessments IS 'Detailed safety assessments for specific dietary restrictions';
COMMENT ON TABLE public.review_photos IS 'Photo evidence and documentation for reviews';
COMMENT ON TABLE public.review_templates IS 'Template system for guided review creation';
COMMENT ON TABLE public.review_credibility_scores IS 'Community-driven credibility scoring for reviews';
COMMENT ON TABLE public.expert_reviewer_profiles IS 'Verified expert reviewer credentials and profiles';
COMMENT ON TABLE public.review_reports IS 'Community reporting system for inappropriate or false reviews';
COMMENT ON TABLE public.review_notifications IS 'Real-time notification system for review-related events';
COMMENT ON TABLE public.user_follows IS 'User follow relationships for trusted reviewers';
COMMENT ON TABLE public.review_similarity_scores IS 'Duplicate detection and review clustering system';