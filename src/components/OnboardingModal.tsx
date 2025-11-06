import { createSignal, For, Show, on, createEffect, createResource, onCleanup, Switch, Match } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Presence, Motion } from "solid-motionone";

type Option = { value: string; label: string; };

interface StoredGroup {
    name: string;
    group: number;
};

type OnboardingModalProps = {
    isOpen: boolean;
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
    onClose: () => void;
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

export default function OnboardingModal(props: OnboardingModalProps) {
    const [mode, setMode] = createSignal<'class' | 'professor'>('class');
    const [selectedClass, setSelectedClass] = createSignal<string | undefined>();
    const [selectedProfessor, setSelectedProfessor] = createSignal<string | undefined>();
    const [selectedTimetableType, setSelectedTimetableType] = createSignal<'default' | 'timetable'>('default');

    const [availableGroups] = createResource(selectedClass, fetchGroupsForClass);
    const [availableSubjects] = createResource(selectedClass, fetchSubjectsForClass);

    const [selectedGroups, setSelectedGroups] = createStore<{ [key: string]: number }>({});
    const [selectedSubjects, setSelectedSubjects] = createStore<{ [key: string]: boolean }>({});

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

    createEffect(on(availableSubjects, (subjects) => {
        if (!subjects) return;
        const allSubjects: { [key: string]: boolean } = {};
        for (const subject of subjects) {
            allSubjects[subject.name] = true;
        }
        setSelectedSubjects(reconcile(allSubjects));
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
                >
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, easing: "ease-out" }}
                        class="bg-[#1a1a2e] rounded-lg shadow-xl w-full max-w-lg text-white"
                    >
                        <div class="p-4 border-b border-gray-600">
                            <h2 class="text-lg font-bold">Dobrodošli!</h2>
                        </div>
                        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <p class="text-gray-300">Za začetek izberite, ali želite pregledovati urnik za razred ali profesorja.</p>
                            <div class="flex items-center bg-gray-800 rounded-lg p-1 w-full">
                                <button onClick={() => setMode('class')} class={`w-1/2 py-2 text-sm rounded-md ${mode() === 'class' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Razred</button>
                                <button onClick={() => setMode('professor')} class={`w-1/2 py-2 text-sm rounded-md ${mode() === 'professor' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Profesor</button>
                            </div>

                            <Switch>
                                <Match when={mode() === 'class'}>
                                    <div class="space-y-6">
                                        <div class="space-y-2">
                                            <label for="onboardingClassSelect" class="block text-sm font-medium text-gray-400">Vaš Razred:</label>
                                            <select id="onboardingClassSelect" class="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                                onChange={(e) => setSelectedClass(e.currentTarget.value)}>
                                                <option selected disabled>Izberite razred...</option>
                                                <For each={props.classes}>{(c) => <option value={c.value}>{c.label}</option>}</For>
                                            </select>
                                        </div>

                                        <Show when={selectedClass() && !availableSubjects.loading && availableSubjects()}>
                                            <div class="space-y-6 border-t border-gray-700 pt-6">
                                                <div class="space-y-2">
                                                    <label class="block text-sm font-medium text-gray-400">Prikazani predmeti:</label>
                                                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2">
                                                        <For each={availableSubjects()}>
                                                            {(subject) => (
                                                                <label class="flex items-center space-x-2 cursor-pointer">
                                                                    <input type="checkbox" class="rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-600"
                                                                        checked={selectedSubjects[subject.name] ?? true}
                                                                        onChange={(e) => setSelectedSubjects(subject.name, e.currentTarget.checked)} />
                                                                    <span class="text-sm">{subject.name}</span>
                                                                </label>
                                                            )}
                                                        </For>
                                                    </div>
                                                </div>

                                                <Show when={!availableGroups.loading && availableGroups()!.length > 0}>
                                                    <div class="space-y-4">
                                                        <For each={availableGroups()}>
                                                            {(group) => (
                                                                <div class="space-y-2">
                                                                    <label class="block text-sm font-medium text-gray-400">{group.subject}:</label>
                                                                    <select class="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                                                        onChange={(e) => setSelectedGroups(group.subject, parseInt(e.currentTarget.value))}>
                                                                        <option value={0}>Vsi</option>
                                                                        <For each={group.groups}>{(g) => <option value={g}>Skupina {g}</option>}</For>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </For>
                                                    </div>
                                                </Show>

                                                <div class="space-y-3">
                                                    <label class="block text-sm font-medium text-gray-400">Prikaz urnika:</label>
                                                    <div class="grid grid-cols-2 gap-4">
                                                        <div class="cursor-pointer rounded-lg p-3 border-2" classList={{ "border-indigo-500 bg-indigo-500 bg-opacity-10": selectedTimetableType() === 'default', "border-gray-600 hover:border-gray-500": selectedTimetableType() !== 'default' }} onClick={() => setSelectedTimetableType('default')}>
                                                            <div class="h-24 w-full bg-gray-700 rounded p-2 space-y-1.5">
                                                                <div class="h-3 w-1/3 rounded-sm bg-gray-500"></div>
                                                                <div class="h-6 w-full rounded-sm bg-gray-500 opacity-70"></div>
                                                                <div class="h-8 w-full rounded-sm bg-gray-500 opacity-70"></div>
                                                            </div>
                                                            <p class="text-center text-sm mt-2">Kompakten</p>
                                                        </div>
                                                        <div class="cursor-pointer rounded-lg p-3 border-2" classList={{ "border-indigo-500 bg-indigo-500 bg-opacity-10": selectedTimetableType() === 'timetable', "border-gray-600 hover:border-gray-500": selectedTimetableType() !== 'timetable' }} onClick={() => setSelectedTimetableType('timetable')}>
                                                            <div class="h-24 w-full bg-gray-700 rounded p-1 grid grid-cols-3 grid-rows-4 gap-0.5">
                                                                <div class="col-start-1 row-start-1 row-span-2 rounded-sm bg-gray-500 opacity-70"></div>
                                                                <div class="col-start-2 row-start-2 row-span-3 rounded-sm bg-gray-500 opacity-70"></div>
                                                                <div class="col-start-3 row-start-3 row-span-2 rounded-sm bg-gray-500 opacity-70"></div>
                                                            </div>
                                                            <p class="text-center text-sm mt-2">Tabela</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Show>
                                    </div>
                                </Match>
                                <Match when={mode() === 'professor'}>
                                    <div class="space-y-2">
                                        <label for="onboardingProfSelect" class="block text-sm font-medium text-gray-400">Profesor:</label>
                                        <select id="onboardingProfSelect" class="mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                            onChange={(e) => setSelectedProfessor(e.currentTarget.value)}>
                                            <option selected disabled>Izberite profesorja...</option>
                                            <For each={props.professors}>{(p) => <option value={p.value}>{p.label}</option>}</For>
                                        </select>
                                    </div>
                                    <div class="space-y-3">
                                        <label class="block text-sm font-medium text-gray-400">Prikaz urnika:</label>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="cursor-pointer rounded-lg p-3 border-2" classList={{ "border-indigo-500 bg-indigo-500 bg-opacity-10": selectedTimetableType() === 'default', "border-gray-600 hover:border-gray-500": selectedTimetableType() !== 'default' }} onClick={() => setSelectedTimetableType('default')}>
                                                <div class="h-24 w-full bg-gray-700 rounded p-2 space-y-1.5">
                                                    <div class="h-3 w-1/3 rounded-sm bg-gray-500"></div>
                                                    <div class="h-6 w-full rounded-sm bg-gray-500 opacity-70"></div>
                                                    <div class="h-8 w-full rounded-sm bg-gray-500 opacity-70"></div>
                                                </div>
                                                <p class="text-center text-sm mt-2">Kompakten</p>
                                            </div>
                                            <div class="cursor-pointer rounded-lg p-3 border-2" classList={{ "border-indigo-500 bg-indigo-500 bg-opacity-10": selectedTimetableType() === 'timetable', "border-gray-600 hover:border-gray-500": selectedTimetableType() !== 'timetable' }} onClick={() => setSelectedTimetableType('timetable')}>
                                                <div class="h-24 w-full bg-gray-700 rounded p-1 grid grid-cols-3 grid-rows-4 gap-0.5">
                                                    <div class="col-start-1 row-start-1 row-span-2 rounded-sm bg-gray-500 opacity-70"></div>
                                                    <div class="col-start-2 row-start-2 row-span-3 rounded-sm bg-gray-500 opacity-70"></div>
                                                    <div class="col-start-3 row-start-3 row-span-2 rounded-sm bg-gray-500 opacity-70"></div>
                                                </div>
                                                <p class="text-center text-sm mt-2">Tabela</p>
                                            </div>
                                        </div>
                                    </div>
                                </Match>
                            </Switch>
                        </div>
                        <div class="p-4 bg-gray-800 rounded-b-lg flex justify-end">
                            <button onClick={handleSave} disabled={!selectedClass() && !selectedProfessor()} class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Shrani in nadaljuj</button>
                        </div>
                    </Motion.div>
                </Motion.div>
            </Show>
        </Presence >
    );
}