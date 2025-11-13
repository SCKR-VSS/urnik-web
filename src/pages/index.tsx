import OnboardingModal from '~/components/OnboardingModal';
import SettingsModal from '~/components/SettingsModal';
import EmailModal from '~/components/EmailModal';
import TopSettings from '~/components/Settings';
import { createAsync, query } from '@solidjs/router';
import { createEffect, createSignal, Show, createResource, onMount, Switch, Match } from 'solid-js';
import { TimetableData } from '~/types/timetable';
import { Presence } from 'solid-motionone';
import CompactTimetable from '~/components/default_view/Timetable';
import Timetable from '~/components/timetable_view/Timetable';
import Cookies from '~/components/Cookies';
import DateWarningPopup from '~/components/DateWarning';

interface StoredGroup {
  name: string;
  group: number;
}

const getStoredMode = (): 'class' | 'professor' => {
  if (typeof window === 'undefined') return "class";
  return (localStorage.getItem("viewMode") as 'class' | 'professor') || null;
};

const setStoredMode = (mode: 'class' | 'professor') => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("viewMode", mode);
};

const getStoredProfessorId = (): string => {
  if (typeof window === 'undefined') return "";
  return localStorage.getItem("professorId") || "";
};

const setStoredProfessorId = (id: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("professorId", id);
};

const getStoredClassId = (): string => {
  if (typeof window === 'undefined') return "";
  return localStorage.getItem("classId") || "";
};

const setStoredClassId = (id: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("classId", id);
};

const getStoredGroups = (): StoredGroup[] => {
  if (typeof window === 'undefined') return [];
  const groups = localStorage.getItem("groups");
  return groups ? JSON.parse(groups) : [];
};

const setStoredGroups = (groups: StoredGroup[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("groups", JSON.stringify(groups));
};

const getStoredSubjects = (classId: string): string[] => {
  if (typeof window === 'undefined' || !classId) return [];
  const allSubjects = localStorage.getItem("subjects");
  if (!allSubjects) return [];
  const subjectsByClass = JSON.parse(allSubjects) as { [key: string]: string[] };
  return subjectsByClass[classId] || [];
};

const setStoredSubjects = (classId: string, subjects: string[]) => {
  if (typeof window === 'undefined' || !classId) return;
  const allSubjects = localStorage.getItem("subjects");
  const subjectsByClass = allSubjects ? JSON.parse(allSubjects) as { [key: string]: string[] } : {};
  subjectsByClass[classId] = subjects;
  localStorage.setItem("subjects", JSON.stringify(subjectsByClass));
};

const getStoredTimetableType = (): "default" | "timetable" => {
  if (typeof window === 'undefined') return "default";
  return (localStorage.getItem("timetableType") as "default" | "timetable") || "default";
};

const setStoredTimetableType = (type: "default" | "timetable") => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("timetableType", type);
}

const getOptions = query(async () => {
  const options = await fetch(import.meta.env.VITE_API_URL + "/options");
  return await options.json();
}, "items");

const fetchTimetable = async ({ mode, week, classId, professorId, options }: {
  mode: 'class' | 'professor',
  week?: string,
  classId?: string,
  professorId?: string,
  options?: { groups?: StoredGroup[], subjects?: string[] }
}) => {
  if (!week) return null;

  if (mode === 'professor') {
    if (!professorId) return null;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/timetable/professor/${week}/${professorId}`);
    if (!res.ok) return null;
    return await res.json() as TimetableData[];
  }

  if (!classId) return null;
  if (options && (options.groups?.length || options.subjects?.length)) {
    const groupObj: { [key: string]: number } = {};
    options.groups?.forEach(g => {
      groupObj[g.name] = g.group;
    });

    const res = await fetch(`${import.meta.env.VITE_API_URL}/timetable/${week}/${classId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groups: groupObj, subjects: options.subjects })
    });
    if (!res.ok) return null;
    return await res.json() as TimetableData;
  }

  const res = await fetch(`${import.meta.env.VITE_API_URL}/timetable/${week}/${classId}`);
  if (!res.ok) return null;
  return await res.json() as TimetableData;
};

