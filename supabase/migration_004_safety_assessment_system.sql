-- =============================================================================
-- RESTAURANT SAFETY ASSESSMENT SYSTEM - MIGRATION 004
-- =============================================================================
-- Version: 2.1.0
-- Description: Comprehensive safety assessment system for restaurant evaluation
-- Safety Level: PRODUCTION - Life-critical safety assessment features
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SAFETY ASSESSMENT SCORING CONFIGURATION
-- =============================================================================

-- Safety scoring weights and configuration
CREATE TABLE public.safety_scoring_weights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weight_category TEXT NOT NULL, -- 'staff_training', 'kitchen_protocols', 'equipment', etc.
    base_weight DECIMAL(5,2) NOT NULL CHECK (base_weight >= 0 AND base_weight <= 100),
    severity_multiplier JSONB, -- Multipliers based on restriction severity
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(weight_category)
);

-- Safety assessment calculation cache
CREATE TABLE public.restaurant_safety_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    restriction_id UUID REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE,
    overall_safety_score INTEGER NOT NULL CHECK (overall_safety_score >= 0 AND overall_safety_score <= 100),
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    safety_level safety_level NOT NULL,
    score_breakdown JSONB NOT NULL, -- Detailed scoring factors
    data_sources JSONB, -- Sources used in calculation
    calculation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Cache expiry
    expert_override BOOLEAN DEFAULT FALSE,
    expert_override_reason TEXT,
    expert_override_by UUID REFERENCES public.user_profiles(id),
    incident_impact_score INTEGER DEFAULT 0,
    community_verification_count INTEGER DEFAULT 0,
    expert_verification_count INTEGER DEFAULT 0,
    last_incident_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, restriction_id)
);

-- =============================================================================
-- EXPERT VERIFICATION AND PROFESSIONAL ENDORSEMENTS
-- =============================================================================

-- Professional credentials verification
CREATE TABLE public.expert_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    credential_type TEXT NOT NULL, -- 'registered_dietitian', 'allergist', 'food_safety_manager', etc.
    license_number TEXT,
    license_state TEXT,
    issuing_organization TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    verification_status verification_status DEFAULT 'pending',
    verification_documents TEXT[], -- URLs to uploaded documents
    verified_by UUID REFERENCES public.user_profiles(id),
    verification_date TIMESTAMPTZ,
    verification_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert safety assessments (detailed professional evaluations)
CREATE TABLE public.expert_safety_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    assessment_date TIMESTAMPTZ NOT NULL,
    restrictions_assessed UUID[] NOT NULL, -- Array of restriction IDs
    
    -- Detailed safety protocol assessment
    staff_training_score INTEGER CHECK (staff_training_score >= 0 AND staff_training_score <= 100),
    kitchen_protocols_score INTEGER CHECK (kitchen_protocols_score >= 0 AND kitchen_protocols_score <= 100),
    equipment_safety_score INTEGER CHECK (equipment_safety_score >= 0 AND equipment_safety_score <= 100),
    ingredient_sourcing_score INTEGER CHECK (ingredient_sourcing_score >= 0 AND ingredient_sourcing_score <= 100),
    cross_contamination_prevention_score INTEGER CHECK (cross_contamination_prevention_score >= 0 AND cross_contamination_prevention_score <= 100),
    emergency_preparedness_score INTEGER CHECK (emergency_preparedness_score >= 0 AND emergency_preparedness_score <= 100),
    
    overall_assessment_score INTEGER NOT NULL CHECK (overall_assessment_score >= 0 AND overall_assessment_score <= 100),
    confidence_level INTEGER NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
    
    -- Detailed observations
    staff_knowledge_assessment TEXT,
    kitchen_inspection_notes TEXT,
    equipment_evaluation TEXT,
    supplier_verification_notes TEXT,
    protocol_documentation_review TEXT,
    emergency_procedure_evaluation TEXT,
    
    -- Recommendations and improvements
    improvement_recommendations TEXT,
    critical_issues TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    
    -- Assessment metadata
    assessment_methodology TEXT,
    time_spent_hours DECIMAL(4,2),
    areas_assessed TEXT[],
    certifications_reviewed TEXT[],
    
    is_published BOOLEAN DEFAULT FALSE,
    published_date TIMESTAMPTZ,
    validity_period_months INTEGER DEFAULT 12,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SAFETY INCIDENT COMPREHENSIVE TRACKING
-- =============================================================================

