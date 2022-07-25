//console.log('Hello from client side');
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY21vc3N0dWRpb3MiLCJhIjoiY2w1aDMxYzk4MDVmODNjbGlubHV6OHRxOCJ9.7ye3lCbmL7g17l599gQpLQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/cmosstudios/cl5h4hlyp000j14l9b58iiz3i',
    scrollZoom: false,
    // zoom: 4,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add maerker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates); //extend map bound to include current locations
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
