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
      const totalPrice = totalShares < 1 || stock.shares < 1
        ? output[position].price
        : +((totalOne + totalTwo) / totalShares)

      output[position] = Object.assign({}, output[position], {
        shares: totalShares,
        price: totalPrice
      })
    }
  }
  return output.filter(stock => stock.shares > 0)
}

const formatHistory = (data) =>
  Object.keys(data).map(x =>
    ({
      date: x,
      open: data[x]['1. open'],
      high: data[x]['2. high'],
      low: data[x]['3. low'],
      close: data[x]['4. close'],
      volume: data[x]['5. volume']
    })
)

module.exports = {
  combineStocks,
  formatHistory
}
