/**
 * POST /api/issuers/{code}/details?budget=100 – lijeno popuni valute (GET /types/{id}) do budžeta.
 *
 * @changelog
 * 2026-09-21  Početna verzija.
 */
import { handleError, intParam, ok } from "@/lib/api";
import { fillDetails } from "@/lib/catalog";
import { getDetailBudget, getUsage } from "@/lib/numista/client";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { code } = await params;
    const budget = intParam(new URL(request.url).searchParams.get("budget"), getDetailBudget())!;
    const result = await fillDetails(code, Math.max(0, budget));
    return ok({ ...result, usage: await getUsage() });
  } catch (e) {
    return handleError(e);
  }
}
