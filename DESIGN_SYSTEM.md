# NativeWind Design System for Dietary Restriction App

A comprehensive, safety-focused design system built with NativeWind (Tailwind CSS) for React Native, specifically designed for medical/healthcare applications managing dietary restrictions and allergen safety.

## 🏥 Safety-First Design Philosophy

This design system prioritizes **safety communication** through consistent visual patterns:

- **Red (Danger)**: Contains allergens or unsafe ingredients
- **Green (Safe)**: Verified safe for consumption  
- **Amber (Caution)**: Requires verification or may contain allergens
- **Gray (Unknown)**: Status not yet determined

## 📁 File Structure

```
├── tailwind.config.js          # Complete Tailwind configuration with safety colors
├── babel.config.js             # NativeWind v4 Babel setup
├── global.css                  # Global styles and component classes
├── nativewind-env.d.ts         # TypeScript declarations
├── src/
│   ├── utils/
│   │   └── designSystem.ts     # Utility functions and hooks
│   └── components/
│       ├── SafetyBadge.tsx     # Status indicator component
│       ├── SafetyCard.tsx      # Information card with safety status
│       ├── SafetyButton.tsx    # Standardized button components
│       └── DesignSystemDemo.tsx # Complete design system showcase
```

## 🎨 Color System

### Safety Colors (Core)
```typescript
// Primary safety indicators
'safety-safe-500'     // #22c55e - Safe for consumption
'safety-danger-500'   // #ef4444 - Contains allergens
'safety-caution-500'  // #f59e0b - Requires verification
'safety-unknown-500'  // #64748b - Status unknown
```

### Medical Context Colors
```typescript
'medical-prescription' // #6366f1 - Prescription medications
'medical-otc'          // #8b5cf6 - Over-the-counter
'medical-supplement'   // #06b6d4 - Supplements/vitamins
'medical-natural'      // #10b981 - Natural/organic products
```

### Semantic Colors
```typescript
'primary-500'    // #0ea5e9 - Brand primary
'success-500'    // #22c55e - Success states
'warning-500'    // #f59e0b - Warning states
'error-500'      // #ef4444 - Error states
'info-500'       // #3b82f6 - Informational
```

## 🧩 Component Usage

### Safety Badge
Display safety status with consistent styling:

```tsx
import { SafetyBadge } from '../components/SafetyBadge';

<SafetyBadge status="safe" />
<SafetyBadge status="danger" size="lg" />
<SafetyBadge status="caution" showIcon={false} />
```

### Safety Card
Information cards with integrated safety status:

```tsx
import { SafetyCard } from '../components/SafetyCard';

<SafetyCard 
  title="Organic Quinoa"
  description="Gluten-free grain alternative"
  status="safe"
  details={["100% organic", "No allergens detected"]}
  onPress={() => navigation.navigate('ProductDetails')}
/>
```

### Safety Buttons
Standardized buttons with safety-focused variants:

```tsx
import { SafetyButton, SafeButton, DangerButton, CautionButton } from '../components/SafetyButton';

<SafetyButton title="Scan Product" onPress={handleScan} />
<SafeButton title="Mark as Safe" onPress={markSafe} />
<DangerButton title="Report Allergen" onPress={reportAllergen} />
<CautionButton title="Needs Review" onPress={needsReview} />
```

## 🎯 Utility Classes

### Pre-built Safety Classes
```css
/* Apply safety status styling */
.safety-safe      /* Safe status background and borders */
.safety-danger    /* Danger status background and borders */
.safety-caution   /* Caution status background and borders */
.safety-unknown   /* Unknown status background and borders */

/* Touch-friendly utilities */
.touch-target         /* 44px minimum (iOS) */
.touch-target-android /* 48px minimum (Android) */

/* Medical card styling */
.medical-card         /* Standard card with appropriate spacing */
```

### Button Component Classes
```css
.btn-primary    /* Primary action button */
.btn-secondary  /* Secondary action button */
.btn-success    /* Success/safe action button */
.btn-danger     /* Danger/allergen action button */
.btn-caution    /* Caution/warning action button */
```

### Alert/Notification Classes
```css
.alert-info     /* Informational messages */
.alert-success  /* Success confirmations */
.alert-warning  /* Warning messages */
.alert-error    /* Error messages */
```

## 🎭 Design Tokens

### Typography Scale
```typescript
// Medical-specific typography
'medical-caption'  // 12px - Small labels and metadata
'medical-body'     // 16px - Standard reading text
'medical-label'    // 14px - Form labels (medium weight)
'medical-heading'  // 20px - Section headers (semibold)
'medical-title'    // 24px - Page titles (bold)
```

### Spacing System
```typescript
// Base unit: 4px
'xs': '2px',   'sm': '4px',   'md': '8px',  'lg': '12px', 
'xl': '16px',  '2xl': '24px', '3xl': '32px'

// Touch-friendly spacing
'touch-sm': '12px', 'touch-md': '16px', 
'touch-lg': '20px', 'touch-xl': '24px'
```

