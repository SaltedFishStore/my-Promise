setTimeout(() => {
  console.log(1)
}, 0)
new Promise((resolve) => {
  console.log(2)
  resolve()
}).then(() => {
  console.log(3)
}).then(() => {
  console.log(4)
})
console.log(5)

// 2, 5, 3, 5, 1
