/**
 * Create the label container
 * @param {Number} width
 * @param {Number} height
 * @param {String} color
 * @return {Object} Raphael svg element
 */
Raphael.el.tcharts__Label = function (width, height, color) {
    if (!this.paper) return;
    var bbox = this.getBBox(),
        paper = this.paper || this[0].paper,
        radius = Math.min(15, bbox.width, bbox.height) / 2,
        x = bbox.x - radius / 2,
        y = bbox.y - radius / 2;
    return paper.rect(x, y, bbox.width + radius, bbox.height + radius, 1)
        .attr({
            fill: color || '#fff',
            stroke: 'none',
            'clip-rect': [x, y, width, height].join(',')
        })
        .insertBefore(this.node ? this : this[0]);
};
/**
 * Creates the label text element
 * @param {Object} config
 */
Raphael.fn.tcharts__Label = function (config) {
    var set = this.set(),
        value = this.text(config.x, config.y, config.value),
        width = config.width,
        height = config.height,
        align;
    if (config.align === 'left') align = 'start';
    if (config.align === 'right') align = 'end';
    value.attr({
        'text-anchor': align,
        'font': '12px Arial, sans-serif',
        'fill': config.color || '#000'
    });
    if (width) value.fitText(width);
    return set.push(value.tcharts__Label(width, height, config.background_color), value);
};
