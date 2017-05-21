/**

 This is an external utility file that helps to manage displaying the data on the grid
 Used the "DRY(Don't repeat yourself)" principle here!!

 **/
(function (ng) {
  'use strict';
  ng.module('smart-table',[]);
})(angular);

(function (ng, undefined) {
  'use strict';
  ng.module('smart-table')
    .controller('stTableController', ['$scope', '$parse', '$filter', '$attrs', function StTableController($scope, $parse, $filter, $attrs) {
      var propertyName = $attrs.stTable;
      var displayGetter = $parse(propertyName);
      var displaySetter = displayGetter.assign;
      var safeGetter;
      var orderBy = $filter('orderBy');
      var filter = $filter('filter');
      var safeCopy = copyRefs(displayGetter($scope));
      var tableState = {
        sort: {},
        search: {},
        pagination: {
          start: 0
        }
      };
      var pipeAfterSafeCopy = true;
      var ctrl = this;
      var lastSelected;

      function copyRefs(src) {
        return [].concat(src);
      }

      function updateSafeCopy() {
        safeCopy = copyRefs(safeGetter($scope));
        if (pipeAfterSafeCopy === true) {
          ctrl.pipe();
        }
      }

      if ($attrs.stSafeSrc) {
        safeGetter = $parse($attrs.stSafeSrc);
        $scope.$watch(function () {
          var safeSrc = safeGetter($scope);
          return safeSrc ? safeSrc.length : 0;

        }, function (newValue, oldValue) {
          if (newValue !== oldValue) {
            updateSafeCopy()
          }
        });
        $scope.$watch(function () {
          return safeGetter($scope);
        }, function (newValue, oldValue) {
          if (newValue !== oldValue) {
            updateSafeCopy();
          }
        });
      }

      /**
       * sort the rows
       * @param {Function | String} predicate - function or string which will be used as predicate for the sorting
       * @param [reverse] - if you want to reverse the order
       */
      this.sortBy = function sortBy(predicate, reverse) {
        tableState.sort.predicate = predicate;
        tableState.sort.reverse = reverse === true;
        tableState.pagination.start = 0;
        this.pipe();
      };

      /**
       * search matching rows
       * @param {String} input - the input string
       * @param {String} [predicate] - the property name against you want to check the match, otherwise it will search on all properties
       */
      this.search = function search(input, predicate) {
        var predicateObject = tableState.search.predicateObject || {};
        var prop = predicate ? predicate : '$';
        predicateObject[prop] = input;
        // to avoid to filter out null value
        if (!input) {
          delete predicateObject[prop];
        }
        tableState.search.predicateObject = predicateObject;
        tableState.pagination.start = 0;
        this.pipe();
      };

      /**
       * this will chain the operations of sorting and filtering based on the current table state (sort options, filtering, ect)
       */
      this.pipe = function pipe() {
        var filtered = tableState.search.predicateObject ? filter(safeCopy, tableState.search.predicateObject) : safeCopy;
        filtered = orderBy(filtered, tableState.sort.predicate, tableState.sort.reverse);
        if (tableState.pagination.number !== undefined) {
          tableState.pagination.numberOfPages = filtered.length > 0 ? Math.ceil(filtered.length / tableState.pagination.number) : 1;
          filtered = filtered.slice(tableState.pagination.start, tableState.pagination.start + tableState.pagination.number);
        }
        displaySetter($scope, filtered);
      };

      /**
       * select a dataRow (it will add the attribute isSelected to the row object)
       * @param {Object} row - the row to select
       * @param {String} [mode] - "single" or "multiple" (multiple by default)
       */
      this.select = function select(row, mode) {
        var rows = safeCopy;
        var index = rows.indexOf(row);
        if (index !== -1) {
          if (mode === 'single') {
            row.isSelected = row.isSelected !== true;
            if (lastSelected) {
              lastSelected.isSelected = false;
            }
            lastSelected = row.isSelected === true ? row : undefined;
          } else {
            rows[index].isSelected = !rows[index].isSelected;
          }
        }
      };

      /**
       * take a slice of the current sorted/filtered collection (pagination)
       *
       * @param {Number} start - start index of the slice
       * @param {Number} number - the number of item in the slice
       */
      this.slice = function splice(start, number) {
        tableState.pagination.start = start;
        tableState.pagination.number = number;
        this.pipe();
      };

      /**
       * return the current state of the table
       * @returns {{sort: {}, search: {}, pagination: {start: number}}}
       */
      this.tableState = function getTableState() {
        return tableState;
      };

      /**
       * Use a different filter function than the angular FilterFilter
       * @param filterName the name under which the custom filter is registered
       */
      this.setFilterFunction = function setFilterFunction(filterName) {
        filter = $filter(filterName);
      };

      /**
       *User a different function than the angular orderBy
       * @param sortFunctionName the name under which the custom order function is registered
       */
      this.setSortFunction = function setSortFunction(sortFunctionName) {
        orderBy = $filter(sortFunctionName);
      };

      /**
       * Usually when the safe copy is updated the pipe function is called.
       * Calling this method will prevent it, which is something required when using a custom pipe function
       */
      this.preventPipeOnWatch = function preventPipe() {
        pipeAfterSafeCopy = false;
      };
    }])
    .directive('stTable', function () {
      return {
        restrict: 'A',
        controller: 'stTableController',
        link: function (scope, element, attr, ctrl) {
        }
      };
    });
})(angular);

