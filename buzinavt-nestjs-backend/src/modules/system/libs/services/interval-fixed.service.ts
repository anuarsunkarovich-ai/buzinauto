// setIntervalFixed function
// This function creates an interval taking into account the prevention of overlapping tasks.
// If the previous task (callback) is still running, the new iteration of the callback does not start.
// Useful for cases when the task may take longer than the specified interval.
export const setIntervalFixed = (callback: () => Promise<void>, ms?: number) => {
  let task_is_running = false;
  return setInterval(async () => {
    if (task_is_running) return;
    try {
      task_is_running = true;
      await callback();
    } finally {
      task_is_running = false;
    }
  }, ms);
};
