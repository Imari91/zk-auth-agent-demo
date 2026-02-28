pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template ZkAuthPolicy() {

    // PRIVATE INPUTS
    signal input clearance;
    signal input environment;
    signal input action;
    signal input secret;

    // PUBLIC INPUTS
    signal input commitment;
    signal input nonce;
    signal input timestamp;

    signal computed;

    // Commitment binding
    computed <== clearance + environment + action + secret + nonce + timestamp;

    commitment === computed;

    // clearance >= 3
    component lt = LessThan(32);
    lt.in[0] <== clearance;
    lt.in[1] <== 3;

    // clearance >= 3  => NOT (clearance < 3)
    lt.out === 0;

    // environment == 1
    environment === 1;

    // action == 2
    action === 2;
}

component main {public [commitment, nonce, timestamp]} = ZkAuthPolicy();