### Border Radius
```typescript
'medical': '12px'     // Standard medical card radius
'xs': '2px'           // Minimal radius
'4xl': '32px'         // Large radius
```

## 📱 Responsive Design

### Breakpoints
```typescript
'xs': '375px',   // Small mobile
'sm': '640px',   // Large mobile
'md': '768px',   // Tablet
'lg': '1024px',  // Desktop
'xl': '1280px',  // Large desktop
'2xl': '1536px'  // Extra large
```

### Platform-Specific Classes
```css
/* Safe area support for notched devices */
.safe-area-top    /* Top safe area padding */
.safe-area-bottom /* Bottom safe area padding */
.safe-area-x      /* Horizontal safe area padding */
.safe-area-y      /* Vertical safe area padding */
.safe-area-all    /* All safe area padding */
```

## ♿ Accessibility Features

### WCAG AA Compliance
- All color combinations meet 4.5:1 contrast ratio minimum
- Critical interactions maintain 7:1 contrast ratio
- Color-blind friendly palette

### Touch Targets
```css
.touch-target         /* 44×44px minimum (iOS guidelines) */
.touch-target-android /* 48×48px minimum (Material Design) */
```

### Screen Reader Support
```css
.sr-only /* Screen reader only text */
```

### Motion Sensitivity
```css
@media (prefers-reduced-motion: reduce) {
  /* Reduced motion alternatives automatically applied */
}
```

## 🛠️ Development Hooks

### useSafetyClasses()
```typescript
const { getStatusClass, getStatusBadgeClass, getStatusIconClass } = useSafetyClasses();

// Apply safety status styling
const cardClass = getStatusClass('safe');
const badgeClass = getStatusBadgeClass('danger');
```

### useButtonClasses()
```typescript
const { getButtonClass, getOutlineButtonClass } = useButtonClasses();

// Generate button styling
const primaryButton = getButtonClass('primary', 'md');
const outlineButton = getOutlineButtonClass('secondary', 'lg');
```

### useInputClasses()
```typescript
const { getInputClass, getLabelClass, getErrorClass } = useInputClasses();

// Form styling with error states
const inputClass = getInputClass(hasError);
const labelClass = getLabelClass(hasError);
```

## 🧪 Testing Your Design System

Use the `DesignSystemDemo` component to validate all styling patterns:

```tsx
import { DesignSystemDemo } from '../components/DesignSystemDemo';

// Add to your development screens
<DesignSystemDemo />
```

## 🚀 Setup Instructions

1. **Install Dependencies** (already done):
   ```bash
   npm install nativewind@^4.1.23 tailwindcss@^3.4.0
   ```

2. **Configuration Files Created**:
   - ✅ `tailwind.config.js` - Complete configuration
   - ✅ `babel.config.js` - NativeWind v4 setup
   - ✅ `global.css` - Global styles and utilities
   - ✅ `nativewind-env.d.ts` - TypeScript support

3. **Import Global Styles** (already done):
   ```typescript
   // In App.tsx
   import './global.css';
   ```

## 📋 Component Checklist

- ✅ **SafetyBadge** - Status indicators with icons
- ✅ **SafetyCard** - Information cards with safety status
- ✅ **SafetyButton** - Standardized button components
- ✅ **DesignSystemDemo** - Complete showcase
- ✅ **Design utilities** - Helper functions and hooks

## 🎯 Best Practices

### Safety Communication
1. **Always use safety colors consistently** - Red for danger, green for safe, amber for caution
2. **Include icons with color** - Never rely on color alone
3. **Provide clear labels** - Accessibility and clarity
4. **Use appropriate contrast** - Medical information requires high readability

### Touch Interactions
1. **Minimum 44px touch targets** - iOS Human Interface Guidelines
2. **48px for Android** - Material Design guidelines
3. **Adequate spacing** - Prevent accidental taps
4. **Clear hover/pressed states** - Visual feedback

### Performance
1. **Use className prop** - NativeWind optimizes class usage
2. **Leverage utility classes** - Better performance than inline styles
3. **Component composition** - Reuse styled components
4. **Tree shaking** - Tailwind removes unused styles

## 🔄 Development Workflow

1. **Use design tokens** - Consistent spacing, colors, typography
2. **Test on multiple devices** - Ensure responsive behavior
3. **Validate accessibility** - Screen readers, contrast, touch targets
4. **Review safety patterns** - Consistent danger/safe/caution usage

## 📞 Support

For questions about the design system:
- Reference the `DesignSystemDemo` component for examples
- Check `src/utils/designSystem.ts` for available utilities
- Review `global.css` for available component classes

---

**Safety Note**: This design system is specifically crafted for medical/safety applications. Consistent use of safety colors and patterns is critical for user safety and regulatory compliance.