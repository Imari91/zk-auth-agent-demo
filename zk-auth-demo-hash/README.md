# zk-auth-demo (v2): Commitment/Hash-based ZK Authorization

## What this version is
An evolution of the baseline demo where the circuit produces a **commitment** (hash/commitment of attributes) as part of the public signals.

Compared to v1, this version emphasizes **cryptographic binding**:
- Public commitment is a compact representation of private attributes.
- The gateway can reference this commitment as a “policy handle”, audit hook, or correlation ID.

## What it aims to demonstrate
- How to build a ZK statement that is **bound** to a commitment instead of linear sums.
- How a gateway can use the commitment to:
  - log/audit “what policy instance was proven”
  - optionally match “expected commitment” for a resource/action
- A better narrative for security reviews: “commitment is not a toy variable”

## Modules and what they simulate
- `circuit/`
  - Circom circuit using a hash/commitment primitive (e.g., Poseidon / MiMC / similar).
  - **Simulates** a policy that’s bound to a cryptographic commitment.
- `agent/`
  - Builds the private inputs, generates proof/public signals.
  - **Simulates** an agent producing “policy proof” without exposing the private attributes.
- `gateway/`
  - Verifies proof + anti-replay (nonce/time window).
  - **Simulates** an enforcement point that can also log/compare commitment.



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

From `zk-auth-demo-hash/gateway`:
```bash
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 2- Agent (node)

From zk-auth-demo-hash/agent:
```bash
npm install
```

### 3- Circuit build (once, if artifacts not provided)
From zk-auth-demo-hash/circuit (adjust filenames as needed):

```bash
# Compile circuit
circom zk_auth_policy.circom --r1cs --wasm --sym -o build
```

### 4- Generate proof
From zk-auth-demo-hash/agent:

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