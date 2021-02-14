(function (window) {
  // Promise状态
  const PADDING = 'padding'
  const FULFILLED = 'fulfilled'
  const REJECTED = 'rejected'

  /**
   * 自定义Promise
   * @param  {Function} exector: 执行器函数
   */
  function Promise(exector) {
    const self = this
    this._status = PADDING    // 保存promise状态
    this._result = undefined  // 保存promise数据
    this._callbacks = []      // 保存promise.then方法的回调

    /**
     * 成功的回调
     * @param {any} value: 成功后返回数据
     */
    function resolve(value) {
      if (self._status !== PADDING) return // promise状态改变后不能再次改变

      self._status = FULFILLED             // 修改promise状态为fulfilled
      self._result = value                 // 保存成功后返回的数据

      // 如果_callbacks中有.then方法，则说明是先执行回调，后改变状态的，取出全部成功的回调加入异步队列执行
      if (self._callbacks.length > 0) {
        self._callbacks.forEach(callbackObj => {
          setTimeout(() => {
            callbackObj.onResolved(self._result)
          });
        })
      }
    }

    /**
     * 失败的回调
     * @param {any} reason: 失败后的返回数据 
     */
    function reject(reason) {
      if (self._status !== PADDING) return // promise状态改变后不能再次改变

      self._status = REJECTED              // 修改promise状态为rejected
      self._result = reason                // 保存失败后返回的数据

      // 如果_callbacks中有.then方法，则说明是先执行回调，后改变状态的，取出全部失败的回调加入异步队列执行
      if (self._callbacks.length > 0) {
        self._callbacks.forEach(callbackObj => {
          setTimeout(() => {
            callbackObj.onRejected(self._result)
          });
        })
      }
    }

    // 立即执行构造器函数
    try {
      exector(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  /**
   * Promise原型对象then方法
   * @param {Function} onResolved: 成功后的回调
   * @param {Function} onRejected: 失败后的回调
   */
  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this
    // 设置默认回调
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    return new Promise((resolve, reject) => {
      /**
       * 根据.then中的回调函数执行结果决定return的Promise的状态和返回值，三种情况
       * 1. 抛出异常，promise状态变为失败，失败值为error
       * 2. 返回值不是promise，promise状态变为成功，成功值为返回的值
       * 3. 返回值是promise，promise状态由返回的promise决定
       * @param  {Function} callback: 回调函数
       */
      function handle(callback) {
        // 是否抛出异常
        try {
          const result = callback(self._result)
          if (result instanceof Promise) {
            result.then(resolve, reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          // 抛出异常，promise状态变为失败
          reject(error)
        }
      }

      // 如果状态是padding，说明是先执行回调，将回调push到回调数组中，在状态改变时调用
      if (self._status === PADDING) {
        self._callbacks.push({
          onResolved() { handle(onResolved) },
          onRejected() { handle(onRejected) }
        })
      } else if (self._status === FULFILLED) { // 如果是fulfilled，说明已经改变为成功状态了
        setTimeout(() => {
          handle(onResolved)
        });
      } else { // 如果是rejected，说明已经改变为失败状态了
        setTimeout(() => {
          handle(onRejected)
        });
      }
    })
  }

  /**
   * Promise原型对象catch方法
   * @param {Function} onRejected: 失败后的回调
   */
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected)
  }

  /**
   * Promise函数对象resolve方法
   * @param {any} value: 将被Promise对象解析的参数，也可以是一个Promise对象
   */
  Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
      if (value instanceof Promise) {
        value.then(resolve, reject)
      } else {
        resolve(value)
      }
    })
  }

  /**
   * Promise函数对象reject方法
   * @param {any} reason 表示Promise被拒绝的原因
   */
  Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  /**
   * Promise函数对象all方法
   * @param {type} iterable: 一个可迭代对象，如 Array 或 String。
   */
  Promise.all = function (iterable) {
    let returnArr = new Array(iterable.length)
    let count = 0

    return new Promise((resolve, reject) => {
      iterable.forEach((p, i) => {
        Promise.resolve(p).then(
          value => {
            count++
            returnArr[i] = value
            if (count === iterable.length) {
              resolve(returnArr)
            }
          },
          reason => {
            reject(reason)
          }
        )
      })
    })
  }

  /**
   * Promise函数对象race方法
   * @param {type} iterable： 可迭代对象
   */
  Promise.race = function (iterable) {
    return new Promise((resolve, reject) => {
      iterable.forEach(p => {
        Promise.resolve(p).then(
          value => {
            resolve(value)
          },
          reason => {
            reject(reason)
          }
        )
      })
    })
  }

  window.Promise = Promise
})(window)
