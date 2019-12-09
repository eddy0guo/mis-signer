

pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;
library SafeMath {

    // Multiplies two numbers, reverts on overflow.
    function mul(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "MUL_ERROR");

        return c;
    }

    // Integer division of two numbers truncating the quotient, reverts on division by zero.
    function div(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        require(b > 0, "DIVIDING_ERROR");
        return a / b;
    }

    function divCeil(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        uint256 quotient = div(a, b);
        uint256 remainder = a - quotient * b;
        if (remainder > 0) {
            return quotient + 1;
        } else {
            return quotient;
        }
    }

    // Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    function sub(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        require(b <= a, "SUB_ERROR");
        return a - b;
    }

    function sub(
        int256 a,
        uint256 b
    )
        internal
        pure
        returns (int256)
    {
        require(b <= 2**255-1, "INT256_SUB_ERROR");
        int256 c = a - int256(b);
        require(c <= a, "INT256_SUB_ERROR");
        return c;
    }

    // Adds two numbers, reverts on overflow.
    function add(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        uint256 c = a + b;
        require(c >= a, "ADD_ERROR");
        return c;
    }

    function add(
        int256 a,
        uint256 b
    )
        internal
        pure
        returns (int256)
    {
        require(b <= 2**255 - 1, "INT256_ADD_ERROR");
        int256 c = a + int256(b);
        require(c >= a, "INT256_ADD_ERROR");
        return c;
    }

    // Divides two numbers and returns the remainder (unsigned integer modulo), reverts when dividing by zero.
    function mod(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        require(b != 0, "MOD_ERROR");
        return a % b;
    }

    /**
     * Check the amount of precision lost by calculating multiple * (numerator / denominator). To
     * do this, we check the remainder and make sure it's proportionally less than 0.1%. So we have:
     *
     *     ((numerator * multiple) % denominator)     1
     *     -------------------------------------- < ----
     *              numerator * multiple            1000
     *
     * To avoid further division, we can move the denominators to the other sides and we get:
     *
     *     ((numerator * multiple) % denominator) * 1000 < numerator * multiple
     *
     * Since we want to return true if there IS a rounding error, we simply flip the sign and our
     * final equation becomes:
     *
     *     ((numerator * multiple) % denominator) * 1000 >= numerator * multiple
     *
     * @param numerator The numerator of the proportion
     * @param denominator The denominator of the proportion
     * @param multiple The amount we want a proportion of
     * @return Boolean indicating if there is a rounding error when calculating the proportion
     */
    function isRoundingError(
        uint256 numerator,
        uint256 denominator,
        uint256 multiple
    )
        internal
        pure
        returns (bool)
    {
        // numerator.mul(multiple).mod(denominator).mul(1000) >= numerator.mul(multiple)
        return mul(mod(mul(numerator, multiple), denominator), 1000) >= mul(numerator, multiple);
    }

    /**
     * Takes an amount (multiple) and calculates a proportion of it given a numerator/denominator
     * pair of values. The final value will be rounded down to the nearest integer value.
     *
     * This function will revert the transaction if rounding the final value down would lose more
     * than 0.1% precision.
     *
     * @param numerator The numerator of the proportion
     * @param denominator The denominator of the proportion
     * @param multiple The amount we want a proportion of
     * @return The final proportion of multiple rounded down
     */
    function getPartialAmountFloor(
        uint256 numerator,
        uint256 denominator,
        uint256 multiple
    )
        internal
        pure
        returns (uint256)
    {
        require(!isRoundingError(numerator, denominator, multiple), "ROUNDING_ERROR");
        // numerator.mul(multiple).div(denominator)
        return div(mul(numerator, multiple), denominator);
    }

    /**
     * Returns the smaller integer of the two passed in.
     *
     * @param a Unsigned integer
     * @param b Unsigned integer
     * @return The smaller of the two integers
     */
    function min(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        return a < b ? a : b;
    }
}




