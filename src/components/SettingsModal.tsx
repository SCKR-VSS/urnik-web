import { createSignal, For, Show, on, createEffect, createResource, onCleanup, Switch, Match } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Presence, Motion } from "solid-motionone";

type Option = { value: string; label: string; };

interface StoredGroup {
    name: string;
    group: number;
};

type SettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: {
        mode: 'class' | 'professor',
        classId?: string,
        professorId?: string,
        groups?: StoredGroup[],
        subjects?: string[],
        timetableType?: 'default' | 'timetable'
    }) => void;
    classes: Option[];
    professors: Option[];
    initialMode: 'class' | 'professor';
    initialClassId?: string;
    initialProfessorId?: string;
    initialSelectedGroups: StoredGroup[];
    initialSelectedSubjects: string[];
    initialTimetableType: "default" | "timetable";
};

const fetchGroupsForClass = async (classId: string) => {
    if (!classId) return [];
    const res = await fetch(`${import.meta.env.VITE_API_URL}/groups/${classId}`);
    if (!res.ok) return [];
    return await res.json() as { subject: string, groups: number[] }[];
};

const fetchSubjectsForClass = async (classId: string) => {
    if (!classId) return [];
    const res = await fetch(`${import.meta.env.VITE_API_URL}/options/subjects/${classId}`);
    if (!res.ok) return [];
    return await res.json() as { id: number, name: string }[];
};

