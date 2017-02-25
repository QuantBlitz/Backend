const combineStocks = (stocks) => {
  let symbols = []
  let output = []
  for (let i = 0; i < stocks.length; ++i) {
    let stock = stocks[i]
    if (symbols.indexOf(stock.symbol) == -1) {
      symbols.push(stock.symbol)
      output.push(stock)
    } else {
      const position = symbols.indexOf(stock.symbol)
      const totalShares = output[position].shares + stock.shares
      const totalOne = output[position].shares * output[position].price
      const totalTwo = stock.shares * stock.price
      const totalPrice = stock.shares < 0
        ? output[position].price
        : +((totalOne + totalTwo) / totalShares).toFixed(2)

      output[position] = Object.assign({}, output[position], {
        shares: totalShares,
        price: totalPrice
      })
    }
  }
  return output.filter(stock => stock.shares > 0)
}

module.exports = {
  combineStocks
}
