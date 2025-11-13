import { For, Match, Show, Switch } from "solid-js";
import ExportButton from "./ExportButton";
import ExportPdfButton from "./ExportPDFButton";

type Option = {
    value: string;
    label: string;
    isCurrent?: boolean;
};

interface StoredGroup {
    name: string;
    group: number;
}

type TopSettingsProps = {
    mode: 'class' | 'professor';
    onModeChange: (mode: 'class' | 'professor') => void;
    weeks: Option[];
    classes: Option[];
    professors: Option[];
    selectedWeek?: string;
    selectedClass?: string;
    selectedProfessor?: string;
    onWeekChange: (week: string) => void;
    onClassChange: (classId: string) => void;
    onProfessorChange: (professorId: string) => void;
    onSettingsClick: () => void;
    onMailClick: () => void;
    groups: StoredGroup[];
    subjects: string[];
};

export default function TopSettings(props: TopSettingsProps) {
    return (
        <div class="bg-[#1a1a2e] rounded-lg shadow-md p-4 sm:p-6 text-white flex flex-col gap-6">
            <div class="flex justify-between items-center">
                <h1 class="text-xl sm:text-2xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" class="mr-2 flex-shrink-0">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span class="hidden sm:inline">VSŠ Kranj Urnik</span>
                    <span class="sm:hidden">Urnik</span>
                </h1>

                <div class="flex items-center space-x-2">
                    <button
                        class="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
                        title="Prijava na obvestila"
                        onClick={props.onMailClick}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </button>

                    <button id="settingsBtn"
                        class="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
                        title="Nastavitve"
                        onClick={props.onSettingsClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path
                                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z">
                            </path>
                        </svg>
                    </button>

                    <Show when={props.mode === 'class'}>
                        <ExportButton
                            week={props.selectedWeek || ''}
                            classId={props.selectedClass || ''}
                            groups={props.groups}
                            subjects={props.subjects}
                        />
                    </Show>
                    <Show when={props.mode === 'professor'}>
                        <ExportPdfButton
                            week={props.selectedWeek || ''}
                            professorId={props.selectedProfessor || ''}
                        />
                    </Show>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="week-select" class="block text-sm font-medium text-gray-400 mb-1">Teden</label>
                    <select
                        id="week-select"
                        class="w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                        value={props.selectedWeek}
                        onChange={(e) => props.onWeekChange(e.currentTarget.value)}
                    >
                        <For each={props.weeks}>{(week) => <option value={week.value}>{week.label}</option>}</For>
                    </select>
                </div>

                <div>
                    <Switch>
                        <Match when={props.mode === 'class'}>
                            <label for="class-select" class="block text-sm font-medium text-gray-400 mb-1">Razred</label>
                            <select
                                id="class-select"
                                class="w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                value={props.selectedClass}
                                onChange={(e) => props.onClassChange(e.currentTarget.value)}
                            >
                                <For each={props.classes}>{(classItem) => <option value={classItem.value}>{classItem.label}</option>}</For>
                            </select>
                        </Match>
                        <Match when={props.mode === 'professor'}>
                            <label for="prof-select" class="block text-sm font-medium text-gray-400 mb-1">Profesor</label>
                            <select
                                id="prof-select"
                                class="w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                value={props.selectedProfessor}
                                onChange={(e) => props.onProfessorChange(e.currentTarget.value)}
                            >
                                <For each={props.professors}>{(prof) => <option value={prof.value}>{prof.label}</option>}</For>
                            </select>
                        </Match>
                    </Switch>
                </div>
            </div>
        </div>
    );
}