(function (ng) {
  'use strict';
  ng.module('smart-table')
    .directive('stSearch', ['$timeout', function ($timeout) {
      return {
        replace: true,
        require: '^stTable',
        scope: {
          predicate: '=?stSearch'
        },
        link: function (scope, element, attr, ctrl) {
          var tableCtrl = ctrl;
          var promise = null;
          var throttle = attr.stDelay || 400;

          scope.$watch('predicate', function (newValue, oldValue) {
            if (newValue !== oldValue) {
              ctrl.tableState().search = {};
              tableCtrl.search(element[0].value || '', newValue);
            }
          });

          //table state -> view
          scope.$watch(function () {
            return ctrl.tableState().search
          }, function (newValue, oldValue) {
            var predicateExpression = scope.predicate || '$';
            if (newValue.predicateObject && newValue.predicateObject[predicateExpression] !== element[0].value) {
              element[0].value = newValue.predicateObject[predicateExpression] || '';
            }
          }, true);

          // view -> table state
          element.bind('input', function (evt) {
            evt = evt.originalEvent || evt;
            if (promise !== null) {
              $timeout.cancel(promise);
            }
            promise = $timeout(function () {
              tableCtrl.search(evt.target.value, scope.predicate || '');
              promise = null;
            }, throttle);
          });
        }
      }
    }])
})(angular);

(function (ng) {
  'use strict';
  ng.module('smart-table')
    .directive('stSelectRow', function () {
      return {
        restrict: 'A',
        require: '^stTable',
        scope: {
          row: '=stSelectRow'
        },
        link: function (scope, element, attr, ctrl) {
          var mode = attr.stSelectMode || 'single';
          element.bind('click', function () {
            scope.$apply(function () {
              ctrl.select(scope.row, mode);
            });
          });

          scope.$watch('row.isSelected', function (newValue, oldValue) {
            if (newValue === true) {
              element.addClass('st-selected');
            } else {
              element.removeClass('st-selected');
            }
          });
        }
      }
    });
})(angular);

(function (ng, undefined) {
  'use strict';
  ng.module('smart-table')
    .directive('stSort', ['$parse', function ($parse) {
      return {
        restrict: 'A',
        require: '^stTable',
        link: function (scope, element, attr, ctrl) {

          var predicate = attr.stSort;
          var getter = $parse(predicate);
          var index = 0;
          var classAscent = attr.stClassAscent || 'st-sort-ascent';
          var classDescent = attr.stClassDescent || 'st-sort-descent';
          var stateClasses = ['st-sort-natural', classAscent, classDescent];

          //view --> table state
          function sort() {
            index++;
            if (index % 3 === 0) {
              //manual reset
              index = 0;
              ctrl.tableState().sort = {};
              ctrl.tableState().pagination.start = 0;
              ctrl.pipe();
            } else {
              ctrl.sortBy(predicate, index % 2 === 0);
            }
          }

          if (ng.isFunction(getter(scope))) {
            predicate = getter(scope);
          }

          element.bind('click', function sortClick() {
            if (predicate) {
              scope.$apply(sort);
            }
          });

          if (attr.stSortDefault !== undefined) {
            index = attr.stSortDefault === 'reverse' ? 1 : 0;
            sort();
          }

          //table state --> view
          scope.$watch(function () {
            return ctrl.tableState().sort;
          }, function (newValue, oldValue) {
            if (newValue.predicate !== predicate) {
              index = 0;
              element
                .removeClass(classAscent)
                .removeClass(classDescent);
            } else {
              index = newValue.reverse === true ? 2 : 1;
              element
                .removeClass(stateClasses[(index + 1) % 2])
                .addClass(stateClasses[index]);
            }
          }, true);
        }
      };
    }])
})(angular);