contract Template {
    uint16 internal category;
    string internal templateName;
    
    /// @dev initialize a template
    ///  it was originally the logic inside the constructor
    ///  it is changed in such way to provide a better user experience in the Asimov debugging tool
    /// @param _category category of the template
    /// @param _templateName name of the template
    function initTemplate(uint16 _category, string _templateName) public {
       // require(msg.sender == 0x66dbdd2826fb068f2929af065b04c0804d0397b09e);
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






contract MIST is Template {
    string public name     = "MIST Ether";
    string public symbol   = "MIST";
    uint8  public decimals = 18;

    event  Approval(address indexed src, address indexed guy, uint wad);
    event  Transfer(address indexed src, address indexed dst, uint wad);
    event  Deposit(address indexed dst, uint wad);
    event  Withdrawal(address indexed src, uint wad);

    mapping (address => uint)                       public  balanceOf;
    mapping (address => mapping (address => uint))  public  allowance;

    function() public payable {
        deposit();
    }
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        Deposit(msg.sender, msg.value);
    }
    function withdraw(uint wad) public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;
        msg.sender.transfer(wad,msg.assettype);
        Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint) {
        return this.balance;
    }

    function approve(address guy, uint wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(address dst, uint wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }
    function transferFrom(address src, address dst, uint wad)
        public
        returns (bool)
    {
        require(balanceOf[src] >= wad);

        if (src != msg.sender && allowance[src][msg.sender] != uint(-1)) {
            require(allowance[src][msg.sender] >= wad);
            allowance[src][msg.sender] -= wad;
        }

        balanceOf[src] -= wad;
        balanceOf[dst] += wad;

        Transfer(src, dst, wad);

        return true;
    }

    function balanceOf(address owner) public view returns (uint256 balance) {
        return balanceOf[owner];
    }
}

//0x639e91eb8de49667dc422f45c2bc5ea1d4d15c0645




interface IPriceOracle {
    /** return USD price of token */
    function getPrice(
        address asset
    )
        external
        view
        returns (uint256);
}

interface IStandardToken {
    function transfer(
        address _to,
        uint256 _amount
    )
        external
        returns (bool);

    function balanceOf(
        address _owner)
        external
        view
        returns (uint256 balance);

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    )
        external
        returns (bool);

    function approve(
        address _spender,
        uint256 _amount
    )
        external
        returns (bool);

    function allowance(
        address _owner,
        address _spender
    )
        external
        view
        returns (uint256);
}


interface IInterestModel {
    function polynomialInterestModel(
        uint256 borrowRatio
    )
        external
        pure
        returns(uint256);
}

interface ILendingPoolToken {
    function mint(
        address user,
        uint256 value
    )
        external;

    function burn(
        address user,
        uint256 value
    )
        external;

    function balanceOf(
        address user
    )
        external
        view
        returns (uint256);

    function totalSupply()
        external
        view
        returns (uint256);
}

contract TypesContract  is Template{
    struct Asset {
        ILendingPoolToken  lendingPoolToken;
        IPriceOracle      priceOracle;
        IInterestModel    interestModel;
    }

    enum BalanceCategory {
        Common,
        CollateralAccount
    }

    struct BalancePath {
        BalanceCategory category;
        uint16          marketID;
        address         user;
    }




    struct Order {
        address trader;
        address relayer;
        address baseAsset;
        address quoteAsset;
        uint256 baseAssetAmount;
        uint256 quoteAssetAmount;
        uint256 gasTokenAmount;
        /**
         * Data contains the following values packed into 32 bytes
         * ╔════════════════════╤═══════════════════════════════════════════════════════════╗
         * ║                    │ length(bytes)   desc                                      ║
         * ╟────────────────────┼───────────────────────────────────────────────────────────╢
         * ║ version            │ 1               order version                             ║
         * ║ side               │ 1               0: buy, 1: sell                           ║
         * ║ isMarketOrder      │ 1               0: limitOrder, 1: marketOrder             ║
         * ║ expiredAt          │ 5               order expiration time in seconds          ║
         * ║ asMakerFeeRate     │ 2               maker fee rate (base 100,000)             ║
         * ║ asTakerFeeRate     │ 2               taker fee rate (base 100,000)             ║
         * ║ 
         * 
         │ 2               rebate rate for maker (base 100)
         * 制造商退税率║
         * ║ salt               │ 8               salt                                      ║
         * ║ isMakerOnly        │ 1               is maker only                             ║
         * ║                    │ 9               reserved                                  ║
         * ╚════════════════════╧═══════════════════════════════════════════════════════════╝
         */
        bytes32 data;
    }




       struct OrderParam {
        address trader;
        uint256 baseAssetAmount;
        uint256 quoteAssetAmount;
        uint256 gasTokenAmount;
        bytes32 data; 
        Signature signature;
    }
    



    
    struct OrderInfo {
        bytes32 orderHash;
        uint256 filledAmount;
        BalancePath balancePath;
    }

    struct OrderAddressSet {
        address baseAsset;
        address quoteAsset;
        address relayer;
    }



    struct MatchResult {
        address maker;
        address taker;
        address buyer;
        uint256 makerFee;
        uint256 makerRebate;
        uint256 takerFee;
        uint256 makerGasFee;
        uint256 takerGasFee;
        uint256 baseAssetFilledAmount;
        uint256 quoteAssetFilledAmount;
        BalancePath makerBalancePath;
        BalancePath takerBalancePath;
    }




 

    struct Signature {
        /**
         * Config contains the following values packed into 32 bytes
         * ╔════════════════════╤═══════════════════════════════════════════════════════════╗
         * ║                    │ length(bytes)   desc                                      ║
         * ╟────────────────────┼───────────────────────────────────────────────────────────╢
         * ║ v                  │ 1               the v parameter of a signature            ║
         * ║ signatureMethod    │ 1               SignatureMethod enum value                ║
         * ╚════════════════════╧═══════════════════════════════════════════════════════════╝
         */
        bytes32 config;
        bytes32 r;
        bytes32 s;
    }



   struct MatchParams {
        OrderParam       takerOrderParam;
        OrderParam[]     makerOrderParams;
        uint256[]        baseAssetFilledAmounts;
        OrderAddressSet  orderAddressSet;
    }

    enum SignatureMethod {
        EthSign,
        EIP712
    }


    mapping (bytes32 => bool) cancelled;



    enum CollateralAccountStatus {
        Normal,
        Liquid
    }
       
    struct CollateralAccount {
        uint32 id;
        uint16 marketID;
        CollateralAccountStatus status;
        address owner;

        mapping(address => uint256) balances;
    }







    function isSell(
        OrderParam memory order
    )
        internal
        pure
        returns (bool)
    {
        return uint8(order.data[1]) == 1;
    }



    function getBalancePathFromOrderData(
        OrderParam memory order
    )
        internal
        pure
        returns (TypesContract.BalancePath memory)
    {
        BalanceCategory category;
        uint16 marketID;

        if (byte(order.data << (8*23)) == "\x01") {
            category = BalanceCategory.CollateralAccount;
            marketID = uint16(bytes2(order.data << (8*24)));
        } else {
            category = BalanceCategory.Common;
            marketID = 0;
        }

        return BalancePath({
            user: order.trader,
            category: category,
            marketID: marketID
        });
    }
}

