# Semantic Model: Delivery Robot in SoHo, New York During a Flash Flood

<!-- ====================================================================
     PASTE THE INSTRUCTOR'S "SYSTEM PROMPT" HERE (step 4 of the assignment)
     ==================================================================== -->

## Overview

This model describes the **SoHo retail district in Lower Manhattan, New York City**
(Broadway, Prince St, Spring St, Greene St, Mercer St, down to Canal St), where an autonomous **sidewalk delivery robot** carries food orders from restaurants
to customers. A **flash flood** hits the street: water rises unevenly, drains may
overflow, debris appears, and people move to higher ground. The agent's job is to
reason about the space and decide what the robot should do: continue, reroute,
wait, shelter, hand off, or abort the delivery, while keeping the robot, the food,
and people safe.

**Why SoHo:** SoHo is a dense retail area with features that make flooding
spatially interesting:
- **Canal Street** at the south edge is named after an old drainage canal and is
  low-lying, so water collects there first.
- **Cobblestone (Belgian block) streets** such as Greene St and Mercer St are uneven
  and slippery when wet.
- **Cast-iron buildings** have **raised loading docks** (dry spots) and
  **sidewalk vault lights** (glass-block sidewalk panels over basements) that can be
  hidden or weak under water.
- **Basement-level shops** and **subway entrances** (Prince St, Spring St, Canal St
  stations) flood quickly, and water pours down their stairs.
- NYC's old **combined sewer system** overflows in heavy rain (e.g., the flash
  floods of Hurricane Ida in 2021 and September 2023).
- Heavy **tourist and shopper crowds** and **street vendors** on Broadway.

*Note: elevations and water depths in this model are simplified/assumed values
for the exercise, not survey data.*

**Units:** distance in meters (m), water depth in centimeters (cm), speed in m/s,
time in minutes (min), battery in percent (%).

---

## Entities

### RetailStreet
The whole environment.
- ↳ `name`: string (e.g., "SoHo, Manhattan")
- ↳ `segments`: list of StreetSegment
- ↳ `floodAlertLevel`: `none` | `advisory` | `warning` | `emergency`
- ↳ `timeOfDay`: HH:MM
- ↳ `isOpenToRobots`: boolean (the city can close the street to robots)

### StreetSegment
A walkable/drivable piece of the street, the node-to-node "edge" of the map.
- ↳ `id`: string (e.g., "SEG-03")
- ↳ `type`: `sidewalk` | `crosswalk` | `road` | `plaza` | `alley`
- ↳ `length`: m
- ↳ `width`: m
- ↳ `elevation`: m above street baseline (low spots flood first)
- ↳ `slope`: % (water flows downhill)
- ↳ `surface`: `concrete` | `asphalt` | `cobblestone` | `vault_lights` | `grate`
- ↳ `streetName`: string (e.g., "Greene St between Prince St and Spring St")
- ↳ `waterDepth`: cm (current)
- ↳ `waterFlowSpeed`: m/s (current)
- ↳ `isBlocked`: boolean
- ↳ `pedestrianDensity`: `low` | `medium` | `high`

### Intersection
Where segments meet; the "nodes" of the map.
- ↳ `id`: string (e.g., "INT-B")
- ↳ `connectedSegments`: list of StreetSegment ids
- ↳ `hasTrafficSignal`: boolean
- ↳ `signalWorking`: boolean (power may fail in a flood)
- ↳ `hasCurbRamp`: boolean

### Shop
Any store on the street (clothing, pharmacy, convenience store...).
- ↳ `id`, `name`
- ↳ `category`: `retail` | `pharmacy` | `grocery` | `service`
- ↳ `entranceSegment`: StreetSegment id
- ↳ `entranceElevation`: m (raised entrances stay dry longer)
- ↳ `isBasementLevel`: boolean (below-street shops flood first)
- ↳ `isOpen`: boolean
- ↳ `hasAwning`: boolean (can shelter a robot from rain)
- ↳ `acceptsRobotShelter`: boolean

### Restaurant (a kind of Shop)
Where orders originate.
- ↳ all Shop attributes
- ↳ `pickupPoint`: location on a StreetSegment
- ↳ `ordersReady`: list of Order ids
- ↳ `isOperating`: boolean (may close during the flood)

