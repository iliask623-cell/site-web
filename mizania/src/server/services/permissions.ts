import "server-only";
import type { OrgContext } from "./organizations";

export class ForbiddenError extends Error {
  constructor() {
    super("Action non autorisée pour votre rôle.");
  }
}

/** Le comptable invité (rôle futur) consulte sans modifier. */
export function assertCanWrite(ctx: OrgContext) {
  if (ctx.role !== "owner" && ctx.role !== "member") throw new ForbiddenError();
}
