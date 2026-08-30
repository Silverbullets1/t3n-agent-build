// T3N quickstart — manifest bypass debug
import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  fetchTrustedManifest,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");
const T3N_API_KEY = process.env.T3N_API_KEY;
console.log("API key prefix:", T3N_API_KEY.slice(0, 12));

try {
  const manifest = await fetchTrustedManifest("testnet");
  console.log("Manifest OK, type:", typeof manifest);
  if (manifest && typeof manifest === 'object') {
    console.log("manifest keys:", Object.keys(manifest));
  }
} catch (e) {
  console.log("fetchTrustedManifest ERROR:", e.message);
}

// Try direct URL fetch
try {
  const resp = await fetch("https://cn-api.sg.testnet.t3n.terminal3.io/api/trust-manifest");
  const data = await resp.json();
  console.log("Direct fetch OK, keys:", Object.keys(data));
  console.log("signature:", data.signature ? data.signature.slice(0, 30) + "..." : "none");
} catch (e) {
  console.log("Direct fetch ERROR:", e.message);
}
