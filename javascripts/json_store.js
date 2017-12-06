var app = (function($) {

  var app = $.sammy('#main', function() {
    this.use('Template');
    this.use('Session');

    this.around(function(callback) {
      var context = this;
      this.load('data/items.json')
          .then(function(items) {
            context.items = items;
          })
          .then(callback);
    });

    this.get('#/', function(context) {
      context.app.swap('');
      $.each(this.items, function(i, item) {
        context.render('templates/item.template', {id: i, item: item})
               .appendTo(context.$element());
      });
    });

    this.get('#/item/:id', function(context) {
      this.item = this.items[this.params['id']];
      if (!this.item) { return this.notFound(); }
      this.partial('templates/item_detail.template');
    });

    this.get('#/cart/', function(context) {
      this.partial('templates/cart.template') .then (
        function(){
        $.each(app.session("cart"), function(i, item){
          Object.assign(item, context.items[item.id]);
          context.render('templates/cart-item.template', item)
            .appendTo($('#cart-main'));
        })
      });
    });

    this.get('#/checkout/', function(context) {
      var vm = {}
      var cart = app.session("cart");
      vm.total = cart.reduce(function(acc, current) {
        Object.assign(current, context.items[current.id]);
        return acc += (current.price * current.quantity);
      },0);
      this.partial('templates/checkout.template', vm);
    });

    this.post('#/cart', function(context) {
      var item_id = this.params['item_id'];
      // fetch the current cart
      var cart  = this.session('cart', function() {
        return [];
      });

      var existing_item = null;
      $.each(cart, function(i, cart_item) {
        if (cart_item.id === item_id) {
          existing_item = cart_item;
        }
      })
      if (existing_item == null) {
        existing_item = { id: item_id, quantity: 0 }
        cart.push(existing_item);
      }

      existing_item.quantity += parseInt(this.params['quantity'], 10);     

      // store the cart
      this.session('cart', cart);
      this.trigger('update-cart');
    });

    this.bind('update-cart', function() {
      var sum = 0;
      $.each(this.session('cart') || [], function(id, cart_item) {
        sum += cart_item.quantity;
      });
      $('.cart-info')
          .find('.cart-items').text(sum).end()
          .animate({marginTop: '30px'})
          .animate({marginTop: '10px'});
    });

    this.bind('run', function() {
      // initialize the cart display
      this.trigger('update-cart');
    });

  });

  $(function() {
    app.run('#/');
  });

  return app;

})(jQuery);
