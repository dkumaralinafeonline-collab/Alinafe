// src/config/infobip.js
import axios from "axios";
import { env } from "./env.js";

/**
 * Infobip Axios client (central)
 * Auth: Authorization: App <API_KEY>
 */

export const infobipClient = axios.create({
  baseURL: env.INFOBIP_BASE_URL,
  timeout: 30_000,
  headers: {
    Authorization: `App ${env.INFOBIP_API_KEY}`,
    Accept: "application/json",
  },
});
