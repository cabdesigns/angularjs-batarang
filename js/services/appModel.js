// Service for running code in the context of the application being debugged
angular.module('panelApp').factory('appModel', function (chromeExtension, appContext) {

  var _scopeTreeCache = {},
    _scopeTotalCache = 0,
    _scopeCache = {},
    _rootScopeCache = [];


  // clear cache on page refresh
  appContext.watchRefresh(function () {
    _scopeCache = {};
    _rootScopeCache = [];
  });

  function calcScopeTotal(tree) {
    _scopeTotalCache = 0;
    if(typeof tree !== 'undefined') {
      recurseScopeTotal(tree);
    }
  }

  function recurseScopeTotal(scope) {

    _scopeTotalCache++;

    if('children' in scope) {
      var i;
      var scopeChildren = scope.children.length;
      for(i = 0; i < scopeChildren; i++) {
        recurseScopeTotal(scope.children[i]);
      }
    }

  }

  return {
    getRootScopes: function (callback) {
      chromeExtension.eval(function (window) {
        if (!window.__ngDebug) {
          return;
        }
        return window.__ngDebug.getRootScopeIds();
      },
      function (data) {
        if (data) {
          _rootScopeCache = data;
        }
        callback(_rootScopeCache);
      });
    },

    // only runs callback if model has changed since last call
    getModel: function (id, callback) {
      if (!id) {
        return;
      }
      chromeExtension.eval(function (window, args) {
        return window.__ngDebug.getModel(args.id);
      }, {id: id}, function (tree) {
        if (tree) {
          _scopeCache[id] = tree;
        }
        callback(_scopeCache[id]);
      });
    },

    getScopeTree: function (id, callback) {
      if (!id) {
        return;
      }
      chromeExtension.eval(function (window, args) {
        return window.__ngDebug.getScopeTree(args.id);
      }, {id: id}, function (tree) {
        if (tree) {
          _scopeTreeCache[id] = tree;
          calcScopeTotal(tree);
        }
        callback(_scopeTreeCache[id]);
      });
    },

    getScopeTotal: function () {
      return _scopeTotalCache;
    },

    enableInspector: function (argument) {
      chromeExtension.eval(function (window, args) {
        return window.__ngDebug.enable();
      });
    }
  };
});
