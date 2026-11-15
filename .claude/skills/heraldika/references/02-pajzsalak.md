# 02 – Pajzsalak

## Alapelv

A pajzs **alakja nem része a címernek**: a címerleírás nem rögzíti, ugyanaz a címer bármilyen heraldikai pajzsformán megjelenhet. A pajzsalak **korstílus** és **műfaj** kérdése. Ezért a pajzsalak választása mindig szabad – de **heraldikai** pajzsformának kell lennie, és az alakot a mezőnek jól ki kell töltenie.

Kivételek, ahol az alak *jelentést hordoz*:

- **rombusz (lozenge)** – angol/francia hagyományban nők (hajadonok, özvegyek) címere;
- **ovális / kartus** – egyházi személyek, illetve barokk díszcímerek;
- **kör alakú** – pecsétek, ritkán.

## Történeti pajzsformák

| Forma | Kor | Jellemző |
|-------|-----|----------|
| **Háromszögű (normann/„vasaló”) pajzs** (heater) | 13–14. sz. | Egyenes felső él, ívelt oldalak csúcsba futnak. A klasszikus, legtisztább heraldikai forma. |
| **Kerektalpú (spanyol) pajzs** | 14. sz.-tól | Egyenes oldalak, félkör alakú talp. Négyelésre, sok mezőre a legalkalmasabb. |
| **Csúcsos talpú (francia) pajzs** | 15–17. sz. | Egyenes oldalak, a talp közepén kis csúcs. |
| **Csücskös / tárcsapajzs** (tárcsa, *Tartsche*) | 15. sz. | Aszimmetrikus, jobb felső részén **lándzsatámasz-kivágás**. Gótikus, német–magyar körben kedvelt. |
| **Olasz „lóhomlok” pajzs** (testa di cavallo) | reneszánsz | Lófej-páncélra emlékeztető, ívelt. |
| **Barokk kartus** | 17–18. sz. | Csigavonalas keret, sokszor ovális mező. |
| **Ovális (egyházi)** | | |
| **Rombusz** | | nők címere (lásd fent) |

A magyar nemesi címereslevelek 15–16. században jellemzően **háromszögű, csücskös és kerektalpú** pajzsot, a 17. századtól egyre gyakrabban **kerektalpú (spanyol)** és **barokk** pajzsot használnak.

## Arányok

- A klasszikus pajzs **szélesség : magasság ≈ 7 : 8** (a modern ábrázolásban 5:6 – 6:7 is elfogadott).
- A pajzs ne legyen túl keskeny: a mesteralakok (cölöp, pólya, kereszt) arányai a pajzs **szélességéhez** viszonyítottak; egy nagyon nyúlánk pajzson a vízszintes és függőleges osztások torzulnak.
- A pajzs felső széle (pajzsfő) alapesetben **egyenes**.

## Pajzs mint ábra

A pajzs maga is lehet címerkép (**kispajzs / szívpajzs**, inescutcheon) → [06](06-mesteralakok.md), [10](10-egyesites.md). Ilyenkor ugyanazt a formát illik használni, mint a fő pajzs.

## Szabályok összefoglalva

- [x] Bármely heraldikai pajzsforma használható; a forma nem változtatja meg a címert.
- [x] Egy címeren belül (fő pajzs, szívpajzs, egyesített pajzsok) **egységes** stílusú formát használj.
- [x] Rombuszt és ovális formát csak a jelentésének megfelelően (nő, egyházi személy) ajánlott kínálni, vagy tájékoztató szöveggel.
- [ ] Nem heraldikai formák (csillag, szív, sokszög, kör a pajzs helyett) **nem szabályosak** pajzsként.

## Az alkalmazásban

- `baseInfo` (`coat-database.ts`) + `public/coat-of-arms/base_N.svg`: a pajzsalakok. `offsetY` / `perBendDegOffset` a geometria korrekciója, nem heraldikai adat.
- A pajzs **körvonala** (`stroke`) nem máz, hanem rajzi elem: alapesetben fekete, és nem esik a színszabály alá.
- A háttérszín (`backgroundColor`) a pajzson kívüli terület, heraldikailag nem része a címernek.
