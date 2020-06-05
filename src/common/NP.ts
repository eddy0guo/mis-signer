import BigNumber from 'bignumber.js'
import  NP2 from 'number-precision'

export default class NP {
    static divide(num1, num2, ...others: any[]): string {
        if (others.length > 0) {
            return this.divide(this.divide(num1, num2), others[0], ...others.slice(1));
        }
        const bigNum1 = new BigNumber(num1);
        const bigNum2 = new BigNumber(num2);
        return bigNum1.dividedBy(bigNum2).toString();
    }
    static times(num1, num2, ...others: any[]): string {
        if (others.length > 0) {
            return this.times(this.times(num1, num2), others[0], ...others.slice(1));
        }
        const bigNum1 = new BigNumber(num1);
        const bigNum2 = new BigNumber(num2);
        return bigNum1.times(bigNum2).toString();
    }

    static plus(num1, num2, ...others: any[]): string {
        if (others.length > 0) {
            return this.plus(this.plus(num1, num2), others[0], ...others.slice(1));
        }
        const bigNum1 = new BigNumber(num1);
        const bigNum2 = new BigNumber(num2);
        return bigNum1.plus(bigNum2).toString();
    }

    static minus(num1, num2, ...others: any[]): string {
        if (others.length > 0) {
            return this.minus(this.minus(num1, num2), others[0], ...others.slice(1));
        }
        const bigNum1 = new BigNumber(num1);
        const bigNum2 = new BigNumber(num2);
        return bigNum1.minus(bigNum2).toString();
    }
}
