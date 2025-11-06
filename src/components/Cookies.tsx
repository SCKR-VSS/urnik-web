import { createSignal, onMount, Show } from "solid-js";

const COOKIE_CONSENT_KEY = "cookiesAccepted";

export default function Cookies() {
    const [isVisible, setIsVisible] = createSignal(false);

    onMount(() => {
        if (localStorage.getItem(COOKIE_CONSENT_KEY) !== "true") {
            setIsVisible(true);
        }
    });

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, "true");
        setIsVisible(false);
    };

    return (
        <Show when={isVisible()}>
            <div class="flex justify-between gap-x-3 fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#1a1a2e] text-white p-4 rounded-lg shadow-xl w-full max-w-xl z-50 border border-gray-700">
                <p class="mb-4 text-sm text-gray-300">Ta spletna stran uporablja piškotke za shranjevanje vaših nastavitev.</p>
                <button
                    onClick={handleAccept}
                    class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 cursor-pointer"
                >
                    Razumem
                </button>
            </div>
        </Show>
    );
}