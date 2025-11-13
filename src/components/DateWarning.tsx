import { createSignal, Switch, Match } from 'solid-js';
import { Motion, Presence } from 'solid-motionone';

export default function DateWarningPopup() {
    const [isExpanded, setIsExpanded] = createSignal(false);

    return (
        <Presence>
            <div class="fixed bottom-4 left-4 z-50 w-100">
                <Switch>
                    <Match when={isExpanded()}>
                        <Motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            class="w-full max-w-sm rounded-lg bg-[#1a1a2e] p-4 shadow-2xl border border-yellow-500/30"
                        >
                            <div class="flex items-start">
                                <div class="flex-shrink-0">
                                    <svg class="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div class="ml-3 w-0 flex-1">
                                    <p class="text-sm font-medium text-yellow-300">Opozorilo o datumih</p>
                                    <p class="mt-1 text-sm text-gray-300">
                                        Po začetku leta 2026 so lahko prikazani časi v urniku napačni.
                                    </p>
                                </div>
                                <div class="ml-4 flex flex-shrink-0">
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        class="inline-flex rounded-md bg-transparent text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                                    >
                                        <span class="sr-only">Zapri</span>
                                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </Motion.div>
                    </Match>
                    <Match when={!isExpanded()}>
                        <Motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            onClick={() => setIsExpanded(true)}
                            class="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                            aria-label="Prikaži opozorilo o datumih"
                        >
                            <svg class="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </Motion.button>
                    </Match>
                </Switch>
            </div>
        </Presence>
    );
}