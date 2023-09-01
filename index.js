import { scatterPlot } from "./scatterPlot.js";
import { networkPlot } from "./network.js";
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

// Create a network plot from the data
async function main() {
    let t = 0;

    const embeddingData = await loadEmbedding();
    const filteredData = embeddingData.filter((d) => d.t == t);
    const scatter = scatterPlot()
        .width(width)
        .height(height)
        .data(filteredData)
        .margin({
            top: 30,
            right: 30,
            bottom: 100,
            // left: 60,
            left: width / 2,
        })
        .size(5)
        .xValue((d) => d.x_emb)
        .yValue((d) => d.y_emb)
        .yAxisLabel("Embedding Dimension 2")
        .xAxisLabel("Embedding Dimension 1")
        .xDomain(d3.extent(embeddingData, (d) => d.x_emb))
        .yDomain(d3.extent(embeddingData, (d) => d.y_emb))
        .colourValue((d) => d.good_bad);

    svg.call(scatter);

    const graphData = await loadGraph();
    const network = networkPlot()
        .width(width / 2)
        .height(height)
        .colourValue((d) => d.good_bad)
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
        svg.selectAll(".scatterPoints, .networkMarks")
            .on("mouseover", function (event) {
                // console.log(this.getAttribute("name"));

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
    const playButton = d3
        .select("body")
        .append("button")
        .text("Play")
        .style("position", "absolute")
        .style("bottom", "10px")
        .style("left", "60px");

    const pauseButton = d3
        .select("body")
        .append("button")
        .text("Pause")
        .style("position", "absolute")
        .style("bottom", "10px")
        .style("left", "140px");

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
}

main();
