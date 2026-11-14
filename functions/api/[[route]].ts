import { handleApiRequest } from "../../src/server/repairApiEdge.ts";

interface PagesFunctionContext {
  request: Request;
}

export const onRequest = async (
  context: PagesFunctionContext
): Promise<Response> => {
  return handleApiRequest(context.request);
};
