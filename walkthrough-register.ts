// T3N Walkthrough — register contract
declare var process: any;
import { readFile } from "fs/promises";
import {
  T3nClient,
  TenantClient,
  getNodeUrl,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
} from "@terminal3/t3n-sdk";

const T3N_API_KEY = process.env.T3N_API_KEY;

async function main() {
  try {
    setEnvironment("testnet");
    const wasmComponent: any = await loadWasmComponent();
    const address: any = eth_get_address(T3N_API_KEY);

    const t3n: any = new T3nClient({
      trustAnchor: { unsafe_trust_server: true }, // testnet manifest missing rtmr1_allowlist — known platform bug (documented in submission)
      wasmComponent,
      handlers: { EthSign: metamask_sign(address, undefined, T3N_API_KEY) },
    });
    await t3n.handshake();
    const did: any = await t3n.authenticate(createEthAuthInput(address));
    const tenantDid: string = did.value;
    console.log("tenantDid:", tenantDid);

    const tenant: any = new TenantClient({
      t3n,
      baseUrl: getNodeUrl(),
      tenantDid,
    });
    await tenant.tenant.me();
    console.log("TenantClient ready.");

    // Register the contract
    const WASM_PATH = "/home/ubuntu/t3n-agent/z-tenant-flight/target/wasm32-wasip2/release/z_tenant_flight.wasm";
    const CONTRACT_TAIL = "travel-contracts";
    const CONTRACT_VERSION = "0.1.0";
    const wasmBytes = await readFile(WASM_PATH);
    console.log("WASM size:", wasmBytes.length, "bytes");

    const result: any = await tenant.contracts.register({
      tail: CONTRACT_TAIL,
      version: CONTRACT_VERSION,
      wasm: wasmBytes,
    });
    const contractId = result.contract_id;
    const tenantId = tenantDid.slice("did:t3n:".length);
    const scriptName = `z:${tenantId}:${CONTRACT_TAIL}`;
    console.log("REGISTERED:", scriptName, "as contract id", contractId);
    console.log("RESULT:", JSON.stringify(result).slice(0, 300));
  } catch (e: any) {
    console.log("ERROR:", e.message);
    if (e.stack) console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  }
}
main();
