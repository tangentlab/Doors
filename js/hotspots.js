/**
 * Hotspot System for A-Frame Video Sphere
 * Uses spherical coordinates (radius, azimuth, elevation) for consistent positioning
 */

/**
 * Spherical coordinates:
 * - radius: distance from center (consistent for all hotspots in layout)
 * - azimuth: horizontal rotation in degrees (0-360, where 0 = front, 90 = right, 180 = back, 270 = left)
 * - elevation: vertical rotation in degrees (-90 = bottom, 0 = center, 90 = top)
 */
const HOTSPOT_LAYOUTS = {
  entrance: {
    radius: 250,
    hotspots: [
      {
        id: 'entrance-door',
        azimuth: 0,
        elevation: 0,
        label: 'Main Door',
        color: '#FF6B6B',
        onClick: () => window.hotspotManager.changeVideo('funnel')
      },
      {
        id: 'entrance-sign',
        azimuth: 90,
        elevation: 0,
        label: 'Sign',
        color: '#4ECDC4',
        onClick: () => window.hotspotManager.changeVideo('heart')
      }
    ]
  },
  funnel: {
    radius: 250,
    hotspots: [
      {
        id: 'funnel-top',
        azimuth: 0,
        elevation: 60,
        label: 'Funnel Top',
        color: '#95E1D3',
        onClick: () => console.log('Funnel top clicked')
      },
      {
        id: 'funnel-bottom',
        azimuth: 180,
        elevation: -50,
        label: 'Funnel Bottom',
        color: '#F38181',
        onClick: () => console.log('Funnel bottom clicked')
      },
      {
        id: 'funnel-side',
        azimuth: 270,
        elevation: 0,
        label: 'Side View',
        color: '#AA96DA',
        onClick: () => console.log('Side view clicked')
      }
    ]
  },
  heart: {
    radius: 250,
    hotspots: [
      {
        id: 'heart-center',
        azimuth: 0,
        elevation: 1,
        label: 'Heart',
        color: '#FF69B4',
        onClick: () => console.log('Heart clicked')
      },
      {
        id: 'heart-left',
        azimuth: 270,
        elevation: 1,
        label: 'Left Side',
        color: '#FFB6C1',
        onClick: () => console.log('Left side clicked')
      },
      {
        id: 'heart-right',
        azimuth: 90,
        elevation: 0,
        label: 'Right Side',
        color: '#FFC0CB',
        onClick: () => console.log('Right side clicked')
      }
    ]
  },
  lookout: {
    radius: 250,
    hotspots: [
      {
        id: 'lookout-vista',
        azimuth: 0,
        elevation: 30,
        label: 'Vista',
        color: '#FFD700',
        onClick: () => console.log('Vista clicked')
      },
      {
        id: 'lookout-ground',
        azimuth: 90,
        elevation: -40,
        label: 'Ground',
        color: '#8B7355',
        onClick: () => console.log('Ground clicked')
      }
    ]
  },
  bottoms: {
    radius: 250,
    hotspots: [
      {
        id: 'bottoms-water',
        azimuth: 270,
        elevation: 0,
        label: 'Water',
        color: '#00CED1',
        onClick: () => console.log('Water clicked')
      },
      {
        id: 'bottoms-rocks',
        azimuth: 90,
        elevation: -30,
        label: 'Rocks',
        color: '#696969',
        onClick: () => console.log('Rocks clicked')
      }
    ]
  }
};

/**
 * Convert spherical coordinates to cartesian coordinates
 * @param {number} radius - distance from center
 * @param {number} azimuth - horizontal angle in degrees (0-360)
 * @param {number} elevation - vertical angle in degrees (-90 to 90)
 * @returns {object} cartesian coordinates {x, y, z}
 */
function sphericalToCartesian(radius, azimuth, elevation) {
  const azimuthRad = (azimuth * Math.PI) / 180;
  const elevationRad = (elevation * Math.PI) / 180;

  const x = radius * Math.cos(elevationRad) * Math.sin(azimuthRad);
  const y = radius * Math.sin(elevationRad);
  const z = -radius * Math.cos(elevationRad) * Math.cos(azimuthRad);

  return { x, y, z };
}

class HotspotManager {
  constructor(sceneSelector = 'a-scene') {
    this.scene = document.querySelector(sceneSelector);
    this.currentHotspots = [];
    this.hotspotsContainer = null;
    this.currentVideoId = 'entrance';
    this.init();
  }

  init() {
    // Create container for hotspots
    this.hotspotsContainer = document.createElement('a-entity');
    this.hotspotsContainer.id = 'hotspots-container';
    this.scene.appendChild(this.hotspotsContainer);

    // Setup event listener for video changes
    this.setupVideoChangeListener();
  }

