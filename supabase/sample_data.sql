-- =============================================================================
-- SAMPLE DATA INSERTION SCRIPTS
-- =============================================================================
-- Description: Realistic test data for development and testing
-- Safety Level: DEVELOPMENT - For testing purposes only
-- =============================================================================

-- =============================================================================
-- DIETARY RESTRICTIONS MASTER DATA
-- =============================================================================

INSERT INTO public.dietary_restrictions (id, name, category, description, common_names, cross_contamination_risk, medical_severity_default) VALUES
-- Food Allergies
('550e8400-e29b-41d4-a716-446655440001', 'Peanuts', 'allergy', 'Allergy to peanuts and peanut-derived products', ARRAY['Groundnuts', 'Arachis hypogaea', 'Monkey nuts'], true, 'severe'),
('550e8400-e29b-41d4-a716-446655440002', 'Tree Nuts', 'allergy', 'Allergy to tree nuts including almonds, walnuts, cashews', ARRAY['Almonds', 'Walnuts', 'Cashews', 'Pecans', 'Pistachios', 'Brazil nuts'], true, 'severe'),
('550e8400-e29b-41d4-a716-446655440003', 'Milk', 'allergy', 'Allergy to milk proteins (casein, whey)', ARRAY['Dairy', 'Lactose', 'Casein', 'Whey'], true, 'moderate'),
('550e8400-e29b-41d4-a716-446655440004', 'Eggs', 'allergy', 'Allergy to chicken eggs and egg proteins', ARRAY['Albumin', 'Ovomucoid', 'Ovalbumin'], true, 'moderate'),
('550e8400-e29b-41d4-a716-446655440005', 'Wheat', 'allergy', 'Allergy to wheat proteins (different from celiac disease)', ARRAY['Gluten', 'Wheat flour', 'Durum'], true, 'moderate'),
('550e8400-e29b-41d4-a716-446655440006', 'Soy', 'allergy', 'Allergy to soy proteins and soy-derived products', ARRAY['Soya', 'Soybean', 'Lecithin'], true, 'moderate'),
('550e8400-e29b-41d4-a716-446655440007', 'Fish', 'allergy', 'Allergy to fish proteins', ARRAY['Finfish', 'Salmon', 'Tuna', 'Cod'], true, 'severe'),
('550e8400-e29b-41d4-a716-446655440008', 'Shellfish', 'allergy', 'Allergy to crustaceans and mollusks', ARRAY['Shrimp', 'Crab', 'Lobster', 'Clams', 'Oysters'], true, 'severe'),

-- Medical Conditions
('550e8400-e29b-41d4-a716-446655440009', 'Celiac Disease', 'medical', 'Autoimmune disorder triggered by gluten consumption', ARRAY['Gluten intolerance', 'Coeliac disease'], true, 'severe'),
('550e8400-e29b-41d4-a716-44665544000a', 'Lactose Intolerance', 'intolerance', 'Inability to digest lactose sugar in dairy products', ARRAY['Lactase deficiency'], false, 'mild'),
('550e8400-e29b-41d4-a716-44665544000b', 'Diabetes Type 1', 'medical', 'Autoimmune condition requiring insulin and carb management', ARRAY['T1D', 'Juvenile diabetes'], false, 'severe'),
('550e8400-e29b-41d4-a716-44665544000c', 'Diabetes Type 2', 'medical', 'Metabolic disorder requiring blood sugar management', ARRAY['T2D', 'Adult-onset diabetes'], false, 'moderate'),

-- Lifestyle Choices
('550e8400-e29b-41d4-a716-44665544000d', 'Vegetarian', 'lifestyle', 'Diet excluding meat but may include dairy and eggs', ARRAY['Lacto-ovo vegetarian'], false, 'mild'),
('550e8400-e29b-41d4-a716-44665544000e', 'Vegan', 'lifestyle', 'Diet excluding all animal products', ARRAY['Plant-based'], false, 'mild'),
('550e8400-e29b-41d4-a716-44665544000f', 'Ketogenic', 'lifestyle', 'Low-carb, high-fat diet', ARRAY['Keto', 'LCHF'], false, 'mild'),
('550e8400-e29b-41d4-a716-446655440010', 'Paleo', 'lifestyle', 'Diet based on presumed ancient human diet', ARRAY['Paleolithic diet', 'Caveman diet'], false, 'mild'),

