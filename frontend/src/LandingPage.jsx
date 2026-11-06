
import React, { useState } from 'react';
import './landing.css';

export default function LandingPage({
  onLogin,
  onRegister,
  onStart
}) {
  const [demo, setDemo] = useState('maps');

  const exploreFeatures = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const demos = {
    maps: {
      title: 'Download maps before travelling',
      description:
        'Choose your destination, select a coverage radius and save the map for offline use.',
      icon: '🗺️',
      steps: ['Search destination', 'Choose up to 50 km radius', 'Download and save offline'],
      status: 'Map ready for offline use',
      visual: 'map'
    },
    places: {
      title: 'Discover nearby places',
      description:
        'Explore tourist places saved in your downloaded region and see their approximate distance from your current GPS position.',
      icon: '📍',
      steps: ['Use your GPS location', 'Explore saved nearby places', 'Check approximate distances'],
      status: 'Nearby places available',
      visual: 'places'
    },
    gps: {
      title: 'Track your journey',
      description:
        'Record your travel path using GPS and keep your journey history on your device.',
      icon: '🧭',
      steps: ['Start journey recording', 'Follow your GPS path', 'Save and review travel history'],
      status: 'Journey tracking preview',
      visual: 'gps'
    }
  };

  const current = demos[demo];

  return (
    <div className="roam-landing">

      {/* NAVIGATION */}
      <nav className="landing-nav">
        <a href="#top" className="landing-logo">
          <span className="logo-icon">✦</span>
          RoamOffline
        </a>

        <div className="landing-nav-links">
          <button onClick={exploreFeatures}>Features</button>
          <button onClick={onLogin}>Login</button>
          <button
            className="nav-register"
            onClick={onRegister}
          >
            Register
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section" id="top">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-tag">
            YOUR ADVENTURE, WITHOUT LIMITS
          </div>

          <h1>
            Explore More.
            <span>Even Without Internet.</span>
          </h1>

          <p className="hero-description">
            Discover beautiful destinations, download maps before
            travelling, find nearby places and track your journey.
            Adventure doesn't have to stop when the network does.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-hero-btn"
              onClick={onStart}
            >
              Start Your Journey <span>→</span>
            </button>

            <button
              className="secondary-hero-btn"
              onClick={exploreFeatures}
            >
              Explore Features
            </button>
          </div>

          <div className="hero-highlights">
            <span>✓ Download maps before your trip</span>
            <span>✓ Explore remote destinations</span>
            <span>✓ Track your journey</span>
          </div>
        </div>

        <div className="hero-bottom-label">
          DISCOVER WITHOUT LIMITS
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="intro-section">
        <div className="section-label">TRAVEL WITHOUT BOUNDARIES</div>

        <h2>
          Your journey shouldn't depend on
          <span> an internet connection.</span>
        </h2>

        <p>
          RoamOffline helps travellers prepare for destinations where
          network connectivity may be limited. Download your map in
          advance, explore saved nearby places and record your journey
          using GPS.
        </p>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <div className="section-label">WHAT YOU CAN DO</div>
          <h2>Everything you need for your adventure</h2>
          <p>
            Explore the main features of RoamOffline.
          </p>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon green-icon">🗺️</div>
            <h3>Offline Map Downloads</h3>
            <p>
              Search your destination and download its surrounding
              map area before travelling. Select a radius up to 50 km.
            </p>
            <button onClick={() => setDemo('maps')}>
              Try the demo →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon blue-icon">📍</div>
            <h3>Nearby Place Discovery</h3>
            <p>
              Discover tourist places stored in your downloaded
              region and view their approximate distance from you.
            </p>
            <button onClick={() => setDemo('places')}>
              Try the demo →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon orange-icon">🧭</div>
            <h3>GPS Journey Tracking</h3>
            <p>
              Record your travelled path using GPS and save
              your journey history for later review.
            </p>
            <button onClick={() => setDemo('gps')}>
              Try the demo →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple-icon">💾</div>
            <h3>Saved Travel Data</h3>
            <p>
              Keep downloaded maps, saved places and recorded
              journeys available on your device.
            </p>
            <button onClick={() => setDemo('maps')}>
              Explore storage →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon teal-icon">🌲</div>
            <h3>Explore Remote Destinations</h3>
            <p>
              Prepare for hill stations, forests, waterfalls and
              other destinations where network access may be limited.
            </p>
            <button onClick={() => setDemo('places')}>
              Explore places →
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon pink-icon">📖</div>
            <h3>Travel History</h3>
            <p>
              Review your recorded journeys and manage your
              saved travel history whenever you need it.
            </p>
            <button onClick={() => setDemo('gps')}>
              View tracking demo →
            </button>
          </div>

        </div>
      </section>

      {/* INTERACTIVE DEMO */}
      <section className="demo-section" id="demo">
        <div className="section-heading">
          <div className="section-label">SEE HOW IT WORKS</div>
          <h2>Explore the RoamOffline experience</h2>
          <p>
            Select a feature to see a preview of how it works.
          </p>
        </div>

        <div className="demo-container">

          <div className="demo-tabs">
            <button
              className={demo === 'maps' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setDemo('maps')}
            >
              🗺️ Offline Maps
            </button>

            <button
              className={demo === 'places' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setDemo('places')}
            >
              📍 Nearby Places
            </button>

            <button
              className={demo === 'gps' ? 'demo-tab active' : 'demo-tab'}
              onClick={() => setDemo('gps')}
            >
              🧭 GPS Tracking
            </button>
          </div>

          <div className="demo-content">

            <div className="demo-information">
              <div className="demo-big-icon">{current.icon}</div>

              <h3>{current.title}</h3>

              <p>{current.description}</p>

              <div className="demo-steps">
                {current.steps.map((step, index) => (
                  <div className="demo-step" key={step}>
                    <span>{index + 1}</span>
                    {step}
                  </div>
                ))}
              </div>

              <button
                className="demo-start-btn"
                onClick={onStart}
              >
                Start Your Journey →
              </button>
            </div>

            <div className="demo-visual">

              {demo === 'maps' && (
                <div className="demo-map-visual">
                  <div className="demo-map-top">
                    <span>📍 Your destination</span>
                    <span className="demo-online">● Online preview</span>
                  </div>

                  <div className="map-art">
                    <div className="map-road road-one"></div>
                    <div className="map-road road-two"></div>
                    <div className="map-river"></div>

                    <div className="map-marker marker-one">📍</div>
                    <div className="map-marker marker-two">🏞️</div>
                    <div className="map-marker marker-three">🌲</div>

                    <div className="map-radius">
                      <span>20 km coverage preview</span>
                    </div>
                  </div>

                  <div className="demo-status">
                    <span>✓</span>
                    {current.status}
                  </div>
                </div>
              )}

              {demo === 'places' && (
                <div className="demo-place-visual">
                  <div className="place-preview-header">
                    <span>Nearby places</span>
                    <span>GPS preview</span>
                  </div>

                  <div className="place-preview-item">
                    <span className="place-emoji">🏞️</span>
                    <div>
                      <b>Beautiful Waterfall</b>
                      <small>Tourist attraction</small>
                    </div>
                    <strong>1.2 km</strong>
                  </div>

                  <div className="place-preview-item">
                    <span className="place-emoji">🌲</span>
                    <div>
                      <b>Green Forest View</b>
                      <small>Nature spot</small>
                    </div>
                    <strong>2.5 km</strong>
                  </div>

                  <div className="place-preview-item">
                    <span className="place-emoji">⛰️</span>
                    <div>
                      <b>Mountain Viewpoint</b>
                      <small>Scenic location</small>
                    </div>
                    <strong>4.1 km</strong>
                  </div>

                  <div className="demo-status">
                    <span>✓</span>
                    {current.status}
                  </div>
                </div>
              )}

              {demo === 'gps' && (
                <div className="gps-preview">
                  <div className="gps-preview-top">
                    <span>My journey</span>
                    <span className="gps-recording">● PREVIEW</span>
                  </div>

                  <div className="gps-art">
                    <div className="gps-route"></div>
                    <span className="gps-point gps-point-one">●</span>
                    <span className="gps-point gps-point-two">●</span>
                    <span className="gps-point gps-point-three">●</span>
                    <span className="gps-destination">📍</span>
                  </div>

                  <div className="gps-stats">
                    <div>
                      <b>2.8 km</b>
                      <small>Distance example</small>
                    </div>
                    <div>
                      <b>00:35</b>
                      <small>Time example</small>
                    </div>
                    <div>
                      <b>12</b>
                      <small>GPS points example</small>
                    </div>
                  </div>

                  <div className="demo-status">
                    <span>✓</span>
                    {current.status}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        <p className="demo-disclaimer">
          This is an illustrative preview of the project features.
          The sample distances and tracking values are not live GPS data.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="section-heading">
          <div className="section-label">SIMPLE STEPS</div>
          <h2>How RoamOffline works</h2>
        </div>

        <div className="how-grid">
          <div className="how-card">
            <span>01</span>
            <div>🔎</div>
            <h3>Search</h3>
            <p>Find the destination you want to visit.</p>
          </div>

          <div className="how-card">
            <span>02</span>
            <div>⬇️</div>
            <h3>Download</h3>
            <p>Save the map and available nearby places before your trip.</p>
          </div>

          <div className="how-card">
            <span>03</span>
            <div>🧭</div>
            <h3>Explore</h3>
            <p>Open saved maps and use GPS while travelling.</p>
          </div>

          <div className="how-card">
            <span>04</span>
            <div>📖</div>
            <h3>Remember</h3>
            <p>Record and review your journey history.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="section-label">YOUR NEXT ADVENTURE STARTS HERE</div>

        <h2>
          Don't let a weak signal
          <span> stop your adventure.</span>
        </h2>

        <p>
          Prepare your offline map and explore with confidence.
        </p>

        <button
          className="primary-hero-btn"
          onClick={onStart}
        >
          Start Your Journey →
        </button>

        <div className="cta-login">
          Already have an account?
          <button onClick={onLogin}>Login here</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <a href="#top" className="landing-logo">
          <span className="logo-icon">✦</span>
          RoamOffline
        </a>

        <p>
          Explore more. Even without internet.
        </p>

        <span>© 2026 RoamOffline · Built for explorers</span>
      </footer>

    </div>
  );
}
