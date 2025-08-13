# Supabase Database Schema for Restricted Diet App

## Overview

This directory contains a comprehensive Supabase database schema designed specifically for a dietary restriction management mobile application. The schema handles sensitive health data with production-level security considerations, supporting life-threatening allergy management, ingredient analysis, restaurant safety ratings, and community features.

## 🔒 Security & Safety Notice

**CRITICAL**: This database handles potentially life-threatening health information. Incorrect food safety assessments could result in severe allergic reactions or medical emergencies. All data handling must follow strict security protocols and compliance requirements.

## 📋 Schema Components

### 1. Core Files

- **`schema.sql`** - Complete database schema with tables, types, indexes, and constraints
- **`rls_policies.sql`** - Row Level Security policies for data protection
- **`functions.sql`** - Business logic functions and triggers
- **`sample_data.sql`** - Test data for development and testing

### 2. Database Structure

#### User Management
- **`user_profiles`** - Extended user profiles (references Supabase auth.users)
- **`family_members`** - Family member profiles for family accounts
- **`emergency_cards`** - Digital emergency cards for severe allergies

#### Dietary Restrictions
- **`dietary_restrictions`** - Master list of all restrictions and allergies
- **`user_restrictions`** - User-specific restrictions with severity levels
- **`family_member_restrictions`** - Restrictions for family members

#### Product & Ingredient Data
- **`ingredients`** - Master ingredient database
- **`ingredient_risk_assessments`** - Risk mappings between ingredients and restrictions
- **`products`** - Product database for barcode scanning
- **`product_ingredients`** - Parsed ingredients from product labels
- **`product_safety_assessments`** - User-specific safety assessments

#### Restaurant Data
- **`restaurants`** - Restaurant database with location and safety info
- **`restaurant_safety_ratings`** - Safety ratings by restriction type

#### Community Features
- **`product_reviews`** - Community product reviews
- **`restaurant_reviews`** - Community restaurant reviews
- **`data_verifications`** - Community data verification system

## 🚀 Setup Instructions

### Prerequisites

- Supabase project (local or cloud)
- PostgreSQL 14+
- Supabase CLI (for local development)

### Local Development Setup

1. **Start Local Supabase**
   ```bash
   cd /path/to/your/project
   supabase start
   ```

2. **Apply Database Schema**
   ```bash
   # Apply in this exact order:
   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/schema.sql
   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/rls_policies.sql
   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/functions.sql
   ```

3. **Load Sample Data (Optional)**
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/sample_data.sql
   ```

### Cloud Deployment

1. **Using Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Execute each file in order: schema.sql → rls_policies.sql → functions.sql → sample_data.sql

2. **Using Supabase CLI**
   ```bash
   supabase db push
   ```

## 🔐 Security Features

### Row Level Security (RLS)
- **Personal Data Protection**: All user health data is protected by RLS policies
- **Family Access Control**: Family admins can only access their family members' data
- **Community Data**: Reviews and verifications are publicly readable but user-controlled
- **Anonymous Access**: Limited read-only access for browsing restaurants and basic info

### Data Protection
- **Health Data Encryption**: All sensitive health information is protected
- **Audit Trail**: Critical data changes are logged for compliance
- **Access Control**: Granular permissions based on user roles and relationships
- **HIPAA Compliance**: Schema designed with healthcare data protection in mind

## 🛠 Key Functions

### Product Safety Assessment
```sql
-- Calculate safety for a user and product
SELECT * FROM public.calculate_product_safety(
    'product-uuid', 
    'user-uuid', 
    NULL
);

-- Update/create safety assessment
SELECT public.update_product_safety_assessment(
    'product-uuid', 
    'user-uuid', 
    NULL
);
```

### Restaurant Search
```sql
-- Search restaurants by location and restrictions
SELECT * FROM public.search_restaurants_by_location(
    37.7749,  -- latitude
    -122.4194, -- longitude
    25,        -- radius in miles
    ARRAY['restriction-uuid-1', 'restriction-uuid-2']
);
```

### User Profile Management
```sql
-- Get complete user restriction profile
SELECT * FROM public.get_user_restriction_profile('user-uuid');

