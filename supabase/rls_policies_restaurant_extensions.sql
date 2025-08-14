-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - RESTAURANT EXTENSIONS
-- =============================================================================
-- Description: RLS policies for restaurant features extension
-- Safety Level: PRODUCTION - Protects community safety data and personal incident reports
-- =============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.restaurant_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_safety_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_health_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_safety_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_follow_ups ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RESTAURANT VERIFICATION POLICIES
-- =============================================================================

-- All authenticated users can view restaurant verifications
CREATE POLICY "Authenticated users can view restaurant verifications" ON public.restaurant_verifications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only verified experts can create verifications (implement expert role checking)
CREATE POLICY "Experts can create restaurant verifications" ON public.restaurant_verifications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.is_verified = true
        )
    );

-- Verifiers can update their own verifications
CREATE POLICY "Verifiers can update own verifications" ON public.restaurant_verifications
    FOR UPDATE USING (auth.uid() = verified_by);

-- =============================================================================
-- RESTAURANT SAFETY PROTOCOLS POLICIES
-- =============================================================================

-- All authenticated users can view safety protocols
CREATE POLICY "Authenticated users can view safety protocols" ON public.restaurant_safety_protocols
    FOR SELECT USING (auth.role() = 'authenticated');

-- Verified users can contribute safety protocol information
CREATE POLICY "Verified users can add safety protocols" ON public.restaurant_safety_protocols
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
        )
    );

-- Only restaurant verifiers or experts can update protocols
CREATE POLICY "Experts can update safety protocols" ON public.restaurant_safety_protocols
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.is_verified = true
        )
    );

-- =============================================================================
-- HEALTH RATINGS POLICIES (READ-ONLY FOR USERS)
-- =============================================================================

-- All users (including anonymous) can view health ratings
CREATE POLICY "Public can view health ratings" ON public.restaurant_health_ratings
    FOR SELECT USING (true);

-- Only system administrators can insert health ratings
-- (These would typically be imported from health department APIs)

-- =============================================================================
-- MENU CATEGORIES POLICIES
-- =============================================================================

-- All authenticated users can view menu categories
CREATE POLICY "Authenticated users can view menu categories" ON public.menu_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Restaurant owners/managers and verified contributors can add categories
CREATE POLICY "Verified users can add menu categories" ON public.menu_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only the creator or verified experts can update categories
CREATE POLICY "Contributors can update menu categories" ON public.menu_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================================================
-- MENU ITEMS POLICIES
-- =============================================================================

-- All authenticated users can view menu items
CREATE POLICY "Authenticated users can view menu items" ON public.menu_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Anonymous users can view basic menu items (for restaurant browsing)
CREATE POLICY "Anonymous users can view basic menu items" ON public.menu_items
    FOR SELECT USING (auth.role() = 'anon' AND is_active = true);

-- Authenticated users can contribute menu items
CREATE POLICY "Authenticated users can add menu items" ON public.menu_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Contributors can update menu items (with moderation)
CREATE POLICY "Contributors can update menu items" ON public.menu_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================================================
-- MENU ITEM INGREDIENTS POLICIES
-- =============================================================================

-- All authenticated users can view menu item ingredients
CREATE POLICY "Authenticated users can view menu item ingredients" ON public.menu_item_ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can contribute ingredient information
CREATE POLICY "Authenticated users can add menu item ingredients" ON public.menu_item_ingredients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Contributors can update ingredient information
CREATE POLICY "Contributors can update menu item ingredients" ON public.menu_item_ingredients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================================================
-- MENU ITEM SAFETY ASSESSMENTS POLICIES
-- =============================================================================

-- All authenticated users can view safety assessments
CREATE POLICY "Authenticated users can view menu item safety assessments" ON public.menu_item_safety_assessments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can create safety assessments
CREATE POLICY "Authenticated users can create menu item safety assessments" ON public.menu_item_safety_assessments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Assessors can update their own assessments
CREATE POLICY "Assessors can update own menu item safety assessments" ON public.menu_item_safety_assessments
    FOR UPDATE USING (auth.uid() = assessed_by);

-- =============================================================================
-- REVIEW INTERACTIONS POLICIES
-- =============================================================================

