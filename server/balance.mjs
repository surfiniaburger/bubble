import fetch from 'node-fetch';

const url = 'https://api.circle.com/v1/w3s/wallets/113684c0-c8ae-5a76-8ffe-11e2bc0ac99a/balances';
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    authorization: 'Bearer TEST_API_KEY:fecbd21d9c360b606a6fb648c946fb91:03a977007ac0a8572eaf1b818ecb0386'
  }
};

fetch(url, options)
  .then(res => res.text())
  .then(text => console.log(text))
  .catch(err => console.error('error:' + err));