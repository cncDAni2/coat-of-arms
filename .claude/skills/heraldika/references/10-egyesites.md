# 10 – Címeregyesítés (marshalling)

Több címer **egyetlen pajzson** való egyesítése (házasság, öröklés, birtok, tisztség jelzésére). Formailag hasonlít az osztásra, de **minden rész önálló címer**, saját mezővel és ábrákkal. Ezért **a színszabály az egyes részcímereken belül** értelmezendő, a részcímerek határán nem.

## Módszerek

| Magyar | Angol | Leírás |
|--------|-------|--------|
| **egymás mellé helyezés (hasított egyesítés)** | impalement | hasított pajzs: jobb oldalon az egyik (pl. a férj), bal oldalon a másik (a feleség) teljes címere |
| **felezés** | dimidiation | mindkét címer **fele** kerül egymás mellé (középen elvágva) — régies, mert kétértelmű; az impalement felváltotta |
| **négyelés** | quartering | 4 (vagy több) negyed; a negyedekben az örökölt címerek |
| **szívpajzs** | inescutcheon / escutcheon of pretence | kis pajzs a nagy pajzs közepén; jellemzően a **saját/ősi** családi címer vagy (angol) örökös feleség címere |
| **szívpajzs a szívpajzsban** | | uralkodói címerek többszintű egyesítése |
| **pajzsfő / telek kegyelmi jelként** | augmentation | uralkodói kegy jele (pl. a magyar főúri címerekben a kettős kereszt vagy a Szent Korona) |

## Szabályok

- **Rang és sorrend**: a legelőkelőbb (vagy legősibb, saját) címer kerül az **1. negyedbe** (heraldikai jobb felső) vagy a **szívpajzsba**.
- **Számozás**: sorról sorra, jobbról balra (lásd [09](09-cimerleiras.md)).
- Ha csak **két** címert négyelünk: 1 = 4 és 2 = 3.
- Páratlan számú címer: az első ismétlődik az utolsó helyen, hogy a mezőszám kitöltődjön (pl. 3 címer → 4 negyed: 1, 2, 3, 1).
- Sok mező (6, 8, 16…) esetén is **sorokba** rendezett (*quarterly of six* = 2 sor × 3).
- **Rámák és tornagallérok** impalement esetén általában **nem folytatódnak** az osztásvonalon túl (a fél rámát elhagyják a középvonalnál).
- **Courtoisie**: egymás mellé helyezett címerekben az ábrák egymás felé fordíthatók.
- Az egyesített pajzs részei saját osztással is rendelkezhetnek (negyed a negyedben = *grand quarter*).

## Magyar sajátosságok

- A 17–18. századi bárói és grófi címerek gyakran **négyeltek szívpajzzsal**: a szívpajzsban az ősi családi címer, a negyedekben új (adományozott) elemek.
- A **magyar királyi (ország)címer** és a **közép-** és **nagycímer** az egyesítés tankönyvi példái: a kiscímer (hasított: Árpád-sávok + kettős kereszt) a társországok címereivel négyelve.

## Az alkalmazásban

Jelenleg nincs egyesítés. Ha lesz, a **négyelt osztás** `quaterly` újrafelhasználható úgy, hogy minden mező **saját al-címert** (osztás + mázak + ábrák) kapjon — azaz a `CoaState`-nek rekurzívvá kell válnia (egy mező = egy beágyazott címer). A validátor a színszabályt al-címerenként futtassa.
