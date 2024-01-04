import { rpcHandler } from "@blitzjs/rpc";
import { api } from "src/blitz-server";

export const dynamic = "force-dynamic";
export default api(rpcHandler({ onError: console.log }));
