import { createSignal, Show } from "solid-js";

interface StoredGroup {
    name: string;
    group: number;
};

type ExportButtonProps = {
    week: string;
    classId: string;
    groups: StoredGroup[];
    subjects: string[];
};

export default function ExportButton(props: ExportButtonProps) {
    const [isLoading, setIsLoading] = createSignal(false);

    const handleExport = async () => {
        if (!props.week || !props.classId) {
            console.error("Week or Class ID is missing for export.");
            return;
        }

        setIsLoading(true);

        try {
            const groupObj: { [key: string]: number } = {};
            props.groups?.forEach(g => {
                groupObj[g.name] = g.group;
            });

            const res = await fetch(`${import.meta.env.VITE_API_URL}/calendar/${props.week}/${props.classId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ groups: groupObj, subjects: props.subjects })
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch calendar file: ${res.statusText}`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `urnik_${props.classId}_${props.week}.ics`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error exporting calendar:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isLoading() || !props.classId || !props.week}
            class="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
            title="Izvozi v koledar"
        >
            <Show
                when={!isLoading()}
                fallback={
                    <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                }
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500 hover:text-green-400 transition-colors">
                    <path d="M12 5v14" />
                    <path d="m19 12-7 7-7-7" />
                </svg>
            </Show>
        </button>
    );
}