import 'express-async-errors'
import { HttpException } from '../common/exceptions/http.exception'


// 捕获路由处理中抛出的异常，注：异步异常抛出需要结合async 和 await 使用才有效，如下：
// demo
// app.use(async (req, res) => {
//   const user = await User.findByToken(req.get('authorization'));

//   if (!user) throw Error("access denied");
// });
// 如果使用async和await 在异步中抛出异常则无法捕获。

// app.use(async (req, res) => {
//   setTimeout(()=> {
//     throw new Error('无法捕获的异常')
//   })

//   Promise.reject('无法捕获的异常')

//   await Promise.reject('可以捕获的异常')
// })


export const  ErrorHandle = (err, req, res, next)=> {
  if(err) {
    if(err instanceof HttpException){
      res.status(err.getStatus())
      .json({
        msg: err.getMessage()
      })
    } else {
      res.json({
        msg: err.message
      })
    }
  }
  next()
}