contract EventsContract is Template{
    event jiancha(bool bl,bytes32 bts);
    event jieguo(uint256 bl,address recovereds);
    event Hashcont(bytes32 hashs);
    event MsgHash(bytes32 smghash);

}



contract StoreContract is TypesContract{

    struct ExchangeState {

        /**
        * Calculate and return the rate at which fees will be charged for an address. The discounted
        * rate depends on how much HOT token is owned by the user. Values returned will be a percentage
        * used to calculate how much of the fee is paid, so a return value of 100 means there is 0
        * discount, and a return value of 70 means a 30% rate reduction.
        *
        * The discountConfig is defined as such:
        * ╔═══════════════════╤════════════════════════════════════════════╗
        * ║                   │ length(bytes)   desc                       ║
        * ╟───────────────────┼────────────────────────────────────────────╢
        * ║ count             │ 1               the count of configs       ║
        * ║ maxDiscountedRate │ 1               the max discounted rate    ║
        * ║ config            │ 5 each                                     ║
        * ╚═══════════════════╧════════════════════════════════════════════╝
        *
        * The default discount structure as defined in code would give the following result:
        *
        * Fee discount table
        * ╔════════════════════╤══════════╗
        * ║     HOT BALANCE    │ DISCOUNT ║
        * ╠════════════════════╪══════════╣
        * ║     0 <= x < 10000 │     0%   ║
        * ╟────────────────────┼──────────╢
        * ║ 10000 <= x < 20000 │    10%   ║
        * ╟────────────────────┼──────────╢
        * ║ 20000 <= x < 30000 │    20%   ║
        * ╟────────────────────┼──────────╢
        * ║ 30000 <= x < 40000 │    30%   ║
        * ╟────────────────────┼──────────╢
        * ║ 40000 <= x         │    40%   ║
        * ╚════════════════════╧══════════╝
        *
        * Breaking down the bytes of 0x043c000027106400004e205a000075305000009c404600000000000000000000
        *
        * 0x  04           3c          0000271064  00004e205a  0000753050  00009c4046  0000000000  0000000000;
        *     ~~           ~~          ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~  ~~~~~~~~~~
        *      |            |               |           |           |           |           |           |
        *    count  maxDiscountedRate       1           2           3           4           5           6
        *
        * The first config breaks down as follows:  00002710   64
        *                                           ~~~~~~~~   ~~
        *                                               |      |
        *                                              bar    rate
        *
        * Meaning if a user has less than 10000 (0x00002710) HOT, they will pay 100%(0x64) of the
        * standard fee.
        *
        */
        bytes32 discountConfig;

        /**
        * Mapping of orderHash => amount
        * Generally the amount will be specified in base token units, however in the case of a market
        * buy order the amount is specified in quote token units.
        */
        mapping (bytes32 => uint256) filled;

        /**
        * Mapping of orderHash => whether order has been cancelled.
        */
        mapping (bytes32 => bool) cancelled;

        address hotTokenAddress;
    }
  struct State {

        uint16 marketsCount;

        mapping(address => TypesContract.Asset) assets;
        mapping(address => int256) cash;

        // // user => marketID => account
         mapping(address => mapping(uint16 => TypesContract.CollateralAccount)) accounts;

        // // all markets
        // mapping(uint16 => TypesContract.Market) markets;

        // // user balances
        mapping(address => mapping(address => uint256)) balances;

        // LendingPoolState pool;

         ExchangeState exchange;

        // RelayerState relayer;

        // AuctionState auction;
    }





    function getCommonPath(
        address user
    )
        internal
        pure
        returns ( TypesContract.BalancePath)
    {
        return TypesContract.BalancePath({
            user: user,
            category: TypesContract.BalanceCategory.Common,
            marketID: 0
        });
    }




      function getBalances(
        TypesContract.BalancePath memory path,
        StoreContract.State storage state,
      address asset
    )
        internal
        view
        returns (uint256)
    {
        if (path.category == TypesContract.BalanceCategory.Common) {
            return state.balances[path.user][asset];
        } else {
            return state.accounts[path.user][path.marketID].balances[asset];
        }
    }
}



