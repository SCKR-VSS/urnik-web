import { createSignal, onMount, Show } from 'solid-js';
import {
    getCurrentSubscription,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
    type PushFilters,
} from '~/lib/push';

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

export default function PushNotificationButton(props: PushFilters) {
    const [status, setStatus] = createSignal<Status>('loading');

    onMount(async () => {
        if (!isPushSupported()) {
            setStatus('unsupported');
            return;
        }
        if (Notification.permission === 'denied') {
            setStatus('denied');
            return;
        }
        const sub = await getCurrentSubscription();
        setStatus(sub ? 'subscribed' : 'unsubscribed');
    });

    const handleClick = async () => {
        const current = status();
        if (current === 'subscribed') {
            setStatus('loading');
            await unsubscribeFromPush();
            setStatus('unsubscribed');
        } else if (current === 'unsubscribed') {
            setStatus('loading');
            const ok = await subscribeToPush(props);
            if (ok) {
                setStatus('subscribed');
            } else {
                setStatus(Notification.permission === 'denied' ? 'denied' : 'unsubscribed');
            }
        }
    };

    const title = () => {
        switch (status()) {
            case 'subscribed': return 'Odjavi se od push obvestil';
            case 'denied': return 'Obvestila so blokirana v brskalniku';
            case 'loading': return 'Nalagam...';
            default: return 'Prijavi se na push obvestila o spremembah urnika';
        }
    };

    return (
        <Show when={status() !== 'unsupported'}>
            <button
                class="p-2 rounded-md cursor-pointer transition-colors"
                classList={{
                    'text-gray-400 hover:text-white hover:bg-gray-700': status() === 'unsubscribed',
                    'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20': status() === 'subscribed',
                    'text-gray-600 cursor-not-allowed': status() === 'denied' || status() === 'loading',
                }}
                title={title()}
                disabled={status() === 'denied' || status() === 'loading'}
                onClick={handleClick}
            >
                <Show
                    when={status() === 'subscribed'}
                    fallback={
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    }
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke-width="2" />
                    </svg>
                </Show>
            </button>
        </Show>
    );
}