-- Enhanced safety incidents with detailed medical and legal tracking
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS reaction_onset_minutes INTEGER;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS reaction_duration_minutes INTEGER;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS epipen_administered BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS ambulance_called BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS medical_record_number TEXT;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS treating_physician TEXT;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS final_diagnosis TEXT;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS allergen_confirmed TEXT;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS incident_cost_estimate DECIMAL(10,2);
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS insurance_claim_filed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS insurance_claim_number TEXT;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS legal_counsel_involved BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS regulatory_report_filed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS media_coverage BOOLEAN DEFAULT FALSE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS incident_status TEXT DEFAULT 'reported'; -- 'reported', 'investigating', 'resolved', 'closed'

-- Incident impact assessment on restaurant safety scores
CREATE TABLE public.incident_impact_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.safety_incidents(id) ON DELETE CASCADE,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    severity_impact_score INTEGER NOT NULL CHECK (severity_impact_score >= -100 AND severity_impact_score <= 0), -- Negative impact
    duration_impact_months INTEGER DEFAULT 12, -- How long the impact lasts
    restriction_specific_impact JSONB, -- Impact per restriction type
    restaurant_response_quality_score INTEGER CHECK (restaurant_response_quality_score >= 0 AND restaurant_response_quality_score <= 100),
    corrective_actions_implemented BOOLEAN DEFAULT FALSE,
    corrective_actions_description TEXT,
    prevention_measures_added BOOLEAN DEFAULT FALSE,
    prevention_measures_description TEXT,
    follow_up_compliance_verified BOOLEAN DEFAULT FALSE,
    impact_mitigation_factor DECIMAL(3,2) DEFAULT 1.0, -- Factor to reduce impact (0.0 to 1.0)
    assessed_by UUID REFERENCES public.user_profiles(id),
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- HEALTH DEPARTMENT AND REGULATORY INTEGRATION
-- =============================================================================

-- Enhanced health department ratings with detailed violation tracking
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS allergen_violations_count INTEGER DEFAULT 0;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS cross_contamination_violations INTEGER DEFAULT 0;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS staff_training_violations INTEGER DEFAULT 0;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS equipment_violations INTEGER DEFAULT 0;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS documentation_violations INTEGER DEFAULT 0;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS corrective_action_plan TEXT;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS reinspection_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS permit_status TEXT; -- 'active', 'suspended', 'revoked', 'pending'
ALTER TABLE public.restaurant_health_ratings ADD COLUMN IF NOT EXISTS inspection_type TEXT; -- 'routine', 'complaint', 'follow_up', 'license_renewal'

-- Third-party certifications and audits
CREATE TABLE public.restaurant_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    certification_type TEXT NOT NULL, -- 'haccp', 'allergen_safe', 'servsafe', 'gluten_free_certified', etc.
    certifying_organization TEXT NOT NULL,
    certificate_number TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    certification_level TEXT, -- 'basic', 'advanced', 'master', etc.
    scope_of_certification TEXT[], -- Which restrictions/allergens covered
    certificate_url TEXT, -- URL to certificate document
    verification_status verification_status DEFAULT 'pending',
    verified_by UUID REFERENCES public.user_profiles(id),
    verification_date TIMESTAMPTZ,
    annual_renewal_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- COMMUNITY VERIFICATION AND ENGAGEMENT
-- =============================================================================

-- Community safety verification events
CREATE TABLE public.community_safety_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    verification_date TIMESTAMPTZ DEFAULT NOW(),
    restriction_ids UUID[] NOT NULL,
    verification_type TEXT NOT NULL, -- 'menu_accuracy', 'staff_knowledge', 'protocol_observation', 'cross_contamination_check'
    
    -- Verification details
    verification_method TEXT, -- 'in_person', 'phone_call', 'documentation_review'
    questions_asked TEXT[],
    staff_responses TEXT[],
    observations TEXT,
    documentation_reviewed TEXT[],
    photos_taken TEXT[], -- URLs to verification photos
    
    -- Assessment results
    knowledge_score INTEGER CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
    protocol_compliance_score INTEGER CHECK (protocol_compliance_score >= 0 AND protocol_compliance_score <= 100),
    confidence_in_verification INTEGER CHECK (confidence_in_verification >= 0 AND confidence_in_verification <= 100),
    
    recommendation TEXT, -- 'approve', 'conditional_approve', 'reject', 'needs_training'
    verifier_notes TEXT,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMPTZ,
    
    is_verified_by_expert BOOLEAN DEFAULT FALSE,
    expert_reviewer_id UUID REFERENCES public.user_profiles(id),
    expert_review_date TIMESTAMPTZ,
    expert_review_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant response to safety assessments and incidents