### DeliveryRobot
The agent's body in the world.
- ↳ `id`: string (e.g., "BOT-7")
- ↳ `position`: StreetSegment id + offset (m)
- ↳ `status`: `idle` | `to_pickup` | `delivering` | `waiting` | `sheltering` | `returning` | `stuck` | `offline`
- ↳ `battery`: % (0–100)
- ↳ `maxSafeWaterDepth`: cm (e.g., 8 cm — above this, water reaches electronics/wheels lose grip)
- ↳ `groundClearance`: cm (e.g., 10 cm)
- ↳ `waterproofRating`: e.g., IP65
- ↳ `speed`: m/s (normal max 1.5, reduced in water)
- ↳ `cargo`: Order id or `empty`
- ↳ `cargoTemperature`: °C
- ↳ `sensors`: list (`camera`, `lidar`, `ultrasonic`, `waterSensor`, `GPS`, `IMU`)
- ↳ `connectivity`: `good` | `weak` | `lost`

### Order
The package the robot carries.
- ↳ `id`: string (e.g., "ORD-1024")
- ↳ `restaurant`: Restaurant id
- ↳ `customer`: Customer id
- ↳ `items`: list of strings
- ↳ `isPerishable`: boolean
- ↳ `priority`: `normal` | `urgent` | `essential` (e.g., medicine from a pharmacy)
- ↳ `deadline`: HH:MM
- ↳ `status`: `placed` | `ready` | `picked_up` | `in_transit` | `delivered` | `handed_off` | `cancelled` | `returned`

### Customer
The recipient.
- ↳ `id`, `name`
- ↳ `dropoffLocation`: StreetSegment id or Shop id / building entrance
- ↳ `canMeetRobot`: boolean (customer may come to a dry point)
- ↳ `contactable`: boolean

### LoadingDock
Raised cast-iron platforms in front of SoHo loft buildings; natural dry spots.
- ↳ `id`
- ↳ `position`: StreetSegment id
- ↳ `height`: m above sidewalk (typically about 0.6–1.0 m)
- ↳ `hasRampOrStepFreeAccess`: boolean (the robot can only climb a ramp, not steps)
- ↳ `isPublicAccessible`: boolean

### SidewalkVault
Glass-block "vault light" panels in the sidewalk that cover basements.
- ↳ `id`
- ↳ `position`: StreetSegment id
- ↳ `condition`: `intact` | `cracked` | `broken`
- ↳ `isSubmerged`: boolean

### SubwayEntrance
Stairs down to subway stations; water flows into them.
- ↳ `id`
- ↳ `station`: e.g., "Prince St (R/W)", "Spring St (C/E)", "Canal St"
- ↳ `position`: StreetSegment id
- ↳ `isFlooding`: boolean
- ↳ `crowdAtEntrance`: `low` | `medium` | `high`

### Pedestrian
People on the street; they have right of way.
- ↳ `id`
- ↳ `position`: StreetSegment id
- ↳ `movingDirection`: toward higher ground / toward shelter / random
- ↳ `isVulnerable`: boolean (child, elderly, wheelchair user)

### Obstacle
Anything blocking or endangering movement.
- ↳ `id`
- ↳ `type`: `debris` | `floating_object` | `fallen_sign` | `parked_vehicle` | `sandbag_barrier` | `open_manhole` | `downed_power_line`
- ↳ `position`: StreetSegment id
- ↳ `isMoving`: boolean (floating objects drift)
- ↳ `isHazardous`: boolean
- ↳ `passable`: boolean

### DrainageInlet
Storm drains and manholes; they control how water rises.
- ↳ `id`
- ↳ `position`: StreetSegment id
- ↳ `capacity`: `normal` | `overflowing` | `clogged`
- ↳ `coverPresent`: boolean (a missing cover is invisible under water and very dangerous)

### FloodEvent
The disaster itself.
- ↳ `severity`: `minor` | `moderate` | `severe`
- ↳ `rainfallRate`: mm/h
- ↳ `waterRiseRate`: cm/min
- ↳ `affectedSegments`: list of StreetSegment ids
- ↳ `startTime`, `expectedPeakTime`: HH:MM
- ↳ `trend`: `rising` | `stable` | `receding`