export default function SettingsModal(props: SettingsModalProps) {
    const [mode, setMode] = createSignal(props.initialMode);
    const [selectedClass, setSelectedClass] = createSignal(props.initialClassId);
    const [selectedProfessor, setSelectedProfessor] = createSignal(props.initialProfessorId);
    const [availableGroups] = createResource(selectedClass, fetchGroupsForClass);
    const [availableSubjects] = createResource(selectedClass, fetchSubjectsForClass);
    const [selectedGroups, setSelectedGroups] = createStore<{ [key: string]: number }>({});
    const [selectedSubjects, setSelectedSubjects] = createStore<{ [key: string]: boolean }>({});
    const [selectedTimetableType, setSelectedTimetableType] = createSignal(props.initialTimetableType);

    createEffect(() => {
        if (!props.isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                props.onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        onCleanup(() => {
            window.removeEventListener("keydown", handleKeyDown);
        });
    });

    createEffect(on(() => props.isOpen, (isOpen) => {
        if (!isOpen) return;

        setMode(props.initialMode);
        setSelectedClass(props.initialClassId);
        setSelectedProfessor(props.initialProfessorId);
        setSelectedTimetableType(props.initialTimetableType);

        const initialGroups: { [key: string]: number } = {};
        for (const group of props.initialSelectedGroups) {
            initialGroups[group.name] = group.group;
        }
        setSelectedGroups(reconcile(initialGroups));
    }));

    createEffect(on(availableSubjects, (subjects) => {
        if (!subjects) return;

        const initialCheckState: { [key: string]: boolean } = {};
        const hasInitialSubjects = props.initialSelectedSubjects.length > 0;

        for (const subject of subjects) {
            initialCheckState[subject.name] = hasInitialSubjects
                ? props.initialSelectedSubjects.includes(subject.name)
                : true;
        }
        setSelectedSubjects(reconcile(initialCheckState));
    }));

    const handleSave = () => {
        if (mode() === 'professor' && selectedProfessor()) {
            props.onSave({
                mode: 'professor',
                professorId: selectedProfessor(),
                timetableType: selectedTimetableType()
            });
        } else if (mode() === 'class' && selectedClass()) {
            const groupsToSave = Object.entries(selectedGroups)
                .filter(([, groupNum]) => groupNum > 0)
                .map(([name, group]) => ({ name, group }));

            const subjectsToSave = Object.entries(selectedSubjects)
                .filter(([, isSelected]) => isSelected)
                .map(([name]) => name);

            props.onSave({
                mode: 'class',
                classId: selectedClass(),
                groups: groupsToSave,
                subjects: subjectsToSave,
                timetableType: selectedTimetableType()
            });
        }
    };

    return (
        <Presence>
            <Show when={props.isOpen}>
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={props.onClose}
                >
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, easing: "ease-out" }}
                        class="bg-[#1a1a2e] rounded-lg shadow-xl w-full max-w-md text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div class="p-4 border-b border-gray-600 flex justify-between items-center">
                            <h2 class="text-lg font-bold">Nastavitve</h2>
                            <button onClick={props.onClose}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400 hover:text-white">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div class="flex items-center bg-gray-800 rounded-lg p-1 w-full">
                                <button onClick={() => setMode('class')} class={`w-1/2 py-2 text-sm rounded-md ${mode() === 'class' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Razred</button>
                                <button onClick={() => setMode('professor')} class={`w-1/2 py-2 text-sm rounded-md ${mode() === 'professor' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Profesor</button>
                            </div>

                            <Switch>
                                <Match when={mode() === 'professor'}>
                                    <div class="space-y-2">
                                        <label for="settingsProfSelect" class="block text-sm font-medium text-gray-400">Profesor:</label>
                                        <select
                                            id="settingsProfSelect"
                                            class="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                            value={selectedProfessor()}
                                            onChange={(e) => setSelectedProfessor(e.currentTarget.value)}
                                        >
                                            <For each={props.professors}>
                                                {(prof) => <option value={prof.value}>{prof.label}</option>}
                                            </For>
                                        </select>
                                    </div>
                                </Match>
                                <Match when={mode() === 'class'}>
                                    <div class="space-y-6">
                                        <div class="space-y-2">
                                            <label for="settingsClassSelect" class="block text-sm font-medium text-gray-400">Vaš Razred:</label>
                                            <select
                                                id="settingsClassSelect"
                                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                                value={selectedClass()}
                                                onChange={(e) => setSelectedClass(e.currentTarget.value)}
                                            >
                                                <For each={props.classes}>
                                                    {(classItem) => <option value={classItem.value}>{classItem.label}</option>}
                                                </For>
                                            </select>
                                        </div>

                                        <Show when={!availableSubjects.loading && availableSubjects()}>
                                            <div class="space-y-2">
                                                <label class="block text-sm font-medium text-gray-400">Prikazani predmeti:</label>
                                                <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2">
                                                    <For each={availableSubjects()}>
                                                        {(subject) => (
                                                            <label class="flex items-center space-x-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    class="rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-600"
                                                                    checked={selectedSubjects[subject.name] ?? true}
                                                                    onChange={(e) => setSelectedSubjects(subject.name, e.currentTarget.checked)}
                                                                />
                                                                <span class="text-sm">{subject.name}</span>
                                                            </label>
                                                        )}
                                                    </For>
                                                </div>
                                            </div>
                                        </Show>

                                        <Show
                                            when={!availableGroups.loading && availableGroups() && availableGroups()!.length > 0}
                                            fallback={
                                                <Show when={availableGroups.loading} fallback={
                                                    <p class="text-center text-gray-400 py-4">Za ta razred ni posebnih skupin.</p>
                                                }>
                                                    <div class="flex items-center justify-center space-x-2 text-gray-400 py-4">
                                                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Iščem skupine...</span>
                                                    </div>
                                                </Show>
                                            }
                                        >
                                            <div class="space-y-4">
                                                <For each={availableGroups()}>
                                                    {(group) => (
                                                        <div class="space-y-2">
                                                            <label class="block text-sm font-medium text-gray-400">{group.subject}:</label>
                                                            <select
                                                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                                                value={selectedGroups[group.subject] || 0}
                                                                onChange={(e) => setSelectedGroups(group.subject, parseInt(e.currentTarget.value))}
                                                            >
                                                                <option value={0}>Vsi</option>
                                                                <For each={group.groups}>
                                                                    {(g) => <option value={g}>Skupina {g}</option>}
                                                                </For>
                                                            </select>
                                                        </div>
                                                    )}
                                                </For>
                                            </div>
                                        </Show>
                                    </div>
                                </Match>
                            </Switch>

                            <label class="block text-sm font-medium text-gray-400">Prikaz urnika:</label>
                            <div class="grid grid-cols-2 gap-4">
                                <div
                                    class="cursor-pointer rounded-lg p-3 border-2"
                                    classList={{
                                        "border-indigo-500 bg-indigo-500 bg-opacity-10": selectedTimetableType() === 'default',
                                        "border-gray-600 hover:border-gray-500": selectedTimetableType() !== 'default'
                                    }}
                                    onClick={() => setSelectedTimetableType('default')}
                                >
                                    <div class="h-24 w-full bg-gray-700 rounded p-2 space-y-1.5">
                                        <div class="h-3 w-1/3 rounded-sm bg-gray-500"></div>
                                        <div class="h-6 w-full rounded-sm bg-gray-500 opacity-70"></div>
                                        <div class="h-8 w-full rounded-sm bg-gray-500 opacity-70"></div>
                                    </div>
                                    <p class="text-center text-sm mt-2">Kompakten</p>
                                </div>

                                <div
                                    class="cursor-pointer rounded-lg p-3 border-2"
                                    classList={{
                                        "border-indigo-500 bg-indigo-500 bg-opacity-10": selectedTimetableType() === 'timetable',
                                        "border-gray-600 hover:border-gray-500": selectedTimetableType() !== 'timetable'
                                    }}
                                    onClick={() => setSelectedTimetableType('timetable')}
                                >
                                    <div class="h-24 w-full bg-gray-700 rounded p-1 grid grid-cols-3 grid-rows-4 gap-0.5">
                                        <div class="col-start-1 row-start-1 row-span-2 rounded-sm bg-gray-500 opacity-70"></div>
                                        <div class="col-start-2 row-start-2 row-span-3 rounded-sm bg-gray-500 opacity-70"></div>
                                        <div class="col-start-3 row-start-1 row-span-1 rounded-sm bg-gray-500 opacity-70"></div>
                                        <div class="col-start-3 row-start-3 row-span-2 rounded-sm bg-gray-500 opacity-70"></div>
                                    </div>
                                    <p class="text-center text-sm mt-2">Tabela</p>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 bg-gray-800 rounded-b-lg flex justify-end space-x-3">
                            <button onClick={props.onClose} class="px-4 py-2 text-sm font-medium rounded-md bg-gray-600 hover:bg-gray-500">Prekliči</button>
                            <button onClick={handleSave} class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700">Shrani</button>
                        </div>
                    </Motion.div>
                </Motion.div>
            </Show>
        </Presence >
    );
}