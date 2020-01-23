"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function formatNum(num) {
    if ((num === 0) || (num)) {
        num = num.toString();
        if (num.indexOf('e') > 0) {
            const base = num.slice(0, num.indexOf('e'));
            let multiple = num.slice(num.indexOf('e') + 2);
            const direction = num.slice(num.indexOf('e') + 1, num.indexOf('e') + 2);
            if (direction === '-') {
                multiple = '0.000000000'.slice(0, multiple * 1 + 1);
                num = multiple + base;
            }
            else if (direction === '+') {
                multiple = '000000000000'.slice(0, multiple);
                num = base + multiple;
            }
        }
        return num;
    }
}
exports.default = formatNum;
//# sourceMappingURL=formatNum.js.map