### SafeZone
Places the robot can go to wait out the flood.
- ↳ `id`
- ↳ `type`: `charging_station` | `shop_awning` | `raised_plaza` | `parking_garage_upper_level` | `robot_depot`
- ↳ `position`: StreetSegment id
- ↳ `elevation`: m
- ↳ `capacity`: number of robots
- ↳ `occupied`: number of robots
- ↳ `hasCharger`: boolean

### OperatorCenter
The remote human/fleet system supervising the robot.
- ↳ `canTeleoperate`: boolean
- ↳ `messages`: list of alerts/instructions sent to the robot
- ↳ `canNotifyCustomer`: boolean

### EmergencyVehicle
Fire trucks, ambulances, rescue boats.
- ↳ `id`
- ↳ `type`: `fire` | `ambulance` | `police` | `rescue_boat`
- ↳ `position`: StreetSegment id
- ↳ `isActive`: boolean (sirens on)

---

## Relationships

| Subject | Relationship | Object |
|---|---|---|
| RetailStreet | **consists of** | StreetSegment, Intersection |
| StreetSegment | **connects** | Intersection ↔ Intersection |
| StreetSegment | **adjacent to** | StreetSegment |
| Shop / Restaurant | **located on** | StreetSegment |
| DrainageInlet | **located on** | StreetSegment |
| FloodEvent | **affects** | StreetSegment (raises `waterDepth`) |
| FloodEvent | **closes** | Restaurant / Shop (may set `isOpen = false`) |
| DrainageInlet (clogged/overflowing) | **worsens flooding on** | StreetSegment |
| Water | **flows from** higher `elevation` **to** lower | StreetSegment → StreetSegment |
| Obstacle | **blocks** | StreetSegment |
| Obstacle (floating) | **drifts along** | water flow direction |
| DeliveryRobot | **is on** | StreetSegment |
| DeliveryRobot | **carries** | Order |
| DeliveryRobot | **picks up from** | Restaurant |
| DeliveryRobot | **delivers to** | Customer |
| DeliveryRobot | **shelters at** | SafeZone |
| DeliveryRobot | **yields to** | Pedestrian, EmergencyVehicle |
| DeliveryRobot | **reports to / receives commands from** | OperatorCenter |
| Order | **originates at** | Restaurant |
| Order | **is ordered by** | Customer |
| OperatorCenter | **notifies** | Customer |
| LoadingDock | **raised above** | StreetSegment (can serve as dry drop-off / SafeZone) |
| SidewalkVault | **covers** | Basement of a Shop |
| SubwayEntrance | **drains water from** | StreetSegment |
| Shop (basement level) | **floods before** | Shop (street level) |
| Pedestrian | **moves toward** | higher-elevation StreetSegment / SafeZone |
| EmergencyVehicle | **has priority on** | StreetSegment (road, crosswalk) |

---

## Rules (Constraints)

### Water and terrain
1. **Depth limit:** The robot must NOT enter a segment where `waterDepth > robot.maxSafeWaterDepth` (default 8 cm).
2. **Caution band:** If `waterDepth` is between 3 cm and `maxSafeWaterDepth`, the robot's speed is capped at 0.5 m/s.
3. **Flowing water:** The robot must NOT enter a segment with `waterFlowSpeed > 0.5 m/s`, even if shallow (it can be swept away).
4. **Unknown depth = unsafe:** If depth cannot be measured (murky water, sensor failure), treat the segment as impassable.
5. **Hidden hazards:** Any segment containing a DrainageInlet with `coverPresent = false` or `capacity = overflowing` is impassable when `waterDepth > 0`.
6. **Low spots first:** When the flood `trend` is `rising`, segments with lower `elevation` should be expected to exceed limits sooner; plan routes along higher elevation.
7. **Predictive check:** A route is valid only if every segment will stay under the depth limit for the *estimated time the robot reaches it* (`current depth + waterRiseRate × travel time`).
8. **Electrical danger:** A segment with a `downed_power_line` obstacle is impassable and must be reported immediately.

### SoHo-specific
9a. **Cobblestone:** On `surface = cobblestone`, max speed is 0.8 m/s when wet and
    0.3 m/s in the caution band (3–8 cm); prefer paved streets when possible.
