
let origin = {
  	'secret':'didAuthSecret',
    'database': 'mongodb://did:hongqiaolvgu@119.23.215.121:27017/did_backup'
}

let local =  {
  'secret':'didAuthSecret',
  'database': 'mongodb://localhost/did'
};

export {local,origin};
