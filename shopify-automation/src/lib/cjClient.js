import { getJSON, setJSON } from "./blobsStore.js";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const TOKEN_KEY = "access-token";
const TOKEN_STORE = "cj-auth";

function assertConfigured() {
  if (!process.env.CJ_EMAIL || !process.env.CJ_API_KEY) {
    throw new Error("Variables CJ_EMAIL / CJ_API_KEY manquantes");
  }
}

async function fetchFreshToken() {
  assertConfigured();
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.CJ_EMAIL, password: process.env.CJ_API_KEY }),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 200) {
    throw new Error(`CJ auth failed: ${JSON.stringify(data).slice(0, 300)}`);
  }

  const { accessToken, accessTokenExpiryDate } = data.data;
  await setJSON(TOKEN_STORE, TOKEN_KEY, {
    accessToken,
    expiresAt: new Date(accessTokenExpiryDate).getTime(),
  });
  return accessToken;
}

async function getValidToken() {
  const cached = await getJSON(TOKEN_STORE, TOKEN_KEY);
  const safetyMarginMs = 60 * 60 * 1000; // renouvelle 1h avant expiration
  if (cached && cached.expiresAt - Date.now() > safetyMarginMs) {
    return cached.accessToken;
  }
  return fetchFreshToken();
}

async function cjRequest(path, { method = "GET", body } = {}) {
  const token = await getValidToken();
  const res = await fetch(`${CJ_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok || data.code !== 200) {
    throw new Error(`CJ API ${method} ${path} -> ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data.data;
}

export const cj = {
  getProductDetail: (pid) => cjRequest(`/product/query?pid=${encodeURIComponent(pid)}`),

  getProductStock: (vid) => cjRequest(`/product/stock/queryByVid?vid=${encodeURIComponent(vid)}`),

  createOrder: (orderPayload) => cjRequest("/shopping/order/createOrderV2", { method: "POST", body: orderPayload }),

  getOrderDetail: (orderId) => cjRequest(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`),

  calculateFreight: (payload) => cjRequest("/logistic/freightCalculate", { method: "POST", body: payload }),
};
