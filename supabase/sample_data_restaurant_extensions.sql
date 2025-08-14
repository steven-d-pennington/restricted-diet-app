-- =============================================================================
-- SAMPLE DATA - RESTAURANT EXTENSIONS
-- =============================================================================
-- Description: Comprehensive sample data for restaurant features testing
-- Safety Level: DEVELOPMENT - For testing purposes only
-- =============================================================================

-- =============================================================================
-- RESTAURANT SAMPLE DATA
-- =============================================================================

-- Update existing restaurants with new fields and add location data
UPDATE public.restaurants SET 
    location = ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), -- San Francisco
    classification = 'independent',
    establishment_year = 2015,
    seating_capacity = 45,
    parking_available = true,
    wheelchair_accessible = true,
    outdoor_seating = false,
    delivery_available = true,
    takeout_available = true,
    reservations_required = false,
    noise_level = 'moderate',
    payment_methods = ARRAY['cash', 'credit', 'mobile_pay'],
    languages_spoken = ARRAY['English', 'Spanish']
WHERE name = 'Safe Eats Bistro';

-- Insert additional sample restaurants with full location data
INSERT INTO public.restaurants (
    name, chain_name, address, city, state, country, postal_code, location,
    phone_number, website_url, cuisine_types, price_range, classification,
    has_allergen_menu, has_allergen_training, has_separate_prep_area,
    allergen_protocols, dietary_accommodations, establishment_year,
    seating_capacity, parking_available, wheelchair_accessible,
    outdoor_seating, delivery_available, takeout_available,
    reservations_required, noise_level, payment_methods, languages_spoken,
    hours_of_operation, is_verified, is_active
) VALUES 
-- Chain restaurant in SF
(
    'Fresh & Green', 'Fresh & Green', '456 Market St', 'San Francisco', 'CA', 'US', '94102',
    ST_SetSRID(ST_MakePoint(-122.4089, 37.7879), 4326),
    '+1-415-555-0124', 'https://freshgreen.com', 
    ARRAY['Healthy', 'Salads', 'Vegetarian'], 2, 'chain',
    true, true, true, 
    'Dedicated allergen-free prep station, separate utensils, staff training every 3 months',
    ARRAY['gluten-free', 'vegan', 'keto', 'dairy-free'],
    2018, 60, false, true, true, true, true, false, 'quiet',
    ARRAY['credit', 'mobile_pay'], ARRAY['English'],
    '{"monday": "7:00-22:00", "tuesday": "7:00-22:00", "wednesday": "7:00-22:00", "thursday": "7:00-22:00", "friday": "7:00-23:00", "saturday": "8:00-23:00", "sunday": "8:00-21:00"}',
    true, true
),
-- Independent Italian restaurant
(
    'Nonna Maria''s Kitchen', NULL, '789 Columbus Ave', 'San Francisco', 'CA', 'US', '94133',
    ST_SetSRID(ST_MakePoint(-122.4078, 37.8006), 4326),
    '+1-415-555-0189', 'https://nonnamarias.com',
    ARRAY['Italian', 'Traditional'], 3, 'independent',
    false, false, false,
    'Basic allergen awareness, no dedicated prep areas',
    ARRAY['vegetarian'], 1987, 35, false, false, false, false, true, true, 'loud',
    ARRAY['cash', 'credit'], ARRAY['English', 'Italian'],
    '{"tuesday": "17:00-22:00", "wednesday": "17:00-22:00", "thursday": "17:00-22:00", "friday": "17:00-23:00", "saturday": "17:00-23:00", "sunday": "17:00-22:00"}',
    false, true
),
-- High-end restaurant with excellent safety protocols
(
    'Allergy Aware Fine Dining', NULL, '123 Union Square', 'San Francisco', 'CA', 'US', '94108',
    ST_SetSRID(ST_MakePoint(-122.4077, 37.7880), 4326),
    '+1-415-555-0234', 'https://allergyaware.com',
    ARRAY['American', 'Fine Dining'], 4, 'independent',
    true, true, true,
    'Dedicated allergen-free kitchen, certified staff, ingredient tracking system, emergency protocols',
    ARRAY['gluten-free', 'dairy-free', 'nut-free', 'shellfish-free', 'vegan', 'vegetarian'],
    2020, 28, true, true, true, false, false, true, 'quiet',
    ARRAY['credit', 'mobile_pay'], ARRAY['English', 'French'],
    '{"tuesday": "18:00-22:00", "wednesday": "18:00-22:00", "thursday": "18:00-22:00", "friday": "18:00-23:00", "saturday": "18:00-23:00"}',
    true, true
),
-- Casual chain with poor safety record
(
    'Quick Bites', 'Quick Bites', '567 Mission St', 'San Francisco', 'CA', 'US', '94105',
    ST_SetSRID(ST_MakePoint(-122.3991, 37.7886), 4326),
    '+1-415-555-0345', 'https://quickbites.com',
    ARRAY['Fast Food', 'American'], 1, 'chain',
    false, false, false,
    'Minimal allergen protocols, shared equipment',
    ARRAY[], 2010, 80, true, true, false, true, true, false, 'loud',
    ARRAY['cash', 'credit', 'mobile_pay'], ARRAY['English'],
    '{"monday": "6:00-24:00", "tuesday": "6:00-24:00", "wednesday": "6:00-24:00", "thursday": "6:00-24:00", "friday": "6:00-24:00", "saturday": "6:00-24:00", "sunday": "6:00-24:00"}',
    false, true
);

