import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import cookieUtils, { ConsentLevel } from '@/utils/cookieUtils';
import { Link } from 'react-router-dom'; // Import Link for navigation

const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given or declined
    const currentConsent = cookieUtils.getConsentLevel();
    // Only show the banner if no choice has been made yet (or if it defaulted to essential without explicit choice)
    // A more robust check might involve storing a separate flag indicating explicit choice.
    // For now, we assume if it's 'essential', it might be the default and we should ask.
    // If it's 'all' or 'declined', the user has made a choice.
    const hasMadeChoice = localStorage.getItem('cookieConsentChoiceMade');
    if (!hasMadeChoice) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (level: ConsentLevel) => {
    cookieUtils.setConsentLevel(level);
    localStorage.setItem('cookieConsentChoiceMade', 'true'); // Mark that a choice has been made
    setIsVisible(false);
    // Optional: Reload or update parts of the app that depend on consent
    window.location.reload(); // Simple reload to apply changes (e.g., load ads)
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <Card className="w-full max-w-3xl bg-neo-bg border-2 border-neo-black shadow-neo-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-neo-text">Cookie Consent</CardTitle>
        </CardHeader>
        <CardContent className="text-neo-text">
          <p>
            We use cookies to enhance your experience, analyze site traffic, and personalize content and ads.
            By clicking "Accept All", you agree to our use of all cookies. You can manage your preferences or
            decline non-essential cookies. For more details, please visit our{' '}
            <Link to="/privacy-policy" className="text-neo-accent4 underline hover:text-neo-accent2">
              Privacy Policy
            </Link>.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="outline"
            className="bg-white border-2 border-neo-black text-neo-text shadow-neo-sm hover:shadow-neo active:shadow-none hover:bg-gray-100"
            onClick={() => handleConsent(ConsentLevel.DECLINED)}
          >
            Decline Non-Essential
          </Button>
          {/* Add a 'Customize' button later if needed */}
          <Button
            className="bg-neo-accent2 border-2 border-neo-black text-white shadow-neo-sm hover:shadow-neo active:shadow-none hover:bg-opacity-90"
            onClick={() => handleConsent(ConsentLevel.ALL)}
          >
            Accept All
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CookieConsentBanner;
