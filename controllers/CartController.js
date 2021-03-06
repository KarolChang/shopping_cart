const db = require('../models')
const Cart = db.Cart
const CartItem = db.CartItem
const Product = db.Product

const cartController = {
  getCart: async (req, res, next) => {
    try {
      if (req.user) {
        const cart = await Cart.findOne({
          where: { UserId: req.user.id },
          include: 'cartProducts'
        })
        if (!cart) {
          return res.render('cart')
        }
        const totalPrice = cart.cartProducts.length > 0 ? cart.cartProducts.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b) : 0
        return res.render('cart', { cart: cart.toJSON(), totalPrice })
      } else {
        req.flash('warning_msg', '請先登入~')
        return res.redirect('/users/login')
      }
    } catch (e) {
      console.log(e)
      return next(e)
    }
  },
  postCart: async (req, res, next) => {
    try {
      // check product has inventory
      const addProduct = await Product.findByPk(req.body.productId)
      if (addProduct.inventory === 0) {
        req.flash('warning_msg', `商品Id:${req.body.productId} 已經沒有庫存了!`)
        return res.redirect('back')
      }
      // find cart or create
      let cart = {}
      if (req.user) {
        const [userCart] = await Cart.findOrCreate({
          where: {
            UserId: req.user.id || 0
          }
        })
        cart = userCart
      } else {
        const [userCart] = await Cart.findOrCreate({
          where: {
            id: req.session.cartId || 0
          },
          defaults: {
            UserId: 0
          }
        })
        cart = userCart
      }
      // find items in the cart or not
      const [product, created] = await CartItem.findOrCreate({
        where: {
          CartId: cart.id,
          ProductId: req.body.productId
        },
        defaults: {
          quantity: 1
        }
      })
      if (!created) {
        // check product quantity+1 > inventory or not
        if (product.quantity + 1 > addProduct.inventory) {
          req.flash('warning_msg', `商品Id:${req.body.productId} 庫存剩下${addProduct.inventory}件!`)
          return res.redirect('back')
        }
        product.quantity += 1
      }
      await product.save()
      // save cartId in session
      req.session.cartId = cart.id
      return res.status(200).redirect('back')
    } catch (e) {
      console.log(e)
      return next(e)
    }
  },
  addCartItem: async (req, res, next) => {
    try {
      // find cart
      const product = await CartItem.findByPk(req.params.productId)
      // find product inventory
      const addProduct = await Product.findByPk(product.ProductId)
      // check product quantity+1 > inventory or not
      if (product.quantity + 1 > addProduct.inventory) {
        req.flash('warning_msg', `商品Id:${product.ProductId} 庫存剩下${addProduct.inventory}件!`)
        return res.redirect('back')
      }
      await product.update({
        quantity: product.quantity + 1
      })
      return res.status(200).redirect('back')
    } catch (e) {
      console.log(e)
      return next(e)
    }
  },
  subCartItem: async (req, res, next) => {
    try {
      // find cart
      const product = await CartItem.findByPk(req.params.productId)
      await product.update({
        quantity: product.quantity - 1 ? product.quantity - 1 : 1
      })
      return res.status(200).redirect('back')
    } catch (e) {
      console.log(e)
      return next(e)
    }
  },
  deleteCartItem: async (req, res, next) => {
    try {
      // find cart
      const product = await CartItem.findByPk(req.params.productId)
      await product.destroy()
      return res.status(200).redirect('back')
    } catch (e) {
      console.log(e)
      return next(e)
    }
  }
}

module.exports = cartController
