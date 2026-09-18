# T3N Agent Build Challenge — Submission

**Agent:** DevilX
**DID:** did:t3n:65fbd5823e89b5333049d77ffd4ea9db5b807d97
**GitHub Repo:** https://github.com/Silverbullets1/t3n-agent-build
**Submitted:** 2026-08-30
**Preference:** Hand over to T3N for hosting & maintenance

---

## 1. What was built

A working enterprise agent deployment on the T3N ADK (testnet), end-to-end:

1. **Authenticated T3N session** — quickstart completed; DID read back from the network (`did:t3n:65fbd5823e89b5333049d77ffd4ea9db5b807d97`), not hardcoded.
2. **TEE contract** — built the reference `z-tenant-flight` contract to a WASM wasip2 component and **registered it** on T3N as `travel-contracts` (contract id 804, v0.1.0). The contract exports `search-offers` (no PII, plain outbound HTTP) and `book-offer` (PII-safe via `http-with-placeholders`).
3. **Secrets map** — created the `secrets` KV map with contract-scoped readers/writers and seeded the API key via the control plane (`map-entry-set`).
4. **Egress authorization** — issued a self-grant (`agent-auth-update` on `tee:user/contracts`) scoping the contract to `api.duffel.com` for `search-offers` and `book-offer`.
5. **Invoke verified** — called `search-offers` through the node; the contract executed and made a real outbound HTTP request to the Duffel API (server responded 401 because the seeded key is a placeholder — this proves the full authenticated call path, encryption, contract dispatch, and egress all work).

## 2. Agent card

Hosted on T3N (no external storage):
`https://cn-api.sg.testnet.t3n.terminal3.io/api/agent-card/did:t3n:65fbd5823e89b5333049d77ffd4ea9db5b807d97`

ERC-8004 format, services: A2A + MCP + DID, `supportedTrust: ["tee-attestation"]`.

## 3. How to run (from README)

```bash
npm install @terminal3/t3n-sdk tsx
export T3N_API_KEY="0x..."        # your claim-page key
npx tsx quickstart.ts             # → Connected as: did:t3n:...
npx tsx walkthrough-register.ts   # → REGISTERED travel-contracts
npx tsx walkthrough-invoke.ts     # → maps + seed + invoke
```

Full scripts are in the public repo above.

## 4. Verified end-to-end (testnet, 2026-08-30)

- ✅ Authenticated session
- ✅ Agent card hosted
- ✅ Contract built + registered (`travel-contracts`, id 804, v0.1.0)
- ✅ Secrets map created + API key seeded
- ✅ Self-grant (agent-auth-update) OK
- ✅ Contract EXECUTED → outbound HTTP to api.duffel.com (401 = placeholder key proves the path works)

## 5. Bugs found (platform-side)

**Bug 1 — Trust manifest is malformed for SDK:**
`fetchTrustedManifest("testnet")` from `@terminal3/t3n-sdk` v5.3.0 throws `Trust manifest at https://cn-api.sg.testnet.t3n.terminal3.io/api/trust-manifest is malformed.` Direct `fetch` of the same URL returns valid JSON (keys: cluster, version, peer_ids, rtmr3_allowlist, signed_at, signature) — but there is **no `rtmr1_allowlist`**, which the SDK's TrustAnchor validation requires. Workaround: `{ unsafe_trust_server: true }` (disables attestation verification — acceptable on testnet, documented as the local-dev opt-out). This blocks the documented happy-path quickstart for every new user on the current testnet manifest.

**Bug 2 — TenantClient.contracts.execute name validation:**
Passing the full `z:<tid>:<tail>` as `name` to `tenant.contracts.execute` fails with `Tenant name tail must match /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,127}$/`. The working shape is `contract_id` + `function_name` + `input` on the authenticated session client, per the invoke-contract walkthrough — the two docs/code paths disagree, which costs time on first build.

## 6. Maintenance & handover

The deployment is intentionally low-touch:
- One command re-registers on version bump (`walkthrough-register.ts`)
- Secrets are managed through the control plane (no key in code)
- Contract capabilities come from `world.wit` imports, not a manifest

**Preference: hand over to T3N** for hosting and continued running (per the listing's option).

---
*DevilX / Silverbullets1 — public repo: https://github.com/Silverbullets1/t3n-agent-build*


---

## 6. ADDENDUM — post-breaking-change rebuild (2026-09-18)

T3N announced a **forced breaking change** (Ian Chong, 18 Sep 2026): tenant grants are now
**per-function scoped**, and the node ABI moved to `host:tenant@1.2.0` + `host:interfaces@2.2.0`.
Contracts built against the old ABI return `500 internal_error` on the new hosts.

Rebuild performed and re-uploaded live:

| Item | Before | After |
|---|---|---|
| SDK | `@terminal3/t3n-sdk` 5.2.0 | **5.19.0** |
| WIT deps | host-tenant 1.0.0 / host-interfaces 2.1.0 | **host-tenant 1.2.0 / host-interfaces 2.2.0** |
| `CONTRACT_VERSION` | 0.4.1 | **1.0.0** (major bump, as required) |
| Contract | `travel-contracts` v0.1.0 | **`travel-contracts` v1.0.0, contract_id 1060** |

Verification:
- `cargo build --release --target wasm32-wasip2` — OK; WASM imports confirmed at `host:tenant/tenant-context@1.2.0`, `host:interfaces/*@2.2.0`.
- `cargo test` — all tests + doctest pass.
- CLI `contract get` → `current_version 1.0.0`.
- Live invoke of `search-offers` executes end-to-end and reaches the Duffel API (401 from Duffel = placeholder key, proving full authenticated dispatch + KV secret read + egress).

**Gotcha found (not in the vendor email):** re-registering a contract allocates a **new contract_id**, which
silently breaks the existing KV map ACL (`kv read on 'z:…:secrets' denied: TenantContract(…/1060) cannot read map`).
Fix: `tenant.maps.update("secrets", {writers:{only:[1060]}, readers:{only:[1060]}})`.
Scripts added: `walkthrough-upgrade-0918.ts` (re-upload), `regrant-map-0918.ts` (map ACL re-grant).
