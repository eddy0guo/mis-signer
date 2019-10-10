pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;
contract Template {
    uint16 internal category;
    string internal templateName;
    
    /// @dev initialize a template
    ///  it was originally the logic inside the constructor
    ///  it is changed in such way to provide a better user experience in the Asimov debugging tool
    /// @param _category category of the template
    /// @param _templateName name of the template
    function initTemplate(uint16 _category, string _templateName) public {
       require(msg.sender == 0x66dbdd2826fb068f2929af065b04c0804d0397b09e);
        category = _category;
        templateName = _templateName;
    }

    /// @dev TEST ONLY: MUST BE REMOVED AFTER THE TEST IS DONE
    /* function initTemplateExternal(uint16 _category, string _templateName) public {
        category = _category;
        templateName = _templateName;
    }*/ 
    
    /// @dev get the template information
    function getTemplateInfo() public view returns (uint16, string){
        return (category, templateName);
    }

}

interface MTToken {
        function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        public
        returns (bool);
}
contract MistExchange is Template{
        struct Order {
        address trader;
        address relayer;
        address baseToken;
        address quoteToken;
        uint256 baseTokenAmount;
        uint256 quoteTokenAmount;
        uint256 gasTokenAmount;

        bytes32 data;
    }
    
    
       struct TradeParam {
        address taker;
        address maker;
	uint256 baseTokenAmount;
	uint256 quoteTokenAmount;
	string takerSide;
    }
    
    struct OrderAddressSet {
	 address baseToken;
        address quoteToken;
        address relayer;
    }




    constructor () public{

    }



    function matchOrder(
        TradeParam[] memory TradeParams,
        OrderAddressSet memory orderAddressSet) public{
    for(uint256 i=0;i<TradeParams.length;i++){
	//takerside为taker吃掉的单子方向，吃掉买单side为buy，反之sell
	if (keccak256(abi.encodePacked(TradeParams[i].takerSide)) == keccak256(abi.encodePacked("buy"))){
		transferFrom(orderAddressSet.baseToken,TradeParams[i].maker,TradeParams[i].taker,TradeParams[i].baseTokenAmount);
                transferFrom(orderAddressSet.quoteToken,TradeParams[i].taker,TradeParams[i].maker,TradeParams[i].quoteTokenAmount);       
	}else if (keccak256(abi.encodePacked(TradeParams[i].takerSide)) == keccak256(abi.encodePacked("sell"))){
		transferFrom(orderAddressSet.baseToken,TradeParams[i].taker,TradeParams[i].maker,TradeParams[i].baseTokenAmount);
                transferFrom(orderAddressSet.quoteToken,TradeParams[i].maker,TradeParams[i].taker,TradeParams[i].quoteTokenAmount);   
	}else{
		revert("INVALID_TAKER_SIDE");
	}
    }
 }  
   function transferFrom(address token, address from, address to, uint256 value) internal { 
        bool result=MTToken(token).transferFrom(from,to,value);
       if (!result) {
            revert("transaction fail");
        }
    }




    

    struct mj{
        string naem;
    }
    struct asg{
        address adr;
        uint256 age;
        mj mg;
    }
    function sdfs(asg ab) public view returns(string){
        return ab.mg.naem;
    }

}

///0x63fc2f725c49553c9db0bcccb4f7bd3d2887a9669b

