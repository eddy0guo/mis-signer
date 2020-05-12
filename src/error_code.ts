enum errorCode {
    SUCCESSFUL = 0,                        // 成功
    INVALID_PARAMS = 200001,                    // 不支持或者无效的参数
    VERIFY_FAILED = 200002,                     // 验签失败
    SIGNATURE_EXPIRED = 200003,                 // 签名过期
    OFFICIAL_RESOURCES_INSUFFICIENT = 200004,   // 官方账户资源不足
    FEE_INSUFFICIENT = 200005,                  // 用户手续费不足
    BALANCE_INSUFFICIENT = 200006,              // 用户余额不足
    ENGINE_BUSY = 200007,              // 交易繁忙
    INTERNAL_ERROR = 100001,                    // 保留错误码
    EXTERNAL_DEPENDENCIES_ERROR = 100002,       // 依赖服务（pg,redis,节点）异常
}
export {errorCode};