-- =============================================================================
-- RESTAURANT VERIFICATION DATA
-- =============================================================================

INSERT INTO public.restaurant_verifications (
    restaurant_id, verification_type, verified_by, verification_date,
    expiry_date, verification_notes, documentation_urls,
    safety_certifications, staff_training_date, equipment_inspection_date
) VALUES 
-- Allergy Aware Fine Dining - Expert verified
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    'expert', 
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com'),
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '11 months',
    'Comprehensive on-site inspection completed. Excellent allergen management protocols.',
    ARRAY['https://example.com/cert1.pdf', 'https://example.com/inspection.pdf'],
    ARRAY['ServSafe Allergen Certification', 'FDA Food Safety Modernization Act Compliance'],
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '60 days'
),
-- Fresh & Green - Community verified
(
    (SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'),
    'community',
    (SELECT id FROM public.user_profiles WHERE email = 'jane.smith@example.com'),
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '10 months',
    'Multiple community members have verified their allergen menu accuracy.',
    ARRAY['https://example.com/menu-verification.pdf'],
    ARRAY['Chain-wide allergen training program'],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '120 days'
);

-- =============================================================================
-- RESTAURANT SAFETY PROTOCOLS
-- =============================================================================

INSERT INTO public.restaurant_safety_protocols (
    restaurant_id, restriction_id, has_dedicated_prep_area, has_dedicated_equipment,
    has_dedicated_fryer, has_staff_training, staff_training_frequency,
    has_ingredient_tracking, has_cross_contamination_protocols,
    protocol_description, last_training_date, next_training_date,
    responsible_manager, emergency_procedures, supplier_verification
) VALUES
-- Allergy Aware Fine Dining - Gluten allergy protocols
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    (SELECT id FROM public.dietary_restrictions WHERE name = 'Gluten'),
    true, true, true, true, 'monthly',
    true, true,
    'Separate gluten-free prep area with dedicated equipment. All staff trained monthly on cross-contamination prevention. Ingredient tracking system with lot numbers.',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    'Sarah Johnson, Kitchen Manager',
    'EpiPen available, emergency contact system, hospital partnership',
    true
),
-- Allergy Aware Fine Dining - Peanut allergy protocols
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    (SELECT id FROM public.dietary_restrictions WHERE name = 'Peanuts'),
    true, true, true, true, 'monthly',
    true, true,
    'No peanuts on premises. Supplier verification program ensures peanut-free ingredients. Staff trained on severity of peanut allergies.',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    'Sarah Johnson, Kitchen Manager',
    'EpiPen available, emergency contact system, hospital partnership',
    true
),
-- Fresh & Green - Basic protocols
(
    (SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'),
    (SELECT id FROM public.dietary_restrictions WHERE name = 'Gluten'),
    true, false, false, true, 'quarterly',
    false, true,
    'Dedicated prep station for gluten-free items. Staff training every quarter.',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    'Mike Chen, Store Manager',
    'Basic emergency procedures, 911 contact',
    false
);

-- =============================================================================
-- HEALTH DEPARTMENT RATINGS
-- =============================================================================

INSERT INTO public.restaurant_health_ratings (
    restaurant_id, health_department, inspection_date, rating_score,
    rating_grade, violations_count, critical_violations_count,
    violations_description, follow_up_required, inspector_notes, is_current
) VALUES
-- Allergy Aware Fine Dining - Excellent rating
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    'San Francisco Department of Public Health',
    NOW() - INTERVAL '90 days',
    98, 'A', 1, 0,
    'Minor violation: Hand washing sign needs replacement',
    false,
    'Exceptional food safety practices. Exemplary allergen management protocols.',
    true
),
-- Fresh & Green - Good rating
(
    (SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'),
    'San Francisco Department of Public Health',
    NOW() - INTERVAL '120 days',
    85, 'B', 3, 1,
    'Critical: Food temperature monitoring. Non-critical: Floor cleaning, equipment maintenance',
    true,
    'Generally good practices. Needs improvement in temperature monitoring.',
    true
),
-- Quick Bites - Poor rating
(
    (SELECT id FROM public.restaurants WHERE name = 'Quick Bites'),
    'San Francisco Department of Public Health',
    NOW() - INTERVAL '60 days',
    72, 'C', 8, 3,
    'Critical violations: Cross-contamination risk, improper food storage, inadequate cleaning. Multiple non-critical violations.',
    true,
    'Significant food safety concerns. Follow-up inspection required within 30 days.',
    true
);

-- =============================================================================
-- MENU CATEGORIES AND ITEMS
-- =============================================================================

-- Menu categories for Allergy Aware Fine Dining
INSERT INTO public.menu_categories (restaurant_id, name, description, display_order) VALUES
((SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'), 'Appetizers', 'Carefully crafted starters', 1),
((SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'), 'Main Courses', 'Signature entrees with allergen options', 2),
((SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'), 'Desserts', 'Allergen-friendly sweet endings', 3);

-- Menu categories for Fresh & Green
INSERT INTO public.menu_categories (restaurant_id, name, description, display_order) VALUES
((SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'), 'Salads', 'Fresh, customizable salads', 1),
((SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'), 'Bowls', 'Hearty grain and protein bowls', 2),
((SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'), 'Wraps', 'Healthy wraps and sandwiches', 3);

-- Sample menu items for Allergy Aware Fine Dining
INSERT INTO public.menu_items (
    restaurant_id, category_id, name, description, price, calories,
    dietary_tags, allergen_warnings, may_contain_allergens,
    ingredient_list, preparation_notes, customization_options,
    nutritional_info, is_signature_dish, is_popular
) VALUES
-- Allergen-aware appetizer
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    (SELECT id FROM public.menu_categories WHERE name = 'Appetizers' AND restaurant_id = (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining')),
    'Quinoa Stuffed Mushrooms',
    'Portobello mushrooms stuffed with quinoa, herbs, and dairy-free cheese',
    16.00, 180,
    ARRAY['gluten-free', 'dairy-free', 'vegan', 'nut-free'],
    ARRAY[], ARRAY[],
    'Portobello mushrooms, quinoa, fresh herbs (parsley, thyme), nutritional yeast, olive oil, garlic, onion, dairy-free cheese',
    'Prepared in dedicated allergen-free prep area. All equipment sanitized between uses.',
    '{"modifications": ["Add regular cheese (+$2)", "Extra herbs", "No nutritional yeast"], "spice_level": ["mild", "medium"]}',
    '{"protein": "8g", "carbs": "22g", "fat": "12g", "fiber": "6g", "sodium": "320mg"}',
    true, true
),
-- Main course with customization options
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    (SELECT id FROM public.menu_categories WHERE name = 'Main Courses' AND restaurant_id = (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining')),
    'Herb-Crusted Salmon',
    'Fresh Atlantic salmon with herb crust, seasonal vegetables, choice of starch',
    32.00, 420,
    ARRAY['gluten-free-option', 'dairy-free-option', 'nut-free'],
    ARRAY['Fish'], ARRAY['Shellfish'],
    'Atlantic salmon, fresh herbs (dill, parsley), olive oil, lemon, seasonal vegetables, choice of rice or potatoes',
    'Fish sourced from certified suppliers. Can be prepared without herb crust for sensitive individuals.',
    '{"starch_options": ["wild rice", "roasted potatoes", "quinoa"], "vegetable_options": ["asparagus", "broccoli", "green beans"], "sauce_options": ["lemon butter", "dairy-free lemon sauce", "herb oil"]}',
    '{"protein": "35g", "carbs": "18g", "fat": "22g", "omega3": "1.2g", "sodium": "380mg"}',
    true, true
);

-- Sample menu items for Fresh & Green
INSERT INTO public.menu_items (
    restaurant_id, category_id, name, description, price, calories,
    dietary_tags, allergen_warnings, may_contain_allergens,
    ingredient_list, preparation_notes, customization_options,
    is_popular
) VALUES
-- Popular salad with allergen concerns
(
    (SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'),
    (SELECT id FROM public.menu_categories WHERE name = 'Salads' AND restaurant_id = (SELECT id FROM public.restaurants WHERE name = 'Fresh & Green')),
    'Mediterranean Quinoa Salad',
    'Quinoa with mixed greens, feta, olives, and tahini dressing',
    12.50, 340,
    ARRAY['vegetarian', 'gluten-free'],
    ARRAY['Dairy', 'Sesame'], ARRAY['Nuts'],
    'Quinoa, mixed greens, feta cheese, kalamata olives, cherry tomatoes, cucumber, red onion, tahini dressing',
    'Prepared in shared kitchen. Cross-contamination possible with nuts.',
    '{"protein_additions": ["grilled chicken (+$4)", "chickpeas (+$2)", "tofu (+$3)"], "dressing_options": ["tahini", "olive oil vinaigrette", "dairy-free ranch"], "modifications": ["no feta", "extra olives", "no onion"]}',
    true
);

-- =============================================================================
-- MENU ITEM INGREDIENTS MAPPING
-- =============================================================================

-- Map ingredients for menu items (using existing ingredients from Phase 1)
INSERT INTO public.menu_item_ingredients (
    menu_item_id, ingredient_id, ingredient_text, is_removable,
    is_substitutable, substitution_options, preparation_method,
    cross_contamination_risk, confidence_score, verified_by_staff
) VALUES
-- Quinoa Stuffed Mushrooms ingredients
(
    (SELECT id FROM public.menu_items WHERE name = 'Quinoa Stuffed Mushrooms'),
    (SELECT id FROM public.ingredients WHERE name = 'Quinoa'),
    'Organic quinoa', false, true, ARRAY['wild rice', 'cauliflower rice'],
    'boiled', false, 95, true
),
-- Mediterranean Quinoa Salad - problematic ingredients
(
    (SELECT id FROM public.menu_items WHERE name = 'Mediterranean Quinoa Salad'),
    (SELECT id FROM public.ingredients WHERE name = 'Quinoa'),
    'Quinoa', false, false, ARRAY[],
    'cold', false, 90, true
),
(
    (SELECT id FROM public.menu_items WHERE name = 'Mediterranean Quinoa Salad'),
    (SELECT id FROM public.ingredients WHERE name = 'Milk'),
    'Feta cheese (contains milk)', true, true, ARRAY['dairy-free cheese', 'nutritional yeast'],
    'cold', false, 85, true
);

-- =============================================================================
-- MENU ITEM SAFETY ASSESSMENTS
-- =============================================================================

INSERT INTO public.menu_item_safety_assessments (
    menu_item_id, restriction_id, safety_level, risk_factors,
    preparation_requirements, customer_notes, assessed_by,
    verified_by_restaurant, confidence_score
) VALUES
-- Quinoa Stuffed Mushrooms - Safe for gluten allergy
(
    (SELECT id FROM public.menu_items WHERE name = 'Quinoa Stuffed Mushrooms'),
    (SELECT id FROM public.dietary_restrictions WHERE name = 'Gluten'),
    'safe',
    '{}',
    'Use dedicated gluten-free prep area and equipment',
    'Prepared in certified gluten-free environment',
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com'),
    true, 95
),
-- Mediterranean Quinoa Salad - Danger for dairy allergy due to feta
(
    (SELECT id FROM public.menu_items WHERE name = 'Mediterranean Quinoa Salad'),
    (SELECT id FROM public.dietary_restrictions WHERE name = 'Milk'),
    'danger',
    '{"feta_cheese": {"risk_level": "danger", "is_removable": true, "is_substitutable": true}}',
    'Remove feta cheese, substitute with dairy-free alternative',
    'Feta cheese can be removed upon request. Dairy-free cheese available.',
    (SELECT id FROM public.user_profiles WHERE email = 'jane.smith@example.com'),
    false, 80
);

-- =============================================================================
-- EXPERT ENDORSEMENTS
-- =============================================================================

INSERT INTO public.expert_endorsements (
    restaurant_id, expert_id, restriction_ids, endorsement_type,
    endorsement_level, endorsement_text, credentials_verified,
    professional_title, valid_until
) VALUES
-- Expert endorsement for Allergy Aware Fine Dining
(
    (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining'),
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com'),
    ARRAY[(SELECT id FROM public.dietary_restrictions WHERE name = 'Gluten'), (SELECT id FROM public.dietary_restrictions WHERE name = 'Peanuts')],
    'safety_protocols',
    5,
    'Exceptional allergen management protocols. This restaurant sets the gold standard for allergen safety. Dedicated prep areas, comprehensive staff training, and robust emergency procedures make this one of the safest dining options for individuals with severe allergies.',
    true,
    'Certified Allergist, Food Safety Consultant',
    NOW() + INTERVAL '1 year'
);

-- =============================================================================
-- ENHANCED RESTAURANT REVIEWS
-- =============================================================================

-- Update existing reviews with new fields
UPDATE public.restaurant_reviews SET
    menu_item_ids = ARRAY[(SELECT id FROM public.menu_items WHERE name = 'Quinoa Stuffed Mushrooms')],
    server_name = 'Maria',
    manager_interaction = true,
    kitchen_accommodating = true,
    wait_time_minutes = 25,
    cleanliness_rating = 5,
    communication_rating = 5,
    cross_contamination_concerns = false,
    special_accommodations_made = 'Kitchen manager personally ensured allergen-free preparation',
    moderation_status = 'approved'
WHERE restaurant_id = (SELECT id FROM public.restaurants WHERE name = 'Allergy Aware Fine Dining');

-- Add more detailed reviews
INSERT INTO public.restaurant_reviews (
    restaurant_id, user_id, restriction_ids, overall_rating, safety_rating,
    service_rating, knowledge_rating, title, review_text, visited_date,
    meal_type, dishes_ordered, had_reaction, would_return,
    menu_item_ids, server_name, manager_interaction, kitchen_accommodating,
    wait_time_minutes, cleanliness_rating, communication_rating,
    cross_contamination_concerns, special_accommodations_made,
    moderation_status
) VALUES
-- Positive review for Fresh & Green
(
    (SELECT id FROM public.restaurants WHERE name = 'Fresh & Green'),
    (SELECT id FROM public.user_profiles WHERE email = 'jane.smith@example.com'),
    ARRAY[(SELECT id FROM public.dietary_restrictions WHERE name = 'Gluten')],
    4, 4, 4, 3,
    'Good allergen awareness but room for improvement',
    'Staff was knowledgeable about gluten-free options. They offered to modify the Mediterranean salad by using a separate prep area. However, I noticed they used the same utensils for regular and gluten-free items without cleaning between uses. The food was delicious and I had no reaction, but the cross-contamination protocols could be better.',
    NOW() - INTERVAL '2 weeks',
    'lunch',
    ARRAY['Mediterranean Quinoa Salad (modified)'],
    false, true,
    ARRAY[(SELECT id FROM public.menu_items WHERE name = 'Mediterranean Quinoa Salad')],
    'Jennifer', false, true, 15, 4, 4, true,
    'Modified salad preparation, used separate cutting board',
    'approved'
),
-- Negative review for Quick Bites
(
    (SELECT id FROM public.restaurants WHERE name = 'Quick Bites'),
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com'),
    ARRAY[(SELECT id FROM public.dietary_restrictions WHERE name = 'Peanuts')],
    2, 1, 2, 1,
    'Poor allergen awareness - not safe for severe allergies',
    'Very disappointed with the allergen handling. Staff seemed unaware of cross-contamination risks. When I asked about peanut exposure, they couldn''t provide clear answers. The manager was not available. I decided not to eat there due to safety concerns. Would not recommend for anyone with severe allergies.',
    NOW() - INTERVAL '1 week',
    'dinner',
    ARRAY[],
    false, false,
    ARRAY[],
    'Mike', false, false, 0, 3, 2, true,
    'No accommodations offered',
    'approved'
);

-- =============================================================================
-- REVIEW INTERACTIONS
-- =============================================================================

INSERT INTO public.review_interactions (
    review_id, review_type, user_id, interaction_type
) VALUES
-- Helpful votes for positive reviews
(
    (SELECT id FROM public.restaurant_reviews WHERE title = 'Excellent allergen safety protocols'),
    'restaurant',
    (SELECT id FROM public.user_profiles WHERE email = 'jane.smith@example.com'),
    'helpful'
),
(
    (SELECT id FROM public.restaurant_reviews WHERE title = 'Good allergen awareness but room for improvement'),
    'restaurant',
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com'),
    'helpful'
);

-- =============================================================================
-- SAFETY INCIDENTS
-- =============================================================================

INSERT INTO public.safety_incidents (
    restaurant_id, reported_by, incident_date, severity, restriction_ids,
    incident_description, symptoms_experienced, medical_attention_required,
    restaurant_response, restaurant_contacted, manager_involved,
    is_verified, impact_on_rating
) VALUES
-- Minor incident at Quick Bites
(
    (SELECT id FROM public.restaurants WHERE name = 'Quick Bites'),
    (SELECT id FROM public.user_profiles WHERE email = 'jane.smith@example.com'),
    NOW() - INTERVAL '3 months',
    'minor',
    ARRAY[(SELECT id FROM public.dietary_restrictions WHERE name = 'Gluten')],
    'Ordered item marked as gluten-free but experienced mild symptoms suggesting gluten exposure. Staff were uncertain about preparation methods.',
    'Mild stomach discomfort, lasted about 2 hours',
    false,
    'Manager apologized and offered refund. Said they would review procedures.',
    true, true, true, true
),
-- More serious incident at a different restaurant
(
    (SELECT id FROM public.restaurants WHERE name = 'Nonna Maria''s Kitchen'),
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com'),
    NOW() - INTERVAL '6 months',
    'moderate',
    ARRAY[(SELECT id FROM public.dietary_restrictions WHERE name = 'Shellfish')],
    'Despite informing server about shellfish allergy, dish contained hidden shellfish ingredients. Had allergic reaction requiring medication.',
    'Hives, difficulty breathing, used rescue inhaler',
    true,
    'Restaurant was very apologetic, paid for meal and offered to cover medical costs',
    true, true, true, true
);

-- =============================================================================
-- INCIDENT FOLLOW-UPS
-- =============================================================================

INSERT INTO public.incident_follow_ups (
    incident_id, follow_up_date, follow_up_type, description, created_by
) VALUES
(
    (SELECT id FROM public.safety_incidents WHERE severity = 'moderate'),
    NOW() - INTERVAL '5 months',
    'restaurant_contact',
    'Restaurant manager called to follow up. They have implemented new allergen training for all staff and updated their menu to clearly mark shellfish ingredients.',
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com')
),
(
    (SELECT id FROM public.safety_incidents WHERE severity = 'moderate'),
    NOW() - INTERVAL '4 months',
    'medical_update',
    'Full recovery achieved. No lasting effects from the reaction. Will be more careful about dining out.',
    (SELECT id FROM public.user_profiles WHERE email = 'john.doe@example.com')
);

-- =============================================================================
-- UPDATE RESTAURANT SAFETY RATINGS
-- =============================================================================

-- Trigger the calculation of safety ratings based on the sample data
SELECT public.update_restaurant_safety_ratings(id) FROM public.restaurants WHERE is_active = true;

-- =============================================================================
-- SAMPLE DATA SUMMARY
-- =============================================================================

/*
SAMPLE DATA INCLUDES:

1. RESTAURANTS (4 total):
   - Allergy Aware Fine Dining: Premium restaurant with excellent safety (Expert verified)
   - Fresh & Green: Health-focused chain with good safety (Community verified)
   - Nonna Maria's Kitchen: Traditional restaurant with basic safety (Unverified)
   - Quick Bites: Fast food with poor safety record (Unverified)

2. VERIFICATION DATA:
   - Expert verification for high-end restaurant
   - Community verification for chain restaurant
   - Unverified status for others

3. SAFETY PROTOCOLS:
   - Detailed protocols for premium restaurant
   - Basic protocols for chain restaurant
   - Missing protocols for others

4. HEALTH RATINGS:
   - A grade (98) for premium restaurant
   - B grade (85) for chain restaurant  
   - C grade (72) for fast food restaurant

5. MENU DATA:
   - Detailed menu items with ingredient mapping
   - Safety assessments for different dietary restrictions
   - Customization options and preparation notes

6. COMMUNITY DATA:
   - Restaurant reviews with detailed safety feedback
   - Review interactions (helpful votes)
   - Expert endorsements

7. INCIDENT DATA:
   - Minor incident at chain restaurant
   - Moderate incident at traditional restaurant
   - Follow-up tracking for incidents

This sample data demonstrates:
- Range of restaurant safety levels
- Community verification and expert endorsements
- Incident reporting and tracking
- Menu-level safety assessments
- Real-world review scenarios

All data is designed for testing the safety-critical features
of the restaurant management system.
*/