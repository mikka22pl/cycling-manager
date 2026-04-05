import { Cyclist } from '../models/cyclist';

const GROUP_PROXIMITY_KM = 0.05; // 50 metres (spec §12.1)

export type Group = {
  id: string;
  cyclistIds: string[];
  speed: number; // group's shared speed (weighted avg top 30%)
};

/**
 * Assigns cyclists to groups based on proximity.
 * Updates cyclist.dynamic.groupId in-place on the provided array.
 */
export function resolveGroups(cyclists: Cyclist[]): Group[] {
  // Sort by position descending (leader first)
  const sorted = [...cyclists].sort(
    (a, b) => b.dynamic.position - a.dynamic.position,
  );

  const groups: Group[] = [];
  let groupCounter = 0;

  // Simple O(n²) proximity grouping – adequate for race sizes
  const assigned = new Set<string>();

  for (const rider of sorted) {
    if (assigned.has(rider.id)) continue;

    const groupId = `g${++groupCounter}`;
    const members: Cyclist[] = [rider];
    assigned.add(rider.id);

    for (const other of sorted) {
      if (assigned.has(other.id)) continue;
      if (
        Math.abs(rider.dynamic.position - other.dynamic.position) <=
        GROUP_PROXIMITY_KM
      ) {
        members.push(other);
        assigned.add(other.id);
      }
    }

    // Group speed = weighted average of top 30% (min 1) riders by speed
    const topCount = Math.max(1, Math.ceil(members.length * 0.3));
    const bySpeed = [...members].sort(
      (a, b) => b.dynamic.speed - a.dynamic.speed,
    );
    const groupSpeed =
      bySpeed.slice(0, topCount).reduce((s, c) => s + c.dynamic.speed, 0) /
      topCount;

    for (const m of members) {
      m.dynamic.groupId = groupId;
    }

    groups.push({
      id: groupId,
      cyclistIds: members.map((m) => m.id),
      speed: groupSpeed,
    });
  }

  return groups;
}

/** Returns size of the group a cyclist belongs to. */
export function getGroupSize(cyclist: Cyclist, cyclists: Cyclist[]): number {
  if (!cyclist.dynamic.groupId) return 1;
  return cyclists.filter((c) => c.dynamic.groupId === cyclist.dynamic.groupId)
    .length;
}