interface MISTInterface{
     function transferFrom(address src, address dst, uint wad)
        public
        returns (bool);

    function transfer(address dst, uint wad) public returns (bool);
}




contract SafeERC20Contract is StoreContract{

    function safeTransfer(
        address token,
        address to,
        uint256 amount
    ) internal{
        // ERC20Interface(token).transfer(to,msg.sender,amout);
        //token.call.gas(100000)(abi.encodeWithSignature("transfer(address,uint)",to,amount));

       MISTInterface(token).transfer(to,amount);
    }

    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
      // token.call.gas(100000)(abi.encodeWithSignature("transferFrom(address,address,uint)",from,to,amount));
       MISTInterface(token).transferFrom(from,to,amount);
    }

}







contract TransferContract is SafeERC20Contract{
    using SafeMath for uint256;
    using SafeMath for int256;
    //转入
    function deposit(
        StoreContract.State storage state,
        address asset,
        uint256 amount
    )
        internal
    {
         if (asset != address(0)) {
        SafeERC20Contract.safeTransferFrom(asset, msg.sender, address(this), amount);
        } else {
            require(amount == msg.value, "MSG_VALUE_AND_AMOUNT_MISMATCH");
        }
         transferIn(state, asset, StoreContract.getCommonPath(msg.sender), amount);
        // EventsContract.logDeposit(msg.sender, asset, amount);

    }


    //转出
   function withdraw(
        StoreContract.State storage state,
        address asset,
        uint256 amount
    )
       internal
    {
        require(state.balances[msg.sender][asset] >= amount, "BALANCE_NOT_ENOUGH");

        if (asset == address(0)) {
           msg.sender.transfer(amount,msg.assettype);
        } else {
            SafeERC20Contract.safeTransfer(asset, msg.sender, amount);
         }

        transferOut(state, asset, StoreContract.getCommonPath(msg.sender), amount);

      //  EventsContract.logWithdraw(msg.sender, asset, amount);
    }



    function transferIn(
        StoreContract.State storage state,
        address asset,
        TypesContract.BalancePath memory path,
        uint256 amount
    )
        internal
    {
        state.balances[path.user][asset] = state.balances[path.user][asset].add(amount);
        state.cash[asset] = state.cash[asset].add(amount);
    }


    function transferOut(
            StoreContract.State storage state,
            address asset,
            TypesContract.BalancePath memory path,
            uint256 amount
        )
            internal
        {
        state.balances[path.user][asset] = state.balances[path.user][asset].sub(amount);
        state.cash[asset] = state.cash[asset].sub(amount);
        }



    //划转
    event huazhuan(address b,uint c,uint d);
    function transfer(
        StoreContract.State storage state,
        address asset,
        TypesContract.BalancePath memory fromBalancePath,
        TypesContract.BalancePath memory toBalancePath,
        uint256 amount
    )
        internal
    {
        // if (toBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
        //  //   RequiresContract.requireMarketIDAndAssetMatch(state, toBalancePath.marketID, asset);
        // }
        // require(StoreContract.getBalances(fromBalancePath,state,asset) >= amount, "TRANSFER_BALANCE_NOT_ENOUGH");
        //  state.balances[fromBalancePath.user][asset] = state.balances[fromBalancePath.user][asset].sub(amount);
        //  state.balances[toBalancePath.user][asset] = state.balances[toBalancePath.user][asset].add(amount);

        if (fromBalancePath.category == TypesContract.BalanceCategory.Common) {
            state.balances[fromBalancePath.user][asset]=state.balances[fromBalancePath.user][asset].sub(amount);
        } else {
            state.accounts[fromBalancePath.user][fromBalancePath.marketID].balances[asset]= state.accounts[fromBalancePath.user][fromBalancePath.marketID].balances[asset].sub(amount);
        }
        if (toBalancePath.category == TypesContract.BalanceCategory.Common) {
           state.balances[toBalancePath.user][asset]=state.balances[toBalancePath.user][asset].add(amount);
        } else {
           state.accounts[toBalancePath.user][toBalancePath.marketID].balances[asset]=state.accounts[toBalancePath.user][toBalancePath.marketID].balances[asset].add(amount);
        }

        emit huazhuan(fromBalancePath.user,state.balances[fromBalancePath.user][asset],state.accounts[toBalancePath.user][toBalancePath.marketID].balances[asset]);
    }






    function balanceOf(
       StoreContract.State storage state,
        TypesContract.BalancePath memory balancePath,
        address asset
    )
        internal
        view
        returns (uint256)
    {
        return StoreContract.getBalances(balancePath,state,asset);
    }


 }
//0x63e6c277fe9a8ec68c73508d3b97a200637d88d0a2