  setupVideoChangeListener() {
    const videoSphere = document.querySelector('#video-sphere');
    if (!videoSphere) return;

    // Get initial video ID from src attribute
    const initialSrc = videoSphere.getAttribute('src');
    if (initialSrc) {
      this.currentVideoId = initialSrc.replace('#', '');
      this.loadHotspotsForVideo(this.currentVideoId);
      console.log(`HotspotManager: Loaded initial hotspots for "${this.currentVideoId}"`);
    }

    // Listen for video source changes
    const observer = new MutationObserver(() => {
      const currentSrc = videoSphere.getAttribute('src');
      if (currentSrc) {
        const videoId = currentSrc.replace('#', '');
        if (videoId !== this.currentVideoId) {
          this.currentVideoId = videoId;
          this.loadHotspotsForVideo(videoId);
          console.log(`HotspotManager: Changed hotspots to "${videoId}"`);
        }
      }
    });

    observer.observe(videoSphere, { attributes: true, attributeFilter: ['src'] });
  }

  loadHotspotsForVideo(videoId) {
    // Clear existing hotspots
    this.clearHotspots();

    // Get hotspots for this video
    const layout = HOTSPOT_LAYOUTS[videoId];
    if (!layout) return;

    const { radius, hotspots } = layout;

    // Create hotspots
    hotspots.forEach(hotspot => {
      this.createHotspot(hotspot, radius);
    });

    this.currentHotspots = hotspots;
    this.currentRadius = radius;
  }

  createHotspot(hotspotData, radius) {
    const hotspot = document.createElement('a-entity');
    hotspot.id = hotspotData.id;
    hotspot.setAttribute('class', 'hotspot');

    // Convert spherical to cartesian coordinates
    const cartesian = sphericalToCartesian(radius, hotspotData.azimuth, hotspotData.elevation);
    hotspot.setAttribute('position', `${cartesian.x} ${cartesian.y} ${cartesian.z}`);

    // Store spherical data on the element for easy access
    hotspot.hotspotData = hotspotData;
    hotspot.radius = radius;

    // Visual representation (circle)
    const visual = document.createElement('a-circle');
    visual.setAttribute('radius', '5');
    visual.setAttribute('color', hotspotData.color);
    visual.setAttribute('opacity', '0.8');
    visual.setAttribute('animation__scale-in', 'property: scale; from: 0 0 0; to: 1 1 1; duration: 300; easing: easeInOutQuad');

    // Hover effects
    visual.setAttribute('event-set__mouseenter', 'scale: 1.3 1.3 1.3; opacity: 1');
    visual.setAttribute('event-set__mouseleave', 'scale: 1 1 1; opacity: 0.8');

    // Click handler
    visual.addEventListener('click', (e) => {
      e.stopPropagation();
      hotspotData.onClick();
    });

    hotspot.appendChild(visual);

    // Optional: Add label
    if (hotspotData.label) {
      const label = document.createElement('a-text');
      label.setAttribute('value', hotspotData.label);
      label.setAttribute('position', '0 0.5 0');
      label.setAttribute('align', 'center');
      label.setAttribute('scale', '2 2 2');
      label.setAttribute('color', hotspotData.color);
      hotspot.appendChild(label);
    }

    this.hotspotsContainer.appendChild(hotspot);
  }

  clearHotspots() {
    this.hotspotsContainer.innerHTML = '';
    this.currentHotspots = [];
  }

  // Method to update hotspot position using spherical coordinates
  updateHotspotPosition(hotspotId, azimuth, elevation) {
    const hotspot = document.querySelector(`#${hotspotId}`);
    if (hotspot) {
      const cartesian = sphericalToCartesian(hotspot.radius, azimuth, elevation);
      hotspot.setAttribute('position', `${cartesian.x} ${cartesian.y} ${cartesian.z}`);

      // Update in data structure
      if (hotspot.hotspotData) {
        hotspot.hotspotData.azimuth = azimuth;
        hotspot.hotspotData.elevation = elevation;
      }
    }
  }

  // Method to update hotspot radius (distance from center)
  updateHotspotRadius(newRadius) {
    this.currentRadius = newRadius;
    const hotspots = this.hotspotsContainer.querySelectorAll('.hotspot');
    hotspots.forEach(hotspot => {
      if (hotspot.hotspotData) {
        const cartesian = sphericalToCartesian(newRadius, hotspot.hotspotData.azimuth, hotspot.hotspotData.elevation);
        hotspot.setAttribute('position', `${cartesian.x} ${cartesian.y} ${cartesian.z}`);
        hotspot.radius = newRadius;
      }
    });
  }

  // Method to add a new hotspot to current video
  addHotspot(hotspotData) {
    this.createHotspot(hotspotData, this.currentRadius);
    this.currentHotspots.push(hotspotData);
  }

  // Method to get all current hotspots with their spherical coordinates
  getHotspots() {
    return this.currentHotspots;
  }

  // Method to get hotspot by ID
  getHotspotById(hotspotId) {
    const hotspot = document.querySelector(`#${hotspotId}`);
    if (hotspot && hotspot.hotspotData) {
      return {
        ...hotspot.hotspotData,
        radius: hotspot.radius
      };
    }
    return null;
  }

  // Method to change video
  changeVideo(videoId) {
    const videoSphere = document.querySelector('#video-sphere');
    videoSphere.setAttribute('src', `#${videoId}`);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.hotspotManager = new HotspotManager('a-scene');
});
