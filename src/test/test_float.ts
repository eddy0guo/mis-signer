import NP from '../common/NP';
import BigNumber from 'bignumber.js';

let a:BigNumber = new BigNumber(0.33);
a = a.times(103343.6081)
a = a.times(100000000)

console.log('BN',a.toFixed());

console.log('NP',NP.round(NP.times(0.33,103343.6081,100000000),0));