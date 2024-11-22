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

export interface WaitlistNotification {
  id: string;
  userId: string;
  courseId: string;
  date: Date;
  startTime: number;
  endTime: number;
  playerCount: number;
}

export interface NotificationQstashData {
    notificationId?: string;
    courseId: string;
    userId: string;
    courseLogoURL?: string;
    subDomainURL?: string | null;
    courseName?: string;
  listingId?: string;
}
