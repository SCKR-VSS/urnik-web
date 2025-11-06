import { createSignal, Show, createEffect } from "solid-js";
import { Motion, Presence } from "solid-motionone";

interface StoredGroup {
    name: string;
    group: number;
}

type EmailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    classId?: string;
    className?: string;
    groups: StoredGroup[];
    subjects: string[];
};

export default function EmailModal(props: EmailModalProps) {
    const [email, setEmail] = createSignal("");
    const [isLoading, setIsLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [success, setSuccess] = createSignal(false);

    createEffect(() => {
        if (!props.isOpen) {
            setTimeout(() => {
                setEmail("");
                setError(null);
                setSuccess(false);
                setIsLoading(false);
            }, 200);
        }
    });

    const handleSubscribe = async () => {
        if (!email() || !/^\S+@\S+\.\S+$/.test(email())) {
            setError("Vnesite veljaven email naslov.");
            return;
        }
        if (!props.classId) {
            setError("Manjka ID razreda.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setSuccess(false);

        try {
            const groupObj: { [key: string]: number } = {};
            props.groups.forEach(g => {
                groupObj[g.name] = g.group;
            });

            const payload = {
                email: email(),
                subjects: props.subjects,
                groups: groupObj
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL}/mailing/subscribe/${props.classId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ message: "Prišlo je do napake pri prijavi." }));
                throw new Error(errData.message || "Naročnina ni uspela.");
            }

            setSuccess(true);
            setTimeout(props.onClose, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
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
                            <h2 class="text-lg font-bold">Obvestila o spremembah</h2>
                            <button onClick={props.onClose}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400 hover:text-white">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div class="p-6 space-y-4">
                            <p class="text-sm text-gray-300">
                                Prijavite se na email obvestila za <span class="font-bold text-indigo-400">{props.className}</span> in obveščeni boste o vsaki spremembi urnika.
                            </p>
                            <div>
                                <label for="email-input" class="block text-sm font-medium text-gray-400 mb-1">Vaš email:</label>
                                <input
                                    id="email-input"
                                    type="email"
                                    placeholder="ime@domena.si"
                                    class="w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border border-gray-500 bg-gray-700 text-white"
                                    value={email()}
                                    onInput={(e) => setEmail(e.currentTarget.value)}
                                    disabled={isLoading() || success()}
                                />
                            </div>
                            <Show when={error()}>
                                <p class="text-sm text-red-400">{error()}</p>
                            </Show>
                        </div>

                        <div class="p-4 bg-gray-800 rounded-b-lg flex justify-end items-center space-x-3">
                            <Show when={success()}>
                                <div class="flex items-center space-x-2 text-green-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    <span>Uspešno prijavljeni!</span>
                                </div>
                            </Show>
                            <button onClick={props.onClose} class="px-4 py-2 text-sm font-medium rounded-md bg-gray-600 hover:bg-gray-500" disabled={isLoading() || success()}>Prekliči</button>
                            <button onClick={handleSubscribe} class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center w-24" disabled={isLoading() || success()}>
                                <Show when={!isLoading()} fallback={
                                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                }>
                                    Prijavi se
                                </Show>
                            </button>
                        </div>
                    </Motion.div>
                </Motion.div>
            </Show>
        </Presence>
    );
}