# zk-auth-demo (v1): ZK Authorization PoC (baseline)

## What this version is
Baseline Proof-of-Concept of **Zero-Knowledge authorization**: an external “agent” generates a ZK proof that it satisfies a simple policy, and a “gateway” verifies the proof before authorizing an action.

This version focuses on the **core mechanics**:
- Public signals + Groth16 proof generation
- Gateway verification + simple anti-replay controls
- Minimal policy logic in the circuit (intentionally simple)

## What it aims to demonstrate
- **“Prove, don’t reveal”**: The agent proves it meets a requirement without disclosing the full private inputs.
- **Gateway-enforced authorization** driven by proof verification.
- The difference between *valid proof* vs *valid proof + operational checks* (nonce/time window).

## Modules and what they simulate
- `circuit/`
  - Circom circuit encoding the policy.
  - **Simulates** the policy constraint that must be proven.
- `agent/`
  - Generates inputs, witness, proof, and public signals.
  - **Simulates** a non-human actor (tool/agent) that can’t “log in” like a user.
- `gateway/`
  - FastAPI verification service.
  - **Simulates** an API gateway / policy enforcement point (PEP).


## Prerequisites
- Node.js (LTS recommended)
- Python 3.10+ recommended
- `circom` installed and available in PATH
- `snarkjs` available via `npx` (recommended) or installed globally

Check:
```bash
node -v
python --version
circom --version
npx snarkjs --version
```

## Demo-ready setup (commands)

### 1- gateway (Pyhon)

From zk-auth-demo/gateway:

```bash
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2- Agent (node)

From zk-auth-demo/agent:
```bash
npm install
```

### 3- Circuit build (once, if artifacts not provided)
From zk-auth-demo/circuit (adjust filenames as needed):

```bash
# Compile circuit
circom zk_auth_policy.circom --r1cs --wasm --sym -o build
```

### 4- Generate proof
From zk-auth-demo/agent:

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
curl -X POST http://127.0.0.1:8000/authorize ^
  -H "Content-Type: application/json" ^
  -d "{\"proof\": $(type proof.json), \"publicSignals\": $(type public.json)}"
  ```

  If you prefer, paste proof.json + public.json into a single payload file and curl -d @payload.json.

#Notes

This is a PoC. The nonce store is typically in-memory and resets on restart.
The policy is intentionally simple to keep the focus on ZK flow + gateway enforcement.