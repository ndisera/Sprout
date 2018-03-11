app.directive('progressCircle', function() {
    return {
        restrict: 'EA',
        scope: {
            percent: '@',
            text: '@',
        },
        template: '<svg></svg>',
        link: function(scope, elem, attrs) {
            elem.addClass('progress-circle');
            var strokeWidth = 25;
            var adjustFontSize = function(text, radius, stroke) {
                var padding = 5;
                var maxWidth = (radius * 2) - stroke - (padding * 2);
                var curFontSize = 20;
                text.attr({ 'font-size': curFontSize.toString() + 'px', });

                if(text.getBBox().width === 0) {
                    return;
                }

                if(text.getBBox().width < maxWidth) {
                    while(text.getBBox().width < maxWidth) {
                        curFontSize++;
                        text.attr({ 'font-size': curFontSize.toString() + 'px', });
                    }
                }

                else if(text.getBBox().width > maxWidth) {
                    while(text.getBBox().width > maxWidth) {
                        curFontSize--;
                        text.attr({ 'font-size': curFontSize.toString() + 'px', });
                    }
                }
                curFontSize--;
                text.attr({ 'font-size': curFontSize.toString() + 'px', });
            };

            // figure out how big I can make the svg
            var svg = elem.children();
            var svgDim = elem.height() < elem.width() ? elem.height() : elem.width();
            svg.height(svgDim);
            svg.width(svgDim);

            // make the svg and calculate the circles' dimensions
            var snap = Snap(svg[0]);
            var center = svgDim / 2;
            var radius = (svgDim / 2) - (strokeWidth / 2);
            var circumference = 2 * Math.PI * radius;

            // create the inner circle (the background stroke)
            var innerCircle = snap.circle(center, center, radius);
            innerCircle.addClass('progress-circle-background-border');
            innerCircle.attr({
                'fill': 'none',
                'stroke-width': strokeWidth.toString() + 'px',
            });

            // create the outer circle, the main circle that shows progress
            var outerCircle = snap.circle(center, center, radius);
            outerCircle.addClass('progress-circle-stroke');
            outerCircle.transform('r-90,' + center.toString() + ',' + center.toString());
            outerCircle.attr({
                'fill': 'none',
                'stroke-dasharray': '0' + ', ' + circumference.toString(),
                'stroke-width': strokeWidth.toString() + 'px',
            });
            var oldPercent = 0;

            // write the progress text
            var text = snap.text(center, center, '');
            text.attr({
                'text-anchor': 'middle',
                'alignment-baseline': 'middle',
            });

            // observe both percent and text and change them as needed
            var percentObserver = attrs.$observe('percent', function(val) {
                if(val === null || val === undefined || val === '' || isNaN(val)) {
                    oldPercent = 0;
                    outerCircle.attr({ 'stroke-dasharray': '0,' + circumference.toString(), });
                    return;
                }
                var newPercent = (val / 100) * circumference;
                Snap.animate(oldPercent, newPercent, function(val) {
                    outerCircle.attr({ 'stroke-dasharray': val.toString() + ',' + circumference.toString(), });
                }, 700, mina['easeinout']);
                oldPercent = newPercent;
            });

            var textObserver = attrs.$observe('text', function(val) {
                if(val === null || val === undefined || val === '') {
                    return;
                }
                text.attr({ 'text': val, });
                adjustFontSize(text, radius, strokeWidth);
            });

            elem.on('$destroy', function() {
                percentObserver();
                textObserver();
            });
        },
    };
});
