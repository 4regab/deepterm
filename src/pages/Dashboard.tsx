import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { usePomodoroContext } from '@/hooks/usePomodoroContext';
import { useUserProfile } from '@/context/UserProfileContext'; // Import useUserProfile only
import { ACHIEVEMENT_BADGES, UserAchievement } from '@/context/userProfileConstants'; // Import ACHIEVEMENT_BADGES from the correct source
import { useFlashcard } from '@/context/FlashcardContextDefinition'; // Import useFlashcard
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Import DialogClose
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar as CalendarIcon, Award, User, ChevronRight, Clock, Target, Camera, ChevronLeft, ChevronRight as ChevronRightIcon, Bell, Activity, Zap, FileText, Layers, BrainCircuit, Download, KeyRound, Settings, X } from "lucide-react"; // Added Settings and X icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { toast } from "sonner";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatDistanceToNow } from 'date-fns'; // Import date-fns utility for relative time
import { exportAsPDF } from '@/utils/fileUtils';
import { ExtractionResult } from '@/types';
import ApiKeyInput from '@/components/shared/ApiKeyInput';

// New interface for study calendar
interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  studyTime: number; // Time in seconds
  isToday: boolean;
}

// Storage keys
const RESULTS_STORAGE_KEY = 'extraction_results';

