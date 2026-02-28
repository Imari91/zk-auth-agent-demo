const fs = require("fs");

const clearance = 4;
const environment = 1;
const action = 2;
const secret = 123;

//generar timestamp automatico
//const timestamp = Math.floor(Date.now() / 1000);
const timestamp = BigInt(Math.floor(Date.now() / 1000));

//un nonce aleatorio pequeno
//const nonce = Math.floor(Math.random() * 100000);
const nonce = BigInt(Math.floor(Math.random() * 100000));


//---Parte solo necesitada en el commitment + HASH---//
//----------------------------------------------------
const crypto = require("crypto");

const operation = "rotate_secret";
const resource = "vault/prod/db_password";
const change_id = "PR-8421";

//Hash real
const plan_string = operation + "|" + resource + "|" + change_id;
const hash = crypto.createHash("sha256").update(plan_string).digest("hex");

//convertimos hash hex a numero grande (decimal)
//const plan_hash = BigInt("0x" + hash).toString(); //esto me da un overflow del SHA256

const FIELD_MODULUS = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

const raw_hash = BigInt("0x" + hash);
const plan_hash = (raw_hash % FIELD_MODULUS).toString();

//---Fin parte solo necesaria en el commitment + HASH---//


//commitment automatico simple
/*const commitment =
  clearance + environment + action + secret + nonce + timestamp; //en un caso real, esto seria un hash o algo mas complejo

*/

//commitment con hash del plan
const commitment =
  BigInt(clearance)
  + BigInt(environment)
  + BigInt(action)
  + BigInt(secret)
  + BigInt(nonce)
  + BigInt(timestamp)
  + BigInt(plan_hash);

/* demo sencilla
const input = {
  clearance,
  environment,
  action,
  secret,
  nonce,
  timestamp,
  commitment,
}; */

//Demo con hash plan incluido
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