contract BatchActionsContract is TransferContract{
     enum ActionType {
        Deposit,   // Move asset from your wallet to tradeable balance
        Withdraw,  // Move asset from your tradeable balance to wallet
        Transfer,  // Move asset between tradeable balance and margin account
        Borrow,    // Borrow asset from pool
        Repay,     // Repay asset to pool
        Supply,    // Move asset from tradeable balance to pool to earn interest
        Unsupply   // Move asset from pool back to tradeable balance
    }


    struct Action{
        ActionType actionType;
        uint16 marketID;
        address asset;
        uint256 amount;
        // address fromBalancePath;
        // address toBalancePath;
        TypesContract.BalancePath  fromBalancePath;
        TypesContract.BalancePath  toBalancePath;
    }


        function batch(
       StoreContract.State storage state,
        Action[] memory actions
    )
        internal
    {
        for (uint256 i = 0; i < actions.length; i++) {
            Action memory action = actions[i];
            ActionType actionType = action.actionType;

            if (actionType == ActionType.Deposit) {
                deposit(state, action,action.asset,action.amount);
            } else if (actionType == ActionType.Withdraw) {
                withdraw(state, action,action.asset,action.amount);
           } else if (actionType == ActionType.Transfer) {
                transfer(state, action,action.fromBalancePath,action.toBalancePath,action.amount,action.asset);
           }
        }
    }



      function deposit(
       StoreContract.State storage state,
        Action memory action,
        address asset,
        uint256 amount

    )
        private
    {
        TransferContract.deposit(
            state,
            asset,
            amount
        );
    }

    function withdraw(
        StoreContract.State storage state,
        Action memory action,
        address asset,
        uint256 amount
    )
        private
    {

        TransferContract.withdraw(
            state,
            asset,
            amount
        );
    }




 function transfer(
        StoreContract.State storage state,
        Action memory action,
        TypesContract.BalancePath fromBalancePath,
        TypesContract.BalancePath  toBalancePath,
        uint256 amount,
        address asset
    )
        private
    {
        //  require(fromBalancePath.user == msg.sender, "CAN_NOT_MOVE_OTHER_USER_ASSET");
        //  require(toBalancePath.user == msg.sender, "CAN_NOT_MOVE_ASSET_TO_OTHER_USER");

        // RequiresContract.requireCollateralAccountNormalStatus(state, fromBalancePath);
        // RequiresContract.requireCollateralAccountNormalStatus(state, toBalancePath);

        // if (fromBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
        //     // require(
        //     //     CollateralAccountsContract.getTransferableAmount(state, fromBalancePath.marketID, fromBalancePath.user, asset) >= amount,
        //     //     "COLLATERAL_ACCOUNT_TRANSFERABLE_AMOUNT_NOT_ENOUGH"
        //     // );
        // }

        TransferContract.transfer(
            state,
            asset,
            fromBalancePath,
            toBalancePath,
            amount
        );

        // if (toBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
        //     EventsContract.logIncreaseCollateral(msg.sender, toBalancePath.marketID, asset, amount);
        // }
        // if (fromBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
        //     EventsContract.logDecreaseCollateral(msg.sender, fromBalancePath.marketID, asset, amount);
        // }
    }


 }



//0x63b3f378d8cd9e3db1a21ca3aab24f9ca25dd428cc

