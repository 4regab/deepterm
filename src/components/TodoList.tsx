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
          className={`neo-border shadow-neo bg-white hover:bg-gray-50 transition-colors py-4 px-3 ${mobileFixedClasses}`}
          aria-label="Expand task list"
        >
          <div className="flex flex-row items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-[#FFC225] neo-border">
              <ListTodo className="h-4 w-4 text-[#1a1a1a]" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              To do list{todos.filter(todo => !todo.completed).length > 0 && (
                <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  {todos.filter(todo => !todo.completed).length}
                </span>
              )}
            </span>
            {isMobile ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </div>
        </Button>
      </div>
    );
  }
  
  return (
    <Card className="neo-box overflow-hidden h-full w-[95%] mx-auto max-w-[800px]">
      <CardContent className="p-4 md:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center bg-[#FFC225] rounded-md neo-border shadow-neo-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1a1a1a]">
                <path d="M11 12h6" />
                <path d="m8 12 2 2" />
                <path d="m8 12 2-2" />
                <path d="M2 12h2" />
                <path d="M2 12a10 10 0 0 1 17.54-6.77" />
                <path d="M2 12a10 10 0 0 0 17.54 6.77" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">To Do</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-2">
              {todos.filter(todo => !todo.completed).length} remaining
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize task list"
          >
            {isMobile ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <Input
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add a task..."
            className="neo-border"
          />
          <Button 
            type="submit" 
            size="icon"
            className="bg-[#FFC225] text-[#1a1a1a] hover:bg-[#E6AF20] shadow-neo-sm neo-border"
          >
            <PlusIcon className="w-5 h-5" />
          </Button>
        </form>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2 pb-1">
            {todos.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">
                Add tasks to track during your Pomodoro sessions
              </p>
            ) : (
              todos.map(todo => (
                <div 
                  key={todo.id} 
                  className={`flex items-center gap-2 p-3 rounded-md neo-border shadow-neo-sm transition-all ${
                    todo.completed ? 'bg-gray-50 text-gray-500' : 'bg-white'
                  }`}
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                    className="border-2 border-gray-300"
                  />
                  <span className={`flex-grow ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                    className="h-8 w-8 text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
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
