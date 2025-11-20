# Zaganjanje aplikacije
## Predpogoji
`Node.js >= 22.x`

`pnpm >= 10.x`

## Nastavitev .env
Nastaviti je potrebno slednje:
- VITE_PUBLIC_URL = URL te aplikacije oz. obličja urnika
- VITE_API_URL = URL API aplikacije za urnik

## Koraki zagona aplikacije
Najprej naložimo vse pakete potrebne za zagon aplikacije s `pnpm i`.

Aplikacijo se zgradi s `pnpm build`, ki naredi statične datoteke v `/dist` direktoriju.

Strežniku moramo povedati, da so tam shranjene statične datoteke, ki jih mora poslati odjemalcu.

# Prispevki
Nejc Živic: Izdelava aplikacije