# Supabase Integration for Restricted Diet App

This directory contains the complete Supabase integration for the Restricted Diet Application, a safety-critical system for managing life-threatening dietary restrictions and allergies.

## 🚨 SAFETY CRITICAL NOTICE

This application handles life-threatening medical information. All code in this module follows strict safety protocols:

- **Type Safety**: Comprehensive TypeScript types for all database operations
- **Error Handling**: Robust error handling with safety-critical error classification
- **Data Integrity**: Soft deletes and audit trails for critical data
- **Security**: Proper authentication, authorization, and data encryption
- **Reliability**: Comprehensive testing and error recovery mechanisms

## 📁 Directory Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client configuration
├── types/
│   └── database.types.ts        # TypeScript types from database schema
├── contexts/
│   └── AuthContext.tsx          # Authentication context and hooks
├── services/
│   └── database.ts              # Database service layer with CRUD operations
├── hooks/
│   ├── useUserProfile.ts        # User profile and restrictions management
│   ├── useFamilyMembers.ts      # Family member management
│   ├── useProductSafety.ts      # Product scanning and safety assessment
│   └── useEmergencyCards.ts     # Emergency card management
├── utils/
│   └── errorHandling.ts         # Comprehensive error handling utilities
├── index.ts                     # Main export file
└── README.md                    # This documentation
```

## 🔧 Core Components

### 1. Database Client (`lib/supabase.ts`)
- Configured Supabase client with AsyncStorage persistence
- Environment variable validation
- Helper functions for authentication state
- Standardized response handling

### 2. Type Definitions (`types/database.types.ts`)
- Complete TypeScript types generated from database schema
- Helper types for UI components
- Safety-focused enum types (severity levels, safety levels)

### 3. Authentication (`contexts/AuthContext.tsx`)
- React context for authentication state management
- User sign up, sign in, password management
- Profile creation and updates
- Session persistence and state synchronization

### 4. Database Services (`services/database.ts`)
- **UserProfileService**: User profile and dietary restriction management
- **FamilyMemberService**: Family member profile management
- **DietaryRestrictionsService**: Restriction database operations
- **ProductService**: Product database and barcode scanning
- **ProductSafetyService**: Safety assessment calculations
- **EmergencyCardService**: Emergency card management

### 5. React Hooks (`hooks/`)
- **useUserProfile**: User profile and restrictions management
- **useFamilyMembers**: Family account member management
- **useProductSafety**: Product scanning and safety assessment
- **useEmergencyCards**: Emergency card management

### 6. Error Handling (`utils/errorHandling.ts`)
- Centralized error handling with severity classification
- Safety-critical error alerts
- User-friendly error messaging
- Error logging and monitoring integration

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file with your Supabase configuration:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. App Integration

Wrap your app with the AuthProvider:

```tsx
import React from 'react';
import { AuthProvider } from './src';

export default function App() {
  return (
    <AuthProvider>
      <YourAppContent />
    </AuthProvider>
  );
}
```

### 3. Using Hooks in Components

```tsx
import React from 'react';
import { useAuth, useUserProfile, useProductSafety } from './src';

function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { 
    userProfile, 
    addRestriction, 
    hasLifeThreateningRestrictions 
  } = useUserProfile();
  const { 
    scanProduct, 
    getSafetyLevel, 
    getSafetyMessage 
  } = useProductSafety();

  // Component implementation...
}
```

## 🛡️ Safety Features

### Life-Threatening Allergy Management
- Severity classification (mild, moderate, severe, life_threatening)
- Emergency card generation with QR codes
- Critical restriction alerts and warnings
- Safety assessment for scanned products

### Product Safety Assessment
- Real-time ingredient risk analysis
- Color-coded safety levels (safe, caution, warning, danger)
- Detailed risk factor breakdown
- Cross-contamination risk evaluation

### Family Account Management
- Multiple family member profiles
- Individual restriction management per member
- Emergency contact information
- Caregiver access controls

### Emergency Information
- Digital emergency cards with critical allergy information
- QR code generation for first responders
- Offline access to emergency data
- Multiple language support

## 🔐 Security Considerations

### Authentication & Authorization
- Secure session management with auto-refresh
- Row Level Security (RLS) policies in database
- Proper user context validation
- Session timeout handling

### Data Protection
- Sensitive medical data encryption
- Audit trail for critical changes
- Soft deletes for safety-critical data
- Backup and recovery procedures

### Error Handling
- Safety-critical error classification
- Graceful degradation for network issues
- Comprehensive error logging
- User-friendly error messages

## 📊 Database Schema Overview

### Core Tables
- **user_profiles**: Extended user information and preferences
- **family_members**: Family member profiles for family accounts
- **dietary_restrictions**: Master list of dietary restrictions
- **user_restrictions**: User-specific dietary restrictions with severity
- **products**: Product database for barcode scanning
- **product_safety_assessments**: Calculated safety levels per user
- **emergency_cards**: Emergency information for critical allergies

### Safety Features
- **audit_log**: Complete audit trail of all changes
- **ingredient_risk_assessments**: Risk mappings for ingredients
- **data_verifications**: Community verification of product data

## 🧪 Testing Guidelines

### Safety-Critical Testing
1. **Allergy Severity Tests**: Verify correct severity classification
2. **Product Safety Tests**: Test safety assessment algorithms
3. **Emergency Card Tests**: Validate emergency information accuracy
4. **Error Handling Tests**: Test graceful degradation scenarios
5. **Data Integrity Tests**: Verify audit trails and soft deletes

### Test Scenarios
- Life-threatening allergy product scanning
- Network failure during critical operations
- Invalid or corrupted product data
- Emergency card generation and QR codes
- Family member restriction management

## 📈 Performance Considerations

### Optimizations
- Proper database indexing for fast queries
- Caching for frequently accessed data
- Pagination for large data sets
- Background sync for offline support

### Monitoring
- Real-time error tracking
- Performance metrics monitoring
- Safety-critical operation alerts
- User experience analytics

## 🔄 Maintenance & Updates

### Regular Tasks
- Database schema migration management
- Security audit and penetration testing
- Performance optimization reviews
- Error log analysis and cleanup

### Critical Updates
- Immediate security patches
- Safety-critical bug fixes
- Emergency contact system updates
- Regulatory compliance updates

## 📞 Support & Emergency Contacts

For safety-critical issues or bugs that could affect user safety:

1. **Immediate**: Contact development team emergency line
2. **Log**: Create detailed error reports with context
3. **Escalate**: Notify medical advisory board if needed
4. **Document**: Update incident response procedures

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [Food Allergy Safety Guidelines](https://www.foodallergy.org/)

---

**Remember**: This is a safety-critical application. Always prioritize user safety over convenience, and thoroughly test all changes that could affect the accuracy of allergy and dietary restriction information.