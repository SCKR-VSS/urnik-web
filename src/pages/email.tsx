import { createEffect, Show } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Motion } from "solid-motionone";

const SuccessIcon = () => (
    <Motion.svg
        class="w-24 h-24 text-green-500 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, easing: "ease-out" }}
    >
        <Motion.path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            initial={{ length: 0, opacity: 0.5 }}
            animate={{ length: 1, opacity: 1 }}
            transition={{ duration: 0.6, easing: "ease-out" }}
        />
        <Motion.path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12l2 2 4-4"
            initial={{ length: 0, opacity: 0 }}
            animate={{ length: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5, easing: "ease-in-out" }}
        />
    </Motion.svg>
);

const FailureIcon = () => (
    <Motion.svg
        class="w-24 h-24 text-red-500 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        initial={{ scale: 0.8, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.4, easing: "ease-out" }}
    >
        <Motion.path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            initial={{ length: 0, opacity: 0.5 }}
            animate={{ length: 1, opacity: 1 }}
            transition={{ duration: 0.6, easing: "ease-out" }}
        />
        <Motion.path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 9l-6 6"
            initial={{ length: 0, opacity: 0 }}
            animate={{ length: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5, easing: "ease-in-out" }}
        />
        <Motion.path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 9l6 6"
            initial={{ length: 0, opacity: 0 }}
            animate={{ length: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7, easing: "ease-in-out" }}
        />
    </Motion.svg>
);

export default function EmailUnsubscribe() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isSuccess = () => searchParams.success === 'true';

    createEffect(() => {
        const timer = setTimeout(() => {
            navigate("/", { replace: true });
        }, 5000);

        return () => clearTimeout(timer);
    });

    return (
        <div class="min-h-screen bg-[#0f101e] text-white flex flex-col items-center justify-center text-center p-4">
            <div class="max-w-md">
                <Show when={isSuccess()} fallback={<FailureIcon />}>
                    <SuccessIcon />
                </Show>

                <h1 class="text-3xl font-bold mt-6">
                    {isSuccess() ? "Uspešno odjavljeni!" : "Odjava ni uspela"}
                </h1>

                <p class="mt-2 text-gray-400">
                    {isSuccess()
                        ? "Vaš email je bil uspešno odstranjen iz seznama za obveščanje."
                        : "Povezava za odjavo je neveljavna ali je potekla."}
                </p>

                <p class="mt-8 text-sm text-gray-500 animate-pulse">
                    Preusmerjam na domačo stran...
                </p>
            </div>
        </div>
    );
}