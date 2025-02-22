import config from "@/config";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

export const proxyAxios = axios.create({
  httpsAgent: new HttpsProxyAgent(config.ROTATING_PROXY_URL),
});
