# 05 – Mintázatok: mezőváltozatok, prémek, hintés, damaszkolás

Négy, egymástól heraldikailag **eltérő** dolog van, amit egy szerkesztőben könnyű összemosni:

| Fajta | Része a címernek? | Színszabály |
|-------|-------------------|-------------|
| **Mezőváltozat** (sávozás, sakkozás…) | igen, ez maga a mező | a változat 2 mázára nem vonatkozik; a rá kerülő ábra bármilyen |
| **Prém** (hermelin, mál) | igen, ez egy máz | nem vonatkozik |
| **Hintés** (semé) | igen, a mező része | **vonatkozik** a hintett apró ábrákra |
| **Damaszkolás** (diapering) | **nem** – csak díszítés | nem értelmezhető |

## 1. Mezőváltozatok (variations of the field)

A mezőt **ismétlődő, egyenlő** részekre bontó minta, **két** (ritkán több) mázzal váltakozva.

| Magyar | Angol | Leírás és szabály |
|--------|-------|-------------------|
| **pólyázott** (vízszintesen sávozott) | barry (of 6, 8…) | **páros** számú vízszintes sáv; az **első** megnevezett máz a **legfelső** sáv. 10+ sáv: *barruly* |
| **cölöpözött** (függőlegesen sávozott) | paly (of 6…) | páros számú függőleges sáv; az első máz a heraldikai **jobb** szélső |
| **harántsávozott** | bendy | átlós sávok (heraldikai jobb felsőből) |
| **balharántsávozott** | bendy sinister | ellenkező irányú átlók |
| **szarufásan sávozott** | chevronny | egymásba illő szarufák |
| **sakkozott** | chequy | sakktábla; legalább kb. **4×4**, általában 5–7 sor; a jobb felső kocka máza az első |
| **rutázott** (rombuszos) | lozengy | haránt- és balharánt vonalak, rombuszok sakkozva |
| **orsózott** | fusilly | mint a rutázott, de keskenyebb, nyújtott rombuszok |
| **pólyázott-harántolt** | barry-bendy, paly-bendy | kombinált sakkszerű rács |
| **forgósan osztott** | gyronny | lásd [04](04-osztasok.md) |
| **falazott** | masoned | téglafal; a megnevezett máz a **habarcs** |

Szabályok:

- **Páros szám**: sávozott mezőben (pólyázott, cölöpözött, harántsávozott) a sávok száma **páros**, így a két szélső sáv eltérő mázú. Páratlan számnál (pl. 7 sáv, a széleken azonos máz) nem sávozott mezőről, hanem **mesteralakokról** van szó: pl. 3 vörös pólya ezüst mezőben.
- Ha a leírás nem ad számot, a rajzoló **páros** számot választ (pólyázott: tipikusan 6 vagy 8).
- Csak **két** máz váltakozik (kivétel: ritka, kifejezetten megnevezett többmázú változatok).
- A mezőváltozat egyik máza fém, a másik szín legyen — ez nem kötelező, de a láthatóság miatt erősen ajánlott.
- A mezőváltozatra kerülő ábra **bármilyen** mázú lehet, de olyat válassz, amely mindkét mázon látszik.
- Mesteralak is lehet mezőváltozattal kitöltve (pl. sakkozott harántpólya: a kockák a pólya irányát követik).
- Díszes osztóvonal is alkalmazható (pl. *hullámosan pólyázott* = víz).

## 2. Prémek

Részletesen: [03 – Mázak](03-mazak.md). Rajzi szabályok:

- **Hermelin**: a farkak (stilizált: lándzsahegy + 3 pötty, vagy régiesebben valósághű farok) **szabályos rácsban**, sorról sorra eltolva. Alapesetben ezüst (fehér) mezőn fekete.
- **Mál**: harang/mókusbőr alakú darabok **váltakozó sorokban**, sorról sorra fél darabnyi eltolással; ezüst és kék, az ezüst felül (a „harangok” csúcsukkal felfelé). Más mázakkal: „*X és Y mázú mál*”.
- A prém **egy máznak** számít: egy hermelin mezőn álló vörös oroszlán szabályos; egy hermelin pólya kék mezőn szabályos.

## 3. Hintés (semé)

A mezőt **sok apró, azonos ábra** borítja egyenletesen, a szélen **elvágva**:

- *liliomokkal hintett* (semé-de-lis), *csillagokkal hintett*, *keresztekkel hintett* (crusily), *tuskókkal hintett* (billetty), *cseppekkel hintett* (goutté).
- Speciális nevek: aranypénzekkel hintett (**bezanté**), ezüstpénzekkel (**platé**).
- A hintés **a mező része** → a leírásban a mező után vessző nélkül következik.
- **A színszabály vonatkozik rá**: fém mezőn színes, színes mezőn fém apró ábrák.
- Ha az ábrák **száma megadott** (pl. 7 csillag), akkor nem hintés, hanem elhelyezett címerképek → [07](07-cimerkepek.md).
- A hintésen elhelyezett fő ábra a hintés fölött van; a fő ábra alatt a hintés nem látszik.

## 4. Damaszkolás (diapering)

- Finom, egyszínű (a mező mázának sötétebb/világosabb tónusában rajzolt) **ornamentális díszítés** üres mezőfelületen.
- **Nem része a címernek**, a leírás nem említi (az angol heraldikában biztosan; a francia néha kiírja). A damaszkolt és a sima mező **ugyanaz a címer**.
- Csak tónuson belül maradhat: nem lehet olyan erős, hogy új máznak vagy ábrának tűnjön.

## Az alkalmazás mintázatai (`patternData`)

| Név a kódban | Heraldikai értelmezés | Megjegyzés |
|--------------|-----------------------|------------|
| `Stripes` | pólyázott / cölöpözött (irány szerint) | a sávszám legyen **páros**; 2 máz |
| `Squares` | **sakkozott** | 2 máz; `multipleColors` jó irány |
| `Diamonds` | **rutázott** | jelenleg **3** színt enged (`#FF0000`, `#000000`, `#0281c9`) → heraldikailag 2 máz a szabályos; a 3 szín nem szabályos mezőváltozat |
| `Circle` | egy **korong** (roundel) – ha ismétlődő, korongokkal hintett | |
| `3 circles` | 3 korong / korongokkal hintett | |
| `Ring` | **gyűrű** (annulet) hintve | |
| `Jean de Montfort` | **hermelin** (Bretagne hermelinje) | prém; alapesetben ezüst mező + fekete farkak, ne legyen tetszőleges színű, vagy legyen ellenhermelin/aranyhermelin variáns |

Ajánlások:

- A mintázat színeit is a **mázlistára** korlátozd.
- Hintésnél ellenőrizd a színszabályt (alapmező ↔ minta ábrái).
- Mezőváltozatnál (sávok, sakk, rutázás) a két máz **ne egyezzen**, és a szélső elemek száma legyen páros.
- Érdemes felvenni: **mál**, **pólyázott (páros számválasztóval)**, **harántsávozott**, **falazott**.
