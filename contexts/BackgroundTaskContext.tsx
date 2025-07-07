import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface BackgroundTask {
  id: string;
  type: 'outfit_generation' | 'smart_suggestions' | 'image_analysis' | 'ai_search';
  title: string;
  subtitle?: string;
  progress: number; // 0-100
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  cancellable?: boolean;
  onCancel?: () => void;
  steps?: Array<{
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress?: number;
  }>;
}

interface BackgroundTaskContextType {
  // Task management
  tasks: BackgroundTask[];
  activeTasks: BackgroundTask[];
  completedTasks: BackgroundTask[];
  
  // Task operations
  addTask: (task: Omit<BackgroundTask, 'id' | 'startTime' | 'progress' | 'status'>) => string;
  updateTask: (taskId: string, updates: Partial<BackgroundTask>) => void;
  completeTask: (taskId: string, result?: any) => void;
  failTask: (taskId: string, error: string) => void;
  cancelTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  
  // UI state
  showMinimized: boolean;
  setShowMinimized: (show: boolean) => void;
  showTaskDetails: boolean;
  setShowTaskDetails: (show: boolean) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
  
  // Utility
  hasActiveTasks: boolean;
  canNavigate: boolean; // True if no critical tasks are running
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType | undefined>(undefined);

export const BackgroundTaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [showMinimized, setShowMinimized] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Computed values
  const activeTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'running'
  );
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
  );
  
  const hasActiveTasks = activeTasks.length > 0;
  const canNavigate = !activeTasks.some(task => 
    task.type === 'outfit_generation' || task.type === 'smart_suggestions'
  );
  
  // Task operations
  const addTask = useCallback((taskData: Omit<BackgroundTask, 'id' | 'startTime' | 'progress' | 'status'>) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: BackgroundTask = {
      ...taskData,
      id: taskId,
      startTime: new Date(),
      progress: 0,
      status: 'pending',
    };
    
    setTasks(prev => [...prev, newTask]);
    setShowMinimized(true); // Show minimized view when new task starts
    
    console.log(`📋 Added background task: ${newTask.title} (${taskId})`);
    return taskId;
  }, []);
  
  const updateTask = useCallback((taskId: string, updates: Partial<BackgroundTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    
    // Log significant updates
    if (updates.progress !== undefined || updates.status !== undefined) {
      console.log(`📋 Updated task ${taskId}: ${updates.status} (${updates.progress}%)`);
    }
  }, []);
  
  const completeTask = useCallback(async (taskId: string, result?: any) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        status: 'completed', 
        progress: 100, 
        endTime: new Date(),
        result 
      } : task
    ));
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log(`✅ Completed background task: ${taskId}`);
    
    // Auto-hide minimized view after a short delay if no more active tasks
    setTimeout(() => {
      setTasks(current => {
        const stillActive = current.some(task => 
          task.status === 'pending' || task.status === 'running'
        );
        if (!stillActive) {
          setShowMinimized(false);
        }
        return current;
      });
    }, 2000);
  }, []);
  
  const failTask = useCallback(async (taskId: string, error: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        status: 'failed', 
        endTime: new Date(),
        error 
      } : task
    ));
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    console.error(`❌ Failed background task: ${taskId} - ${error}`);
  }, []);
  
  const cancelTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.onCancel) {
      task.onCancel();
    }
    
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        status: 'cancelled', 
        endTime: new Date() 
      } : task
    ));
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log(`⏹️ Cancelled background task: ${taskId}`);
  }, [tasks]);
  
  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    console.log(`🗑️ Removed background task: ${taskId}`);
  }, []);
  
  const clearCompletedTasks = useCallback(() => {
    setTasks(prev => prev.filter(task => 
      task.status === 'pending' || task.status === 'running'
    ));
    console.log('🧹 Cleared completed background tasks');
  }, []);
  
  const value: BackgroundTaskContextType = {
    // Task management
    tasks,
    activeTasks,
    completedTasks,
    
    // Task operations
    addTask,
    updateTask,
    completeTask,
    failTask,
    cancelTask,
    removeTask,
    clearCompletedTasks,
    
    // UI state
    showMinimized,
    setShowMinimized,
    showTaskDetails,
    setShowTaskDetails,
    selectedTaskId,
    setSelectedTaskId,
    
    // Utility
    hasActiveTasks,
    canNavigate,
  };
  
  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
    </BackgroundTaskContext.Provider>
  );
};

export const useBackgroundTasks = () => {
  const context = useContext(BackgroundTaskContext);
  if (context === undefined) {
    throw new Error('useBackgroundTasks must be used within a BackgroundTaskProvider');
  }
  return context;
};