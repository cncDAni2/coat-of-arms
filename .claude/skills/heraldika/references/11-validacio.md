# 11 – Validációs szabálykészlet a címerkészítőhöz

Gépi ellenőrzéshez lefordított szabályok. Súlyosság:

- **HIBA** – heraldikailag szabálytalan (a címer nem „szabályos”).
- **FIGYELMEZTETÉS** – szabályos, de rossz gyakorlat vagy csak kivételesen elfogadott.
- **INFÓ** – tájékoztatás.

## Előfeltétel: mázak hex helyett

A színeket a modellben **máz-kulcsként** (`'or' | 'argent' | 'gules' | 'azure' | 'vert' | 'sable' | 'purpure' | 'ermine' | 'vair' | 'proper' …`) kell tárolni, a hex csak megjelenítés. Ha ez nincs meg, a hexből legközelebbi mázra kell kerekíteni (pl. HSL alapján), és ha egy hex túl messze van minden máztól → HIBA `NOT_A_TINCTURE`.

```ts
type Metal = 'or' | 'argent';
type Colour = 'gules' | 'azure' | 'vert' | 'sable' | 'purpure';
type Fur = 'ermine' | 'ermines' | 'erminois' | 'pean' | 'vair' | 'counter-vair' | 'potent';
type Tincture = Metal | Colour | Fur | 'proper';
const category = (t: Tincture): 'metal' | 'colour' | 'fur' | 'proper' => …;
```

## Szabályok

### Mázak

| Kód | Súly | Szabály |
|-----|------|---------|
| `NOT_A_TINCTURE` | HIBA | Bármely mező/minta/ábra színe nem heraldikai máz. |
| `INCONSISTENT_SHADE` | FIGYELM. | Ugyanaz a máz két különböző hex-árnyalattal szerepel. |
| `PROPER_ON_FIELD` | HIBA | Mező vagy osztásrész máza `proper`. |
| `STAIN_USED` | FIGYELM. | Sanguine / murrey / tenné használata. |
| `TOO_MANY_TINCTURES` | FIGYELM. | 5-nél több különböző máz (egyesítés nélkül). |

### Osztás

| Kód | Súly | Szabály |
|-----|------|---------|
| `ADJACENT_SAME_TINCTURE` | HIBA | Két szomszédos osztásrész azonos mázú (az osztás így nem létezik). |
| `GYRONNY_MORE_THAN_TWO` | HIBA | Forgósan osztott pajzsban 2-nél több máz. |
| `PARTITION_OFFSET` | FIGYELM. | Az osztóvonal jelentősen (pl. > 10% pajzsszélesség) eltolva a középtől. |
| `TIERCED_IS_ORDINARY` | INFÓ | Hármas osztás, a két szélső rész azonos → valójában mesteralak (cölöp/pólya); a leírás ennek megfelelő. |
| — | — | Osztásrészek között **nincs** színszabály (szín–szín, fém–fém osztás szabályos). |

### Mintázat

| Kód | Súly | Szabály |
|-----|------|---------|
| `VARIATION_ODD_COUNT` | FIGYELM. | Sávozott mezőváltozat páratlan számú sávval (→ mesteralakként kellene leírni). |
| `VARIATION_SAME_TINCTURES` | HIBA | A mezőváltozat két máza azonos. |
| `VARIATION_TOO_MANY` | HIBA | Mezőváltozat (sakk, rutázott, sávozott) 2-nél több mázzal (kivéve kifejezett többszínű mál). |
| `SEME_TINCTURE` | HIBA | Hintés apró ábrái megsértik a színszabályt az alatta lévő mezővel. |
| `FUR_WRONG_COLOURS` | FIGYELM. | Hermelin/mál nem a hagyományos mázpárral, és nincs megnevezve variánsként. |

### Ábrák (mesteralakok és címerképek)

A színszabály-ellenőrzés algoritmusa ábránként:

