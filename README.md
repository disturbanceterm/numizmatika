# Numizmatika – istorijska mapa i album kolekcije

Lokalna web aplikacija za jednog kolekcionara: **mapa svijeta kroz godine** (1800–2010) na kojoj je
svaka država obojena po tome koliki dio njenih novčanica i kovanica imaš, a klik na državu otvara
**album** – valute po periodu i mrežu "sličica" iz Numista kataloga (posjedovano u boji, ostalo kao
izblijedjela silueta). Sve što imaš upisuješ sa godinom, stanjem, slikom i napomenom.

<!--
@changelog
2026-09-21  Početna verzija.
2026-09-21  Dodato brzo pokretanje na Windows-u (PowerShell) i napomena o MapLibre workeru.
-->

Kod: <https://github.com/disturbanceterm/numizmatika>

## Brzo pokretanje (Windows PowerShell)

```powershell
git clone https://github.com/disturbanceterm/numizmatika.git; cd numizmatika
npm install                 # zavisnosti + Prisma klijent + MapLibre worker u public/maplibre
Copy-Item .env.example .env # po želji upiši NUMISTA_API_KEY
npx prisma migrate deploy   # napravi data/numizmatika.db
npm run dev                 # http://localhost:4317
```

## Šta radi (prvi upotrebljiv komad)

- `/` – MapLibre mapa sa klizačem godina (1800, 1815, 1880, 1900, 1914, 1920, 1930, 1938, 1945, 1960,
  1994, 2000, 2010). Hover pokazuje ime regiona, klik otvara bočni panel sa povezanim Numista
  izdavačima, popunjenošću i dugmetom **Album**.
- `/drzava/[kod]` – album izdavača: valute grupisane po periodu (npr. *Dinar (1944-1965)*), filter
  novčanice / kovanice, dugme **Učitaj katalog sa Numiste**, dijalog **Dodaj u kolekciju**
  (godina, stanje, količina, cijena, slika, napomena).
- `/kolekcija` – sve što imaš, pretraga i osnovna statistika.
- `/podesavanja` – status API ključa i kvote, veze region ↔ izdavač (sa listom nepovezanih regiona
  sa mape i pretragom Numista izdavača).

Bez `NUMISTA_API_KEY` aplikacija radi sa **ugrađenim probnim katalogom Jugoslavije** (novčanice i
kovanice Kraljevine, FNRJ/SFRJ i SRJ), tako da se cijeli tok može probati bez ključa.

## Pokretanje

Potreban je Node.js 20+.

```bash
npm install                 # instalira zavisnosti i generiše Prisma klijent
cp .env.example .env        # po želji upiši NUMISTA_API_KEY
npx prisma migrate deploy   # napravi data/numizmatika.db
npm run dev                 # http://localhost:4317
```

Ostale komande:

| Komanda | Šta radi |
| --- | --- |
| `npm run build` / `npm start` | produkcijski build i server (port 4317) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run db:migrate` | nova Prisma migracija posle izmjene `prisma/schema.prisma` |
| `npx prisma studio` | pregled baze |

### Promjenljive okruženja (`.env`)

| Ime | Podrazumijevano | Opis |
| --- | --- | --- |
| `NUMISTA_API_KEY` | *(prazno → probni katalog)* | Numista v3 ključ (numista.com → API → *Activate API access*). |
| `DATABASE_URL` | `file:./data/numizmatika.db` | SQLite fajl. |
| `NUMISTA_MONTHLY_QUOTA` | `2000` | Mjesečna kvota tvog plana (za brojač). |
| `NUMISTA_DETAIL_BUDGET` | `100` | Koliko poziva `GET /types/{id}` (valuta, detalji) smije potrošiti jedno otvaranje albuma. |

Pravi ključ nikad ne komituj – `.env` je u `.gitignore`.

## Kako se troši Numista kvota

- `GET /issuers` – jednom (lista ~4200 izdavača se kešira u bazi).
- **Učitaj katalog** za jednu državu: 1 poziv na 50 komada (`GET /types?issuer=…`). Rezultat ostaje
  trajno u SQLite.
- Valute se ne vraćaju u listi, pa se **lijeno** dovlače kroz `GET /types/{id}` – kad otvoriš album,
  popune se do budžeta `NUMISTA_DETAIL_BUDGET`; ostatak sledeći put. Do tada se sličice grupišu po
  deceniji prve godine.
- Klijent čeka i ponavlja na `429`, a brojač potrošenih poziva vidiš u navigaciji i u
  `/podesavanja`.

## Podaci

- `data/numizmatika.db` – SQLite baza (Prisma). **Bekap = kopiraj folder `data/`.**
- `data/uploads/` – tvoje slike komada.
- `data/region-links.json` – startno mapiranje imena regiona sa mape → Numista `issuer code`
  (Evropa/Balkan). Kodovi označeni `"verified": false` su pretpostavke po Numistinom imenovanju i
  mogu se ispraviti u `/podesavanja`.
- `public/maps/world_YYYY.geojson` – granice za svaku godinu.
- `public/maplibre/` – MapLibre web-worker, kopira ga `scripts/copy-maplibre-worker.mjs` pri
  `npm install` / `npm run dev` / `npm run build` (nije u git-u). Bez toga bi Turbopack vratio 404 za
  worker i mapa bi ostala prazna.

## Tehnologije

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · MapLibre GL JS · Prisma 7 + SQLite
(`better-sqlite3`).

## Zasluge i licence

- Istorijske granice: [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)
  (Andrej Ournedník i saradnici), objavljene pod **GPL-3.0** licencom – kopija licence je u
  `public/maps/LICENSE.historical-basemaps`. Fajlovi u `public/maps/` su neizmijenjeni
  `geojson/world_YYYY.geojson` iz tog repozitorijuma.
- Podaci kataloga: [Numista](https://www.numista.com) preko njihovog javnog API-ja v3, u skladu sa
  njihovim uslovima korišćenja. Slike tipova ostaju na Numistinim serverima.

## Pravila rada na kodu

- Svaki fajl ima `@changelog` blok sa datiranim unosom; značajne odluke imaju `// REASON:` komentar.
- Fajlovi se ne brišu nego arhiviraju (`*.archive`).
- Bez autentikacije i multi-tenancy – lična kolekcija, lokalno.
