import { createSignal, Show, For, createResource, createMemo } from 'solid-js';
import { Motion } from 'solid-motionone';

const API = import.meta.env.VITE_API_URL;

interface ApiKey {
    id: number;
    label: string | null;
    key: string;
    createdAt: Date;
    usageCount: number;
    revoked: boolean;
    type: number;
}

const KEY_TYPES: Record<number, string> = {
    0: 'Standard',
    1: 'Admin',
};

function getAdminKey(): string | null {
    return sessionStorage.getItem('adminKey');
}

function setAdminKey(key: string) {
    sessionStorage.setItem('adminKey', key);
}

function clearAdminKey() {
    sessionStorage.removeItem('adminKey');
}

function authHeaders(): Record<string, string> {
    const key = getAdminKey();
    return key ? { 'x-admin-key': key, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function loginWithKey(key: string): Promise<boolean> {
    try {
        const res = await fetch(`${API}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const data = await res.json();
        return data.valid === true;
    } catch {
        return false;
    }
}

async function fetchKeys(): Promise<ApiKey[]> {
    const res = await fetch(`${API}/admin/keys`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch keys');
    return res.json();
}

async function createKey(dto: { label?: string; type?: number }): Promise<ApiKey> {
    const res = await fetch(`${API}/admin/keys`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Failed to create key');
    return res.json();
}

async function revokeKey(id: number): Promise<void> {
    const res = await fetch(`${API}/admin/keys/${id}/revoke`, {
        method: 'PATCH',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to revoke key');
}

async function deleteKey(id: number): Promise<void> {
    const res = await fetch(`${API}/admin/keys/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete key');
}

function LoginScreen(props: { onLogin: () => void }) {
    const [inputKey, setInputKey] = createSignal('');
    const [error, setError] = createSignal('');
    const [loading, setLoading] = createSignal(false);

    const handleLogin = async () => {
        const key = inputKey().trim();
        if (!key) return;
        setLoading(true);
        setError('');
        const ok = await loginWithKey(key);
        if (ok) {
            setAdminKey(key);
            props.onLogin();
        } else {
            setError('Neveljaven ključ.');
        }
        setLoading(false);
    };

    return (
        <div class="min-h-screen flex items-center justify-center px-4">
            <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                class="bg-[#1a1a2e] rounded-xl shadow-lg p-8 w-full max-w-sm"
            >
                <h1 class="text-2xl font-bold text-white mb-2 text-center">Admin</h1>
                <p class="text-gray-400 text-sm text-center mb-6">Vnesite admin ključ za dostop.</p>

                <input
                    type="password"
                    class="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                    placeholder="API ključ"
                    value={inputKey()}
                    onInput={(e) => setInputKey(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    autofocus
                />

                <Show when={error()}>
                    <p class="text-red-400 text-sm mb-3">{error()}</p>
                </Show>

                <button
                    class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleLogin}
                    disabled={loading() || !inputKey().trim()}
                >
                    {loading() ? 'Preverjam...' : 'Prijava'}
                </button>
            </Motion.div>
        </div>
    );
}

function CreateKeyModal(props: { onClose: () => void; onCreated: (key: ApiKey) => void }) {
    const [label, setLabel] = createSignal('');
    const [type, setType] = createSignal(0);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal('');
    const [createdKey, setCreatedKey] = createSignal<ApiKey | null>(null);

    const handleCreate = async () => {
        setLoading(true);
        setError('');
        try {
            const key = await createKey({
                label: label().trim() || undefined,
                type: type(),
            });
            setCreatedKey(key);
            props.onCreated(key);
        } catch {
            setError('Napaka pri ustvarjanju ključa.');
        }
        setLoading(false);
    };

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={props.onClose}>
            <div class="absolute inset-0 bg-black/60" />
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                class="bg-[#1a1a2e] rounded-xl shadow-xl p-6 w-full max-w-md relative z-10"
                onClick={(e: MouseEvent) => e.stopPropagation()}
            >
                <h2 class="text-xl font-bold text-white mb-4">Nov API ključ</h2>

                <Show when={!createdKey()} fallback={
                    <div>
                        <p class="text-green-400 text-sm mb-2">Ključ uspešno ustvarjen!</p>
                        <div class="bg-gray-800 rounded-lg p-3 mb-4">
                            <p class="text-xs text-gray-400 mb-1">Ključ (kopirajte ga zdaj):</p>
                            <code class="text-indigo-300 text-sm break-all select-all">{createdKey()!.key}</code>
                        </div>
                        <button
                            class="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white cursor-pointer transition-colors"
                            onClick={props.onClose}
                        >
                            Zapri
                        </button>
                    </div>
                }>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Oznaka (neobvezno)</label>
                            <input
                                type="text"
                                class="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="npr. Mobilna aplikacija"
                                value={label()}
                                onInput={(e) => setLabel(e.currentTarget.value)}
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Tip</label>
                            <select
                                class="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={type()}
                                onChange={(e) => setType(Number(e.currentTarget.value))}
                            >
                                <For each={Object.entries(KEY_TYPES)}>
                                    {([val, lbl]) => <option value={val}>{lbl}</option>}
                                </For>
                            </select>
                        </div>

                        <Show when={error()}>
                            <p class="text-red-400 text-sm">{error()}</p>
                        </Show>

                        <div class="flex gap-3">
                            <button
                                class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white cursor-pointer transition-colors"
                                onClick={props.onClose}
                            >
                                Prekliči
                            </button>
                            <button
                                class="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer transition-colors disabled:opacity-50"
                                onClick={handleCreate}
                                disabled={loading()}
                            >
                                {loading() ? 'Ustvarjam...' : 'Ustvari'}
                            </button>
                        </div>
                    </div>
                </Show>
            </Motion.div>
        </div>
    );
}

function ConfirmDialog(props: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmClass?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={props.onCancel}>
            <div class="absolute inset-0 bg-black/60" />
            <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                class="bg-[#1a1a2e] rounded-xl shadow-xl p-6 w-full max-w-sm relative z-10"
                onClick={(e: MouseEvent) => e.stopPropagation()}
            >
                <h3 class="text-lg font-bold text-white mb-2">{props.title}</h3>
                <p class="text-gray-400 text-sm mb-5">{props.message}</p>
                <div class="flex gap-3">
                    <button
                        class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white cursor-pointer transition-colors"
                        onClick={props.onCancel}
                    >
                        Prekliči
                    </button>
                    <button
                        class={`flex-1 py-2 rounded-lg text-white font-medium cursor-pointer transition-colors ${props.confirmClass || 'bg-red-600 hover:bg-red-700'}`}
                        onClick={props.onConfirm}
                    >
                        {props.confirmLabel}
                    </button>
                </div>
            </Motion.div>
        </div>
    );
}

function KeyRow(props: {
    apiKey: ApiKey;
    onRevoke: (id: number) => void;
    onDelete: (id: number) => void;
}) {
    const formattedDate = () => {
        const d = new Date(props.apiKey.createdAt);
        return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'numeric', year: 'numeric' });
    };

    const typeName = () => KEY_TYPES[props.apiKey.type] || `Tip ${props.apiKey.type}`;

    const maskedKey = () => {
        const k = props.apiKey.key;
        if (k.length <= 8) return k;
        return k.slice(0, 4) + '••••' + k.slice(-4);
    };

    return (
        <tr class="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
            <td class="px-4 py-3 text-sm text-gray-300">{props.apiKey.id}</td>
            <td class="px-4 py-3">
                <span class="text-sm text-white">{props.apiKey.label || '—'}</span>
            </td>
            <td class="px-4 py-3">
                <code class="text-xs text-indigo-300 bg-gray-800 px-2 py-1 rounded font-mono">{maskedKey()}</code>
            </td>
            <td class="px-4 py-3">
                <span class={`text-xs px-2 py-0.5 rounded-full font-medium ${props.apiKey.type === 1 ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {typeName()}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-300 text-center">{props.apiKey.usageCount}</td>
            <td class="px-4 py-3">
                <span classList={{
                    'text-xs px-2 py-0.5 rounded-full font-medium': true,
                    'bg-green-500/20 text-green-300': !props.apiKey.revoked,
                    'bg-red-500/20 text-red-300': props.apiKey.revoked,
                }}>
                    {props.apiKey.revoked ? 'Preklican' : 'Aktiven'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-400">{formattedDate()}</td>
            <td class="px-4 py-3">
                <div class="flex gap-2 justify-end">
                    <Show when={!props.apiKey.revoked}>
                        <button
                            class="text-xs px-3 py-1.5 rounded-md bg-amber-600/20 text-amber-300 hover:bg-amber-600/40 cursor-pointer transition-colors"
                            onClick={() => props.onRevoke(props.apiKey.id)}
                        >
                            Prekliči
                        </button>
                    </Show>
                    <button
                        class="text-xs px-3 py-1.5 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/40 cursor-pointer transition-colors"
                        onClick={() => props.onDelete(props.apiKey.id)}
                    >
                        Izbriši
                    </button>
                </div>
            </td>
        </tr>
    );
}

function AdminDashboard(props: { onLogout: () => void }) {
    const [keys, { refetch }] = createResource(fetchKeys);
    const [showCreateModal, setShowCreateModal] = createSignal(false);
    const [confirmAction, setConfirmAction] = createSignal<{ type: 'revoke' | 'delete'; id: number } | null>(null);
    const [filter, setFilter] = createSignal<'all' | 'active' | 'revoked'>('all');

    const filteredKeys = createMemo(() => {
        const data = keys();
        if (!data) return [];
        switch (filter()) {
            case 'active': return data.filter(k => !k.revoked);
            case 'revoked': return data.filter(k => k.revoked);
            default: return data;
        }
    });

    const stats = createMemo(() => {
        const data = keys() || [];
        return {
            total: data.length,
            active: data.filter(k => !k.revoked).length,
            revoked: data.filter(k => k.revoked).length,
            totalUsage: data.reduce((sum, k) => sum + k.usageCount, 0),
        };
    });

    const handleRevoke = async (id: number) => {
        try {
            await revokeKey(id);
            refetch();
        } catch {
            alert('Napaka pri preklicu ključa.');
        }
        setConfirmAction(null);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteKey(id);
            refetch();
        } catch {
            alert('Napaka pri brisanju ključa.');
        }
        setConfirmAction(null);
    };

    return (
        <div class="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
                    <p class="text-gray-400 text-sm mt-1">Upravljanje API ključev</p>
                </div>
                <div class="flex gap-3">
                    <button
                        class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer transition-colors"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + Nov ključ
                    </button>
                    <button
                        class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm cursor-pointer transition-colors"
                        onClick={props.onLogout}
                    >
                        Odjava
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div class="bg-[#1a1a2e] rounded-lg p-4">
                    <p class="text-gray-400 text-xs uppercase tracking-wide">Skupaj</p>
                    <p class="text-2xl font-bold text-white mt-1">{stats().total}</p>
                </div>
                <div class="bg-[#1a1a2e] rounded-lg p-4">
                    <p class="text-gray-400 text-xs uppercase tracking-wide">Aktivni</p>
                    <p class="text-2xl font-bold text-green-400 mt-1">{stats().active}</p>
                </div>
                <div class="bg-[#1a1a2e] rounded-lg p-4">
                    <p class="text-gray-400 text-xs uppercase tracking-wide">Preklicani</p>
                    <p class="text-2xl font-bold text-red-400 mt-1">{stats().revoked}</p>
                </div>
                <div class="bg-[#1a1a2e] rounded-lg p-4">
                    <p class="text-gray-400 text-xs uppercase tracking-wide">Skupna uporaba</p>
                    <p class="text-2xl font-bold text-indigo-400 mt-1">{stats().totalUsage}</p>
                </div>
            </div>

            <div class="flex gap-2 mb-4">
                <For each={[
                    { value: 'all' as const, label: 'Vsi' },
                    { value: 'active' as const, label: 'Aktivni' },
                    { value: 'revoked' as const, label: 'Preklicani' },
                ]}>
                    {(tab) => (
                        <button
                            class="px-4 py-1.5 rounded-lg text-sm cursor-pointer transition-colors"
                            classList={{
                                'bg-indigo-600 text-white': filter() === tab.value,
                                'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700': filter() !== tab.value,
                            }}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label}
                        </button>
                    )}
                </For>
                <div class="flex-1" />
                <button
                    class="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-sm cursor-pointer transition-colors"
                    onClick={() => refetch()}
                    title="Osveži"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                </button>
            </div>

            <div class="bg-[#1a1a2e] rounded-xl shadow-lg overflow-hidden">
                <Show when={!keys.loading} fallback={
                    <div class="p-8 text-center text-gray-400">Nalagam ključe...</div>
                }>
                    <Show when={keys.error}>
                        <div class="p-4 bg-red-500/10 text-red-400 text-sm">
                            Napaka pri nalaganju ključev. <button class="underline cursor-pointer" onClick={() => refetch()}>Poskusi znova</button>
                        </div>
                    </Show>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-700 bg-gray-800/50">
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">ID</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Oznaka</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Ključ</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Tip</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wide">Uporaba</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Ustvarjen</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Dejanja</th>
                                </tr>
                            </thead>
                            <tbody>
                                <Show when={filteredKeys().length > 0} fallback={
                                    <tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Ni ključev za prikaz.</td></tr>
                                }>
                                    <For each={filteredKeys()}>
                                        {(apiKey) => (
                                            <KeyRow
                                                apiKey={apiKey}
                                                onRevoke={(id) => setConfirmAction({ type: 'revoke', id })}
                                                onDelete={(id) => setConfirmAction({ type: 'delete', id })}
                                            />
                                        )}
                                    </For>
                                </Show>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>

            <Show when={showCreateModal()}>
                <CreateKeyModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { refetch(); }}
                />
            </Show>

            <Show when={confirmAction()?.type === 'revoke'}>
                <ConfirmDialog
                    title="Prekliči ključ"
                    message={`Ali ste prepričani, da želite preklicati ključ #${confirmAction()!.id}? Ključ ne bo več deloval.`}
                    confirmLabel="Prekliči ključ"
                    confirmClass="bg-amber-600 hover:bg-amber-700"
                    onConfirm={() => handleRevoke(confirmAction()!.id)}
                    onCancel={() => setConfirmAction(null)}
                />
            </Show>
            <Show when={confirmAction()?.type === 'delete'}>
                <ConfirmDialog
                    title="Izbriši ključ"
                    message={`Ali ste prepričani, da želite izbrisati ključ #${confirmAction()!.id}? To dejanje je nepovratno.`}
                    confirmLabel="Izbriši"
                    onConfirm={() => handleDelete(confirmAction()!.id)}
                    onCancel={() => setConfirmAction(null)}
                />
            </Show>
        </div>
    );
}

export default function AdminPage() {
    const [authenticated, setAuthenticated] = createSignal(!!getAdminKey());

    const handleLogout = () => {
        clearAdminKey();
        setAuthenticated(false);
    };

    return (
        <Show when={authenticated()} fallback={<LoginScreen onLogin={() => setAuthenticated(true)} />}>
            <AdminDashboard onLogout={handleLogout} />
        </Show>
    );
}
