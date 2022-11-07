const metrics = {
  countries: 0,
  members: {
    total: 0,
    types: {
      pis: 100,
      ji: 12
    }
  },
  institutes: 0,
  publications: 118,
  bionetworks: 18,
  cells: 27328899
};

(function() {
  'use strict';
  
  let DOM = {},
      UI = {
        card: (title, value) => {
          let iconClass = null;

          switch (title) {
            case 'countries':
              iconClass = 'fa-globe';
              break;
            case 'members':
              iconClass = 'fa-users';
              break;
            case 'institutes':
              iconClass = 'fa-university';
              break;
            case 'publications':
              iconClass = 'fa-file-text';
              break;
            case 'bionetworks':
              iconClass = 'fa-sitemap';
              break;
            case 'cells':
              iconClass = 'fa-cubes';
              break;
            default:
              break;
          }

          let metrics = document.createElement('DIV'),
              metricsHTML = `
                <div class="metrics__header">
                    <i class="metrics__icon fa ${iconClass}"></i>
                    <h3 class="metrics__title">${title}</h3>
                </div>
                <div class="metrics__body">
                  <p class="metrics__value">${value}</p>
                </div>
              `;
          metrics.className = `metrics metrics--${title}`;
          metrics.innerHTML = metricsHTML;
          return metrics;
        }
      },
      width  = document.querySelector('.map-center').offsetWidth,
      height = document.querySelector('.map-center').offsetHeight,
      scale  = ( width < 1.75 * height ? width : height * 1.75)/6.275,

      map = d3.select('.map-center')
        .append('svg')
        .attr('width', width)
        .attr('height', height),

      g = map.append('g'),

      tooltip = d3.select('.map-center')
        .append('div')
        .attr('class', 'tooltip'),

      projection = d3.geoMercator()
        .center([5,25])          
        .scale(scale)                 
        .translate([ width/2.8, height/2.2 ]),

      /**
       * Cache DOM elements
       */
      cacheDOM = () => {
        DOM.dashboard = document.querySelector('.dashboard');
      },

      /**
       * Render dashboard UI
       */
      renderUI = () => {
        for(let key in metrics) {
          if(key === 'countries' || key === 'publications' || key === 'institutes' || key === 'cells') {
            DOM.dashboard.appendChild(UI.card(key, metrics[key].toLocaleString(undefined,{ minimumFractionDigits: 0 })));
          }
        }
      },

      /**
       * Find HCA metrics for display
       */
      computeMetrics = (data) => {  
        data.forEach((d) => {
          if(+d.pop !== 0) {
            metrics.countries++;
            metrics.members.total += +d.pop;
            metrics.institutes += +d.ins;
          }

          console.log(metrics);
        });

        renderUI();
      },

      /**
       * Mouseover behaviour
       */
      mouseover = () => {
        tooltip.style("opacity", 1)
      },
      
      /**
       * Mousemove behaviour
       */
      mousemove = (d) => {
        tooltip
          .html(`<h1> ${d.ins} </h1>`)
          .style('left', (d3.mouse(d3.event.currentTarget)[0]+10) + 'px')
          .style('top', (d3.mouse(d3.event.currentTarget)[1]) + 'px')
      },

      /**
       * Mouseleave behaviour
       */
      mouseleave = function(d) {
        tooltip.style('opacity', 0)
      },

      /**
       * Quick-off logic
       */
      ready = (error, dataGeo, data) => {

        cacheDOM();
        computeMetrics(data);

        let valueExtent = d3.extent(data, d => +d.ins),
            size = d3.scaleSqrt()
              .domain(valueExtent) 
              .range([ 1, 100]); 

        // Render the map
        g.selectAll('path')
          .data(dataGeo.features)
          .enter()
          .append('path')
          .attr('fill', '#90cef0')
          .attr('d', d3.geoPath()
          .projection(projection)
          )
          .style('stroke', 'none')
          .style('opacity', .3)

        // Add bubbles
        map.selectAll('circle')
          .data(
            data.sort((a, b) => {
                return +b - +a  
              })
              .filter((d, i) => {
                return d.pop > 0  // only show countries with members
              })
          )
          .enter()
          .append('circle')
            .attr('cx', d => projection([+d.lng, +d.lat])[0])
            .attr('cy', d => projection([+d.lng, +d.lat])[1])
            .attr('r', d => size(+d.ins))
            .style('fill', '#172984')
            .attr('fill-opacity', .9)
            .attr('class', 'bubble')
          .on('mouseover', mouseover.bind(this))
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave);

        var zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on('zoom', function() {
            g.selectAll('path')
              .attr('transform', d3.event.transform);
            map.selectAll('circle')
              .attr('transform', d3.event.transform);
          });

        map.call(zoom);
      };

      d3.queue()
        .defer(d3.json, 'data/world_countries.json')  // Geo data
        .defer(d3.tsv, 'data/people.tsv') // People data
        .await(ready);

})();