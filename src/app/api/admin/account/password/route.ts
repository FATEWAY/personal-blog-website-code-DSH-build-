import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { findAdminById, updateAdminPassword } from "@/lib/db/admins";
import { deleteOtherSessions } from "@/lib/db/sessions";
import { UnauthorizedError } from "@/lib/errors";
import {
  ValidationError,
  parsePasswordChangeInput,
  validatePasswordStrength,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    const auth = await requireAdminApi(request);
    const { currentPassword, newPassword } = parsePasswordChangeInput(await readJsonBody(request));

    const admin = findAdminById(auth.admin.id);
    if (!admin) throw new UnauthorizedError("账户不存在，请重新登录");

    if (!(await verifyPassword(currentPassword, admin.password_hash))) {
      throw new ValidationError({ currentPassword: "当前密码不正确" });
    }

    const strengthError = validatePasswordStrength(newPassword, admin.username);
    if (strengthError) {
      throw new ValidationError({ newPassword: strengthError });
    }

    if (await verifyPassword(newPassword, admin.password_hash)) {
      throw new ValidationError({ newPassword: "新密码不能与当前密码相同" });
    }

    updateAdminPassword(admin.id, await hashPassword(newPassword));
    const revoked = deleteOtherSessions(admin.id, auth.session.tokenHash);

    return json({ ok: true, revokedSessions: revoked });
  });
}
