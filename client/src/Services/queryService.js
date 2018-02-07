app.factory("queryService", function () {

    function createInclude(elem) {
        return 'include[]=' + elem + '&';
    }

    function createExclude(elem) {
        return 'exclude[]=' + elem + '&';
    }

    function createFilter(elem) {
        return 'filter{' + elem.name + '}=' + elem.val + '&';
    }
    
    function createSort(elem) {
        return 'sort[]=' + elem + '&';
    }

    function reduceQuery(memo, val) {
        return memo + val;
    }
    
    return {
        /**
         * Create a url query string
         * @param {object} config - all query params to be applied
         *
         * example config
         * {
         *      include: ['this'],
         *      exclude: ['that'],
         *      filter: [
         *          { name: 'date.range', val: '2017-01-20' },
         *          { name: 'date.range', val: '2017-01-24' },
         *      ],
         *      sort: ['date'],
         * }
         *
         * produces:
         *
         * ?include[]=this&exclude[]=that&filter{date.range}=2017-01-20   \
         * &filter{date.range}=2017-01-24&sort[]=date
         */
        generateQuery: function (config) {
            if (config == null || config == undefined) { return ''; }

            var queries = [];
            queries.push(_.map(config.include, createInclude));
            queries.push(_.map(config.exclude, createExclude));
            queries.push(_.map(config.filter, createFilter));
            queries.push(_.map(config.sort, createSort));
            var queries_flat = _.flatten(queries);

            return _.reduce(queries_flat, reduceQuery, '?').slice(0, -1);
        },
    };
});
