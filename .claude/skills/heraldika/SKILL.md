---
name: heraldika
description: A szabályos (heraldikailag helyes) címer szabályai fejezetekre bontva — pajzsalak, mázak és színszabály, osztások és osztóvonalak, mintázatok/prémek, mesteralakok, címerképek, címeregyesítés, külső díszek (sisak, korona, takaró, sisakdísz, pajzstartók), címerleírás (blazon). Használd, amikor a címerkészítőn (src/coat-of-arms) dolgozol, új osztást/mintát/címerképet/színt veszel fel, validációt írsz, címerleírást generálsz, vagy el kell dönteni, hogy egy címer szabályos-e.
---

# Heraldika – a szabályos címer

Ez a skill a The Middle Wars címerkészítőjéhez (`src/coat-of-arms/`) gyűjti össze, **mi számít szabályos címernek**. Nem minden kép címer, és nem minden címer szabályos: a heraldikának kötött szókincse, színkészlete és szerkesztési szabályai vannak.

## Mikor olvasd el

- Új elemet adsz a `coat-database.ts`-hez (osztás, mintázat, címerkép, pajzsalak) → a megfelelő fejezet.
- Színválasztót / palettát módosítasz → [03 – Mázak](references/03-mazak.md).
- Validációt, figyelmeztetést, „szabályos-e?” jelzést írsz → [11 – Validációs szabálykészlet](references/11-validacio.md).
- Szöveges címerleírást (blazon) generálsz → [09 – Címerleírás](references/09-cimerleiras.md).

## Fejezetek

| # | Fejezet | Az alkalmazás része |
|---|---------|---------------------|
| 01 | [Alapfogalmak, a pajzs pontjai, jobb és bal](references/01-alapfogalmak.md) | minden |
| 02 | [Pajzsalak](references/02-pajzsalak.md) | *Choose escutcheon shape* (`baseInfo`, `base_N.svg`) |
| 03 | [Mázak (színek, fémek, prémek) és a színszabály](references/03-mazak.md) | minden színválasztó |
| 04 | [Osztások és osztóvonalak](references/04-osztasok.md) | *Choose field division* (`dividentImagesInfo`) |
| 05 | [Mintázatok: mezőváltozatok, prémek, hintés, damaszkolás](references/05-mintazatok.md) | *Field areas → pattern* (`patternData`) |
| 06 | [Mesteralakok (rendes címerképek)](references/06-mesteralakok.md) | jövőbeli rész / címerképek |
| 07 | [Címerképek (közönséges ábrák), testtartás, elrendezés](references/07-cimerkepek.md) | *Charges* (`chargeData`, `ChargeLayer`) |
| 08 | [Külső díszek: sisak, korona, takaró, sisakdísz, pajzstartó, jelmondat](references/08-kulso-diszek.md) | jövőbeli rész |
| 09 | [Címerleírás (blazon) – sorrend és nyelv](references/09-cimerleiras.md) | jövőbeli „leírás” kimenet |
| 10 | [Címeregyesítés (marshalling): négyelés, szívpajzs, egymás mellé helyezés](references/10-egyesites.md) | jövőbeli rész |
| 11 | [Validációs szabálykészlet a címerkészítőhöz](references/11-validacio.md) | validátor |

## A tíz legfontosabb szabály (gyors ellenőrzőlista)

1. **A pajzs kötelező**, minden más (sisak, korona, pajzstartó…) elhagyható. A címer akkor is teljes értékű, ha csak pajzsból áll.
2. **Jobb és bal a pajzsot viselő szemszögéből** értendő: a heraldikai *jobb* (dexter) a néző *bal* oldala. A jobb oldal az előkelőbb.
3. **Csak heraldikai mázak**: 2 fém (arany, ezüst), 5 szín (vörös, kék, zöld, fekete, bíbor), 2 alap-prém (hermelin, mál) + változataik. Árnyalat nincs: „világoskék” és „sötétkék” ugyanaz a kék. Kivétel: *természetes szín* (proper) címerképekre.
4. **Színszabály**: fémre fém, színre szín nem kerülhet (pl. arany kereszt ezüst mezőn hibás). Prém, osztásvonalon átnyúló vagy vegyes mázú ábra, apró részletek (nyelv, karom) kivételek.
5. **Az osztás mezői egymás mellett vannak, nem egymáson** → egy osztott pajzs két szomszédos mezője lehet szín–szín is, de a két szomszédos mező **nem lehet azonos máz** (akkor nincs osztás).
6. **Egyszerűség**: kevés máz (jellemzően 2–3), kevés, nagy, jól felismerhető ábra. A címerképek kitöltik a rendelkezésre álló helyet.
7. **Stilizálás, nem realizmus**: lapos színfelületek, erős (fekete) körvonal, nincs perspektíva, árnyékolás, színátmenet, felirat.
8. **Az ábrák alapesetben heraldikai jobbra (a néző balja felé) néznek**; az ember és az emberarc szemből (en face).
9. **Alapértelmezett elrendezések**: 1 ábra középen; 3 ábra „2 és 1” rendben; a darabszámot és az eltérő elrendezést a leírásnak ki kell mondania.
10. **Minden címernek egyértelmű szöveges leírással (blazon) rekonstruálhatónak kell lennie** — ami nem írható le, az heraldikailag nem értelmezhető.

## Terminológiai megjegyzés

A magyar heraldikai szaknyelv nem teljesen egységes (Bertényi Iván, Nyulásziné Straub Éva, Kumorovitz L. Bernát művei között is van eltérés). A fejezetek a legelterjedtebb magyar terminust adják, mellette az angol (és ahol kell, francia/német) megfelelőt, mert a nemzetközi leírások angolul a legpontosabbak. Ha bizonytalan a magyar szó, a fejezet jelzi.

## Források

- Wikipédia: *Heraldika* (hu), *Mesteralak* (hu), *Rule of tincture*, *Tincture (heraldry)*, *Blazon*, *Variation of the field*, *Ordinary (heraldry)*, *Line (heraldry)*, *Attitude (heraldry)*, *Achievement (heraldry)* (en).
- Bertényi Iván: *Új magyar címertan* (Budapest, 2003); Bertényi Iván – Pandula Attila: *Kis magyar címertan*.
- A. C. Fox-Davies: *A Complete Guide to Heraldry* (1909).
- Michel Pastoureau: *Traité d'héraldique*.