(function (ng) {
  'use strict';
  ng.module('smart-table')
    .directive('stPagination', function () {
      return {
        restrict: 'EA',
        require: '^stTable',
        scope: {},
        template: '<div class="pagination" ng-if="pages.length >= 2"><ul class="pagination"><li ng-repeat="page in pages" ng-class="{active: page==currentPage}"><a ng-click="selectPage(page)">{{page}}</a></li></ul></div>',
        replace: true,
        link: function (scope, element, attrs, ctrl) {

          function isNotNan(value) {
            return !(typeof value === 'number' && isNaN(value));
          }

          var itemsByPage = isNotNan(parseInt(attrs.stItemsByPage, 10)) == true ? parseInt(attrs.stItemsByPage, 10) : 10;
          var displayedPages = isNotNan(parseInt(attrs.stDisplayedPages, 10)) == true ? parseInt(attrs.stDisplayedPages, 10) : 5;

          scope.currentPage = 1;
          scope.pages = [];

          //table state --> view
          scope.$watch(function () {
              return ctrl.tableState().pagination;
            },
            function () {
              var paginationState = ctrl.tableState().pagination;
              var start = 1;
              var end;
              var i;
              scope.currentPage = Math.floor(paginationState.start / paginationState.number) + 1;

              start = Math.max(start, scope.currentPage - Math.abs(Math.floor(displayedPages / 2)));
              end = start + displayedPages;

              if (end > paginationState.numberOfPages) {
                end = paginationState.numberOfPages + 1;
                start = Math.max(1, end - displayedPages);
              }

              scope.pages = [];
              scope.numPages = paginationState.numberOfPages;

              for (i = start; i < end; i++) {
                scope.pages.push(i);
              }


            }, true);

          //view -> table state
          scope.selectPage = function (page) {
            if (page > 0 && page <= scope.numPages) {
              ctrl.slice((page - 1) * itemsByPage, itemsByPage);
            }
          };

          //select the first page
          ctrl.slice(0, itemsByPage);
        }
      };
    });
})(angular);

(function (ng) {
  'use strict';
  ng.module('smart-table')
    .directive('stPipe', function () {
      return {
        require: 'stTable',
        scope: {
          stPipe: '='
        },
        link: {
          pre: function (scope, element, attrs, ctrl) {

            if (ng.isFunction(scope.stPipe)) {
              ctrl.preventPipeOnWatch();
              ctrl.pipe = ng.bind(ctrl, scope.stPipe, ctrl.tableState());
            }
          }
        }
      };
    });
})(angular);


RegExp.escape= function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

