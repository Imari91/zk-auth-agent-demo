const fs = require("fs");

const clearance = 4;
const environment = 1;
const action = 2;
const secret = 123;

//generate automatic timestamp
//const timestamp = Math.floor(Date.now() / 1000);
const timestamp = BigInt(Math.floor(Date.now() / 1000));

//a random small nonce
//const nonce = Math.floor(Math.random() * 100000);
const nonce = BigInt(Math.floor(Math.random() * 100000));


//---This is being introduced by this new version of the demo plan + HASH---//
const crypto = require("crypto");

const operation = "rotate_secret";
const resource = "vault/prod/db_password";
const change_id = "PR-8421";

//Real hash
const plan_string = operation + "|" + resource + "|" + change_id;
const hash = crypto.createHash("sha256").update(plan_string).digest("hex");

//we could exceed the field size of the circuit, so we need to reduce it
const FIELD_MODULUS = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

const raw_hash = BigInt("0x" + hash);
const plan_hash = (raw_hash % FIELD_MODULUS).toString();

//---End additional module plan + HASH---//


//commitment including the hashed plan
const commitment =
  BigInt(clearance)
  + BigInt(environment)
  + BigInt(action)
  + BigInt(secret)
  + BigInt(nonce)
  + BigInt(timestamp)
  + BigInt(plan_hash);


//Demo with plan hash included in the commitment, but not as a public input to the circuit, just to show how to include it in the proof without making it public. In a real case, the plan hash would be a public input and the circuit would check that it corresponds to the operation, resource and change_id of the policy.
const input = {
  clearance: clearance.toString(),
  environment: environment.toString(),
  action: action.toString(),
  secret: secret.toString(),
  nonce: nonce.toString(),
  timestamp: timestamp.toString(),
  plan_hash: plan_hash.toString(),
  commitment: commitment.toString()
};

fs.writeFileSync("validInput.json", JSON.stringify(input, null, 2));

console.log("Input generated:");
console.log(input);