CREATE TABLE public.restaurant_safety_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reference_type TEXT NOT NULL, -- 'incident', 'assessment', 'review', 'verification'
    reference_id UUID NOT NULL, -- ID of the incident, assessment, etc.
    response_date TIMESTAMPTZ DEFAULT NOW(),
    response_type TEXT NOT NULL, -- 'acknowledgment', 'action_plan', 'dispute', 'clarification'
    
    -- Response content
    response_text TEXT NOT NULL,
    corrective_actions_planned TEXT,
    corrective_actions_timeline TEXT,
    responsible_party TEXT, -- Manager/owner name
    contact_information TEXT,
    
    -- Implementation tracking
    actions_implemented BOOLEAN DEFAULT FALSE,
    implementation_date TIMESTAMPTZ,
    implementation_evidence TEXT[], -- URLs to photos/documents
    follow_up_assessment_requested BOOLEAN DEFAULT FALSE,
    
    -- Response quality assessment
    response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
    assessed_by UUID REFERENCES public.user_profiles(id),
    assessment_notes TEXT,
    
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ENHANCED INDEXES FOR PERFORMANCE
-- =============================================================================

-- Safety scoring and assessment indexes
CREATE INDEX idx_safety_scoring_weights_category ON public.safety_scoring_weights(weight_category) WHERE is_active = true;
CREATE INDEX idx_restaurant_safety_scores_restaurant_id ON public.restaurant_safety_scores(restaurant_id);
CREATE INDEX idx_restaurant_safety_scores_restriction_id ON public.restaurant_safety_scores(restriction_id);
CREATE INDEX idx_restaurant_safety_scores_expires_at ON public.restaurant_safety_scores(expires_at);
CREATE INDEX idx_restaurant_safety_scores_safety_level ON public.restaurant_safety_scores(safety_level);

-- Expert credentials and assessments
CREATE INDEX idx_expert_credentials_user_id ON public.expert_credentials(user_id);
CREATE INDEX idx_expert_credentials_type_status ON public.expert_credentials(credential_type, verification_status);
CREATE INDEX idx_expert_safety_assessments_restaurant_id ON public.expert_safety_assessments(restaurant_id);
CREATE INDEX idx_expert_safety_assessments_expert_id ON public.expert_safety_assessments(expert_id);
CREATE INDEX idx_expert_safety_assessments_date ON public.expert_safety_assessments(assessment_date);
CREATE INDEX idx_expert_safety_assessments_restrictions ON public.expert_safety_assessments USING gin (restrictions_assessed);

-- Incident impact and tracking
CREATE INDEX idx_incident_impact_assessments_incident_id ON public.incident_impact_assessments(incident_id);
CREATE INDEX idx_incident_impact_assessments_date ON public.incident_impact_assessments(assessment_date);

-- Certifications and health ratings
CREATE INDEX idx_restaurant_certifications_restaurant_id ON public.restaurant_certifications(restaurant_id);
CREATE INDEX idx_restaurant_certifications_type ON public.restaurant_certifications(certification_type);
CREATE INDEX idx_restaurant_certifications_expiry ON public.restaurant_certifications(expiry_date) WHERE is_active = true;
CREATE INDEX idx_restaurant_certifications_scope ON public.restaurant_certifications USING gin (scope_of_certification);

-- Community verification
CREATE INDEX idx_community_safety_verifications_restaurant_id ON public.community_safety_verifications(restaurant_id);
CREATE INDEX idx_community_safety_verifications_verifier_id ON public.community_safety_verifications(verifier_id);
CREATE INDEX idx_community_safety_verifications_date ON public.community_safety_verifications(verification_date);
CREATE INDEX idx_community_safety_verifications_type ON public.community_safety_verifications(verification_type);
CREATE INDEX idx_community_safety_verifications_restrictions ON public.community_safety_verifications USING gin (restriction_ids);

-- Restaurant responses
CREATE INDEX idx_restaurant_safety_responses_restaurant_id ON public.restaurant_safety_responses(restaurant_id);
CREATE INDEX idx_restaurant_safety_responses_reference ON public.restaurant_safety_responses(reference_type, reference_id);
CREATE INDEX idx_restaurant_safety_responses_date ON public.restaurant_safety_responses(response_date);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.safety_scoring_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_safety_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_safety_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_impact_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_safety_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_safety_responses ENABLE ROW LEVEL SECURITY;

-- Public read access for safety scoring weights
CREATE POLICY "Public read access for safety scoring weights" ON public.safety_scoring_weights
FOR SELECT USING (is_active = true);

