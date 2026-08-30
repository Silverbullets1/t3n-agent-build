// T3N Walkthrough — maps + seed secrets + invoke
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
      trustAnchor: { unsafe_trust_server: true }, // platform bug workaround (documented)
      wasmComponent,
      handlers: { EthSign: metamask_sign(address, undefined, T3N_API_KEY) },
    });
    await t3n.handshake();
    const did: any = await t3n.authenticate(createEthAuthInput(address));
    const tenantDid: string = did.value;

    const tenant: any = new TenantClient({
      t3n,
      baseUrl: getNodeUrl(),
      tenantDid,
    });
    await tenant.tenant.me();
    console.log("TenantClient ready.");

    const contractId = 804; // from registration
    const tenantId = tenantDid.slice("did:t3n:".length);

    // 1. Create secrets map
    try {
      await tenant.maps.create({
        tail: "secrets",
        visibility: "private",
        writers: { only: [contractId] },
        readers: { only: [contractId] },
      });
      console.log("secrets map created");
    } catch (e: any) {
      console.log("map create (may be idempotent):", e.message);
    }

    // 2. Seed a demo API key into secrets (Duffel test key placeholder — contract reads it)
    try {
      await tenant.executeControl("map-entry-set", {
        map_name: `z:${tenantId}:secrets`,
        key: "duffel_api_key",
        value: "duffel_test_00000000000000000000000000000000",
      });
      console.log("duffel_api_key seeded into secrets");
    } catch (e: any) {
      console.log("seed:", e.message);
    }

    // 3. Verify contract version
    const scriptName = `z:${tenantId}:travel-contracts`;
    console.log("Contract:", scriptName, "| contract_id:", contractId);

    // 4. Invoke search-offers (no PII path)
    try {
      const searchReq = JSON.stringify({
        origin: "SIN",
        destination: "LHR",
        date: "2026-10-01",
      });
      const input = new TextEncoder().encode(searchReq);
      const invokeResult: any = await tenant.contracts.execute({
        name: scriptName,
        input,
      });
      console.log("INVOKE search-offers OK:", JSON.stringify(invokeResult).slice(0, 400));
    } catch (e: any) {
      console.log("invoke search:", e.message);
    }
  } catch (e: any) {
    console.log("ERROR:", e.message);
    if (e.stack) console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  }
}
main();
