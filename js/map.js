const metrics = {
  countries: 0,
  members: {
    total: 0,
    categories: {
      project_managers: 0,
      lab_managers: 0,
      surgeons: 0,
      soft_engineers: 0,
      assoc_profs: 0,
      principal_investigators: 0,
      pathologists: 0,
      physicians: 0,
      computational_biologists: 0,
      postdoctoral_associates: 0,
      graduate_students: 0,
      undergrads: 0,
      others: 0,
      research_scientists: 0,
      research_assistents: 0
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
      nodes = [],
      cluster = null,
      mapEl = document.querySelector('.map-center'),

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

        console.log(mapEl.getBoundingClientRect().top);

        tooltip
          .html(`<h1> ${d.ins} </h1>`)
          .style('left', (d3.event.x - mapEl.getBoundingClientRect().left) + 'px')
          .style('top', (d3.event.y - mapEl.getBoundingClientRect().top) + 'px')
      },

      /**
       * Mouseleave behaviour
       */
      mouseleave = (d) => {
        tooltip.style('opacity', 0)
      },

      createNodes = (data) => {

        data.forEach((d) => {

          if(d.pop > 0) {
            let node = {};

            node.lat= +d.lat;
            node.lng = +d.lng;
            node.r = +d.ins;
            node.ins = +d.ins;
            node.fill = '#172984';
            node.fillOpacity = .9;
            node.class = 'bubble';  
    
            nodes.push(node);
          }
        });

        cluster = d3.cluster()
          .nodes(nodes);
      },

      drawBubbles = (nodes, size) => {

        map.selectAll('circle')
          .data(nodes)
          .enter()
          .append('circle')
            .attr('cx', d => projection([d.lng, d.lat])[0])
            .attr('cy', d => projection([d.lng, d.lat])[1])
            .attr('r', d => size(d.r))
            .style('fill', d => d.fill)
            .attr('fill-opacity', d => d.fillOpacity)
            .attr('class', d => d.class)
          .on('mouseover', mouseover.bind(this))
          .on('mousemove', mousemove)
          .on('mouseleave', mouseleave);
      },

      /**
       * Quick-off logic
       */
      ready = (error, dataGeo, data) => {

        cacheDOM();
        computeMetrics(data);
        createNodes(data);

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
        drawBubbles(nodes, size);

        var zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on('zoom', function() {

            g.selectAll('path')
              .attr('transform', d3.event.transform);
            map.selectAll('circle')
              .attr('transform', d3.event.transform)
              .attr('r', function(d, i) {
                return size(+d.ins) / d3.event.transform.k;
              });

              cluster.stop();
              cluster.nodes(nodes)
                .alpha(1)
                .restart();
          });

        map.call(zoom);
      };

      d3.queue()
        .defer(d3.json, 'data/world_countries.json')  // Geo data
        .defer(d3.tsv, 'data/people.tsv') // People data
        .await(ready);

})();