-- Restaurant safety scores - public read for basic info
CREATE POLICY "Public read access for restaurant safety scores" ON public.restaurant_safety_scores
FOR SELECT USING (true);

-- Expert credentials - users can read their own
CREATE POLICY "Users can manage their own expert credentials" ON public.expert_credentials
FOR ALL USING (auth.uid() = user_id);

-- Expert safety assessments - public read for published assessments
CREATE POLICY "Public read access for published expert assessments" ON public.expert_safety_assessments
FOR SELECT USING (is_published = true);

-- Expert assessments - experts can manage their own
CREATE POLICY "Experts can manage their own assessments" ON public.expert_safety_assessments
FOR ALL USING (auth.uid() = expert_id);

-- Incident impact assessments - read access for involved parties
CREATE POLICY "Read access for incident impact assessments" ON public.incident_impact_assessments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.safety_incidents si 
        WHERE si.id = incident_id 
        AND (si.reported_by = auth.uid() OR auth.uid() = assessed_by)
    )
);

-- Restaurant certifications - public read access
CREATE POLICY "Public read access for restaurant certifications" ON public.restaurant_certifications
FOR SELECT USING (is_active = true);

-- Community verifications - users can read and create
CREATE POLICY "Community verification read access" ON public.community_safety_verifications
FOR SELECT USING (true);

CREATE POLICY "Users can create community verifications" ON public.community_safety_verifications
FOR INSERT WITH CHECK (auth.uid() = verifier_id);

-- Restaurant responses - public read access
CREATE POLICY "Public read access for restaurant responses" ON public.restaurant_safety_responses
FOR SELECT USING (is_public = true);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER update_restaurant_safety_scores_updated_at BEFORE UPDATE ON public.restaurant_safety_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expert_credentials_updated_at BEFORE UPDATE ON public.expert_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expert_safety_assessments_updated_at BEFORE UPDATE ON public.expert_safety_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incident_impact_assessments_updated_at BEFORE UPDATE ON public.incident_impact_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_certifications_updated_at BEFORE UPDATE ON public.restaurant_certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_restaurant_safety_responses_updated_at BEFORE UPDATE ON public.restaurant_safety_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SAMPLE SAFETY SCORING WEIGHTS
-- =============================================================================

INSERT INTO public.safety_scoring_weights (weight_category, base_weight, severity_multiplier) VALUES
('staff_training_certification', 25.0, '{"mild": 1.0, "moderate": 1.2, "severe": 1.5, "life_threatening": 2.0}'),
('dedicated_preparation_areas', 20.0, '{"mild": 1.0, "moderate": 1.3, "severe": 1.7, "life_threatening": 2.5}'),
('cross_contamination_protocols', 20.0, '{"mild": 1.0, "moderate": 1.3, "severe": 1.8, "life_threatening": 2.5}'),
('ingredient_tracking_systems', 15.0, '{"mild": 1.0, "moderate": 1.1, "severe": 1.3, "life_threatening": 1.5}'),
('emergency_response_preparedness', 10.0, '{"mild": 1.0, "moderate": 1.2, "severe": 1.8, "life_threatening": 3.0}'),
('health_department_compliance', 5.0, '{"mild": 1.0, "moderate": 1.1, "severe": 1.2, "life_threatening": 1.3}'),
('third_party_certifications', 3.0, '{"mild": 1.0, "moderate": 1.1, "severe": 1.2, "life_threatening": 1.3}'),
('incident_history_impact', -2.0, '{"mild": 1.0, "moderate": 2.0, "severe": 5.0, "life_threatening": 10.0}');

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.safety_scoring_weights IS 'Configuration for safety assessment scoring weights and severity multipliers';
COMMENT ON TABLE public.restaurant_safety_scores IS 'Cached safety assessment scores for restaurants by restriction type';
COMMENT ON TABLE public.expert_credentials IS 'Professional credentials verification for expert reviewers';
COMMENT ON TABLE public.expert_safety_assessments IS 'Detailed safety assessments conducted by verified experts';
COMMENT ON TABLE public.incident_impact_assessments IS 'Assessment of safety incident impact on restaurant safety scores';
COMMENT ON TABLE public.restaurant_certifications IS 'Third-party certifications and safety credentials for restaurants';
COMMENT ON TABLE public.community_safety_verifications IS 'Community-driven safety verification activities';
COMMENT ON TABLE public.restaurant_safety_responses IS 'Restaurant responses to safety assessments and incidents';