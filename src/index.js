/* global Raphael */
'use strict';
Raphael.tcharts = {
    /**
     *
     */
    calculate_axis_interval: function (data, axis, min, max, width, height) {
        var interval = (max - min) / (0.25 * Math.sqrt(axis === 'x' ? width : height)),
            dec = -Math.floor(Math.log(interval) / Math.LN10),
            magn = Math.pow(10, -dec),
            norm = interval / magn;
       switch (true) {
            case norm < 1.5 : interval = 1;   break;
            case norm < 2.25: interval = 2;   break;
            case norm < 3   : interval = 2.5; break;
            case norm < 7.5 : interval = 5;   break;
            default: interval = 10;
        }
        return interval * magn;
    },
    /*
     * TODO: add formatter
     * TODO: add ability to supply function
     */
    calculate_axis_ticks: function (data, axis, min, max, width, height) {
        var interval = this.calculate_axis_interval.apply(this, arguments),
            value = Number.NaN,
            start = interval * Math.floor(min / interval),
            ticks = [],
            i = 0;
        do {
            value = start + i++ * interval;
            ticks.push(value);
        } while (value < max);
        return ticks;
    },
    /**
     * Calculate the width of the longest label in an array of labels.
     * TODO: This is a very quick implementation that doesn't
     * optimize space and I'm assuming will only works 99% of the time
     * @param {Object} config
     */
    calculate_required_space: function (config) {
        var value, isnum, label, space, arr = [];
        if (!config.labels.length) return 0;
        if (!config.dimension) config.dimension = 'width';
        config.labels.forEach(function (val, idx) {
            var item;
            // Don't format strings
            if (typeof val === 'string') return arr.push(val);
            // Do default formatting
            item = [val, Raphael.tcharts.number_formatter(val, null, 2, true)];
            // Do custom formatting
            if (typeof config.formatter !== 'function') arr.push(item[1]);
            else {
                // Pass default formatted values to custom formatter
                item = config.formatter([item], config.min, config.max, config.interval);
                item.ticks.forEach(function (v, i) {
                    arr.push(v[1]);
                });
            }
        });
        value = arr.reduce(function (a, b) {
            return (a + '').length > (b + '').length ? a : b;
        });
        isnum = typeof value === 'number' ? true : false;
        value = (value+'').split('').reduce(function (acc, val) {
            return acc.push(val === ' ' ? ' ' : !isNaN(val) ? '0' : 'm') && acc;
        }, []).join('');
        label = config.paper.tcharts__Label({x: 50, y: 50, value: value});
        label.attr({transform: 'r' + config.rotation || 0});
        space = label.getBBox()[config.dimension];
        label.remove();
        return space;
    },
    /**
     * @param {Number} a side
     * @param {Number} B angle
     * @param {Number} c side
     * @return {Number} b side
     */
    calculate_sas_triangle: function (a, B, c) {
        return Math.sqrt(Math.pow(a, 2) + Math.pow(c, 2) - 2 * a * c * Math.cos(B / 180 * Math.PI));
    },
    /**
     * @param {Array} data
     * @param {Number} start
     * @param {Number|Array} skip if skip is an Array the data is filtered by these indicies exactly,
     * otherwise the Number is used as the offset
     * @return {Array} returns a filtered version of the data Array
     */
    filter_data: function (data, start, skip) {
        return skip.length
            ? skip.reduce(function (acc, val, idx) {
                  acc.push(data[val]);
                  return acc;
              }, [])
            : data
                .slice(start, data.length)
                .filter(function (val, idx, arr) {
                    return (idx/(skip + 1)) % 1 === 0;
                });
    },
    /**
     * Flatten a 2d array
     * @param {Array} array a 2 dimentional array
     * @returns {Array} the flattened array
     */
    flatten: function (array) {
        return Array.prototype.concat.apply([], array);
    },
    /**
     * @param {Number} number
     * @param {String} format
     * @param {Number} precision
     * @return {String}
     */
    number_formatter: function (number, format, precision, shorthand) {
        if (!shorthand) return Number(number).toLocaleString(format || 'en', {maximumSignificantDigits: precision || 10});
        var negative = number < 0,
            num = Math.abs(Number(number));
        var formatter = function (val) {
            if (val % 1 !== 0) val = parseFloat(val.toFixed(2));
            else val = Math.floor(val);
            return negative ? -val : val;
        };
        if (num >= 1.0e+12) return formatter(num / 1.0e+12) + ' tn';
        if (num >= 1.0e+9)  return formatter(num / 1.0e+9) + ' bn';
        if (num >= 1.0e+6)  return formatter(num / 1.0e+6) + ' m';
        if (num >= 1.0e+3)  return formatter(num / 1.0e+3) + ' k';
        return formatter(num);
    },
    /**
     * Default tick formatter
     */
    tick_formatter: function (ticks, min, max, interval) {
        if (!ticks.length) return Raphael.tcharts.number_formatter(ticks, null, 2, true);
        ticks.forEach(function (val, idx) {
            ticks[idx] = val.reduce(function (acc, val, idx) {
                acc.push(idx ? Raphael.tcharts.number_formatter(val, null, 2, true) : val);
                return acc;
            }, []);
        });
        return {
            ticks: ticks,
            min: min,
            max: max,
            interval: interval
        };
    }
};
/**
 *
 */
