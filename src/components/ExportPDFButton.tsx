import { createSignal, Show } from "solid-js";

type ExportPdfButtonProps = {
    week: string;
    professorId: string;
};

export default function ExportPdfButton(props: ExportPdfButtonProps) {
    const [isLoading, setIsLoading] = createSignal(false);

    const handleExport = async () => {
        if (!props.week || !props.professorId) {
            console.error("Week or Professor ID is missing for PDF export.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/timetable/professor/${props.week}/${props.professorId}/pdf`);

            if (!res.ok) {
                throw new Error(`Failed to fetch PDF file: ${res.statusText}`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "urnik.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error exporting PDF:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isLoading() || !props.professorId || !props.week}
            class="p-2 rounded-md text-red-400 hover:text-red-300 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            title="Izvozi v PDF"
        >
            <Show
                when={!isLoading()}
                fallback={
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                }
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="12" y2="12"></line>
                    <line x1="15" y1="15" x2="12" y2="12"></line>
                </svg>
            </Show>
        </button>
    );
}