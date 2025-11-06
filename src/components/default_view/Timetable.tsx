import { For, createMemo } from "solid-js";
import type { TimetableData, Day } from "~/types/timetable";
import DayCard from "./DayCard";
import { Motion } from "solid-motionone";

type MergedClass = any & { className?: string };
type MergedDay = Omit<Day, 'classes'> & { classes: MergedClass[] };
type MergedTimetableData = Omit<TimetableData, 'days'> & { days: MergedDay[] };

export default function CompactTimetable(props: { data: TimetableData | TimetableData[] }) {

    const mergedData = createMemo((): MergedTimetableData => {
        const data = props.data;
        if (!Array.isArray(data)) {
            return data as MergedTimetableData;
        }

        if (data.length === 0) {
            return { className: "", weekLabel: "", days: [] };
        }

        const mergedDays: MergedDay[] = data[0].days.map(day => ({ ...day, classes: [] }));

        for (const timetable of data) {
            for (const day of timetable.days) {
                const targetDay = mergedDays.find(d => d.day === day.day);
                if (targetDay) {
                    const classesWithClassName = day.classes.map(c => ({
                        ...c,
                        className: timetable.className
                    }));
                    targetDay.classes.push(...classesWithClassName);
                }
            }
        }

        for (const day of mergedDays) {
            day.classes.sort((a, b) => a.slot - b.slot);
        }

        return {
            className: "Professor View",
            weekLabel: data[0].weekLabel,
            days: mergedDays
        };
    });

    return (
        <div class="space-y-6">
            <For each={mergedData().days}>
                {(day, i) => (
                    <Motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i() * 0.1, easing: "ease-in-out" }}
                    >
                        <DayCard day={day} />
                    </Motion.div>
                )}
            </For>
        </div>
    );
}