-- Get family member restriction profile
SELECT * FROM public.get_family_member_restriction_profile('family-member-uuid');
```

## 📊 Data Types & Enums

### Severity Levels
- `mild` - Mild intolerance, discomfort
- `moderate` - Moderate reaction, avoid when possible
- `severe` - Severe reaction, must avoid
- `life_threatening` - Anaphylaxis risk, absolute avoidance

### Restriction Types
- `allergy` - Food allergy
- `intolerance` - Food intolerance
- `medical` - Medical condition
- `lifestyle` - Lifestyle choice
- `religious` - Religious restriction
- `preference` - Personal preference

### Safety Levels
- `safe` - Safe for consumption
- `caution` - Use with caution
- `warning` - Not recommended
- `danger` - Do not consume

## 🧪 Testing

### Sample Data Usage

After setting up the schema, you can create test user data:

```sql
-- Create sample data for a user (after registration)
SELECT public.create_sample_user_data(
    'your-user-uuid',
    'test@example.com'
);
```

### Test Queries

```sql
-- Test product search
SELECT * FROM public.search_products_with_safety(
    'chocolate',
    'user-uuid'
);

-- Test restaurant search
SELECT * FROM public.search_restaurants_by_location(
    37.7749, -122.4194, 25
);

-- Test safety calculation
SELECT * FROM public.calculate_product_safety(
    '770e8400-e29b-41d4-a716-446655440001',  -- sample cookie product
    'user-uuid'
);
```

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks

1. **Data Quality Monitoring**
   - Monitor product data accuracy scores
   - Review community verification reports
   - Update ingredient risk assessments

2. **Performance Optimization**
   - Monitor query performance with EXPLAIN ANALYZE
   - Update statistics: `ANALYZE;`
   - Reindex if needed: `REINDEX DATABASE postgres;`

3. **Security Auditing**
   - Review audit logs regularly
   - Monitor for suspicious access patterns
   - Update RLS policies as needed

### Data Updates

- **Product Database**: Sync with external APIs (Open Food Facts, UPC Database)
- **Restaurant Data**: Update from Google Places API or manual submissions
- **Ingredient Risk Assessments**: Review and update with medical professionals

## 📱 Mobile App Integration

### Supabase Client Setup

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'your-supabase-url'
const supabaseAnonKey = 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Common Queries

```javascript
// Get user's dietary restrictions
const { data: restrictions } = await supabase
  .rpc('get_user_restriction_profile', { p_user_id: userId })

// Search products by barcode
const { data: product } = await supabase
  .from('products')
  .select('*, product_safety_assessments(*)')
  .eq('barcode', scannedBarcode)
  .single()

// Search nearby restaurants
const { data: restaurants } = await supabase
  .rpc('search_restaurants_by_location', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_miles: 25
  })
```

## 🚨 Critical Considerations

### Data Accuracy
- **Life-threatening consequences**: Incorrect ingredient data could cause severe allergic reactions
- **Multi-source verification**: Always cross-reference ingredient data
- **Community validation**: Implement robust review and verification systems
- **Expert review**: Have medical professionals review risk assessments

### Compliance
- **HIPAA**: Health data requires special handling
- **GDPR**: Personal data protection and right to deletion
- **FDA**: Food labeling accuracy requirements
- **State regulations**: Various state-level health data requirements

### Scalability
- **Index optimization**: Monitor and optimize query performance
- **Data partitioning**: Consider partitioning large tables by region/date
- **Caching**: Implement application-level caching for frequently accessed data
- **CDN**: Use CDN for product images and static assets

## 📞 Support & Documentation

### Additional Resources
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Contact
For questions about this schema implementation, please refer to the project documentation or contact the development team.

---

**⚠️ Important**: This database schema handles life-threatening health information. Always prioritize data accuracy and user safety over convenience or performance. When in doubt, err on the side of caution and provide conservative safety assessments.