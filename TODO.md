# TODO

## Struct

### Order Struct

```typescript
{
    orderId:string,
    token:address,
    baseToken:address,
    price:uint256,
    amount:uint256,
    amountFixed:uint256,
    amountLeft:uint256
}
```

### Trade Struct

```typescript
{
    takerOrder:string,
    makerOrders:array,
    status:int
}
```

## RestFUL API

### Token

- (later)AddToken

### Market

- (later)CreateMarket
- (later)GetMarketList
- (later)GetMarketDepth

### Trade

- MakeOrder
- CancalOrder

### Match Engine

- MatchOrders

### Wallet

- GetBalance
- WrapAsset
- UnwarpAsset

## Contract

### Exchange

- MatchOrders
- (later)CreateMarket
- (later)CancelOrder

### WrappedToken

- (later)WrapAsset
- (later)UnwrapAsset
- approve
- transferFrom
