# 03 – Mázak és a színszabály

## A mázak rendszere

A heraldika **zárt színkészletet** használ. A mázak összefoglaló neve: *tinktúrák* (tinctures).

### Fémek (metals)

| Magyar | Angol (blazon) | Francia | Rövidítés | Ábrázolás |
|--------|----------------|---------|-----------|-----------|
| **arany** | Or | or | o. | sárga vagy aranyszín |
| **ezüst** | Argent | argent | a. / ar. | fehér vagy ezüstszín |

### Színek (colours)

| Magyar | Angol | Francia | Rövidítés |
|--------|-------|---------|-----------|
| **vörös** | Gules | gueules | gu. |
| **kék** | Azure | azur | az. |
| **zöld** | Vert | sinople | vt. |
| **fekete** | Sable | sable | sa. |
| **bíbor** | Purpure | pourpre | purp. |

A magyar heraldikában a fő színek: **vörös, kék, zöld, fekete**; a bíbor ritka.

### Foltok / ritka színek (stains) — kerülendők

*Sanguine* (vérvörös), *murrey* (eperszín), *tenné* (narancs/barna). Angol különlegességek; a magyar és a kontinentális heraldikában gyakorlatilag nem fordulnak elő. Új címerben **ne kínáld fel** alapmázként. A színszabály szempontjából **színnek** számítanak.

### Prémek (furs)

| Magyar | Angol | Leírás |
|--------|-------|--------|
| **hermelin** | Ermine | ezüst (fehér) mező fekete hermelinfarkokkal |
| **ellenhermelin** | Ermines | fekete mező ezüst farkokkal |
| **aranyhermelin** | Erminois | arany mező fekete farkokkal |
| **fekete-arany hermelin** | Pean | fekete mező arany farkokkal |
| **mál** (evet) | Vair | ezüst és kék, váltakozó harang (mókusprém) alakú darabok |
| **ellenmál** | Counter-vair | ugyanaz, de a darabok tükrözve, azonos máz találkozik |
| **mál (más mázakkal)** | Vairé / vairy … | mál-minta más fém + szín párral; a leírás megnevezi a mázakat |
| **cölöpmál / támasztékmál** | Potent | T alakú (mankós) darabok |
| **szőrmés** | Kürsch (német) | barna, szőrös darabok |

A prém **önálló máz**, sem fém, sem szín → a színszabály nem vonatkozik rá (lásd lent).

### Természetes szín (proper)

**Nem máz**, hanem jelölés: az ábra a valóságban megszokott színében jelenik meg (pl. *természetes színű medve*, *természetes színű fa*). Csak **címerképre** alkalmazható, **mezőre soha**. Mérsékelten használandó; a klasszikus heraldika a heraldikai mázat preferálja. A magyar címereslevelekben (17–18. sz.) gyakoribb, mint a nyugati heraldikában.

Rokon: **testszín** (carnation) emberi bőrre.

## Árnyalat

- A heraldika **nem ismer árnyalatot**: csak „kék” van, nincs „világos-” vagy „sötétkék”. Bármely árnyalat elfogadható, amely **nem téveszthető össze** egy másik mázzal.
- Ugyanazon címeren belül egy máz **mindig ugyanazzal** az árnyalattal jelenjen meg.
- Az arany ábrázolható sárgával vagy fémes arannyal; az ezüst fehérrel vagy szürkés-fémes ezüsttel. A kettőt **nem szabad keverni** (egy címeren belül következetesen).

### Ajánlott paletta (nem kötelező, a mai heraldikai művészetben elterjedt értékek)

| Máz | Hex |
|-----|-----|
| arany | `#FCDD09` (vagy `#F2C200`) |
| ezüst | `#FFFFFF` (vagy `#E7E7E7`) |
| vörös | `#DA121A` |
| kék | `#0F47AF` |
| zöld | `#078930` |
| fekete | `#000000` |
| bíbor | `#9C2E8E` |
| testszín | `#F6C9A4` |
| természetes barna | `#8B5A2B` |

> **Az alkalmazásban**: a jelenlegi `<input type="color">` tetszőleges hexet enged. Szabályos címerhez a színválasztót a **mázlistára** kell korlátozni (opcionálisan „szabad szín” módban figyelmeztetéssel). Lásd [11 – Validáció](11-validacio.md).

## Színszabály (rule of tincture)

> *„Fémre fém, színre szín nem tehető.”*

