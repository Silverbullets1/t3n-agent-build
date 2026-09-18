// T3N — re-grant the `secrets` map ACL to the NEW contract_id after re-register
declare var process: any;
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
      trustAnchor: { unsafe_trust_server: true },
      wasmComponent,
      handlers: { EthSign: metamask_sign(address, undefined, T3N_API_KEY) },
    });
    await t3n.handshake();
    const did: any = await t3n.authenticate(createEthAuthInput(address));
    const tenant: any = new TenantClient({
      t3n,
      baseUrl: getNodeUrl(),
      tenantDid: did.value,
    });
    await tenant.tenant.me();
    console.log("tenant ready:", did.value);

    const NEW_ID = 1060; // contract_id allocated by the v1.0.0 re-registration
    const res: any = await tenant.maps.update("secrets", {
      writers: { only: [NEW_ID] },
      readers: { only: [NEW_ID] },
    });
    console.log("MAP UPDATE RESULT:", JSON.stringify(res).slice(0, 300));

    const status: any = await tenant.maps.getStatus("secrets");
    console.log("MAP STATUS:", JSON.stringify(status).slice(0, 300));
  } catch (e: any) {
    console.log("ERROR:", e.message);
    if (e.stack) console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  }
}
main();