Raphael.fn.tcharts__Error = function (config) {
    var paper = this;
    paper.tcharts__Label({
        x: paper.width / 2,
        y: paper.height / 2,
        value: config.message
    });
};
/**
 * Generates usefull meta data about the chart container and the data supplied
 * @returns {Object}
 */
Raphael.fn.tcharts__Meta = function (data, options) {
    var paper = this,
        meta = {};
    meta.original_data = data;
    meta.data = (function () {
        if (!options.bars.stacked) return Raphael.tcharts.flatten(meta.original_data);
        // Add up all the values in each group, both positive and negative
        // to get the height of each stacked bar
        return meta.original_data.reduce(function (acc, val, idx) {
            acc.push(val.reduce(function (a, v, i) {
                a = a + Math.abs(v);
                return a;
            }, 0));
            return acc;
        }, []);
    })();
    /**
     * Arrays of positive and negative values. This separation is needed for stacked bars
     */
    meta.group_pos_neg = (function () {
        if (!meta.original_data[0].length) return;
        var pos = [], neg = [];
        meta.original_data.forEach(function (val, idx) {
            var p = 0, n = 0;
            val.forEach(function (v, i) {
                if (v > 0) p += v;
                else if (v < 0) n += v;
            });
            pos.push(p);
            neg.push(n);
        });
        return {
            positive: pos,
            negative: neg
        };
    })();
    /**
     * Add up all negative values for each group
     */
    meta.negative_amount = (function () {
        var arr = [];
        meta.original_data.forEach(function (val, idx) {
            var a = 0;
            if (!val.length) return;
            val.forEach(function (v, i) {
                if (v < 0) a = a + v;
            });
            arr.push(a);
        });
        return arr;
    })();
    meta.data_len = meta.data.length; // Number of bars or groups
    meta.canvas_width = paper.width;
    meta.canvas_height = paper.height;
    // We need to calculate the space required for labels before we can calculate how much space we
    // have for the chart. However we need to know how much space we have available for the labels in
    // order to generate them
    // This utility function describes what is happening
    var recalculatoratron = function (fun1, fun2, fun3) {
        fun1();      // dummy calculation run
        fun2(fun1);  // use dumb data then return calculations with better data
        fun3();      // continue
    };
    recalculatoratron(
        function () {
            /**
             * Create separate arrays of data for each axis
             */
            meta.data_arr = (function () {
                var arr = [];
                options.yaxes.forEach(function (axis) {
                    arr.push(
                        options.yaxes.length > 1
                            ? Raphael.tcharts.filter_data(meta.data, axis.data_start, axis.data_offset)
                            : meta.data
                    );
                });
                return arr;
            })();
            /**
             * We need to special case some values if all the data for an axis is zeros
             * @return {Array} array of booleans
             */
            meta.all_zeros = (function () {
                var arr = [];
                options.yaxes.forEach(function (axis, idx) {
                    arr.push(meta.data_arr[idx].every(function (val) {
                        return val === 0;
                    }));
                });
                return arr;
            })();
            /**
             * Array, max data values for each axis
             */
            meta.max_data_val = (function () {
                if (options.bars.stacked) return [Math.max.apply(null, meta.group_pos_neg.positive)];
                return meta.data_arr.reduce(function (acc, val, idx) {
                    acc.push(Math.max.apply(null, val));
                    return acc;
                }, []);
            })();
            /**
             * Array, min data values for each axis
             */
            meta.min_data_val = (function () {
                if (options.bars.stacked) return [Math.min.apply(null, meta.group_pos_neg.negative)];
                return meta.data_arr.reduce(function (acc, val, idx) {
                    var min = Math.min.apply(null, val);
                    if (min > 0) min = 0;
                    acc.push(min);
                    return acc;
                }, []);
            })();
            /**
             * A 2D array of Numbers. The yaxes ticks
             */
            meta.yaxes_data_values = (function () {
                var arr = [];
                options.yaxes.forEach(function (axis, idx) {
                    if (!axis.show) return;
                    if (meta.all_zeros[idx]) return arr.push([0, 1]);
                    var data_arr, axis_arr;
                    data_arr = options.yaxes.length > 1
                        ? Raphael.tcharts.filter_data(meta.data, axis.data_start, axis.data_offset)
                        : meta.data;
                    axis_arr = Raphael.tcharts.calculate_axis_ticks(
                        data_arr,
                        'y',
                        meta.min_data_val[idx],
                        meta.max_data_val[idx],
                        0, // not currently being used as there is no x axis ticks
                        (meta.chart_area_height || meta.canvas_height) - options.yaxis.reserved_height
                    );
                    arr.push(axis_arr);
                });
                return arr;
            })();
            /**
             * Array, max axis tick for each axis
             */
            meta.max_axis_val = meta.yaxes_data_values.reduce(function (acc, val, idx) {
                acc.push(meta.all_zeros[idx] ? 1 : Math.max.apply(null, val));
                return acc;
            }, []);
            /**
             * Array, min axis tick for each axis
             */
            meta.min_axis_val = meta.yaxes_data_values.reduce(function (acc, val, idx) {
                acc.push(meta.all_zeros[idx] ? 0 : Math.min.apply(null, val));
                return acc;
            }, []);
            /**
             * Array, interval value for each axis
             */
            meta.axes_interval = (function () {
                var view = this, data, axis, min, max, width, height;
                return meta.yaxes_data_values.reduce(function (acc, val, idx) {
                    data = val;
                    axis = 'y';
                    min = meta.min_data_val[idx];
                    max = meta.max_data_val[idx];
                    width = 0;
                    height = (meta.chart_area_height || meta.canvas_height) - options.yaxis.reserved_height;
                    acc.push(Raphael.tcharts.calculate_axis_interval(data, axis, min, max, width, height));
                    return acc;
                }, []);
            })();
        },
        function (recalculate) {
            /**
             * @return {Object} left, right and bottom properties are numeric values representing
             * the space that should be reserved around the chart for axis rendering
             */
            meta.axes_reserved_space = (function () {
                var calculate = Raphael.tcharts.calculate_required_space,
                    spacing = {left: 0, right: 0, bottom: 0},
                    xaxis = options.bars.axes_labels,
                    yaxes, config;
                options.yaxes.forEach(function (axis, idx) {
                    var data = meta.yaxes_data_values[idx];
                    yaxes = options.yaxes.length > 1
                        ? Raphael.tcharts.filter_data(data, axis.data_start, axis.data_offset)
                        : data;
                    config = {
                        paper: paper,
                        labels: yaxes,
                        formatter: axis.tick_formatter,
                        min: meta.min_axis_val[idx],
                        max: meta.max_axis_val[idx],
                        interval: meta.axes_interval[idx]
                    };
                    spacing[axis.position] = calculate(config);
                });
                if (options.xaxis.show && xaxis && xaxis.length) {
                    config.labels = xaxis;
                    config.formatter = null;
                    config.rotation = options.xaxis.rotation;
                    config.dimension = 'height';
                    spacing.bottom = (function () {
                        var space = calculate(config) + options.xaxis.gap,
                            percent = space && (space / meta.canvas_height) * 100,
                            truncate_percent = options.xaxis.labels.truncate;
                        return percent > truncate_percent
                            ? ((meta.canvas_height / 100) * truncate_percent)
                            : space;
                    })();
                }
                return spacing;
            })();
            meta.x = options.canvas.padding.left + meta.axes_reserved_space.left; // The starting x position for the chart
            meta.y = options.canvas.padding.top; // Ditto
            meta.chart_area_width = meta.canvas_width
                - (options.canvas.padding.left + options.canvas.padding.right)
                - (meta.axes_reserved_space.left + meta.axes_reserved_space.right);
            meta.chart_area_height = Math.round(
                meta.canvas_height
                    - (options.canvas.padding.top + options.canvas.padding.bottom)
                    - meta.axes_reserved_space.bottom / 2
            );
            meta.chart_bbox = {
                top: options.canvas.padding.top - 0.5,
                right: meta.x + meta.chart_area_width - 0.5,
                bottom: meta.chart_area_height + meta.y - 0.5,
                left: meta.x + 0.5
            };
            recalculate();
        },
        function () {
            meta.yaxes_data_values_formatted = (function () {
                var arr = meta.yaxes_data_values, result = [], min, max, interval;
                options.yaxes.forEach(function (axis, idx) {
                    var ticks = arr[idx], formatted;
                    ticks = ticks.map(function (val) {
                        return [val, Raphael.tcharts.number_formatter(val, null, 2, true)];
                    });
                    if (typeof axis.tick_formatter === 'function') {
                        min = meta.min_axis_val[idx];
                        max = meta.max_axis_val[idx];
                        interval = meta.axes_interval[idx];
                        formatted = axis.tick_formatter(ticks, min, max, interval);
                        if (formatted.min) meta.min_axis_val[idx] = formatted.min;
                        if (formatted.max) meta.max_axis_val[idx] = formatted.max;
                        if (formatted.interval) meta.axes_interval[idx] = formatted.interval;
                    }
                    result.push(formatted && formatted.ticks || ticks);
                });
                return result;
            })();
            /**
             * The range between the min values and the max value for each axis
             */
            meta.range = meta.yaxes_data_values.reduce(function (acc, val, idx) {
                acc.push(meta.max_axis_val[idx] - (meta.min_axis_val[idx] < 0 ? meta.min_axis_val[idx] : 0));
                return acc;
            }, []);
        }
    );
    paper.tmeta = meta;
    return meta;
};
