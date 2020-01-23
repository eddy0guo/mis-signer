import Organization from './Organization'

export default class OrganizationTest {
    contractAddress = '0x6341ff68faa73f9056d174881a4aa65ebaa2004ca6';

    /**
     * Addresses of Asilink
     */

    /**
     * Address of Wallet
     */

 addr0 = '0x66edd03c06441f8c2da19b90fcc42506dfa83226d3';
 word0 = 'ivory local this tooth occur glide wild wild few popular science horror';


    organization;

    constructor(){
        this.organization = new Organization(this.contractAddress)
    }

    async testGetTemplateInfo(){
      return this.organization.TemplateInfo(this.addr0);
    }

    async testissueMoreAsset(index,wallet){
         this.organization.unlock(wallet,'111111')
      // return this.organization.issueMoreAsset(this.addr0,index);
      return this.organization.issueMoreAsset(index);
    }


  }
