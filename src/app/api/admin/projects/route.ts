import { type NextRequest } from "next/server";
import { handleRoute, json, readJsonBody, requireAdminApi } from "@/lib/api";
import { createProject, listAllProjects } from "@/lib/db/projects";
import { parseProjectInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    return json({ projects: listAllProjects() });
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleRoute(async () => {
    await requireAdminApi(request);
    const input = parseProjectInput(await readJsonBody(request));
    const project = createProject(input);
    return json({ project }, 201);
  });
}
