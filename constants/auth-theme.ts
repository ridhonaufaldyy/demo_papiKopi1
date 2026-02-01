/**
 * Theme Configuration for Login/Register Screens
 * 
 * Ubah nilai di sini untuk customize warna & styling
 */

export const authTheme = {
  // Colors
  primary: {
    light: '#3b82f6',      // blue-600
    dark: '#1e40af',       // blue-800
    lighter: '#eff6ff',    // blue-50
  },
  
  success: {
    main: '#16a34a',       // green-600
  },
  
  error: {
    main: '#dc2626',       // red-600
  },
  
  gray: {
    900: '#111827',        // text-gray-900
    800: '#1f2937',        // text-gray-800
    700: '#374151',        // text-gray-700
    600: '#4b5563',        // text-gray-600
    500: '#6b7280',        // text-gray-500
    400: '#9ca3af',        // text-gray-400
    300: '#d1d5db',        // border-gray-300
    200: '#e5e7eb',        // bg-gray-200
    100: '#f3f4f6',        // bg-gray-100
    50: '#f9fafb',         // bg-gray-50
  },

  // Gradients
  gradients: {
    authBackground: 'from-blue-50 to-white',        // Login/Register background
    headerProfile: 'from-blue-600 to-blue-500',     // Profile header
  },

  // Border Radius
  borderRadius: {
    input: 'lg',           // rounded-lg
    card: '2xl',           // rounded-2xl
    button: 'lg',          // rounded-lg
  },

  // Spacing
  spacing: {
    inputPadding: 'px-4 py-3',
    cardPadding: 'p-6',
    containerPadding: 'px-6',
  },

  // Font Sizes
  fontSize: {
    heading: 'text-4xl',
    subheading: 'text-xl',
    body: 'text-base',
    small: 'text-sm',
    xs: 'text-xs',
  },

  // Font Weights
  fontWeight: {
    bold: 'font-bold',
    semibold: 'font-semibold',
    normal: 'font-normal',
  },

  // Shadows
  shadow: {
    card: 'shadow-lg',
    subtle: 'shadow-sm',
  },
};

/**
 * Usage Example:
 * 
 * import { authTheme } from '@/constants/auth-theme';
 * 
 * <View className={`bg-${authTheme.primary.lighter}`}>
 *   <TouchableOpacity className={`bg-${authTheme.primary.light}`}>
 *     <Text>Login</Text>
 *   </TouchableOpacity>
 * </View>
 */

export default authTheme;
