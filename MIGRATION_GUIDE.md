# NativeWind Migration Guide

Complete guide for migrating from StyleSheet-based styling to the new NativeWind design system.

## 📋 Migration Checklist

### ✅ Setup Complete
- [x] NativeWind v4.1.23 installed
- [x] Tailwind CSS v3.4.17 installed  
- [x] `tailwind.config.js` configured with safety colors
- [x] `babel.config.js` updated for NativeWind
- [x] `global.css` created with component classes
- [x] TypeScript declarations added
- [x] Design system utilities created
- [x] Example components built

### 🔄 Next Steps for Full Migration

1. **Update Existing Screens**
2. **Migrate Component Library**
3. **Update Navigation Styling**
4. **Test Cross-Platform Consistency**

## 🔄 Component Migration Examples

### Before & After: StyleSheet → NativeWind

#### ❌ Old StyleSheet Approach
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  safetyCard: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6E8C6',
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Usage
<View style={styles.container}>
  <View style={styles.safetyCard}>
    <Text>Safe content</Text>
  </View>
  <TouchableOpacity style={styles.button}>
    <Text style={styles.buttonText}>Button</Text>
  </TouchableOpacity>
</View>
```

#### ✅ New NativeWind Approach
```typescript
// No StyleSheet needed - use utility classes and components
import { SafetyCard } from '../components/SafetyCard';
import { SafeButton } from '../components/SafetyButton';

// Usage
<View className="flex-1 bg-background p-4">
  <SafetyCard
    title="Safe Product"
    status="safe"
    description="This product is safe for consumption"
  />
  <SafeButton 
    title="Mark as Safe" 
    onPress={handleSave}
  />
</View>
```

### Migration Benefits Comparison

| Aspect | StyleSheet | NativeWind |
|--------|------------|------------|
| **Code Volume** | ~150 lines styles | ~10 lines classes |
| **Consistency** | Manual color matching | Automatic design tokens |
| **Responsiveness** | Custom breakpoint logic | Built-in responsive utilities |
| **Accessibility** | Manual contrast checking | WCAG AA compliant colors |
| **Performance** | Runtime style objects | Compile-time optimization |
| **Maintenance** | Update each component | Update design system once |

## 🎯 Step-by-Step Migration Process

### Step 1: Identify Components to Migrate

**High Priority (Safety Critical)**:
- [ ] `DashboardScreen.tsx` - Main interface
- [ ] `ScanResultScreen.tsx` - Safety results display  
- [ ] `ProfileScreen.tsx` - User restrictions
- [ ] `EmergencyScreen.tsx` - Critical safety information

**Medium Priority**:
- [ ] `LoginScreen.tsx` - Authentication
- [ ] `OnboardingIntroScreen.tsx` - First-time setup
- [ ] `FamilyScreen.tsx` - Family management

**Low Priority**:
- [ ] `LoadingScreen.tsx` - Loading states
- [ ] `PlaceholderScreen.tsx` - Development screens

### Step 2: Migration Pattern for Each Screen

1. **Import Design System Components**:
```typescript
import { SafetyCard } from '../../components/SafetyCard';
import { SafetyButton, SafeButton, DangerButton } from '../../components/SafetyButton';
import { SafetyBadge } from '../../components/SafetyBadge';
import { useSafetyClasses } from '../../utils/designSystem';
```

2. **Replace StyleSheet with Classes**:
```typescript
// Before
<View style={styles.container}>

// After  
<View className="flex-1 bg-background p-4">
```

3. **Use Safety Components for Status**:
```typescript
// Before
<View style={styles.safeCard}>
  <Text style={styles.safeText}>Safe</Text>
</View>

// After
<SafetyCard title="Product Name" status="safe" />
```

4. **Replace Custom Buttons**:
```typescript
// Before
<TouchableOpacity style={styles.button} onPress={onPress}>
  <Text style={styles.buttonText}>Save</Text>
</TouchableOpacity>

// After
<SafetyButton title="Save" onPress={onPress} />
```

### Step 3: Color Migration Mapping

| Old Color | NativeWind Class | Usage |
|-----------|------------------|-------|
| `#E8F5E8` | `bg-safety-safe-50` | Safe backgrounds |
| `#4CAF50` | `bg-safety-safe-500` | Safe buttons/badges |
| `#FEF2F2` | `bg-safety-danger-50` | Danger backgrounds |  
| `#EF4444` | `bg-safety-danger-500` | Danger buttons/badges |
| `#FFFBEB` | `bg-safety-caution-50` | Caution backgrounds |
| `#F59E0B` | `bg-safety-caution-500` | Caution buttons/badges |
| `#F8FAFC` | `bg-surface` | Card backgrounds |
| `#FFFFFF` | `bg-card` | Primary backgrounds |

### Step 4: Spacing Migration

