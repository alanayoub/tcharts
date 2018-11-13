var expect = chai.expect,
    assert = chai.assert;
describe('index.js', function () {
    describe('Raphael.tcharts.calculate_axis_interval', function () {
        it('Should return a number between min and max values', function () {
            var data = [729084730, 65946270, 412162660, 235923330, 547806449, 474578009],
                axis = 'y',
                min = 0,
                max = 729084730,
                width = 0,
                height = 300,
                result = Raphael.tcharts.calculate_axis_interval(data, axis, min, max, width, height);
            assert.typeOf(result, 'number');
            expect(result).to.be.above(min).and.to.be.below(max);
        });
    });
    describe('Raphael.tcharts.calculate_axis_ticks', function () {
        var data = [729084730, 65946270, 412162660, 235923330, 547806449, 474578009],
            axis = 'y',
            max = 729084730,
            width = 0,
            height = 300;
        it('Should return an Array starting at 0 and ending in a number greater than max', function () {
            expect(Raphael.tcharts.calculate_axis_ticks(data, axis, 0, max, width, height))
                .to.be.instanceof(Array)
                .to.have.length.above(1)
                .and.to.satisfy(function (arr) {return (arr[0] === 0) && (arr[arr.length - 1] > max);})
        });
        it('Array should start with negative number', function () {
            expect(Raphael.tcharts.calculate_axis_ticks(data, axis, -135923330, max, width, height))
                .to.satisfy(function (arr) {return (arr[0] < 0);});
        });
    });
    describe('Raphael.tcharts.calculate_required_space', function () {
        it('Should return a number', function () {
            var config = {
                paper: Raphael('raphael_temp'),
                labels: [729084730, 65946270, 412162660, 235923330, 547806449, 474578009],
                formatter: false,
                min: 0,
                max: 800000000,
                interval: 200000000
            };
            assert.typeOf(Raphael.tcharts.calculate_required_space(config), 'number');
        });
    });
    describe('Raphael.tcharts.calculate_sas_triangle', function () {
        it('Should return the number 5', function () {
            expect(Raphael.tcharts.calculate_sas_triangle(3, 90, 4)).to.equal(5);
        });
        it('Should return the number 76.53668647301795', function () {
            expect(Raphael.tcharts.calculate_sas_triangle(100, 45, 100)).to.equal(76.53668647301795);
        });
    });
    describe('Raphael.tcharts.filter_data', function () {
        var data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        it('Start at 0, skip 1: Should return [0, 2, 4, 6, 8, 10]', function () {
            expect(Raphael.tcharts.filter_data(data, 0, 1))
                .to.deep.equal([0, 2, 4, 6, 8, 10]);
        });
        it('Start at 1, skip 1: Should return [1, 3, 5, 7, 9]', function () {
            expect(Raphael.tcharts.filter_data(data, 1, 1))
                .to.deep.equal([1, 3, 5, 7, 9]);
        });
        it('Start at 0, skip 2: Should return [0, 3, 6, 9]', function () {
            expect(Raphael.tcharts.filter_data(data, 0, 2))
                .to.deep.equal([0, 3, 6, 9]);
        });
        it('Start at 2, skip 2: Should return [2, 5, 8]', function () {
            expect(Raphael.tcharts.filter_data(data, 2, 2))
                .to.deep.equal([2, 5, 8]);
        });
        it('Start at 0, skip 3: Should return [0, 4, 8]', function () {
            expect(Raphael.tcharts.filter_data(data, 0, 3))
                .to.deep.equal([0, 4, 8]);
        });
        it('Filter using array: Should return [1, 2]', function () {
            expect(Raphael.tcharts.filter_data(data, null, [1, 2]))
                .to.deep.equal([1, 2]);
        });
    });
    describe('Raphael.tcharts.flatten', function () {
        it('Should flatten a 2D array', function () {
            expect(Raphael.tcharts.flatten([1, 2, [3], 4])).to.deep.equal([1, 2, 3, 4]);
        });
    });
    describe('Raphael.tcharts.number_formatter', function () {
        it('Should convert to a String and use dot separation before the float', function () {
            expect(Raphael.tcharts.number_formatter(123456.7890, 'de-DE', 21)).to.equal('123.456,789');
        });
        it('Should convert to a String and use comma separation before the float', function () {
            expect(Raphael.tcharts.number_formatter(123456.7890, false, 21)).to.equal('123,456.789');
        });
        it('Should convert to a String and round to 6 significant digets', function () {
            expect(Raphael.tcharts.number_formatter(123456.7890, false, 6)).to.equal('123,457');
        });
    });
    // describe('Raphael.tcharts.tick_formatter', function () {
    //     // currently not being used
    // });
    describe('Raphael.tcharts.tcharts_Error', function () {
        it('Should take a message and display it using a Label', function () {
            Raphael('tmp').tcharts__Error({message: 'test'});
            $('#tmp').find('tspan').text() === 'test';
        });
    });
    //
    // Test tchart__Meta with simple bar data
    //
    describe('Raphael.fn.tcharts__Meta (Non grouped, non stacked)', function () {
        var paper = Raphael('raphael_temp'),
            data = [
                799084730, 65946270, 412162660, 235923330, 547806449, 474578009
            ],
            options = {},
            meta = paper.tcharts__Meta(data, Raphael.tcharts.defaults);
        it('Should return an object', function () {
            expect(meta).to.be.an('object');
        });
        it('Should have property "axes_interval" which is of type Array and has values which are positive integers', function () {
            expect(meta.axes_interval).to.be.instanceof(Array);
            expect(meta.axes_interval[0]).to.be.above(0);
        });
        it('Should have property "axes_reserved_space" which is of type Object has properties...', function () {
            expect(meta.axes_reserved_space).to.be.an('object');
            expect(meta.axes_reserved_space.right).to.be.above(-1);
            expect(meta.axes_reserved_space.bottom).to.be.above(-1);
            expect(meta.axes_reserved_space.left).to.be.above(-1);
        });
        it('Should have property "canvas_height" with a numberic value of 300', function () {
            expect(meta.canvas_height).to.equal(300);
        });
        it('Should have property "canvas_width" with a numberic value of 450', function () {
            expect(meta.canvas_width).to.equal(450);
        });
        it('Should have property "chart_area_height" who\'s value is a positive integer', function () {
            expect(meta.chart_area_height).to.be.above(0);
        });
        it('Should have property "chart_area_width" who\'s value is a positive integer', function () {
            expect(meta.chart_area_width).to.be.above(0);
        });
        it('Should have property "chart_bbox" which is an Object with properties "top", "right", "bottom", "left"', function () {
            expect(meta.chart_bbox).to.be.an('object');
            expect(meta.chart_bbox.top).to.be.above(-1);
            expect(meta.chart_bbox.right).to.be.above(-1);
            expect(meta.chart_bbox.bottom).to.be.above(-1);
            expect(meta.chart_bbox.left).to.be.above(-1);
        });
        it('Should have property "data" who\'s value is the same as the initial data value passed in (for non grouped)', function () {
            expect(meta.data).to.deep.equal(data);
        });
        it('Should have property "data_arr" which is a 2D array', function () {
            expect(meta.data_arr).to.deep.equal([data]);
        });
        it('Should have property "data_len" who\'s value is the length of the data array', function () {
            expect(meta.data_len).to.equal(data.length);
        });
        it('Should have property "max_axis_val" which should be bigger than the largest number in the data array', function () {
            expect(meta.max_axis_val[0]).to.be.above(799084730);
        });
        it('Should have property "max_data_val" which should be the largest number in the data array', function () {
            expect(meta.max_data_val[0]).to.equal(799084730);
        });
        it('Should have property "min_axis_val" which should equal 0', function () {
            expect(meta.min_axis_val[0]).to.equal(0);
        });
        it('Should have property "min_data_val" which should be the smallest number in the data array', function () {
            expect(meta.min_data_val[0]).to.be.below(1);
        });
        it('Should have property "original_data" which is the same data provided by the user', function () {
            expect(meta.original_data).to.deep.equal(data);
        });
        it('Should have property "range" which is of type Array, and index 0 should be a positive number', function () {
            expect(meta.range).to.be.instanceof(Array);
            expect(meta.range[0]).to.be.above(0);
        });
        it('Should have property "x" which is a number', function () {
            expect(meta.x).to.be.above(0);
        });
        it('Should have property "y" which is a number', function () {
            expect(meta.y).to.be.above(0);
        });
        it('Should have property "yaxes_data_values" which is an Array with a single Array of numbers as its first index', function () {
            expect(meta.yaxes_data_values).to.be.instanceof(Array);
            expect(meta.yaxes_data_values[0]).to.be.instanceof(Array);
            expect(meta.yaxes_data_values[0]).to.satisfy(function (arr) {
                return arr.every(function (num) {return num > -1;});
            });
        });
        it(
              'Should have property "yaxes_data_values_formatted" which is a formatted version of yaxes_data_values '
            + 'where each leaf has been replaced with an Array of two numbers', function () {
            expect(meta.yaxes_data_values_formatted).to.be.instanceof(Array);
            expect(meta.yaxes_data_values_formatted[0]).to.be.instanceof(Array);
            expect(meta.yaxes_data_values_formatted[0]).to.satisfy(function (arr) {
                return arr.every(function (arr) {
                    return Array.isArray(arr) && typeof arr[0] === 'number' && (typeof arr[1] === 'number' || typeof arr[1] === 'string');
                });
            });
        });
    });
    //
    // Test tchart__Meta with grouped data
    //
    describe('Raphael.fn.tcharts__Meta (Grouped)', function () {
        var paper = Raphael('raphael_temp'),
            data = [
                [65946270, 235923330],
                [547571871, 424601441],
                [234254353, 325453333],
                [493250327, 451133576]
            ],
            options = {},
            meta = paper.tcharts__Meta(data, Raphael.tcharts.defaults);
        it('Should return an object', function () {
            expect(meta).to.be.an('object');
        });
        it('Should have property "axes_interval" which is of type Array and has values which are positive integers', function () {
            expect(meta.axes_interval).to.be.instanceof(Array);
            expect(meta.axes_interval[0]).to.be.above(0);
        });
        it('Should have property "axes_reserved_space" which is of type Object has properties...', function () {
            expect(meta.axes_reserved_space).to.be.an('object');
            expect(meta.axes_reserved_space.right).to.be.above(-1);
            expect(meta.axes_reserved_space.bottom).to.be.above(-1);
            expect(meta.axes_reserved_space.left).to.be.above(-1);
        });
        it('Should have property "canvas_height" with a numberic value of 300', function () {
            expect(meta.canvas_height).to.equal(300);
        });
        it('Should have property "canvas_width" with a numberic value of 450', function () {
            expect(meta.canvas_width).to.equal(450);
        });
        it('Should have property "chart_area_height" who\'s value is a positive integer', function () {
            expect(meta.chart_area_height).to.be.above(0);
        });
        it('Should have property "chart_area_width" who\'s value is a positive integer', function () {
            expect(meta.chart_area_width).to.be.above(0);
        });
        it('Should have property "chart_bbox" which is an Object with properties "top", "right", "bottom", "left"', function () {
            expect(meta.chart_bbox).to.be.an('object');
            expect(meta.chart_bbox.top).to.be.above(-1);
            expect(meta.chart_bbox.right).to.be.above(-1);
            expect(meta.chart_bbox.bottom).to.be.above(-1);
            expect(meta.chart_bbox.left).to.be.above(-1);
        });
        it('Should have property "data". whos value should be a flattened version of the original data', function () {
            expect(meta.data).to.be.instanceof(Array);
            expect(meta.data[0]).to.equal(65946270);
            expect(meta.data).to.have.length.within(7, 9);
        });
        it('Should have property "data_arr" which is a 2D array based of off data', function () {
            expect(meta.data_arr).to.be.instanceof(Array);
            expect(meta.data_arr[0]).to.have.length.within(7, 9);
            expect(meta.data_arr[0][0]).to.equal(data[0][0]);
        });
        it('Should have property "data_len" who\'s value is the length of data_arr[0] array', function () {
            expect(meta.data_len).to.equal(meta.data_arr[0].length);
        });
        it('Should have property "max_axis_val" which should be bigger than the largest number in the data array', function () {
            expect(meta.max_axis_val[0]).to.be.above(547571871);
        });
        it('Should have property "max_data_val" which should be the largest number in the data array', function () {
            expect(meta.max_data_val[0]).to.equal(547571871);
        });
        it('Should have property "min_axis_val" which should equal 0', function () {
            expect(meta.min_axis_val[0]).to.equal(0);
        });
        it('Should have property "min_data_val" which should be the smallest number in the data array', function () {
            expect(meta.min_data_val[0]).to.be.below(1);
        });
        it('Should have property "original_data" which is the same data provided by the user', function () {
            expect(meta.original_data).to.deep.equal(data);
        });
        it('Should have property "range" which is of type Array, and index 0 should be a positive number', function () {
            expect(meta.range).to.be.instanceof(Array);
            expect(meta.range[0]).to.be.above(0);
        });
        it('Should have property "x" which is a number', function () {
            expect(meta.x).to.be.above(0);
        });
        it('Should have property "y" which is a number', function () {
            expect(meta.y).to.be.above(0);
        });
        it('Should have property "yaxes_data_values" which is an Array with a single Array of numbers as its first index', function () {
            expect(meta.yaxes_data_values).to.be.instanceof(Array);
            expect(meta.yaxes_data_values[0]).to.be.instanceof(Array);
            expect(meta.yaxes_data_values[0]).to.satisfy(function (arr) {
                return arr.every(function (num) {return num > -1;});
            });
        });
        it(
              'Should have property "yaxes_data_values_formatted" which is a formatted version of yaxes_data_values '
            + 'where each leaf has been replaced with an Array of two numbers', function () {
            expect(meta.yaxes_data_values_formatted).to.be.instanceof(Array);
            expect(meta.yaxes_data_values_formatted[0]).to.be.instanceof(Array);
            expect(meta.yaxes_data_values_formatted[0]).to.satisfy(function (arr) {
                return arr.every(function (arr) {
                    return Array.isArray(arr) && typeof arr[0] === 'number' && (typeof arr[1] === 'number' || typeof arr[1] === 'string');
                });
            });
        });
    });
});