9b. **Vault lights:** Avoid SidewalkVault panels that are `submerged`, `cracked`,
    or `broken` (they may not hold the robot's weight and edges are invisible under water).
9c. **Subway entrances:** Stay at least 2 m away from a SubwayEntrance where
    `isFlooding = true` (strong flow toward the stairs) and never block its exit path.
9d. **Canal Street:** When the flood is `rising`, treat segments on Canal St as
    expected to flood first; do not plan routes through them unless currently dry
    and the trip is under 5 min.
9e. **Basement drop-offs:** Never deliver to a basement-level entrance during a flood.
9f. **Loading docks:** A LoadingDock with step-free access is a preferred dry
    drop-off point or temporary shelter.

### People and priority
9. **Pedestrians first:** The robot must yield to all pedestrians and never block a path people are using to escape the water.
10. **Vulnerable people:** Keep at least 1.5 m from pedestrians where `isVulnerable = true`.
11. **Emergency vehicles:** When an EmergencyVehicle is active nearby, the robot must pull fully out of its path and stop.
12. **Crowding:** Robots must not park on narrow sidewalks (`width < 2 m`) during evacuation.
13. **Human life > robot > food:** Safety of people always outranks robot safety, and robot safety outranks delivering the order.

### Robot state
14. **Battery reserve:** The robot must always keep enough battery to reach the nearest SafeZone plus a 15% margin; otherwise it must stop delivering and go to a SafeZone.
15. **Connectivity:** If `connectivity = lost` for more than 2 min, the robot must go to the nearest reachable SafeZone and wait.
16. **Stuck:** If the robot has not moved for 3 min while trying to move, `status = stuck` and it must alert the OperatorCenter.
17. **SafeZone capacity:** A robot can only shelter at a SafeZone where `occupied < capacity`.

### Orders
18. **Alert levels:**
    - `advisory`: continue deliveries, reroute around wet segments.
    - `warning`: finish only the current order; accept no new orders.
    - `emergency`: stop all deliveries, go to the nearest SafeZone.
19. **Essential orders:** Orders with `priority = essential` (e.g., medicine) may continue under `warning` if a fully safe route exists.
20. **Perishables:** If a perishable order will miss its deadline by more than 30 min, it should be returned or cancelled rather than delivered late.
21. **Closed pickup:** The robot cannot pick up from a Restaurant where `isOperating = false`.
22. **Handoff location:** An order can be delivered only at a dry point (`waterDepth = 0`) the customer can reach safely.

---

## Actions (State Changes)

Each action lists **preconditions** → **effects**.

### `move(robot, segment)`
- **Pre:** segment is adjacent; segment passes Rules 1–8; robot not `offline`.
- **Effect:** `robot.position = segment`; `robot.battery` decreases (more in water); speed set by Rule 2.

### `plan_route(robot, destination)`
- **Pre:** a map of segments with current `waterDepth` and `isBlocked`.
- **Effect:** returns the shortest route that satisfies all Rules; prefers higher elevation; returns `none` if no safe route exists.

### `reroute(robot)`
- **Pre:** a segment on the current route becomes unsafe (depth rise, new obstacle, crowd).
- **Effect:** new route via `plan_route`; OperatorCenter and Customer notified of new ETA.

### `sense_water(robot)`
- **Pre:** robot has `waterSensor` or camera/lidar.
- **Effect:** updates `waterDepth` and `waterFlowSpeed` of the current and next segment.

### `pick_up(robot, order)`
- **Pre:** robot at Restaurant `pickupPoint`; `restaurant.isOperating = true`; `order.status = ready`; `robot.cargo = empty`; alert level allows it.
- **Effect:** `robot.cargo = order`; `order.status = picked_up`; `robot.status = delivering`.

### `deliver(robot, order)`
- **Pre:** robot at `customer.dropoffLocation` (or agreed alternative); location dry; customer present.
- **Effect:** `order.status = delivered`; `robot.cargo = empty`; `robot.status = idle` or `returning`.

### `propose_alternative_dropoff(robot, customer, point)`
- **Pre:** original dropoff is flooded; `customer.contactable = true`.
- **Effect:** customer is asked to meet at a nearby dry point (e.g., a raised shop entrance); if accepted, `dropoffLocation = point`.

### `hand_off(robot, order, shop)`
- **Pre:** delivery cannot finish safely; shop `isOpen` and willing to hold the order.
- **Effect:** `order.status = handed_off`; customer notified where to collect it; `robot.cargo = empty`.

### `wait(robot, minutes)`
- **Pre:** robot is at a safe spot (dry, not blocking people).
- **Effect:** `robot.status = waiting`; re-check water after the wait (useful when `trend = receding`).

### `seek_shelter(robot)`
- **Pre:** alert level = `emergency`, OR Rule 14/15 triggered, OR no safe route exists.
- **Effect:** robot moves to the nearest reachable SafeZone with free capacity; `robot.status = sheltering`; `safeZone.occupied += 1`.

### `charge(robot)`
- **Pre:** robot at a SafeZone with `hasCharger = true`.
- **Effect:** `robot.battery` increases over time.

### `yield(robot)`
- **Pre:** pedestrian or active EmergencyVehicle nearby.
- **Effect:** robot moves aside to a non-blocking spot and stops until clear.

### `report_hazard(robot, hazard)`
- **Pre:** robot detects an Obstacle, open manhole, overflowing drain, or downed power line.
- **Effect:** hazard added to shared map; segment marked `isBlocked = true`; OperatorCenter alerted (can forward to city/emergency services).

### `cancel_or_return(robot, order)`
- **Pre:** Rule 18 (`emergency`) or Rule 20 applies.
- **Effect:** `order.status = cancelled` or `returned`; customer notified and refunded by the OperatorCenter.

### `request_teleop(robot)`
- **Pre:** `robot.status = stuck` or the situation is ambiguous; connectivity not `lost`.
- **Effect:** a human operator takes control.

### Environment actions (not controlled by the robot)
- `flood_rise(segment)`: `waterDepth += waterRiseRate × Δt`, faster at low elevation and near clogged drains.
- `flood_recede(segment)`: `waterDepth` decreases; `FloodEvent.trend = receding`.
- `spawn_obstacle(segment)`: debris or floating object appears and may drift downhill.
- `close_shop(shop)`: `isOpen = false` (owners leave).
- `raise_alert(level)`: `RetailStreet.floodAlertLevel` changes.
- `power_outage(intersection)`: `signalWorking = false`.

---

## Example Scenario (for testing the agent)

- **Map (simplified, elevations assumed):**
  - `SEG-01` Prince St at Broadway (restaurant pickup), elev 3.0 m, asphalt
  - `SEG-02` Broadway, Prince St → Spring St, elev 2.6 m, concrete, Spring St subway entrance flooding
  - `SEG-03` Broadway, Spring St → Broome St, elev 2.0 m, concrete, some vault lights
  - `SEG-04` Greene St, Prince St → Broome St, elev 2.4 m, **cobblestone**
  - `SEG-05` Broome St, Greene St → Broadway, elev 2.2 m, asphalt
  - `SEG-06` Canal St at Broadway, elev 1.2 m, low spot, overflowing drain
- **Flood:** `moderate`, `rising`, `waterRiseRate = 0.5 cm/min`.
  Current depths: SEG-01 = 0 cm, SEG-02 = 4 cm, SEG-03 = 6 cm (vault lights submerged),
  SEG-04 = 3 cm, SEG-05 = 1 cm, SEG-06 = 15 cm.
- **Alert level:** `warning`.
- **Robot:** `BOT-7` at a noodle shop on Prince St (SEG-01), battery 45%,
  `maxSafeWaterDepth = 8 cm`, carrying `ORD-1024` (hot ramen, perishable, deadline in
  25 min) for a customer at a loft building on Broome St near Broadway (end of SEG-05),
  which has a raised loading dock with a ramp.
- **Pedestrians:** a crowd leaving the flooding Spring St subway entrance onto Broadway.

**Expected reasoning:** Broadway south (SEG-02 → SEG-03) is the shortest route, but
SEG-03 is at 6 cm, will pass 8 cm in about 4 min, and has submerged vault lights
(Rule 9b), and SEG-02 has a crowd and a flooding subway entrance (Rule 9c). SEG-06
(Canal St) is far above the limit. The robot should `reroute` via Greene St (SEG-04,
cobblestone, 3 cm, slow to 0.3 m/s per Rule 9a), then Broome St (SEG-05, 1 cm), and
`deliver` on the **raised loading dock** (Rule 9f) instead of the flooded sidewalk.
Because the alert level is `warning`, it accepts no new orders afterward and goes to
the nearest SafeZone.