-- Religious Restrictions
('550e8400-e29b-41d4-a716-446655440011', 'Halal', 'religious', 'Islamic dietary laws', ARRAY['Islamic diet'], false, 'moderate'),
('550e8400-e29b-41d4-a716-446655440012', 'Kosher', 'religious', 'Jewish dietary laws', ARRAY['Kashrut'], false, 'moderate'),

-- Additional Intolerances
('550e8400-e29b-41d4-a716-446655440013', 'Histamine Intolerance', 'intolerance', 'Inability to break down histamine properly', ARRAY['Histaminosis'], false, 'moderate'),
('550e8400-e29b-41d4-a716-446655440014', 'FODMAP Intolerance', 'intolerance', 'Sensitivity to fermentable carbohydrates', ARRAY['IBS', 'Low FODMAP'], false, 'moderate');

-- =============================================================================
-- INGREDIENTS MASTER DATA
-- =============================================================================

INSERT INTO public.ingredients (id, name, common_names, scientific_name, category, description, source) VALUES
-- Allergen ingredients
('660e8400-e29b-41d4-a716-446655440001', 'Peanuts', ARRAY['Groundnuts', 'Arachis hypogaea', 'Monkey nuts'], 'Arachis hypogaea', 'Legumes', 'Peanuts are legumes, not tree nuts', 'Plant'),
('660e8400-e29b-41d4-a716-446655440002', 'Almonds', ARRAY['Sweet almonds', 'Prunus dulcis'], 'Prunus dulcis', 'Tree Nuts', 'Tree nut commonly used in baking and snacks', 'Plant'),
('660e8400-e29b-41d4-a716-446655440003', 'Milk', ARRAY['Dairy milk', 'Cow milk', 'Lactose'], 'Bos taurus', 'Dairy', 'Liquid produced by mammary glands of cows', 'Animal'),
('660e8400-e29b-41d4-a716-446655440004', 'Wheat flour', ARRAY['All-purpose flour', 'White flour', 'Enriched flour'], 'Triticum aestivum', 'Grains', 'Ground wheat kernels used in baking', 'Plant'),
('660e8400-e29b-41d4-a716-446655440005', 'Soy lecithin', ARRAY['Lecithin', 'E322'], 'Glycine max', 'Legumes', 'Emulsifier derived from soybeans', 'Plant'),
('660e8400-e29b-41d4-a716-446655440006', 'Eggs', ARRAY['Chicken eggs', 'Whole eggs'], 'Gallus gallus domesticus', 'Protein', 'Eggs from domestic chickens', 'Animal'),
('660e8400-e29b-41d4-a716-446655440007', 'Salmon', ARRAY['Atlantic salmon', 'Farmed salmon'], 'Salmo salar', 'Fish', 'Popular fish high in omega-3 fatty acids', 'Animal'),
('660e8400-e29b-41d4-a716-446655440008', 'Shrimp', ARRAY['Prawns', 'Crustaceans'], 'Penaeus', 'Shellfish', 'Marine crustacean commonly consumed', 'Animal'),

