(function (window) {
  // Promise状态
  const PADDING = 'padding';
  const FULFILLED = 'fulfilled';
  const REJECTED = 'rejected';

  /**
   * 自定义 Promise 函数模块
   * @param  {Function} executor: 执行器函数
   */
  function Promise(executor) {
    const self = this;

    self._status = PADDING;     // 存储Promise状态，初始值为padding
    self._result = undefined;   // 存储Promise结果
    self._callbacks = [];       // 存储回调函数

    function resolve(value) {
      if (self._status !== PADDING) return;

      self._status = FULFILLED; // 将状态改为fulfilled
      self._result = value;     // 保存value数据

      // 如果先指定回调，后改变状态，立即异步执行回调onResolve
      if (self._callbacks.length > 0) {
        // 放入宏任务队列执行所有成功回调
        setTimeout(() => {
          self._callbacks.forEach(callbackObj => {
            callbackObj.onResolved(value);
          });
        });
      }
    }

    function reject(reason) {
      if (self._status !== PADDING) return;

      self._status = REJECTED; // 将状态改为fulfilled
      self._result = reason;   // 保存reason数据

      // 如果先指定回调，后改变状态，立即异步执行回调onResolve
      if (self._callbacks.length > 0) {
        // 放入宏任务队列执行所有失败回调
        setTimeout(() => {
          self._callbacks.forEach(callbackObj => {
            callbackObj.onRejected(reason);
          });
        });
      }
    }

    // 立即执行executor，如果抛出异常，则执行失败的回调函数
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Promise 原型中 then 方法
   * @param  {Function} onResolved: 成功的回调函数
   * @param  {Function} onRejected: 失败的回调函数
   * @return {type} 返回一个新的Promise对象
   */
  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this;

    onResolved = typeof onResolved === 'function' ? onResolved : value => value;
    // 指定默认失败的回调函数
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    /**
     * 返回一个新的Promise
     * 1. 抛出异常，return的Promise就会失败，失败的结果就是error
     * 2. 如果回调函数返回的不是Promise，return的Promise就会成功，value就是返回值
     * 3. 如果回调函数返回的是Promise，return的Pormise结果就是这个Promise的结果
     */
    return new Promise((resolve, reject) => {
      /**
       * 根据onResolved | onRejected返回值决定return的Promise的状态
       * @param  {Function} callback: 成功或失败的回调
       */
      function handle(callback) {
        try { // 这里没有抛出异常 
          const result = callback(self._result);
          // 返回值是Promise
          if (result instanceof Promise) {
            result.then(resolve, reject);
          } else {
            // 返回值不是Promise，调用成功的回调，值为返回值
            resolve(result);
          }
        } catch (error) {
          // 抛出异常，Promise失败，调用reject，值为error
          reject(error);
        }
      }

      // 如果状态是pdding，则说明这里是先执行回调，后改变状态的，这里将回调加入数组中等待执行
      if (self._status === PADDING) {
        self._callbacks.push({
          onResolved() {
            handle(onResolved);
          },
          onRejected() {
            handle(onRejected);
          }
        });
      } else if (self._status === FULFILLED) {
        // 状态是fulfilled，说明是先改变状态，后执行回调的，在这里将回调函数放入异步队列执行
        setTimeout(() => {
          handle(onResolved);
        });
      } else { // rejected
        setTimeout(() => {
          handle(onRejected);
        });
      }
    })
  }

  /**
   * Promise 原型中 catch 方法
   * @param  {Function} onRejected: 失败的回调函数
   * @return {type} 返回一个新的Promise对象
   */
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected);
  }

  /**
   * Promise 函数对象中 resolve 方法
   * @param  {type} value: 成功后返回值
   * @return {type} 返回一个指定结果的Promise
   */
  Promise.resolve = function (value) {
    // 返回一个成功/失败的Promise
    return new Promise((resolve, reject) => {
      // value是Promise
      if (value instanceof Promise) {
        value.then(resolve, reject);
      } else {
        resolve(value);
      }
    });
  }

  /**
   * Promise 函数对象中 reject 方法
   * @param  {type} reason: 失败后返回值
   * @return {type} 返回一个指定结果的Promise
   */
  Promise.reject = function (reason) {
    // 返回一个失败的Promise
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  /**
   * Promise 函数对象中 all 方法
   * @param  {Array} promises: Promise 数组
   * @return {type} 返回一个Promise，只有所有Promise都成功是才成功
   */
  Promise.all = function (promises) {
    const resultArr = new Array(promises.length);
    let count = 0;

    return new Promise((resolve, reject) => {
      promises.forEach((p, index) => {
        Promise.resolve(p).then(
          value => {
            count++;
            resultArr[index] = value;
            if (count === promises.length) {
              resolve(resultArr);
            }
          },
          reason => {
            reject(reason);
          }
        )
      })
    });
  }

  /**
   * Promise 函数对象中 race 方法
   * @param  {Array} promises: Promise 数组
   * @return {type} 返回一个Promise，其结果由第一个完成的Promise决定
   */
  Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
      promises.forEach((p, index) => {
        Promise.resolve(p).then(
          value => {
            resolve(value);
          },
          reason => {
            reject(reason);
          }
        )
      })
    });
  }

  window.Promise = Promise;
})(window);
