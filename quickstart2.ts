// T3N — quickstart with unsafe_trust_server (testnet, manifest missing rtmr1_allowlist)
declare var process: any;
import {
  T3nClient,
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
    console.log("address:", address);

    const t3n: any = new T3nClient({
      trustAnchor: { unsafe_trust_server: true }, // testnet — manifest missing rtmr1_allowlist
      wasmComponent,
      handlers: { EthSign: metamask_sign(address, undefined, T3N_API_KEY) },
    });
    console.log("T3nClient created, handshaking...");
    await t3n.handshake();
    console.log("handshake OK");
    const did: any = await t3n.authenticate(createEthAuthInput(address));
    console.log("AUTH OK:", did.value);
  } catch (e: any) {
    console.log("ERROR:", e.message);
    if (e.stack) console.log(e.stack.split("\n").slice(0, 5).join("\n"));
  }
}
main();
