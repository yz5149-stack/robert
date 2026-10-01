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
| SEG-06 | Canal St | at Broadway | 100 m | 1.2 m | asphalt | storm drain, Canal St subway entrance |
