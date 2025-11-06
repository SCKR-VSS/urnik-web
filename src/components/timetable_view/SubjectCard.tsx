import { Show } from "solid-js";
import type { ClassInfo } from "~/types/timetable";
import { darkenColor } from "../default_view/ClassCard";
import { getTimeRange } from "~/lib/time";

type MergedClassInfo = ClassInfo & { className?: string };

export default function SubjectCard(props: { lesson: MergedClassInfo }) {
    return (
        <div
            class="relative h-full w-full rounded-lg p-2 text-white flex flex-col justify-between"
            style={{ "background-color": darkenColor(props.lesson.color, 60) }}
        >
            <div class="flex flex-col items-start">
                <div class="font-bold text-sm">{props.lesson.subject}</div>
                <div class="text-xs">{getTimeRange(props.lesson.slot, props.lesson.duration)}</div>
                <Show when={props.lesson.group}>
                    <div class="text-xs">Skupina {props.lesson.group}</div>
                </Show>
                <Show when={props.lesson.specialNote}>
                    <div class="text-xs">{props.lesson.specialNote}</div>
                </Show>
                <Show when={props.lesson.className}>
                    <div class="mt-1">
                        <span class="bg-black/20 text-white/90 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {props.lesson.className}
                        </span>
                    </div>
                </Show>
            </div>

            <div class="text-xs font-bold opacity-90 flex flex-col items-start gap-0.5">
                <Show when={!props.lesson.className}>
                    <div>{props.lesson.teacher}</div>
                    <div>Učilnica: {props.lesson.classroom}</div>
                </Show>
                <Show when={props.lesson.className}>
                    <div>Učilnica: {props.lesson.classroom}</div>
                </Show>
            </div>
        </div>
    );
}