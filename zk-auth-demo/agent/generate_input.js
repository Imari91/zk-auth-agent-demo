const fs = require("fs");

const clearance = 4;
const environment = 1;
const action = 2;
const secret = 123;

//generar timestamp automatico
const timestamp = Math.floor(Date.now() / 1000);


//un nonce aleatorio pequeno
const nonce = Math.floor(Math.random() * 100000);

//commitment automatico simple
const commitment =
  clearance + environment + action + secret + nonce + timestamp; //en un caso real, esto seria un hash o algo mas complejo

const input = {
  clearance,
  environment,
  action,
  secret,
  nonce,
  timestamp,
  commitment,
}; 

fs.writeFileSync("validInput.json", JSON.stringify(input, null, 2));

console.log("Input generated:");
console.log(input);