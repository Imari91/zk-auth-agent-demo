const fs = require("fs");
const crypto = require("crypto");
const { buildPoseidon } = require("circomlibjs");

const FIELD_MODULUS = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

async function main() {

  const poseidon = await buildPoseidon();

  //Define Policy values (these would be defined by the policy and required in the proof, but for simplicity we are defining them here in the agent)
  const clearance = BigInt(4);
  const environment = BigInt(1);
  const action = BigInt(2);
  const secret = BigInt(123);

  const nonce = BigInt(Math.floor(Math.random() * 100000));
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  //Define Agent identity (in a real case, the agent would have a secret and the agent_id would be generated from that secret, for example using a hash or a Poseidon function. Here we are just simulating that with a random secret and the Poseidon hash to generate the agent_id)
  const agent_secret = BigInt(12345); 
  const agent_id = poseidon([agent_secret]); //use Poseidon hash to generate agent_id from agent_secret
  const agent_id_str = poseidon.F.toString(agent_id);

  console.log("Agent ID:", agent_id_str);

  //Plan binding - agent must blind to specific plan
  const operation = "rotate_secret";
  const resource = "vault/prod/db_password";
  const change_id = "PR-8421";

  //hash of the plan details to be included in the commitment, so the proof is bound to this specific plan and cannot be reused for another plan. In a real case, the plan details would be defined by the policy and required in the proof, but for simplicity we are defining them here in the agent.
  const plan_string = `${operation}|${resource}|${change_id}`;
  const raw_hash = BigInt("0x" + crypto.createHash("sha256").update(plan_string).digest("hex"));
  const plan_hash = raw_hash % FIELD_MODULUS;

  //Final commitment
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