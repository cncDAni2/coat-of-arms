# 01 – Alapfogalmak

## Mi a címer?

A címer a középkori pajzsfestésből kialakult, **öröklődő, állandó** jelkép, amely egy személyt, családot, testületet vagy területet azonosít. A heraldika (címertan) két része:

- **címerelmélet** – a szabályok, a szókincs, a címerleírás;
- **címerművészet** – a megrajzolás stílusa.

A szabályok az **elméletre** vonatkoznak: ugyanaz a címerleírás sokféle stílusban megrajzolható, és mindegyik rajz ugyanaz a címer. Amit a leírás nem rögzít (pontos árnyalat, vonalvastagság, az oroszlán sörényének rajzolata), az **művészi szabadság**.

## A teljes címer (achievement) részei

Alulról felfelé / belülről kifelé:

| Rész | Angol | Kötelező? |
|------|-------|-----------|
| **Pajzs** (mezővel és ábrákkal) | escutcheon, shield | **igen – egyedül ez kötelező** |
| Sisak | helm | nem |
| Sisakkorona / rangkorona | crest coronet / coronet of rank | nem |
| Sisaktakaró (foszladék) | mantling | nem |
| Csavart szalag (sisakpárna) | torse, wreath | nem |
| Sisakdísz | crest | nem |
| Pajzstartók | supporters | nem |
| Talapzat | compartment | nem |
| Jelmondat (jelszalag) | motto | nem |
| Rendjelek, címerpalást, címersátor | orders, mantle, pavilion | nem |

Részletek: [08 – Külső díszek](08-kulso-diszek.md).

## Jobb és bal (dexter / sinister)

A pajzsot mindig **a viselője szemszögéből** nézzük, mintha a mellén tartaná:

- **heraldikai jobb (dexter)** = a néző **bal** oldala,
- **heraldikai bal (sinister)** = a néző **jobb** oldala.

A jobb oldal az előkelőbb: a mezők számozása, a mázak felsorolása, az ábrák alapértelmezett iránya mind a jobb oldalhoz igazodik.

> **Fejlesztői szabály:** a kódban és a felületen a „jobb/bal” szót mindig heraldikai értelemben használd, vagy írd ki egyértelműen („a néző szemszögéből balra”). A canvas x=0 oldala = heraldikai **jobb**.

## A pajzs nevezetes pontjai és sávjai

```
  A  B  C        A = jobb felső sarok (dexter chief)
                 B = felső közép (middle chief)
     D           C = bal felső sarok (sinister chief)
  E  F  G        D = becsületpont (honour point)
     H           F = szívpont / középpont (fess point)
  I  J  K        E, G = jobb / bal oldal (dexter / sinister flank)
                 H = köldökpont (nombril point)
                 I, J, K = jobb alsó, alsó közép, bal alsó (base)
```

Sávok: **pajzsfő** (felső harmad, chief), **pajzsközép** (fess), **pajzstalp/pajzsláb** (alsó harmad, base). Függőlegesen: **jobb oldal**, **cölöphely / közép** (pale), **bal oldal**.

Az osztások és ábrák elhelyezése ezekre a pontokra hivatkozik (pl. a forgórészes osztás sugarai a szívpontban, F-ben találkoznak).

## Mező, alap, ábra

- **Mező** (field): a pajzs színezett felülete.
- Ha a pajzs **osztott**, minden rész külön mező; ezeket a mázak felsorolásánál jobbról balra, felülről lefelé soroljuk.
- **Címerábra**: minden, ami a mezőn van. Két nagy csoport:
  - **mesteralakok** (rendes címerképek, ordinaries) – geometriai, a pajzs széléhez igazodó alakzatok → [06](06-mesteralakok.md);
  - **címerképek** (közönséges ábrák, charges) – élőlények, tárgyak, égitestek stb. → [07](07-cimerkepek.md).
- Rétegek: mező → mesteralak → mesteralakon/mező fölött lévő címerkép → a címerképen lévő további ábra. A színszabály mindig a **közvetlenül alatta lévő** rétegre vonatkozik.

## Szabályos és szabálytalan címer

- **Szabályos**: heraldikai mázakat használ, betartja a színszabályt, egyértelműen leírható, stilizált.
- **„Tudakolni való címer”** (armes à enquérir): szándékosan szabálytalan, hogy kérdést ébresszen (klasszikus példa: a Jeruzsálemi Királyság arany keresztjei ezüstön). Ez ritka kivétel, nem minta.
- **Szabálytalan / heraldikailag hibás**: tájkép-szerű ábrázolás, árnyékolás, felirat, nem heraldikai színek, leírhatatlan elrendezés. A 18–19. századi ún. „tájképcímerek” ilyenek – a heraldika hanyatlásának példái.
- **Történeti kivételek** léteznek (pl. a magyar címer zöld hármashalma vörös mezőben; Albánia fekete sasa vörösön) — ezek a szabályok kodifikálása előtt keletkeztek, vagy közép-európai engedékenységet mutatnak. Új címer tervezésénél **nem** szolgálnak precedensként.