-- Common ingredients
('660e8400-e29b-41d4-a716-446655440009', 'Sugar', ARRAY['Sucrose', 'White sugar', 'Granulated sugar'], 'Saccharum officinarum', 'Sweeteners', 'Refined sugar from sugar cane or beets', 'Plant'),
('660e8400-e29b-41d4-a716-44665544000a', 'Salt', ARRAY['Sodium chloride', 'Table salt'], 'NaCl', 'Seasonings', 'Sodium chloride used for flavoring', 'Mineral'),
('660e8400-e29b-41d4-a716-44665544000b', 'Vegetable oil', ARRAY['Cooking oil', 'Plant oil'], 'Various', 'Fats', 'Oil extracted from various plants', 'Plant'),
('660e8400-e29b-41d4-a716-44665544000c', 'Water', ARRAY['H2O', 'Purified water'], 'H2O', 'Base', 'Essential liquid component', 'Natural'),
('660e8400-e29b-41d4-a716-44665544000d', 'Vanilla extract', ARRAY['Vanilla flavoring', 'Natural vanilla'], 'Vanilla planifolia', 'Flavorings', 'Extract from vanilla beans', 'Plant'),
('660e8400-e29b-41d4-a716-44665544000e', 'Baking soda', ARRAY['Sodium bicarbonate', 'Bicarbonate of soda'], 'NaHCO3', 'Leavening', 'Chemical leavening agent', 'Mineral'),
('660e8400-e29b-41d4-a716-44665544000f', 'Cornstarch', ARRAY['Corn flour', 'Maize starch'], 'Zea mays', 'Starches', 'Starch extracted from corn kernels', 'Plant'),
('660e8400-e29b-41d4-a716-446655440010', 'Cocoa powder', ARRAY['Cacao powder', 'Unsweetened cocoa'], 'Theobroma cacao', 'Flavorings', 'Powder made from cocoa beans', 'Plant'),

-- Problematic ingredients for specific diets
('660e8400-e29b-41d4-a716-446655440011', 'Gelatin', ARRAY['Gelatine', 'Animal gelatin'], 'Collagen', 'Gelling agents', 'Protein derived from animal collagen', 'Animal'),
('660e8400-e29b-41d4-a716-446655440012', 'Honey', ARRAY['Raw honey', 'Natural honey'], 'Apis mellifera', 'Sweeteners', 'Sweet substance produced by bees', 'Animal'),
('660e8400-e29b-41d4-a716-446655440013', 'High fructose corn syrup', ARRAY['HFCS', 'Corn syrup'], 'Zea mays', 'Sweeteners', 'Processed sweetener from corn', 'Plant'),
('660e8400-e29b-41d4-a716-446655440014', 'Modified food starch', ARRAY['Modified starch', 'Food starch'], 'Various', 'Thickeners', 'Chemically modified starch', 'Plant'),
('660e8400-e29b-41d4-a716-446655440015', 'Casein', ARRAY['Milk protein', 'Sodium caseinate'], 'Bos taurus', 'Proteins', 'Primary protein in milk', 'Animal'),

-- Gluten-containing grains
('660e8400-e29b-41d4-a716-446655440016', 'Barley', ARRAY['Barley malt', 'Pearl barley'], 'Hordeum vulgare', 'Grains', 'Cereal grain containing gluten', 'Plant'),
('660e8400-e29b-41d4-a716-446655440017', 'Rye', ARRAY['Rye flour', 'Secale'], 'Secale cereale', 'Grains', 'Cereal grain containing gluten', 'Plant'),
('660e8400-e29b-41d4-a716-446655440018', 'Spelt', ARRAY['Spelt flour', 'Dinkel'], 'Triticum spelta', 'Grains', 'Ancient wheat variety containing gluten', 'Plant');

-- =============================================================================
-- INGREDIENT RISK ASSESSMENTS
-- =============================================================================

INSERT INTO public.ingredient_risk_assessments (ingredient_id, restriction_id, risk_level, risk_description, cross_contamination_risk) VALUES
-- Peanut allergies
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'danger', 'Direct peanut ingredient - high risk of severe reaction', false),

-- Tree nut allergies
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'danger', 'Direct tree nut ingredient - high risk of severe reaction', false),

-- Milk allergies and lactose intolerance
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'danger', 'Direct milk ingredient - contains casein and whey', false),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-44665544000a', 'warning', 'Contains lactose - may cause digestive discomfort', false),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 'danger', 'Milk protein - avoid for milk allergy', false),

-- Wheat and gluten
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'danger', 'Contains wheat proteins', false),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 'danger', 'Contains gluten - avoid for celiac disease', false),
('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440009', 'danger', 'Barley contains gluten', false),
('660e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440009', 'danger', 'Rye contains gluten', false),
('660e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440009', 'danger', 'Spelt is a wheat variety containing gluten', false),

