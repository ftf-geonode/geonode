'use strict';

(function(){
  angular.module('cart', [])
    .filter('title', function(){
      return function(value){
        return value.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
      };
    })
    .filter('default_if_blank', function(){
      return function(value, arg){
        return angular.isString(value) && value.length > 0 ? value : arg;
      };
    })
    .filter('trans', function(){
      return function(value){
        return value;
      };
    })
    .controller('CartList', function($scope, cart){
      $scope.cart = cart;
      $scope.layers_params = '';

      $scope.newMap = function(){
        var items = cart.getCart().items;
        var params = '';
        for(var i=0; i<items.length; i++){
          params += 'layer=' + items[i].detail_url.split('/')[2] +'&';
        }
        window.location = '/maps/new?' + params;
      };

      $scope.bulk_remove_submit = function($event){
        var items = cart.getCart().items;
        var selected_ids = items.map(function(x){return x['id'];});
        var message = $('#bulk_remove_message');
        if(selected_ids.length > 0)
        {
          console.log("selected_ids:", selected_ids);
          $.ajax(
           {
             type: "POST",
             url: $scope.api.layers.remove,
             data: {
               resources: selected_ids
             },
             success: function(data) {
               var d = JSON.parse(data);
               if(d.success == "ok")
               {
                 window.location.reload();
               }
               else
               {
                 message.find('.message').html('Could not remove the following layers.');
                 message.find('.extra_content').html(d.not_changed.join('</br>'));
                 message.addClass('alert-warning').removeClass('alert-success alert-danger hidden');
                 message.addClass('alert-danger').removeClass('alert-success alert-warning hidden');
               }
             },
             error: function(data){
               message.find('.message').html($.parseJSON(data).error);
               message.addClass('alert-danger').removeClass('alert-success alert-warning hidden');
             }
           }
          );
        }
        $event.preventDefault();
        return false;
      };

      $scope.bulk_perms_submit = function(){
        var items = cart.getCart().items;
        var permissions = permissionsString($('#permission_form'), 'base');
        var selected_ids = $.map(items, function(item){return item.id});
        var message = $('#bulk_perms_message');
        if(selected_ids.length == 0){
         message.find('.message').html('Please select at least one resource to set the permissions');
         message.addClass('alert-danger').removeClass('alert-success alert-warning hidden');
         return;
        }
        $.ajax(
         {
           type: "POST",
           url: "/security/bulk-permissions",
           data: {
             permissions: JSON.stringify(permissions),
             resources: selected_ids
           },
           success: function(data) {
             var not_changed = $.parseJSON(data).not_changed;
             if (not_changed.length > 0){
               message.find('.message').html('Permissions correctly registered, although the following resources were'+
                   ' skipped because you don\'t have the rights to edit their permissions:');
               message.find('.extra_content').html(not_changed.join('</br>'));
               message.addClass('alert-warning').removeClass('alert-success alert-danger hidden');
             }
             else{
               message.find('.message').html('Permissions correctly registered.');
               message.addClass('alert-success').removeClass('alert-warning alert-danger hidden');
             }
           },
           error: function(data){
             message.find('.message').html($.parseJSON(data).error);
             message.addClass('alert-danger').removeClass('alert-success alert-warning hidden');
           }
         }
        );
      };
    })

    .directive('resourceCart', [function(){
      return {
        restrict: 'EA',
        templateUrl: "/static/geonode/js/templates/cart.html",
        link: function($scope, $element){
          $scope.facetType = $element.attr("data-facet-type");
          $scope.isAuthenticated = $element.attr("data-is-authenticated") == "true";
          $scope.isSuperuser = $element.attr("data-is-superuser") == "true";
          $scope.api = {
            "layers": {
              "remove": $element.attr("data-api-layers-remove")
            }
          };
        }
      };
    }])

    .service('cart', function(){

      this.init = function(){
        this.$cart = {
          items: []
        };
      };

      this.getCart = function(){
        return this.$cart;
      }

      this.addItem = function(item){
        if(this.getItemById(item.id) === null){
          this.getCart().items.push(item);
        }
      }

      this.removeItem = function(item){
        if(this.getItemById(item.id) !== null){
          var cart = this.getCart();
          angular.forEach(cart.items, function(cart_item, index){
            if(cart_item.id === item.id){
              cart.items.splice(index, 1);
            }
          });
        }
      }

      this.toggleItem = function(item){
        if(this.getItemById(item.id) === null){
          this.addItem(item);
        }else{
          this.removeItem(item);
        }
      }

      this.getItemById = function (itemId) {
        var items = this.getCart().items;
        var the_item = null;
        angular.forEach(items, function(item){
          if(item.id === itemId){
            the_item = item;
          }
        });
        return the_item;
      }

      this.getFaClass = function(id){
        if(this.getItemById(id) === null){
          return 'fa-square-o';
        }else{
          return 'fa-check-square-o'
        }
      }
    })

    .run(['cart', function(cart){
      cart.init();
    }])
})();
