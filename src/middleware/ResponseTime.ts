import { Request } from 'express';

let countFast = 0;
let countSlow = 0;

const responseTime = () => {
  return (req:Request, res, next) => {
    const startTime = new Date().getTime(); // 获取时间 t1

    const calResponseTime = () => {
      const now = new Date().getTime();
      const deltaTime = now - startTime;
      if (deltaTime > 200) {
        console.log(`[TIME]:${deltaTime/1000}s Path:${req.path} Slow_Count:${++countSlow}/${countSlow+countFast}`);
      } else {
        countFast ++;
      }
    };

    res.once('finish', calResponseTime);
    // res.once('close', calResponseTime);
    return next();
  };
};

export { responseTime };