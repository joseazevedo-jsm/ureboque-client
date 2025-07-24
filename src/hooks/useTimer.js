import { useState, useEffect } from "react";

/**
 * Hook to manage a countdown timer
 * @param {number} initialDuration - Initial duration in seconds
 * @param {Function} onTimeExpired - Callback when timer reaches zero
 * @returns {Object} Timer state and functions
 */
export const useTimer = (initialDuration = 180, onTimeExpired = () => {}) => {
  const [timer, setTimer] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);

  /**
   * Start the timer
   */
  const startTimer = () => {
    console.log("Starting timer with duration:", initialDuration);
    setTimer(initialDuration); // Reset to initial duration when starting
    setIsActive(true);
  };

  /**
   * Reset the timer to initial duration
   */
  const resetTimer = () => {
    setIsActive(false);
    setTimer(initialDuration);
  };

  /**
   * Pause the timer
   */
  const pauseTimer = () => {
    setIsActive(false);
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * Calculate progress as decimal (0-1)
   */
  const calculateProgress = () => {
    return 1 - timer / initialDuration;
  };

  // Timer countdown effect
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            setIsActive(false);
            onTimeExpired();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else if (!isActive && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, onTimeExpired]);

  return {
    // State
    timer,
    isActive,
    
    // Functions
    startTimer,
    resetTimer,
    pauseTimer,
    formatTime,
    calculateProgress,
    
    // Helpers
    isExpired: timer === 0,
    progress: calculateProgress()
  };
}; 