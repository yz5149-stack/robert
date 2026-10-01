"""Run the SoHo flood site model on the example snapshot in semantic_model.md."""
import heapq

# id: (street, from, to, length m, elevation m, surface, depth cm, rise cm/min, features)
SEGMENTS = {
    "SEG-01": ("Prince St at Broadway", "Restaurant", "Prince&Broadway", 40, 3.0, "asphalt", 0, 0.1, []),
    "SEG-07": ("Prince St, Broadway -> Greene St", "Prince&Broadway", "Prince&Greene", 150, 2.9, "asphalt", 0, 0.1, []),
    "SEG-02": ("Broadway, Prince St -> Spring St", "Prince&Broadway", "Spring&Broadway", 85, 2.6, "concrete", 4, 0.5,
               ["flooding_subway_entrance", "high_crowd"]),
    "SEG-03": ("Broadway, Spring St -> Broome St", "Spring&Broadway", "Broome&Broadway", 85, 2.0, "concrete", 6, 0.6,
               ["vault_lights"]),
    "SEG-04": ("Greene St, Prince St -> Broome St", "Prince&Greene", "Broome&Greene", 170, 2.4, "cobblestone", 3, 0.3, []),
    "SEG-05": ("Broome St, Greene St -> Broadway", "Broome&Greene", "Broome&Broadway", 150, 2.2, "asphalt", 1, 0.3,
               ["loading_dock_with_ramp", "safe_zone_SZ-1"]),
    "SEG-06": ("Canal St at Broadway", "Broome&Broadway", "Canal&Broadway", 100, 1.2, "asphalt", 15, 1.0,
               ["overflowing_drain"]),
}
HORIZON_MIN = 10
DEEP_CM = 8


def condition(depth):  # Rule 1
    if depth == 0:
        return "dry"
    if depth <= 3:
        return "wet"
    if depth <= DEEP_CM:
        return "shallow"
    return "deep"


def hazards(depth, surface, features):  # Rules 4-7, 10
    found = []
    if "overflowing_drain" in features and depth > 0:
        found.append("overflowing drain under water")
    if "vault_lights" in features and depth > 0:
        found.append("vault lights under water")
    if "flooding_subway_entrance" in features:
        found.append("flooding subway entrance")
    if "high_crowd" in features:
        found.append("crowd evacuating")
    if surface == "cobblestone" and depth > 0:
        found.append("slippery cobblestone (caution)")
    return found


def blocking(h):
    return [x for x in h if "caution" not in x]


def analyse():
    report = {}
    for sid, (street, a, b, length, elev, surface, depth, rise, feats) in SEGMENTS.items():
        future = depth + rise * HORIZON_MIN  # Rule 2
        h = hazards(future, surface, feats)
        usable = future <= DEEP_CM and not blocking(h)
        report[sid] = (street, depth, future, h, usable)
    return report


def shortest_usable_path(report, start, goal_segment):
    graph = {}
    for sid, (_, a, b, length, *_rest) in SEGMENTS.items():
        if report[sid][4]:
            graph.setdefault(a, []).append((b, length, sid))
            graph.setdefault(b, []).append((a, length, sid))
    goal_nodes = {SEGMENTS[goal_segment][1], SEGMENTS[goal_segment][2]}
    queue = [(0, start, [])]
    seen = set()
    while queue:
        dist, node, path = heapq.heappop(queue)
        if node in seen:
            continue
        seen.add(node)
        if node in goal_nodes:
            return dist, path + [goal_segment]
        for nxt, length, sid in graph.get(node, []):
            heapq.heappush(queue, (dist + length, nxt, path + [sid]))
    return None


def main():
    report = analyse()
    print(f"Segment conditions now and in {HORIZON_MIN} min (flood rising)\n")
    print(f"{'Seg':7}{'Street':36}{'Now':<16}{'+10 min':<17}  Usable  Hazards")
    for sid, (street, now, future, h, usable) in report.items():
        print(f"{sid:7}{street:36}{now:>4} cm  {condition(now):<8}{future:>4.0f} cm  {condition(future):<8}"
              f"  {'yes' if usable else 'NO ':6}  {', '.join(h) or '-'}")

    print("\nDry spots: loading dock on SEG-05 (with ramp), SafeZone SZ-1 (garage upper level, SEG-05)")

    result = shortest_usable_path(report, "Restaurant", "SEG-05")
    print("\nShortest usable path from the restaurant (SEG-01) to the loading dock on SEG-05:")
    if result:
        dist, path = result
        print("  " + " -> ".join(path) + f"  (about {dist + SEGMENTS['SEG-05'][3]} m)")
    else:
        print("  none - every route is deep or hazardous")


if __name__ == "__main__":
    main()