const Dashboard = () => {
  const { studyStreak, studySessions, totalStudyTimeToday, formatDuration } = usePomodoroContext();
  const { 
    userProfile, 
    updateUserName, 
    updateBestStreak, 
    getTimeBasedGreeting, 
    getUserLevel,
    getLevelProgress,
    markFirstVisitComplete,
    updateProfilePicture, // Get the update function
    checkAndUpdateAchievement // Get the function to check and update achievements
  } = useUserProfile();
  const { savedDecks: savedFlashcardDecks } = useFlashcard(); // Get saved flashcard decks
  
  const [showNameDialog, setShowNameDialog] = useState<boolean>(userProfile.firstVisit);
  const [name, setName] = useState(userProfile.name);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateHoursMap, setDateHoursMap] = useState<Map<string, number>>(new Map());
  const [extractionResults, setExtractionResults] = useState<ExtractionResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<{day: CalendarDay, x: number, y: number} | null>(null);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[][]>([]);
  // State for Settings Dialog
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  // State for editing name in settings
  const [editableName, setEditableName] = useState(userProfile.name);

  // Update editableName when userProfile.name changes (e.g., after initial welcome dialog)
  useEffect(() => {
    setEditableName(userProfile.name);
  }, [userProfile.name]);

  // Function to get achievement progress
  const getAchievementProgress = (achievementId: string): { progress: number, total: number, earned: boolean } => {
    const userAchievement = userProfile.achievements.find(a => a.id === achievementId);
    const badgeDefinition = ACHIEVEMENT_BADGES.find(b => b.id === achievementId);

    if (!badgeDefinition) {
      // Should not happen if IDs are correct
      return { progress: 0, total: 1, earned: false }; 
    }

    if (userAchievement) {
      return {
        progress: userAchievement.progress ?? 0,
        total: userAchievement.total ?? badgeDefinition.total ?? 1, // Use definition total as fallback
        earned: userAchievement.earned
      };
    }

    // If user hasn't made progress on this achievement yet
    return {
      progress: 0,
      total: badgeDefinition.total ?? 1, // Use definition total
      earned: false
    };
  };

  // Function to handle saving the name from the settings dialog
  const handleSaveName = () => {
    if (editableName.trim()) {
      updateUserName(editableName.trim());
      toast.success("Name updated successfully!");
    } else {
      toast.error("Name cannot be empty.");
    }
  };

  // Calculate achievement stats
  const achievementStats = React.useMemo(() => {
    const total = ACHIEVEMENT_BADGES.length;
    const earned = userProfile.achievements.filter(a => a.earned).length;
    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
    return { total, earned, percentage };
  }, [userProfile.achievements]);

  // Calculate study hours for each date
  useEffect(() => {
    const dateMap = new Map<string, number>();
    
    studySessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const dateKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
      
      const existingHours = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, existingHours + session.duration);
    });
    
    setDateHoursMap(dateMap);
  }, [studySessions]);
  
  // Load extraction results from localStorage
  useEffect(() => {
    try {
      const savedResults = localStorage.getItem(RESULTS_STORAGE_KEY);
      if (savedResults) {
        const results = JSON.parse(savedResults);
        setExtractionResults(Array.isArray(results) ? results : []);
      }
    } catch (error) {
      console.error("Failed to load extraction results:", error);
    }
  }, []);
  
  // Update best streak if current streak is higher
  useEffect(() => {
    if (studyStreak > userProfile.bestStreak) {
      updateBestStreak(studyStreak);
    }
  }, [studyStreak, userProfile.bestStreak, updateBestStreak]);

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get previous month's days to fill first week
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    const today = new Date();
    const isCurrentMonthCurrent = 
      today.getMonth() === month &&
      today.getFullYear() === year;
      
    // Generate calendar data structure
    const days: CalendarDay[] = [];
    
    // Add previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      days.push({
        date: day,
        isCurrentMonth: false,
        studyTime: dateHoursMap.get(dateKey) || 0,
        isToday: false
      });
    }
    
    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      days.push({
        date: day,
        isCurrentMonth: true,
        studyTime: dateHoursMap.get(dateKey) || 0,
        isToday: isCurrentMonthCurrent && today.getDate() === day
      });
    }
    
    // Add next month days to complete the grid
    const totalDaysNeeded = 42; // Always show 6 rows
    let nextMonthDay = 1;
    while (days.length < totalDaysNeeded) {
      const date = new Date(year, month + 1, nextMonthDay);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate())}`;
      
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        studyTime: dateHoursMap.get(dateKey) || 0,
        isToday: false
      });
      nextMonthDay++;
    }
    
    // Split into weeks for grid display
    const calendarRows: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      calendarRows.push(days.slice(i, i + 7));
    }
    
    setCalendarDays(calendarRows);
  }, [currentDate, dateHoursMap]);

  // Check for pomodoro-related achievements
  useEffect(() => {
    // Check study streak achievements
    checkAndUpdateAchievement('first-timer', studyStreak >= 1, studyStreak, 1);
    checkAndUpdateAchievement('daily-dedication', studyStreak >= 3, studyStreak, 3);
    checkAndUpdateAchievement('study-streak', studyStreak >= 5, studyStreak, 5);
    checkAndUpdateAchievement('weekly-warrior', studyStreak >= 7, studyStreak, 7);
    checkAndUpdateAchievement('time-manager', studyStreak >= 10, studyStreak, 10);
    checkAndUpdateAchievement('consistency-king', studyStreak >= 14, studyStreak, 14);
    checkAndUpdateAchievement('study-stamina', studyStreak >= 30, studyStreak, 30);
    checkAndUpdateAchievement('study-champion', studyStreak >= 90, studyStreak, 90);
    checkAndUpdateAchievement('study-icon', studyStreak >= 365, studyStreak, 365);

    // Check for time-based achievements (total study time)
    const totalStudySeconds = studySessions.reduce((total, session) => total + session.duration, 0);
    const totalStudyHours = totalStudySeconds / 3600;
    checkAndUpdateAchievement('study-hour-hero', totalStudyHours >= 5, totalStudyHours, 5);
    checkAndUpdateAchievement('study-marathoner', totalStudyHours >= 20, totalStudyHours, 20);
    checkAndUpdateAchievement('study-hour-champion', totalStudyHours >= 50, totalStudyHours, 50);
    
    // Check session counts
    const sessionCount = studySessions.length;
    checkAndUpdateAchievement('milestone-reacher', sessionCount >= 25, sessionCount, 25);
    checkAndUpdateAchievement('productivity-star', sessionCount >= 50, sessionCount, 50);
    
    // Check for time-of-day achievements
    const morningSessionExists = studySessions.some(session => {
      const sessionHour = new Date(session.date).getHours();
      return sessionHour < 9;
    });
    checkAndUpdateAchievement('morning-glory', morningSessionExists, morningSessionExists ? 1 : 0, 1);
    
    const veryEarlySessionExists = studySessions.some(session => {
      const sessionHour = new Date(session.date).getHours();
      return sessionHour < 7;
    });
    checkAndUpdateAchievement('early-riser', veryEarlySessionExists, veryEarlySessionExists ? 1 : 0, 1);
    
    const eveningSessionExists = studySessions.some(session => {
      const sessionHour = new Date(session.date).getHours();
      return sessionHour >= 19;
    });
    checkAndUpdateAchievement('night-scholar', eveningSessionExists, eveningSessionExists ? 1 : 0, 1);
    
    const lateNightSessionExists = studySessions.some(session => {
      const sessionHour = new Date(session.date).getHours();
      return sessionHour >= 22;
    });
    checkAndUpdateAchievement('night-owl', lateNightSessionExists, lateNightSessionExists ? 1 : 0, 1);
    
    // Check sessions per day
    const sessionsByDay = new Map<string, number>();
    studySessions.forEach(session => {
      const dateKey = new Date(session.date).toISOString().split('T')[0];
      const count = sessionsByDay.get(dateKey) || 0;
      sessionsByDay.set(dateKey, count + 1);
    });
    
    const maxSessionsInDay = Math.max(...Array.from(sessionsByDay.values(), count => count || 0));
    checkAndUpdateAchievement('focus-ninja', maxSessionsInDay >= 3, maxSessionsInDay, 3);
    checkAndUpdateAchievement('study-sprint', maxSessionsInDay >= 5, maxSessionsInDay, 5);
    checkAndUpdateAchievement('focus-master', maxSessionsInDay >= 7, maxSessionsInDay, 7);
    
  }, [studyStreak, studySessions, userProfile.achievements, checkAndUpdateAchievement]);

  // Check for flashcard-related achievements and data
  useEffect(() => {
    if (!savedFlashcardDecks || savedFlashcardDecks.length === 0) return;
    
    // The FlashcardContext handles tracking achievements when actions are performed,
    // but we can refresh the dashboard to show the latest achievements.
    const flashcardCount = savedFlashcardDecks.length;

    if (flashcardCount > 0) {
      const hasBeginner = userProfile.achievements.some(a => a.id === "flashcard-beginner" && a.earned);
      if (!hasBeginner) {
        console.log("Flashcard achievements may need updating");
      }
    }
  }, [savedFlashcardDecks, userProfile.achievements, checkAndUpdateAchievement]);

  // Function to handle name submission
  const handleNameSubmit = () => {
    if (name.trim()) {
      updateUserName(name.trim());
      markFirstVisitComplete();
      setShowNameDialog(false);
      toast.success(`Welcome to your dashboard, ${name.trim()}!`);
    } else {
      toast.error("Please enter your name");
    }
  };
  
  // Function to handle profile picture upload
  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Basic validation for image size (e.g., max 2MB)
        if (result.length > 2 * 1024 * 1024) {
          toast.error("Image size too large. Please upload an image smaller than 2MB.");
          return;
        }
        updateProfilePicture(result);
        toast.success("Profile picture updated!");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file.");
      };
      // Basic validation for image type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type. Please upload an image (JPEG, PNG, GIF, etc.).");
        return;
      }
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = "";
    }
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Format study time for tooltip display
  const formatStudyTime = (seconds: number): string => {
    if (seconds === 0) return "No study time";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m studied` : `${hours}h studied`;
    } else {
      return `${minutes}m studied`;
    }
  };

  // Function to get hours studied for a specific date
  const getHoursForDate = (date: Date): number => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return dateHoursMap.get(dateKey) || 0;
  };

  // Function to handle downloading an extraction result as PDF
  const handleExtractionDownload = (result: ExtractionResult) => {
    try {
      exportAsPDF(result);
      toast.success("PDF download started.");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  // Get level progress
  const levelProgress = getLevelProgress();
  const currentLevel = getUserLevel();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F9FA] pb-16">
        {/* Welcome name dialog for first visitors */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-[425px] neo-border shadow-neo bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Welcome!</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name" className="font-semibold text-lg">What should we call you?</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 neo-border shadow-neo"
                placeholder="Enter your name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSubmit();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleNameSubmit}
              className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Continue
            </Button>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="sm:max-w-lg neo-border shadow-neo bg-white p-0">
            <DialogHeader className="border-b-2 border-black p-4">
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Settings className="h-6 w-6" /> Settings
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="profile" className="w-full p-4 pt-2">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 neo-border shadow-neo-inset">
                <TabsTrigger value="profile" className="font-semibold data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:shadow-neo-sm">Profile</TabsTrigger>
                <TabsTrigger value="api-key" className="font-semibold data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white data-[state=active]:shadow-neo-sm">API Key</TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <div className="space-y-4">
                  <Label htmlFor="profileName" className="font-semibold text-md block mb-1">Display Name</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="profileName"
                      value={editableName}
                      onChange={(e) => setEditableName(e.target.value)}
                      className="flex-grow neo-border shadow-neo-sm"
                      placeholder="Enter your name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSaveName}
                      size="sm"
                      className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="api-key">
                <ApiKeyInput onApiKeySubmit={() => toast.success("API Key saved!")} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Neobrutalist Player Stats */}
        <div className="bg-[#9b87f5] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="container mx-auto px-4 py-6 relative"> {/* Added relative positioning */}
            {/* Settings Button - Top Right */}
            <Button 
              variant="outline"
              size="icon"
              onClick={() => setShowSettingsDialog(true)}
              className="absolute top-4 right-4 bg-white text-black neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <div className="flex flex-col gap-4">
              {/* Player info and welcome */}
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Profile Picture Area */}
                <div className="relative group h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-4xl md:text-5xl font-black overflow-hidden">
                  {userProfile.profilePicture ? (
                    <img 
                      src={userProfile.profilePicture} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                  {/* Upload Button Overlay */}
                  <button 
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer rounded-full"
                    aria-label="Upload profile picture"
                  >
                    <Camera className="h-8 w-8" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePictureUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                
                {/* Rest of the player info */}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
                    {getTimeBasedGreeting()}, <span className="text-black">{userProfile.name || 'USER'}</span>!
                  </h1>
                  
                  <div className="flex flex-wrap gap-3 my-2">
                    <span className="inline-block bg-[#FFC225] text-black font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      LEVEL {userProfile.level}
                    </span>
                    <span className="inline-block bg-white text-black font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {currentLevel.title}
                    </span>
                    <span className="inline-block bg-[#FF5C00] text-white font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {userProfile.xp} XP
                    </span>
                  </div>

                  <div className="mt-3 bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between text-xs font-bold mb-1 px-1">
                      <span>NEXT LEVEL: {levelProgress.current}/{levelProgress.required} XP</span>
                      <span>{levelProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-6 border-2 border-black relative overflow-hidden">
                      {/* Main XP progress bar */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-[#20C997] flex items-center justify-end pr-1 transition-all duration-500" 
                        style={{ 
                          width: `${levelProgress.percentage - levelProgress.minuteProgress}%`,
                          animation: "pulse 2s infinite"
                        }}
                      >
                        {levelProgress.percentage > 15 && (
                          <span className="text-xs text-white font-bold">
                            {levelProgress.current} XP
                          </span>
                        )}
                      </div>
                      
                      {/* Minute-based progress extension */}
                      {userProfile.minutesStudied > 0 && (
                        <div 
                          className="absolute top-0 h-full bg-[#5ED0B0] border-l border-black transition-all duration-300 flex items-center justify-center"
                          style={{ 
                            left: `${levelProgress.percentage - levelProgress.minuteProgress}%`,
                            width: `${levelProgress.minuteProgress}%`,
                            minWidth: '10px'
                          }}
                        >
                          {levelProgress.minuteProgress > 2 && (
                            <span className="text-xs text-black font-bold px-1">
                              +{userProfile.minutesStudied}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Minutes studied tooltip */}
                    {userProfile.minutesStudied > 0 && (
                      <div className="mt-1 text-xs text-gray-600 italic flex justify-end">
                        <span className="bg-[#5ED0B0] text-black px-1 rounded">
                          {userProfile.minutesStudied} minutes studied ≈ {(levelProgress.minuteProgress).toFixed(1)}% progress
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition hover:-translate-y-1">
                  <div className="text-xs font-black uppercase">Today's Study</div>
                  <div className="text-2xl md:text-3xl font-black">{formatDuration(totalStudyTimeToday)}</div>
                  {totalStudyTimeToday > 0 && (
                    <div className="mt-2 flex justify-between items-center text-xs">
                      <span>Minutes earned:</span>
                      <span className="font-bold">{Math.floor(totalStudyTimeToday / 60)}m</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-[#FFC225] border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition hover:-translate-y-1">
                  <div className="text-xs font-black uppercase">Current Streak</div>
                  <div className="text-2xl md:text-3xl font-black">{studyStreak} days</div>
                </div>
                
                <div className="bg-[#20C997] border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition hover:-translate-y-1">
                  <div className="text-xs font-black uppercase">Best Streak</div>
                  <div className="text-2xl md:text-3xl font-black">{userProfile.bestStreak} days</div>
                </div>
                
                <div className="bg-[#FF5C00] border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition hover:-translate-y-1">
                  <div className="text-xs font-black uppercase">Sessions</div>
                  <div className="text-2xl md:text-3xl font-black">{studySessions.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main dashboard content */}
        <div className="container mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left column - Recent Achievements */}
            <div className="lg:col-span-1 space-y-6">

              {/* Recent Achievements Section */}
              <section id="study-files-section" className="scroll-mt-16">
                <Card className="neo-border shadow-neo bg-white">
                  <CardHeader className="bg-[#FFC225] pb-2">
                    <CardTitle className="text-xl font-black flex items-center gap-2 text-[#1a1a1a]">
                      <Award className="h-5 w-5 text-[#1a1a1a]" />
                      Recent Achievements
                    </CardTitle>
                    <CardDescription>
                      Your latest accomplishments and milestones
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {userProfile.achievements.filter(a => a.earned).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Award className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500 mb-2">No Achievements Yet</h3>
                        <p className="text-gray-400 mb-6 max-w-md">
                          Keep studying and completing activities to earn achievements and track your progress
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Recent achievements - show only 3 most recent earned achievements */}
                        {userProfile.achievements
                          .filter(a => a.earned)
                          .sort((a, b) => (new Date(b.dateEarned ?? 0).getTime()) - (new Date(a.dateEarned ?? 0).getTime()))
                          .slice(0, 3)
                          .map((achievement) => {
                            // Find the badge details from the constant badges array
                            const badgeDetails = ACHIEVEMENT_BADGES.find(b => b.id === achievement.id);
                            
                            if (!badgeDetails) return null; // Skip if no details found
                            
                            const isEarned = true;
                            const iconColor = "";

                            return (
                              <div 
                                key={achievement.id}
                                className="p-4 border-3 border-black bg-white rounded-lg shadow-neo-sm hover:shadow-neo transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`text-3xl ${isEarned ? '' : iconColor}`}>{badgeDetails.icon}</span>
                                  <div>
                                    <h4 className="font-bold text-base text-black">{badgeDetails.name}</h4>
                                    <p className="text-xs text-gray-600">{badgeDetails.description}</p>
                                    {achievement.dateEarned && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        Earned {formatDistanceToNow(new Date(achievement.dateEarned), { addSuffix: true })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>
            
            {/* Middle and right columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Redesigned Calendar Card with neobrutalism style */}
              <Card className="neo-border shadow-neo bg-white hover:shadow-neo-lg hover:-translate-y-1 transition-transform duration-200">
                <CardHeader className="bg-[#FFC225] neo-border-b pb-2">
                  <CardTitle className="text-xl font-black flex items-center gap-2 text-[#1a1a1a]">
                    <CalendarIcon className="h-5 w-5 text-[#1a1a1a]" />
                    Study History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Month and Year Header */}
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={goToPreviousMonth} 
                      className="bg-white hover:bg-[#FFF8E0] neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] w-8 h-8 flex items-center justify-center transition-all"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-[#1a1a1a] font-bold text-xl">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button 
                      onClick={goToNextMonth} 
                      className="bg-white hover:bg-[#FFF8E0] neo-border shadow-neo-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] w-8 h-8 flex items-center justify-center transition-all"
                      aria-label="Next month"
                    >
                      <ChevronRightIcon size={18} />
                    </button>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="neo-border overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 bg-[#FFF8E0]">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-[#1a1a1a] text-center text-xs py-2 font-bold border-r-2 border-[#1a1a1a] last:border-r-0">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    {calendarDays.map((week, weekIndex) => (
                      <div 
                        key={`week-${weekIndex}`} 
                        className="grid grid-cols-7 border-t-2 border-[#1a1a1a]"
                      >
                        {week.map((day, dayIndex) => {
                          // Determine cell styling based on study time and current month
                          const isHighlighted = day.isCurrentMonth && day.studyTime > 0;
                          
                          // Get color intensity based on study time - using shades of yellow/orange
                          let bgColor = "bg-white";
                          const borderClass = "border-r-2 border-[#1a1a1a] last:border-r-0";
                          
                          if (day.isCurrentMonth) {
                            if (day.studyTime > 0) {
                              if (day.studyTime > 7200) { // more than 2 hours
                                bgColor = "bg-[#FF5C00]"; // Orange
                              } else if (day.studyTime > 3600) { // more than 1 hour
                                bgColor = "bg-[#FF8A3D]"; // Medium Orange
                              } else if (day.studyTime > 1800) { // more than 30 min
                                bgColor = "bg-[#FFA726]"; // Light Orange
                              } else {
                                bgColor = "bg-[#FFC225]"; // Yellow
                              }
                            }
                          } else {
                            bgColor = "bg-[#f5f5f5]"; // Light gray for previous/next month days
                          }
                          
                          // Determine text color
                          const textColor = day.isCurrentMonth ? "text-[#1a1a1a]" : "text-gray-400";
                          
                          // Today's date styling
                          const todayClass = day.isToday ? "ring-[3px] ring-inset ring-[#FF5C00]" : "";
                          
                          return (
                            <div 
                              key={`day-${weekIndex}-${dayIndex}`}
                              className={`relative h-12 sm:h-14 flex items-center justify-center ${bgColor} ${textColor} ${todayClass} ${borderClass} cursor-default hover:bg-opacity-80 transition-colors group`}
                              onMouseEnter={(e) => {
                                setHoveredDay({
                                  day: day,
                                  x: e.clientX,
                                  y: e.clientY
                                });
                              }}
                              onMouseLeave={() => setHoveredDay(null)}
                              onTouchStart={(e) => {
                                // For mobile devices
                                const touch = e.touches[0];
                                setHoveredDay({
                                  day: day,
                                  x: touch.clientX,
                                  y: touch.clientY
                                });
                                // Auto-hide tooltip after 2 seconds on mobile
                                setTimeout(() => setHoveredDay(null), 2000);
                              }}
                            >
                              <div className="relative w-full h-full flex flex-col items-center justify-center">
                                <span className={`text-sm ${day.isToday ? 'font-bold' : ''}`}>{day.date}</span>
                                {day.studyTime > 0 && day.isCurrentMonth && (
                                  <div className="w-3 h-3 rounded-full bg-[#00C6C2] neo-border absolute bottom-1 left-1/2 transform -translate-x-1/2"></div>
                                )}
                                
                                {/* Inline tooltip that shows on hover for smaller screens */}
                                <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 transform -translate-x-1/2 bg-white border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap pointer-events-none text-xs font-bold z-10 transition-opacity sm:hidden">
                                  {formatStudyTime(day.studyTime)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  
                  {/* Study time tooltip with neobrutalist design - shown for larger screens */}
                  {hoveredDay && (
                    <div 
                      className="fixed z-50 bg-white text-[#1a1a1a] px-4 py-2 rounded-md border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pointer-events-none hidden sm:block"
                      style={{ 
                        left: hoveredDay.x + 10, 
                        top: hoveredDay.y - 40
                      }}
                    >
                      <span className="font-bold">
                        {new Date(currentDate.getFullYear(), currentDate.getMonth(), hoveredDay.day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <div className={`mt-1 ${hoveredDay.day.studyTime > 0 ? 'text-[#FF5C00] font-bold' : 'text-gray-500'}`}>
                        {formatStudyTime(hoveredDay.day.studyTime)}
                      </div>
                    </div>
                  )}
                  
                  {/* Direct display of hovered day study time - always visible when hovering */}
                  {hoveredDay && (
                    <div className="mt-2 py-1 px-3 bg-[#FFF8E0] border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="font-black">
                        {new Date(currentDate.getFullYear(), currentDate.getMonth(), hoveredDay.day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}:
                      </span>
                      <span className={`ml-2 ${hoveredDay.day.studyTime > 0 ? 'text-[#FF5C00] font-bold' : 'text-gray-500'}`}>
                        {formatStudyTime(hoveredDay.day.studyTime)}
                      </span>
                    </div>
                  )}
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center mt-4 gap-3">
                    <span className="text-xs font-bold text-[#1a1a1a]">Less</span>
                    <div className="flex gap-1">
                      <div className="w-5 h-5 neo-border bg-[#FFC225]"></div>
                      <div className="w-5 h-5 neo-border bg-[#FFA726]"></div>
                      <div className="w-5 h-5 neo-border bg-[#FF8A3D]"></div>
                      <div className="w-5 h-5 neo-border bg-[#FF5C00]"></div>
                    </div>
                    <span className="text-xs font-bold text-[#1a1a1a]">More</span>
                  </div>

                  {/* Mobile-friendly hint */}
                  <div className="text-center mt-2 text-xs text-gray-500 sm:hidden">
                    Tap on days to see study time
                  </div>
                </CardContent>
              </Card>
              
            </div>
          </div>
          
          {/* Additional sections below the grid */}
          <div className="mt-8 space-y-8">
            
            {/* All achievements section - RESTORED */}
            <section id="achievements-section" className="scroll-mt-16">
              <Card className="neo-border shadow-neo bg-white overflow-hidden">
                <CardHeader className="bg-[#FFC225] neo-border-b pb-2">
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-black" />
                    All Achievements ({achievementStats.earned}/{achievementStats.total})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-black text-lg">Overall Progress</h3>
                      <span className="font-bold text-lg bg-black text-white px-3 py-1">{achievementStats.percentage}%</span>
                    </div>
                    <div className="w-full h-8 border-3 border-black relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF5C00] via-[#FFC225] to-[#20C997] flex items-center justify-end pr-2"
                        style={{ width: `${achievementStats.percentage}%` }}
                      >
                        <span className="text-sm font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                          {achievementStats.earned}/{achievementStats.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calculate achievements closest to completion */}
                  {(() => {
                    // First get all unearned achievements and calculate their progress percentage
                    const unearnedAchievements = ACHIEVEMENT_BADGES.filter(a => !getAchievementProgress(a.id).earned)
                      .map(achievement => {
                        const progress = getAchievementProgress(achievement.id);
                        const progressPercentage = (progress.progress / progress.total) * 100;
                        return { ...achievement, progress, progressPercentage };
                      });
                    
                    // Sort by progress percentage (closest to completion first)
                    const sortedAchievements = [...unearnedAchievements]
                      .sort((a, b) => b.progressPercentage - a.progressPercentage);
                    
                    // Get top achievements closest to completion (up to 6)
                    const closestToCompletion = sortedAchievements.slice(0, 6);
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {closestToCompletion.map((achievement) => {
                            const { progress } = achievement;
                            const progressPercentage = (progress.progress / progress.total) * 100;
                            
                            // Define styles based on progress percentage
                            let bgColor = "bg-white";
                            let borderColor = "border-black";
                            const textColor = "text-black"; // Changed let to const
                            let iconBg = "bg-[#f5f5f5]";
                            let progressBarFill = "bg-[#9b87f5]";
                            
                            if (progressPercentage >= 75) {
                              bgColor = "bg-[#FFEDCC]"; // Very light orange/yellow
                              borderColor = "border-[#FF5C00]";
                              progressBarFill = "bg-[#FF5C00]"; // Orange
                              iconBg = "bg-[#FFC225]"; // Yellow
                            } else if (progressPercentage >= 50) {
                              bgColor = "bg-[#F0EDFF]"; // Very light purple
                              progressBarFill = "bg-[#9b87f5]"; // Purple
                              iconBg = "bg-[#e0dbff]"; // Lighter purple
                            } else if (progressPercentage >= 25) {
                              bgColor = "bg-[#E5F7ED]"; // Very light teal
                              progressBarFill = "bg-[#20C997]"; // Teal
                              iconBg = "bg-[#d0f2e5]"; // Lighter teal
                            }

                            return (
                              <div 
                                key={achievement.id}
                                className={`p-3 rounded-lg border-2 ${borderColor} ${bgColor} shadow-neo-sm transform transition hover:scale-[1.02] cursor-pointer`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-12 h-12 ${iconBg} border-2 border-black rounded-full flex items-center justify-center text-2xl`}>
                                    {achievement.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-black text-sm sm:text-base">{achievement.name}</h4>
                                    <p className="text-xs text-gray-600 line-clamp-1">{achievement.criteria}</p>
                                  </div>
                                </div>
                                
                                <div className="w-full h-4 bg-white border-2 border-black relative mb-1 overflow-hidden">
                                  <div 
                                    className={`absolute top-0 left-0 h-full ${progressBarFill}`}
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                                
                                <div className="flex justify-between text-xs font-bold">
                                  <span>{Math.round(progressPercentage)}% Complete</span>
                                  <span>{progress.progress}/{progress.total}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          <div className="bg-[#9b87f5] border-3 border-black col-span-full p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-black text-white text-center text-lg mb-2">WANT TO SEE ALL {ACHIEVEMENT_BADGES.length} ACHIEVEMENTS?</h3>
                            <div className="flex justify-center">
                              <Button 
                                className="px-8 py-6 bg-white text-black font-black border-3 border-black hover:bg-[#FFC225] transition-colors duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                                onClick={() => {
                                  const fullList = document.getElementById('all-achievements-list');
                                  if (fullList) {
                                    // Toggle display between 'block' and 'none'
                                    const newDisplay = fullList.style.display === 'block' ? 'none' : 'block';
                                    fullList.style.display = newDisplay;
                                    
                                    // If showing, scroll to it
                                    if (newDisplay === 'block') {
                                      fullList.scrollIntoView({ behavior: 'smooth' });
                                    } else {
                                      // If hiding, scroll back to the main achievements section
                                      document.getElementById('achievements-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  <span className="mr-2">
                                    {document.getElementById('all-achievements-list')?.style.display === 'block' 
                                      ? 'HIDE ACHIEVEMENTS' 
                                      : 'SHOW ALL ACHIEVEMENTS'}
                                  </span>
                                  <ChevronRight className="h-6 w-6" />
                                </div>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Full achievement list (initially hidden) */}
                  <div id="all-achievements-list" className="mt-12 pt-8 border-t-3 border-dashed border-gray-300" style={{ display: 'none' }}>
                    <h3 className="font-black text-2xl mb-6 flex items-center gap-2">
                      <Trophy className="h-7 w-7 text-[#FF5C00]" /> 
                      Complete Achievements List
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ACHIEVEMENT_BADGES.map((achievement) => {
                        const progressData = getAchievementProgress(achievement.id);
                        const isEarned = progressData.earned;
                        const progressPercentage = (progressData.progress / progressData.total) * 100;
                        
                        // Define colors and styles based on earned status and progress
                        const bgColor = isEarned ? "bg-[#FFF8E0]" : "bg-white"; 
                        const borderColor = isEarned ? "border-[#FFC225]" : "border-gray-300";
                        const headerBg = isEarned ? "bg-[#FFC225]" : "bg-gray-100";
                        const shadowColor = isEarned ? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "shadow-md";
                        const iconColor = isEarned ? "" : "opacity-50 grayscale";

                        return (
                          <Card key={achievement.id} className={`neo-border ${borderColor} ${shadowColor} hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 overflow-hidden ${isEarned ? 'border-3' : 'border-2'}`}>
                            <CardHeader className={`p-3 ${headerBg} neo-border-b ${borderColor}`}>
                              <div className="flex items-center gap-2">
                                <span className={`text-3xl ${iconColor}`}>{achievement.icon}</span>
                                <CardTitle className="text-sm font-bold text-black">{achievement.name}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className={`p-3 ${bgColor}`}>
                              <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                              <div className="text-xs font-medium text-gray-600 mb-1">{achievement.criteria}</div>
                              <div className="w-full h-3 bg-gray-100 border border-gray-300 relative">
                                <div 
                                  className={`absolute top-0 left-0 h-full ${isEarned ? 'bg-[#FFC225]' : 'bg-[#9b87f5]'}`}
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-end mt-1">
                                <span className="text-xs font-bold">{progressData.progress} / {progressData.total}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
            
            {/* Study tips section */}
            <section>
              <Card className="neo-border shadow-neo bg-white">
                <CardHeader className="bg-[#E5F7ED] pb-2">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Target className="h-6 w-6 text-[#20C997]" />
                    Study Tips
                  </CardTitle>
                  <CardDescription>
                    Maximize your learning potential with these study strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#E5F7ED] rounded-lg">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Pomodoro Technique
                      </h3>
                      <p className="text-sm">Work for 25 minutes, then take a 5-minute break. After 4 pomodoros, take a longer 15-30 minute break.</p>
                    </div>
                    <div className="p-4 bg-[#F0EDFF] rounded-lg">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Spaced Repetition
                      </h3>
                      <p className="text-sm">Review material at gradually increasing intervals to improve long-term retention.</p>
                    </div>
                    <div className="p-4 bg-[#FFF8E0] rounded-lg">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4" /> Active Recall
                      </h3>
                      <p className="text-sm">Test yourself frequently instead of just re-reading notes. Use our quiz feature to practice!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Dashboard;
