import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { deleteProject, getProject, updateProject } from "@/lib/db/projects";
import { NotFoundError } from "@/lib/errors";
import { parseProjectInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const project = getProject(id);
    if (!project) throw new NotFoundError("项目不存在");
    return json({ project });
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    const input = parseProjectInput(await readJsonBody(request));
    return json({ project: updateProject(id, input) });
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const { id } = await params;
    deleteProject(id);
    return json({ ok: true, id });
  });
}
