export interface UpdateWaitlistNotification {
  startTime?: number;
  endTime?: number;
}

export interface CreateWaitlistNotification {
  date: string;
  userId: string;
  courseId: string;
  startTime: number;
  endTime: number;
  playerCount: number;
}
export interface CreateWaitlistNotifications {
  dates: string[];
  userId: string;
  courseId: string;
  startTime: number;
  endTime: number;
  playerCount: number;
}
