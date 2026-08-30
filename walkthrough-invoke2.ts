// T3N Walkthrough — invoke via proper executeAndDecode shape (self-grant)
declare var process: any;
import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  getContractVersion,
  getNodeUrl,
} from "@terminal3/t3n-sdk";

const T3N_API_KEY = process.env.T3N_API_KEY;

async function main() {
  try {
    setEnvironment("testnet");
    const wasmComponent: any = await loadWasmComponent();
    const address: any = eth_get_address(T3N_API_KEY);

    const t3n: any = new T3nClient({
      trustAnchor: { unsafe_trust_server: true }, // platform bug workaround
      wasmComponent,
      handlers: { EthSign: metamask_sign(address, undefined, T3N_API_KEY) },
    });
    await t3n.handshake();
    const did: any = await t3n.authenticate(createEthAuthInput(address));
    const tenantDid: string = did.value;
    const tenantId = tenantDid.slice("did:t3n:".length);
    const TENANT_SCRIPT = `z:${tenantId}:travel-contracts`;
    console.log("tenant:", tenantDid);

    const scriptVersion: any = await getContractVersion(getNodeUrl(), TENANT_SCRIPT);
    console.log("contract version:", scriptVersion);

    // Self-grant agent-auth-update so outbound calls are allowed (self-grant: agentDid = own DID)
    try {
      const userVersion: any = await getContractVersion(getNodeUrl(), "tee:user/contracts");
      await t3n.execute({
        contract_id: "tee:user/contracts",
        contract_version: userVersion,
        function_name: "agent-auth-update",
        input: {
          agents: [{
            agentDid: tenantDid,
            scripts: [{
              scriptName: TENANT_SCRIPT,
              versionReq: scriptVersion,
              functions: ["search-offers", "book-offer"],
              allowedHosts: ["api.duffel.com"],
            }],
          }],
        },
      });
      console.log("self-grant OK");
    } catch (e: any) {
      console.log("self-grant (may need separate user key):", e.message);
    }

    // Invoke search-offers
    try {
      const search: any = await t3n.executeAndDecode({
        contract_id: TENANT_SCRIPT,
        contract_version: scriptVersion,
        function_name: "search-offers",
        input: { origin: "LHR", destination: "JFK", departure_date: "2026-07-15", cabin_class: "economy", adult_count: 1 },
      });
      console.log("SEARCH OK:", JSON.stringify(search).slice(0, 500));
    } catch (e: any) {
      console.log("invoke search:", e.message);
    }
  } catch (e: any) {
    console.log("ERROR:", e.message);
    if (e.stack) console.log(e.stack.split("\n").slice(0, 6).join("\n"));
  }
}
main();
