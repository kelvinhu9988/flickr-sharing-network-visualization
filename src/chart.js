

function draw_chart() {
    var user_info_path = 'data/user_info.csv';
    d3.csv(user_info_path, function(error, user_info_data) {
        if (error) throw error;

        var data = [{data: {}}];
        var keys = null;
        var maxVal;
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0]);
        var html_message = "";
        function initialize_data(index) {
            keys = user_info_data[index]['photos-labels'].split('|');
            html_message = "<br><span class='emphasized'>User ID</span>: " + user_info_data[index]['id'] + "<br>" +
                            "<span class='emphasized'>Username</span>: " + user_info_data[index]['username'] + "<br>" +
                            "<span class='emphasized'>Real name</span>: " + user_info_data[index]['realname'] + "<br>" +
                            "<span class='emphasized'>Location</span>: " + user_info_data[index]['location'] + "<br>";

            for (var i = 0; i < keys.length; i++) {
                var key_to_count = keys[i];
                var counter = 0;
                for (var j = 0; j < keys.length; j++) {
                    if (key_to_count == keys[j])
                        counter++;
                }
                data[0].data[keys[i]] = counter;
            }

            var data_array = [];
            for (key in data[0].data) {
                data_array.push([key, data[0].data[key]]);
            }
            data_array.sort(function(a, b) {
                return a[1] - b[1];
            });
            data_array.reverse();

            data = [{data: {}}]
            var num_items_to_draw = data_array.length > 8 ? 8 : data_array.length;
            for (i = 0; i < num_items_to_draw; i++) {
                var item = data_array[i];
                data[0].data[item[0]] = item[1];
            }
            maxVal = Math.max.apply(null, d3.map(data[0].data).values());
            key = null
        }

        function update() {
            var index = Math.floor(Math.random() * 1565);
            initialize_data(index);
            var tickCircleValues = Array.apply(null, Array(maxVal-1)).map(function(d, i) { return i + 1; });
            var tickValues = Array.apply(null, Array(maxVal)).map(function(d, i) { return i + 1; });
            var barColors = ['#abf0ff', '#ffebad', '#81cfdb', '#ffcc5c','#518ed2', '#88d8b0', '#01b0f0', '#ff6f69'];

            var chart = radialBarChart()
                .barHeight(250)
                .reverseLayerOrder(true)
                .capitalizeLabels(true)
                .barColors(barColors)
                .domain([0, maxVal])
                .tickValues(tickValues)
                .tickCircleValues(tickCircleValues);
            d3.select("#user-info-container").html(html_message);
            d3.select('#chart')
                .datum(data)
                .call(chart);
            data = [{data: {}}];
        }

        d3.select('#update-chart')
            .on('click', update);

        update();
        update();
        update();
    });
}

draw_chart();
