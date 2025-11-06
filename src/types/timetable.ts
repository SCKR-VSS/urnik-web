export interface ClassInfo {
  slot: number;
  duration: number;
  color: string;
  dayName: string;
  subject: string;
  teacher: string;
  classroom: string;
  note: string;
  specialNote: string;
  group: number | null;
}

export interface Day {
  day: string;
  classes: ClassInfo[];
  note: string | null;
}

export interface TimetableData {
  className: string;
  weekLabel: string;
  days: Day[];
}
