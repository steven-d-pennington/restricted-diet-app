/** @type {import('tailwindcss').Config} */
module.exports = {
  // Important for NativeWind v4
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.ts"
  ],
  
  presets: [require("nativewind/preset")],
  
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // Main primary
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        
        // Safety Status Colors - Core to the medical app
        safety: {
          // Safe (Green) - Indicates safe ingredients/products
          safe: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',  // Main safe green
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          
          // Danger (Red) - Indicates allergens/unsafe ingredients
          danger: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',  // Main danger red
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          
          // Caution (Amber) - Indicates potential concerns/warnings
          caution: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',  // Main caution amber
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          },
          
          // Unknown (Gray) - For unverified or unknown safety status
          unknown: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',  // Main unknown gray
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        },
        
        // Neutral Colors for UI elements
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        
        // Medical Context Colors
        medical: {
          // Prescription/Medical information
          prescription: '#6366f1',  // Indigo
          // Over-the-counter
          otc: '#8b5cf6',          // Purple
          // Supplement
          supplement: '#06b6d4',    // Cyan
          // Natural/Organic
          natural: '#10b981',      // Emerald
        },
        
        // Semantic Colors
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Main info blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Main success (same as safety.safe)
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Main warning (same as safety.caution)
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Main error (same as safety.danger)
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        // Background Colors
        background: '#ffffff',
        surface: '#f8fafc',
        card: '#ffffff',
        
        // Text Colors
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#94a3b8',
          inverse: '#ffffff',
        }
      },
      
      fontFamily: {
        // System fonts optimized for medical/professional context
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        // Medical/Professional fonts
        medical: ['-apple-system', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
      fontSize: {
        // Mobile-optimized type scale
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
        '5xl': ['36px', { lineHeight: '44px' }],
        '6xl': ['48px', { lineHeight: '56px' }],
        
        // Medical-specific sizes
        'medical-caption': ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        'medical-body': ['16px', { lineHeight: '24px' }],
        'medical-label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'medical-heading': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'medical-title': ['24px', { lineHeight: '32px', fontWeight: '700' }],
      },
      
      spacing: {
        // Extended spacing scale for mobile interfaces
        '18': '4.5rem',   // 72px
        '72': '18rem',    // 288px
        '84': '21rem',    // 336px
        '96': '24rem',    // 384px
        
        // Touch-friendly spacing
        'touch-sm': '0.75rem',  // 12px
        'touch-md': '1rem',     // 16px
        'touch-lg': '1.25rem',  // 20px
        'touch-xl': '1.5rem',   // 24px
      },
      
      borderRadius: {
        // Mobile-friendly border radius
        'xs': '0.125rem',   // 2px
        '4xl': '2rem',      // 32px
        '5xl': '2.5rem',    // 40px
        
        // Medical card radius
        'medical': '0.75rem', // 12px
      },
      
      boxShadow: {
        // Mobile-optimized shadows
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        
        // Safety-specific shadows with color hints
        'safe': '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.06)',
        'danger': '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
        'caution': '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
      },
      
      // Screen sizes for responsive design
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Animation and transitions
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      
      // Minimum touch targets for accessibility
      minHeight: {
        'touch': '44px',  // iOS/Apple Human Interface Guidelines
        'touch-android': '48px',  // Material Design
      },
      
      minWidth: {
        'touch': '44px',
        'touch-android': '48px',
      },
      
      // Z-index scale for proper layering
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      }
    },
  },
  
  plugins: [
    // Custom plugin for medical/safety utilities
    function({ addUtilities, theme }) {
      addUtilities({
        // Safety status indicators
        '.safety-safe': {
          backgroundColor: theme('colors.safety.safe.50'),
          borderColor: theme('colors.safety.safe.200'),
          color: theme('colors.safety.safe.800'),
        },
        '.safety-danger': {
          backgroundColor: theme('colors.safety.danger.50'),
          borderColor: theme('colors.safety.danger.200'),
          color: theme('colors.safety.danger.800'),
        },
        '.safety-caution': {
          backgroundColor: theme('colors.safety.caution.50'),
          borderColor: theme('colors.safety.caution.200'),
          color: theme('colors.safety.caution.800'),
        },
        '.safety-unknown': {
          backgroundColor: theme('colors.safety.unknown.50'),
          borderColor: theme('colors.safety.unknown.200'),
          color: theme('colors.safety.unknown.800'),
        },
        
        // Touch-friendly utilities
        '.touch-target': {
          minHeight: theme('minHeight.touch'),
          minWidth: theme('minWidth.touch'),
        },
        '.touch-target-android': {
          minHeight: theme('minHeight.touch-android'),
          minWidth: theme('minWidth.touch-android'),
        },
        
        // Medical card styles
        '.medical-card': {
          backgroundColor: theme('colors.card'),
          borderRadius: theme('borderRadius.medical'),
          boxShadow: theme('boxShadow.soft'),
          padding: theme('spacing.4'),
        },
        
        // Screen reader only utility (for accessibility)
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
      })
    }
  ],
}