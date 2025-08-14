/**
 * SafetyButton Component
 * 
 * SAFETY CRITICAL: Standardized button component with safety-focused variants
 * Ensures consistent touch targets and accessibility across the app
 */

import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, ViewStyle } from 'react-native';
import { useButtonClasses, getTouchTargetClass, getAccessibilityProps } from '../utils/designSystem';
import type { ComponentVariant, ComponentSize } from '../utils/designSystem';

interface SafetyButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ComponentVariant;
  size?: ComponentSize | 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  outline?: boolean;
  className?: string;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
}

export function SafetyButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  outline = false,
  className = '',
  style,
  testID,
  accessibilityHint
}: SafetyButtonProps) {
  const { getButtonClass, getOutlineButtonClass, getButtonStyle, getButtonTextStyle } = useButtonClasses();
  const touchTargetClass = getTouchTargetClass();
  const normalizedSize: ComponentSize = ((): ComponentSize => {
    if (size === 'small') return 'sm';
    if (size === 'medium') return 'md';
    if (size === 'large') return 'lg';
    return size as ComponentSize;
  })();
  
  const buttonClass = outline 
    ? getOutlineButtonClass(variant, normalizedSize)
    : getButtonClass(variant, normalizedSize);
  
  const finalClass = `${buttonClass} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''} ${className}`;
  
  const accessibilityProps = getAccessibilityProps(
    title,
    accessibilityHint,
    'button'
  );
  
  const isDisabled = disabled || loading;
  
  const iconSpacing = size === 'xs' ? 'mx-1' : size === 'sm' ? 'mx-1.5' : 'mx-2';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${finalClass} ${touchTargetClass}`}
      style={[getButtonStyle(variant, normalizedSize), style]}
      testID={testID}
      {...accessibilityProps}
      accessibilityState={{ 
        disabled: isDisabled,
        busy: loading
      }}
    >
      <View className="flex-row items-center justify-center">
        {/* Loading indicator */}
        {loading && (
          <ActivityIndicator 
            size="small" 
            color="currentColor" 
            className={iconSpacing}
          />
        )}
        
        {/* Left icon */}
        {!loading && icon && iconPosition === 'left' && (
          <View className={iconSpacing}>
            {icon}
          </View>
        )}
        
        {/* Button text */}
        <Text 
          className="font-medium text-center"
          style={getButtonTextStyle(variant)}
          numberOfLines={1}
        >
          {title}
        </Text>
        
        {/* Right icon */}
        {!loading && icon && iconPosition === 'right' && (
          <View className={iconSpacing}>
            {icon}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Specialized safety action buttons
export function SafeButton(props: Omit<SafetyButtonProps, 'variant'>) {
  return <SafetyButton {...props} variant="success" />;
}

export function DangerButton(props: Omit<SafetyButtonProps, 'variant'>) {
  return <SafetyButton {...props} variant="error" />;
}

export function CautionButton(props: Omit<SafetyButtonProps, 'variant'>) {
  return <SafetyButton {...props} variant="warning" />;
}

// Usage Examples:
// <SafetyButton title="Save" onPress={handleSave} />
// <SafeButton title="Mark as Safe" onPress={markSafe} />
// <DangerButton title="Report Allergen" onPress={reportAllergen} />
// <CautionButton title="Need Review" onPress={needsReview} />
// 
// <SafetyButton 
//   title="Scan Product" 
//   onPress={startScan}
//   icon={<CameraIcon />}
//   size="lg"
//   fullWidth
// />

export default SafetyButton;