(function (undefined) {
  'use strict';

  var $;

  // to keep backwards compatibility
  if (typeof jQuery !== 'undefined' && jQuery) {
    $ = jQuery;
  } else {
    $ = {};
  }


  /**
   * jQuery.csv.defaults
   * Encapsulates the method paramater defaults for the CSV plugin module.
   */

  $.csv = {
    defaults: {
      separator:',',
      delimiter:'"',
      headers:true
    },

    hooks: {
      castToScalar: function(value, state) {
        var hasDot = /\./;
        if (isNaN(value)) {
          return value;
        } else {
          if (hasDot.test(value)) {
            return parseFloat(value);
          } else {
            var integer = parseInt(value);
            if(isNaN(integer)) {
              return null;
            } else {
              return integer;
            }
          }
        }
      }
    },

    parsers: {
      parse: function(csv, options) {
        // cache settings
        var separator = options.separator;
        var delimiter = options.delimiter;

        // set initial state if it's missing
        if(!options.state.rowNum) {
          options.state.rowNum = 1;
        }
        if(!options.state.colNum) {
          options.state.colNum = 1;
        }

        // clear initial state
        var data = [];
        var entry = [];
        var state = 0;
        var value = '';
        var exit = false;

        function endOfEntry() {
          // reset the state
          state = 0;
          value = '';

          // if 'start' hasn't been met, don't output
          if(options.start && options.state.rowNum < options.start) {
            // update global state
            entry = [];
            options.state.rowNum++;
            options.state.colNum = 1;
            return;
          }

          if(options.onParseEntry === undefined) {
            // onParseEntry hook not set
            data.push(entry);
          } else {
            var hookVal = options.onParseEntry(entry, options.state); // onParseEntry Hook
            // false skips the row, configurable through a hook
            if(hookVal !== false) {
              data.push(hookVal);
            }
          }
          //console.log('entry:' + entry);

          // cleanup
          entry = [];

          // if 'end' is met, stop parsing
          if(options.end && options.state.rowNum >= options.end) {
            exit = true;
          }

          // update global state
          options.state.rowNum++;
          options.state.colNum = 1;
        }

        function endOfValue() {
          if(options.onParseValue === undefined) {
            // onParseValue hook not set
            entry.push(value);
          } else {
            var hook = options.onParseValue(value, options.state); // onParseValue Hook
            // false skips the row, configurable through a hook
            if(hook !== false) {
              entry.push(hook);
            }
          }
          //console.log('value:' + value);
          // reset the state
          value = '';
          state = 0;
          // update global state
          options.state.colNum++;
        }

        // escape regex-specific control chars
        var escSeparator = RegExp.escape(separator);
        var escDelimiter = RegExp.escape(delimiter);

        // compile the regEx str using the custom delimiter/separator
        var match = /(D|S|\r\n|\n|\r|[^DS\r\n]+)/;
        var matchSrc = match.source;
        matchSrc = matchSrc.replace(/S/g, escSeparator);
        matchSrc = matchSrc.replace(/D/g, escDelimiter);
        match = new RegExp(matchSrc, 'gm');

        // put on your fancy pants...
        // process control chars individually, use look-ahead on non-control chars
        csv.replace(match, function (m0) {
          if(exit) {
            return;
          }
          switch (state) {
            // the start of a value
            case 0:
              // null last value
              if (m0 === separator) {
                value += '';
                endOfValue();
                break;
              }
              // opening delimiter
              if (m0 === delimiter) {
                state = 1;
                break;
              }
              // null last value
              if (/^(\r\n|\n|\r)$/.test(m0)) {
                endOfValue();
                endOfEntry();
                break;
              }
              // un-delimited value
              value += m0;
              state = 3;
              break;

            // delimited input
            case 1:
              // second delimiter? check further
              if (m0 === delimiter) {
                state = 2;
                break;
              }
              // delimited data
              value += m0;
              state = 1;
              break;

            // delimiter found in delimited input
            case 2:
              // escaped delimiter?
              if (m0 === delimiter) {
                value += m0;
                state = 1;
                break;
              }
              // null value
              if (m0 === separator) {
                endOfValue();
                break;
              }
              // end of entry
              if (/^(\r\n|\n|\r)$/.test(m0)) {
                endOfValue();
                endOfEntry();
                break;
              }
              // broken paser?
              throw new Error('CSVDataError: Illegal State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');

            // un-delimited input
            case 3:
              // null last value
              if (m0 === separator) {
                endOfValue();
                break;
              }
              // end of entry
              if (/^(\r\n|\n|\r)$/.test(m0)) {
                endOfValue();
                endOfEntry();
                break;
              }
              if (m0 === delimiter) {
                // non-compliant data
                throw new Error('CSVDataError: Illegal Quote [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
              }
              // broken parser?
              throw new Error('CSVDataError: Illegal Data [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
            default:
              // shenanigans
              throw new Error('CSVDataError: Unknown State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
          }
          //console.log('val:' + m0 + ' state:' + state);
        });

        // submit the last entry
        // ignore null last line
        if(entry.length !== 0) {
          endOfValue();
          endOfEntry();
        }

        return data;
      },

      // a csv-specific line splitter
      splitLines: function(csv, options) {
        // cache settings
        var separator = options.separator;
        var delimiter = options.delimiter;

        // set initial state if it's missing
        if(!options.state.rowNum) {
          options.state.rowNum = 1;
        }

        // clear initial state
        var entries = [];
        var state = 0;
        var entry = '';
        var exit = false;

        function endOfLine() {
          // reset the state
          state = 0;

          // if 'start' hasn't been met, don't output
          if(options.start && options.state.rowNum < options.start) {
            // update global state
            entry = '';
            options.state.rowNum++;
            return;
          }

          if(options.onParseEntry === undefined) {
            // onParseEntry hook not set
            entries.push(entry);
          } else {
            var hookVal = options.onParseEntry(entry, options.state); // onParseEntry Hook
            // false skips the row, configurable through a hook
            if(hookVal !== false) {
              entries.push(hookVal);
            }
          }

          // cleanup
          entry = '';

          // if 'end' is met, stop parsing
          if(options.end && options.state.rowNum >= options.end) {
            exit = true;
          }

          // update global state
          options.state.rowNum++;
        }

        // escape regex-specific control chars
        var escSeparator = RegExp.escape(separator);
        var escDelimiter = RegExp.escape(delimiter);

        // compile the regEx str using the custom delimiter/separator
        var match = /(D|S|\n|\r|[^DS\r\n]+)/;
        var matchSrc = match.source;
        matchSrc = matchSrc.replace(/S/g, escSeparator);
        matchSrc = matchSrc.replace(/D/g, escDelimiter);
        match = new RegExp(matchSrc, 'gm');

        // put on your fancy pants...
        // process control chars individually, use look-ahead on non-control chars
        csv.replace(match, function (m0) {
          if(exit) {
            return;
          }
          switch (state) {
            // the start of a value/entry
            case 0:
              // null value
              if (m0 === separator) {
                entry += m0;
                state = 0;
                break;
              }
              // opening delimiter
              if (m0 === delimiter) {
                entry += m0;
                state = 1;
                break;
              }
              // end of line
              if (m0 === '\n') {
                endOfLine();
                break;
              }
              // phantom carriage return
              if (/^\r$/.test(m0)) {
                break;
              }
              // un-delimit value
              entry += m0;
              state = 3;
              break;

            // delimited input
            case 1:
              // second delimiter? check further
              if (m0 === delimiter) {
                entry += m0;
                state = 2;
                break;
              }
              // delimited data
              entry += m0;
              state = 1;
              break;

            // delimiter found in delimited input
            case 2:
              // escaped delimiter?
              var prevChar = entry.substr(entry.length - 1);
              if (m0 === delimiter && prevChar === delimiter) {
                entry += m0;
                state = 1;
                break;
              }
              // end of value
              if (m0 === separator) {
                entry += m0;
                state = 0;
                break;
              }
              // end of line
              if (m0 === '\n') {
                endOfLine();
                break;
              }
              // phantom carriage return
              if (m0 === '\r') {
                break;
              }
              // broken paser?
              throw new Error('CSVDataError: Illegal state [Row:' + options.state.rowNum + ']');

            // un-delimited input
            case 3:
              // null value
              if (m0 === separator) {
                entry += m0;
                state = 0;
                break;
              }
              // end of line
              if (m0 === '\n') {
                endOfLine();
                break;
              }
              // phantom carriage return
              if (m0 === '\r') {
                break;
              }
              // non-compliant data
              if (m0 === delimiter) {
                throw new Error('CSVDataError: Illegal quote [Row:' + options.state.rowNum + ']');
              }
              // broken parser?
              throw new Error('CSVDataError: Illegal state [Row:' + options.state.rowNum + ']');
            default:
              // shenanigans
              throw new Error('CSVDataError: Unknown state [Row:' + options.state.rowNum + ']');
          }
          //console.log('val:' + m0 + ' state:' + state);
        });

        // submit the last entry
        // ignore null last line
        if(entry !== '') {
          endOfLine();
        }

        return entries;
      },

      // a csv entry parser
      parseEntry: function(csv, options) {
        // cache settings
        var separator = options.separator;
        var delimiter = options.delimiter;

        // set initial state if it's missing
        if(!options.state.rowNum) {
          options.state.rowNum = 1;
        }
        if(!options.state.colNum) {
          options.state.colNum = 1;
        }

        // clear initial state
        var entry = [];
        var state = 0;
        var value = '';

        function endOfValue() {
          if(options.onParseValue === undefined) {
            // onParseValue hook not set
            entry.push(value);
          } else {
            var hook = options.onParseValue(value, options.state); // onParseValue Hook
            // false skips the value, configurable through a hook
            if(hook !== false) {
              entry.push(hook);
            }
          }
          // reset the state
          value = '';
          state = 0;
          // update global state
          options.state.colNum++;
        }

        // checked for a cached regEx first
        if(!options.match) {
          // escape regex-specific control chars
          var escSeparator = RegExp.escape(separator);
          var escDelimiter = RegExp.escape(delimiter);

          // compile the regEx str using the custom delimiter/separator
          var match = /(D|S|\n|\r|[^DS\r\n]+)/;
          var matchSrc = match.source;
          matchSrc = matchSrc.replace(/S/g, escSeparator);
          matchSrc = matchSrc.replace(/D/g, escDelimiter);
          options.match = new RegExp(matchSrc, 'gm');
        }

        // put on your fancy pants...
        // process control chars individually, use look-ahead on non-control chars
        csv.replace(options.match, function (m0) {
          switch (state) {
            // the start of a value
            case 0:
              // null last value
              if (m0 === separator) {
                value += '';
                endOfValue();
                break;
              }
              // opening delimiter
              if (m0 === delimiter) {
                state = 1;
                break;
              }
              // skip un-delimited new-lines
              if (m0 === '\n' || m0 === '\r') {
                break;
              }
              // un-delimited value
              value += m0;
              state = 3;
              break;

            // delimited input
            case 1:
              // second delimiter? check further
              if (m0 === delimiter) {
                state = 2;
                break;
              }
              // delimited data
              value += m0;
              state = 1;
              break;

            // delimiter found in delimited input
            case 2:
              // escaped delimiter?
              if (m0 === delimiter) {
                value += m0;
                state = 1;
                break;
              }
              // null value
              if (m0 === separator) {
                endOfValue();
                break;
              }
              // skip un-delimited new-lines
              if (m0 === '\n' || m0 === '\r') {
                break;
              }
              // broken paser?
              throw new Error('CSVDataError: Illegal State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');

            // un-delimited input
            case 3:
              // null last value
              if (m0 === separator) {
                endOfValue();
                break;
              }
              // skip un-delimited new-lines
              if (m0 === '\n' || m0 === '\r') {
                break;
              }
              // non-compliant data
              if (m0 === delimiter) {
                throw new Error('CSVDataError: Illegal Quote [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
              }
              // broken parser?
              throw new Error('CSVDataError: Illegal Data [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
            default:
              // shenanigans
              throw new Error('CSVDataError: Unknown State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
          }
          //console.log('val:' + m0 + ' state:' + state);
        });

        // submit the last value
        endOfValue();

        return entry;
      }
    },

    helpers: {

      /**
       * $.csv.helpers.collectPropertyNames(objectsArray)
       * Collects all unique property names from all passed objects.
       *
       * @param {Array} objects Objects to collect properties from.
       *
       * Returns an array of property names (array will be empty,
       * if objects have no own properties).
       */
      collectPropertyNames: function (objects) {

        var o, propName, props = [];
        for (o in objects) {
          for (propName in objects[o]) {
            if ((objects[o].hasOwnProperty(propName)) &&
              (props.indexOf(propName) < 0) &&
              (typeof objects[o][propName] !== 'function')) {

              props.push(propName);
            }
          }
        }
        return props;
      }
    },

    /**
     * $.csv.toArray(csv)
     * Converts a CSV entry string to a javascript array.
     *
     * @param {Array} csv The string containing the CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     *
     * This method deals with simple CSV strings only. It's useful if you only
     * need to parse a single entry. If you need to parse more than one line,
     * use $.csv2Array instead.
     */
    toArray: function(csv, options, callback) {
      options = (options !== undefined ? options : {});
      var config = {};
      config.callback = ((callback !== undefined && typeof(callback) === 'function') ? callback : false);
      config.separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      config.delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      var state = (options.state !== undefined ? options.state : {});

      // setup
      options = {
        delimiter: config.delimiter,
        separator: config.separator,
        onParseEntry: options.onParseEntry,
        onParseValue: options.onParseValue,
        state: state
      };

      var entry = $.csv.parsers.parseEntry(csv, options);

      // push the value to a callback if one is defined
      if(!config.callback) {
        return entry;
      } else {
        config.callback('', entry);
      }
    },

    /**
     * $.csv.toArrays(csv)
     * Converts a CSV string to a javascript array.
     *
     * @param {String} csv The string containing the raw CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     *
     * This method deals with multi-line CSV. The breakdown is simple. The first
     * dimension of the array represents the line (or entry/row) while the second
     * dimension contains the values (or values/columns).
     */
    toArrays: function(csv, options, callback) {
      options = (options !== undefined ? options : {});
      var config = {};
      config.callback = ((callback !== undefined && typeof(callback) === 'function') ? callback : false);
      config.separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      config.delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;

      // setup
      var data = [];
      options = {
        delimiter: config.delimiter,
        separator: config.separator,
        onPreParse: options.onPreParse,
        onParseEntry: options.onParseEntry,
        onParseValue: options.onParseValue,
        onPostParse: options.onPostParse,
        start: options.start,
        end: options.end,
        state: {
          rowNum: 1,
          colNum: 1
        }
      };

      // onPreParse hook
      if(options.onPreParse !== undefined) {
        options.onPreParse(csv, options.state);
      }

      // parse the data
      data = $.csv.parsers.parse(csv, options);

      // onPostParse hook
      if(options.onPostParse !== undefined) {
        options.onPostParse(data, options.state);
      }

      // push the value to a callback if one is defined
      if(!config.callback) {
        return data;
      } else {
        config.callback('', data);
      }
    },

    /**
     * $.csv.toObjects(csv)
     * Converts a CSV string to a javascript object.
     * @param {String} csv The string containing the raw CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Boolean} [headers] Indicates whether the data contains a header line. Defaults to true.
     *
     * This method deals with multi-line CSV strings. Where the headers line is
     * used as the key for each value per entry.
     */
    toObjects: function(csv, options, callback) {
      options = (options !== undefined ? options : {});
      var config = {};
      config.callback = ((callback !== undefined && typeof(callback) === 'function') ? callback : false);
      config.separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      config.delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      config.headers = 'headers' in options ? options.headers : $.csv.defaults.headers;
      options.start = 'start' in options ? options.start : 1;

      // account for headers
      if(config.headers) {
        options.start++;
      }
      if(options.end && config.headers) {
        options.end++;
      }

      // setup
      var lines = [];
      var data = [];

      options = {
        delimiter: config.delimiter,
        separator: config.separator,
        onPreParse: options.onPreParse,
        onParseEntry: options.onParseEntry,
        onParseValue: options.onParseValue,
        onPostParse: options.onPostParse,
        start: options.start,
        end: options.end,
        state: {
          rowNum: 1,
          colNum: 1
        },
        match: false,
        transform: options.transform
      };

      // fetch the headers
      var headerOptions = {
        delimiter: config.delimiter,
        separator: config.separator,
        start: 1,
        end: 1,
        state: {
          rowNum:1,
          colNum:1
        }
      };

      // onPreParse hook
      if(options.onPreParse !== undefined) {
        options.onPreParse(csv, options.state);
      }

      // parse the csv
      var headerLine = $.csv.parsers.splitLines(csv, headerOptions);
      var headers = $.csv.toArray(headerLine[0], options);

      // fetch the data
      lines = $.csv.parsers.splitLines(csv, options);

      // reset the state for re-use
      options.state.colNum = 1;
      if(headers){
        options.state.rowNum = 2;
      } else {
        options.state.rowNum = 1;
      }

      // convert data to objects
      for(var i=0, len=lines.length; i<len; i++) {
        var entry = $.csv.toArray(lines[i], options);
        var object = {};
        for(var j=0; j <headers.length; j++) {
          object[headers[j]] = entry[j];
        }
        if (options.transform !== undefined) {
          data.push(options.transform.call(undefined, object));
        } else {
          data.push(object);
        }

        // update row state
        options.state.rowNum++;
      }

      // onPostParse hook
      if(options.onPostParse !== undefined) {
        options.onPostParse(data, options.state);
      }

      // push the value to a callback if one is defined
      if(!config.callback) {
        return data;
      } else {
        config.callback('', data);
      }
    },

    /**
     * $.csv.fromArrays(arrays)
     * Converts a javascript array to a CSV String.
     *
     * @param {Array} arrays An array containing an array of CSV entries.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     *
     * This method generates a CSV file from an array of arrays (representing entries).
     */
    fromArrays: function(arrays, options, callback) {
      options = (options !== undefined ? options : {});
      var config = {};
      config.callback = ((callback !== undefined && typeof(callback) === 'function') ? callback : false);
      config.separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      config.delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;

      var output = '',
        line,
        lineValues,
        i, j;

      for (i = 0; i < arrays.length; i++) {
        line = arrays[i];
        lineValues = [];
        for (j = 0; j < line.length; j++) {
          var strValue = (line[j] === undefined || line[j] === null) ? '' : line[j].toString();
          if (strValue.indexOf(config.delimiter) > -1) {
            strValue = strValue.replace(new RegExp(config.delimiter, 'g'), config.delimiter + config.delimiter);
          }

          var escMatcher = '\n|\r|S|D';
          escMatcher = escMatcher.replace('S', config.separator);
          escMatcher = escMatcher.replace('D', config.delimiter);

          if (strValue.search(escMatcher) > -1) {
            strValue = config.delimiter + strValue + config.delimiter;
          }
          lineValues.push(strValue);
        }
        output += lineValues.join(config.separator) + '\r\n';
      }

      // push the value to a callback if one is defined
      if(!config.callback) {
        return output;
      } else {
        config.callback('', output);
      }
    },

    /**
     * $.csv.fromObjects(objects)
     * Converts a javascript dictionary to a CSV string.
     *
     * @param {Object} objects An array of objects containing the data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     * @param {Character} [sortOrder] Sort order of columns (named after
     *   object properties). Use 'alpha' for alphabetic. Default is 'declare',
     *   which means, that properties will _probably_ appear in order they were
     *   declared for the object. But without any guarantee.
     * @param {Character or Array} [manualOrder] Manually order columns. May be
     * a strin in a same csv format as an output or an array of header names
     * (array items won't be parsed). All the properties, not present in
     * `manualOrder` will be appended to the end in accordance with `sortOrder`
     * option. So the `manualOrder` always takes preference, if present.
     *
     * This method generates a CSV file from an array of objects (name:value pairs).
     * It starts by detecting the headers and adding them as the first line of
     * the CSV file, followed by a structured dump of the data.
     */
    fromObjects: function(objects, options, callback) {
      options = (options !== undefined ? options : {});
      var config = {};
      config.callback = ((callback !== undefined && typeof(callback) === 'function') ? callback : false);
      config.separator = 'separator' in options ? options.separator : $.csv.defaults.separator;
      config.delimiter = 'delimiter' in options ? options.delimiter : $.csv.defaults.delimiter;
      config.headers = 'headers' in options ? options.headers : $.csv.defaults.headers;
      config.sortOrder = 'sortOrder' in options ? options.sortOrder : 'declare';
      config.manualOrder = 'manualOrder' in options ? options.manualOrder : [];
      config.transform = options.transform;

      if (typeof config.manualOrder === 'string') {
        config.manualOrder = $.csv.toArray(config.manualOrder, config);
      }

      if (config.transform !== undefined) {
        var origObjects = objects;
        objects = [];

        var i;
        for (i = 0; i < origObjects.length; i++) {
          objects.push(config.transform.call(undefined, origObjects[i]));
        }
      }

      var props = $.csv.helpers.collectPropertyNames(objects);

      if (config.sortOrder === 'alpha') {
        props.sort();
      } // else {} - nothing to do for 'declare' order

      if (config.manualOrder.length > 0) {

        var propsManual = [].concat(config.manualOrder);
        var p;
        for (p = 0; p < props.length; p++) {
          if (propsManual.indexOf( props[p] ) < 0) {
            propsManual.push( props[p] );
          }
        }
        props = propsManual;
      }

      var o, p, line, output = [], propName;
      if (config.headers) {
        output.push(props);
      }

      for (o = 0; o < objects.length; o++) {
        line = [];
        for (p = 0; p < props.length; p++) {
          propName = props[p];
          if (propName in objects[o] && typeof objects[o][propName] !== 'function') {
            line.push(objects[o][propName]);
          } else {
            line.push('');
          }
        }
        output.push(line);
      }

      // push the value to a callback if one is defined
      return $.csv.fromArrays(output, options, config.callback);
    }
  };

  // Maintenance code to maintain backward-compatibility
  // Will be removed in release 1.0
  $.csvEntry2Array = $.csv.toArray;
  $.csv2Array = $.csv.toArrays;
  $.csv2Dictionary = $.csv.toObjects;

  // CommonJS module is defined
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = $.csv;
  }

}).call( this );
