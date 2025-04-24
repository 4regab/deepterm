import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const ANNOUNCEMENT_KEY = "announcement-04-25-25-seen";

function AnnouncementPopup() {
  const [open, setOpen] = useState(false);
  const [hasVisitedBefore, setHasVisitedBefore] = useLocalStorage<boolean>("has-visited-before", false);
  const [hasSeenAnnouncement, setHasSeenAnnouncement] = useLocalStorage<boolean>(ANNOUNCEMENT_KEY, false);

  useEffect(() => {
    // Only show announcement if:
    // 1. User has visited before (returning user)
    // 2. User hasn't seen this specific announcement yet
    if (hasVisitedBefore && !hasSeenAnnouncement) {
      setOpen(true);
    }

    // Mark that user has visited the site
    if (!hasVisitedBefore) {
      setHasVisitedBefore(true);
    }
  }, [hasVisitedBefore, hasSeenAnnouncement, setHasVisitedBefore]);

  const handleClose = () => {
    setOpen(false);
    setHasSeenAnnouncement(true);
  };

  const visitKofi = () => {
    window.open("https://ko-fi.com/deepterm", "_blank");
    handleClose();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-[330px] sm:max-w-md md:max-w-lg p-4 sm:p-6">
        <DialogHeader className="p-0 sm:p-1">
          <DialogTitle className="text-lg sm:text-xl font-bold text-center">
            DeepTerm Update
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-2 sm:space-y-3 py-2 sm:py-4 text-left mt-2">
          <p className="text-xs sm:text-sm">
            Hello everyone!
          </p>
          <p className="text-xs sm:text-sm">
            I'm happy to announce that since our launch last week, DeepTerm has gained 5,000+ users worldwide. Thank you all for your incredible support!
          </p>
          <p className="text-xs sm:text-sm">
            Today, I've implemented several improvements to address bugs and enhance performance.
          </p>
          <div className="text-xs sm:text-sm flex flex-wrap items-center">
            <span>For feature requests, bug reports, or donations, visit:</span>
            <Button 
              variant="link" 
              className="px-1 py-0 h-auto text-primary text-xs sm:text-sm" 
              onClick={visitKofi}
            >
              ko-fi.com/deepterm
              <ExternalLink className="ml-1 h-2 w-2 sm:h-3 sm:w-3" />
            </Button>
          </div>
          <p className="text-xs sm:text-sm">
            Vote on the poll or comment what feature you want to see!
          </p>
          <p className="text-[10px] sm:text-xs text-right text-muted-foreground mt-1 sm:mt-2">
            04-25-25
          </p>
        </DialogDescription>
        <DialogFooter className="sm:justify-center mt-1 sm:mt-2">
          <Button onClick={handleClose} className="w-full h-8 sm:h-9 text-xs sm:text-sm sm:w-auto">
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AnnouncementPopup;
