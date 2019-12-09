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
        address taker;
        address maker;
        address baseToken;
        address quoteToken;
        address relayer;
        uint256 baseTokenAmount;
        uint256 quoteTokenAmount;
        string  takerSide;
    }
    
    
       struct TradeParam {
        address taker;
        address maker;
        uint256 baseTokenAmount;
        uint256 quoteTokenAmount;
        string  takerSide;
        bytes32 r;
        bytes32 s;
        uint8 v;
    }
    
    struct OrderAddressSet {
	    address baseToken;
        address quoteToken;
        address relayer;
    }

event isValid(address ads);
event orderhashmsg(bytes32 bs);
    bytes32 public constant EIP712_ORDERTYPE=
    keccak256(abi.encodePacked("Order(address taker,address maker,address baseToken,address quoteToken,address  relayer,uint256 baseTokenAmount,uint256 quoteTokenAmount,string takerSide)"));
    
    string private constant EXCHANGE_NAME="Mist exchange";
    bytes32 private constant EXCHANGE_NAME_HASH=keccak256(abi.encodePacked("EIP712Domain(string name)"));

    bytes32 private constant EXCHANGE_SEPARA=keccak256(abi.encodePacked(EXCHANGE_NAME_HASH,keccak256(bytes(EXCHANGE_NAME))));


    


    function hashordermsg(Order _order) public returns(bytes32){
        return hashmsg(getorderhash(_order));
    }


  

     function getorderhash(Order _order)   public  returns(bytes32){
            return keccak256(abi.encodePacked(
                EIP712_ORDERTYPE,
                bytes32(_order.taker),
                bytes32(_order.maker),
                bytes32(_order.baseToken),
                bytes32(_order.quoteToken),
                bytes32(_order.relayer),
                _order.baseTokenAmount,
                _order.quoteTokenAmount,
                bytes32(keccak256(_order.takerSide))
                ));
     }
 



     function isValidSignature(bytes32 _hash,TradeParam _trade,OrderAddressSet _order) public  returns(bool){
         address _recover;
        //  uint8 signmethod=uint8(_signature.config[1]);
        //  uint8 v=uint8(_signature.config[0]);
        //  if(signmethod==uint8(SignatureMethod.EthSign)){
        //         _recover= ecrecover(
        //         keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)),
        //         v,
        //         _signature.r,
        //         _signature.s
        //     );
        //  }else{
            _recover= ecrecover(_hash,_trade.v, _trade.r, _trade.s);
        //  }
         emit  isValid(_recover);
         return (_order.relayer==_recover);
     }



    bytes32 bts;

     function  hashmsg( bytes32 _hashmsg) public  returns(bytes32) {
         bts=keccak256(abi.encodePacked("\x19\x01",EXCHANGE_SEPARA,_hashmsg));
            emit orderhashmsg(bts);
            return keccak256(abi.encodePacked("\x19\x01",EXCHANGE_SEPARA,_hashmsg));
     }



    function getorders(TradeParam _ts,OrderAddressSet _ost)  internal  returns(Order result){
        result.taker=_ts.taker;
        result.maker=_ts.maker;
        result.baseToken=_ost.baseToken;
        result.quoteToken=_ost.quoteToken;
        result.relayer=_ost.relayer;
        result.baseTokenAmount=_ts.baseTokenAmount;
        result.quoteTokenAmount=_ts.quoteTokenAmount;
        result.takerSide=_ts.takerSide;

    }

    function matchOrder(
        TradeParam[] memory TradeParams,
        OrderAddressSet memory orderAddressSet) public{
    for(uint256 i=0;i<TradeParams.length;i++){
	//takerside为taker吃掉的单子方向，吃掉买单side为buy，反之sell
        Order memory order=getorders(TradeParams[i],orderAddressSet);
                    bytes32 bs= hashordermsg(order);
        require(isValidSignature(bs,TradeParams[i],orderAddressSet),"validsignature");            
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

///0x63ea21d2e950bc23b9408743949efce8eeffdcc851

