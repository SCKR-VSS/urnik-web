const timeSlots = [
    { start: "7:15", end: "8:00" },
    { start: "8:05", end: "8:50" },
    { start: "8:55", end: "9:40" },
    { start: "9:45", end: "10:30" },
    { start: "10:35", end: "11:20" },
    { start: "11:25", end: "12:10" },
    { start: "12:15", end: "13:00" },
    { start: "13:05", end: "13:50" },
    { start: "13:55", end: "14:40" },
    { start: "14:45", end: "15:30" },
    { start: "15:35", end: "16:20" },
    { start: "16:25", end: "17:10" },
    { start: "17:15", end: "18:00" },
    { start: "18:05", end: "18:50" },
    { start: "18:55", end: "19:40" },
    { start: "19:45", end: "20:30" },
];

export function getTimeRange(startSlot: number, duration: number): string {
    const firstSlot = timeSlots[startSlot - 1];
    const lastSlot = timeSlots[startSlot + duration - 2];

    if (!firstSlot || !lastSlot) {
        return "N/A";
    }

    return `${firstSlot.start}-${lastSlot.end}`;
}