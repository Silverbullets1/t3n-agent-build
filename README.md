# T3N Enterprise Agent — DevilX

T3N Agent Build Challenge submission (Superteam bounty $290 USDC).

A working T3N ADK deployment: authenticated session, a registered TEE contract (`travel-contracts`), a hosted agent card, and a seeded secrets map — end-to-end on the T3N testnet.

## What's here

| Path | What |
|---|---|
| `quickstart.ts` | T3N ADK authenticated session (DID + handshake) |
| `quickstart2.ts` | Same, using `unsafe_trust_server` workaround (see Bugs) |
| `walkthrough-register.ts` | Register the `z-tenant-flight` WASM contract as `travel-contracts` |
| `walkthrough-invoke.ts` / `walkthrough-invoke2.ts` | Create secrets map, seed API key, self-grant, invoke `search-offers` |
| `agent-card.json` | ERC-8004 agent card (hosted on T3N) |
| `z-tenant-flight/` | Reference TEE contract (Rust → WASM wasip2) |

## How to run

```bash
npm install @terminal3/t3n-sdk tsx
export T3N_API_KEY="0x..."        # your claim-page key
npx tsx quickstart.ts             # → Connected as: did:t3n:...
npx tsx walkthrough-register.ts   # → REGISTERED travel-contracts (contract id NNN)
npx tsx walkthrough-invoke.ts     # → maps + seed + invoke
```

## Verified end-to-end (testnet, 2026-08-30)

```
✅ Authenticated session        did:t3n:65fbd5823e89b5333049d77ffd4ea9db5b807d97
✅ Agent card hosted            /api/agent-card/did:t3n:65fbd5823e89b5333049d77ffd4ea9db5b807d97
✅ Contract built + registered  z:65fbd582...:travel-contracts  (id 804, v0.1.0)
✅ Secrets map created + key seeded
✅ Self-grant (agent-auth-update) OK
✅ Contract EXECUTED → outbound HTTP to api.duffel.com
   (401 = placeholder Duffel key — proves full call path works)
```

## Bugs found (platform-side)

1. **Trust manifest missing `rtmr1_allowlist`** — `fetchTrustedManifest("testnet")` returns malformed and the SDK throws. Workaround: `{ unsafe_trust_server: true }` (attestation verification off; acceptable on testnet). Noted in the T3N docs as a known rough edge.
2. **`TenantClient.contracts.execute` name validation** — passing the full `z:<tid>:tail` as `name` fails regex; use `contract_id` + `function_name` shape on the session client instead (per walkthrough invoke doc).

## Handover

Prefer handing over to T3N for hosting/maintenance (enterprise agent, low-touch).

— DevilX / Silverbullets1
