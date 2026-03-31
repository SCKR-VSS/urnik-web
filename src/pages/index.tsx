import OnboardingModal from '~/components/OnboardingModal';
import SettingsModal from '~/components/SettingsModal';
import EmailModal from '~/components/EmailModal';
import TopSettings from '~/components/Settings';
import { createAsync, query } from '@solidjs/router';
import { createEffect, createSignal, Show, createResource, onMount, onCleanup, Switch, Match, createMemo } from 'solid-js';
import { TimetableData } from '~/types/timetable';
import { Motion, Presence } from 'solid-motionone';
import CompactTimetable from '~/components/default_view/Timetable';
import Timetable from '~/components/timetable_view/Timetable';
import Cookies from '~/components/Cookies';
import DateWarningPopup from '~/components/DateWarning';
import { isClassActive } from '~/lib/time';
import { syncPushSubscription } from '~/lib/push';

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
  const [navDirection, setNavDirection] = createSignal<-1 | 0 | 1>(0);
  const [currentTime, setCurrentTime] = createSignal(new Date());
  let contentRef: HTMLDivElement | undefined;
  let touchStartX = 0;
  let touchStartY = 0;

  const sortedWeeks = createMemo(() => {
    const opts = options();
    if (!opts) return [];
    return [...opts.weeks]
      .map((w: any) => ({ ...w, value: String(w.value) }))
      .sort((a: any, b: any) => {
        const getTimestamp = (label: string) => {
          const match = label.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
          return match ? new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1])).getTime() : 0;
        };
        return getTimestamp(a.label) - getTimestamp(b.label);
      });
  });

  const currentWeekValue = createMemo(() => {
    const opts = options();
    if (!opts) return undefined;
    const cw = opts.weeks.find((w: any) => w.isCurrent);
    return cw ? String(cw.value) : undefined;
  });

  const isOnCurrentWeek = createMemo(() => week() === currentWeekValue());

  const navigateWeek = (direction: -1 | 1) => {
    const weeks = sortedWeeks();
    if (!weeks.length) return;
    const currentIdx = weeks.findIndex((w: any) => w.value === week());
    const nextIdx = currentIdx + direction;
    if (nextIdx >= 0 && nextIdx < weeks.length) {
      setNavDirection(direction);
      setWeek(weeks[nextIdx].value);
    }
  };

  const canGoPrev = createMemo(() => {
    const weeks = sortedWeeks();
    if (!weeks.length) return false;
    const idx = weeks.findIndex((w: any) => w.value === week());
    return idx > 0;
  });

  const canGoNext = createMemo(() => {
    const weeks = sortedWeeks();
    if (!weeks.length) return false;
    const idx = weeks.findIndex((w: any) => w.value === week());
    return idx < weeks.length - 1;
  });

  const goToCurrentWeek = () => {
    const cw = currentWeekValue();
    if (cw) {
      setNavDirection(0);
      setWeek(cw);
    }
  };

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

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (settingsOpen() || showOnboarding() || mailModalOpen()) return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        navigateWeek(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        navigateWeek(1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(timer);
    });
  });

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (timetableType() === 'timetable') return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    const minSwipe = 50;
    if (Math.abs(deltaX) > minSwipe && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) navigateWeek(-1);
      else navigateWeek(1);
    }
  };

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

    syncPushSubscription({
      mode: newSettings.mode,
      classId: newSettings.classId,
      professorId: newSettings.professorId,
      groups: newSettings.groups,
      subjects: newSettings.subjects,
    });
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
          weeks={sortedWeeks()}
          classes={options()!.classes.map((c: any) => ({ value: String(c.id), label: c.name }))}
          professors={options()!.professors.map((p: any) => ({ value: String(p.id), label: p.name }))}
          selectedWeek={week()}
          selectedClass={displayClassId()}
          selectedProfessor={displayProfessorId()}
          onWeekChange={(w) => { setNavDirection(0); setWeek(w); }}
          onClassChange={changeClassId}
          onProfessorChange={changeProfessorId}
          onSettingsClick={() => setSettingsOpen(true)}
          onMailClick={() => setMailModalOpen(true)}
          groups={displayGroups()}
          subjects={displaySubjects()}
          professorId={displayProfessorId()}
          onWeekPrev={() => navigateWeek(-1)}
          onWeekNext={() => navigateWeek(1)}
          canGoPrev={canGoPrev()}
          canGoNext={canGoNext()}
          isOnCurrentWeek={isOnCurrentWeek()}
          onGoToCurrentWeek={goToCurrentWeek}
        />
      </Show>

      <div
        id="content"
        class="mt-6"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Presence exitBeforeEnter>
          <Show when={!timetableData.loading && timetableData()} fallback={<p class="text-center">Nalagam urnik...</p>}>
            <Motion.div
              initial={navDirection() !== 0 ? { opacity: 0, x: navDirection() * 60 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={navDirection() !== 0 ? { opacity: 0, x: navDirection() * -60 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.3, easing: "ease-out" }}
            >
              <Switch>
                <Match when={timetableType() === "default"}>
                  <CompactTimetable data={timetableData()!} currentTime={currentTime()} isCurrentWeek={isOnCurrentWeek()} />
                </Match>
                <Match when={timetableType() === "timetable"}>
                  <Timetable data={timetableData()!} />
                </Match>
              </Switch>
            </Motion.div>
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
    </div>
  );
}