import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { TimetableData, ClassInfo } from "~/types/timetable";
import SubjectCard from "./SubjectCard";

type MergedClassInfo = ClassInfo & { className?: string };

type ProcessedClassInfo = MergedClassInfo & {
    to_slot: number;
    lane: number;
    totalLanes: number;
};

export default function Timetable(props: { data: TimetableData | TimetableData[] }) {
    const hours = Array.from({ length: 16 }, (_, i) => i + 1);
    const [currentTime, setCurrentTime] = createSignal(new Date());

    const mergedData = createMemo((): TimetableData => {
        const data = props.data;
        if (!Array.isArray(data)) {
            return data;
        }

        if (data.length === 0) {
            return { className: "", weekLabel: "", days: [] };
        }

        const mergedDays: any[] = data[0].days.map(day => ({ ...day, classes: [] }));

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

        return {
            className: "Professor View",
            weekLabel: data[0].weekLabel,
            days: mergedDays
        };
    });

    onMount(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        onCleanup(() => {
            clearInterval(timerId);
        });
    });

    const timeIndicatorPosition = createMemo(() => {
        const now = currentTime();
        const dayStartMinutes = 7 * 60 + 15;
        const dayEndMinutes = 20 * 60 + 30;
        const totalDayMinutes = dayEndMinutes - dayStartMinutes;

        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        if (nowMinutes < dayStartMinutes || nowMinutes > dayEndMinutes) {
            return null;
        }

        const minutesIntoDay = nowMinutes - dayStartMinutes;
        const percentage = (minutesIntoDay / totalDayMinutes) * 100;

        const jsDayIndex = now.getDay();
        const timetableDayIndex = jsDayIndex === 0 ? 6 : jsDayIndex - 1;

        if (timetableDayIndex < 0 || timetableDayIndex >= mergedData().days.length) {
            return null;
        }

        return {
            top: `${percentage}%`,
            dayColumn: timetableDayIndex + 2
        };
    });

    const processedDays = createMemo(() => {
        const data = mergedData();
        if (!data || !data.days) return [];

        return data.days.map(day => {
            const lessonsToRender: ProcessedClassInfo[] = day.classes.map(c => ({
                ...c,
                to_slot: c.slot + c.duration,
                lane: 0,
                totalLanes: 1
            })).sort((a, b) => a.slot - b.slot);

            if (lessonsToRender.length === 0) {
                return { ...day, processedLessons: [] };
            }

            const clusters: ProcessedClassInfo[][] = [];
            let currentCluster: ProcessedClassInfo[] = [lessonsToRender[0]];

            for (let i = 1; i < lessonsToRender.length; i++) {
                const currentLesson = lessonsToRender[i];
                const clusterMaxEnd = Math.max(...currentCluster.map(c => c.to_slot));

                if (currentLesson.slot < clusterMaxEnd) {
                    currentCluster.push(currentLesson);
                } else {
                    clusters.push(currentCluster);
                    currentCluster = [currentLesson];
                }
            }
            clusters.push(currentCluster);

            const allProcessedLessons: ProcessedClassInfo[] = [];
            clusters.forEach(cluster => {
                const lanes: ProcessedClassInfo[][] = [];
                cluster.forEach(lesson => {
                    let placed = false;
                    for (let i = 0; i < lanes.length; i++) {
                        const lastInLane = lanes[i][lanes[i].length - 1];
                        if (lastInLane.to_slot <= lesson.slot) {
                            lanes[i].push(lesson);
                            lesson.lane = i;
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        lesson.lane = lanes.length;
                        lanes.push([lesson]);
                    }
                });

                const totalLanes = lanes.length;
                cluster.forEach(lesson => {
                    lesson.totalLanes = totalLanes;
                    allProcessedLessons.push(lesson);
                });
            });

            return { ...day, processedLessons: allProcessedLessons };
        });
    });

    return (
        <div class="bg-[#1a1a2e] text-white p-4 rounded-lg overflow-x-auto">
            <div
                class="grid relative min-w-[900px]"
                style={{
                    "grid-template-columns": `40px repeat(${mergedData().days.length}, 1fr)`,
                    "grid-template-rows": "auto repeat(16, 50px)",
                }}
            >
                <div class="absolute inset-0 grid" style={{
                    "grid-template-columns": `40px repeat(${mergedData().days.length}, 1fr)`,
                    "grid-template-rows": "auto repeat(16, 50px)",
                }}>
                    <div class="col-start-1 row-start-1"></div>
                    <For each={mergedData().days}>{() => <div class="border-b border-gray-700"></div>}</For>
                    <For each={hours}>
                        {() => (
                            <>
                                <div class="border-r border-gray-700"></div>
                                <For each={mergedData().days}>{() => <div class="border-r border-b border-gray-700"></div>}</For>
                            </>
                        )}
                    </For>
                </div>

                <div class="p-2 z-10 col-start-1 row-start-1"></div>
                <For each={mergedData().days}>
                    {(day, i) => <div class="p-2 text-center font-semibold z-10" style={{ "grid-column-start": i() + 2, "grid-row-start": 1 }}>{day.day}</div>}
                </For>

                <For each={hours}>
                    {(hour) => (
                        <div class="p-2 text-center text-sm text-gray-400 z-10 flex items-center justify-center" style={{ "grid-column-start": 1, "grid-row-start": hour + 1 }}>
                            {hour}
                        </div>
                    )}
                </For>

                <For each={processedDays()}>
                    {(day, dayIndex) => (
                        <For each={day.processedLessons}>
                            {(lesson) => (
                                <div
                                    class="p-1 z-10"
                                    style={{
                                        "grid-column-start": dayIndex() + 2,
                                        "grid-row-start": lesson.slot + 1,
                                        "grid-row-end": `span ${lesson.duration}`,
                                        "display": "grid",
                                        "grid-template-columns": `repeat(${lesson.totalLanes}, 1fr)`,
                                        "gap": "4px"
                                    }}
                                >
                                    <div style={{ "grid-column-start": lesson.lane + 1 }}>
                                        <SubjectCard lesson={lesson} />
                                    </div>
                                </div>
                            )}
                        </For>
                    )}
                </For>
                <Show when={timeIndicatorPosition()}>
                    {(pos) => (
                        <div
                            class="absolute w-full z-20 opacity-50"
                            style={{
                                "grid-row-start": 2,
                                "grid-row-end": -1,
                                "top": pos().top,
                                "pointer-events": "none",
                                "border-top": "2px dashed white",
                                "border-color": "#fa507d",
                                "height": "0"
                            }}
                        >
                        </div>
                    )}
                </Show>
            </div>
        </div>
    );
}