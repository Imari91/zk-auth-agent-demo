# zk-auth-demo (v3): ZK Authorization + Agent Identity (AgentID)

## What this version is
The “Rooted-ready” version: the ZK proof includes an **Agent Identity** concept, so the gateway can authorize not only based on a policy proof, but also based on **which agent** is acting.

Typical additions vs v1/v2:
- `agent_id` derived from a secret (Poseidon hash)
- Gateway whitelisting / allowlist checks on agent_id
- Same anti-replay checks (nonce + time window)
- Proof verification is still the core, but now paired with identity binding

## What it aims to demonstrate
- Why classic OAuth/user-centric identity does not fit “headless agents”
- How to bind an action to an **agent identity** without leaking the secret
- A realistic policy enforcement story:
  1) Proof valid
  2) Anti-replay valid
  3) AgentID allowed
  4) (Optional) Clearance/policy threshold proven in-circuit

## Modules and what they simulate
- `circuit/`
  - Circuit that outputs public signals like:
    - `commitment` (policy binding / audit hook)
    - `nonce` (anti-replay)
    - `timestamp` (time window)
    - `agent_id` (identity binding from secret)
    - `clearance` or policy threshold (depending on your circuit)
  - **Simulates** a policy with identity binding.
- `agent/`
  - Computes `agent_id` from `agent_secret`, builds proof.
  - **Simulates** an autonomous agent proving identity + compliance.
- `gateway/`
  - Verifies proof + checks nonce/time + checks allowlist(agent_id).
  - **Simulates** a Zero-Trust style policy enforcement point for agents.



## Prerequisites
- Node.js (LTS recommended)
- Python 3.10+ recommended
- `circom` installed and available in PATH
- `snarkjs` available via `npx` (recommended) or installed globally
- (Recommended) run everything from a clean repo without committed `node_modules`

Check:
```bash
node -v
python --version
circom --version
npx snarkjs --version
```

## Demo-ready setup (commands)

### 1- gateway (Pyhon)

From `zk-auth-demo-agentid/gateway`:
```bash
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```
By default the gateway should contain or load:

- verification_key.json
- an allowlist of valid agent_id values (hardcoded or config/env)

### 2- Agent (node)

From zk-auth-demo-agentid/agent:
```bash
npm install
```

### 3- Circuit build (once, if artifacts not provided)
From zk-auth-demo-agentid/circuit (adjust filenames as needed):

```bash
# Compile circuit
circom zk_auth_policy.circom --r1cs --wasm --sym -o build
```

### 4- Generate proof
From zk-auth-demo-agentid/agent:

```bash
node generate_input.js
node run_proof.js
```

This should produce something like:

- proof.json
- public.json (public signals)

### 5- Call the gateway
Example (adjust endpoint names if your gateway differs):
```bash
curl -X POST http://127.0.0.1:8000/api/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"proof\": $(type proof.json), \"publicSignals\": $(type public.json)}"
  ```

  If you prefer, paste proof.json + public.json into a single payload file and curl -d @payload.json.

  ### Optional: enforce expected commitment
  If your gateway supports it, set an environment variable:
  ```bash
  #Windows PowerShell
  $env:EXPECTED_COMMITMENT="123456789"
  uvicorn main:app --reload --port 8001
  ```

### Notes

This is a PoC. The nonce store is typically in-memory and resets on restart.
The policy is intentionally simple to keep the focus on ZK flow + gateway enforcement.