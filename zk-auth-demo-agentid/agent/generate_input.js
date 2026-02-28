const fs = require("fs");
const crypto = require("crypto");
const { buildPoseidon } = require("circomlibjs");

const FIELD_MODULUS = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

async function main() {

  const poseidon = await buildPoseidon();

  // === Policy values ===
  const clearance = BigInt(4);
  const environment = BigInt(1);
  const action = BigInt(2);
  const secret = BigInt(123);

  const nonce = BigInt(Math.floor(Math.random() * 100000));
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  // === Agent identity ===
  const agent_secret = BigInt(987654321);
  const agent_id = poseidon([agent_secret]);
  const agent_id_str = poseidon.F.toString(agent_id);

  console.log("Agent ID:", agent_id_str);

  // === Plan binding ===
  const operation = "rotate_secret";
  const resource = "vault/prod/db_password";
  const change_id = "PR-8421";

  const plan_string = `${operation}|${resource}|${change_id}`;
  const raw_hash = BigInt("0x" + crypto.createHash("sha256").update(plan_string).digest("hex"));
  const plan_hash = raw_hash % FIELD_MODULUS;

  // === Commitment ===
  const commitment =
    clearance +
    environment +
    action +
    secret +
    nonce +
    timestamp +
    plan_hash +
    agent_secret;

  const input = {
    clearance: clearance.toString(),
    environment: environment.toString(),
    action: action.toString(),
    secret: secret.toString(),
    nonce: nonce.toString(),
    timestamp: timestamp.toString(),
    plan_hash: plan_hash.toString(),
    agent_secret: agent_secret.toString()
  };

  fs.writeFileSync("validInput.json", JSON.stringify(input, null, 2));
}

main();