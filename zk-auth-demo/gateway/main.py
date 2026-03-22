# -----------------------------------------------------------------------------
# AI Gateway for ZK Authentication - Proof of Concept
# -----------------------------------------------------------------------------

import os

from fastapi import FastAPI
from pydantic import BaseModel, Field
from datetime import datetime
import subprocess
import json
import time

app = FastAPI(title="ZK Auth Gateway (PoC)", version="0.1.0")


#Simple in-memory nonce store
used_nonces = set()


#simple path
class ProofRequest(BaseModel):
    proof_path: str = Field(..., description="../circuit/artifacts/proof.json")
    public_path: str = Field(..., description="../circuit/artifacts/public.json")

#Proof verification using snarkjs CLI
def verify_proof(proof_path, public_path):
    result = subprocess.run(
        [
            "snarkjs",
            "groth16",
            "verify",
            "../circuit/artifacts/verification_key.json",
            public_path,
            proof_path,
        ],
        capture_output=True,
        text=True,
        shell=True,  #important when using Windows
    )

    return "OK!" in result.stdout

#Basic authorisation endpoint that verifies the proof and checks for replay attacks using nonces and timestamps
@app.post("/authorize")
def authorize(req: ProofRequest):

    #Load public inputs
    with open(req.public_path) as f:
        public_data = json.load(f)

    #Compatible with both snarkjs instances
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

    #check replay attack scenario
    if nonce in used_nonces:
        log_siem("Replay detected")
        return {"status": "DENIED", "reason": "Nonce already used"}

    #Timeframe to prevent replay attacked within 300 seconds
    current_time = int(time.time())
    if abs(current_time - timestamp) > 300:
        log_siem("Expired proof")
        return {"status": "DENIED", "reason": "Expired proof"}

    #Verify zk proof
    if not verify_proof(req.proof_path, req.public_path):
        log_siem("Invalid proof")
        return {"status": "DENIED", "reason": "Invalid proof"}

    #Mark nonce as used
    used_nonces.add(nonce)

    #keep log in simulated SIEM with timing
    verification_time = time.time() - start_time
    log_siem(f"Proof verified in {verification_time:.4f}s")
    log_siem("Admission granted: ROTATE_SECRET")

    #Simulated GitOps action
    return {
        "status": "GRANTED",
        "action": "ROTATE_SECRET",  #happy path
        # "action": "DEPLOY_PROD_CLUSTER", #statement confusion path
        "admission": "APPROVED",
        "verification_time": verification_time,
    }


def log_siem(message):
    print(f"[{datetime.utcnow().isoformat()}] [SIEM] {message}")