//   struct MatchParams {
//         OrderParam       takerOrderParam;
//         OrderParam[]     makerOrderParams;
//         uint256[]        baseAssetFilledAmounts;
//         OrderAddressSet  orderAddressSet;
//     }
contract MistExchange is BatchActionsContract,EventsContract{


    bytes32 public constant EIP712_ORDER_TYPE = keccak256(
        abi.encodePacked(
            "Order(address trader,address relayer,address baseAsset,address quoteAsset,uint256 baseAssetAmount,uint256 quoteAssetAmount,uint256 gasTokenAmount,bytes32 data)"
        )
    );

    string private constant DOMAIN_NAME = "Hydro Protocol";

    /**
     * Hash of the EIP712 Domain Separator Schema
     */
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        abi.encodePacked("EIP712Domain(string name)")
    );

    bytes32 private constant DOMAIN_SEPARATOR = keccak256(
        abi.encodePacked(
            EIP712_DOMAIN_TYPEHASH,
            keccak256(bytes(DOMAIN_NAME))
        )
    );














    function matchOrders(
        StoreContract.State storage state,
        TypesContract.MatchParams memory params
    )
        internal
    {
        //require(RelayerContract.canMatchOrdersFrom(state, params.orderAddressSet.relayer), "INVALID_SENDER");
       // require(!params.takerOrderParam.isMakerOnly(), "MAKER_ONLY_ORDER_CANNOT_BE_TAKER");

        //  bool isParticipantRelayer = isParticipant(state, params.orderAddressSet.relayer);
        //  uint256 takerFeeRate = getTakerFeeRate(state, params.takerOrderParam, isParticipantRelayer);
         TypesContract.OrderInfo memory takerOrderInfo = getOrderInfo(state, params.takerOrderParam, params.orderAddressSet);

        // // Calculate which orders match for settlement.
         TypesContract.MatchResult[] memory results = new TypesContract.MatchResult[](params.makerOrderParams.length);

        for (uint256 i =0; i < params.makerOrderParams.length; i++) {
        //     //require(!params.makerOrderParams[i].isMarketOrder(), "MAKER_ORDER_CAN_NOT_BE_MARKET_ORDER");
        //    // require(params.takerOrderParam.isSell() != params.makerOrderParams[i].isSell(), "INVALID_SIDE");
        //    // validatePrice(params.takerOrderParam, params.makerOrderParams[i]);

             OrderInfo memory makerOrderInfo = getOrderInfo(state, params.makerOrderParams[i], params.orderAddressSet);

            results[i] = getMatchResult(
                state,
                params.takerOrderParam,
                takerOrderInfo,
                params.makerOrderParams[i],
                makerOrderInfo,
                params.baseAssetFilledAmounts[i]
            //     takerFeeRate
            //    isParticipantRelayer
            );
            //Update amount filled for this maker order.
           state.exchange.filled[makerOrderInfo.orderHash] = makerOrderInfo.filledAmount;
        }

        // // Update amount filled for this taker order.
         state.exchange.filled[takerOrderInfo.orderHash] = takerOrderInfo.filledAmount;

         settleResults(state, results, params.takerOrderParam, params.orderAddressSet);
    }




        function getMatchResult(
        StoreContract.State storage state,
        TypesContract.OrderParam memory takerOrderParam,
        OrderInfo memory takerOrderInfo,
        TypesContract.OrderParam memory makerOrderParam,
        OrderInfo memory makerOrderInfo,
        uint256 baseAssetFilledAmount
        // uint256 takerFeeRate,
        // bool isParticipantRelayer
    )
        private
        view
        returns (TypesContract.MatchResult memory result)
    {


        result.maker=makerOrderParam.trader;
        result.taker=takerOrderParam.trader;

        if(TypesContract.isSell(takerOrderParam)) {
            result.buyer = result.maker;
        } else {
            result.buyer = result.taker;
        }

        result.makerFee=0;
        result.makerRebate=0;
        result.takerFee=0;
        result.makerGasFee=0;
        result.takerGasFee=0;
        result.baseAssetFilledAmount=baseAssetFilledAmount;
        result.quoteAssetFilledAmount=1;
        result.takerBalancePath = takerOrderInfo.balancePath;
        result.makerBalancePath = makerOrderInfo.balancePath;
    // struct MatchResult {
    //     address maker;
    //     address taker;
    //     address buyer;
    //     uint256 makerFee;
    //     uint256 makerRebate;
    //     uint256 takerFee;
    //     uint256 makerGasFee;
    //     uint256 takerGasFee;
    //     uint256 baseTokenFilledAmount;
    //     uint256 quoteTokenFilledAmount;
    // }








        // result.baseAssetFilledAmount = baseAssetFilledAmount;
        // result.quoteAssetFilledAmount = convertBaseToQuote(makerOrderParam, baseAssetFilledAmount);
        // result.quoteAssetFilledAmount=1;
        // result.takerBalancePath = takerOrderInfo.balancePath;
        // result.makerBalancePath = makerOrderInfo.balancePath;

        // // Each order only pays gas once, so only pay gas when nothing has been filled yet.
        // if (takerOrderInfo.filledAmount == 0) {
        //     result.takerGasFee = takerOrderParam.gasTokenAmount;
        // }

        // if (makerOrderInfo.filledAmount == 0) {
        //     result.makerGasFee = makerOrderParam.gasTokenAmount;
        // }

        // if(!TypesContract.isMarketBuy(takerOrderParam)) {
        //     takerOrderInfo.filledAmount = takerOrderInfo.filledAmount.add(result.baseAssetFilledAmount);
        //     require(takerOrderInfo.filledAmount <= takerOrderParam.baseAssetAmount, "TAKER_ORDER_OVER_MATCH");
        // } else {
        //     takerOrderInfo.filledAmount = takerOrderInfo.filledAmount.add(result.quoteAssetFilledAmount);
        //     require(takerOrderInfo.filledAmount <= takerOrderParam.quoteAssetAmount, "TAKER_ORDER_OVER_MATCH");
        // }

        // makerOrderInfo.filledAmount = makerOrderInfo.filledAmount.add(result.baseAssetFilledAmount);
        // require(makerOrderInfo.filledAmount <= makerOrderParam.baseAssetAmount, "MAKER_ORDER_OVER_MATCH");

        // result.maker = makerOrderParam.trader;
        // result.taker = takerOrderParam.trader;

        // if(TypesContract.isSell(takerOrderParam)) {
        //     result.buyer = result.maker;
        // } else {
        //     result.buyer = result.taker;
        // }

        // uint256 rebateRate = TypesContract.getMakerRebateRateFromOrderData(makerOrderParam);

        // if (rebateRate > 0) {
        //     // If the rebate rate is not zero, maker pays no fees.
        //     result.makerFee = 0;

        //     // RebateRate will never exceed REBATE_RATE_BASE, so rebateFee will never exceed the fees paid by the taker.
        //     result.makerRebate = result.quoteAssetFilledAmount.mul(takerFeeRate).mul(rebateRate).div(
        //         EXCHANGE_FEE_RATE_BASE.mul(ConstsContract.DISCOUNT_RATE_BASE()).mul(ConstsContract.REBATE_RATE_BASE())
        //     );
        // } else {
        //     uint256 makerRawFeeRate = TypesContract.getAsMakerFeeRateFromOrderData(makerOrderParam);
        //     result.makerRebate = 0;

        //     // maker fee will be reduced, but still >= 0
        //     uint256 makerFeeRate = getFinalFeeRate(
        //         state,
        //         makerOrderParam.trader,
        //         makerRawFeeRate,
        //         isParticipantRelayer
        //     );

        //     result.makerFee = result.quoteAssetFilledAmount.mul(makerFeeRate).div(
        //         EXCHANGE_FEE_RATE_BASE.mul(ConstsContract.DISCOUNT_RATE_BASE())
        //     );
        // }

        // result.takerFee = result.quoteAssetFilledAmount.mul(takerFeeRate).div(
        //     EXCHANGE_FEE_RATE_BASE.mul(ConstsContract.DISCOUNT_RATE_BASE())
        // );
    }







    function getOrderInfo(
        StoreContract.State storage state,
        TypesContract.OrderParam memory orderParam,
        TypesContract.OrderAddressSet memory orderAddressSet
    )
        private
        view
        returns (TypesContract.OrderInfo memory orderInfo)
    {
       // require(TypesContract.getOrderVersion(orderParam) == SUPPORTED_ORDER_VERSION, "ORDER_VERSION_NOT_SUPPORTED");

        TypesContract.Order memory order = getOrderFromOrderParam(orderParam, orderAddressSet);
        orderInfo.orderHash =getHash(order);
        orderInfo.filledAmount = state.exchange.filled[orderInfo.orderHash];
        // uint8 status = uint8(TypesContract.OrderStatus.FILLABLE);

        // if (!TypesContract.isMarketBuy(orderParam) && orderInfo.filledAmount >= order.baseAssetAmount) {
        //     status = uint8(TypesContract.OrderStatus.FULLY_FILLED);
        // } else if (TypesContract.isMarketBuy(orderParam) && orderInfo.filledAmount >= order.quoteAssetAmount) {
        //     status = uint8(TypesContract.OrderStatus.FULLY_FILLED);
        // } else if (block.timestamp >= TypesContract.getExpiredAtFromOrderData(orderParam)) {
        //     status = uint8(TypesContract.OrderStatus.EXPIRED);
        // } else if (state.exchange.cancelled[orderInfo.orderHash]) {
        //     status = uint8(TypesContract.OrderStatus.CANCELLED);
        // }

        // require(
        //     status == uint8(TypesContract.OrderStatus.FILLABLE),
        //     "ORDER_IS_NOT_FILLABLE"
        // );
        
         //isValidSignature(orderInfo.orderHash, orderParam.trader, orderParam.signature);
        require(
           isValidSignature(orderInfo.orderHash, orderParam.trader, orderParam.signature),
            "INVALID_ORDER_SIGNATURE"
        );



         orderInfo.balancePath = TypesContract.getBalancePathFromOrderData(orderParam);
        //RequiresContract.requireCollateralAccountNormalStatus(state, orderInfo.balancePath);

         return orderInfo;
    }