Vagyis egy **ábra** (mesteralak vagy címerkép) mázának különböznie kell a **közvetlenül alatta lévő** felület mázának kategóriájától:

- fém mezőn → **színes** ábra (arany mezőn vörös oroszlán ✔),
- színes mezőn → **fém** ábra (kék mezőn arany liliom ✔),
- ✘ arany mezőn ezüst csillag (fém a fémen),
- ✘ vörös mezőn kék pólya (szín a színen).

A szabály célja a **láthatóság** (a pajzsot messziről is fel kellett ismerni) — ezért a nyugati heraldika szinte kivétel nélkül betartja.

### Elfogadott kivételek

1. **Prémek**: hermelin, mál és változataik bármire kerülhetnek, és bármi kerülhet rájuk.
2. **Természetes színű** ábrák (proper) nem esnek a szabály alá.
3. **Osztás**: egy osztott pajzs mezői *egymás mellett* vannak, nem egymáson → **vörössel és kékkel hasított** mező szabályos. (De két szomszédos mező **nem lehet azonos máz**.)
4. **Osztott vagy mintázott mezőre** (fém + szín) kerülő ábra bármilyen mázú lehet — célszerűen olyan, amely mindkét részen jól látszik.
5. **Vegyes mázú ábra** (pl. arannyal és vörössel sakkozott sas) bármilyen mezőre tehető.
6. **Osztásvonalon átnyúló ábra**: ha az ábra több eltérő mázú mezőt is érint, vagy **ellentett színezésű** (counterchanged, „váltakozó mázú”) — mindig szabályos.
7. **Apró részletek**: fegyverzet (karom, csőr, szarv, pata), nyelv, korona, szem — ezek a test mázától eltérő, akár a mezővel egyező kategóriájú mázban is lehetnek (*armed and langued*). Pl. vörös mezőn arany oroszlán **kék** nyelvvel és karmokkal szabályos.
8. **Vékony keretezés** (fimbriation): egy ábra köré húzott keskeny fém/szín szegély „feloldja” a szabálysértést (pl. a brit zászló keresztjei).
9. **Ráma (bordure)**: több szerző (Boutell) szerint mentes; a gyakorlatban kerüld a sértést.
10. **Pajzsfő**: történetileg a leggyakoribb szabálysértés (pl. francia városcímerek kék, liliomos pajzsfője vörös mezőn). Francia leírásban ilyenkor *cousu* („felvarrt”). Új címerben **kerülendő**.
11. **Hegy, hármashalom zöldben kék mezőn** (ég–föld ábrázolás) és **víz** ábrázolása: elnézett, de nem ajánlott.
12. **Megkülönböztető és kegyelmi jelek**, címerbővítések, sisakdísz és pajzstartók: a szabályon kívül esnek (kivéve, ha maguk is „mezőként” viselkednek, és ábra kerül rájuk).

### Regionális eltérés

- **Közép- és Kelet-Európában** (német, lengyel, magyar, cseh körben) a **fekete** néha fém és szín közötti átmenetként viselkedik; fekete ábra színes mezőn itt gyakoribb, mint nyugaton. Új címerben is csak megengedett figyelmeztetéssel.
- A magyar történeti címerek között több szabálysértő van (pl. a nemzeti címer **zöld hármashalma vörösben**). Ezek **történeti örökség**, nem minta.

## Hány mázat használjunk?

- A legtisztább címerek **2 mázból** állnak (egy fém + egy szín).
- **3–4 máz** még jól olvasható.
- 5+ máz egy (nem egyesített) címerben **túlzsúfolt**: figyelmeztetésre okot ad, de nem szabálysértés.

## Fekete-fehér jelölés (Petra Sancta-féle vonalkázás, 1638)

Nyomtatásban, metszeten a mázakat vonalkázás jelöli:

| Máz | Jelölés |
|-----|---------|
| ezüst | üres (sima) |
| arany | pontozott |
| vörös | függőleges vonalak |
| kék | vízszintes vonalak |
| fekete | vízszintes + függőleges (rács) |
| zöld | átlós, heraldikai jobb felsőből bal alsóba (a néző bal felsőjéből) |
| bíbor | átlós, heraldikai bal felsőből jobb alsóba |
| prém | a megfelelő fém/szín jelöléseiből |

Hasznos lehet egy „fekete-fehér / metszet” exportmódhoz.
