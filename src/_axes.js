/**
 * Create axes
 * @param {Object} data
 * @param {Object} options
 * @param {Number} height
 */
Raphael.fn.tcharts__Axes = function (data, options, height) {
    var paper = this,
        tmeta = Raphael.fn.tcharts__Meta.call(paper, data, options);
    height = height || tmeta.chart_area_height;
    paper.tcharts__Axes = {};
    // meta.units is a value used to calculate the scaled down height of each bar.
    paper.tcharts__Axes.units = options.yaxes.reduce(function (acc, val, idx) {
        acc.push(tmeta.range[idx] / height);
        return acc;
    }, []);
    paper.tcharts__Axes.negative_offset = options.yaxes.reduce(function (acc, val, idx) {
        acc.push(Math.floor(tmeta.min_axis_val[idx] < 0 ? tmeta.min_axis_val[idx] / paper.tcharts__Axes.units[idx] : 0));
        return acc;
    }, []);
    /**
     * Draw chart border
     */
    var draw_border = function () {
        var yaxes = paper.set(),
            xl = paper.tmeta.chart_bbox.left,
            xr = paper.tmeta.chart_bbox.right,
            yb = paper.tmeta.chart_bbox.bottom,
            yt = paper.tmeta.chart_bbox.top;
        yaxes.push(paper.path(['M', xl, yb, 'L', xr, yb])); // baseline
        yaxes.push(paper.path(['M', xl, yt, 'L', xl, yb])); // axis left
        yaxes.push(paper.path(['M', xr, yt, 'L', xr, yb])); // axis right
        yaxes.attr({stroke: options.chart.axes_color});
    };
    /**
     * Draw both yaxes
     */
    var draw_yaxes = function () {
        var arr = tmeta.yaxes_data_values_formatted,
            fullwidth = options.yaxes.length < 2;
        options.yaxes.forEach(function (axis, idx) {
            if (!axis.show) return;
            var ticks = arr[idx],
                position = axis.position,
                elms = paper.set(),
                xl = tmeta.chart_bbox.left,
                xr = tmeta.chart_bbox.right,
                yb = tmeta.chart_bbox.bottom;
            if (position === 'left') xr = xl + 5;
            if (position === 'right') xl = xr - 5;
            ticks.forEach(function (val) {
                var y = Math.floor(yb - (val[0] / paper.tcharts__Axes.units[idx])) + 0.5 + paper.tcharts__Axes.negative_offset[idx];
                elms.push(paper.path([
                    'M', fullwidth ? tmeta.chart_bbox.left : xl, y,
                    'L', fullwidth ? tmeta.chart_bbox.right : xr, y
                ]));
                paper.tcharts__Label({
                    x: xl + (position === 'left' ? -5 : 10),
                    y: y,
                    value: val[1],
                    align: position === 'left' ? 'right' : 'left',
                    color: options.label_color,
                    background_color: options.chart.label_background_color
                });
            });
            if (fullwidth) elms.attr({stroke: options.axes.full_width_stroke});
            else elms.attr({stroke: options.axes.stroke});
        });
    };
    draw_border();
    draw_yaxes();
};
