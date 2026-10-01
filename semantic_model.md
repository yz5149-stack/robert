# Semantic Model: SoHo Site During a Flash Flood

<!-- ====================================================================
     PASTE THE INSTRUCTOR'S "SYSTEM PROMPT" HERE (step 4 of the assignment)
     ==================================================================== -->

## Overview

This model describes only the **site**: the SoHo retail district in Lower Manhattan
(Broadway, Prince St, Spring St, Broome St, Greene St, down to Canal St) and how it
changes during a **flash flood**. It answers spatial questions such as: where is the
water, how deep is it, where will it be deeper soon, which places stay dry, and which
spots are hazardous.

**What makes SoHo special in a flood:**
- **Canal St** is the lowest area (an old drainage canal), so water collects there first.
- **Cobblestone streets** (Greene St, Mercer St) are uneven and slippery when wet.
- **Cast-iron loft buildings** have **raised loading docks** that stay dry.
- **Sidewalk vault lights** (glass panels over basements) are hidden and weak under water.
- **Basement shops** and **subway entrances** flood fast; water pours down their stairs.
- The old **combined sewer system** overflows in heavy rain.

*Elevations, lengths and depths are simplified assumptions, not survey data.*

**Units:** meters (m), water depth in cm, time in minutes (min).

---

## Entities

### Site
- `name`: "SoHo, Manhattan"
- `segments`, `intersections`: lists
- `floodAlertLevel`: `none` | `advisory` | `warning` | `emergency`

### StreetSegment
A piece of street or sidewalk between two intersections (an edge of the map).
- `id`, `streetName`
- `length`, `width`: m
- `elevation`: m (lower = floods sooner)
- `surface`: `asphalt` | `concrete` | `cobblestone`
- `waterDepth`: cm
- `riseRate`: cm/min (local; faster at low spots and near overflowing drains)
- `condition`: derived from `waterDepth` (see Rule 1)
- `crowd`: `low` | `medium` | `high`

### Intersection
A node of the map where segments meet.
- `id`, `connectedSegments`
- `signalWorking`: boolean (power can fail)

### Building
A shop, restaurant or loft on a segment.
- `id`, `name`, `use`: `shop` | `restaurant` | `loft`
- `segment`: StreetSegment id
- `isBasementLevel`: boolean
- `isOpen`: boolean

### LoadingDock
A raised platform in front of a loft building.
- `id`, `segment`
- `height`: m (about 0.6–1.0)
- `hasRamp`: boolean

### SidewalkVault
Glass-block panels over a basement.
- `id`, `segment`
- `condition`: `intact` | `cracked` | `broken`

### SubwayEntrance
- `id`, `station`, `segment`
- `isFlooding`: boolean

### DrainageInlet
- `id`, `segment`
- `state`: `normal` | `clogged` | `overflowing`
- `coverPresent`: boolean

### Obstacle
- `id`, `segment`
- `type`: `debris` | `floating_object` | `fallen_sign` | `parked_vehicle` | `open_manhole` | `downed_power_line`

### SafeZone
A place that stays dry and can be used for shelter.
- `id`, `segment`
- `type`: `loading_dock` | `raised_plaza` | `garage_upper_level` | `depot`
- `elevation`: m

### FloodEvent
- `severity`: `minor` | `moderate` | `severe`
- `trend`: `rising` | `stable` | `receding`
- `startTime`, `expectedPeakTime`: HH:MM

---

## Relationships

| Subject | Relationship | Object |
|---|---|---|
| Site | consists of | StreetSegment, Intersection |
| StreetSegment | connects | Intersection ↔ Intersection |
| Building, LoadingDock, SidewalkVault, SubwayEntrance, DrainageInlet, Obstacle, SafeZone | located on | StreetSegment |
| FloodEvent | raises water on | StreetSegment |
| Water | flows from higher to lower | StreetSegment → StreetSegment |
| DrainageInlet (clogged / overflowing) | worsens flooding on | StreetSegment |
| SubwayEntrance | drains water from | StreetSegment |
| SidewalkVault | covers basement of | Building |
| LoadingDock | stays dry above | StreetSegment |

