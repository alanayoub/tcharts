/* global Raphael */
'use strict';
if (!Raphael || !Raphael.tcharts) {
    throw new Error('tbar: tcharts and Raphael are required');
}
Raphael.tcharts.defaults = {
    axes: {
        full_width_stroke: '#eee',
        stroke: '#666'
    },
    bars: {
        axes_labels: [],
        colors: [
            '#4aa725', '#248ba7', '#244aa7', '#8124a7', '#a7244a', '#a74024', '#ffcc00', '#006666',
            '#098ff4', '#857f7f', '#f49d09', '#e3dbdb', '#2e2c2c', '#bf0000', '#d9f8c8', '#3d005a'
        ],
        color_wrap: 0,
        formatters: [],
        format_offset_type: 'fill',
        format_offset: 0,
        gap: 1,
        max_width: 100,
        labels: [], // labels for each bar
        stacked: false
    },
    canvas: {
        padding: {
            bottom: 10,
            left: 0,
            right: 0,
            top: 30
        }
    },
    chart: {
        axes_color: '#b2b2b2',
        error: {
            message: 'Oops, something seems to have gone wrong'
        },
        gutter: {
            gap: 20
        },
        label_background_color: 'transparent',
        number_format: 'en'
    },
    label_color: '#000',
    groups: {
        gap: 20,
        label_height: 40,
        labels: {}, // {h1: ['h1 label'], h2: ['h2 label']}
        separator_styles: [
            {stroke: '#ccc'},
            {stroke: '#ccc', 'stroke-dasharray': '--'},
            {stroke: '#ddd', 'stroke-dasharray': '-'},
            {stroke: '#ddd', 'stroke-dasharray': '--..'}
        ],
        show: false
    },
    labels: {
        background: {
            fill: '#000',
            opacity: 0.8
        },
        show: true,
        font: {
            fill: '#fff',
            'font-size' : 12
        },
        formatter: false
    },
    // The links array should either match the number of bars,
    // the number of stacks in a single bar, or the total
    // number of stacks in all bars
    links: [],
    xaxis: {
        background_color: 'none',
        color: '#000',
        gap: 5, // Leave a little bit of space for the labels or the will get truncated early
        labels: {
            truncate: '20' // percentage of chart height
        },
        rotation: 45,
        show: false
    },
    yaxes: [{
        data_offset: 1,
        data_offset_type: 'fill', // is implemented?
        data_start: 0,
        position: 'left',
        show: true,
        tick_formatter: false
    }],
    yaxis: {
        reserved_height: 0
    }
};
