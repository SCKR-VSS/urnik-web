import { createSignal, Show, onMount, onCleanup } from "solid-js";

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
    const [open, setOpen] = createSignal(false);
    const [copied, setCopied] = createSignal(false);

    // Close dropdown when clicking outside
    const handleOutsideClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-export-dropdown]')) {
            setOpen(false);
        }
    };
    onMount(() => {
        document.addEventListener('click', handleOutsideClick);
        onCleanup(() => document.removeEventListener('click', handleOutsideClick));
    });

    const buildFeedUrl = () => {
        const base = `${import.meta.env.VITE_API_URL}/calendar/feed/${props.classId}`;
        const params = new URLSearchParams();
        if (props.subjects?.length) {
            params.set('subjects', props.subjects.join(','));
        }
        if (props.groups?.length) {
            params.set('groups', props.groups.map(g => `${g.name}:${g.group}`).join(','));
        }
        const query = params.toString();
        return query ? `${base}?${query}` : base;
    };

    const handleDownload = async () => {
        if (!props.week || !props.classId) return;
        setOpen(false);
        setIsLoading(true);
        try {
            const groupObj: { [key: string]: number } = {};
            props.groups?.forEach(g => { groupObj[g.name] = g.group; });

            const res = await fetch(`${import.meta.env.VITE_API_URL}/calendar/${props.week}/${props.classId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groups: groupObj, subjects: props.subjects })
            });

            if (!res.ok) throw new Error(`Failed to fetch calendar file: ${res.statusText}`);

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

    const handleSubscribe = () => {
        setOpen(false);
        const feedUrl = buildFeedUrl();
        // webcal:// triggers calendar apps to subscribe directly.
        // Falls back to the http URL if the scheme can't be replaced (relative URLs).
        const webcalUrl = /^https?:\/\//i.test(feedUrl)
            ? feedUrl.replace(/^https?:\/\//i, 'webcal://')
            : feedUrl;
        // Open in new tab so the page isn't disrupted if the OS has no webcal handler.
        window.open(webcalUrl, '_blank');
    };

    const handleCopyFeed = async () => {
        try {
            await navigator.clipboard.writeText(buildFeedUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error("Failed to copy feed URL");
        }
    };

    return (
        <div class="relative" data-export-dropdown>
            <button
                onClick={() => setOpen(o => !o)}
                disabled={isLoading() || !props.classId || !props.week}
                class="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Izvozi v koledar"
            >
                <Show
                    when={!isLoading()}
                    fallback={
                        <svg class="h-6 w-6 text-green-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            <Show when={open()}>
                <div class="absolute right-0 mt-1 w-52 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50 overflow-hidden">
                    {/* Download one-time file */}
                    <button
                        onClick={handleDownload}
                        class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors text-left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400 flex-shrink-0">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <div>
                            <div class="font-medium">Prenesi .ics</div>
                            <div class="text-xs text-gray-400">Enkratni izvoz tega tedna</div>
                        </div>
                    </button>

                    <div class="border-t border-gray-700" />

                    {/* Subscribe via webcal */}
                    <button
                        onClick={handleSubscribe}
                        class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors text-left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400 flex-shrink-0">
                            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/>
                            <path d="M3.6 9h16.8M3.6 15h16.8"/>
                            <path d="M11.5 3a17 17 0 0 0 0 18"/>
                            <path d="M12.5 3a17 17 0 0 1 0 18"/>
                        </svg>
                        <div>
                            <div class="font-medium">Naroči se na feed</div>
                            <div class="text-xs text-gray-400">Odpre v vaši aplikaciji</div>
                        </div>
                    </button>

                    {/* Copy feed URL */}
                    <button
                        onClick={handleCopyFeed}
                        class="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors text-left"
                    >
                        <Show
                            when={!copied()}
                            fallback={
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400 flex-shrink-0">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            }
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 flex-shrink-0">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </Show>
                        <div>
                            <div class="font-medium">{copied() ? "Kopirano!" : "Kopiraj URL"}</div>
                            <div class="text-xs text-gray-400">Za ročno dodajanje</div>
                        </div>
                    </button>
                </div>
            </Show>
        </div>
    );
}