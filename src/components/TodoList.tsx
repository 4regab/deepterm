import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, Trash2, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ListTodo } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile"; // Import the useUserProfile hook

type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

interface TodoListProps {
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ onVisibilityChange }) => {
  // Use the user profile context to track task completion
  const { trackTaskCompleted, trackTaskCreated } = useUserProfile();
  
  // Get todos from localStorage or use empty array as default
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const savedTodos = localStorage.getItem('pomodoro-todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  
  const [newTodoText, setNewTodoText] = useState("");
  const [isMinimized, setIsMinimized] = useState(() => {
    const savedState = localStorage.getItem('pomodoro-todos-minimized');
    // Default to minimized (true) if not set
    return savedState ? JSON.parse(savedState) : true;
  });
  
  const isMobile = useIsMobile();
  
  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pomodoro-todos', JSON.stringify(todos));
  }, [todos]);

  // Save minimized state whenever it changes
  useEffect(() => {
    localStorage.setItem('pomodoro-todos-minimized', JSON.stringify(isMinimized));
    // Notify parent component about visibility change
    if (onVisibilityChange) {
      onVisibilityChange(!isMinimized);
    }
  }, [isMinimized, onVisibilityChange]);
  // Initialize the parent component with the correct visibility on mount
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(!isMinimized);
    }
  }, [isMinimized, onVisibilityChange]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim() === "") return;
    
    const newTodo: TodoItem = {
      id: Date.now(),
      text: newTodoText.trim(),
      completed: false
    };
    
    setTodos([...todos, newTodo]);
    setNewTodoText("");
    
    // Track that a new task was created
    trackTaskCreated();
  };

  const toggleTodo = (id: number) => {
    let taskCompleted = false;
    let taskText = '';
    
    setTodos(
      todos.map(todo => {
        if (todo.id === id) {
          // If the task is being completed (not uncompleted)
          if (!todo.completed) {
            taskCompleted = true;
            taskText = todo.text;
          }
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      })
    );
    
    // Track task completion in the profile system
    if (taskCompleted && taskText) {
      trackTaskCompleted(taskText);
    }
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // If todolist is minimized, render a compact button
  if (isMinimized) {
    // Apply fixed positioning only on mobile
    const mobileFixedClasses = isMobile ? "fixed bottom-4 right-4 z-[9999]" : "w-full";
    const mobileJustify = isMobile ? "justify-end" : "justify-start";

    return (
      <div className={`flex ${mobileJustify} h-full`}>
        <Button
          variant="outline"
          onClick={() => setIsMinimized(false)}
          className={`neo-border shadow-neo bg-white hover:bg-gray-50 transition-colors py-3 sm:py-4 px-3 min-h-[44px] touch-target ${mobileFixedClasses}`}
          aria-label="Expand task list"
        >
          <div className="flex flex-row items-center gap-1.5 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[#FFC225] neo-border flex-shrink-0">
              <ListTodo className="h-3 w-3 sm:h-4 sm:w-4 text-[#1a1a1a]" />
            </div>
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">
              To do list{todos.filter(todo => !todo.completed).length > 0 && (
                <span className="ml-1 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                  {todos.filter(todo => !todo.completed).length}
                </span>
              )}
            </span>
            {/* Show count on mobile when text is hidden */}
            {isMobile && todos.filter(todo => !todo.completed).length > 0 && (
              <span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-xs font-medium">
                {todos.filter(todo => !todo.completed).length}
              </span>
            )}
            {isMobile ? (
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            )}
          </div>
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="neo-box overflow-hidden h-full w-[95%] mx-auto max-w-[800px]">
      <CardContent className="p-3 sm:p-4 md:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-[#FFC225] rounded-md neo-border shadow-neo-sm flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4 text-[#1a1a1a]">
                <path d="M11 12h6" />
                <path d="m8 12 2 2" />
                <path d="m8 12 2-2" />
                <path d="M2 12h2" />
                <path d="M2 12a10 10 0 0 1 17.54-6.77" />
                <path d="M2 12a10 10 0 0 0 17.54 6.77" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neo-black truncate">To Do</h3>
            <span className="text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-neo-black font-medium flex-shrink-0">
              <span className="hidden sm:inline">{todos.filter(todo => !todo.completed).length} remaining</span>
              <span className="sm:hidden">{todos.filter(todo => !todo.completed).length}</span>
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 hover:bg-gray-100"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize task list"
          >
            {isMobile ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
        
        <form onSubmit={addTodo} className="flex gap-2 mb-3 sm:mb-4">
          <Input
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add a task..."
            className="neo-border text-sm sm:text-base min-h-[40px] sm:min-h-[44px] touch-target"
          />
          <Button 
            type="submit" 
            size="icon"
            className="bg-[#FFC225] text-[#1a1a1a] hover:bg-[#E6AF20] shadow-neo-sm neo-border min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] touch-target flex-shrink-0"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </form>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full space-y-2 sm:space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1 sm:pr-2 pb-1">
            {todos.length === 0 ? (
              <p className="text-neo-muted text-center py-4 sm:py-6 text-xs sm:text-sm leading-relaxed px-2">
                Add tasks to track during your Pomodoro sessions
              </p>
            ) : (
              todos.map(todo => (
                <div 
                  key={todo.id} 
                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-md neo-border shadow-neo-sm transition-all min-h-[44px] ${
                    todo.completed ? 'bg-gray-50 text-gray-500' : 'bg-white'
                  }`}
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="border-2 border-gray-300 min-w-[20px] min-h-[20px] sm:min-w-[24px] sm:min-h-[24px] flex-shrink-0"
                  />
                  <span className={`flex-grow text-xs sm:text-sm leading-relaxed break-words ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 hover:text-red-500 hover:bg-red-50 flex-shrink-0 min-h-[28px] min-w-[28px] touch-target"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoList;
