import { handleApiRequest, type EdgeApiEnv } from "../../src/server/repairApiEdge.ts";

interface PagesFunctionContext {
  request: Request;
  env?: EdgeApiEnv;
}

export const onRequest = async (
  context: PagesFunctionContext
): Promise<Response> => {
  return handleApiRequest(context.request, context.env ?? {});
};