-- Soy allergies
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'warning', 'Soy-derived ingredient - may cause reaction', false),

-- Egg allergies
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 'danger', 'Direct egg ingredient', false),

-- Fish and shellfish allergies
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'danger', 'Fish ingredient - avoid for fish allergy', false),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'danger', 'Shellfish ingredient - avoid for shellfish allergy', false),

-- Vegan restrictions
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Animal-derived ingredient not suitable for vegans', false),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Animal-derived ingredient not suitable for vegans', false),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Animal-derived ingredient not suitable for vegans', false),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Animal-derived ingredient not suitable for vegans', false),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Gelatin is derived from animal collagen', false),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Honey is an animal product', false),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-44665544000e', 'danger', 'Milk protein not suitable for vegans', false),

-- Vegetarian restrictions (less strict than vegan)
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-44665544000d', 'danger', 'Fish not suitable for vegetarians', false),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-44665544000d', 'danger', 'Shellfish not suitable for vegetarians', false),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-44665544000d', 'warning', 'Gelatin may not be suitable for some vegetarians', false),

-- Keto diet restrictions
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-44665544000f', 'warning', 'High in carbohydrates - not suitable for keto', false),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-44665544000f', 'warning', 'High fructose corn syrup is high in carbs', false),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-44665544000f', 'warning', 'Wheat flour is high in carbohydrates', false),

-- Diabetes restrictions
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-44665544000b', 'warning', 'High glycemic index - monitor blood sugar', false),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-44665544000c', 'caution', 'Contains sugar - count carbohydrates', false),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-44665544000b', 'warning', 'HFCS can spike blood sugar rapidly', false),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-44665544000c', 'warning', 'HFCS affects blood sugar - use caution', false);

-- =============================================================================
-- SAMPLE PRODUCTS
-- =============================================================================

INSERT INTO public.products (id, barcode, name, brand, manufacturer, category, description, ingredients_list, allergen_warnings, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440001', '012345678901', 'Chocolate Chip Cookies', 'BestBite', 'BestBite Foods Inc.', 'Cookies & Crackers', 'Classic chocolate chip cookies made with real butter', 'Wheat flour, butter (milk), sugar, chocolate chips (sugar, cocoa, soy lecithin), eggs, vanilla extract, baking soda, salt', ARRAY['Contains: Wheat, Milk, Eggs, Soy', 'May contain: Tree nuts, Peanuts'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440002', '012345678902', 'Almond Milk', 'NutFree Dairy', 'Plant Based Foods Co.', 'Dairy Alternatives', 'Unsweetened almond milk', 'Water, almonds, sea salt, natural flavors, locust bean gum, sunflower lecithin', ARRAY['Contains: Tree nuts (almonds)'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440003', 'gluten-free-bread-456', 'Gluten-Free White Bread', 'CeliacSafe', 'Gluten Free Bakery LLC', 'Breads', 'White bread made without gluten-containing ingredients', 'Water, rice flour, potato starch, tapioca starch, sugar, yeast, salt, xanthan gum, eggs', ARRAY['Contains: Eggs', 'Gluten-Free'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440004', '012345678904', 'Peanut Butter', 'NutMaster', 'Nut Processing Inc.', 'Spreads', 'Creamy peanut butter made from roasted peanuts', 'Roasted peanuts, sugar, palm oil, salt', ARRAY['Contains: Peanuts', 'May contain: Tree nuts'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440005', '012345678905', 'Soy Sauce', 'AsianFlavors', 'Traditional Foods Ltd.', 'Condiments', 'Traditional soy sauce brewed from soybeans', 'Water, soybeans, wheat, salt', ARRAY['Contains: Soy, Wheat'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440006', '012345678906', 'Greek Yogurt', 'DairyFresh', 'Fresh Dairy Co.', 'Yogurt', 'Plain Greek yogurt made from milk', 'Cultured milk, live active cultures (L. bulgaricus, S. thermophilus)', ARRAY['Contains: Milk'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440007', '012345678907', 'Vegan Protein Bar', 'PlantPower', 'Vegan Nutrition Inc.', 'Nutrition Bars', 'Plant-based protein bar with nuts and seeds', 'Almonds, dates, pea protein, sunflower seeds, cocoa powder, vanilla extract', ARRAY['Contains: Tree nuts (almonds)', 'Vegan'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440008', '012345678908', 'Salmon Fillet', 'OceanFresh', 'Seafood Distributors Inc.', 'Fresh Fish', 'Fresh Atlantic salmon fillet', 'Atlantic salmon', ARRAY['Contains: Fish'], 'manual_entry'),

('770e8400-e29b-41d4-a716-446655440009', '012345678909', 'Energy Drink', 'PowerUp', 'Energy Drinks LLC', 'Beverages', 'Caffeinated energy drink with high sugar content', 'Water, high fructose corn syrup, citric acid, caffeine, taurine, B vitamins, natural flavors', ARRAY['High caffeine content'], 'manual_entry'),

('770e8400-e29b-41d4-a716-44665544000a', '012345678910', 'Gluten-Free Pasta', 'PastaPerfect', 'Italian Foods Inc.', 'Pasta', 'Pasta made from rice and corn', 'Rice flour, corn flour, water, eggs', ARRAY['Contains: Eggs', 'Gluten-Free'], 'manual_entry');

-- =============================================================================
-- PRODUCT INGREDIENTS MAPPING
-- =============================================================================

-- Chocolate Chip Cookies
INSERT INTO public.product_ingredients (product_id, ingredient_id, ingredient_text, is_allergen, confidence_score) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 'Wheat flour', true, 95),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'Butter (milk)', true, 95),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440009', 'Sugar', false, 95),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440005', 'Soy lecithin', true, 90),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'Eggs', true, 95),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-44665544000d', 'Vanilla extract', false, 90),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-44665544000e', 'Baking soda', false, 95),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-44665544000a', 'Salt', false, 95),

