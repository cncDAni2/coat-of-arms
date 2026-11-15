# 09 – Címerleírás (blazon)

A címerleírás a címer **pontos, szabványos szöveges meghatározása**. A szabály: **a leírásból bárki ugyanazt a címert rajzolja meg** (stílusbeli eltérésekkel). A leírás az elsődleges; a rajz csak egy megvalósítás.

## Sorrend (angol / nemzetközi gyakorlat)

1. **Mező**: máza, vagy osztása + a részek mázai (jobbról balra, felülről lefelé), vagy mezőváltozata / hintése.
2. **Fő ábra**: a **mesteralakok** az első helyen a címerképek közül; utána a fő címerkép.
3. A fő ábra **körüli** (between) és **rajta lévő** (on) további ábrák.
4. **Pajzsfő, ráma, telek** és a rajtuk lévő ábrák (ezek „a pajzs fölött” vannak, ezért a végén).
5. Az egész pajzsot érintő ábra (pl. szívpajzs, átfutó harántpólya „mindenek fölött” — *overall*).
6. **Külső díszek**: korona, sisak, sisaktakaró, sisakdísz, pajzstartók, jelmondat.

Egy ábra leírásának sorrendje: **darabszám → név → testtartás → irány → máz → részletek eltérő mázai (fegyverzet, nyelv, korona) → elhelyezés**.

> Angol: *Gules, a lion rampant Or armed and langued Azure.*
> = Vörös mezőben ágaskodó arany oroszlán kék fegyverzettel és nyelvvel.

### Írásmód (angol)

- A mező után **vessző**.
- A máz a főnév **után** áll (*a lion Or*), mert a blazon a normann-francia szórendet őrzi.
- „Or” nagybetűvel (összetéveszthető az angol *or*-ral); ma gyakran minden máz nagybetűs.
- Ismétlődő máz: régi gyakorlat *of the first* („az elsőként említett mázban”) vagy *of the field*; a mai szabályozó testületek (College of Arms) **kerülik**, inkább újra kiírják a mázat.
- Hintés: a mező után **vessző nélkül** (*Azure semé-de-lis Or*).
- Negyedek: *Quarterly, 1 and 4 …; 2 and 3 …*.

## Magyar címerleírás

A magyar címereslevelek és a mai magyar heraldikai gyakorlat **más szórendet** használ, természetes magyar mondatként, **kívülről befelé / alulról felfelé** haladva:

1. pajzsalak (opcionálisan) és mező: *„Kék pajzsban …”*, *„Vágott pajzs felső, vörös mezejében …, alsó, ezüst mezejében …”*,
2. a mezőben lévő ábra(k): helyzet → testtartás → máz → főnév → mit tart:
   *„… zöld hármashalom középső, kiemelkedő halmán arany koronából kinövő ezüst kettős kereszt.”*
3. **Sisak**: *„Pajzson jobbra fordult, nyílt, koronás (pántos) sisak.”*
4. **Sisakdísz**: *„Sisakdísz: növekvő, kardot tartó arany oroszlán.”*
5. **Takaró**: *„Takarók: jobbról kék–arany, balról vörös–ezüst.”*
6. Pajzstartók, jelmondat.

Magyar szóhasználat: *pajzsban / mezőben*, *hasított*, *vágott*, *harántolt*, *balharántolt*, *négyelt*, *jobbra (balra) fordult*, *ágaskodó*, *növekvő*, *kinövő*, *lebegő* (a mezőben szabadon álló ábra), *zöld halmon álló*, *koronás*, *vörös ruhás kar*.

### Minta – a magyar középcímer

> *Hasított pajzs. Jobb oldalán vörössel és ezüsttel hétszer vágott (vágásai: vörös–ezüst, négy vörös és négy ezüst pólya); bal oldalán vörös mezőben zöld hármashalom kiemelkedő középső halmán arany nyitott koronából kinövő ezüst kettős kereszt. A pajzson a magyar Szent Korona nyugszik.*

(Jó példa a **történeti** színszabály-sértésre: zöld hármashalom vörös mezőben.)

## Mezőszámozás

- A részeket **sorról sorra**, felülről lefelé, **jobbról balra** (heraldikai) számozzuk: négyelt pajzs: 1 = jobb felső, 2 = bal felső, 3 = jobb alsó, 4 = bal alsó.
- Azonos tartalmú negyedek együtt: *„1. és 4. negyedben …; 2. és 3. negyedben …”*.

## Generált leírás az alkalmazásban – irányelvek

- Az **adatmodellből** (`CoaState`) generálható: `selectedDiv.shape.id` → osztás neve; `colors[]` → mázak (ehhez a színeknek **mázaknak** kell lenniük, nem tetszőleges hexnek); `pattern[]` → mezőváltozat/hintés; `charges[]` → ábrák (név, máz, terület, elhelyezés).
- Az ábrák elhelyezését **heraldikai pozíciókra** (lásd [01](01-alapfogalmak.md) pontjai) kell kerekíteni; ha nem kerekíthető (pl. ferdén, a sarokban lebegő ábra), az jelzés, hogy a címer **nem leírható → nem szabályos**.
- Ha a leírásgenerálás sikertelen, a validátor jelezze → [11](11-validacio.md).
- Javasolt kétnyelvű kimenet: **magyar** (játékon belüli szöveg) és **angol blazon** (nemzetközi).

### Máz-szótár (kód → magyar → angol blazon)

| kulcs | magyar | blazon |
|-------|--------|--------|
| `or` | arany | Or |
| `argent` | ezüst | Argent |
| `gules` | vörös | Gules |
| `azure` | kék | Azure |
| `vert` | zöld | Vert |
| `sable` | fekete | Sable |
| `purpure` | bíbor | Purpure |
| `ermine` | hermelin | Ermine |
| `vair` | mál | Vair |
| `proper` | természetes színű | proper |