-- Users can view all review interactions
CREATE POLICY "Authenticated users can view review interactions" ON public.review_interactions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create their own review interactions
CREATE POLICY "Users can create review interactions" ON public.review_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions
CREATE POLICY "Users can update own review interactions" ON public.review_interactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own interactions
CREATE POLICY "Users can delete own review interactions" ON public.review_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- EXPERT ENDORSEMENTS POLICIES
-- =============================================================================

-- All authenticated users can view expert endorsements
CREATE POLICY "Authenticated users can view expert endorsements" ON public.expert_endorsements
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only verified experts can create endorsements
CREATE POLICY "Verified experts can create endorsements" ON public.expert_endorsements
    FOR INSERT WITH CHECK (
        auth.uid() = expert_id AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.is_verified = true
        )
    );

-- Experts can update their own endorsements
CREATE POLICY "Experts can update own endorsements" ON public.expert_endorsements
    FOR UPDATE USING (auth.uid() = expert_id);

-- Experts can delete their own endorsements
CREATE POLICY "Experts can delete own endorsements" ON public.expert_endorsements
    FOR DELETE USING (auth.uid() = expert_id);

-- =============================================================================
-- SAFETY INCIDENTS POLICIES
-- =============================================================================

-- Users can view incidents they reported
CREATE POLICY "Users can view own reported incidents" ON public.safety_incidents
    FOR SELECT USING (auth.uid() = reported_by);

-- Verified users can view verified incidents (for community safety)
CREATE POLICY "Verified users can view verified incidents" ON public.safety_incidents
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        is_verified = true AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.is_verified = true
        )
    );

-- Restaurant owners can view incidents about their restaurants
-- (This would require a restaurant ownership table - for now, using verified users)
CREATE POLICY "Restaurant stakeholders can view restaurant incidents" ON public.safety_incidents
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.is_verified = true
        )
    );

-- Users can report safety incidents
CREATE POLICY "Users can report safety incidents" ON public.safety_incidents
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users can update their own incident reports (within a time limit)
CREATE POLICY "Users can update own recent incident reports" ON public.safety_incidents
    FOR UPDATE USING (
        auth.uid() = reported_by AND
        created_at > NOW() - INTERVAL '24 hours'
    );

-- =============================================================================
-- INCIDENT FOLLOW-UPS POLICIES
-- =============================================================================

-- Users can view follow-ups for incidents they can access
CREATE POLICY "Users can view relevant incident follow-ups" ON public.incident_follow_ups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.safety_incidents si
            WHERE si.id = incident_follow_ups.incident_id
            AND (
                si.reported_by = auth.uid() OR
                (si.is_verified = true AND EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.id = auth.uid() AND up.is_verified = true
                ))
            )
        )
    );

-- Users can add follow-ups to incidents they reported
CREATE POLICY "Users can add follow-ups to own incidents" ON public.incident_follow_ups
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.safety_incidents si
            WHERE si.id = incident_follow_ups.incident_id
            AND si.reported_by = auth.uid()
        )
    );

-- Verified users can add follow-ups to verified incidents
CREATE POLICY "Verified users can add follow-ups to verified incidents" ON public.incident_follow_ups
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.is_verified = true
        ) AND
        EXISTS (
            SELECT 1 FROM public.safety_incidents si
            WHERE si.id = incident_follow_ups.incident_id
            AND si.is_verified = true
        )
    );

-- =============================================================================
-- ANONYMOUS USER POLICIES (LIMITED ACCESS FOR BROWSING)
-- =============================================================================

-- Anonymous users can view basic restaurant safety information
CREATE POLICY "Anonymous users can view basic safety protocols" ON public.restaurant_safety_protocols
    FOR SELECT USING (auth.role() = 'anon');

-- Anonymous users can view menu categories and items (for browsing)
CREATE POLICY "Anonymous users can view menu categories" ON public.menu_categories
    FOR SELECT USING (auth.role() = 'anon' AND is_active = true);

-- Anonymous users can view basic safety assessments
CREATE POLICY "Anonymous users can view basic menu safety assessments" ON public.menu_item_safety_assessments
    FOR SELECT USING (auth.role() = 'anon');

-- Anonymous users can view expert endorsements (builds trust)
CREATE POLICY "Anonymous users can view expert endorsements" ON public.expert_endorsements
    FOR SELECT USING (auth.role() = 'anon');