-- Almond Milk
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-44665544000c', 'Water', false, 95),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Almonds', true, 95),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-44665544000a', 'Sea salt', false, 90),

-- Peanut Butter
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'Roasted peanuts', true, 95),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440009', 'Sugar', false, 95),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-44665544000b', 'Palm oil', false, 90),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-44665544000a', 'Salt', false, 95),

-- Soy Sauce
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-44665544000c', 'Water', false, 95),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 'Wheat', true, 95),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-44665544000a', 'Salt', false, 95),

-- Greek Yogurt
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440003', 'Cultured milk', true, 95),

-- Salmon Fillet
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440007', 'Atlantic salmon', true, 95),

-- Energy Drink
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-44665544000c', 'Water', false, 95),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440013', 'High fructose corn syrup', false, 95);

-- =============================================================================
-- SAMPLE RESTAURANTS
-- =============================================================================

INSERT INTO public.restaurants (id, name, address, city, state, country, latitude, longitude, phone_number, cuisine_types, has_allergen_menu, has_allergen_training, has_separate_prep_area) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Safe Haven Bistro', '123 Main Street', 'San Francisco', 'CA', 'US', 37.7749, -122.4194, '(415) 555-0123', ARRAY['American', 'Farm-to-table'], true, true, true),
('880e8400-e29b-41d4-a716-446655440002', 'Gluten-Free Kitchen', '456 Oak Avenue', 'Portland', 'OR', 'US', 45.5152, -122.6784, '(503) 555-0456', ARRAY['Gluten-free', 'Bakery'], true, true, true),
('880e8400-e29b-41d4-a716-446655440003', 'Vegan Garden', '789 Pine Street', 'Seattle', 'WA', 'US', 47.6062, -122.3321, '(206) 555-0789', ARRAY['Vegan', 'Organic'], true, true, false),
('880e8400-e29b-41d4-a716-446655440004', 'Mediterranean Delights', '321 Elm Drive', 'Los Angeles', 'CA', 'US', 34.0522, -118.2437, '(323) 555-0321', ARRAY['Mediterranean', 'Halal'], true, false, false),
('880e8400-e29b-41d4-a716-446655440005', 'Allergy Aware Cafe', '654 Maple Lane', 'Austin', 'TX', 'US', 30.2672, -97.7431, '(512) 555-0654', ARRAY['Cafe', 'Allergen-free'], true, true, true);

