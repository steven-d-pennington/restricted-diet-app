# Restaurant Features Migration Guide

## Overview

This migration extends the existing Phase 1 dietary restriction management schema with comprehensive restaurant features while maintaining safety-critical standards and backward compatibility.

## Migration Files

Execute these files in order after Phase 1 is deployed:

1. **migration_002_restaurant_extensions.sql** - Core schema extensions
2. **rls_policies_restaurant_extensions.sql** - Security policies
3. **functions_restaurant_extensions.sql** - Business logic functions
4. **sample_data_restaurant_extensions.sql** - Development test data

## Key Features Added

### 1. Restaurant Core Data Extensions
- **PostGIS location support** for precise mapping and distance queries
- **Restaurant classification** (independent, chain, franchise, food truck, etc.)
- **Accessibility information** (wheelchair access, parking, noise level)
- **Service options** (delivery, takeout, reservations, payment methods)
- **Multi-language support** for international users

### 2. Safety & Verification System
- **Multi-level verification** (community, expert, official)
- **Safety protocol documentation** per dietary restriction
- **Health department rating integration**
- **Expert endorsement system** with credential verification
- **Safety incident reporting and tracking**

### 3. Menu Management
- **Detailed menu item database** with ingredient mapping
- **Safety assessments** per menu item and restriction
- **Customization options** (removable/substitutable ingredients)
- **Preparation method tracking** for cross-contamination risk
- **Confidence scoring** for data quality assessment

### 4. Community Features
- **Enhanced review system** with safety-focused categories
- **Review interaction system** (helpful votes, reporting)
- **Expert verification** of restaurant information
- **Incident follow-up tracking** for accountability
- **Community moderation** with approval workflows

### 5. Advanced Search & Discovery
- **Location-based search** with PostGIS spatial queries
- **Multi-criteria filtering** (cuisine, price, safety score, verification)
- **Personalized recommendations** based on user restrictions
- **Menu item search** with safety assessment integration
- **Performance-optimized** for mobile applications

## Safety-Critical Considerations

### Data Integrity
- **Audit trails** for all safety-related changes
- **Multi-source verification** for critical information
- **Confidence scoring** to indicate data reliability
- **Expert verification** for professional accountability
- **Incident tracking** with severity classification

### Access Control
- **Strict RLS policies** protecting personal incident reports
- **Tiered access levels** (anonymous, authenticated, verified, expert)
- **Privacy protection** for sensitive health information
- **Community moderation** to prevent malicious content
- **Expert credential verification** system

### Performance & Scale
- **PostGIS spatial indexing** for efficient location queries
- **Full-text search** with trigram indexing for restaurant/menu search
- **Optimized for mobile** usage patterns and limited bandwidth
- **Caching-friendly** structure for frequently accessed data
- **Scalable to millions** of restaurants and menu items

## Breaking Changes

### Database Schema
- **Location column change**: `latitude`/`longitude` columns replaced with single PostGIS `location` column
- **New enum types**: Additional enums for restaurant classification and verification status
- **Extended tables**: Existing tables have new optional columns (backward compatible)

### API Considerations
- **Location queries**: Must use PostGIS functions instead of mathematical calculations
- **New filtering options**: Additional parameters for restaurant search functions
- **Safety assessments**: New endpoints for menu-level safety information

## Migration Steps

