// Platform shim: export the platform-specific implementation
// On web, Metro will prefer RestaurantMap.web.tsx; on native, RestaurantMap.native.tsx
export { RestaurantMap } from './RestaurantMap.web'