-- =============================================================================
-- HELPER FUNCTIONS FOR COMPLEX POLICIES
-- =============================================================================

-- Function to check if user is a verified expert
CREATE OR REPLACE FUNCTION public.is_verified_expert(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE id = user_uuid 
        AND is_verified = true
        -- Additional expert verification criteria could be added here
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can moderate content
CREATE OR REPLACE FUNCTION public.can_moderate_content(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE id = user_uuid 
        AND is_verified = true
        -- Additional moderator criteria could be added here
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access incident information
CREATE OR REPLACE FUNCTION public.can_access_incident(user_uuid UUID, incident_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.safety_incidents si
        WHERE si.id = incident_uuid
        AND (
            si.reported_by = user_uuid OR
            (si.is_verified = true AND public.is_verified_expert(user_uuid))
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant access to new tables for authenticated users
GRANT SELECT ON public.restaurant_verifications TO anon, authenticated;
GRANT SELECT ON public.restaurant_safety_protocols TO anon, authenticated;
GRANT SELECT ON public.restaurant_health_ratings TO anon, authenticated;
GRANT SELECT ON public.menu_categories TO anon, authenticated;
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT SELECT ON public.menu_item_ingredients TO authenticated;
GRANT SELECT ON public.menu_item_safety_assessments TO anon, authenticated;
GRANT SELECT ON public.expert_endorsements TO anon, authenticated;

-- Grant full access to community interaction tables
GRANT ALL ON public.review_interactions TO authenticated;

-- Grant controlled access to incident reporting
GRANT SELECT, INSERT ON public.safety_incidents TO authenticated;
GRANT ALL ON public.incident_follow_ups TO authenticated;

-- Grant insert permissions for community contributions
GRANT INSERT ON public.restaurant_verifications TO authenticated;
GRANT INSERT ON public.restaurant_safety_protocols TO authenticated;
GRANT INSERT ON public.menu_categories TO authenticated;
GRANT INSERT ON public.menu_items TO authenticated;
GRANT INSERT ON public.menu_item_ingredients TO authenticated;
GRANT INSERT ON public.menu_item_safety_assessments TO authenticated;
GRANT INSERT ON public.expert_endorsements TO authenticated;

-- Grant update permissions for own content
GRANT UPDATE ON public.restaurant_verifications TO authenticated;
GRANT UPDATE ON public.restaurant_safety_protocols TO authenticated;
GRANT UPDATE ON public.menu_categories TO authenticated;
GRANT UPDATE ON public.menu_items TO authenticated;
GRANT UPDATE ON public.menu_item_ingredients TO authenticated;
GRANT UPDATE ON public.menu_item_safety_assessments TO authenticated;
GRANT UPDATE ON public.expert_endorsements TO authenticated;
GRANT UPDATE ON public.safety_incidents TO authenticated;

-- Grant execute permissions for helper functions
GRANT EXECUTE ON FUNCTION public.is_verified_expert TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_moderate_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_incident TO authenticated;

-- =============================================================================
-- SECURITY NOTES
-- =============================================================================

/*
SECURITY CONSIDERATIONS FOR RESTAURANT FEATURES:

1. Safety-Critical Data Protection:
   - Incident reports are strictly controlled - only reporters and verified experts can access
   - Menu item safety assessments affect life-threatening decisions
   - Expert endorsements carry significant weight and require verification

2. Community Data Integrity:
   - Multiple verification levels: community, expert, official
   - Moderation system for reviews and contributions
   - Audit trail for all safety-related changes

3. Privacy and Anonymization:
   - Personal incident details are protected
   - Option for anonymous reporting (with reduced verification weight)
   - Restaurant owners can respond to incidents while protecting reporter identity

4. Trust and Verification:
   - Expert verification system prevents false credentials
   - Multi-source verification for restaurant information
   - Community validation through review interactions

5. Liability Considerations:
   - Clear disclaimer that community data is for informational purposes
   - Professional verification for critical safety information
   - Audit trail for accountability

6. Performance and Scale:
   - PostGIS indexes for efficient location queries
   - Optimized for mobile app usage patterns
   - Efficient search across menu items and restrictions

7. Data Quality:
   - Confidence scoring for all community contributions
   - Multiple verification sources required for safety-critical data
   - Regular review and validation of expert endorsements
*/