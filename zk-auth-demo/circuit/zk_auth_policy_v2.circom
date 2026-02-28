pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template ZkAuthPolicy() {

    //PRIVATE
    signal input clearance;
    signal input environment;
    signal input action;
    signal input secret;

    //PUBLIC
    signal input nonce;
    signal input timestamp;
    signal input plan_hash;
    signal input commitment;

    signal computed;

    computed <== clearance + environment + action + secret + nonce + timestamp + plan_hash;
    commitment === computed;

    //Policy logic
    component lt = LessThan(32);

    //If action == 2 (rotate) then clearance >= 3
    //Simplified: enforce clearance >= 3 always
    lt.in[0] <== clearance;
    lt.in[1] <== 3;
    lt.out === 0;

    environment === 1;
}

component main {public [nonce, timestamp, plan_hash, commitment]} = ZkAuthPolicy();