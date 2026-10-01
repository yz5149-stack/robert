# Semantic Model: SoHo Site

<!-- ====================================================================
     PASTE THE INSTRUCTOR'S "SYSTEM PROMPT" HERE (step 4 of the assignment)
     ==================================================================== -->

## Overview

This model describes the physical **site**: the SoHo retail district in Lower Manhattan
(Broadway, Prince St, Spring St, Broome St, Greene St, Canal St). It lists only the
physical things in the area, their properties, and how they are arranged in space.

**What makes the SoHo site special:**
- **Canal St** is the lowest area at the south edge.
- **Cobblestone streets** (Greene St, Mercer St) have uneven Belgian-block paving.
- **Cast-iron loft buildings** have **raised loading docks** in front of them.
- **Sidewalk vault lights** (glass-block panels) cover basements under the sidewalk.
- **Subway entrances** lead down to the Prince St, Spring St and Canal St stations.

*Elevations and lengths are simplified assumptions, not survey data.*

**Units:** meters (m).

---

## Entities

### Site
The whole district.
- `name`: "SoHo, Manhattan"
- `streetSegments`, `intersections`, `buildings`: lists

### StreetSegment
A piece of street with its sidewalks, between two intersections.
- `id`, `streetName`
- `length`, `width`, `sidewalkWidth`: m
- `elevation`: m
- `slope`: %
- `surface`: `asphalt` | `concrete` | `cobblestone`

### Intersection
Where street segments meet.
- `id`, `connectedSegments`
- `hasTrafficSignal`: boolean
- `hasCurbRamp`: boolean

### Building
A shop, restaurant or loft building along a street.
- `id`, `name`
- `use`: `shop` | `restaurant` | `loft`
- `segment`: StreetSegment id
- `floors`: number
- `hasBasement`: boolean
- `entranceElevation`: m
- `hasAwning`: boolean

### LoadingDock
A raised platform in front of a loft building.
- `id`, `building`, `segment`
- `height`: m (about 0.6–1.0)
- `hasRamp`: boolean

### SidewalkVault
Glass-block panels in the sidewalk over a basement.
- `id`, `building`, `segment`
- `area`: m²
- `condition`: `intact` | `cracked` | `broken`

### SubwayEntrance
Stairs from the sidewalk down to a subway station.
- `id`, `station`, `segment`
- `width`: m

### DrainageInlet
A storm drain or manhole in the street.
- `id`, `segment`
- `type`: `storm_drain` | `manhole`
- `hasCover`: boolean

### ParkingGarage
A multi-level garage.
- `id`, `segment`
- `levels`: number
- `upperLevelElevation`: m

### StreetFurniture
Fixed objects on the sidewalk.
- `id`, `segment`
- `type`: `lamp_post` | `fire_hydrant` | `tree` | `bench` | `sign` | `newsstand`

---

## Relationships

| Subject | Relationship | Object |
|---|---|---|
| Site | consists of | StreetSegment, Intersection, Building |
| StreetSegment | connects | Intersection ↔ Intersection |
| StreetSegment | adjacent to | StreetSegment |
| Building | faces | StreetSegment |
| LoadingDock | attached to | Building |
| LoadingDock | raised above | StreetSegment |
| SidewalkVault | covers basement of | Building |
| SidewalkVault, SubwayEntrance, DrainageInlet, StreetFurniture | located on | StreetSegment |
| SubwayEntrance | leads down to | subway station |
| ParkingGarage | located on | StreetSegment |
| StreetSegment (higher elevation) | slopes down to | StreetSegment (lower elevation) |

---

## Rules

1. **Frontage:** a Building takes 20 m of frontage and a ParkingGarage 30 m. Things on the
   same side of a segment cannot overlap, and they stay at least 8 m from the segment ends.
2. **Floors:** a Building has 1–12 floors; a ParkingGarage has 1–8 levels.
3. **Loading docks:** only a `loft` Building can have a LoadingDock, at most one each.
   Dock height is 0.6–1.0 m. A loft with a dock cannot change its use.
4. **Vault lights:** a SidewalkVault can only be added in front of a Building with a
   basement, at most one each. Removing the basement removes the vault.
5. **Subway entrances:** need a sidewalk at least 3 m wide.
6. **Street furniture:** at most one item per 15 m of segment length; items on the same
   side stay at least 4 m apart.
7. **Elevation:** a StreetSegment's elevation stays between 0.5 m and 5.0 m.
8. **Derived values:**
   - Intersection elevation = mean elevation of its connected segments.
   - Segment slope (%) = (elevation of end intersection − start intersection) / length × 100.
   - Garage `upperLevelElevation` = segment elevation + levels × 3 m.
9. **Attached things go together:** removing a Building also removes its LoadingDock and
   SidewalkVault.
10. The street network (segments and intersections) is fixed: it can be edited, not deleted.

## Actions

| Action | Applies to | Rules checked |
|---|---|---|
| `add_building(segment)` | StreetSegment | 1 |
| `add_garage(segment)` | StreetSegment | 1 |
| `add_subway_entrance(segment)` | StreetSegment | 5 |
| `add_drain(segment)` | StreetSegment | — |
| `add_furniture(segment, type)` | StreetSegment | 6 |
| `change_surface(segment)` | StreetSegment | — |
| `raise / lower(segment)` (±0.2 m) | StreetSegment | 7, 8 |
| `add / remove_floor(building)` | Building, ParkingGarage | 2, 8 |
| `change_use(building)` | Building | 3 |
| `toggle_awning / toggle_basement(building)` | Building | 4 |
| `add_loading_dock(building)` | Building | 3 |
| `toggle_ramp / raise / lower(dock)` | LoadingDock | 3 |
| `add_vault(building)` | Building | 4 |
| `change_condition(vault)` | SidewalkVault | — |
| `toggle_cover(drain)` | DrainageInlet | — |
| `toggle_signal / toggle_curb_ramp(intersection)` | Intersection | — |
| `change_type(furniture)` | StreetFurniture | — |
| `remove(thing)` | anything except segments and intersections | 9, 10 |

## Example Site

**Intersections:** Prince & Broadway, Prince & Greene, Spring & Broadway,
Broome & Broadway, Broome & Greene, Canal & Broadway.

| Segment | Street | From → To | Length | Elev. | Surface | Things on it |
|---|---|---|---|---|---|---|
| SEG-01 | Prince St | at Broadway | 40 m | 3.0 m | asphalt | noodle restaurant |
| SEG-07 | Prince St | Broadway → Greene St | 150 m | 2.9 m | asphalt | lamp posts, trees |
| SEG-02 | Broadway | Prince St → Spring St | 85 m | 2.6 m | concrete | Spring St subway entrance, newsstand |
| SEG-03 | Broadway | Spring St → Broome St | 85 m | 2.0 m | concrete | sidewalk vault lights |
| SEG-04 | Greene St | Prince St → Broome St | 170 m | 2.4 m | cobblestone | cast-iron lofts |
| SEG-05 | Broome St | Greene St → Broadway | 150 m | 2.2 m | asphalt | loft with loading dock + ramp, parking garage |
| SEG-08 | Broadway | Broome St → Canal St | 100 m | 1.6 m | concrete | shops, tree |
| SEG-06 | Canal St | Broadway → west | 100 m | 1.2 m | asphalt | storm drain, Canal St subway entrance |

The full example data (buildings, docks, vaults, furniture) is in `js/model.js`.