event result(bool bol);
 function settleResults(
        StoreContract.State storage state,
        TypesContract.MatchResult[] memory results,
        TypesContract.OrderParam memory takerOrderParam,
        TypesContract.OrderAddressSet memory orderAddressSet
    )
        private
    {
        bool isTakerSell = TypesContract.isSell(takerOrderParam);

        // uint256 totalFee = 0;

        // TypesContract.BalancePath memory relayerBalancePath = TypesContract.BalancePath({
        //     user: orderAddressSet.relayer,
        //     marketID: 0,
        //     category: TypesContract.BalanceCategory.Common
        // });
        for (uint256 i = 0; i < results.length; i++) {
            TransferContract.transfer(
                state,
                orderAddressSet.baseAsset,
                isTakerSell ? results[i].takerBalancePath : results[i].makerBalancePath,
                isTakerSell ? results[i].makerBalancePath : results[i].takerBalancePath,
                results[i].baseAssetFilledAmount
            );
           // uint256 transferredQuoteAmount;

            // if(isTakerSell) {
            //     transferredQuoteAmount = results[i].quoteAssetFilledAmount.
            //         add(results[i].makerFee).
            //         add(results[i].makerGasFee).
            //         sub(results[i].makerRebate);
            // } else {
            //     transferredQuoteAmount = results[i].quoteAssetFilledAmount.
            //         sub(results[i].makerFee).
            //         sub(results[i].makerGasFee).
            //         add(results[i].makerRebate);
            // }

            // TransferContract.transfer(
            //     state,
            //     orderAddressSet.quoteAsset,
            //     isTakerSell ? results[i].makerBalancePath : results[i].takerBalancePath,
            //     isTakerSell ? results[i].takerBalancePath : results[i].makerBalancePath,
            //     transferredQuoteAmount
            // );

           // Requires.requireCollateralAccountNotLiquidatable(state, results[i].makerBalancePath);

            // totalFee = totalFee.add(results[i].takerFee).add(results[i].makerFee);
            // totalFee = totalFee.add(results[i].makerGasFee).add(results[i].takerGasFee);
            // totalFee = totalFee.sub(results[i].makerRebate);

            //EventsContract.logMatch(results[i], orderAddressSet);
            
        }
  // emit result(isTakerSell);
        // TransferContract.transfer(
        //     state,
        //     orderAddressSet.quoteAsset,
        //     results[0].takerBalancePath,
        //     relayerBalancePath,
        //     totalFee
        // );

      //  Requires.requireCollateralAccountNotLiquidatable(state, results[0].takerBalancePath);
    }
    



























       function isValidSignature(
        bytes32 hash,
        address signerAddress,
        Signature memory signature
    )
        public
        returns (bool)
    {
        uint8 method = uint8(signature.config[1]);
        address recovered;
        uint8 v = uint8(signature.config[0]);

        if (method == uint8(SignatureMethod.EthSign)) {
            recovered = ecrecover(
                keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)),
                v,
                signature.r,
                signature.s
            );
        } else if (method == uint8(SignatureMethod.EIP712)) {
            recovered = ecrecover(hash, v, signature.r, signature.s);
        } else {
            revert("INVALID_SIGN_METHOD");
        }
        uint256   bol=(signerAddress == recovered) ? 0:1;
         emit jieguo(bol,recovered);
        return signerAddress == recovered;
    }




     function getOrderFromOrderParam(
        TypesContract.OrderParam memory orderParam,
        TypesContract.OrderAddressSet memory orderAddressSet
    )
        private
        pure
        returns (TypesContract.Order memory order)
    {
        order.trader = orderParam.trader;
        order.baseAssetAmount = orderParam.baseAssetAmount;
        order.quoteAssetAmount = orderParam.quoteAssetAmount;
        order.gasTokenAmount = orderParam.gasTokenAmount;
        order.data = orderParam.data;
        order.baseAsset = orderAddressSet.baseAsset;
        order.quoteAsset = orderAddressSet.quoteAsset;
        order.relayer = orderAddressSet.relayer;
    }





    function convertBaseToQuote(
        TypesContract.OrderParam memory orderParam,
        uint256 amount
    )
        private
        pure
        returns (uint256)
    {
        return SafeMath.getPartialAmountFloor(
            orderParam.quoteAssetAmount,
            orderParam.baseAssetAmount,
            amount
        );
    }



     function  _hashContent(TypesContract.Order  memory order)  public  returns(bytes32){
                    return keccak256(
                            abi.encodePacked(
                            EIP712_ORDER_TYPE,
                            bytes32(order.trader),
                            bytes32(order.relayer),
                            bytes32(order.baseAsset),
                            bytes32(order.quoteAsset),
                            order.baseAssetAmount,
                            order.quoteAssetAmount,
                            order.gasTokenAmount,
                            order.data
                        )
                    ); 
       }


        bytes32  public msghash;
        function hashMessage(
                bytes32 eip712hash
            )
                public
                returns (bytes32)
            {
                msghash=keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, eip712hash));
                emit MsgHash(msghash);
                return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, eip712hash));
        }




       function getHash(
            TypesContract.Order memory order
        )
            public
            returns (bytes32 orderHash)
        {
            orderHash = hashMessage(_hashContent(order));
            return orderHash;
        }

}



contract ExternalFunctions is MistExchange{
    StoreContract.State state;
    function batch(
        BatchActionsContract.Action[] memory actions
    )
        public
        payable
    {
        BatchActionsContract.batch(state, actions);
    }


 event bac(uint256 balce);

       function balanceOf(
        address asset,
        address user
    )
        external
        
        returns (uint256 balance)
    {
       
        uint256  bat=TransferContract.balanceOf(state, StoreContract.getCommonPath(user), asset);
      //  emit bac(bat);
        balance = bat;
    }


    function matchOrders(
         OrderParam  takerOrderParam,
         OrderParam[]  makerOrderParams,
         uint256[]   baseAssetFilledAmounts,
         OrderAddressSet  orderAddressSet
    )
        public
    {

        TypesContract.MatchParams memory params=TypesContract.MatchParams(takerOrderParam,makerOrderParams,baseAssetFilledAmounts,orderAddressSet);
        MistExchange.matchOrders(state, params);
    }


}


//0x63fd0d4f6e9a40f5af26addb6d52d2aff5b232a70f


























