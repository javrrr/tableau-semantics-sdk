/**
 * Schema-name sanitization for the Tableau Next spec.
 *
 * The Tableau Next OpenAPI spec names every schema with a fully-qualified,
 * dotted Java-style name, e.g.
 *   sfdc.unified.analytics.connect.api.output.VisualizationRepresentation
 *
 * Those dots are illegal in a TypeScript identifier, so they can't be used
 * directly as `export type <name>` or `import { <name> }`. This module maps
 * each FQN to a clean, stable, collision-free TS identifier.
 *
 * Strategy:
 *   1. The identifier is the last dot-segment (the Java simple class name),
 *      which is already PascalCase and a valid identifier.
 *   2. When two or more FQNs share a last segment (14 pairs in the v67 spec,
 *      all obscure filter/dependent sub-types), each colliding name is
 *      prefixed with the PascalCased namespace segments that distinguish it
 *      from its group — the segments it does NOT share with every other member.
 *   3. Any residual collision (identical distinguishing segments) falls back to
 *      a deterministic numeric suffix ordered by the full FQN.
 *
 * The primary user-facing types (Visualization*, Dashboard*, Workspace*, …)
 * all have unique last segments, so they get clean bare names.
 *
 * IMPORTANT: this sanitizes the IDENTIFIER only. The underlying
 * `components["schemas"]` object (emitted by openapi-typescript) is still keyed
 * by the original FQN, so `Schemas["<fqn>"]` index expressions must keep using
 * the original name — only `export type` / `import` identifiers are sanitized.
 */

/** A name with no dots is already a valid identifier — pass it through. */
export function isPlainIdentifier(name: string): boolean {
  return !name.includes(".");
}

function pascalSegment(seg: string): string {
  if (!seg) return "";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

/**
 * Build a map from every schema FQN to a unique TS identifier.
 * Deterministic for a given set of names.
 */
export function buildSchemaNameMap(names: string[]): Map<string, string> {
  const map = new Map<string, string>();

  // Group FQNs by their last dot-segment.
  const byLast = new Map<string, string[]>();
  for (const fqn of names) {
    const last = fqn.split(".").pop()!;
    const group = byLast.get(last);
    if (group) group.push(fqn);
    else byLast.set(last, [fqn]);
  }

  const assigned = new Set<string>();

  for (const [last, group] of byLast) {
    if (group.length === 1) {
      map.set(group[0], last);
      assigned.add(last);
      continue;
    }

    // Collision group: distinguish by the segments (excluding the last) that
    // are NOT common to every member.
    const memberSegs = group.map((fqn) => fqn.split(".").slice(0, -1));
    const common = new Set(memberSegs[0]);
    for (const segs of memberSegs.slice(1)) {
      const segSet = new Set(segs);
      for (const s of [...common]) if (!segSet.has(s)) common.delete(s);
    }

    // Sort for deterministic numeric-suffix fallback.
    const order = [...group].sort();
    for (const fqn of order) {
      const segs = fqn.split(".").slice(0, -1);
      const distinguishing = segs.filter((s) => !common.has(s));
      let id = distinguishing.map(pascalSegment).join("") + last;
      if (assigned.has(id)) {
        let n = 2;
        while (assigned.has(`${id}${n}`)) n++;
        id = `${id}${n}`;
      }
      map.set(fqn, id);
      assigned.add(id);
    }
  }

  return map;
}
