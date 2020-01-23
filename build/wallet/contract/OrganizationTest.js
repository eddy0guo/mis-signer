"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Organization_1 = require("./Organization");
class OrganizationTest {
    constructor() {
        this.contractAddress = '0x6341ff68faa73f9056d174881a4aa65ebaa2004ca6';
        this.addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
        this.word0 = 'ivory local this tooth occur glide wild wild few popular science horror';
        this.organization = new Organization_1.default(this.contractAddress);
    }
    async testGetTemplateInfo() {
        return this.organization.TemplateInfo(this.addr0);
    }
    async testissueMoreAsset(index, wallet) {
        this.organization.unlock(wallet, '111111');
        return this.organization.issueMoreAsset(index);
    }
}
exports.default = OrganizationTest;
//# sourceMappingURL=OrganizationTest.js.map