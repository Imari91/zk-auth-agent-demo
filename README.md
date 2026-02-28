# zk-Auth — Zero Knowledge Authorization for Autonomous Agents

> How do you authorize an AI agent without exposing its data, prompts, weights or internal reasoning?

This project demonstrates a practical implementation of **Zero-Knowledge based authorization (zk-SNARK)** for autonomous agents.

The agent proves:

- It complies with policy
- It is a specific cryptographic identity
- It is executing an exact approved plan
- Without revealing sensitive inputs


# 🔐Problem Statement

Traditional agent authorization relies on:

- Tokens
- Claims
- Static RBAC roles
- Opaque delegated permissions

These approaches expose metadata and are vulnerable to:

- Replay attacks
- Statement confusion
- Policy bypass
- Agent impersonation
- Overprivileged execution

We propose a different model:

> Authorization by mathematical proof.


# 🧠Architecture Overview

Agent
- Generates private inputs
- Computes plan_hash (SHA256)
- Computes agent_id (Poseidon)
- Generates zk-SNARK proof
- Sends proof + public signals

Policy Gateway
- Verifies zk proof
-Checks agent identity whitelist
- Recomputes plan hash
- Validates nonce (anti-replay)
- Validates timestamp (time window)
- Executes action if approved

# 🏗 Project Structure

zk-auth-demo-agentid/
│
├── circuit/ # Circom circuits
│ ├── zk_auth_policy_v3.circom
│ └── artifacts_v3/
│
├── agent/ # Agent proof generation
│ ├── generate_input.js
│ ├── run_proof.js
│ └── package.json
│
├── gateway/ # Policy Gateway (FastAPI)
│ ├── main.py
│ └── requirements.txt
│
└── README.md

--

# 🚀 Demo Evolution

## v1 - Basic Policy Proof

Agent proves:

- clearance >= 3
- environment == production
- action == rotate_secret

No identity binding.


## v2 - Plan Binding (Statement Confusion Defense)

Agent proves:

- Policy compliance
- SHA256(operation|resource|change_id) matches proof

Prevents:
- Statement confusion
- Action swapping
- Intent manipulation


## v3 - Agent Identity (Zero Knowledge Identity)

Agent proves:

- Policy compliance
- Exact plan binding
- Identity via Poseidon(agent_secret)

Gateway enforces:

- Identity whitelist
- Anti-replay (nonce)
- Time window validation
- zk proof verification
- Plan hash consistency

This approximates:

- Admission controllers
- Policy enforcement points
- Zero-trust agent identity


# 🔬 Cryptographic Components

- Circom 2.x
- Groth16 zk-SNARK
- bn128 curve
- SHA256 (plan binding)
- Poseidon hash (agent identity)
- snarkjs

# 🧪 Running the Demo

## 1. Compile Circuit

circom zk_auth_policy_v3.circom --r1cs --wasm --sym -o artifacts_v3 -l node_modules

## 2. Setup zk keys

snarkjs groth16 setup artifacts_v3/zk_auth_policy_v3.r1cs pot12_final.ptau artifacts_v3/zk_auth_0000.zkey
snarkjs zkey contribute artifacts_v3/zk_auth_0000.zkey artifacts_v3/zk_auth_final.zkey
snarkjs zkey export verificationkey artifacts_v3/zk_auth_final.zkey artifacts_v3/verification_key.json

## 3.Generate Proof

Inside `agent/`:

node run_proof.js

## 4. Run Gateway

Inside `gateway/`:
uvicorn main:app --reload

## 5. Execute Request

curl.exe -X POST "http://127.0.0.1:8000/api/execute
" -H "Content-Type: application/json" --data-binary "@request.json"
