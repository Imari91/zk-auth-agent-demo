pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template ZkAuthPolicyV3() {

    // Private
    signal input clearance;
    signal input environment;
    signal input action;
    signal input secret;
    signal input nonce;
    signal input timestamp;
    signal input plan_hash;
    signal input agent_secret;

    // Public
    signal output agent_id;
    signal output nonce_out;
    signal output timestamp_out;
    signal output plan_hash_out;
    signal output commitment;

    // === Identity binding ===
    component hashAgent = Poseidon(1);
    hashAgent.inputs[0] <== agent_secret;

    agent_id <== hashAgent.out;

    // === Policy ===
    //8 or 16 both might work
    component checkClearance = GreaterEqThan(8);
    //clearance >=3 cannot be used as circom does not create valid constrain
    checkClearance.in[0] <== clearance;
    checkClearance.in[1] <== 3;
    environment - 1 === 0;
    action - 2 === 0;

    // === Bind outputs ===
    nonce_out <== nonce;
    timestamp_out <== timestamp;
    plan_hash_out <== plan_hash;

    commitment <== clearance + environment + action + secret + nonce + timestamp + plan_hash + agent_secret;
}

component main = ZkAuthPolicyV3();