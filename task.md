# Plan de Implementare: Harta Interactivă Indoor OSACE

## Status General: Finalizat cu Succes (Toate Fazele 1, 2 și 3 Complete)
- **Branch**: `feature/indoor-interactive-map`

---

## Faza 1 — Vizualizare & Bază Hartă (Core Display)
- [x] 1.1 Inițializare: creare branch `feature/indoor-interactive-map` și fișier `task.md`
- [x] 1.2 Extragere date `floorOutlines.js` din fișierele SVG (B, P, E1, E2, E3)
- [x] 1.3 Creare `buildingData.js` în `osace-mobile/src/features/Map/data`:
  - Normalizare date din `OSACE_building.json`
  - Corecții etaj 3 (`corridor-K206` -> `corridor-K306`, `room-K203` -> `room-K303`)
  - Calcul centroizi și boundings pentru fiecare sală
  - Indexare pentru căutare și filtrare pe etaj
- [x] 1.4 Creare `FloorSelector.js` în `osace-mobile/src/features/Map/components`:
  - Selector flotant etaje (B, P, E1, E2, E3)
  - Feedback tactil cu `expo-haptics`
  - Integrare temă (Light / Dark)
- [x] 1.5 Rescriere `InteractiveMap.js` în `osace-mobile/src/features/Map/components`:
  - Sistem coordonate unificat (viewBox `0 0 1346.8 1392.0`)
  - Randare optimizată din JSON (Building Outline + Coridoare + Săli)
  - Zoom & Pan fluid cu `@openspacelabs/react-native-zoomable-view`
  - Stilizare dinamică (selectat / implicit / categorii culori)
  - Etichete săli afișate la nivel de zoom adecvat
- [x] 1.6 Rescriere `MapScreen.js` în `osace-mobile/src/features/Map/screens`:
  - Înlocuire ecran placeholder („Stresează-l pe Berbece”)
  - Coordonare state: `activeFloor`, `selectedRoomId`, `zoomRef`
  - Dezactivare gest swipe drawer pentru a nu interfera cu pan-ul hărții
- [x] 1.7 Verificare integritate și funcționare cod Faza 1

---

## Faza 2 — Interacțiune & Detalii (Search & Room Details)
- [x] 2.1 Creare `RoomSearchBar.js` cu sugestii dinamice și auto-focus
- [x] 2.2 Creare `RoomDetailsSheet.js` cu `@gorhom/bottom-sheet` (detalii sală, suprafață, acțiune navigație)
- [x] 2.3 Implementare mecanism de centrare și focalizare animată pe sala selectată (`zoomTo` / `moveTo`)
- [x] 2.4 Rafinare culori și contrast pentru Dark Mode și Light Mode
- [x] 2.5 Verificare și testare Faza 2

---

## Faza 3 — Rutare & Navigație Indoor (A* Routing)
- [x] 3.1 Creare `navigationGraph.js`:
  - Încărcare noduri și muchii (`edge.kind`) din JSON
  - Generare automată muchii de acces `room -> corridor` (nearest neighbor)
- [x] 3.2 Configurare vertical connectors pentru scări cross-floor (mapping determinat)
- [x] 3.3 Implementare algoritm A* pathfinding (single-floor și multi-floor)
- [x] 3.4 Randare traseu animat (strat Polyline animat în `InteractiveMap.js`)
- [x] 3.5 UI îndrumare traseu (instrucțiuni etaj curent + schimbare etaj la scări)
- [x] 3.6 Curățare componente vechi / mock (`MapData.js`, `MapGHIJK_Parter.js`)
- [x] 3.7 Verificare finală integrată pe aplicația mobilă

---

## Îmbunătățiri Suplimentare (Post-Plan)
- [x] 4.1 Integrare Strat Pereți Interiori (`floorWalls.js`):
  - Extragere compound path pentru perete per etaj din SVG-urile originale (B, P, E1, E2, E3)
  - Randare vectorială cu `pointerEvents="none"` peste camere
  - Buton de comutare în antet (grid icon) pentru activare/dezactivare pereți
  - Adaptare contrast pentru temele Light și Dark
- [x] 4.2 Rezolvare Bug Centrare Cameră (Auto-Focus & Native Driver):
  - Înlocuire `moveTo` eronat cu calcul precis de offset relativ la centrul SVG (`contentCenterX - point.x`)
  - Configurare `useNativeDriver: true` pentru animația `panAnim`, prevenind eroarea de tranziție JS-to-Native
  - Eliminare apeluri duplicate și race conditions între `MapScreen` și `InteractiveMap`
- [x] 4.3 Rafinare Plan Demisol & Nomenclatură Săli:
  - Eliminat poligoanele și etichetele spațiilor tehnice de subsol (`GD06`, `B-canal-tehnic`, `B-subsol-tehnic-K`), păstrând doar conturul exterior/layout-ul clădirii
  - Redenumit `B-amfiteatru` în **Aula Constantin Belea** (hartă, căutare, fișă de detalii și graf de navigare A*)
- [x] 4.4 Umplere Fundație Demisol (Extindere Gri pe Blocurile G, K și Canal):
  - Extragere compound paths în `demisolUnfinishedAreas` din `floorOutlines.js`
  - Randare strat `Demisol_Base` în `InteractiveMap.js` cu `themeColors.corridor`, umplând uniform golurile albe de pe demisol cu griul architectural specific etajului
- [x] 4.5 Sistem Iconițe & Indicatoare Scări (`buildingStairs.js` & `StairDetailsSheet.js`):
  - Catalogare completă conectori verticali pentru fiecare etaj (B, P, E1, E2, E3) cu direcție (`up`, `down`, `both`), etaje țintă și denumiri descriptive
  - Randare badge-uri SVG moderne pe hartă cu halo de fundal, indicator vizual de direcție (▲ / ▼ / ⇅) și etichetă destinație (ex: `▲ P`, `▼ B`, `▲ E1–E3`)
  - Creare fișă dedicată `StairDetailsSheet.js` la atingerea oricărei scări, oferind comutare rapidă pe etajul țintă și centrare cameră pe aterizare