---

## Site Rules

1. **Condition from depth:** `dry` = 0 cm, `wet` = 0–3 cm, `shallow` = 3–8 cm, `deep` > 8 cm.
2. **Rising water:** while `trend = rising`, `waterDepth(t) = waterDepth + riseRate × t`.
   While `receding`, depth decreases instead.
3. **Low spots first:** a lower `elevation` means a higher `riseRate`; Canal St floods first.
4. **Drains:** a segment with an `overflowing` drain or a missing cover is hazardous
   whenever `waterDepth > 0`.
5. **Vault lights:** a vault that is `cracked`, `broken`, or under water is hazardous.
6. **Subway entrances:** the 2 m around a flooding entrance has strong flow toward the stairs
   and is hazardous; its exit path must stay clear for people.
7. **Cobblestone:** a wet cobblestone segment is slippery.
8. **Basements:** basement-level buildings flood before street-level ones.
9. **Dry spots:** a LoadingDock or SafeZone stays dry as long as its height/elevation is
   above the water on its segment.
10. **Hazard blocks segment:** a `downed_power_line` or `open_manhole` makes the whole
    segment hazardous.

## Site Changes (Events)

- `flood_rise(segment, t)`: depth increases per Rule 2.
- `flood_recede(segment, t)`: depth decreases; `trend = receding`.
- `spawn_obstacle(segment, type)`: debris appears; floating objects drift downhill.
- `drain_overflow(inlet)`: `state = overflowing`.
- `close_building(building)`: `isOpen = false`.
- `power_outage(intersection)`: `signalWorking = false`.
- `raise_alert(level)`: `Site.floodAlertLevel` changes.

---

## Example Site Snapshot

**Flood:** `moderate`, `rising`. **Alert level:** `warning`.

| Segment | Street | Length | Elev. | Surface | Depth now | Rise rate | Depth in 10 min | Features |
|---|---|---|---|---|---|---|---|---|
| SEG-01 | Prince St at Broadway | 40 m | 3.0 m | asphalt | 0 cm | 0.1 | 1 cm (wet) | noodle restaurant |
| SEG-07 | Prince St, Broadway → Greene St | 150 m | 2.9 m | asphalt | 0 cm | 0.1 | 1 cm (wet) | — |
| SEG-02 | Broadway, Prince St → Spring St | 85 m | 2.6 m | concrete | 4 cm | 0.5 | 9 cm (deep) | Spring St subway entrance flooding, high crowd |
| SEG-03 | Broadway, Spring St → Broome St | 85 m | 2.0 m | concrete | 6 cm | 0.6 | 12 cm (deep) | vault lights under water |
| SEG-04 | Greene St, Prince St → Broome St | 170 m | 2.4 m | cobblestone | 3 cm | 0.3 | 6 cm (shallow) | slippery |
| SEG-05 | Broome St, Greene St → Broadway | 150 m | 2.2 m | asphalt | 1 cm | 0.3 | 4 cm (shallow) | loft with loading dock + ramp |
| SEG-06 | Canal St at Broadway | 100 m | 1.2 m | asphalt | 15 cm | 1.0 | 25 cm (deep) | overflowing drain |

**SafeZone:** `SZ-1`, upper level of a parking garage on Broome St (SEG-05), elevation 6 m.

**What the site model tells us:**
- Broadway (SEG-02, SEG-03) and Canal St (SEG-06) will be `deep` or hazardous within 10 min.
- The western route, Prince St → Greene St → Broome St (SEG-07 → SEG-04 → SEG-05),
  stays below 8 cm for at least the next 10 min, but Greene St is slippery cobblestone.
- The loading dock on SEG-05 and the garage SafeZone SZ-1 are the dry spots in this area.