| StyleSheet | NativeWind | rem | px |
|------------|------------|-----|-----|
| `margin: 4` | `m-1` | 0.25rem | 4px |
| `margin: 8` | `m-2` | 0.5rem | 8px |
| `margin: 12` | `m-3` | 0.75rem | 12px |
| `margin: 16` | `m-4` | 1rem | 16px |
| `margin: 20` | `m-5` | 1.25rem | 20px |
| `margin: 24` | `m-6` | 1.5rem | 24px |
| `padding: 16` | `p-4` | 1rem | 16px |
| `paddingVertical: 12` | `py-3` | 0.75rem | 12px |
| `paddingHorizontal: 20` | `px-5` | 1.25rem | 20px |

## 🛠️ Common Migration Patterns

### Pattern 1: Safety Status Indicators

#### Before
```typescript
const getSafetyStyle = (status: string) => {
  switch (status) {
    case 'safe':
      return { backgroundColor: '#E8F5E8', borderColor: '#C6E8C6' };
    case 'danger':
      return { backgroundColor: '#FEF2F2', borderColor: '#FECACA' };
    default:
      return { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' };
  }
};

<View style={[styles.card, getSafetyStyle(status)]}>
  <Text>Status content</Text>
</View>
```

#### After
```typescript
import { SafetyCard } from '../components/SafetyCard';

<SafetyCard
  title="Product Name"
  status={status as SafetyStatus}
  description="Status description"
/>
```

### Pattern 2: Touch Targets

#### Before
```typescript
const styles = StyleSheet.create({
  button: {
    minHeight: 44, // iOS guideline
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
```

#### After
```typescript
// Automatic touch target compliance
<SafetyButton title="Action" onPress={onPress} />
// or manually
<TouchableOpacity className="touch-target items-center justify-center">
```

### Pattern 3: Responsive Design

#### Before
```typescript
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Dimensions.get('window').width > 768 ? 32 : 16,
  },
});
```

#### After
```typescript
<View className="px-4 md:px-8">
  {/* 16px on mobile, 32px on tablet+ */}
</View>
```

## 🎨 Design Token Reference

### Quick Reference for Migration

| Design Element | Old Approach | New NativeWind Class |
|----------------|--------------|----------------------|
| **Safety Colors** |
| Safe background | `backgroundColor: '#E8F5E8'` | `bg-safety-safe-50` |
| Safe text | `color: '#2E7D32'` | `text-safety-safe-800` |
| Safe border | `borderColor: '#C6E8C6'` | `border-safety-safe-200` |
| Danger background | `backgroundColor: '#FEF2F2'` | `bg-safety-danger-50` |
| Danger text | `color: '#991B1B'` | `text-safety-danger-800` |
| **Typography** |
| Large heading | `fontSize: 24, fontWeight: 'bold'` | `text-2xl font-bold` |
| Body text | `fontSize: 16` | `text-base` |
| Small text | `fontSize: 14, color: '#666'` | `text-sm text-text-secondary` |
| **Layout** |
| Card style | Complex StyleSheet | `medical-card` |
| Flex container | `flex: 1` | `flex-1` |
| Center content | `alignItems: 'center'` | `items-center` |

## ✅ Migration Testing Checklist

For each migrated screen/component:

- [ ] **Visual Consistency**: Compare old vs new styling
- [ ] **Touch Targets**: Verify 44px minimum touch areas
- [ ] **Accessibility**: Test with screen reader
- [ ] **Responsive**: Test on phone, tablet, web
- [ ] **Platform**: Test iOS and Android differences  
- [ ] **Performance**: Verify no performance regression
- [ ] **Safety Colors**: Confirm proper red/green/amber usage

## 🚨 Safety Critical Migration Notes

**IMPORTANT**: For safety-critical components (allergen warnings, emergency info):

1. **Always test safety color accuracy** - Red must clearly indicate danger
2. **Verify contrast ratios** - Medical info requires high readability  
3. **Test with accessibility tools** - Screen readers must convey safety status
4. **Validate on multiple devices** - Colors must be consistent across platforms
5. **Emergency components first** - Prioritize life-safety features

## 🔧 Development Tools

### Useful Commands During Migration

```bash
# Check for unused StyleSheet imports
grep -r "StyleSheet" src/ --include="*.tsx" --include="*.ts"

# Find hardcoded colors that need migration  
grep -r "#[0-9A-Fa-f]\{6\}" src/ --include="*.tsx" --include="*.ts"

# Verify NativeWind classes are working
npx tailwindcss build -i global.css -o test-output.css
```

### VS Code Extensions

- **Tailwind CSS IntelliSense**: Auto-complete for utility classes
- **NativeWind**: Syntax highlighting and validation  
- **Color Highlight**: Visualize color values in code

## 📞 Migration Support

- **Design System Demo**: Use `DesignSystemDemo` component for reference
- **Utility Functions**: Check `src/utils/designSystem.ts` for helpers
- **Documentation**: Reference `DESIGN_SYSTEM.md` for complete guide
- **Example Migration**: See `DashboardScreenUpdated.tsx` for full example

---

**Next Steps**: Start with the `DashboardScreen.tsx` migration to establish patterns, then proceed with other safety-critical screens.