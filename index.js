import { scatterPlot } from "./scatterPlot.js";
import { networkPlot } from "./network.js";
import { getColours } from "./colours.js";
// import { networkPlot } from "./networkNoAnimate.js";

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load data from data.json
async function loadGraph(n) {
    const data = await d3.json("./data/emnity_graph.json");
    return data;
}

// Load data from plot_df.csv
async function loadEmbedding() {
    const data = await d3.csv("./data/plot_df.csv");

    // convert strings to numbers
    data.forEach((d) => {
        d.x_emb = +d.x_emb;
        d.y_emb = +d.y_emb;
        d.degree = +d.degree;
    });

    return data;
}

// Create div for legend
d3.select("body").append("div").attr("class", "legend");
const legend = d3
    .select(".legend")
    .append("svg")
    .attr("width", width / 5)
    .attr("height", height)
    .style("position", "absolute")
    .style("top", "20")
    .style("right", "0");

// Create a network plot from the data
async function main() {
    let t = 0;

    let goodBadColours = { 1: "#CA054D", 0: "#41b6c4" };
    let houseColours = {
        g: "#ae0001",
        s: "#2a623d",
        r: "#222f5b",
        h: "#f0c75e",
        m: "#372e29",
        n: "#bebebe",
    };
    let topFiveColours = {
        1: "#3B1C32",
        0: "#B96D40",
    };

    let degreeColours = getColours("viridis");

    function continuousColourLegend(colours, range, selection) {
        var grad = selection
            // .append("defs")
            .append("linearGradient")
            .attr("id", "grad")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "0%")
            .attr("y2", "100%");

        grad.selectAll("stop")
            .data(colours)
            .enter()
            .append("stop")
            .style("stop-color", function (d) {
                return d;
            })
            .attr("offset", function (d, i) {
                return 100 * (i / (colours.length - 1)) + "%";
            });

        // console.log(legend.node().getBoundingClientRect());
        // let legendWidth = legend.node().getBoundingClientRect().width;
        // let legendHeight = legend.node().getBoundingClientRect().height;
        selection
            .append("rect")
            .attr("width", 20)
            .attr("height", height / 2)
            .attr("x", 30)
            .attr("y", height / 4)
            // .attr("top", 0)
            // .attr("translate", `translate(${width / 5}, 20)`)
            .style("fill", "url(#grad)");

        selection
            .append("text")
            .text(range[1])
            .attr("x", 60)
            .attr("y", height / 4 + 10)
            .attr("font-size", "12px")
            .attr("fill", "#000");

        selection
            .append("text")
            .text(range[0])
            .attr("x", 60)
            .attr("y", (height / 4) * 3)
            .attr("font-size", "12px")
            .attr("fill", "#000");
    }

    // console.log(Object.values(goodBadColours));
    // continuousColourLegend(Object.values(goodBadColours), svg);

    const goodBadCategories = ["Good", "Bad"];
    const houseCategories = [
        "Gryffindor",
        "Slytherin",
        "Ravenclaw",
        "Hufflepuff",
        "Muggle",
        "None",
    ];
    const topFiveCategories = ["Not Main Character", "Main Character"];

    function fillLegend(colours, categories, continuous, legendTitle) {
        legend.selectAll("*").remove();

        const legendItems = legend
            .selectAll(".legend-item")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(30, ${40 + i * 20})`);

        if (continuous == false) {
            legend
                .append("text")
                .text(legendTitle)
                .attr("x", 30)
                .attr("y", 20)
                .attr("font-size", "16px")
                // .attr("font-weight", "bold")
                .attr("fill", "#000");

            legendItems
                .append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", (d, i) => Object.values(colours)[i]);

            legendItems
                .append("text")
                .text((d) => d)
                .attr("x", 15)
                .attr("y", 10);
        } else {
            legend
                .append("text")
                .text(legendTitle)
                .attr("x", 30)
                .attr("y", height / 4 - 20)
                .attr("font-size", "16px")
                // .attr("font-weight", "bold")
                .attr("fill", "#000");

            continuousColourLegend(colours, categories, legend);
            console.log("continuous legend");
        }
    }

    fillLegend(goodBadColours, goodBadCategories, false, "Good/Bad Characters");

    // get the dimensions of a selection
    // console.log(legend.node().getBoundingClientRect());

    const embeddingData = await loadEmbedding();
    const filteredData = embeddingData.filter((d) => d.t == t);

    let degreeValues = filteredData.map((d) => d.degree);
    console.log(d3.extent(degreeValues));
    // continuousColourLegend(degreeColours, d3.extent(degreeValues), legend);

    const scatter = scatterPlot()
        .width(width)
        .height(height)
        .data(filteredData)
        .margin({
            top: 30,
            right: width / 5,
            bottom: 100,
            // left: 60,
            left: (2 * width) / 5,
        })
        .size(5)
        .xValue((d) => d.x_emb)
        .yValue((d) => d.y_emb)
        .yAxisLabel("Embedding Dimension 2")
        .xAxisLabel("Embedding Dimension 1")
        .xDomain(d3.extent(embeddingData, (d) => d.x_emb))
        .yDomain(d3.extent(embeddingData, (d) => d.y_emb))
        .colours(goodBadColours)
        .colourValue((d) => d.good_bad);

    svg.call(scatter);

    const graphData = await loadGraph();
    const network = networkPlot()
        .width((2 * width) / 5)
        .height(height)
        .colourValue((d) => d.good_bad)
        .colours(goodBadColours)
        .data(graphData);
    svg.call(network);

    svg.call(network);

    let colours = [
        "#41b6c4",
        "#CA054D",
        "#3B1C32",
        "#B96D40",
        "#F9C846",
        "#6153CC",
    ];

    /////////////////////////////
    //// Interactiveness ////////
    /////////////////////////////

    // Define the tooltip element
    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute");

    function interactivity() {
        // svg.selectAll(".scatterPoints, .networkMarks")
        svg.selectAll("circle")
            .on("mouseover", function (event) {
                // console.log(this);

                // Show the tooltip with the data
                tooltip
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9)
                    .style("background-color", colours[0]);
                tooltip
                    .html(this.getAttribute("name"))
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");

                d3.select(this).attr("r", 10);

                d3.selectAll(".scatterPoints, .networkMarks")
                    .attr("fill", (d) => {
                        if (d.id == this.id) {
                            return colours[4];
                        } else {
                            return d.colour;
                            // return colours[1];
                        }
                    })
                    .attr("r", (d) => {
                        if (d.id == this.id) {
                            return 10;
                        } else {
                            return 5;
                        }
                    });
            })
            .on("mouseout", function (d) {
                // Hide the tooltip
                tooltip
                    .transition()
                    .duration(500)
                    .style("opacity", 0)
                    .on("end", function () {
                        // Disable mouse events on the tooltip div when it is hidden
                        tooltip.style("pointer-events", "none");
                    });

                d3.select(this).attr("r", 5).attr("stroke", "none");

                d3.selectAll(".scatterPoints, .networkMarks")
                    .attr("fill", (d) => {
                        return d.colour;
                    })
                    .attr("r", 5);
            });
    }

    interactivity();
    //////////////////////////////
    /////// Animation ////////////
    //////////////////////////////

    // place play and pause buttons at the top left of the page
    const mediaButtonContainer = d3
        .select("body")
        .append("div")
        .attr("class", "media-button-container");

    const playButton = mediaButtonContainer.append("button").text("Play");

    const pauseButton = mediaButtonContainer.append("button").text("Pause");

    const resetButton = mediaButtonContainer.append("button").text("Reset");

    let intervalId;
    playButton.on("click", () => {
        intervalId = setInterval(() => {
            if (t != 99) {
                t = t + 1;
            } else {
                clearInterval(intervalId);
                interactivity();
            }

            // remove all network class things
            // svg.selectAll(".network").remove();

            scatter.data(embeddingData.filter((d) => d.t == t));
            svg.call(scatter);

            // network.data(graphDataList[t]);
            // network.precomputedPositions(springPositionsList[t]);
            // svg.call(network);

            // Add the mouseover and mouseout events to the scatter plot circles
        }, 100);
    });

    pauseButton.on("click", () => {
        clearInterval(intervalId);

        interactivity();
    });

    resetButton.on("click", () => {
        t = 0;

        scatter.data(embeddingData.filter((d) => d.t == t));
        svg.call(scatter);

        svg.selectAll(".scatterPointsTrace").remove();

        // network.data(graphDataList[t]);
        // network.precomputedPositions(springPositionsList[t]);
        // svg.call(network);

        interactivity();
    });

    d3.select("body")
        .append("text")
        .text("Colour: ")
        .attr("class", "colour-text")
        .style("position", "absolute")
        .style("bottom", "20px")
        .style("left", `${width / 2}px`);

    const select = d3
        .select("body")
        .append("select")
        .attr("class", "colour-select")
        .style("position", "absolute")
        .style("bottom", "15px")
        .style("left", `${width / 2 + 55}px`)
        .style("padding", "5px 10px")
        .style("border", "none")
        .style("background-color", colours[0])
        .style("color", "#fff")
        .style("font-size", "16px")
        .style("cursor", "pointer");

    const options = select
        .selectAll("option")
        .data(["Good/Bad", "House", "Degree", "Main Characters"])
        .enter()
        .append("option")
        .text((d) => d)
        .style("background-color", colours[0])
        .style("color", "#fff");

    select.on("change", () => {
        const value = select.property("value");
        svg.selectAll("circle, .networkLinks").remove();
        if (value === "Degree") {
            scatter.colourValue((d) => d.degree);
            network.colourValue((d) => d.degree);
            fillLegend(degreeColours, d3.extent(degreeValues), true, "Degree");
        } else if (value === "House") {
            scatter.colours(houseColours);
            scatter.colourValue((d) => d.house);
            network.colours(houseColours);
            network.colourValue((d) => d.house);
            fillLegend(houseColours, houseCategories, false, "House");
        } else if (value === "Good/Bad") {
            scatter.colours(goodBadColours);
            scatter.colourValue((d) => d.good_bad);
            network.colours(goodBadColours);
            network.colourValue((d) => d.good_bad);
            fillLegend(
                goodBadColours,
                goodBadCategories,
                false,
                "Good/Bad Characters"
            );
        } else if (value === "Main Characters") {
            scatter.colours(topFiveColours);
            scatter.colourValue((d) => d.main);
            network.colours(topFiveColours, topFiveCategories);
            network.colourValue((d) => d.main);
            fillLegend(
                topFiveColours,
                topFiveCategories,
                false,
                "Main Characters"
            );
        }
        svg.call(scatter);
        svg.call(network);

        interactivity();
    });
}

main();
