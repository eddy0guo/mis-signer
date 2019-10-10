pragma solidity ^0.4.25;
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

contract EIP712Contract {
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

    /**
     * Calculates EIP712 encoding for a hash struct in this EIP712 Domain.
     *
     * @param eip712hash The EIP712 hash struct.
     * @return EIP712 hash applied to this EIP712 Domain.
     */
    function hashMessage(
        bytes32 eip712hash
    )
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, eip712hash));
    }
}



 contract TypesContract is EIP712Contract{
    bytes32 public constant EIP712_ORDER_TYPE = keccak256(
        abi.encodePacked(
            "Order(address trader,address relayer,address baseAsset,address quoteAsset,uint256 baseAssetAmount,uint256 quoteAssetAmount,uint256 gasTokenAmount,bytes32 data)"
        )
    );
    enum AuctionStatus {
        InProgress,
        Finished
    }

    enum CollateralAccountStatus {
        Normal,
        Liquid
    }

    enum OrderStatus {
        EXPIRED,
        CANCELLED,
        FILLABLE,
        FULLY_FILLED
    }

    /**
     * Signature struct contains typical signature data as v, r, and s with the signature
     * method encoded in as well.
     */
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

    enum BalanceCategory {
        Common,
        CollateralAccount
    }

    struct BalancePath {
        BalanceCategory category;
        uint16          marketID;
        address         user;
    }
    
    

    struct Asset {
        ILendingPoolToken  lendingPoolToken;
        IPriceOracle      priceOracle;
        IInterestModel    interestModel;
    }

    struct Market {
        address baseAsset;
        address quoteAsset;

        // If the collateralRate is below this rate, the account will be liquidated
        uint256 liquidateRate;

        // If the collateralRate is above this rate, the account asset balance can be withdrawed
        uint256 withdrawRate;

        uint256 auctionRatioStart;
        uint256 auctionRatioPerBlock;
    }

    struct CollateralAccount {
        uint32 id;
        uint16 marketID;
        CollateralAccountStatus status;
        address owner;

        mapping(address => uint256) balances;
    }

    // memory only
    struct CollateralAccountDetails {
        bool       liquidatable;
        CollateralAccountStatus status;
        uint256    debtsTotalUSDValue;
        uint256    balancesTotalUSDValue;
    }

    struct Auction {
        uint32 id;
        AuctionStatus status;

        // To calculate the ratio
        uint32 startBlockNumber;

        uint16 marketID;

        address borrower;
        address initiator;

        address debtAsset;
        address collateralAsset;
    }

    struct AuctionDetails {
        address debtAsset;
        address collateralAsset;
        uint256 leftDebtAmount;
        uint256 leftCollateralAmount;
        uint256 ratio;
        uint256 price;
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
         * ║ makerRebateRate    │ 2               rebate rate for maker (base 100)          ║
         * ║ salt               │ 8               salt                                      ║
         * ║ isMakerOnly        │ 1               is maker only                             ║
         * ║ balancesType       │ 1               0: common, 1: collateralAccount           ║
         * ║ marketID           │ 2               marketID                                  ║
         * ║                    │ 6               reserved                                  ║
         * ╚════════════════════╧═══════════════════════════════════════════════════════════╝
         */
        bytes32 data;
    }

        /**
     * When orders are being matched, they will always contain the exact same base token,
     * quote token, and relayer. Since excessive call data is very expensive, we choose
     * to create a stripped down OrderParam struct containing only data that may vary between
     * Order objects, and separate out the common elements into a set of addresses that will
     * be shared among all of the OrderParam items. This is meant to eliminate redundancy in
     * the call data, reducing it's size, and hence saving gas.
     */
    struct OrderParam {
        address trader;
        uint256 baseAssetAmount;
        uint256 quoteAssetAmount;
        uint256 gasTokenAmount;
        bytes32 data;
        Signature signature;
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
    /**
     * @param takerOrderParam A Types.OrderParam object representing the order from the taker.
     * @param makerOrderParams An array of Types.OrderParam objects representing orders from a list of makers.
     * @param orderAddressSet An object containing addresses common across each order.
     */
    struct MatchParams {
        OrderParam       takerOrderParam;
        OrderParam[]     makerOrderParams;
        uint256[]        baseAssetFilledAmounts;
        OrderAddressSet  orderAddressSet;
    }
    
    function getTypes() public view returns(string hello){
        hello= "helloworld";
    }
    function getHash(
        Order memory order
    )
        internal
        pure
        returns (bytes32 orderHash)
    {
        orderHash = EIP712Contract.hashMessage(_hashContent(order));
        return orderHash;
    }

    function _hashContent(
        Order memory order
    )
        internal
        pure
        returns (bytes32 result)
    {
        /**
         * Calculate the following hash in solidity assembly to save gas.
         *
         * keccak256(
         *     abi.encodePacked(
         *         EIP712_ORDER_TYPE,
         *         bytes32(order.trader),
         *         bytes32(order.relayer),
         *         bytes32(order.baseAsset),
         *         bytes32(order.quoteAsset),
         *         order.baseAssetAmount,
         *         order.quoteAssetAmount,
         *         order.gasTokenAmount,
         *         order.data
         *     )
         * );
         */

        bytes32 orderType = EIP712_ORDER_TYPE;

        assembly {
            let start := sub(order, 32)
            let tmp := mload(start)

            // 288 = (1 + 8) * 32
            //
            // [0...32)   bytes: EIP712_ORDER_TYPE
            // [32...288) bytes: order
            mstore(start, orderType)
            result := keccak256(start, 288)

            mstore(start, tmp)
        }

        return result;
    }
    
    
    
   function getOrderVersion(
       OrderParam memory order
    )
        internal
        pure
        returns (uint256)
    {
        return uint256(uint8(byte(order.data)));
    }

    function getExpiredAtFromOrderData(
        OrderParam memory order
    )
        internal
        pure
        returns (uint256)
    {
        return uint256(uint40(bytes5(order.data << (8*3))));
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

    function isMarketOrder(
        OrderParam memory order
    )
        internal
        pure
        returns (bool)
    {
        return uint8(order.data[2]) == 1;
    }

    function isMakerOnly(
       OrderParam memory order
    )
        internal
        pure
        returns (bool)
    {
        return uint8(order.data[22]) == 1;
    }

    function isMarketBuy(
       OrderParam memory order
    )
        internal
        pure
        returns (bool)
    {
        return !isSell(order) && isMarketOrder(order);
    }

    function getAsMakerFeeRateFromOrderData(
       OrderParam memory order
    )
        internal
        pure
        returns (uint256)
    {
        return uint256(uint16(bytes2(order.data << (8*8))));
    }

    function getAsTakerFeeRateFromOrderData(
        OrderParam memory order
    )
        internal
        pure
        returns (uint256)
    {
        return uint256(uint16(bytes2(order.data << (8*10))));
    }

    function getMakerRebateRateFromOrderData(
       OrderParam memory order
    )
        internal
        pure
        returns (uint256)
    {
        uint256 makerRebate = uint256(uint16(bytes2(order.data << (8*12))));

        // make sure makerRebate will never be larger than REBATE_RATE_BASE, which is 100
        return SafeMath.min(makerRebate, 100);
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

contract EventsContract is TypesContract{
    //////////////////
    // Funds moving //
    //////////////////

    // some assets move into contract
    // event Deposit(
    //     address indexed user,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logDeposit(
    //     address user,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Deposit(
    //         user,
    //         asset,
    //         amount
    //     );
    // }

    // // some assets move out of contract
    // event Withdraw(
    //     address indexed user,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logWithdraw(
    //     address user,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Withdraw(
    //         user,
    //         asset,
    //         amount
    //     );
    // }

    // // transfer from balance to collateral account
    // event IncreaseCollateral (
    //     address indexed user,
    //     uint16 indexed marketID,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logIncreaseCollateral(
    //     address user,
    //     uint16 marketID,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit IncreaseCollateral(
    //         user,
    //         marketID,
    //         asset,
    //         amount
    //     );
    // }

    // // transfer from collateral account to balance
    // event DecreaseCollateral (
    //     address indexed user,
    //     uint16 indexed marketID,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logDecreaseCollateral(
    //     address user,
    //     uint16 marketID,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit DecreaseCollateral(
    //         user,
    //         marketID,
    //         asset,
    //         amount
    //     );
    // }

    // //////////////////
    // // Lending Pool //
    // //////////////////

    // event Borrow(
    //     address indexed user,
    //     uint16 indexed marketID,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logBorrow(
    //     address user,
    //     uint16 marketID,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Borrow(
    //         user,
    //         marketID,
    //         asset,
    //         amount
    //     );
    // }

    // event Repay(
    //     address indexed user,
    //     uint16 indexed marketID,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logRepay(
    //     address user,
    //     uint16 marketID,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Repay(
    //         user,
    //         marketID,
    //         asset,
    //         amount
    //     );
    // }

    // event Supply(
    //     address indexed user,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logSupply(
    //     address user,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Supply(
    //         user,
    //         asset,
    //         amount
    //     );
    // }

    // event Unsupply(
    //     address indexed user,
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logUnsupply(
    //     address user,
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Unsupply(
    //         user,
    //         asset,
    //         amount
    //     );
    // }

    // event Loss(
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logLoss(
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit Loss(
    //         asset,
    //         amount
    //     );
    // }

    // event InsuranceCompensation(
    //     address indexed asset,
    //     uint256 amount
    // );

    // function logInsuranceCompensation(
    //     address asset,
    //     uint256 amount
    // )
    //     internal
    // {
    //     emit InsuranceCompensation(
    //         asset,
    //         amount
    //     );
    // }

    // ///////////////////
    // // Admin Actions //
    // ///////////////////

    // event CreateMarket(TypesContract.Market market);

    // function logCreateMarket(
    //     TypesContract.Market memory market
    // )
    //     internal
    // {
    //     emit CreateMarket(market);
    // }

    // event UpdateMarket(
    //     uint16 marketID,
    //     uint256 newAuctionRatioStart,
    //     uint256 newAuctionRatioPerBlock,
    //     uint256 newLiquidateRate,
    //     uint256 newWithdrawRate
    // );

    // function logUpdateMarket(
    //     uint16 marketID,
    //     uint256 newAuctionRatioStart,
    //     uint256 newAuctionRatioPerBlock,
    //     uint256 newLiquidateRate,
    //     uint256 newWithdrawRate
    // )
    //     internal
    // {
    //     emit UpdateMarket(
    //         marketID,
    //         newAuctionRatioStart,
    //         newAuctionRatioPerBlock,
    //         newLiquidateRate,
    //         newWithdrawRate
    //     );
    // }

    // event UpdateDiscountConfig(bytes32 newConfig);

    // function logUpdateDiscountConfig(
    //     bytes32 newConfig
    // )
    //     internal
    // {
    //     emit UpdateDiscountConfig(newConfig);
    // }

    // event CreateAsset(
    //     address asset,
    //     address oracleAddress,
    //     address poolTokenAddress,
    //     address interestMoealAddress
    // );

    // function logCreateAsset(
    //     address asset,
    //     address oracleAddress,
    //     address poolTokenAddress,
    //     address interestMoealAddress
    // )
    //     internal
    // {
    //     emit CreateAsset(
    //         asset,
    //         oracleAddress,
    //         poolTokenAddress,
    //         interestMoealAddress
    //     );
    // }

    // event UpdateAsset(
    //     address asset,
    //     address oracleAddress,
    //     address interestMoealAddress
    // );

    // function logUpdateAsset(
    //     address asset,
    //     address oracleAddress,
    //     address interestMoealAddress
    // )
    //     internal
    // {
    //     emit UpdateAsset(
    //         asset,
    //         oracleAddress,
    //         interestMoealAddress
    //     );
    // }

    // event UpdateAuctionInitiatorRewardRatio(
    //     uint256 newInitiatorRewardRatio
    // );

    // function logUpdateAuctionInitiatorRewardRatio(
    //     uint256 newInitiatorRewardRatio
    // )
    //     internal
    // {
    //     emit UpdateAuctionInitiatorRewardRatio(
    //         newInitiatorRewardRatio
    //     );
    // }

    // event UpdateInsuranceRatio(
    //     uint256 newInsuranceRatio
    // );

    // function logUpdateInsuranceRatio(
    //     uint256 newInsuranceRatio
    // )
    //     internal
    // {
    //     emit UpdateInsuranceRatio(newInsuranceRatio);
    // }

    // /////////////
    // // Auction //
    // /////////////

    // // an auction is created
    // event AuctionCreate(
    //     uint256 auctionID
    // );

    // function logAuctionCreate(
    //     uint256 auctionID
    // )
    //     internal
    // {
    //     emit AuctionCreate(auctionID);
    // }

    // // a user filled an acution
    // event FillAuction(
    //     uint256 indexed auctionID,
    //     address bidder,
    //     uint256 repayDebt,
    //     uint256 bidderCollateral,
    //     uint256 leftDebt
    // );

    // function logFillAuction(
    //     uint256 auctionID,
    //     address bidder,
    //     uint256 repayDebt,
    //     uint256 bidderCollateral,
    //     uint256 leftDebt
    // )
    //     internal
    // {
    //     emit FillAuction(
    //         auctionID,
    //         bidder,
    //         repayDebt,
    //         bidderCollateral,
    //         leftDebt
    //     );
    // }

    // /////////////
    // // Relayer //
    // /////////////

    // event RelayerApproveDelegate(
    //     address indexed relayer,
    //     address indexed delegate
    // );

    // function logRelayerApproveDelegate(
    //     address relayer,
    //     address delegate
    // )
    //     internal
    // {
    //     emit RelayerApproveDelegate(
    //         relayer,
    //         delegate
    //     );
    // }

    // event RelayerRevokeDelegate(
    //     address indexed relayer,
    //     address indexed delegate
    // );

    // function logRelayerRevokeDelegate(
    //     address relayer,
    //     address delegate
    // )
    //     internal
    // {
    //     emit RelayerRevokeDelegate(
    //         relayer,
    //         delegate
    //     );
    // }

    // event RelayerExit(
    //     address indexed relayer
    // );

    // function logRelayerExit(
    //     address relayer
    // )
    //     internal
    // {
    //     emit RelayerExit(relayer);
    // }

    // event RelayerJoin(
    //     address indexed relayer
    // );

    // function logRelayerJoin(
    //     address relayer
    // )
    //     internal
    // {
    //     emit RelayerJoin(relayer);
    // }

    // //////////////
    // // Exchange //
    // //////////////

    // event Match(
    //     TypesContract.OrderAddressSet addressSet,
    //     address maker,
    //     address taker,
    //     address buyer,
    //     uint256 makerFee,
    //     uint256 makerRebate,
    //     uint256 takerFee,
    //     uint256 makerGasFee,
    //     uint256 takerGasFee,
    //     uint256 baseAssetFilledAmount,
    //     uint256 quoteAssetFilledAmount

    // );

    // function logMatch(
    //     TypesContract.MatchResult memory result,
    //     TypesContract.OrderAddressSet memory addressSet
    // )
    //     internal
    // {
    //     emit Match(
    //         addressSet,
    //         result.maker,
    //         result.taker,
    //         result.buyer,
    //         result.makerFee,
    //         result.makerRebate,
    //         result.takerFee,
    //         result.makerGasFee,
    //         result.takerGasFee,
    //         result.baseAssetFilledAmount,
    //         result.quoteAssetFilledAmount
    //     );
    // }

    // event OrderCancel(
    //     bytes32 indexed orderHash
    // );

    // function logOrderCancel(
    //     bytes32 orderHash
    // )
    //     internal
    // {
    //     emit OrderCancel(orderHash);
    // }
    function Eventaddfunction()  public returns(string){
        return TypesContract.getTypes();
    }
}


contract StoreContract is EventsContract {
     using SafeMath for uint256;

    struct RelayerState {
        /**
        * Mapping of relayerAddress => delegateAddress
        */
        mapping (address => mapping (address => bool)) relayerDelegates;

        /**
        * Mapping of relayerAddress => whether relayer is opted out of the liquidity incentive system
        */
        mapping (address => bool) hasExited;
    }

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

    struct LendingPoolState {
        uint256 insuranceRatio;

        // insurance balances
        mapping(address => uint256) insuranceBalances;

        mapping (address => uint256) borrowIndex; // decimal
        mapping (address => uint256) supplyIndex; // decimal
        mapping (address => uint256) indexStartTime; // timestamp

        mapping (address => uint256) borrowAnnualInterestRate; // decimal
        mapping (address => uint256) supplyAnnualInterestRate; // decimal

        // total borrow
        mapping(address => uint256) normalizedTotalBorrow;

        // user => marketID => balances
        mapping (address => mapping (uint16 => mapping(address => uint256))) normalizedBorrow;
    }

    struct AuctionState {

        // count of auctions
        uint32 auctionsCount;

        // all auctions
        mapping(uint32 => TypesContract.Auction) auctions;

        // current auctions
        uint32[] currentAuctions;

        // auction initiator reward ratio
        uint256 initiatorRewardRatio;
    }

    struct State {

        uint16 marketsCount;

        mapping(address => TypesContract.Asset) assets;
        mapping(address => int256) cash;

        // user => marketID => account
        mapping(address => mapping(uint16 => TypesContract.CollateralAccount)) accounts;

        // all markets
        mapping(uint16 => TypesContract.Market) markets;

        // user balances
        mapping(address => mapping(address => uint256)) balances;

        LendingPoolState pool;

        ExchangeState exchange;

        RelayerState relayer;

        AuctionState auction;
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

    function getMarketPath(
        address user,
        uint16 marketID
    )
        internal
        pure
        returns (TypesContract.BalancePath memory)
    {
        return TypesContract.BalancePath({
            user: user,
            category: TypesContract.BalanceCategory.CollateralAccount,
            marketID: marketID
        });
    }
    
         function ratio(
        TypesContract.Auction memory auction,
        StoreContract.State storage state
    )
        internal
        view
        returns (uint256)
    {
        uint256 increasedRatio = (block.number - auction.startBlockNumber).mul(state.markets[auction.marketID].auctionRatioPerBlock);
        uint256 initRatio = state.markets[auction.marketID].auctionRatioStart;
        uint256 totalRatio = initRatio.add(increasedRatio);
        return totalRatio;
    }
}


contract SignatureContract is StoreContract{

    enum SignatureMethod {
        EthSign,
        EIP712
    }

    /**
     * Validate a signature given a hash calculated from the order data, the signer, and the
     * signature data passed in with the order.
     *
     * This function will revert the transaction if the signature method is invalid.
     *
     * @param hash Hash bytes calculated by taking the EIP712 hash of the passed order data
     * @param signerAddress The address of the signer
     * @param signature The signature data passed along with the order to validate against
     * @return True if the calculated signature matches the order signature data, false otherwise.
     */
    function isValidSignature(
        bytes32 hash,
        address signerAddress,
        TypesContract.Signature memory signature
    )
        internal
        pure
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

        return signerAddress == recovered;
    }
    
    
   
}



contract SafeERC20Contract {
    function safeTransfer(
        address token,
        address to,
        uint256 amount
    )
        internal
    {
        bool result;

        assembly {
            let tmp1 := mload(0)
            let tmp2 := mload(4)
            let tmp3 := mload(36)

            // keccak256('transfer(address,uint256)') & 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000
            mstore(0, 0xa9059cbb00000000000000000000000000000000000000000000000000000000)
            mstore(4, to)
            mstore(36, amount)

            // call ERC20 Token contract transfer function
            let callResult := call(gas, token, 0, 0, 68, 0, 32,0)
            let returnValue := mload(0)

            mstore(0, tmp1)
            mstore(4, tmp2)
            mstore(36, tmp3)

            // result check
            result := and (
                eq(callResult, 1),
                or(eq(returndatasize, 0), and(eq(returndatasize, 32), gt(returnValue, 0)))
            )
        }

        if (!result) {
            revert("TOKEN_TRANSFER_ERROR");
        }
    }

    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        bool result;

        assembly {
            let tmp1 := mload(0)
            let tmp2 := mload(4)
            let tmp3 := mload(36)
            let tmp4 := mload(68)

            // keccak256('transferFrom(address,address,uint256)') & 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000
            mstore(0, 0x23b872dd00000000000000000000000000000000000000000000000000000000)
            mstore(4, from)
            mstore(36, to)
            mstore(68, amount)

            // call ERC20 Token contract transferFrom function
            let callResult := call(gas, token, 0, 0, 100, 0, 32,0)
            let returnValue := mload(0)

            mstore(0, tmp1)
            mstore(4, tmp2)
            mstore(36, tmp3)
            mstore(68, tmp4)

            // result check
            result := and (
                eq(callResult, 1),
                or(eq(returndatasize, 0), and(eq(returndatasize, 32), gt(returnValue, 0)))
            )
        }

        if (!result) {
            revert("TOKEN_TRANSFER_FROM_ERROR");
        }
    }
}












contract RelayerContract is SignatureContract{
    /**
     * Approve an address to match orders on behalf of msg.sender
     */
    function approveDelegate(
        StoreContract.State storage state,
        address delegate
    )
        internal
    {
        state.relayer.relayerDelegates[msg.sender][delegate] = true;
        // //EventsContract.logRelayerApproveDelegate(msg.sender, delegate);
    }

    /**
     * Revoke an existing delegate
     */
    function revokeDelegate(
        StoreContract.State storage state,
        address delegate
    )
        internal
    {
        state.relayer.relayerDelegates[msg.sender][delegate] = false;
        //EventsContract.logRelayerRevokeDelegate(msg.sender, delegate);
    }

    /**
     * @return true if msg.sender is allowed to match orders which belong to relayer
     */
    function canMatchOrdersFrom(
        StoreContract.State storage state,
        address relayer
    )
        internal
        view
        returns(bool)
    {
        return msg.sender == relayer || state.relayer.relayerDelegates[relayer][msg.sender] == true;
    }

    /**
     * Join the Hydro incentive system.
     */
    function joinIncentiveSystem(
        StoreContract.State storage state
    )
        internal
    {
        delete state.relayer.hasExited[msg.sender];
        //EventsContract.logRelayerJoin(msg.sender);
    }

    /**
     * Exit the Hydro incentive system.
     * For relayers that choose to opt-out, the Hydro Protocol
     * effective becomes a tokenless protocol.
     */
    function exitIncentiveSystem(
        StoreContract.State storage state
    )
        internal
    {
        state.relayer.hasExited[msg.sender] = true;
        //EventsContract.logRelayerExit(msg.sender);
    }

    /**
     * @return true if relayer is participating in the Hydro incentive system.
     */
    function isParticipant(
        StoreContract.State storage state,
        address relayer
    )
        internal
        view
        returns(bool)
    {
        return !state.relayer.hasExited[relayer];
    }
}

contract ConstsContract is RelayerContract {
    function ETHEREUM_TOKEN_ADDRESS()
        internal
        pure
        returns (address)
    {
        return address(0);
    }

    // The base discounted rate is 100% of the current rate, or no discount.
    function DISCOUNT_RATE_BASE()
        internal
        pure
        returns (uint256)
    {
        return 100;
    }

    function REBATE_RATE_BASE()
        internal
        pure
        returns (uint256)
    {
        return 100;
    }
}



contract AssemblyCallContract is ConstsContract{
    function getAssetPriceFromPriceOracle(
        address oracleAddress,
        address asset
    )
        internal
        view
        returns (uint256)
    {
        // saves about 1200 gas.
        // return state.assets[asset].priceOracle.getPrice(asset);

        // keccak256('getPrice(address)') & 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000
        bytes32 functionSelector = 0x41976e0900000000000000000000000000000000000000000000000000000000;

        (uint256 result, bool success) = callWith32BytesReturnsUint256(
            oracleAddress,
            functionSelector,
            bytes32(uint256(uint160(asset)))
        );

        if (!success) {
            revert("ASSEMBLY_CALL_GET_ASSET_PRICE_FAILED");
        }

        return result;
    }

    /**
     * Get the HOT token balance of an address.
     *
     * @param owner The address to check.
     * @return The HOT balance for the owner address.
     */
    function getHotBalance(
        address hotToken,
        address owner
    )
        internal
        view
        returns (uint256)
    {
        // saves about 1200 gas.
        // return HydroToken(hotToken).balanceOf(owner);

        // keccak256('balanceOf(address)') bitmasked to 4 bytes
        bytes32 functionSelector = 0x70a0823100000000000000000000000000000000000000000000000000000000;

        (uint256 result, bool success) = callWith32BytesReturnsUint256(
            hotToken,
            functionSelector,
            bytes32(uint256(uint160(owner)))
        );

        if (!success) {
            revert("ASSEMBLY_CALL_GET_HOT_BALANCE_FAILED");
        }

        return result;
    }

    function getBorrowInterestRate(
        address interestModel,
        uint256 borrowRatio
    )
        internal
        view
        returns (uint256)
    {
        // saves about 1200 gas.
        // return IInterestModel(interestModel).polynomialInterestModel(borrowRatio);

        // keccak256('polynomialInterestModel(uint256)') & 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000
        bytes32 functionSelector = 0x69e8a15f00000000000000000000000000000000000000000000000000000000;

        (uint256 result, bool success) = callWith32BytesReturnsUint256(
            interestModel,
            functionSelector,
            bytes32(borrowRatio)
        );

        if (!success) {
            revert("ASSEMBLY_CALL_GET_BORROW_INTEREST_RATE_FAILED");
        }

        return result;
    }

    function callWith32BytesReturnsUint256(
        address to,
        bytes32 functionSelector,
        bytes32 param1
    )
        private
        view
        returns (uint256 result, bool success)
    {
        assembly {
            let freePtr := mload(0x40)
            let tmp1 := mload(freePtr)
            let tmp2 := mload(add(freePtr, 4))

            mstore(freePtr, functionSelector)
            mstore(add(freePtr, 4), param1)

            // call ERC20 Token contract transfer function
            success := staticcall(
                gas,           // Forward all gas
                to,            // Interest Model Address
                freePtr,       // Pointer to start of calldata
                36,            // Length of calldata
                freePtr,       // Overwrite calldata with output
                32             // Expecting uint256 output
            )

            result := mload(freePtr)

            mstore(freePtr, tmp1)
            mstore(add(freePtr, 4), tmp2)
        }
    }
}
contract DiscountContract is AssemblyCallContract{
    using SafeMath for uint256;

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
     * @param  user The user address to calculate a fee discount for.
     * @return      The percentage of the regular fee this user will pay.
     */
    function getDiscountedRate(
        StoreContract.State storage state,
        address user
    )
        internal
        view
        returns (uint256 result)
    {
        uint256 hotBalance = AssemblyCallContract.getHotBalance(
            state.exchange.hotTokenAddress,
            user
        );

        if (hotBalance == 0) {
            return ConstsContract.DISCOUNT_RATE_BASE();
        }

        bytes32 config = state.exchange.discountConfig;
        uint256 count = uint256(uint8(byte(config)));
        uint256 bar;

        // HOT Token has 18 decimals
        hotBalance = hotBalance.div(10**18);

        for (uint256 i = 0; i < count; i++) {
            bar = uint256(uint32(bytes4(config << (2 + i * 5) * 8)));

            if (hotBalance < bar) {
                result = uint256(uint8(byte(config << (2 + i * 5 + 4) * 8)));
                break;
            }
        }

        // If we haven't found a rate in the config yet, use the maximum rate.
        if (result == 0) {
            result = uint256(uint8(config[1]));
        }

        // Make sure our discount algorithm never returns a higher rate than the base.
        require(result <= ConstsContract.DISCOUNT_RATE_BASE(), "DISCOUNT_ERROR");
    }
}

contract DecimalContract is DiscountContract{
    using SafeMath for uint256;

    uint256 constant BASE = 10**18;

    function one()
        internal
        pure
        returns (uint256)
    {
        return BASE;
    }

    function onePlus(
        uint256 d
    )
        internal
        pure
        returns (uint256)
    {
        return d.add(BASE);
    }

    function mulFloor(
        uint256 target,
        uint256 d
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(d) / BASE;
    }

    function mulCeil(
        uint256 target,
        uint256 d
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(d).divCeil(BASE);
    }

    function divFloor(
        uint256 target,
        uint256 d
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(BASE).div(d);
    }

    function divCeil(
        uint256 target,
        uint256 d
    )
        internal
        pure
        returns (uint256)
    {
        return target.mul(BASE).divCeil(d);
    }
}


 contract RequiresContract is DecimalContract{
    function requireAssetExist(
        StoreContract.State storage state,
        address asset
    )
        internal
        view
    {
        require(isAssetExist(state, asset), "ASSET_NOT_EXIST");
    }

    function requireAssetNotExist(
        StoreContract.State storage state,
        address asset
    )
        internal
        view
    {
        require(!isAssetExist(state, asset), "ASSET_ALREADY_EXIST");
    }

    // function requireMarketIDAndAssetMatch(
    //     StoreContract.State storage state,
    //     uint16 marketID,
    //     address asset
    // )
    //     internal
    //     view
    // {
    //     require(
    //         asset == state.markets[marketID].baseAsset || asset == state.markets[marketID].quoteAsset,
    //         "ASSET_NOT_BELONGS_TO_MARKET"
    //     );
    // }

    function requireMarketNotExist(
        StoreContract.State storage state,
        TypesContract.Market memory market
    )
        internal
        view
    {
        require(!isMarketExist(state, market), "MARKET_ALREADY_EXIST");
    }

    function requireMarketAssetsValid(
        StoreContract.State storage state,
        TypesContract.Market memory market
    )
        internal
        view
    {
        require(market.baseAsset != market.quoteAsset, "BASE_QUOTE_DUPLICATED");
        require(isAssetExist(state, market.baseAsset), "MARKET_BASE_ASSET_NOT_EXIST");
        require(isAssetExist(state, market.quoteAsset), "MARKET_QUOTE_ASSET_NOT_EXIST");
    }

    function requireCashLessThanOrEqualContractBalance(
        StoreContract.State storage state,
        address asset
    )
        internal
        view
    {
        if (asset == ConstsContract.ETHEREUM_TOKEN_ADDRESS()) {
            if (state.cash[asset] > 0) {
                require(uint256(state.cash[asset]) <= address(this).balance, "CONTRACT_BALANCE_NOT_ENOUGH");
            }
        } else {
            if (state.cash[asset] > 0) {
                require(uint256(state.cash[asset]) <= IStandardToken(asset).balanceOf(address(this)), "CONTRACT_BALANCE_NOT_ENOUGH");
            }
        }
    }

    function requirePriceOracleAddressValid(
        address oracleAddress
    )
        internal
        pure
    {
        require(oracleAddress != address(0), "ORACLE_ADDRESS_NOT_VALID");
    }

    function requireDecimalLessOrEquanThanOne(
        uint256 decimal
    )
        internal
        pure
    {
        require(decimal <= DecimalContract.one(), "DECIMAL_GREATER_THAN_ONE");
    }

    function requireDecimalGreaterThanOne(
        uint256 decimal
    )
        internal
        pure
    {
        require(decimal > DecimalContract.one(), "DECIMAL_LESS_OR_EQUAL_THAN_ONE");
    }

    function requireMarketIDExist(
        StoreContract.State storage state,
        uint16 marketID
    )
        internal
        view
    {
        require(marketID < state.marketsCount, "MARKET_NOT_EXIST");
    }

    function requireCollateralAccountNormalStatus(
        StoreContract.State storage state,
        TypesContract.BalancePath memory path
    )
        internal
        view
    {
        if (path.category == TypesContract.BalanceCategory.CollateralAccount) {
            require(
                state.accounts[path.user][path.marketID].status == TypesContract.CollateralAccountStatus.Normal,
                "CAN_NOT_OPERATOR_LIQUIDATING_COLLATERAL_ACCOUNT"
            );
        }
    }

    // function requireCollateralAccountNotLiquidatable(
    //     StoreContract.State storage state,
    //     TypesContract.BalancePath memory path
    // )
    //     internal
    //     view
    // {
    //     if (path.category == TypesContract.BalanceCategory.CollateralAccount) {
    //         requireCollateralAccountNotLiquidatable(state, path.user, path.marketID);
    //     }
    // }

    // function requireCollateralAccountNotLiquidatable(
    //     StoreContract.State storage state,
    //     address user,
    //     uint16 marketID
    // )
    //     internal
    //     view
    // {
    //     require(
    //         !CollateralAccountsContract.getDetails(state, user, marketID).liquidatable,
    //         "COLLATERAL_ACCOUNT_LIQUIDATABLE"
    //     );
    // }

    function isAssetExist(
        StoreContract.State storage state,
        address asset
    )
        private
        view
        returns (bool)
    {
        return state.assets[asset].priceOracle != IPriceOracle(address(0));
    }

    function isMarketExist(
        StoreContract.State storage state,
        TypesContract.Market memory market
    )
        private
        view
        returns (bool)
    {
        for(uint16 i = 0; i < state.marketsCount; i++) {
            if (state.markets[i].baseAsset == market.baseAsset && state.markets[i].quoteAsset == market.quoteAsset) {
                return true;
            }
        }

        return false;
    }

}


contract TransferContract is SafeERC20Contract,RequiresContract{
    using SafeMath for uint256;
    using SafeMath for int256;
  //  using BalancePath for TypesContract.BalancePath;

    // Transfer asset into current contract
    function deposit(
        StoreContract.State storage state,
        address asset,
        uint256 amount
    )
        internal
    {
        if (asset != ConstsContract.ETHEREUM_TOKEN_ADDRESS()) {
            SafeERC20Contract.safeTransferFrom(asset, msg.sender, address(this), amount);
        } else {
            require(amount == msg.value, "MSG_VALUE_AND_AMOUNT_MISMATCH");
        }

        transferIn(state, asset, StoreContract.getCommonPath(msg.sender), amount);
        //EventsContract.logDeposit(msg.sender, asset, amount);
    }

    // Transfer asset out of current contract
    function withdraw(
        StoreContract.State storage state,
        address asset,
        uint256 amount
    )
        internal
    {
        require(state.balances[msg.sender][asset] >= amount, "BALANCE_NOT_ENOUGH");

        if (asset == ConstsContract.ETHEREUM_TOKEN_ADDRESS()) {
           msg.sender.transfer(amount,msg.assettype);
        } else {
            SafeERC20Contract.safeTransfer(asset, msg.sender, amount);
        }

        transferOut(state, asset, StoreContract.getCommonPath(msg.sender), amount);

        //EventsContract.logWithdraw(msg.sender, asset, amount);
    }

    // Get a user's asset balance
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

    // Move asset from a balances map to another
    function transfer(
        StoreContract.State storage state,
        address asset,
        TypesContract.BalancePath memory fromBalancePath,
        TypesContract.BalancePath memory toBalancePath,
        uint256 amount
    )
        internal
    {
        if (toBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
         //   RequiresContract.requireMarketIDAndAssetMatch(state, toBalancePath.marketID, asset);
        }
         require(StoreContract.getBalances(fromBalancePath,state,asset) >= amount, "TRANSFER_BALANCE_NOT_ENOUGH");
         state.balances[fromBalancePath.user][asset] = state.balances[fromBalancePath.user][asset].sub(amount);
         state.balances[toBalancePath.user][asset] = state.balances[toBalancePath.user][asset].add(amount);
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
}




contract LendingPoolContract is TransferContract{
    using SafeMath for uint256;
    using SafeMath for int256;

    uint256 private constant SECONDS_OF_YEAR = 31536000;

    // create new pool
    function initializeAssetLendingPool(
        StoreContract.State storage state,
        address asset
    )
        internal
    {
        // indexes starts at 1 for easy computation
        state.pool.borrowIndex[asset] = DecimalContract.one();
        state.pool.supplyIndex[asset] = DecimalContract.one();

        // record starting time for the pool
        state.pool.indexStartTime[asset] = block.timestamp;
    }

    /**
     * Supply asset into the pool. Supplied asset in the pool gains interest.
     */
    function supply(
        StoreContract.State storage state,
        address asset,
        uint256 amount,
        address user
    )
        internal
    {
        RequiresContract.requireAssetExist(state, asset);

        // update value of index at this moment in time
        updateIndex(state, asset);

        // transfer asset from user's balance account
        TransferContract.transferOut(state, asset, StoreContract.getCommonPath(user), amount);

        // compute the normalized value of 'amount'
        // round floor
        uint256 normalizedAmount = DecimalContract.divFloor(amount, state.pool.supplyIndex[asset]);

        // mint normalizedAmount of pool token for user
        state.assets[asset].lendingPoolToken.mint(user, normalizedAmount);

        // update interest rate based on latest state
        updateInterestRate(state, asset);

        //EventsContract.logSupply(user, asset, amount);
    }

    /**
     * unsupply asset from the pool, up to initial asset supplied plus interest
     */
    function unsupply(
        StoreContract.State storage state,
        address asset,
        uint256 amount,
        address user
    )
        internal
        returns (uint256)
    {
        // update value of index at this moment in time
        updateIndex(state, asset);

        // compute the normalized value of 'amount'
        // round ceiling
        uint256 normalizedAmount = DecimalContract.divCeil(amount, state.pool.supplyIndex[asset]);

        uint256 unsupplyAmount = amount;

        // check and cap the amount so user can't overdraw
        if (getNormalizedSupplyOf(state, asset, user) <= normalizedAmount) {
            normalizedAmount = getNormalizedSupplyOf(state, asset, user);
            unsupplyAmount = DecimalContract.mulFloor(normalizedAmount, state.pool.supplyIndex[asset]);
        }

        // transfer asset to user's balance account
        TransferContract.transferIn(state, asset, StoreContract.getCommonPath(user), unsupplyAmount);
        RequiresContract.requireCashLessThanOrEqualContractBalance(state, asset);

        // subtract normalizedAmount from the pool
        state.assets[asset].lendingPoolToken.burn(user, normalizedAmount);

        // update interest rate based on latest state
        updateInterestRate(state, asset);

        //EventsContract.logUnsupply(user, asset, unsupplyAmount);

        return unsupplyAmount;
    }

    /**
     * Borrow money from the lending pool.
     */
    function borrow(
        StoreContract.State storage state,
        address user,
        uint16 marketID,
        address asset,
        uint256 amount
    )
        internal
    {
       // RequiresContract.requireMarketIDAndAssetMatch(state, marketID, asset);

        // update value of index at this moment in time
        updateIndex(state, asset);

        // compute the normalized value of 'amount'
        uint256 normalizedAmount = DecimalContract.divCeil(amount, state.pool.borrowIndex[asset]);

        // transfer assets to user's balance account
        TransferContract.transferIn(state, asset, StoreContract.getMarketPath(user, marketID), amount);
        RequiresContract.requireCashLessThanOrEqualContractBalance(state, asset);

        // update normalized amount borrowed by user
        state.pool.normalizedBorrow[user][marketID][asset] = state.pool.normalizedBorrow[user][marketID][asset].add(normalizedAmount);

        // update normalized amount borrowed from the pool
        state.pool.normalizedTotalBorrow[asset] = state.pool.normalizedTotalBorrow[asset].add(normalizedAmount);

        // update interest rate based on latest state
        updateInterestRate(state, asset);

        //RequiresContract.requireCollateralAccountNotLiquidatable(state, user, marketID);

        //EventsContract.logBorrow(user, marketID, asset, amount);
    }

    /**
     * repay money borrowed money from the pool.
     */
    function repay(
        StoreContract.State storage state,
        address user,
        uint16 marketID,
        address asset,
        uint256 amount
    )
        internal
        returns (uint256)
    {
       // RequiresContract.requireMarketIDAndAssetMatch(state, marketID, asset);

        // update value of index at this moment in time
        updateIndex(state, asset);

        // get normalized value of amount to be repaid, which in effect take into account interest
        // (ex: if you borrowed 10, with index at 1.1, amount repaid needs to be 11 to make 11/1.1 = 10)
        uint256 normalizedAmount = DecimalContract.divFloor(amount, state.pool.borrowIndex[asset]);

        uint256 repayAmount = amount;

        // make sure user cannot repay more than amount owed
        if (state.pool.normalizedBorrow[user][marketID][asset] <= normalizedAmount) {
            normalizedAmount = state.pool.normalizedBorrow[user][marketID][asset];
            // repayAmount <= amount
            // because ⌈⌊a/b⌋*b⌉ <= a
            repayAmount = DecimalContract.mulCeil(normalizedAmount, state.pool.borrowIndex[asset]);
        }

        // transfer assets from user's balance account
        TransferContract.transferOut(state, asset, StoreContract.getMarketPath(user, marketID), repayAmount);

        // update amount(normalized) borrowed by user
        state.pool.normalizedBorrow[user][marketID][asset] = state.pool.normalizedBorrow[user][marketID][asset].sub(normalizedAmount);

        // update total amount(normalized) borrowed from pool
        state.pool.normalizedTotalBorrow[asset] = state.pool.normalizedTotalBorrow[asset].sub(normalizedAmount);

        // update interest rate
        updateInterestRate(state, asset);

        //EventsContract.logRepay(user, marketID, asset, repayAmount);

        return repayAmount;
    }

    /**
     * This method is called if a loan could not be paid back by the borrower, auction, or insurance,
     * in which case the generalized loss is recognized across all lenders.
     */
    function recognizeLoss(
        StoreContract.State storage state,
        address asset,
        uint256 amount
    )
        internal
    {
        uint256 totalnormalizedSupply = getTotalNormalizedSupply(
            state,
            asset
        );

        uint256 actualSupply = getTotalSupply(
            state,
            asset
        ).sub(amount);

        state.pool.supplyIndex[asset] = DecimalContract.divFloor(
            actualSupply,
            totalnormalizedSupply
        );

        //EventsContract.logLoss(asset, amount);
    }

    /**
     * Claim an amount from the insurance pool, in return for all the collateral.
     * Only called if an auction expired without being filled.
     */
    function claimInsurance(
        StoreContract.State storage state,
        address asset,
        uint256 amount
    )
        internal
    {
        uint256 insuranceBalance = state.pool.insuranceBalances[asset];

        uint256 compensationAmount = SafeMath.min(amount, insuranceBalance);

        state.cash[asset] = state.cash[asset].add(amount);

        // remove compensationAmount from insurance balances
        state.pool.insuranceBalances[asset] = SafeMath.sub(
            state.pool.insuranceBalances[asset],
            compensationAmount
        );

        // all suppliers pay debt if insurance not enough
        if (compensationAmount < amount) {
            recognizeLoss(
                state,
                asset,
                amount.sub(compensationAmount)
            );
        }

        //EventsContract.logInsuranceCompensation(
        //     asset,
        //     compensationAmount
        // );

    }

    function updateInterestRate(
        StoreContract.State storage state,
        address asset
    )
        private
    {
        (uint256 borrowInterestRate, uint256 supplyInterestRate) = getInterestRates(state, asset, 0);
        state.pool.borrowAnnualInterestRate[asset] = borrowInterestRate;
        state.pool.supplyAnnualInterestRate[asset] = supplyInterestRate;
    }

    // get interestRate
    function getInterestRates(
        StoreContract.State storage state,
        address asset,
        uint256 extraBorrowAmount
    )
        internal
        view
        returns (uint256 borrowInterestRate, uint256 supplyInterestRate)
    {
        RequiresContract.requireAssetExist(state, asset);

        (uint256 currentSupplyIndex, uint256 currentBorrowIndex) = getCurrentIndex(state, asset);

        uint256 _supply = getTotalSupplyWithIndex(state, asset, currentSupplyIndex);

        if (_supply == 0) {
            return (0, 0);
        }

        uint256 _borrow = getTotalBorrowWithIndex(state, asset, currentBorrowIndex).add(extraBorrowAmount);

        uint256 borrowRatio = _borrow.mul(DecimalContract.one()).div(_supply);

        borrowInterestRate = AssemblyCallContract.getBorrowInterestRate(
            address(state.assets[asset].interestModel),
            borrowRatio
        );

        uint256 borrowInterest = DecimalContract.mulCeil(_borrow, borrowInterestRate);
        uint256 supplyInterest = DecimalContract.mulFloor(borrowInterest, DecimalContract.one().sub(state.pool.insuranceRatio));

        supplyInterestRate = DecimalContract.divFloor(supplyInterest, _supply);
    }

    /**
     * update the index value
     */
    function updateIndex(
        StoreContract.State storage state,
        address asset
    )
        private
    {
        (uint256 currentSupplyIndex, uint256 currentBorrowIndex) = getCurrentIndex(state, asset);

        // get the total equity value
        uint256 normalizedBorrow = state.pool.normalizedTotalBorrow[asset];
        uint256 normalizedSupply = getTotalNormalizedSupply(state, asset);

        // interest = equity value * (current index value - starting index value)
        uint256 recentBorrowInterest = DecimalContract.mulCeil(
            normalizedBorrow,
            currentBorrowIndex.sub(state.pool.borrowIndex[asset])
        );

        uint256 recentSupplyInterest = DecimalContract.mulFloor(
            normalizedSupply,
            currentSupplyIndex.sub(state.pool.supplyIndex[asset])
        );

        // the interest rate spread goes into the insurance pool
        state.pool.insuranceBalances[asset] = state.pool.insuranceBalances[asset].add(recentBorrowInterest.sub(recentSupplyInterest));

        // update the indexes
        state.pool.supplyIndex[asset] = currentSupplyIndex;
        state.pool.borrowIndex[asset] = currentBorrowIndex;
        state.pool.indexStartTime[asset] = block.timestamp;
    }

    function getAmountSupplied(
        StoreContract.State storage state,
        address asset,
        address user
    )
        internal
        view
        returns (uint256)
    {
        RequiresContract.requireAssetExist(state, asset);

        (uint256 currentSupplyIndex, ) = getCurrentIndex(state, asset);
        return DecimalContract.mulFloor(getNormalizedSupplyOf(state, asset, user), currentSupplyIndex);
    }

    function getAmountBorrowed(
        StoreContract.State storage state,
        address asset,
        address user,
        uint16 marketID
    )
        internal
        view
        returns (uint256)
    {
       // RequiresContract.requireMarketIDAndAssetMatch(state, marketID, asset);

        // the actual amount borrowed = normalizedAmount * poolIndex
        (, uint256 currentBorrowIndex) = getCurrentIndex(state, asset);
        return DecimalContract.mulCeil(state.pool.normalizedBorrow[user][marketID][asset], currentBorrowIndex);

    }

    function getTotalSupply(
        StoreContract.State storage state,
        address asset
    )
        internal
        view
        returns (uint256)
    {
        RequiresContract.requireAssetExist(state, asset);

        (uint256 currentSupplyIndex, ) = getCurrentIndex(state, asset);
        return getTotalSupplyWithIndex(state, asset, currentSupplyIndex);
    }

    function getTotalBorrow(
        StoreContract.State storage state,
        address asset
    )
        internal
        view
        returns (uint256)
    {
        RequiresContract.requireAssetExist(state, asset);

        (, uint256 currentBorrowIndex) = getCurrentIndex(state, asset);
        return getTotalBorrowWithIndex(state, asset, currentBorrowIndex);
    }

    function getTotalSupplyWithIndex(
        StoreContract.State storage state,
        address asset,
        uint256 currentSupplyIndex
    )
        private
        view
        returns (uint256)
    {
        return DecimalContract.mulFloor(getTotalNormalizedSupply(state, asset), currentSupplyIndex);
    }

    function getTotalBorrowWithIndex(
        StoreContract.State storage state,
        address asset,
        uint256 currentBorrowIndex
    )
        private
        view
        returns (uint256)
    {
        return DecimalContract.mulCeil(state.pool.normalizedTotalBorrow[asset], currentBorrowIndex);
    }

    /**
     * Compute the current value of poolIndex based on the time elapsed and the interest rate
     */
    function getCurrentIndex(
        StoreContract.State storage state,
        address asset
    )
        private
        view
        returns (uint256 currentSupplyIndex, uint256 currentBorrowIndex)
    {
        uint256 timeDelta = block.timestamp.sub(state.pool.indexStartTime[asset]);

        uint256 borrowInterestRate = state.pool.borrowAnnualInterestRate[asset]
            .mul(timeDelta).divCeil(SECONDS_OF_YEAR); // Ceil Ensure asset greater than liability

        uint256 supplyInterestRate = state.pool.supplyAnnualInterestRate[asset]
            .mul(timeDelta).div(SECONDS_OF_YEAR);

        currentBorrowIndex = DecimalContract.mulCeil(state.pool.borrowIndex[asset], DecimalContract.onePlus(borrowInterestRate));
        currentSupplyIndex = DecimalContract.mulFloor(state.pool.supplyIndex[asset], DecimalContract.onePlus(supplyInterestRate));

        return (currentSupplyIndex, currentBorrowIndex);
    }

    function getNormalizedSupplyOf(
        StoreContract.State storage state,
        address asset,
        address user
    )
        private
        view
        returns (uint256)
    {
        return state.assets[asset].lendingPoolToken.balanceOf(user);
    }

    function getTotalNormalizedSupply(
        StoreContract.State storage state,
        address asset
    )
        private
        view
        returns (uint256)
    {
        return state.assets[asset].lendingPoolToken.totalSupply();
    }
}


contract CollateralAccountsContract is LendingPoolContract{
    using SafeMath for uint256;
    function getDetails(
        StoreContract.State storage state,
        address user,
        uint16 marketID
    )
        internal
        view
        returns (TypesContract.CollateralAccountDetails memory details)
    {
        TypesContract.CollateralAccount storage account = state.accounts[user][marketID];
        TypesContract.Market storage market = state.markets[marketID];

        details.status = account.status;

        address baseAsset = market.baseAsset;
        address quoteAsset = market.quoteAsset;

        uint256 baseUSDPrice = AssemblyCallContract.getAssetPriceFromPriceOracle(
            address(state.assets[baseAsset].priceOracle),
            baseAsset
        );
        uint256 quoteUSDPrice = AssemblyCallContract.getAssetPriceFromPriceOracle(
            address(state.assets[quoteAsset].priceOracle),
            quoteAsset
        );

        uint256 baseBorrowOf = LendingPoolContract.getAmountBorrowed(state, baseAsset, user, marketID);
        uint256 quoteBorrowOf = LendingPoolContract.getAmountBorrowed(state, quoteAsset, user, marketID);

        details.debtsTotalUSDValue = SafeMath.add(
            baseBorrowOf.mul(baseUSDPrice),
            quoteBorrowOf.mul(quoteUSDPrice)
        ) / DecimalContract.one();

        details.balancesTotalUSDValue = SafeMath.add(
            account.balances[baseAsset].mul(baseUSDPrice),
            account.balances[quoteAsset].mul(quoteUSDPrice)
        ) / DecimalContract.one();

        if (details.status == TypesContract.CollateralAccountStatus.Normal) {
            details.liquidatable = details.balancesTotalUSDValue < DecimalContract.mulCeil(details.debtsTotalUSDValue, market.liquidateRate);
        } else {
            details.liquidatable = false;
        }
    }

    /**
     * Get the amount that is avaliable to transfer out of the collateral account.
     *
     * If there are no open loans, this is just the total asset balance.
     *
     * If there are open loans, then this is the maximum amount that can be withdrawn
     *   without falling below the withdraw collateral ratio
     */
    function getTransferableAmount(
        StoreContract.State storage state,
        uint16 marketID,
        address user,
        address asset
    )
        internal
        view
        returns (uint256)
    {
        TypesContract.CollateralAccountDetails memory details = getDetails(state, user, marketID);

        // already checked at batch operation
        // liquidating or liquidatable account can't move asset

        uint256 assetBalance = state.accounts[user][marketID].balances[asset];

        // If and only if balance USD value is larger than transferableUSDValueBar, the user is able to withdraw some assets
        uint256 transferableThresholdUSDValue = DecimalContract.mulCeil(
            details.debtsTotalUSDValue,
            state.markets[marketID].withdrawRate
        );

        if(transferableThresholdUSDValue > details.balancesTotalUSDValue) {
            return 0;
        } else {
            uint256 transferableUSD = details.balancesTotalUSDValue - transferableThresholdUSDValue;
            uint256 assetUSDPrice = state.assets[asset].priceOracle.getPrice(asset);
            uint256 transferableAmount = DecimalContract.divFloor(transferableUSD, assetUSDPrice);
            if (transferableAmount > assetBalance) {
                return assetBalance;
            } else {
                return transferableAmount;
            }
        }
    }
}



contract  ExchangeContract is CollateralAccountsContract{
    using SafeMath for uint256;
    // using Order for TypesContract.Order;
    // using OrderParam for TypesContract.OrderParam;

    uint256 private constant EXCHANGE_FEE_RATE_BASE = 100000;
    uint256 private constant SUPPORTED_ORDER_VERSION = 2;

    /**
     * Calculated data about an order object.
     * Generally the filledAmount is specified in base token units, however in the case of a market
     * buy order the filledAmount is specified in quote token units.
     */
    struct OrderInfo {
        bytes32 orderHash;
        uint256 filledAmount;
        TypesContract.BalancePath balancePath;
    }

    /**
     * Match taker order to a list of maker orders. Common addresses are passed in
     * separately as an TypesContract.OrderAddressSet to reduce call size data and save gas.
     */
    function matchOrders(
        StoreContract.State storage state,
        TypesContract.MatchParams memory params
    )
        internal
    {
        //require(RelayerContract.canMatchOrdersFrom(state, params.orderAddressSet.relayer), "INVALID_SENDER");
       // require(!params.takerOrderParam.isMakerOnly(), "MAKER_ONLY_ORDER_CANNOT_BE_TAKER");

         bool isParticipantRelayer = isParticipant(state, params.orderAddressSet.relayer);
         uint256 takerFeeRate = getTakerFeeRate(state, params.takerOrderParam, isParticipantRelayer);
         OrderInfo memory takerOrderInfo = getOrderInfo(state, params.takerOrderParam, params.orderAddressSet);

        // // Calculate which orders match for settlement.
        TypesContract.MatchResult[] memory results = new TypesContract.MatchResult[](params.makerOrderParams.length-1);

        for (uint256 i =0; i < params.makerOrderParams.length-1; i++) {
            //require(!params.makerOrderParams[i].isMarketOrder(), "MAKER_ORDER_CAN_NOT_BE_MARKET_ORDER");
           // require(params.takerOrderParam.isSell() != params.makerOrderParams[i].isSell(), "INVALID_SIDE");
            validatePrice(params.takerOrderParam, params.makerOrderParams[i]);

            OrderInfo memory makerOrderInfo = getOrderInfo(state, params.makerOrderParams[i], params.orderAddressSet);

            results[i] = getMatchResult(
                state,
                params.takerOrderParam,
                takerOrderInfo,
                params.makerOrderParams[i],
                makerOrderInfo,
                params.baseAssetFilledAmounts[i],
                takerFeeRate,
                isParticipantRelayer
            );

            //Update amount filled for this maker order.
           state.exchange.filled[makerOrderInfo.orderHash] = makerOrderInfo.filledAmount;
        }

        // // Update amount filled for this taker order.
         state.exchange.filled[takerOrderInfo.orderHash] = takerOrderInfo.filledAmount;

         settleResults(state, results, params.takerOrderParam, params.orderAddressSet);
    }

    /**
     * Cancels an order, preventing it from being matched. In practice, matching mode relayers will
     * generally handle cancellation off chain by removing the order from their system, however if
     * the trader wants to ensure the order never goes through, or they no longer trust the relayer,
     * this function may be called to block it from ever matching at the contract level.
     *
     * Emits a Cancel event on success.
     *
     * @param order The order to be cancelled.
     */
    function cancelOrder(
        StoreContract.State storage state,
        TypesContract.Order memory order
    )
        internal
    {
        require(order.trader == msg.sender, "INVALID_TRADER");

        bytes32 orderHash = TypesContract.getHash(order);
        state.exchange.cancelled[orderHash] = true;

        //EventsContract.logOrderCancel(orderHash);
    }

    /**
     * Calculates current state of the order. Will revert transaction if this order is not
     * fillable for any reason, or if the order signature is invalid.
     *
     * @param orderParam The TypesContract.OrderParam object containing Order data.
     * @param orderAddressSet An object containing addresses common across each order.
     * @return An OrderInfo object containing the hash and current amount filled
     */
    function getOrderInfo(
        StoreContract.State storage state,
        TypesContract.OrderParam memory orderParam,
        TypesContract.OrderAddressSet memory orderAddressSet
    )
        private
        view
        returns (OrderInfo memory orderInfo)
    {
        require(TypesContract.getOrderVersion(orderParam) == SUPPORTED_ORDER_VERSION, "ORDER_VERSION_NOT_SUPPORTED");

        TypesContract.Order memory order = getOrderFromOrderParam(orderParam, orderAddressSet);
        orderInfo.orderHash =TypesContract.getHash(order);
        orderInfo.filledAmount = state.exchange.filled[orderInfo.orderHash];
        uint8 status = uint8(TypesContract.OrderStatus.FILLABLE);

        if (!TypesContract.isMarketBuy(orderParam) && orderInfo.filledAmount >= order.baseAssetAmount) {
            status = uint8(TypesContract.OrderStatus.FULLY_FILLED);
        } else if (TypesContract.isMarketBuy(orderParam) && orderInfo.filledAmount >= order.quoteAssetAmount) {
            status = uint8(TypesContract.OrderStatus.FULLY_FILLED);
        } else if (block.timestamp >= TypesContract.getExpiredAtFromOrderData(orderParam)) {
            status = uint8(TypesContract.OrderStatus.EXPIRED);
        } else if (state.exchange.cancelled[orderInfo.orderHash]) {
            status = uint8(TypesContract.OrderStatus.CANCELLED);
        }

        require(
            status == uint8(TypesContract.OrderStatus.FILLABLE),
            "ORDER_IS_NOT_FILLABLE"
        );

        require(
            SignatureContract.isValidSignature(orderInfo.orderHash, orderParam.trader, orderParam.signature),
            "INVALID_ORDER_SIGNATURE"
        );

        orderInfo.balancePath = TypesContract.getBalancePathFromOrderData(orderParam);
        RequiresContract.requireCollateralAccountNormalStatus(state, orderInfo.balancePath);

        return orderInfo;
    }

    /**
     * Reconstruct an Order object from the given TypesContract.OrderParam and TypesContract.OrderAddressSet objects.
     *
     * @param orderParam The TypesContract.OrderParam object containing the Order data.
     * @param orderAddressSet An object containing addresses common across each order.
     * @return The reconstructed Order object.
     */
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

    /**
     * Validates that the maker and taker orders can be matched based on the listed prices.
     *
     * If the taker submitted a sell order, the matching maker order must have a price greater than
     * or equal to the price the taker is willing to sell for.
     *
     * Since the price of an order is computed by order.quoteAssetAmount / order.baseAssetAmount
     * we can establish the following formula:
     *
     *    takerOrder.quoteAssetAmount        makerOrder.quoteAssetAmount
     *   -----------------------------  <=  -----------------------------
     *     takerOrder.baseAssetAmount        makerOrder.baseAssetAmount
     *
     * To avoid precision loss from division, we modify the formula to avoid division entirely.
     * In shorthand, this becomes:
     *
     *   takerOrder.quote * makerOrder.base <= takerOrder.base * makerOrder.quote
     *
     * We can apply this same process to buy orders - if the taker submitted a buy order then
     * the matching maker order must have a price less than or equal to the price the taker is
     * willing to pay. This means we can use the same result as above, but simply flip the
     * sign of the comparison operator.
     *
     * The function will revert the transaction if the orders cannot be matched.
     *
     * @param takerOrderParam The TypesContract.OrderParam object representing the taker's order data
     * @param makerOrderParam The TypesContract.OrderParam object representing the maker's order data
     */
    function validatePrice(
        TypesContract.OrderParam memory takerOrderParam,
        TypesContract.OrderParam memory makerOrderParam
    )
        private
        pure
    {
        uint256 left = takerOrderParam.quoteAssetAmount.mul(makerOrderParam.baseAssetAmount);
        uint256 right = takerOrderParam.baseAssetAmount.mul(makerOrderParam.quoteAssetAmount);
        require(TypesContract.isSell(takerOrderParam) ? left <= right : left >= right, "INVALID_MATCH");
    }

    /**
     * Construct a TypesContract.MatchResult from matching taker and maker order data, which will be used when
     * settling the orders and transferring token.
     *
     * @param takerOrderParam The TypesContract.OrderParam object representing the taker's order data
     * @param takerOrderInfo The OrderInfo object representing the current taker order state
     * @param makerOrderParam The TypesContract.OrderParam object representing the maker's order data
     * @param makerOrderInfo The OrderInfo object representing the current maker order state
     * @param takerFeeRate The rate used to calculate the fee charged to the taker
     * @param isParticipantRelayer Whether this relayer is participating in hot discount
     * @return TypesContract.MatchResult object containing data that will be used during order settlement.
     */
    function getMatchResult(
        StoreContract.State storage state,
        TypesContract.OrderParam memory takerOrderParam,
        OrderInfo memory takerOrderInfo,
        TypesContract.OrderParam memory makerOrderParam,
        OrderInfo memory makerOrderInfo,
        uint256 baseAssetFilledAmount,
        uint256 takerFeeRate,
        bool isParticipantRelayer
    )
        private
        view
        returns (TypesContract.MatchResult memory result)
    {
        result.baseAssetFilledAmount = baseAssetFilledAmount;
        result.quoteAssetFilledAmount = convertBaseToQuote(makerOrderParam, baseAssetFilledAmount);

        result.takerBalancePath = takerOrderInfo.balancePath;
        result.makerBalancePath = makerOrderInfo.balancePath;

        // Each order only pays gas once, so only pay gas when nothing has been filled yet.
        if (takerOrderInfo.filledAmount == 0) {
            result.takerGasFee = takerOrderParam.gasTokenAmount;
        }

        if (makerOrderInfo.filledAmount == 0) {
            result.makerGasFee = makerOrderParam.gasTokenAmount;
        }

        if(!TypesContract.isMarketBuy(takerOrderParam)) {
            takerOrderInfo.filledAmount = takerOrderInfo.filledAmount.add(result.baseAssetFilledAmount);
            require(takerOrderInfo.filledAmount <= takerOrderParam.baseAssetAmount, "TAKER_ORDER_OVER_MATCH");
        } else {
            takerOrderInfo.filledAmount = takerOrderInfo.filledAmount.add(result.quoteAssetFilledAmount);
            require(takerOrderInfo.filledAmount <= takerOrderParam.quoteAssetAmount, "TAKER_ORDER_OVER_MATCH");
        }

        makerOrderInfo.filledAmount = makerOrderInfo.filledAmount.add(result.baseAssetFilledAmount);
        require(makerOrderInfo.filledAmount <= makerOrderParam.baseAssetAmount, "MAKER_ORDER_OVER_MATCH");

        result.maker = makerOrderParam.trader;
        result.taker = takerOrderParam.trader;

        if(TypesContract.isSell(takerOrderParam)) {
            result.buyer = result.maker;
        } else {
            result.buyer = result.taker;
        }

        uint256 rebateRate = TypesContract.getMakerRebateRateFromOrderData(makerOrderParam);

        if (rebateRate > 0) {
            // If the rebate rate is not zero, maker pays no fees.
            result.makerFee = 0;

            // RebateRate will never exceed REBATE_RATE_BASE, so rebateFee will never exceed the fees paid by the taker.
            result.makerRebate = result.quoteAssetFilledAmount.mul(takerFeeRate).mul(rebateRate).div(
                EXCHANGE_FEE_RATE_BASE.mul(ConstsContract.DISCOUNT_RATE_BASE()).mul(ConstsContract.REBATE_RATE_BASE())
            );
        } else {
            uint256 makerRawFeeRate = TypesContract.getAsMakerFeeRateFromOrderData(makerOrderParam);
            result.makerRebate = 0;

            // maker fee will be reduced, but still >= 0
            uint256 makerFeeRate = getFinalFeeRate(
                state,
                makerOrderParam.trader,
                makerRawFeeRate,
                isParticipantRelayer
            );

            result.makerFee = result.quoteAssetFilledAmount.mul(makerFeeRate).div(
                EXCHANGE_FEE_RATE_BASE.mul(ConstsContract.DISCOUNT_RATE_BASE())
            );
        }

        result.takerFee = result.quoteAssetFilledAmount.mul(takerFeeRate).div(
            EXCHANGE_FEE_RATE_BASE.mul(ConstsContract.DISCOUNT_RATE_BASE())
        );
    }

    /**
     * Get the rate used to calculate the taker fee.
     *
     * @param orderParam The TypesContract.OrderParam object representing the taker order data.
     * @param isParticipantRelayer Whether this relayer is participating in hot discount.
     * @return The final potentially discounted rate to use for the taker fee.
     */
    function getTakerFeeRate(
        StoreContract.State storage state,
        TypesContract.OrderParam memory orderParam,
        bool isParticipantRelayer
    )
        private
        view
        returns(uint256)
    {
        uint256 rawRate = TypesContract.getAsTakerFeeRateFromOrderData(orderParam);
        return getFinalFeeRate(state, orderParam.trader, rawRate, isParticipantRelayer);
    }



  function getDiscountedRate(
        StoreContract.State storage state,
        address user
    )
        internal
        view
        returns (uint256 result)
    {
        uint256 hotBalance = AssemblyCallContract.getHotBalance(
            state.exchange.hotTokenAddress,
            user
        );

        if (hotBalance == 0) {
            return ConstsContract.DISCOUNT_RATE_BASE();
        }

        bytes32 config = state.exchange.discountConfig;
        uint256 count = uint256(uint8(byte(config)));
        uint256 bar;

        // HOT Token has 18 decimals
        hotBalance = hotBalance.div(10**18);

        for (uint256 i = 0; i < count; i++) {
            bar = uint256(uint32(bytes4(config << (2 + i * 5) * 8)));

            if (hotBalance < bar) {
                result = uint256(uint8(byte(config << (2 + i * 5 + 4) * 8)));
                break;
            }
        }

        // If we haven't found a rate in the config yet, use the maximum rate.
        if (result == 0) {
            result = uint256(uint8(config[1]));
        }

        // Make sure our discount algorithm never returns a higher rate than the base.
        require(result <= ConstsContract.DISCOUNT_RATE_BASE(), "DISCOUNT_ERROR");
    }


    /**
     * Take a fee rate and calculate the potentially discounted rate for this trader based on
     * HOT token ownership.
     *
     * @param trader The address of the trader who made the order.
     * @param rate The raw rate which we will discount if needed.
     * @param isParticipantRelayer Whether this relayer is participating in hot discount.
     * @return The final potentially discounted rate.
     */
    function getFinalFeeRate(
        StoreContract.State storage state,
        address trader,
        uint256 rate,
        bool isParticipantRelayer
    )
        private
        view
        returns(uint256)
    {
        if (isParticipantRelayer) {
            return rate.mul(getDiscountedRate(state, trader));
        } else {
            return rate.mul(ConstsContract.DISCOUNT_RATE_BASE());
        }
    }

    /**
     * Take an amount and convert it from base token units to quote token units based on the price
     * in the order param.
     *
     * @param orderParam The TypesContract.OrderParam object containing the Order data.
     * @param amount An amount of base token.
     * @return The converted amount in quote token units.
     */
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

    /**
     * Take a list of matches and settle them with the taker order, transferring tokens all tokens
     * and paying all fees necessary to complete the transaction.
     *
     * Settles a order given a list of TypesContract.MatchResult objects. A naive approach would be to take
     * each result, have the taker and maker transfer the appropriate tokens, and then have them
     * each send the appropriate fees to the relayer, meaning that for n makers there would be 4n
     * transactions.
     *
     * Instead we do the following:
     *
     * For a match which has a taker as seller:
     *  - Taker transfers the required base token to each maker
     *  - Each maker sends an amount of quote token to the taker equal to:
     *    [Amount owed to taker] + [Maker fee] + [Maker gas cost] - [Maker rebate amount]
     *  - Since the taker has received all the maker fees and gas costs, it can then send them along
     *    with taker fees in a single batch transaction to the relayer, equal to:
     *    [All maker and taker fees] + [All maker and taker gas costs] - [All maker rebates]
     *
     * Thus in the end the taker will have the full amount of quote token, sans the fee and cost of
     * their share of gas. Each maker will have their share of base token, sans the fee and cost of
     * their share of gas, and will keep their rebate in quote token. The relayer will end up with
     * the fees from the taker and each maker (sans rebate), and the gas costs will pay for the
     * transactions.
     *
     * For a match which has a taker as buyer:
     *  - Each maker transfers base tokens to the taker
     *  - The taker sends an amount of quote tokens to each maker equal to:
     *    [Amount owed to maker] + [Maker rebate amount] - [Maker fee] - [Maker gas cost]
     *  - Since the taker saved all the maker fees and gas costs, it can then send them as a single
     *    batch transaction to the relayer, equal to:
     *    [All maker and taker fees] + [All maker and taker gas costs] - [All maker rebates]
     *
     * Thus in the end the taker will have the full amount of base token, sans the fee and cost of
     * their share of gas. Each maker will have their share of quote token, including their rebate,
     * but sans the fee and cost of their share of gas. The relayer will end up with the fees from
     * the taker and each maker (sans rebates), and the gas costs will pay for the transactions.
     *
     * In this scenario, with n makers there will be 2n + 1 transactions, which will be a significant
     * gas savings over the original method.
     *
     * @param results List of TypesContract.MatchResult objects representing each individual trade to settle.
     * @param takerOrderParam The TypesContract.OrderParam object representing the taker order data.
     * @param orderAddressSet An object containing addresses common across each order.
     */
    function settleResults(
        StoreContract.State storage state,
        TypesContract.MatchResult[] memory results,
        TypesContract.OrderParam memory takerOrderParam,
        TypesContract.OrderAddressSet memory orderAddressSet
    )
        private
    {
        bool isTakerSell = TypesContract.isSell(takerOrderParam);

        uint256 totalFee = 0;

        TypesContract.BalancePath memory relayerBalancePath = TypesContract.BalancePath({
            user: orderAddressSet.relayer,
            marketID: 0,
            category: TypesContract.BalanceCategory.Common
        });

        for (uint256 i = 0; i < results.length; i++) {
            TransferContract.transfer(
                state,
                orderAddressSet.baseAsset,
                isTakerSell ? results[i].takerBalancePath : results[i].makerBalancePath,
                isTakerSell ? results[i].makerBalancePath : results[i].takerBalancePath,
                results[i].baseAssetFilledAmount
            );

            uint256 transferredQuoteAmount;

            if(isTakerSell) {
                transferredQuoteAmount = results[i].quoteAssetFilledAmount.
                    add(results[i].makerFee).
                    add(results[i].makerGasFee).
                    sub(results[i].makerRebate);
            } else {
                transferredQuoteAmount = results[i].quoteAssetFilledAmount.
                    sub(results[i].makerFee).
                    sub(results[i].makerGasFee).
                    add(results[i].makerRebate);
            }

            TransferContract.transfer(
                state,
                orderAddressSet.quoteAsset,
                isTakerSell ? results[i].makerBalancePath : results[i].takerBalancePath,
                isTakerSell ? results[i].takerBalancePath : results[i].makerBalancePath,
                transferredQuoteAmount
            );

           // Requires.requireCollateralAccountNotLiquidatable(state, results[i].makerBalancePath);

            totalFee = totalFee.add(results[i].takerFee).add(results[i].makerFee);
            totalFee = totalFee.add(results[i].makerGasFee).add(results[i].takerGasFee);
            totalFee = totalFee.sub(results[i].makerRebate);

            //EventsContract.logMatch(results[i], orderAddressSet);
        }

        TransferContract.transfer(
            state,
            orderAddressSet.quoteAsset,
            results[0].takerBalancePath,
            relayerBalancePath,
            totalFee
        );

      //  Requires.requireCollateralAccountNotLiquidatable(state, results[0].takerBalancePath);
    }
    
        function isParticipant(
        StoreContract.State storage state,
        address relayer
    )
        internal
        view
        returns(bool)
    {
        return !state.relayer.hasExited[relayer];
    }
}


contract BatchActionsContract is ExchangeContract{

    /**
     * All allowed actions types
     */
    enum ActionType {
        Deposit,   // Move asset from your wallet to tradeable balance
        Withdraw,  // Move asset from your tradeable balance to wallet
        Transfer,  // Move asset between tradeable balance and margin account
        Borrow,    // Borrow asset from pool
        Repay,     // Repay asset to pool
        Supply,    // Move asset from tradeable balance to pool to earn interest
        Unsupply   // Move asset from pool back to tradeable balance
    }

    /**
     * Uniform parameter for an action
     */
    // struct Action {
    //     ActionType actionType;  // The action type
    //     bytes encodedParams;    // Encoded params, it's different for each action
    // }
    //0x632b09bdc70391197420416dde118d39c119627697

    struct Action{
        ActionType actionType;
        uint16 marketID;
        address asset;
        uint256 amount;
        TypesContract.BalancePath  fromBalancePath;
        TypesContract.BalancePath  toBalancePath;
    }

    /**
     * Batch actions entrance
     * @param actions List of actions
     */
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
            } else if (actionType == ActionType.Borrow) {
                borrow(state, action,action.marketID,action.asset,action.amount);
            } else if (actionType == ActionType.Repay) {
                repay(state, action,action.marketID,action.asset,action.amount);
            } else if (actionType == ActionType.Supply) {
                supply(state, action,action.asset,action.amount);
            } else if (actionType == ActionType.Unsupply) {
                unsupply(state, action,action.asset,action.amount);
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
        require(fromBalancePath.user == msg.sender, "CAN_NOT_MOVE_OTHER_USER_ASSET");
        require(toBalancePath.user == msg.sender, "CAN_NOT_MOVE_ASSET_TO_OTHER_USER");

        RequiresContract.requireCollateralAccountNormalStatus(state, fromBalancePath);
        RequiresContract.requireCollateralAccountNormalStatus(state, toBalancePath);

        if (fromBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
            require(
                CollateralAccountsContract.getTransferableAmount(state, fromBalancePath.marketID, fromBalancePath.user, asset) >= amount,
                "COLLATERAL_ACCOUNT_TRANSFERABLE_AMOUNT_NOT_ENOUGH"
            );
        }

        TransferContract.transfer(
            state,
            asset,
            fromBalancePath,
            toBalancePath,
            amount
        );

        if (toBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
            //EventsContract.logIncreaseCollateral(msg.sender, toBalancePath.marketID, asset, amount);
        }
        if (fromBalancePath.category == TypesContract.BalanceCategory.CollateralAccount) {
            //EventsContract.logDecreaseCollateral(msg.sender, fromBalancePath.marketID, asset, amount);
        }
    }

    function borrow(
        StoreContract.State storage state,
        Action memory action,
        uint16 marketID,
        address asset,
        uint256 amount
    )
        private
    {
        LendingPoolContract.borrow(
            state,
            msg.sender,
            marketID,
            asset,
            amount
        );
    }

    function repay(
        StoreContract.State storage state,
        Action memory action,
        uint16 marketID,
        address asset,
        uint256 amount
    )
        private
    {

        LendingPoolContract.repay(
            state,
            msg.sender,
            marketID,
            asset,
            amount
        );
    }

    function supply(
        StoreContract.State storage state,
        Action memory action,
        address asset,
        uint256 amount
    )
        private
    {

        LendingPoolContract.supply(
            state,
            asset,
            amount,
            msg.sender
        );
    }

    function unsupply(
        StoreContract.State storage state,
        Action memory action,
        address asset,
        uint256 amount
    )
        private
    {

        LendingPoolContract.unsupply(
            state,
            asset,
            amount,
            msg.sender
        );
    }
}

contract AuctionsContract is BatchActionsContract{
    using SafeMath for uint256;
    using SafeMath for int256;
   // using Auction for TypesContract.Auction;

    /**
     * Liquidate a collateral account
     */

     function gettypes() public returns(string){
         return   TypesContract.getTypes();
     }
    function liquidate(
        StoreContract.State storage state,
        address user,
        uint16 marketID
    )
       internal
        returns (bool, uint32)
    {
        // if the account is in liquidate progress, liquidatable will be false
        TypesContract.CollateralAccountDetails memory details = CollateralAccountsContract.getDetails(
            state,
            user,
            marketID
        );

        require(details.liquidatable, "ACCOUNT_NOT_LIQUIDABLE");

        TypesContract.Market storage market = state.markets[marketID];
        TypesContract.CollateralAccount storage account = state.accounts[user][marketID];

        LendingPoolContract.repay(
            state,
            user,
            marketID,
            market.baseAsset,
            account.balances[market.baseAsset]
        );

        LendingPoolContract.repay(
            state,
            user,
            marketID,
            market.quoteAsset,
            account.balances[market.quoteAsset]
        );

        address collateralAsset;
        address debtAsset;

        uint256 leftBaseAssetDebt = LendingPoolContract.getAmountBorrowed(
            state,
            market.baseAsset,
            user,
            marketID
        );

        uint256 leftQuoteAssetDebt = LendingPoolContract.getAmountBorrowed(
            state,
            market.quoteAsset,
            user,
            marketID
        );

        if (leftBaseAssetDebt == 0 && leftQuoteAssetDebt == 0) {
            // no auction
            return (false, 0);
        }

        account.status = TypesContract.CollateralAccountStatus.Liquid;

        if(account.balances[market.baseAsset] > 0) {
            // quote asset is debt, base asset is collateral
            collateralAsset = market.baseAsset;
            debtAsset = market.quoteAsset;
        } else {
            // base asset is debt, quote asset is collateral
            collateralAsset = market.quoteAsset;
            debtAsset = market.baseAsset;
        }

        uint32 newAuctionID = create(
            state,
            marketID,
            user,
            msg.sender,
            debtAsset,
            collateralAsset
        );

        return (true, newAuctionID);
    }

    function fillHealthyAuction(
        StoreContract.State storage state,
        TypesContract.Auction storage auction,
        uint256 ratio,
        uint256 repayAmount
    )
        private
        returns (uint256, uint256) // bidderRepay collateral
    {
        uint256 leftDebtAmount = LendingPoolContract.getAmountBorrowed(
            state,
            auction.debtAsset,
            auction.borrower,
            auction.marketID
        );

        // get remaining collateral
        uint256 leftCollateralAmount = state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset];

        state.accounts[auction.borrower][auction.marketID].balances[auction.debtAsset] = repayAmount;

        // borrower pays back to the lending pool
        uint256 actualRepayAmount = LendingPoolContract.repay(
            state,
            auction.borrower,
            auction.marketID,
            auction.debtAsset,
            repayAmount
        );

        state.accounts[auction.borrower][auction.marketID].balances[auction.debtAsset] = 0;

        // compute how much collateral is divided up amongst the bidder, auction initiator, and borrower
        state.balances[msg.sender][auction.debtAsset] = SafeMath.sub(
            state.balances[msg.sender][auction.debtAsset],
            actualRepayAmount
        );

        uint256 collateralToProcess = leftCollateralAmount.mul(actualRepayAmount).div(leftDebtAmount);
        uint256 collateralForBidder = DecimalContract.mulFloor(collateralToProcess, ratio);

        uint256 collateralForInitiator = DecimalContract.mulFloor(collateralToProcess.sub(collateralForBidder), state.auction.initiatorRewardRatio);
        uint256 collateralForBorrower = collateralToProcess.sub(collateralForBidder).sub(collateralForInitiator);

        // update remaining collateral ammount
        state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset] = SafeMath.sub(
            state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset],
            collateralToProcess
        );

        // send a portion of collateral to the bidder
        state.balances[msg.sender][auction.collateralAsset] = SafeMath.add(
            state.balances[msg.sender][auction.collateralAsset],
            collateralForBidder
        );

        // send a portion of collateral to the initiator
        state.balances[auction.initiator][auction.collateralAsset] = SafeMath.add(
            state.balances[auction.initiator][auction.collateralAsset],
            collateralForInitiator
        );

        // send a portion of collateral to the borrower
        state.balances[auction.borrower][auction.collateralAsset] = SafeMath.add(
            state.balances[auction.borrower][auction.collateralAsset],
            collateralForBorrower
        );

        return (actualRepayAmount, collateralForBidder);
    }

    /**
     * Msg.sender only need to afford bidderRepayAmount and get collateralAmount
     * insurance and suppliers will cover the badDebtAmount
     */
    function fillBadAuction(
        StoreContract.State storage state,
        TypesContract.Auction storage auction,
        uint256 ratio,
        uint256 bidderRepayAmount
    )
        private
        returns (uint256, uint256) // bidderRepay collateral
    {

        uint256 leftDebtAmount = LendingPoolContract.getAmountBorrowed(
            state,
            auction.debtAsset,
            auction.borrower,
            auction.marketID
        );

        uint256 leftCollateralAmount = state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset];

        uint256 repayAmount = DecimalContract.mulFloor(bidderRepayAmount, ratio);

        state.accounts[auction.borrower][auction.marketID].balances[auction.debtAsset] = repayAmount;

        uint256 actualRepayAmount = LendingPoolContract.repay(
            state,
            auction.borrower,
            auction.marketID,
            auction.debtAsset,
            repayAmount
        );

        state.accounts[auction.borrower][auction.marketID].balances[auction.debtAsset] = 0; // recover unused principal

        uint256 actualBidderRepay = bidderRepayAmount;

        if (actualRepayAmount < repayAmount) {
            actualBidderRepay = DecimalContract.divCeil(actualRepayAmount, ratio);
        }

        // gather repay capital
        LendingPoolContract.claimInsurance(state, auction.debtAsset, actualRepayAmount.sub(actualBidderRepay));

        state.balances[msg.sender][auction.debtAsset] = SafeMath.sub(
            state.balances[msg.sender][auction.debtAsset],
            actualBidderRepay
        );

        // update collateralAmount
        uint256 collateralForBidder = leftCollateralAmount.mul(actualRepayAmount).div(leftDebtAmount);

        state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset] = SafeMath.sub(
            state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset],
            collateralForBidder
        );

        // bidder receive collateral
        state.balances[msg.sender][auction.collateralAsset] = SafeMath.add(
            state.balances[msg.sender][auction.collateralAsset],
            collateralForBidder
        );

        return (actualRepayAmount, collateralForBidder);
    }

    // ensure repay no more than repayAmount
    function fillAuctionWithAmount(
        StoreContract.State storage state,
        uint32 auctionID,
        uint256 repayAmount
    )
        internal
    {
        TypesContract.Auction storage auction = state.auction.auctions[auctionID];
        uint256 ratio = StoreContract.ratio(auction,state);

        uint256 actualRepayAmount;
        uint256 collateralForBidder;

        if (ratio <= DecimalContract.one()) {
            (actualRepayAmount, collateralForBidder) = fillHealthyAuction(state, auction, ratio, repayAmount);
        } else {
            (actualRepayAmount, collateralForBidder) = fillBadAuction(state, auction, ratio, repayAmount);
        }

        // reset account state if all debts are paid
        uint256 leftDebtAmount = LendingPoolContract.getAmountBorrowed(
            state,
            auction.debtAsset,
            auction.borrower,
            auction.marketID
        );

        //EventsContract.logFillAuction(auction.id, msg.sender, actualRepayAmount, collateralForBidder, leftDebtAmount);

        if (leftDebtAmount == 0) {
            endAuction(state, auction);
        }
    }

    /**
     * Mark an auction as finished.
     * An auction typically ends either when it becomes fully filled, or when it expires and is closed
     */
    function endAuction(
        StoreContract.State storage state,
        TypesContract.Auction storage auction
    )
        private
    {
        auction.status = TypesContract.AuctionStatus.Finished;

        state.accounts[auction.borrower][auction.marketID].status = TypesContract.CollateralAccountStatus.Normal;

        for (uint i = 0; i < state.auction.currentAuctions.length; i++) {
            if (state.auction.currentAuctions[i] == auction.id) {
                state.auction.currentAuctions[i] = state.auction.currentAuctions[state.auction.currentAuctions.length-1];
                state.auction.currentAuctions.length--;
            }
        }
    }

    /**
     * Create a new auction and save it in global state
     */
    function create(
        StoreContract.State storage state,
        uint16 marketID,
        address borrower,
        address initiator,
        address debtAsset,
        address collateralAsset
    )
        private
        returns (uint32)
    {
        uint32 id = state.auction.auctionsCount++;

        TypesContract.Auction memory auction = TypesContract.Auction({
            id: id,
            status: TypesContract.AuctionStatus.InProgress,
            startBlockNumber: uint32(block.number),
            marketID: marketID,
            borrower: borrower,
            initiator: initiator,
            debtAsset: debtAsset,
            collateralAsset: collateralAsset
        });

        state.auction.auctions[id] = auction;
        state.auction.currentAuctions.push(id);

        //EventsContract.logAuctionCreate(id);

        return id;
    }

    // price = debt / collateral / ratio
    function getAuctionDetails(
        StoreContract.State storage state,
        uint32 auctionID
    )
       internal
        view
        returns (TypesContract.AuctionDetails memory details)
    {
        TypesContract.Auction memory auction = state.auction.auctions[auctionID];

        details.debtAsset = auction.debtAsset;
        details.collateralAsset = auction.collateralAsset;

        details.leftDebtAmount = LendingPoolContract.getAmountBorrowed(
            state,
            auction.debtAsset,
            auction.borrower,
            auction.marketID
        );

        details.leftCollateralAmount = state.accounts[auction.borrower][auction.marketID].balances[auction.collateralAsset];

        details.ratio = StoreContract.ratio(auction,state);

        if (details.leftCollateralAmount != 0 && details.ratio != 0) {
            // price = debt/collateral/ratio
            details.price = DecimalContract.divFloor(DecimalContract.divFloor(details.leftDebtAmount, details.leftCollateralAmount), details.ratio);
        }
    }
}

// contract GlobalStore {
//     StoreContract.State state;
// }

/**
 * A collection of wrappers for all external methods in the protocol
 */
 
contract ExternalFunctions is AuctionsContract{
    StoreContract.State state;

      function gettypes() public returns(string){
         return   TypesContract.getTypes();
     }
    function approveDelegate(
        StoreContract.State storage state,
        address delegate
    )
        internal
    {
        state.relayer.relayerDelegates[msg.sender][delegate] = true;
        //EventsContract.logRelayerApproveDelegate(msg.sender, delegate);
    }

    /**
     * Revoke an existing delegate
     */
    function revokeDelegate(
        StoreContract.State storage state,
        address delegate
    )
        internal
    {
        state.relayer.relayerDelegates[msg.sender][delegate] = false;
        //EventsContract.logRelayerRevokeDelegate(msg.sender, delegate);
    }

    // /**
    //  * @return true if msg.sender is allowed to match orders which belong to relayer
    //  */
    function canMatchOrdersFrom(
        StoreContract.State storage state,
        address relayer
    )
        internal
        view
        returns(bool)
    {
        return msg.sender == relayer || state.relayer.relayerDelegates[relayer][msg.sender] == true;
    }

    /**
     * Join the Hydro incentive system.
     */
    function joinIncentiveSystem(
        StoreContract.State storage state
    )
        internal
    {
        delete state.relayer.hasExited[msg.sender];
        //EventsContract.logRelayerJoin(msg.sender);
    }

    /**
     * Exit the Hydro incentive system.
     * For relayers that choose to opt-out, the Hydro Protocol
     * effective becomes a tokenless protocol.
     */
    function exitIncentiveSystem(
        StoreContract.State storage state
    )
        internal
    {
        state.relayer.hasExited[msg.sender] = true;
        //EventsContract.logRelayerExit(msg.sender);
    }

    // /**
    //  * @return true if relayer is participating in the Hydro incentive system.
    //  */
    function isParticipant(
        StoreContract.State storage state,
        address relayer
    )
        internal
        view
        returns(bool)
    {
        return !state.relayer.hasExited[relayer];
    }

    // ////////////////////////////
    // // Batch Actions Function //
    // ////////////////////////////

    // function batch(
    //     BatchActionsContract.Action[] memory actions
    // )
    //     public
    //     payable
    // {
    //     BatchActionsContract.batch(state, actions);
    // }




/**
 *  balanceCategory: [0:frombalanceCategory,1:tobalanceCategory,2:frombalanceCategory,3:tobalanceCategory,...]
 *  BalancePathmarketID: [0:fromBalancePathmarketID,1:toBalancePathmarketID,2:fromBalancePathmarketID,...]
 *  BalancePathuser:  [0:fromBalancePathuser,1:toBalancePathuser,2:fromBalancePathuser,.....]
 *
 */

    function batch(
        ActionType[] actionType,
        BalanceCategory[] balanceCategory,
        uint16[] marketID,
        uint16[] BalancePathmarketID,
        address[] BalancePathuser,
        address[] asset,
        uint256[] amount
    )
        public
        payable
    {

        Action[] memory actions=new Action[](marketID.length);
        BalancePath  memory fromBalancePath;
        BalancePath memory toBalancePath;
        Action memory action;
        for(uint256 i=0;i<marketID.length;i++){
            fromBalancePath=BalancePath(balanceCategory[2*i],BalancePathmarketID[2*i],BalancePathuser[2*i]);
            toBalancePath=BalancePath(balanceCategory[2*i+1],BalancePathmarketID[2*i+1],BalancePathuser[2*i+1]);
            action=Action(actionType[i],marketID[i],asset[i],amount[i],fromBalancePath,toBalancePath);
            actions[i]=action;
        }
        BatchActionsContract.batch(state, actions);
    }







    // ////////////////////////
    // // Signature Function //
    // ////////////////////////

    // function isValidSignatures(
    //     bytes32 hash,
    //     address signerAddress,
    //     TypesContract.Signature signature
    // )
    //     public
    //     pure
    //     returns (bool isValid)
    // {
    //     isValid = SignatureContract.isValidSignature(hash, signerAddress, signature);
    // }


    function isValidSignatures(
        bytes32 hash,
        bytes32 config,
        bytes32 r,
        bytes32 s,
        address signerAddress

    )
        public
        pure
        returns (bool isValid)
    {
        TypesContract.Signature  memory signature=TypesContract.Signature(config,r,s);
       
        isValid = SignatureContract.isValidSignature(hash, signerAddress, signature);
    }






    // ///////////////////////
    // // Markets Functions //
    // ///////////////////////

    function getAllMarketsCount()
        external
        view
        returns (uint256 count)
    {
        count = state.marketsCount;
    }



  /*没改*/
    // function getAsset(address assetAddress)
    //     external
    //     view returns (TypesContract.Asset memory asset)
    // {
    //     asset = state.assets[assetAddress];
    // }









    function getAssetOraclePrice(address assetAddress)
        external
        view
        returns (uint256 price)
    {
        price = AssemblyCallContract.getAssetPriceFromPriceOracle(
            address(state.assets[assetAddress].priceOracle),
            assetAddress
        );
    }

    // function getMarket(uint16 marketID)
    //     external
    //     view returns (TypesContract.Market memory market)
    // {
    //     market = state.markets[marketID];
    // }

//  function getMarket(uint16 marketID)
//         external
//         view returns (address,address,uint256,uint256,uint256,uint256)
//     {
//         TypesContract.Market memory market = state.markets[marketID];
//         return(market.baseAsset,market.quoteAsset,market.liquidateRate,market.withdrawRate,market.auctionRatioStart,market.auctionRatioPerBlock);
//     }







    // //////////////////////////////////
    // // Collateral Account Functions //
    // //////////////////////////////////


   
    function isAccountLiquidatable(
        address user,
        uint16 marketID
    )
        external
        view
        returns (bool isLiquidatable)
    {
        isLiquidatable = CollateralAccountsContract.getDetails(state, user, marketID).liquidatable;
    }

    // function getAccountDetails(
    //     address user,
    //     uint16 marketID
    // )
    //     external
    //     view
    //     returns (TypesContract.CollateralAccountDetails memory details)
    // {
    //     details = CollateralAccountsContract.getDetails(state, user, marketID);
    // }



  function getAccountDetails(
        address user,
        uint16 marketID
    )
        external
        view
        returns (bool,TypesContract.CollateralAccountStatus,uint256,uint256)
    {
        TypesContract.CollateralAccountDetails memory details = CollateralAccountsContract.getDetails(state, user, marketID);
        return(details.liquidatable, details.status, details.debtsTotalUSDValue, details.balancesTotalUSDValue);
    }

   


    function getAuctionsCount()
        external
        view
        returns (uint32 count)
    {
        count = state.auction.auctionsCount;
    }

    function getCurrentAuctions()
        external
        view
        returns (uint32[] memory)
    {
        return state.auction.currentAuctions;
    }

    // function getAuctionDetails(uint32 auctionID)
    //     external
    //     view
    //     returns (TypesContract.AuctionDetails memory details)
    // {
    //     details = AuctionsContract.getAuctionDetails(state, auctionID);
    // }

 function getAuctionDetails(uint32 auctionID)
        external
        view
        returns (address,address,uint256,uint256,uint256,uint256)
    {
        TypesContract.AuctionDetails memory details = AuctionsContract.getAuctionDetails(state, auctionID);
        return(details.debtAsset,details.collateralAsset,details.leftDebtAmount,details.leftCollateralAmount,details.ratio,details.price);
    }


    function fillAuctionWithAmount(
        uint32 auctionID,
        uint256 amount
    )
        external
    {
        AuctionsContract.fillAuctionWithAmount(state, auctionID, amount);
    }

    function liquidateAccount(
        address user,
        uint16 marketID
    )
        external
        returns (bool isLiquidatable, uint32 auctionID)
    {
        (isLiquidatable, auctionID) = AuctionsContract.liquidate(state, user, marketID);
    }

    ///////////////////////////
    // LendingPoolContract Functions //
    ///////////////////////////

    function getTotalBorrow(address asset)
        external
        view
        returns (uint256 amount)
    {
        amount = LendingPoolContract.getTotalBorrow(state, asset);
    }

    function getTotalSupply(address asset)
        external
        view
        returns (uint256 amount)
    {
        amount = LendingPoolContract.getTotalSupply(state, asset);
    }

    function getAmountBorrowed(
        address asset,
        address user,
        uint16 marketID
    )
        external
        view
        returns (uint256 amount)
    {
        amount = LendingPoolContract.getAmountBorrowed(state, asset, user, marketID);
    }

    function getAmountSupplied(
        address asset,
        address user
    )
        external
        view
        returns (uint256 amount)
    {
        amount = LendingPoolContract.getAmountSupplied(state, asset, user);
    }

    function getInterestRates(
        address asset,
        uint256 extraBorrowAmount
    )
        external
        view
        returns (uint256 borrowInterestRate, uint256 supplyInterestRate)
    {
        (borrowInterestRate, supplyInterestRate) = LendingPoolContract.getInterestRates(state, asset, extraBorrowAmount);
    }

    function getInsuranceBalance(address asset)
        external
        view
        returns (uint256 amount)
    {
        amount = state.pool.insuranceBalances[asset];
    }

    // ///////////////////////
    // // RelayerContract Functions //
    // ///////////////////////

    function approveDelegate(address delegate)
        external
    {
        approveDelegate(state, delegate);
    }

    function revokeDelegate(address delegate)
        external
    {
      revokeDelegate(state, delegate);
    }

    function joinIncentiveSystem()
        external
    {
        joinIncentiveSystem(state);
    }

    function exitIncentiveSystem()
        external
    {
      exitIncentiveSystem(state);
    }

    function canMatchOrdersFrom(address relayer)
        external
        view
        returns (bool canMatch)
    {
        canMatch = canMatchOrdersFrom(state, relayer);
    }

    function isParticipant(address relayer)
        external
        view
        returns (bool result)
    {
        result = isParticipant(state, relayer);
    }

    ////////////////////////
    // Balances Functions //
    ////////////////////////

    function balanceOf(
        address asset,
        address user
    )
        external
        view
        returns (uint256 balance)
    {
        balance = TransferContract.balanceOf(state, StoreContract.getCommonPath(user), asset);
    }

    function marketBalanceOf(
        uint16 marketID,
        address asset,
        address user
    )
        external
        view
        returns (uint256 balance)
    {
        balance = TransferContract.balanceOf(state,  StoreContract.getMarketPath(user, marketID), asset);
    }

    function getMarketTransferableAmount(
        uint16 marketID,
        address asset,
        address user
    )
        public
        view
        returns (uint256 amount)
    {
        amount = CollateralAccountsContract.getTransferableAmount(state, marketID, user, asset);
    }

    // /** fallback function to allow deposit ether into this contract */
    function ()
        external
        payable
    {
        // deposit ${msg.value} ether for ${msg.sender}
        TransferContract.deposit(
            state,
            ConstsContract.ETHEREUM_TOKEN_ADDRESS(),
            msg.value
        );
    }

    // ////////////////////////
    // // ExchangeContract Functions //
    // ////////////////////////

    // function cancelOrderqa(
    //     TypesContract.Order  order
    // )
    //     public
    // { 
    //     ExchangeContract.cancelOrder(state, order);
    // }


function cancelOrderqa(
        address trader,
        address relayer,
        address baseAsset,
        address quoteAsset,
        uint256 baseAssetAmount,
        uint256 quoteAssetAmount,
        uint256 gasTokenAmount,
        bytes32 data
    )
        public
    { 

       TypesContract.Order memory order=TypesContract.Order(trader,relayer,baseAsset,quoteAsset,baseAssetAmount,quoteAssetAmount,gasTokenAmount, data);
       ExchangeContract.cancelOrder(state, order);
    }



      

    // function isOrderCancelled(
    //     bytes32 orderHash
    // )
    //     external
    //     view
    //     returns(bool isCancelled)
    // {
    //     isCancelled = state.exchange.cancelled[orderHash];
    // }

    // function matchOrders(
    //     TypesContract.MatchParams memory params
    // )
    //     public
    // {
    //     ExchangeContract.matchOrders(state, params);
    // }

    // /**
    //  *
    //  * @param data   [0:config,1:r,2:s,3:bytes32(baseAssetAmount),4:bytes32(quoteAssetAmount),5:bytes32(gasTokenAmount),6:OrderParam.data,....]
    //  * 
    //  * @param orderParam   [0:trader ,1:tradert, 2:trader,...,length-1:baseAsset,length-2:quoteAsset,length-3:relayer]
    //  * 
    //  * @param FilledAmounts  baseAssetFilledAmounts
    //  */
    

    function matchOrders(     
        bytes32[] data,
        address[] orderParamaddr,
        uint256[] FilledAmounts
        ) public{
        TypesContract.OrderParam[] memory orderParams=new TypesContract.OrderParam[](orderParamaddr.length-3);
        TypesContract.Signature memory sign;
        for( uint256 i=0;i<orderParamaddr.length-3;i++){
            sign=TypesContract.Signature(data[7*i],data[7*i+1],data[7*i+2]);
            orderParams[i]=TypesContract.OrderParam(orderParamaddr[i],uint256(data[7*i+3]),uint256(data[7*i+4]),uint256(data[7*i+5]),data[7*i+6],
            sign);
        }
        TypesContract.OrderAddressSet  memory orderAddressSett=TypesContract.OrderAddressSet(orderParamaddr[orderParamaddr.length-1],orderParamaddr[orderParamaddr.length-2],orderParamaddr[orderParamaddr.length-3]);
        TypesContract.MatchParams memory params=TypesContract.MatchParams(orderParams[orderParams.length-1],orderParams,FilledAmounts,orderAddressSett);
       ExchangeContract.matchOrders(state, params);
}






    function getDiscountedRate(
        address user
    )
        external
        view
        returns (uint256 rate)
    {
        rate = getDiscountedRate(state, user);
    }

    function getHydroTokenAddress()
        external
        view
        returns (address hydroTokenAddress)
    {
        hydroTokenAddress = state.exchange.hotTokenAddress;
    }
    function getOrderFilledAmount(
        bytes32 orderHash
    )
        external
        view
        returns (uint256 amount)
    {
        amount = state.exchange.filled[orderHash];
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
contract Ownable {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /** @dev The Ownable constructor sets the original `owner` of the contract to the sender account. */
    constructor()
        internal
    {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /** @return the address of the owner. */
    function owner()
        public
        view
        returns(address)
    {
        return _owner;
    }

    /** @dev Throws if called by any account other than the owner. */
    modifier onlyOwner() {
        require(isOwner(), "NOT_OWNER");
        _;
    }

    /** @return true if `msg.sender` is the owner of the contract. */
    function isOwner()
        public
        view
        returns(bool)
    {
        return msg.sender == _owner;
    }

    /** @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership()
        public
        onlyOwner
    {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /** @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(
        address newOwner
    )
        public
        onlyOwner
    {
        require(newOwner != address(0), "INVALID_OWNER");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract StandardToken {
    using SafeMath for uint256;

    mapping(address => uint256) balances;
    mapping (address => mapping (address => uint256)) internal allowed;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    /**
    * @dev transfer token for a specified address
    * @param to The address to transfer to.
    * @param amount The amount to be transferred.
    */
    function transfer(
        address to,
        uint256 amount
    )
        public
        returns (bool)
    {
        require(to != address(0), "TO_ADDRESS_IS_EMPTY");
        require(amount <= balances[msg.sender], "BALANCE_NOT_ENOUGH");

        balances[msg.sender] = balances[msg.sender].sub(amount);
        balances[to] = balances[to].add(amount);
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /**
    * @dev Gets the balance of the specified address.
    * @param owner The address to query the the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceOf(address owner) public view returns (uint256 balance) {
        return balances[owner];
    }

    /**
    * @dev Transfer tokens from one address to another
    * @param from address The address which you want to send tokens from
    * @param to address The address which you want to transfer to
    * @param amount uint256 the amount of tokens to be transferred
    */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        public
        returns (bool)
    {
        require(to != address(0), "TO_ADDRESS_IS_EMPTY");
        require(amount <= balances[from], "BALANCE_NOT_ENOUGH");
        require(amount <= allowed[from][msg.sender], "ALLOWANCE_NOT_ENOUGH");

        balances[from] = balances[from].sub(amount);
        balances[to] = balances[to].add(amount);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(amount);
        emit Transfer(from, to, amount);
        return true;
    }

    /**
    * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    * @param spender The address which will spend the funds.
    * @param amount The amount of tokens to be spent.
    */
    function approve(
        address spender,
        uint256 amount
    )
        public
        returns (bool)
    {
        allowed[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
    * @dev Function to check the amount of tokens that an owner allowed to a spender.
    * @param owner address The address which owns the funds.
    * @param spender address The address which will spend the funds.
    * @return A uint256 specifying the amount of tokens still available for the spender.
    */
    function allowance(
        address owner,
        address spender
    )
        public
        view
        returns (uint256)
    {
        return allowed[owner][spender];
    }
}


contract LendingPoolToken is StandardToken, Ownable {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    event Mint(address indexed user, uint256 value);
    event Burn(address indexed user, uint256 value);

    constructor (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    )
        public
    {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
        balances[msg.sender] = totalSupply;
    }

    function mint(
        address user,
        uint256 value
    )
        external
        onlyOwner
    {
        balances[user] = balances[user].add(value);
        totalSupply = totalSupply.add(value);
        emit Mint(user, value);
    }

    function burn(
        address user,
        uint256 value
    )
        external
        onlyOwner
    {
        balances[user] = balances[user].sub(value);
        totalSupply = totalSupply.sub(value);
        emit Burn(user, value);
    }

}



contract OperationsComponent is ExternalFunctions,Ownable{

    function createMarket(
        StoreContract.State storage state,
        TypesContract.Market memory market
    )
        internal
    {
        // Requires.requireMarketAssetsValid(state, market);
        // Requires.requireMarketNotExist(state, market);
        // Requires.requireDecimalLessOrEquanThanOne(market.auctionRatioStart);
        // Requires.requireDecimalLessOrEquanThanOne(market.auctionRatioPerBlock);
        // Requires.requireDecimalGreaterThanOne(market.liquidateRate);
        // Requires.requireDecimalGreaterThanOne(market.withdrawRate);

        state.markets[state.marketsCount++] = market;
        //EventsContract.logCreateMarket(market);
    }

    function updateMarket(
        StoreContract.State storage state,
        uint16 marketID,
        uint256 newAuctionRatioStart,
        uint256 newAuctionRatioPerBlock,
        uint256 newLiquidateRate,
        uint256 newWithdrawRate
    )
        internal
    {
        // Requires.requireMarketIDExist(state, marketID);
        // Requires.requireDecimalLessOrEquanThanOne(newAuctionRatioStart);
        // Requires.requireDecimalLessOrEquanThanOne(newAuctionRatioPerBlock);
        // Requires.requireDecimalGreaterThanOne(newLiquidateRate);
        // Requires.requireDecimalGreaterThanOne(newWithdrawRate);

        state.markets[marketID].auctionRatioStart = newAuctionRatioStart;
        state.markets[marketID].auctionRatioPerBlock = newAuctionRatioPerBlock;
        state.markets[marketID].liquidateRate = newLiquidateRate;
        state.markets[marketID].withdrawRate = newWithdrawRate;

        //EventsContract.logUpdateMarket(
        //     marketID,
        //     newAuctionRatioStart,
        //     newAuctionRatioPerBlock,
        //     newLiquidateRate,
        //     newWithdrawRate
        // );
    }
/**
    updata:
    poolTokenName:delete calldata
    poolTokenSymbol:delete calldata
 */
    function createAsset(
        StoreContract.State storage state,
        address asset,
        address oracleAddress,
        address interestModalAddress,
        string  poolTokenName,
        string  poolTokenSymbol,
        uint8 poolTokenDecimals
    )
        internal
    {
        // Requires.requirePriceOracleAddressValid(oracleAddress);
        // Requires.requireAssetNotExist(state, asset);

        LendingPoolContract.initializeAssetLendingPool(state, asset);

        state.assets[asset].priceOracle = IPriceOracle(oracleAddress);
        state.assets[asset].interestModel = IInterestModel(interestModalAddress);
        state.assets[asset].lendingPoolToken = ILendingPoolToken(address(new LendingPoolToken(
            poolTokenName,
            poolTokenSymbol,
            poolTokenDecimals
        )));

        //EventsContract.logCreateAsset(
        //     asset,
        //     oracleAddress,
        //     address(state.assets[asset].lendingPoolToken),
        //     interestModalAddress
        // );
    }

    function updateAsset(
        StoreContract.State storage state,
        address asset,
        address oracleAddress,
        address interestModalAddress
    )
       internal
    {
        // Requires.requirePriceOracleAddressValid(oracleAddress);
        // Requires.requireAssetExist(state, asset);

        state.assets[asset].priceOracle = IPriceOracle(oracleAddress);
        state.assets[asset].interestModel = IInterestModel(interestModalAddress);

        //EventsContract.logUpdateAsset(
        //     asset,
        //     oracleAddress,
        //     interestModalAddress
        // );
    }

    /**
     * @param newConfig A data blob representing the new discount config. Details on format above.
     */
    function updateDiscountConfig(
        StoreContract.State storage state,
        bytes32 newConfig
    )
       internal
    {
        state.exchange.discountConfig = newConfig;
        //EventsContract.logUpdateDiscountConfig(newConfig);
    }

    function updateAuctionInitiatorRewardRatio(
        StoreContract.State storage state,
        uint256 newInitiatorRewardRatio
    )
        internal
    {
     //   Requires.requireDecimalLessOrEquanThanOne(newInitiatorRewardRatio);

        state.auction.initiatorRewardRatio = newInitiatorRewardRatio;
        //EventsContract.logUpdateAuctionInitiatorRewardRatio(newInitiatorRewardRatio);
    }

    function updateInsuranceRatio(
        StoreContract.State storage state,
        uint256 newInsuranceRatio
    )
        internal
    {
       // Requires.requireDecimalLessOrEquanThanOne(newInsuranceRatio);

        state.pool.insuranceRatio = newInsuranceRatio;
        //EventsContract.logUpdateInsuranceRatio(newInsuranceRatio);
    }
}


contract Operations is  OperationsComponent{

    function createMarket(
        address baseAsset,
        address quoteAsset,
        uint256 liquidateRate,
        uint256 withdrawRate,
        uint256 auctionRatioStart,
        uint256 auctionRatioPerBlock

    )
        public
        onlyOwner
    {
        TypesContract.Market memory market=TypesContract.Market(baseAsset,quoteAsset,liquidateRate,withdrawRate,auctionRatioStart,auctionRatioPerBlock);
        OperationsComponent.createMarket(state, market);
    }

    function updateMarket(
        uint16 marketID,
        uint256 newAuctionRatioStart,
        uint256 newAuctionRatioPerBlock,
        uint256 newLiquidateRate,
        uint256 newWithdrawRate
    )
        external
        onlyOwner
    {
        OperationsComponent.updateMarket(
            state,
            marketID,
            newAuctionRatioStart,
            newAuctionRatioPerBlock,
            newLiquidateRate,
            newWithdrawRate
        );
    }
/**
updata:
poolTokenName:delete calldata
poolTokenSymbol:delete calldata
 */
    function createAsset(
        address asset,
        address oracleAddress,
        address interestModalAddress,
        string poolTokenName,
        string poolTokenSymbol,
        uint8 poolTokenDecimals
    )
        external
        onlyOwner
    { 
        OperationsComponent.createAsset(
            state,
            asset,
            oracleAddress,
            interestModalAddress,
            poolTokenName,
            poolTokenSymbol,
            poolTokenDecimals
        );
    }

    function updateAsset(
        address asset,
        address oracleAddress,
        address interestModalAddress
    )
        external
        onlyOwner
    {
        OperationsComponent.updateAsset(
            state,
            asset,
            oracleAddress,
            interestModalAddress
        );
    }

    /**
     * @param newConfig A data blob representing the new discount config. Details on format above.
     */
    function updateDiscountConfig(
        bytes32 newConfig
    )
        external
        onlyOwner
    {
        OperationsComponent.updateDiscountConfig(
            state,
            newConfig
        );
    }

    function updateAuctionInitiatorRewardRatio(
        uint256 newInitiatorRewardRatio
    )
        external
        onlyOwner
    {
        OperationsComponent.updateAuctionInitiatorRewardRatio(
            state,
            newInitiatorRewardRatio
        );
    }

    function updateInsuranceRatio(
        uint256 newInsuranceRatio
    )
        external
        onlyOwner
    {
        OperationsComponent.updateInsuranceRatio(
            state,
            newInsuranceRatio
        );
    }
}
contract Mist is Operations,Template {
    constructor(
        address _hotTokenAddress
    )
        public
    {
        state.exchange.hotTokenAddress = _hotTokenAddress;
        state.exchange.discountConfig = 0x043c000027106400004e205a000075305000009c404600000000000000000000;
    }
}
contract TokenPAI is StandardToken,Template {
    string public name = "PAI TOKEN BY GXY";
    string public symbol = "PAI";
    uint8 public decimals = 18;
    uint256 public totalSupply = 2561000000 * 10**18;

    constructor() public {
        balances[msg.sender] = totalSupply;
    }
}

