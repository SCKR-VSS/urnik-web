import { createMemo, For, Show } from "solid-js";
import type { Day } from "~/types/timetable";
import ClassCard from "./ClassCard";

type MergedClass = any & { className?: string };
type MergedDay = Omit<Day, 'classes'> & { classes: MergedClass[] };

export default function DayCard(props: { day: MergedDay }) {
    const isToday = createMemo(() => {
        const today = new Date();
        const dayMatch = props.day.day.match(/(\d{1,2})\.(\d{1,2})\.?/);

        if (!dayMatch) return false;

        const day = parseInt(dayMatch[1], 10);
        const month = parseInt(dayMatch[2], 10);

        return today.getDate() === day && today.getMonth() + 1 === month;
    });

    return (
        <div
            class="bg-[#1a1a2e] rounded-lg shadow-md overflow-hidden transition-all"
            classList={{ "border-2 border-indigo-500": isToday() }}
        >
            <h3 class="text-lg font-bold text-white p-4 bg-gray-800/50">{props.day.day}</h3>
            <Show when={props.day.note}>
                <div class="p-4 border-b border-gray-700 text-indigo-300">{props.day.note}</div>
            </Show>
            <div class="space-y-3 p-4">
                <Show when={props.day.classes.length > 0} fallback={<p class="text-gray-400">Ni pouka.</p>}>
                    <For each={props.day.classes}>
                        {(classItem) => <ClassCard class={classItem} />}
                    </For>
                </Show>
            </div>
        </div>
    );
}