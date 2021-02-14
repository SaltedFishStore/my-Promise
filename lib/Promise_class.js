(function (window) {
    const PADDING = 'padding'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    /**
     * 自定义Promise
     * @param {Function} executor: 执行器函数
     */
    class Promise {
        constructor(executor) {
            const self = this
            this._status = PADDING
            this._result = undefined
            this._callbacks = []

            function resolve(value) {
                if (self._status !== PADDING) return

                self._status = RESOLVED
                self._result = value

                if (self._callbacks.length > 0) {
                    self._callbacks.forEach(callback => {
                        setTimeout(() => {
                            callback.onResolved(self._result)
                        });
                    })
                }
            }

            function reject(reason) {
                if (self._status !== PADDING) return

                self._status = REJECTED
                self._result = reason

                if (self._callbacks.length > 0) {
                    self._callbacks.forEach(callback => {
                        callback.onRejected(self._result)
                    })
                }
            }

            try {
                executor(resolve, reject)
            } catch (error) {
                reject(error)
            }
        }

        /**
         * Promise原型then方法
         * @param {Function} onResolved: 成功的回调
         * @param {Function} onRejected: 失败的回调
         */
        then(onResolved, onRejected) {
            const self = this
            onResolved = typeof onResolved === 'function' ? onResolved : value => value
            onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

            return new Promise((resolve, reject) => {
                function handle(callback) {
                    try {
                        const result = callback(self._result)
                        if (result instanceof Promise) {
                            result.then(resolve, reject)
                        } else {
                            resolve(result)
                        }
                    } catch (error) {
                        reject(error)
                    }
                }

                if (self._status === PADDING) {
                    self._callbacks.push({
                        onResolved() {
                            handle(onResolved)
                        },
                        onRejected() {
                            handle(onRejected)
                        }
                    })
                } else if (self._status === RESOLVED) {
                    setTimeout(() => {
                        handle(onResolved)
                    });
                } else {
                    setTimeout(() => {
                        handle(onRejected)
                    });
                }
            })
        }

        /**
         * Promise原型catch方法
         * @param {type} onRejected: 失败的回调
         */
        catch(onRejected) {
            this.then(undefined, onRejected)
        }

        /**
         * Promise函数对象resolve方法
         * @param {type} value: promise对象或string
         */
        static resolve(value) {
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
         * @param {type} reason: 失败的描述
         */
        static reject(reason) {
            return new Promise((resolve, reject) => {
                reject(reason)
            })
        }

        /**
         * Promise函数对象all方法
         * @param {type} iteration: 一个可迭代数据
         */
        static all(iteration) {
            const resultArr = new Array(iteration.length)
            let count = 0

            return new Promise((resolve, reject) => {
                iteration.forEach((p, i) => {
                    Promise.resolve(p).then(
                        value => {
                            count++
                            resultArr[i] = value
                            if (count === iteration.length) {
                                resolve(resultArr)
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
         * @param {type} iteration: 一个可迭代数据
         */
        static race(iteration) {
            return new Promise((resolve, reject) => {
                iteration.forEach(p => {
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
    }


    window.Promise = Promise
})(window)
