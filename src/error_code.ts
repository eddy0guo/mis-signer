// @ts-ignore
// @ts-ignore
/**
* 1.对于API结果返回，定义BaseResult 类

 拥有success，errorCode，errorMsg个3个基本参数，
 success使用Boolean类型，errorCode使用Integer类型，errorMsg使用String类型
 对于success，false表示接口请求失败，true表示接口请求成功。
 对于errorCode，当success=true时为0，其他请参阅ABBCCC格式错误码。
 对于errorMsg，当success=true时为null，其他情况不为null。
 *
*2.错误码格式定义
 统一格式：A-BB-CCC，6位长度整形int。

 A：代表错误级别，1表示系统级错误，2表示业务级错误。

 BB：代表模块号，从00开始。

 CCC：具体错误编号，自增，从001开始。
 无效的参数：001
 签名校验失败：002
 签名过期：003
 官方燃料费或者头寸不足:004
 用户手续费不足：005
 用户余额不足:006

 * */
enum errorCode {
    // @ts-ignore
    SUCCESSFUL = 000000,
    INVALID_PARAMS = 200001, // 不支持或者无效的参数
    VERIFY_FAILED = 200002,
    SIGNATURE_EXPIRED = 200003,
    OFFICIAL_RESOURCES_INSUFFICIENT = 200004,
    FEE_INSUFFICIENT = 200005,
    BALANCE_INSUFFICIENT = 200006,
    INTERNAL_ERROR = 100001,
    EXTERNAL_DEPENDENCIES_ERROR = 100002, // 依赖服务（pg,redis,节点）异常
    UNKNOWN_ERROR = 100003, // 保留错误
}
export {errorCode};