-- =============================================================================
-- SAMPLE APP SETTINGS
-- =============================================================================

INSERT INTO public.app_settings (setting_key, setting_value, description, is_public) VALUES
('app_version', '"1.0.0"', 'Current application version', true),
('min_supported_version', '"1.0.0"', 'Minimum supported app version', true),
('emergency_contact_number', '"+1-800-ALLERGY"', 'Emergency helpline for severe reactions', true),
('data_update_frequency_hours', '24', 'How often product data is updated', false),
('max_family_members', '8', 'Maximum family members per account', false),
('review_moderation_enabled', 'true', 'Whether reviews require moderation', false),
('barcode_scan_daily_limit_free', '10', 'Daily scan limit for free users', false),
('product_confidence_threshold', '70', 'Minimum confidence score for product safety', false);

-- =============================================================================
-- FUNCTIONS TO GENERATE TEST USER DATA
-- =============================================================================

-- Note: This function should be called after user registration in your app
-- It's here for reference on how to populate user-specific data

CREATE OR REPLACE FUNCTION public.create_sample_user_data(user_uuid UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (
        id, email, full_name, account_type, 
        emergency_contact_name, emergency_contact_phone,
        preferred_language, timezone
    ) VALUES (
        user_uuid, user_email, 'Test User', 'individual',
        'Emergency Contact', '+1-555-HELP',
        'en', 'America/Los_Angeles'
    );

    -- Add some restrictions
    INSERT INTO public.user_restrictions (user_id, restriction_id, severity, doctor_verified) VALUES
    (user_uuid, '550e8400-e29b-41d4-a716-446655440001', 'life_threatening', true), -- Peanuts
    (user_uuid, '550e8400-e29b-41d4-a716-44665544000a', 'mild', false); -- Lactose intolerance

    -- Create emergency card
    INSERT INTO public.emergency_cards (
        user_id, card_name, restrictions_summary, severity_level,
        emergency_instructions, medications,
        emergency_contact_1_name, emergency_contact_1_phone
    ) VALUES (
        user_uuid, 'Peanut Allergy Card', 'Severe peanut allergy - risk of anaphylaxis',
        'life_threatening', 'Call 911 immediately. Administer EpiPen if available.',
        ARRAY['EpiPen', 'Antihistamine'],
        'Emergency Contact', '+1-555-HELP'
    );

    -- Generate safety assessments for products
    PERFORM public.update_product_safety_assessment('770e8400-e29b-41d4-a716-446655440001', user_uuid, NULL); -- Cookies
    PERFORM public.update_product_safety_assessment('770e8400-e29b-41d4-a716-446655440004', user_uuid, NULL); -- Peanut butter
    PERFORM public.update_product_safety_assessment('770e8400-e29b-41d4-a716-446655440006', user_uuid, NULL); -- Greek yogurt
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

/*
To use this sample data:

1. Run the schema.sql file first to create all tables and constraints
2. Run the rls_policies.sql file to set up security policies
3. Run the functions.sql file to create business logic functions
4. Run this sample_data.sql file to populate with test data

For testing with actual users:
- Register a user through Supabase Auth
- Call create_sample_user_data(user_id, 'user@example.com') to create test data for that user
- Use the product search and safety assessment functions to test functionality

Example queries to test the data:

-- Search for products containing peanuts for a user
SELECT * FROM public.search_products_with_safety('peanut', 'your-user-id-here');

-- Find restaurants near San Francisco
SELECT * FROM public.search_restaurants_by_location(37.7749, -122.4194, 25);

-- Get safety assessment for a product
SELECT * FROM public.calculate_product_safety('770e8400-e29b-41d4-a716-446655440001', 'your-user-id-here');

-- Get user's restriction profile
SELECT * FROM public.get_user_restriction_profile('your-user-id-here');
*/