export default function Home() {
  const options = createAsync(() => getOptions());

  const [mode, setMode] = createSignal<'class' | 'professor'>(getStoredMode());
  const [week, setWeek] = createSignal<string>();
  const [displayClassId, setDisplayClassId] = createSignal("");
  const [displayProfessorId, setDisplayProfessorId] = createSignal("");
  const [displayGroups, setDisplayGroups] = createSignal<StoredGroup[]>(getStoredGroups());
  const [timetableType, setTimetableType] = createSignal<"default" | "timetable">(getStoredTimetableType());
  const [displaySubjects, setDisplaySubjects] = createSignal<string[]>([]);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [mailModalOpen, setMailModalOpen] = createSignal(false);
  const [showOnboarding, setShowOnboarding] = createSignal(false);

  onMount(() => {
    const storedMode = getStoredMode();

    if (!storedMode) {
      setShowOnboarding(true);
      return;
    }

    setMode(storedMode);

    const storedClassId = getStoredClassId();
    const storedProfessorId = getStoredProfessorId();
    if (storedClassId) {
      setDisplayClassId(storedClassId);
      setDisplayGroups(getStoredGroups());
      setDisplaySubjects(getStoredSubjects(storedClassId));
    }

    if (storedProfessorId) {
      setDisplayProfessorId(storedProfessorId);
    }
  });

  createEffect(() => {
    const opts = options();
    if (opts && !week()) {
      const currentWeek = opts.weeks.find((w: any) => w.isCurrent);
      if (currentWeek) {
        setWeek(String(currentWeek.value));
      }
    }
  });

  const handleSaveSettings = (newSettings: {
    mode: 'class' | 'professor',
    classId?: string,
    professorId?: string,
    groups?: StoredGroup[],
    subjects?: string[],
    timetableType?: 'default' | 'timetable'
  }) => {
    setMode(newSettings.mode);
    setStoredMode(newSettings.mode);
    setTimetableType(newSettings.timetableType || 'default');
    setStoredTimetableType(newSettings.timetableType || 'default');

    if (newSettings.mode === 'professor' && newSettings.professorId) {
      setStoredProfessorId(newSettings.professorId);
      setDisplayProfessorId(newSettings.professorId);
    } else if (newSettings.mode === 'class' && newSettings.classId) {
      setStoredClassId(newSettings.classId);
      setStoredGroups(newSettings.groups || []);
      setStoredSubjects(newSettings.classId, newSettings.subjects || []);

      setDisplayClassId(newSettings.classId);
      setDisplayGroups(newSettings.groups || []);
      setDisplaySubjects(newSettings.subjects || []);
    }

    setSettingsOpen(false);
  };

  const handleOnboardingSave = (newSettings: {
    mode: 'class' | 'professor',
    classId?: string,
    professorId?: string,
    groups?: StoredGroup[],
    subjects?: string[],
    timetableType?: 'default' | 'timetable'
  }) => {
    setMode(newSettings.mode);
    setStoredMode(newSettings.mode);

    if (newSettings.mode === 'professor' && newSettings.professorId) {
      setStoredProfessorId(newSettings.professorId);
      setDisplayProfessorId(newSettings.professorId);
      setStoredTimetableType(newSettings.timetableType || 'default');
      setTimetableType(newSettings.timetableType || 'default');
    } else if (newSettings.mode === 'class' && newSettings.classId) {
      setStoredClassId(newSettings.classId);
      setStoredGroups(newSettings.groups || []);
      setStoredSubjects(newSettings.classId, newSettings.subjects || []);
      setStoredTimetableType(newSettings.timetableType || 'default');

      setDisplayClassId(newSettings.classId);
      setDisplayGroups(newSettings.groups || []);
      setDisplaySubjects(newSettings.subjects || []);
      setTimetableType(newSettings.timetableType || 'default');
    }
    setShowOnboarding(false);
  };

  const handleModeChange = (newMode: 'class' | 'professor') => {
    setMode(newMode);
    setStoredMode(newMode);
    if (newMode === 'professor') {
      setDisplayProfessorId(getStoredProfessorId());
    } else {
      setDisplayClassId(getStoredClassId());
    }
  };

  const changeClassId = (newClassId: string) => {
    setDisplayClassId(newClassId);
    setStoredClassId(newClassId);
    const storedSubjects = getStoredSubjects(newClassId);
    setDisplaySubjects(storedSubjects);
  };

  const changeProfessorId = (newProfessorId: string) => {
    setDisplayProfessorId(newProfessorId);
    setStoredProfessorId(newProfessorId);
  };

  const [timetableData] = createResource(
    () => ({
      mode: mode(),
      week: week(),
      classId: displayClassId(),
      professorId: displayProfessorId(),
      options: {
        groups: displayGroups(),
        subjects: displaySubjects()
      }
    }),
    fetchTimetable
  );

  return (
    <div class={`mx-auto p-4 ${timetableType() === "default" ? 'max-w-5xl' : 'max-w-7xl'}`}>
      <Show when={options()} fallback={<p class="text-center">Nalagam nastavitve...</p>}>
        <TopSettings
          mode={mode()}
          onModeChange={handleModeChange}
          weeks={options()!.weeks.map((w: any) => ({ ...w, value: String(w.value) }))}
          classes={options()!.classes.map((c: any) => ({ value: String(c.id), label: c.name }))}
          professors={options()!.professors.map((p: any) => ({ value: String(p.id), label: p.name }))}
          selectedWeek={week()}
          selectedClass={displayClassId()}
          selectedProfessor={displayProfessorId()}
          onWeekChange={setWeek}
          onClassChange={changeClassId}
          onProfessorChange={changeProfessorId}
          onSettingsClick={() => setSettingsOpen(true)}
          onMailClick={() => setMailModalOpen(true)}
          groups={displayGroups()}
          subjects={displaySubjects()}
        />
      </Show>

      <div id="content" class="mt-6">
        <Presence exitBeforeEnter>
          <Show when={!timetableData.loading && timetableData()} fallback={<p class="text-center">Nalagam urnik...</p>}>
            <Switch>
              <Match when={timetableType() === "default"}>
                <CompactTimetable data={timetableData()!} />
              </Match>
              <Match when={timetableType() === "timetable"}>
                <Timetable data={timetableData()!} />
              </Match>
            </Switch>
          </Show>
        </Presence>
      </div>

      <Cookies />

      <Show when={options()}>
        <SettingsModal
          isOpen={settingsOpen()}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveSettings}
          classes={options()!.classes.map((c: any) => ({ value: String(c.id), label: c.name }))}
          professors={options()!.professors.map((p: any) => ({ value: String(p.id), label: p.name }))}
          initialMode={mode()}
          initialClassId={displayClassId()}
          initialProfessorId={displayProfessorId()}
          initialSelectedGroups={displayGroups()}
          initialSelectedSubjects={displaySubjects()}
          initialTimetableType={timetableType()}
        />
      </Show>
      <Show when={options()}>
        <OnboardingModal
          isOpen={showOnboarding()}
          onSave={handleOnboardingSave}
          onClose={() => setShowOnboarding(false)}
          classes={options()!.classes.map((c: any) => ({ value: String(c.id), label: c.name }))}
          professors={options()!.professors.map((p: any) => ({ value: String(p.id), label: p.name }))}
        />
      </Show>
      <EmailModal
        isOpen={mailModalOpen()}
        onClose={() => setMailModalOpen(false)}
        mode={mode()}
        classId={displayClassId()}
        className={options()?.classes.find((c: any) => String(c.id) === displayClassId())?.name}
        professorId={displayProfessorId()}
        professorName={options()?.professors.find((p: any) => String(p.id) === displayProfessorId())?.name}
        groups={displayGroups()}
        subjects={displaySubjects()}
      />
      <DateWarningPopup />
    </div>
  );
}