```
alatta = a felület(ek), amelyet az ábra ténylegesen takar
  - mező (area) mázai, VAGY alatta lévő ábra máza
ha ábra.máz kategóriája 'fur' vagy 'proper'            → OK
ha ábra vegyes mázú (több mázból áll, fém+szín)          → OK
ha alatta több különböző máz van (osztásvonalon átnyúlik,
   vagy mezőváltozaton/prémen fekszik)                   → OK
ha alatta egyetlen máz:
   kategória(alatta) == 'fur'                            → OK
   kategória(ábra) == kategória(alatta)                  → HIBA RULE_OF_TINCTURE
   (kivétel: fekete ábra színen → FIGYELM. SABLE_ON_COLOUR, közép-európai engedékenység)
```

| Kód | Súly | Szabály |
|-----|------|---------|
| `RULE_OF_TINCTURE` | HIBA | Fém a fémen vagy szín a színen. |
| `SABLE_ON_COLOUR` | FIGYELM. | Fekete ábra színes mezőn (közép-európai gyakorlatban előfordul). |
| `CHIEF_TINCTURE` | FIGYELM. | Pajzsfő a mezővel azonos kategóriájú mázban (történetileg gyakori, de kerülendő). |
| `CHARGE_SAME_AS_FIELD` | HIBA | Ábra pontosan a mező mázában (láthatatlan). |
| `CHARGE_ROTATION` | FIGYELM. | Forgatás nem 0°, ±45°, 90°, 180° (nem leírható). |
| `CHARGE_TOO_SMALL` | FIGYELM. | Egyetlen fő ábra a mező területének kb. < 25%-át foglalja (nem tölti ki a mezőt). |
| `CHARGE_GROUP_INCONSISTENT` | FIGYELM. | Azonos ábrák különböző méretben vagy mázban. |
| `CHARGE_UNPLACEABLE` | FIGYELM. | Az ábra pozíciója nem kerekíthető heraldikai pontra / elrendezésre (közép, 2-1, cölöpszerű, pólyaszerű, sarok…). |
| `CHARGE_FACING_SINISTER` | INFÓ | Ábra balra fordítva — szabályos, de a leírásnak ki kell mondania. |
| `CLOSED_CROWN_CHARGE` | FIGYELM. | Zárt korona ábra nem uralkodói címerben. |

### Külső díszek (ha lesznek)

| Kód | Súly | Szabály |
|-----|------|---------|
| `CREST_WITHOUT_HELM` | HIBA | Sisakdísz sisak / sisakkorona / csavart szalag nélkül. |
| `MANTLING_NOT_METAL_COLOUR` | FIGYELM. | Sisaktakaró nem fém + szín párból áll. |
| `TORSE_AND_CORONET` | FIGYELM. | Csavart szalag és sisakkorona egyszerre. |
| `HELM_CREST_DIRECTION` | HIBA | Sisakdísz más irányba néz, mint a sisak. |
| `SUPPORTERS_SINGLE` | INFÓ | Egyetlen pajzstartó (ritka; magyar angyalos pajzstartónál elfogadott). |

### Leírhatóság

| Kód | Súly | Szabály |
|-----|------|---------|
| `NOT_BLAZONABLE` | HIBA | A címerleírás-generátor nem tud egyértelmű leírást adni (lásd [09](09-cimerleiras.md)). |

## UI-javaslatok

- **„Szabályos mód”** (alapértelmezett): a színválasztó csak mázakat kínál; a HIBA szintű állapotot nem engedi létrehozni, vagy piros jelzést ad.
- **„Szabad mód”**: bármit enged, de a jelvényen / panelen mutatja a megsértett szabályokat (kód + magyar magyarázat).
- A szabálysértés mellé mindig egy **javaslatot** is adj (pl. „Arany mezőn ezüst helyett próbálj vörös, kék, zöld vagy fekete ábrát”).
- A leírásgenerátor kimenetét (magyar + angol) mutasd a pajzs alatt; ha a validáció hibát talál, a leírás elé tegyél ⚠ jelet.
