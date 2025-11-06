import { Show } from "solid-js";
import { getTimeRange } from "../../lib/time";
import type { ClassInfo } from "../../types/timetable";

export function darkenColor(color: string, amount: number): string {
    let usePound = false;

    if (color[0] === "#") {
        usePound = true;
        color = color.slice(1);
    }

    const num = parseInt(color, 16);

    let r = (num >> 16) - amount;
    if (r < 0) r = 0;
    let g = ((num >> 8) & 0x00FF) - amount;
    if (g < 0) g = 0;
    let b = (num & 0x0000FF) - amount;
    if (b < 0) b = 0;

    return (usePound ? "#" : "") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

type MergedClass = any & { className?: string };

export default function ClassCard(props: { class: MergedClass }) {
    return (
        <div
            class="rounded-lg p-3 text-sm text-gray-900"
            style={{ "background-color": darkenColor(props.class.color, 40) }}
        >
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="font-bold bg-indigo-500/80 text-white px-2 py-0.5 rounded-md text-xs">
                        {props.class.subject}
                        {props.class.specialNote && ` ${props.class.specialNote}`}
                    </span>
                    {props.class.group && <span class="text-xs italic ml-2">{props.class.note}</span>}
                </div>

                <Show when={props.class.className}>
                    <span class="font-semibold bg-gray-500/70 text-white px-2 py-0.5 rounded-md text-xs flex-shrink-0">
                        {props.class.className}
                    </span>
                </Show>
            </div>
            <div class="flex items-center gap-4 text-gray-800">
                <span class="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {getTimeRange(props.class.slot, props.class.duration)}
                </span>
                <span class="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {props.class.teacher}
                </span>
                {props.class.classroom && (
                    <span class="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Uč. {props.class.classroom}
                    </span>
                )}
            </div>
        </div>
    );
}