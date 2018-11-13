if (!Raphael || !Raphael.tcharts) {
    throw new Error('tbar: tcharts and Raphael are required');
}
/**
 * @description Draws a grouped or standard barchart. Currently only supports horizontal bars.
 * @param {Array} data 1 or 2D array of numbers.
 * @param {Object} options merged with internal defaults object.
 */
Raphael.fn.tcharts_Bar = function (data, options) {
    var paper = this,
        tmeta = {}, // tCharts meta data
        meta = {},  // tchart_Bar meta data
        set = paper.set();
    options = $.extend(true, {}, Raphael.tcharts.defaults, options || {});
    if (options.groups.show) options.chart.gutter.gap = options.groups.gap / 2;
    if (!options.groups.show) options.groups.gap = 1;
    if (!options.yaxes.reserved_height) {
        options.yaxis.reserved_height = (Object.keys(options.groups.labels).length * options.groups.label_height) || 0;
    }
    /**
     * Validates tchart_Bar data input
     * TODO: Check if labels options match the number of groups and their size
     * @throws {TypeError}
     * @throws {RangeError}
     */
    var validate_input = function () {
        var valid = true;
        try {
            if (!$.isArray(data)) throw new TypeError('tchart_Bar: data must be an Array');
            if ($.isArray(data[0])) {
                if ($.isArray(data[0][0])) throw new TypeError('tchart_Bar: Nested groups not supported');
                if (!data[0].length) throw new TypeError('tchart_Bar: Empty dataset');
                data.reduce(function (acc, val, idx) {
                    if (idx === 0) return (acc = val.length) && acc;
                    if (acc !== val.length) throw new RangeError('tchart_Bar: Grouped datasets must be of the same size');
                    return acc;
                }, 0);
            }
            else if (typeof +data[0] !== 'number') throw new Error('tchart_Bar: Unsupported dataset');
        }
        catch (error) {
            valid = false;
            paper.tcharts__Error({message: options.chart.error.message});
        }
        return valid;
    };
    /**
     * Decorates meta object with properties needed for draw calculations.
     */
    var init_meta = function () {
        try {
            tmeta = paper.tcharts__Meta(data, options);
            meta.label_depth = Object.keys(options.groups.labels).length;
            // meta.bar_area_height is chart_area_height - any labels
            meta.bar_area_height = options.groups.labels.h1
               ? tmeta.chart_area_height - (meta.label_depth * options.groups.label_height)
               : tmeta.chart_area_height;
            paper.tcharts__Axes(data, options, meta.bar_area_height);
            meta.groups = {
                total: options.groups.total || ($.isArray(data[0]) ? data.length : 0),
                size: options.bars.stacked ? 1 : options.groups.size || ($.isArray(data[0]) ? data[0].length : 0)
            };
            /**
             * @description
             * meta.white_space is the addition of all horizontal white space.
             * This is needed to determin the space left for the bars.
             * @return {Number}
             */
            meta.white_space = (function () {
                var groups, bars, gutters;
                groups = meta.groups.size
                    ? (meta.groups.total - 1) * options.groups.gap
                    : 0;
                bars = (meta.groups.total * (meta.groups.size - 1)) * options.bars.gap;
                gutters = options.chart.gutter.gap * 2;
                return groups + bars + gutters;
            })();
            meta.bar_width = (function () {
                var width = Math.floor((tmeta.chart_area_width - meta.white_space) / tmeta.data_len);
                return options.bars.max_width < width ? options.bars.max_width : width;
            })();
            /**
             * @description
             * An array with the height of each bar
             * @return {Array}
             */
            meta.bar_height = (function () {
                var i = 0, arr = [], height;
                for (; i < tmeta.data_len; i++) {
                    height = Math.floor(tmeta.data[i] / (paper.tcharts__Axes.units[format_offset(i)]));
                    if (height < 2 && height > -1) height = 2;
                    if (height < 0 && height > -2) height = -2;
                    if (tmeta.data[i] === 0) height = 1;
                    // if (height < 0) height = height < 0 ? Math.abs(height) : height;
                    arr.push(height);
                }
                return arr;
            })();

            if (meta.bar_width < 1) throw new Error('tbar: no space for bars');
            meta.rounding_leftovers_width = tmeta.chart_area_width - ((meta.bar_width * tmeta.data_len) + meta.white_space);

            // Update options.groups.gap and options.chart.gutter.gap if there is additional white space available
            if (meta.rounding_leftovers_width && meta.groups.total) {
                (function () {
                    var units = meta.groups.total,
                        one_extra_space = Math.floor(meta.rounding_leftovers_width / units);
                    options.groups.gap += one_extra_space;
                    options.chart.gutter.gap += one_extra_space / 2;
                    meta.rounding_leftovers_width = meta.rounding_leftovers_width - (one_extra_space * units);
                })();
            }
            /**
             * @return {Array}
             * an Array that describes the level of vertical
             * indentation for each separator in a grouped bar chart
             * e.g. [2, 1, 2, 0, 2, 1, 2]
             */
            meta.group_nesting_array = (function () {
                var total_groups = meta.groups.total,
                    group, arr, i, ii, k;
                arr = new Array(total_groups).join(meta.label_depth).split('').map(parseFloat);
                for (group in options.groups.labels) {
                    group = options.groups.labels[group];
                    ii = i = ii
                        ? ii / group.length
                        : total_groups / group.length;
                    for (k = i - 1; k < total_groups - 1; k += i) --arr[k];
                }
                return arr.map(function (val) {
                    return val;
                });
            })();
            /**
             * @description
             * A 2d array of numbers, the height of each stack in each bar
             * @return {Array}
             */
            meta.stack_height = (function () {
                if (!options.bars.stacked) return false;
                return tmeta.original_data.reduce(function (acc, val, idx) {
                    var bar = val.reduce(function (a, v) {
                        var percentage = (v / tmeta.data[idx]) * 100;
                        a.push((meta.bar_height[idx] / 100) * percentage);
                        return a;
                    }, []);
                    acc.push(bar);
                    return acc;
                }, []);
            })();
            /**
             * @description
             * After rounding the positions and height of all stacks we need to offset
             * the y position by the difference
             * @return {Array} array of numbers, the difference in y offset for each stack
             */
            meta.rounding_leftovers_stacks_y = (function () {
                if (!meta.stack_height) return false;
                return tmeta.original_data.reduce(function (acc, val, idx) {
                    var leftover = 0;
                    meta.stack_height[idx].forEach(function (v) {
                        var init_height = Math.abs(v);
                        leftover += (init_height - Math.round(init_height));
                    });
                    acc.push(leftover);
                    return acc;
                }, []);
            })();
            /**
             * @description
             * The sort order of the stacks in a bar. They need to be grouped into negative and positive values
             * We save the sort order so we can assign colors and labels correctly
             * @return {Array}
             */
            meta.sort_order = (function () {
                if (!meta.stack_height) return;
                return meta.stack_height.reduce(function (acc, val, idx) {
                    var order = new Array(val.length + 1)
                        .join(0)
                        .split('')
                        .map(function (val, idx) {return idx;})
                        .sort(function (a, b) {
                            return val[a] < 0 && val[b] > 0;
                        });
                    acc.push(order);
                    return acc;
                }, []);
            })();
            /**
             * An array of Numbers. The x positions of bars
             */
            meta.xs_bars = (function () {
                var x, xs = [], gap;
                x = Math.floor(tmeta.x + (meta.rounding_leftovers_width / 2) + options.chart.gutter.gap);
                for (i = 0; i < tmeta.data_len; i++) {
                    if (meta.groups.size === 0) gap = options.bars.gap;
                    else gap = (i + 1) % meta.groups.size ? options.bars.gap : options.groups.gap;
                    xs.push(x);
                    x += meta.bar_width + gap;
                }
                return xs;
            })();
            /**
             * An array of Numbers. The x positions of group separators
             */
            meta.xs_separators = (function () {
                var i, x, xs = [];
                if (!(meta.groups.total && meta.label_depth)) return xs;
                for (i = x = 0; i < meta.groups.total - 1; i++) {
                    x = x
                        + (i ? 0 : tmeta.x)
                        + (i ? 0 : options.chart.gutter.gap)
                        + (i ? 0 : meta.rounding_leftovers_width / 2)
                        + (!i ? 0 : options.groups.gap / 2)
                        + (options.groups.gap / 2)
                        + (meta.groups.size - 1 * options.bars.gap)
                        + (meta.groups.size * meta.bar_width);
                    x = Math.floor(x) + 0.5;
                    xs.push(x);
                }
                return xs;
            })();
            /**
             * @description
             * An array of Numbers. The y positions of bars
             * @return {Array}
             */
            meta.ys_bars = (function () {
                var arr = [], i = 0, y, height, offset, negative_amount, negative_offset;
                for (; i < tmeta.data_len; i++) {
                    height = meta.bar_height[i];
                    offset = format_offset(i);
                    negative_amount = tmeta.negative_amount[i];
                    negative_offset = paper.tcharts__Axes.negative_offset[offset];
                    y = tmeta.y + tmeta.chart_area_height - height + negative_offset;
                    // For stacked bars y needs to be moved down by the sum of the negative values defined in axis units
                    if (options.bars.stacked && negative_amount) {
                        y = y + Math.abs(Math.floor(negative_amount / (paper.tcharts__Axes.units[offset])));
                    }
                    if (height < 0) y = Math.floor(tmeta.y + tmeta.chart_area_height + negative_offset);
                    arr.push(y);
                }
                return arr;
            })();
            return true;
        } catch (error) {
            paper.tcharts__Error({message: 'Not enough space available to render chart'});
            return false;
        }
    };
    /**
     *  Draw group header labels
     */
    var draw_labels = function () {
        var x_array = meta.xs_separators.slice(0),
            label_height = options.groups.label_height,
            k, i = 1, // itterators
            offset,   // number of separators to skip
            width,    // current group width
            value,    // value of label
            arr,      // current label array
            idx,      // current index
            kk,       // last k value (number of parent labels)
            x, y;
        x_array.push(tmeta.x + tmeta.chart_area_width - 0.5); // add the right axis position
        x_array.unshift(tmeta.x);                             // add the left axis position
        for (; i <= meta.label_depth; i++) {
            k = 0;
            y = tmeta.y + (label_height * (i - 1)) + (label_height / 2);
            arr = options.groups.labels['h' + i];
            offset = (meta.groups.total / (arr.length * (kk || 1)));
            for (; k < arr.length * (kk || 1); k++) {
                idx = Math.ceil((offset * k) + (offset / 2));
                width = (x_array[idx] - x_array[idx - 1 || 0]) * offset;
                value = arr[k % arr.length];
                x = x_array[idx] - (
                    offset % 2
                        ? (width / offset) / 2
                        : 0
                );
                paper.tcharts__Label({
                    x: x,
                    y: y,
                    value: value,
                    width: width - 10,
                    height: label_height,
                    color: options.label_color,
                    background_color: options.chart.label_background_color
                }).attr({title: value});
            }
            kk = options.groups.labels['h' + i].length * i;
        }
    };
    /**
     * Draw group separators
     */
    var draw_separators = function () {
        var spacing_arr = meta.group_nesting_array,
            yb = tmeta.chart_area_height + tmeta.y - 0.5,
            yt = options.canvas.padding.top - 0.5,
            i, x;
        meta.xs_separators.forEach(function (x, idx) {
            paper.path([
                'M', x, yt + spacing_arr[idx] * options.groups.label_height,
                'L', x, yb
            ]).attr(options.groups.separator_styles[spacing_arr[idx]]);
        });
    };
    /**
     * @param {Number} idx
     * @return {Number}
     */
    var format_offset = function (idx) {
        var offset = options.bars.format_offset;
        offset = offset < -1 ? offset + 1 : false;
        return idx % (offset || options.bars.formatters.length || options.yaxes.length);
    };
    /**
     * Draws bars
     */
    var draw_bars = function () {
        if (!paper.tcharts__Axes) throw new Error('tbar: tcharts__Axes must be run before draw_bars');
        var id = 0;
        var bar = function (height, y, i, k, order) {
            if (order === void 0) order = i;
            var wrap = options.bars.color_wrap,
                stacked = k !== void 0,
                bar, bar_options;
            bar_options = {
                fill: options.bars.colors[wrap ? order % wrap : order] || Raphael.getColor(),
                stroke: 'none'
            };
            (function () { // Assign links
                if (!options.links) return;
                var num_links = options.links.length,
                    stack_size = data[0].length,
                    link_index;
                link_index = options.bars.stacked && (num_links > stack_size && (num_links % stack_size === 0))
                    ? i + data[0].length * k
                    : i;
                if (options.links[link_index]) {
                    bar_options.href = options.links[link_index];
                    bar_options.target = 'blank';
                }
            })();
            bar = paper.rect(meta.xs_bars[stacked ? k : i], y, meta.bar_width, height).attr(bar_options);
            // We use the original data for stacked as the tmeta.data has been merged into single bars
            bar.value = stacked ? tmeta.original_data[k][order] : tmeta.data[i];
            bar.node.id = id;
            set.push(bar);
            id++;
        };
        var stacked = function (height, y, i) {
            var data = meta.stack_height[i],
                order = meta.sort_order[i];
            // Group negative and positive values
            data.sort(function (a, b) {return a < 0 && b > 0;});
            // offset whole bar by rounding differences
            y = y + meta.rounding_leftovers_stacks_y[i];
            // Draw each stacked bar
            data.forEach(function (val, idx) {
                var height = Math.round(Math.abs(val));
                bar(height, y, idx, i, order[idx]);
                y = y + height;
            });
        };
        (function () {
            var i = 0, xs = meta.xs_bars, height, y;
            for (; i < xs.length; i++) {
                height = Math.abs(meta.bar_height[i]);
                y = meta.ys_bars[i];
                if (options.bars.stacked) stacked(height, y, i);
                else bar(height, y, i);
            }
        })();
    };
    /**
     * Draw xaxis
     */
    var draw_xaxis = function () {
        var x, y, i, xs, len, offset_x, offset_y,
            bbox_before, bbox_after,
            label, value, width, space;
        space = tmeta.axes_reserved_space.bottom;
        if (!space) return;
        xs = meta.xs_bars;
        len = xs.length;
        y = tmeta.y + tmeta.chart_area_height;
        if (!(options.bars.axes_labels && options.bars.axes_labels.length)) return;
        for (i = 0; i < len; i++) {
            value = options.bars.axes_labels[i % options.bars.axes_labels.length];
            width = Raphael.tcharts.calculate_sas_triangle(space, options.xaxis.rotation, space);
            x = xs[i];
            label = paper.tcharts__Label({
                x: x,
                y: y,
                value: value,
                width: width - 10,
                background_color: options.xaxis.background_color,
                color: options.label_color
            });
            bbox_before = label.getBBox();
            label.attr({transform: ['r', options.xaxis.rotation]});
            bbox_after = label.getBBox();
            offset_x = options.xaxis.rotation < 1
                ? (meta.bar_width / 2) - (bbox_after.width / 2)
                : (meta.bar_width / 2) + (bbox_after.width / 2);
            offset_y = bbox_after.height / 2;
            label.attr({
                title: value,
                transform: [
                    'T', offset_x, offset_y,
                    'r', options.xaxis.rotation,
                            xs[i], y - (bbox_before.height / 2)
                ]
            });
        }
    };
    /**
     * Sets up hover interactivity
     */
    var animate = function () {
        if (!options.labels.show) return;
        var label, gap = 5;
        var stacked = function (id) {
            var index = Math.floor(id / tmeta.original_data[0].length),
                order = meta.sort_order[index];
            return {
                header: options.bars.labels[order[id % tmeta.original_data[0].length]],
                formatter: options.bars.formatters[0]
            };
        };
        var normal = function (id) {
            var labels = options.bars.labels;
            return {
                formatter: options.bars.formatters[format_offset(id)],
                offset: format_offset(id),
                header: labels && labels.length ? labels[id] : void 0
            };
        };
        set.forEach(function (val) {
            val.hover(
                function hover_in () {
                    var value = this.value, id = this.node.id, type, offset, header;
                    type = options.bars.stacked ? stacked(id) : normal(id);
                    header = type.header ? type.header + '\n' : '';
                    offset = type.offset || 0;
                    value = type.formatter
                        ? type.formatter(value, tmeta.min_axis_val[offset], tmeta.max_axis_val[offset], header)
                        : header + Raphael.tcharts.number_formatter(value, options.chart.number_format);
                    label = paper.tcharts__Label({
                        x: this.attrs.x + (this.attrs.width / 2),
                        y: this.attrs.y - gap,
                        value: value
                    }).attr([options.labels.background, options.labels.font]);
                    label.animate({transform: 'T0,' + - (label.getBBox().height / 2)}, 0);
                },
                function hover_out () {
                    label.remove();
                }
            );
        });
    };
    if (!validate_input()) return;
    if (!init_meta()) return;
    if (options.groups.show) draw_labels();
    if (options.groups.show) draw_separators();
    if (options.xaxis.show) draw_xaxis();
    draw_bars();
    animate();
};
