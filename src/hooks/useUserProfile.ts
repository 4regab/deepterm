// This file re-exports the useUserProfile hook from the UserProfileContext
// for backward compatibility with components that import from this path

import { useUserProfile } from '@/context/UserProfileContext';

export { useUserProfile };

// Default export for modules that use import default
export default useUserProfile;