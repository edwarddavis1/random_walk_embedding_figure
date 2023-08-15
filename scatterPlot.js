// We make this function /reusable/ such that it can be used for any dataset

export const scatterPlot = () => {
    let width;
    let height;
    let data;
    let margin;
    let size;
    let xValue;
    let yValue;
    let symbolValue;
    let colourValue;
    let xDomain;
    let yDomain;
    let yAxisLabel;
    let xAxisLabel;
    let colours = [
        "#41b6c4",
        "#CA054D",
        "#3B1C32",
        "#B96D40",
        "#F9C846",
        "#6153CC",
    ];

    const my = (selection) => {
        // console.log(data.length);
        // console.log(d3.extent(data, yValue));
        // console.log(d3.extent(data, xValue));

        const x = d3
            .scaleLinear()
            // .domain(d3.extent(data, xValue))
            // .domain([-1, 1])
            .domain(xDomain)
            .range([margin.left, width - margin.right]);

        const y = d3
            .scaleLinear()
            // .domain(d3.extent(data, yValue))
            // .domain([-1, 1])
            .domain(yDomain)
            .range([height - margin.bottom, margin.top]);

        const marks = data.map((d) => ({
            x: x(xValue(d)),
            y: y(yValue(d)),
            tau: d.tau,
            id: d.id,
            col: colours[d.tau],
        }));

        const myTransition = d3.transition().duration(500);

        const nodes = selection
            .selectAll("circle")
            .data(marks)
            .join(
                (enter) =>
                    enter
                        .append("circle")
                        .attr("r", 5)
                        .style("opacity", 0)
                        .attr("cx", (3 * width) / 4)
                        .attr("cy", height / 2)
                        .call((enter) =>
                            enter
                                .transition(myTransition)
                                .delay((d, i) => i * 1)
                        ),
                (update) =>
                    update.call((update) =>
                        update.transition(myTransition).delay((d, i) => i * 1)
                    )
            )
            .transition(myTransition)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            // id each circle with its id element
            .attr("id", (d) => d.id)
            .style("opacity", 1)
            .attr("r", size)
            // .attr("fill", (d) => (d.tau == 1 ? colours[0] : colours[1]));
            .attr("fill", (d) => d.col);

        // Add x and y axes
        selection
            .selectAll("g.x-axis")
            .data([null]) // just a single data point so that only one axis is created
            .join("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat(""));
        // Remove ticks and tick labels by setting tickSize to 0 and tickFormat to an empty string

        selection
            .selectAll("g.y-axis") // need to use class as we don't want the y-axis to erase the x-axis
            .data([null]) // just a single data point
            .join("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).tickFormat(""));
        // Remove ticks and tick labels by setting tickSize to 0 and tickFormat to an empty string

        // Y axis label:
        selection
            .selectAll(".yAxisLabel")
            .data([null])
            .join("text")
            .attr("text-anchor", "middle")
            .attr("x", margin.left - 20)
            .attr("y", height / 2 - margin.top)
            .attr("class", "yAxisLabel") // This ensures that multiple labels don't plot when animating
            .attr(
                "transform",
                `rotate(-90 ${margin.left - 20}, ${height / 2 - margin.top})`
            )
            .text(yAxisLabel);

        // X axis label:
        selection
            .selectAll(".xAxisLabel")
            .data([null])
            .join("text")
            .attr("text-anchor", "middle")
            .attr("x", margin.left + (width - margin.left - margin.right) / 2)
            .attr("y", margin.top + height - margin.top - margin.bottom + 20)
            .attr("class", "xAxisLabel") // This ensures that multiple labels don't plot when animating
            .text(xAxisLabel);

        // // Node highlighing on hover
        // d3.selectAll("circle")
        //     .on("mouseover", function (_) {
        //         d3.select(this)
        //             .attr("r", 10)
        //             .attr("stroke", "black")
        //             .attr("stroke-width", 2);
        //     })
        //     .on("mouseout", function (_) {
        //         d3.select(this).attr("r", 5).attr("stroke", "none");
        //     });

        // d3.selectAll("circle")
        //     .on("mouseover", function (_) {
        //         d3.select(this).attr("r", 10);

        //         d3.selectAll("circle")
        //             .attr("fill", (d) => {
        //                 if (d.id == this.id) {
        //                     return colours[4];
        //                 } else {
        //                     return d.tau == 1 ? colours[0] : colours[1];
        //                 }
        //             })
        //             .attr("r", (d) => {
        //                 if (d.id == this.id) {
        //                     return 10;
        //                 } else {
        //                     return 5;
        //                 }
        //             });
        //     })
        //     .on("mouseout", function (_) {
        //         d3.select(this).attr("r", 5).attr("stroke", "none");

        //         d3.selectAll("circle")
        //             .attr("fill", (d) => {
        //                 return d.tau == 1 ? colours[0] : colours[1];
        //             })
        //             .attr("r", 5);
        //     });
    };

    my.width = function (_) {
        return arguments.length ? ((width = +_), my) : width;
    };
    my.height = function (_) {
        return arguments.length ? ((height = +_), my) : height;
    };
    my.data = function (_) {
        return arguments.length ? ((data = _), my) : data;
    };
    my.margin = function (_) {
        return arguments.length ? ((margin = _), my) : margin;
    };
    my.size = function (_) {
        return arguments.length ? ((size = +_), my) : size;
    };
    my.xValue = function (_) {
        return arguments.length ? ((xValue = _), my) : xValue;
    };
    my.yValue = function (_) {
        return arguments.length ? ((yValue = _), my) : yValue;
    };
    my.symbolValue = function (_) {
        return arguments.length ? ((symbolValue = _), my) : symbolValue;
    };
    my.colourValue = function (_) {
        return arguments.length ? ((colourValue = _), my) : colourValue;
    };
    my.xDomain = function (_) {
        return arguments.length ? ((xDomain = _), my) : xDomain;
    };
    my.yDomain = function (_) {
        return arguments.length ? ((yDomain = _), my) : yDomain;
    };
    my.yAxisLabel = function (_) {
        return arguments.length ? ((yAxisLabel = _), my) : yAxisLabel;
    };
    my.xAxisLabel = function (_) {
        return arguments.length ? ((xAxisLabel = _), my) : xAxisLabel;
    };

    return my;
};
