import { BookOpen, Zap, Clock, Target, Bell, Award, Trophy, HelpCircle } from 'lucide-react'; // Import HelpCircle

// Define the structure for an activity item
export interface ActivityItem {
  id: string;
  type: 'quiz_generated' | 'quiz_taken' | 'pomodoro_started' | 'flashcard_generated' | 'flashcard_studied' | 'notes_extracted' | 'achievement_earned' | 'level_reached';
  title: string;
  details?: string;
  icon: React.ElementType; // Use Lucide icon component type
  iconColor: string;
  timestamp: Date;
}

const MAX_ACTIVITIES = 20; // Limit the number of stored activities
const STORAGE_KEY = 'recent-activities';

type ActivityListener = (activities: ActivityItem[]) => void;
let listeners: ActivityListener[] = [];

// Function to get activities from localStorage
const getActivities = (): ActivityItem[] => {
  try {
    const storedActivities = localStorage.getItem(STORAGE_KEY);
    if (storedActivities) {
      const activities = JSON.parse(storedActivities);
      if (Array.isArray(activities)) {
        // Convert string timestamps back to Date objects and ensure icon mapping
        return activities.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
          icon: getActivityIcon(activity.type) // Map type back to icon component
        }));
      }
    }
  } catch (error) {
    console.error("Failed to load recent activities:", error);
  }
  return [];
};

// Function to save activities to localStorage
const saveActivities = (activities: ActivityItem[]) => {
  try {
    // Prepare for storage: remove icon component before stringifying
    const storableActivities = activities.map(({ icon, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storableActivities));
  } catch (error) {
    console.error("Failed to save recent activities:", error);
  }
};

// Function to notify listeners
const notifyListeners = (activities: ActivityItem[]) => {
  listeners.forEach(listener => listener(activities));
};

// Helper to get the correct icon component based on type
const getActivityIcon = (type: ActivityItem['type']): React.ElementType => {
  switch (type) {
    case 'quiz_generated': return BookOpen;
    case 'quiz_taken': return Zap;
    case 'pomodoro_started': return Clock;
    case 'flashcard_generated': return Target; // Using Target for now
    case 'flashcard_studied': return Target; // Using Target for now
    case 'notes_extracted': return Bell; // Using Bell for now
    case 'achievement_earned': return Award;
    case 'level_reached': return Trophy;
    default: return HelpCircle; // Use HelpCircle as default
  }
};

// Function to add a new activity
const addActivity = (
  type: ActivityItem['type'],
  title: string,
  details?: string,
) => {
  const activities = getActivities();

  // Define icon and color based on type - align with Dashboard colors
  let icon: React.ElementType;
  let iconColor: string;

  switch (type) {
    case 'quiz_generated':
      icon = BookOpen;
      iconColor = '#FF5C00'; // Orange
      break;
    case 'quiz_taken':
      icon = Zap;
      iconColor = '#FFC225'; // Yellow
      break;
    case 'pomodoro_started':
      icon = Clock;
      iconColor = '#20C997'; // Teal
      break;
    case 'flashcard_generated':
      icon = Target; // Reusing Target
      iconColor = '#9b87f5'; // Purple
      break;
    case 'flashcard_studied':
      icon = Target; // Reusing Target
      iconColor = '#7E69AB'; // Darker Purple
      break;
    case 'notes_extracted':
      icon = Bell; // Reusing Bell
      iconColor = '#00C6C2'; // Turquoise
      break;
    case 'achievement_earned':
      icon = Award;
      iconColor = '#FFC225'; // Yellow
      break;
    case 'level_reached':
      icon = Trophy;
      iconColor = '#FF5C00'; // Orange
      break;
    default:
      icon = HelpCircle; // Use HelpCircle as default
      iconColor = '#6c757d'; // Gray
  }


  const newActivity: ActivityItem = {
    id: crypto.randomUUID(), // Generate unique ID
    type,
    title,
    details,
    icon,
    iconColor,
    timestamp: new Date(),
  };

  // Add new activity and limit the list size
  const updatedActivities = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);

  saveActivities(updatedActivities);
  notifyListeners(updatedActivities); // Notify subscribers
};

// Function to subscribe to activity updates
const subscribe = (listener: ActivityListener) => {
  listeners.push(listener);
};

// Function to unsubscribe from activity updates
const unsubscribe = (listener: ActivityListener) => {
  listeners = listeners.filter(l => l !== listener);
};

export const activityService = {
  addActivity,
  getActivities,
  subscribe,
  unsubscribe,
};
