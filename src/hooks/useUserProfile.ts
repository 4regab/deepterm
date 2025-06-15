import { useContext } from "react";
import { UserProfileContext } from "@/context/UserProfileContextDefinition";

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

// Default export for modules that use import default
export default useUserProfile;