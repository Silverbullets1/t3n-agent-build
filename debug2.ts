// T3N — try production env + direct manifest
declare var process: any;
import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  manifestToTrustAnchor,
} from "@terminal3/t3n-sdk";

const T3N_API_KEY = process.env.T3N_API_KEY;

async function main() {
  try {
    setEnvironment("production");
    console.log("ENV: production");
    const wasmComponent: any = await loadWasmComponent();
    const address: any = eth_get_address(T3N_API_KEY);
    const resp = await fetch("https://cn-api.sg.testnet.t3n.terminal3.io/api/trust-manifest");
    const manifest: any = await resp.json();
    console.log("Manifest fetched, converting...");
    const trustAnchor: any = manifestToTrustAnchor(manifest);
    console.log("trustAnchor OK:", JSON.stringify(trustAnchor).slice(0, 200));

    const t3n: any = new T3nClient({
      trustAnchor,
      wasmComponent,
      handlers: { EthSign: metamask_sign(address, undefined, T3N_API_KEY) },
    });
    await t3n.handshake();
    const did: any = await t3n.authenticate(createEthAuthInput(address));
    console.log("AUTH OK:", did.value);
  } catch (e: any) {
    console.log("ERROR:", e.message);
    if (e.stack) console.log(e.stack.split("\n").slice(0, 4).join("\n"));
  }
}
main();