### 1. Prerequisites
```sql
-- Ensure PostGIS extension is available
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### 2. Schema Migration
```sql
-- Execute core schema extensions
\i migration_002_restaurant_extensions.sql
```

### 3. Security Setup
```sql
-- Apply new RLS policies
\i rls_policies_restaurant_extensions.sql
```

### 4. Function Installation
```sql
-- Install enhanced business logic functions
\i functions_restaurant_extensions.sql
```

### 5. Sample Data (Development Only)
```sql
-- Load test data for development
\i sample_data_restaurant_extensions.sql
```

### 6. Index Verification
```sql
-- Verify all indexes are created
SELECT schemaname, indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%restaurant%' 
OR tablename LIKE '%menu%';
```

## Performance Optimization

### Critical Indexes
- **Spatial index**: `idx_restaurants_location_gist` for location-based queries
- **Full-text search**: `idx_menu_items_name_trgm` for menu item search
- **Restriction filtering**: `idx_restaurant_safety_protocols_restriction_id`
- **Safety assessments**: `idx_menu_item_safety_assessments_item_id`

### Query Optimization Tips
1. **Use spatial queries** properly with appropriate SRID (4326)
2. **Limit result sets** in location-based searches
3. **Filter by active status** to exclude inactive restaurants
4. **Use prepared statements** for frequently executed queries
5. **Cache location searches** by geographic region

## Security Considerations

### Personal Data Protection
- **Incident reports** are strictly access-controlled
- **Personal health information** follows HIPAA-like protections
- **Anonymous reporting** options available
- **Data retention policies** for expired verifications

### Community Safety
- **Expert verification** prevents false credentials
- **Content moderation** system for reviews and reports
- **Audit trails** for accountability
- **Rate limiting** to prevent abuse

### Professional Liability
- **Clear disclaimers** that community data is informational
- **Professional verification** required for expert endorsements
- **Incident documentation** for legal compliance
- **Verification expiry** to ensure current information

## Testing Strategy

### Unit Tests
- Test all new database functions with various input scenarios
- Verify RLS policies block unauthorized access
- Validate spatial query accuracy
- Check safety assessment calculations

### Integration Tests
- Test restaurant search with location filtering
- Verify menu item safety assessment workflow
- Test incident reporting and follow-up system
- Validate expert verification process

### Performance Tests
- Location-based search with large datasets
- Menu item search response times
- Concurrent safety assessment calculations
- Database backup and restore procedures

## Rollback Plan

### Schema Rollback
```sql
-- Remove new tables (will lose restaurant extension data)
DROP TABLE IF EXISTS public.incident_follow_ups CASCADE;
DROP TABLE IF EXISTS public.safety_incidents CASCADE;
-- ... (continue with other tables in reverse dependency order)

-- Revert location column changes
ALTER TABLE public.restaurants ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE public.restaurants ADD COLUMN longitude DECIMAL(11, 8);
-- ... (extract coordinates from location column if needed)
ALTER TABLE public.restaurants DROP COLUMN location;
```

### Function Rollback
```sql
-- Remove new functions
DROP FUNCTION IF EXISTS public.search_restaurants_enhanced CASCADE;
DROP FUNCTION IF EXISTS public.calculate_menu_item_safety CASCADE;
-- ... (continue with other functions)
```

## Monitoring & Alerts

### Key Metrics
- **Restaurant search response times**
- **Safety assessment calculation performance**
- **Incident report submission rates**
- **Expert verification activity**
- **Database size growth rates**

### Alert Conditions
- **Search response time > 2 seconds**
- **Safety assessment failures**
- **Critical incident reports**
- **Failed expert verifications**
- **High error rates in location queries**

## Future Enhancements

### Phase 3 Considerations
- **Real-time incident notifications**
- **AI-powered menu analysis**
- **Integration with health department APIs**
- **Advanced analytics and reporting**
- **Mobile app offline capabilities**

### Scalability Improvements
- **Geospatial clustering** for performance
- **Caching layer** for frequently accessed data
- **Read replicas** for search queries
- **Data archiving** for old incidents
- **CDN integration** for menu images

## Support Information

### Documentation
- **API documentation** for new endpoints
- **Function reference** for database operations
- **Security guidelines** for data handling
- **Performance tuning** recommendations

### Troubleshooting
- **Common PostGIS issues** and solutions
- **RLS policy debugging** techniques
- **Performance optimization** strategies
- **Data migration** problem resolution

---

**Important**: This migration handles life-threatening allergy information. Thoroughly test all safety-critical features before deploying to production.