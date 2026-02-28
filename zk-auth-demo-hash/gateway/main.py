from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import subprocess
import json
import time
import hashlib
import os

app = FastAPI()

# Simple in-memory nonce store
used_nonces = set()


# simple path
class ProofRequest(BaseModel):
    proof_path: str
    public_path: str


# hash path
class ExecuteRequest(BaseModel):
    operation: str
    resource: str
    change_id: str
    proof_path: str
    public_path: str


# def verify_proof(proof_path, public_path):
#   result = subprocess.run(
#        [
#            "snarkjs",
#            "groth16",
#            "verify",
#           #"../circuit/artifacts/verification_key.json",
#           "../circuit/artifacts_v2/verification_key.json",
#            public_path,
#            proof_path
#        ],
#        capture_output=True,
#        text=True,
#        shell=True  #importante en Windows
#    )

#    return "OK!" in result.stdout


def verify_proof(proof_path, public_path):

    cmd = (
        f"snarkjs groth16 verify "
        f"../circuit/artifacts_v2/verification_key.json "
        f"{public_path} "
        f"{proof_path}"
    )

    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)

    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)

    return "OK!" in result.stdout


@app.post("/authorize")
def authorize(req: ProofRequest):

    # Load public inputs
    with open(req.public_path) as f:
        public_data = json.load(f)

    # Compatible con ambas estructuras de snarkjs
    if isinstance(public_data, dict) and "publicSignals" in public_data:
        signals = public_data["publicSignals"]
    elif isinstance(public_data, list):
        signals = public_data
    else:
        return {"status": "DENIED", "reason": "Malformed public signals"}

    commitment = int(signals[0])
    nonce = int(signals[1])
    timestamp = int(signals[2])

    start_time = time.time()
    log_siem("Proof received")

    # check de ataque Replay
    if nonce in used_nonces:
        log_siem("Replay detected")
        return {"status": "DENIED", "reason": "Nonce already used"}

    # Ventana de tiempo para evitar ataques replay de 300 segundos
    current_time = int(time.time())
    if abs(current_time - timestamp) > 300:
        log_siem("Expired proof")
        return {"status": "DENIED", "reason": "Expired proof"}

    # Verify zk proof
    if not verify_proof(req.proof_path, req.public_path):
        log_siem("Invalid proof")
        return {"status": "DENIED", "reason": "Invalid proof"}

    # Mark nonce used
    used_nonces.add(nonce)

    # keep log in SIEM with timing
    verification_time = time.time() - start_time
    log_siem(f"Proof verified in {verification_time:.4f}s")
    log_siem("Admission granted: ROTATE_SECRET")

    # Simulated GitOps action
    return {
        "status": "GRANTED",
        "action": "ROTATE_SECRET",  # happy path
        # "action": "DEPLOY_PROD_CLUSTER", #statement confusion path
        "admission": "APPROVED",
        "verification_time": verification_time,
    }


@app.post("/api/execute")
def execute(req: ExecuteRequest):

    # Load public inputs
    with open(req.public_path) as f:
        public_data = json.load(f)

    if isinstance(public_data, dict) and "publicSignals" in public_data:
        signals = public_data["publicSignals"]
    elif isinstance(public_data, list):
        signals = public_data
    else:
        return {"status": "DENIED", "reason": "Malformed public signals"}

    nonce = int(signals[0])
    timestamp = int(signals[1])
    plan_hash_from_proof = int(signals[2])
    commitment = int(signals[3])

    # recalculate hash in gateway and compare with proof to prevent statement confusion
    plan_string = f"{req.operation}|{req.resource}|{req.change_id}"
    FIELD_MODULUS = int(
        "21888242871839275222246405745257275088548364400416034343698204186575808495617"
    )
    raw_hash = int(hashlib.sha256(plan_string.encode()).hexdigest(), 16)
    plan_hash_gateway = raw_hash % FIELD_MODULUS

    if plan_hash_gateway != plan_hash_from_proof:
        return {
            "status": "DENIED",
            "reason": "Plan hash mismatch (statement confusion detected)",
        }

    start_time = time.time()
    log_siem("Proof received")

    # check de ataque Replay
    if nonce in used_nonces:
        log_siem("Replay detected")
        return {"status": "DENIED", "reason": "Nonce already used"}

    # Ventana de tiempo para evitar ataques replay de 300 segundos
    current_time = int(time.time())
    if abs(current_time - timestamp) > 300:
        log_siem("Expired proof")
        return {"status": "DENIED", "reason": "Expired proof"}

    # Verify zk proof
    if not verify_proof(req.proof_path, req.public_path):
        log_siem("Invalid proof")
        return {"status": "DENIED", "reason": "Invalid proof"}

    # Mark nonce used
    used_nonces.add(nonce)

    # keep log in SIEM with timing
    verification_time = time.time() - start_time
    log_siem(f"Proof verified in {verification_time:.4f}s")
    log_siem("Admission granted: ROTATE_SECRET")

    # Simulated GitOps action
    return {
        "status": "GRANTED",
        "action": "ROTATE_SECRET",  # happy path
        # "action": "DEPLOY_PROD_CLUSTER", #statement confusion path
        "admission": "APPROVED",
        "verification_time": verification_time,
    }


def log_siem(message):
    print(f"[{datetime.utcnow().isoformat()}] [SIEM] {message}")
