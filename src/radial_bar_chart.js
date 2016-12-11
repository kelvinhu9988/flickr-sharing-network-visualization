function radialBarChart() {

    // Configurable variables
    var margin = {top: 20, right: 20, bottom: 20, left: 20};
    var barHeight = 100;
    var reverseLayerOrder = false;
    var barColors = undefined;
    var capitalizeLabels = false;
    var domain = [0, 100];
    var tickValues = undefined;
    var colorLabels = false;
    var tickCircleValues = [];
    var transitionDuration = 1000;

    // Scales & other useful things
    var numBars = null;
    var barScale = null;
    var keys = null;
    var labelRadius = 0;


    function init(d) {
        barScale = d3.scaleLinear().domain(domain).range([0, barHeight]);

        keys = d3.map(d[0].data).keys();
        numBars = keys.length;

        // Radius of the key labels
        labelRadius = barHeight * 1.025;
    }

    function svgRotate(a) {
        return 'rotate(' + Number(a) + ')';
    }

    function svgTranslate(x, y) {
        return 'translate(' + Number(x) + ',' + Number(y) + ')';
    }

    function initChart(container) {
        var g = d3.select(container)
            .append('svg')
            .classed('svg-container', true)
            .style('height', 2.5 * barHeight + margin.top + margin.bottom + 'px')
            .append('g')
            .classed('radial-barchart', true)
            .attr('transform', svgTranslate($("#chart").width() / 3, margin.top + 1.25 * barHeight));

        // Concentric circles at specified tick values
        g.append('g')
            .classed('tick-circles', true)
            .selectAll('circle')
            .data(tickCircleValues)
            .enter()
            .append('circle')
            .attr('r', function(d) {return barScale(d);})
            .style('fill', 'none');

    }

    function renderOverlays(container) {
        var g = d3.select(container).select('svg g.radial-barchart');

        // Spokes
        var spokes = g.append('g')
            .classed('spokes', true)
            .selectAll('line')
            .data(keys);

        spokes.enter()
            .append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', -barHeight)
            .attr('transform', function(d, i) {
                return svgRotate(i * 360 / numBars);
            });

        spokes.exit().remove();

        // Axis
        var axisScale = d3.scaleLinear().domain(domain).range([0, -barHeight]);
        var axis = d3.axisRight().scale(axisScale);
        if (tickValues)
            axis.tickValues(tickValues).tickFormat(d3.format("d"));
        g.append('g')
            .classed('axis', true)
            .call(axis);

        // Outer circle
        g.append('circle')
            .attr('r', barHeight)
            .classed('outer', true)
            .style('fill', 'none');

        // Labels
        var labels = g.append('g')
            .classed('labels', true);

        labels.append('def')
            .append('path')
            .attr('id', 'label-path')
            .attr('d', 'm0 ' + -labelRadius + ' a' + labelRadius + ' ' + labelRadius + ' 0 1,1 -0.01 0');

        var labels_text = labels.selectAll('text')
            .data(keys)

        labels_text.enter()
            .append('text')
            .style('text-anchor', 'middle')
            .style('fill', function(d, i) {return colorLabels ? barColors[i % barColors.length] : null;})
            .append('textPath')
            .attr('xlink:href', '#label-path')
            .attr('startOffset', function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
            .text(function(d) {return capitalizeLabels ? d.toUpperCase() : d;});

        labels_text.exit().remove();
    }

    function updateOverlays(container) {
        var g = d3.select(container).select('svg g.radial-barchart');

        var labels = d3.select('#chart .labels');
        labels.selectAll('text').remove();

        var labels_text = labels.selectAll('text')
            .data(keys)

        labels_text.enter()
            .append('text')
            .style('text-anchor', 'middle')
            .style('fill', function(d, i) {
                return colorLabels ? barColors[i % barColors.length] : null;
            })
            .append('textPath')
            .attr('xlink:href', '#label-path')
            .attr('startOffset', function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
            .text(function(d) {
                return capitalizeLabels ? d.toUpperCase() : d;
            });

        labels_text.exit().remove();

        labels_text.transition().duration(transitionDuration);

        var axisObject = d3.select('#chart g.axis');
        var axisScale = d3.scaleLinear().domain(domain).range([0, -barHeight]);
        var axisFunction = d3.axisRight().scale(axisScale);
        if (tickValues)
            axisFunction.tickValues(tickValues).tickFormat(d3.format("d"));
        axisObject.call(axisFunction);

        var spokes = d3.select('#chart g.spokes');
        spokes.selectAll('line').remove();
        spokes.selectAll('line').data(keys)
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', -barHeight)
            .attr('transform', function(d, i) {
                return svgRotate(i * 360 / numBars);
            });
        spokes.exit().remove();

        barScale = d3.scaleLinear().domain(domain).range([0, barHeight]);
        var tick_circles = d3.select('#chart g.tick-circles');
        tick_circles.selectAll('circle').remove();
        tick_circles.selectAll('circle')
            .data(tickCircleValues)
            .enter()
            .append('circle')
            .attr('r', function(d) {return barScale(d);})
            .style('fill', 'none');
        tick_circles.exit().remove();
    }

function chart(selection) {
    selection.each(function(d) {

        init(d);

        if (reverseLayerOrder)
            d.reverse();

        var g = d3.select(this).select('svg g.radial-barchart');

        // check whether chart has already been created and return true if data is being updated
        var updated = g._groups["0"]["0"] != undefined;

        if (!updated)
        initChart(this);

        g = d3.select(this).select('svg g.radial-barchart');

        // Layer enter/exit/update
        var layers = g.selectAll('g.layer').data(d);

        layers.enter()
        .append('g')
        .attr('class', function(d, i) {
            return 'layer-' + i;
        })
        .classed('layer', true);

        layers.exit().remove();

        // Segment enter/exit/update
        var segments = layers.selectAll('path')
        .data(function(d) {
            var m = d3.map(d.data);
            return m.values();
        });

        segments.enter()
        .append('path')
        .style('fill', function(d, i) {
            return barColors[i % barColors.length];
        });

        segments.exit().remove();

        segments.transition()
        .duration(transitionDuration)
        .attr('d', d3.arc().innerRadius(0).outerRadius(or).startAngle(sa).endAngle(ea))

        if (!updated)
            renderOverlays(this);
        else
            updateOverlays(this);
    });
}

    /* Arc functions */
    or = function(d, i) {
        return barScale(d);
    }
    sa = function(d, i) {
        return (i * 2 * Math.PI) / numBars;
    }
    ea = function(d, i) {
        return ((i + 1) * 2 * Math.PI) / numBars;
    }

    /* Configuration of getters/setters */
    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.barHeight = function(_) {
        if (!arguments.length) return barHeight;
        barHeight = _;
        return chart;
    };

    chart.reverseLayerOrder = function(_) {
        if (!arguments.length) return reverseLayerOrder;
        reverseLayerOrder = _;
        return chart;
    };

    chart.barColors = function(_) {
        if (!arguments.length) return barColors;
        barColors = _;
        return chart;
    };

    chart.capitalizeLabels = function(_) {
        if (!arguments.length) return capitalizeLabels;
        capitalizeLabels = _;
        return chart;
    };

    chart.domain = function(_) {
        if (!arguments.length) return domain;
        domain = _;
        return chart;
    };

    chart.tickValues = function(_) {
        if (!arguments.length) return tickValues;
        tickValues = _;
        return chart;
    };

    chart.colorLabels = function(_) {
        if (!arguments.length) return colorLabels;
        colorLabels = _;
        return chart;
    };

    chart.tickCircleValues = function(_) {
        if (!arguments.length) return tickCircleValues;
        tickCircleValues = _;
        return chart;
    };

    chart.transitionDuration = function(_) {
        if (!arguments.length) return transitionDuration;
        transitionDuration = _;
        return chart;
    };

    return chart;
}
