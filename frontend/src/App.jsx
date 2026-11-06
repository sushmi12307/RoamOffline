
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


import { api } from './api.js';
import * as db from './db.js';
import { hav, fmt } from './geo.js';
import { plan, download, removeRegion, cleanTiles } from './download.js';

const IDLE = { status: 'idle', points: [], dist: 0, rejected: 0 };

const styles = `
*{box-sizing:border-box}
body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f7f3;color:#203329}
button,input,select{font:inherit}
button{cursor:pointer}
.roam{min-height:100vh}
.nav{height:72px;padding:0 6%;display:flex;align-items:center;justify-content:space-between;background:white;border-bottom:1px solid #e6eee7;position:sticky;top:0;z-index:500}
.brand{font-size:23px;font-weight:850;color:#176b43;letter-spacing:-1px}
.brand span{color:#9bba72}
.navlinks{display:flex;gap:12px;align-items:center}
.btn{border:0;border-radius:10px;padding:12px 19px;font-weight:700;background:#176b43;color:white}
.btn:hover{background:#105434}
.btn.light{background:#edf5ed;color:#176b43}
.btn.outline{background:transparent;color:#176b43;border:1px solid #176b43}
.btn.danger{background:#fff0ed;color:#b53b2c}
.hero{min-height:570px;padding:85px 8%;display:flex;align-items:center;background:linear-gradient(90deg,rgba(8,42,28,.9),rgba(8,42,28,.45)),url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=85') center/cover;color:white}
.heroContent{max-width:680px}
.eyebrow{font-size:12px;letter-spacing:3px;font-weight:800;color:#c7e8a8}
.hero h1{font-size:clamp(42px,6vw,72px);line-height:1.04;margin:18px 0}
.hero p{font-size:18px;line-height:1.7;color:#e4eee6;max-width:600px}
.heroActions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.hero .btn{padding:15px 23px}
.hero .btn.light{background:white;color:#176b43}
.section{padding:65px 7%;text-align:center}
.section h2{font-size:34px;margin:0 0 12px}
.muted{color:#718176;line-height:1.6}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:35px;text-align:left}
.feature{background:white;border:1px solid #e5ece5;padding:25px;border-radius:17px}
.featureIcon{font-size:30px}
.feature h3{margin:12px 0 8px}
.authWrap{min-height:calc(100vh - 72px);display:grid;place-items:center;padding:30px;background:linear-gradient(135deg,#eaf3e8,#f8faf6)}
.authCard{width:min(440px,100%);background:white;padding:34px;border-radius:20px;box-shadow:0 15px 50px #183d2415}
.authCard h2{margin:0 0 8px;font-size:29px}
.field{display:grid;gap:7px;margin:17px 0;text-align:left}
.field label{font-size:13px;font-weight:700;color:#526459}
.field input,.field select{width:100%;padding:13px;border:1px solid #dce6dc;border-radius:9px;outline:none;background:white}
.field input:focus,.field select:focus{border-color:#258653}
.error{color:#b33c30;background:#fff0ed;padding:10px;border-radius:8px;font-size:13px}
.success{color:#176b43;background:#edf7ed;padding:10px;border-radius:8px;font-size:13px}
.appShell{min-height:100vh}
.appHeader{background:#fff;border-bottom:1px solid #e4ebe4;padding:14px 4%;display:flex;align-items:center;justify-content:space-between;gap:15px;position:sticky;top:0;z-index:400}
.appHeader .brand{font-size:21px}
.userInfo{font-size:13px;color:#64756a}
.layout{display:grid;grid-template-columns:235px 1fr;min-height:calc(100vh - 65px)}
.sidebar{background:#fff;border-right:1px solid #e4ebe4;padding:20px 13px}
.sideBtn{width:100%;text-align:left;border:0;background:transparent;padding:13px;border-radius:9px;margin:3px 0;color:#53675a;font-weight:700}
.sideBtn.active,.sideBtn:hover{background:#eaf4e9;color:#176b43}
.main{padding:28px;min-width:0}
.pageTitle{font-size:27px;margin:0 0 6px}
.gridCards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:22px 0}
.stat{background:white;border:1px solid #e4ebe4;padding:20px;border-radius:14px}
.stat strong{display:block;font-size:27px;color:#176b43;margin-top:8px}
.panel{background:white;border:1px solid #e4ebe4;border-radius:15px;padding:21px;margin:18px 0}
.panel h3{margin:0 0 15px}
.formRow{display:flex;gap:10px;align-items:end;flex-wrap:wrap}
.formRow .field{flex:1;min-width:140px;margin:7px 0}
.map{height:440px;width:100%;border-radius:12px;z-index:1}
.listItem{padding:13px 0;border-bottom:1px solid #edf0ed;display:flex;justify-content:space-between;gap:12px;align-items:center}
.small{font-size:12px;color:#77877c}
.badge{display:inline-block;padding:5px 9px;border-radius:20px;background:#edf5ed;color:#176b43;font-size:11px;font-weight:800}
.footer{padding:28px;text-align:center;background:#173d2b;color:#dce9df}
@media(max-width:800px){
 .features{grid-template-columns:1fr}
 .layout{grid-template-columns:1fr}
 .sidebar{display:flex;overflow:auto;border-right:0;border-bottom:1px solid #e4ebe4;padding:8px}
 .sideBtn{white-space:nowrap;width:auto}
 .main{padding:17px}
 .gridCards{grid-template-columns:1fr}
 .hero{padding:65px 7%;min-height:520px}
 .nav{padding:0 4%}
}
`;

function Brand() {
  return <div className="brand">Roam<span>Offline</span> 🌿</div>;
}

function Landing({ onLogin, onRegister }) {
  return (
    <div className="roam">
      <nav className="nav">
        <Brand />
        <div className="navlinks">
          <button className="btn light" onClick={onLogin}>Login</button>
          <button className="btn" onClick={onRegister}>Register</button>
        </div>
      </nav>

      <section className="hero">
        <div className="heroContent">
          <div className="eyebrow">EXPLORE MORE. STAY CONNECTED TO NATURE.</div>
          <h1>Your journey.<br/>Your map.<br/>Your adventure.</h1>
          <p>
            Explore destinations, save maps before travelling, discover nearby
            places and record your journey—even when internet connectivity is unavailable.
          </p>
          <div className="heroActions">
            <button className="btn light" onClick={onLogin}>Start Your Journey →</button>
            <button className="btn outline" style={{color:'white',borderColor:'white'}} onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>
              Explore Features
            </button>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="eyebrow" style={{color:'#54845d'}}>DISCOVER ROAMOFFLINE</div>
        <h2>Adventure doesn't need a network</h2>
        <p className="muted">Prepare your map, explore your surroundings and keep track of your travels.</p>
        <div className="features">
          <div className="feature"><div className="featureIcon">🗺️</div><h3>Offline Maps</h3><p className="muted">Download destination maps in advance and open saved map tiles without an internet connection.</p></div>
          <div className="feature"><div className="featureIcon">📍</div><h3>Nearby Discovery</h3><p className="muted">Explore tourist places available in your downloaded area and view their approximate distance.</p></div>
          <div className="feature"><div className="featureIcon">🧭</div><h3>GPS Journey Tracking</h3><p className="muted">View your current GPS position and record your travelled path when location is available.</p></div>
        </div>
        <div style={{marginTop:35}}>
          <button className="btn" onClick={onRegister}>Create Your Account →</button>
        </div>
      </section>
      <footer className="footer">RoamOffline · Explore beyond connectivity 🌿</footer>
    </div>
  );
}

function AuthPage({ mode, onBack, onSuccess, onChangeMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const body = mode === 'register'
        ? { full_name: name, name, email, password }
        : { email, password };

      const result = await api(path, { method: 'POST', body });

      const token = result.token || result.accessToken || result.access_token;
      const user = result.user || result.data?.user || result;

      if (token) localStorage.setItem('roam_token', token);

      const userId = user.user_id || user.id || result.user_id;
      const fullName = user.full_name || user.name || name || email.split('@')[0];

      if (!userId) {
        throw new Error('Authentication response did not contain a user ID. Check your backend response.');
      }

      const savedUser = {
        ...user,
        id: userId,
        user_id: userId,
        full_name: fullName,
        email
      };

      localStorage.setItem('roam_user', JSON.stringify(savedUser));
      onSuccess(savedUser);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <button className="btn light" onClick={onBack}>← Back</button>
        <div style={{marginTop:23}}><Brand /></div>
        <h2 style={{marginTop:25}}>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">{mode === 'register' ? 'Register to begin your journey.' : 'Login to continue exploring.'}</p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
            </div>
          )}
          <div className="field">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" minLength="6" required />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" style={{width:'100%',marginTop:17}} disabled={busy}>
            {busy ? 'Please wait…' : mode === 'register' ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="muted" style={{textAlign:'center',marginTop:20}}>
          {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button className="btn light" onClick={onChangeMode}>
            {mode === 'register' ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

function LeafMap({ regions, places, gps, selectedRegion, tracking, trackPoints, onMapReady }) {
  const mapRef = useRef(null);
  const mapObject = useRef(null);
  const markers = useRef([]);
  const pathLine = useRef(null);
  const gpsMarker = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapObject.current) return;

    const map = L.map(mapRef.current).setView([13.3409, 74.7421], 7);
    L.tileLayer('/tiles/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      errorTileUrl: ''
    }).addTo(map);

    mapObject.current = map;
    onMapReady?.(map);

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapObject.current = null;
    };
  }, [onMapReady]);

  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    markers.current.forEach(m => m.remove());
    markers.current = [];

    places.forEach(p => {
      const lat = Number(p.latitude ?? p.lat);
      const lng = Number(p.longitude ?? p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<b>${String(p.name || 'Tourist place').replace(/[<>]/g,'')}</b><br/>${String(p.category || '').replace(/[<>]/g,'')}`);
      markers.current.push(marker);
    });

    if (selectedRegion) {
      const lat = Number(selectedRegion.latitude ?? selectedRegion.center_lat);
      const lng = Number(selectedRegion.longitude ?? selectedRegion.center_lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        map.setView([lat, lng], 11);
      }
    }
  }, [places, selectedRegion]);

  useEffect(() => {
    const map = mapObject.current;
    if (!map || !gps?.pos) return;

    const { lat, lng, acc } = gps.pos;
    if (gpsMarker.current) gpsMarker.current.remove();

    gpsMarker.current = L.circleMarker([lat, lng], {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#1686e8',
      fillOpacity: 1
    }).addTo(map).bindPopup(`Your current GPS position<br/>Accuracy: ${Math.round(acc)} m`);
  }, [gps]);

  useEffect(() => {
    const map = mapObject.current;
    if (!map) return;

    if (pathLine.current) pathLine.current.remove();
    if (trackPoints.length > 1) {
      pathLine.current = L.polyline(
        trackPoints.map(p => [p.lat, p.lng]),
        { color: '#1686e8', weight: 5 }
      ).addTo(map);
    }
  }, [trackPoints]);

  return <div className="map" ref={mapRef} />;
}

export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('roam_user') || 'null');
    } catch {
      return null;
    }
  });

  const [tab, setTab] = useState('home');
  const [online, setOnline] = useState(navigator.onLine);
  const [regions, setRegions] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gps, setGps] = useState({ pos: null, err: null });
  const [tracking, setTracking] = useState(false);
  const [trackPoints, setTrackPoints] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [destination, setDestination] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState(5);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const watchRef = useRef(null);
  const trackRef = useRef([]);
  const mapReady = useCallback(map => setMapInstance(map), []);

  useEffect(() => {
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  const loadLocalData = useCallback(async () => {
    try {
      const [savedRegions, savedPlaces, savedJourneys] = await Promise.all([
        db.all('regions'),
        db.all('places'),
        db.all('journeys')
      ]);
      setRegions(savedRegions || []);
      setPlaces(savedPlaces || []);
      setJourneys(savedJourneys || []);
    } catch (e) {
      console.error('Could not load local data:', e);
    }
  }, []);

  useEffect(() => {
    if (user) loadLocalData();
  }, [user, loadLocalData]);

  useEffect(() => {
    if (!gpsEnabled || !navigator.geolocation) {
      if (watchRef.current !== null) {
        navigator.geolocation?.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      p => {
        const pos = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          acc: p.coords.accuracy,
          t: p.timestamp
        };
        setGps({ pos, err: null });

        if (tracking) {
          const previous = trackRef.current;
          if (!previous.length || hav(previous[previous.length - 1].lat, previous[previous.length - 1].lng, pos.lat, pos.lng) > 5) {
            trackRef.current = [...previous, pos];
            setTrackPoints(trackRef.current);
          }
        }
      },
      e => {
        setGps({
          pos: null,
          err: e.code === 1
            ? 'Location permission denied. Allow location access in your browser.'
            : e.code === 2
              ? 'GPS position unavailable. Try an open area.'
              : 'Waiting for GPS signal…'
        });
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    };
  }, [gpsEnabled, tracking]);

  useEffect(() => {
    if (!mapInstance || !gps.pos) return;
    // GPS marker and track are rendered by LeafMap.
  }, [mapInstance, gps]);

  async function searchDestination(e) {
    e?.preventDefault();
    setMessage('');
    if (!destination.trim()) return setMessage('Enter a destination name.');

    if (!online) return setMessage('Connect to the internet to search for a new destination.');

    setBusy(true);
    try {
      const result = await api('/destinations/search?q=' + encodeURIComponent(destination.trim()));
      const item = result.destination || result.results?.[0] || result[0] || result;

      const lat = Number(item.latitude ?? item.lat);
      const lng = Number(item.longitude ?? item.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('The destination search did not return coordinates. Check your destinations API.');
      }

      setLatitude(String(lat));
      setLongitude(String(lng));
      setMessage(`Destination found: ${item.name || destination}`);
    } catch (err) {
      setMessage(err.message || 'Destination search failed.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadRegion(e) {
    e?.preventDefault();
    setMessage('');

    const lat = Number(latitude);
    const lng = Number(longitude);
    const km = Number(radius);

    if (!destination.trim()) return setMessage('Enter a region name.');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return setMessage('Search a destination or enter valid coordinates.');
    if (km < 1 || km > 50) return setMessage('Radius must be between 1 and 50 km.');
    if (!online) return setMessage('You need internet access to download a new map.');

    setBusy(true);
    setProgress({ phase: 'starting', done: 0, total: 1 });

    try {
      const result = await download({
        user,
        name: destination.trim(),
        lat,
        lng,
        km,
        existing: null,
        onProgress: p => setProgress(p),
        signal: new AbortController().signal
      });

      setMessage('Map and nearby-place data downloaded successfully.');
      await loadLocalData();
      setSelectedRegion(result);
      setTab('map');
    } catch (err) {
      setMessage(err.message || 'Map download failed.');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function deleteRegion(region) {
    if (!window.confirm(`Delete downloaded map "${region.name || region.region_name}"?`)) return;
    try {
      await removeRegion(region);
      if (selectedRegion?.id === region.id) setSelectedRegion(null);
      await loadLocalData();
      setMessage('Downloaded region deleted.');
    } catch (e) {
      setMessage(e.message || 'Could not delete region.');
    }
  }

  function startTracking() {
    if (!gps.pos) {
      setMessage('Enable GPS and wait for your position before starting journey tracking.');
      setGpsEnabled(true);
      return;
    }
    trackRef.current = [gps.pos];
    setTrackPoints([gps.pos]);
    setTracking(true);
    setMessage('Journey recording started.');
  }

  async function stopTracking() {
    setTracking(false);
    const pts = trackRef.current;
    if (!pts.length) {
      setMessage('No GPS points were recorded.');
      return;
    }

    let distance = 0;
    for (let i = 1; i < pts.length; i++) {
      distance += hav(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    }

    const journey = {
      uuid: 'journey-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      title: 'Journey ' + new Date().toLocaleString(),
      startedAt: new Date(pts[0].t).toISOString(),
      endedAt: new Date().toISOString(),
      distance,
      distance_m: distance,
      pointCount: pts.length,
      points: pts
    };

    try {
      await db.put('journeys', journey);
      setJourneys(await db.all('journeys'));
      setMessage('Journey saved on this device.');
    } catch (e) {
      setMessage('Journey was recorded but could not be saved: ' + e.message);
    }
  }

  async function deleteJourney(journey) {
    if (!window.confirm('Delete this journey from this device?')) return;
    try {
      await db.del('journeys', journey.uuid);
      setJourneys(await db.all('journeys'));
      setMessage('Journey deleted.');
    } catch (e) {
      setMessage(e.message);
    }
  }

  function logout() {
    if (tracking && !window.confirm('A journey is currently recording. Stop and logout?')) return;
    setTracking(false);
    trackRef.current = [];
    setTrackPoints([]);
    localStorage.removeItem('roam_token');
    localStorage.removeItem('roam_user');
    setUser(null);
    setPage('landing');
    setTab('home');
    setMessage('');
  }

  const nearbyPlaces = gps.pos
    ? places.map(p => {
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...p, distance: hav(gps.pos.lat, gps.pos.lng, lat, lng) };
      }).filter(Boolean).sort((a, b) => a.distance - b.distance).slice(0, 30)
    : [];

  const selectedPlaces = selectedRegion
    ? places.filter(p => String(p.regionId) === String(selectedRegion.id))
    : places;

  const totalBytes = regions.reduce((n, r) => n + Number(r.sizeBytes ?? r.size_bytes ?? 0), 0);

  if (!user) {
    if (page === 'login' || page === 'register') {
      return (
        <>
          <style>{styles}</style>
          <div className="nav">
            <Brand />
            <button className="btn light" onClick={() => setPage('landing')}>← Home</button>
          </div>
          <AuthPage
            mode={page}
            onBack={() => setPage('landing')}
            onChangeMode={() => setPage(page === 'login' ? 'register' : 'login')}
            onSuccess={u => {
              setUser(u);
              setPage('dashboard');
              setTab('home');
            }}
          />
        </>
      );
    }

    return (
      <>
        <style>{styles}</style>
        <Landing
          onLogin={() => setPage('login')}
          onRegister={() => setPage('register')}
        />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="appShell">
        <header className="appHeader">
          <Brand />
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span className="userInfo">Welcome, {user.full_name || user.name || user.email}</span>
            <span className="badge">{online ? 'Online' : 'Offline'}</span>
            <button className="btn light" onClick={logout}>Logout</button>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            {[
              ['home','🏠 Dashboard'],
              ['download','⬇️ Get Map'],
              ['map','🗺️ Offline Map'],
              ['nearby','📍 Nearby Places'],
              ['journeys','🧭 My Journeys'],
              ['regions','💾 Saved Maps']
            ].map(([id, label]) => (
              <button key={id} className={'sideBtn ' + (tab === id ? 'active' : '')} onClick={() => setTab(id)}>{label}</button>
            ))}
          </aside>

          <main className="main">
            {message && <div className="success" style={{marginBottom:15}}>{message}</div>}

            {tab === 'home' && (
              <>
                <h1 className="pageTitle">Your travel dashboard</h1>
                <p className="muted">Plan your destination, save maps and explore even without internet.</p>
                <div className="gridCards">
                  <div className="stat">Downloaded regions<strong>{regions.length}</strong></div>
                  <div className="stat">Saved places<strong>{places.length}</strong></div>
                  <div className="stat">Recorded journeys<strong>{journeys.length}</strong></div>
                </div>
                <div className="panel">
                  <h3>GPS status</h3>
                  <p className="muted">{gps.pos ? `Latitude: ${gps.pos.lat.toFixed(5)} · Longitude: ${gps.pos.lng.toFixed(5)} · Accuracy: ${Math.round(gps.pos.acc)} m` : gps.err || 'GPS is not enabled.'}</p>
                  <button className="btn" onClick={() => setGpsEnabled(v => !v)}>{gpsEnabled ? 'Stop GPS' : 'Enable GPS'}</button>
                </div>
                <div className="panel">
                  <h3>Quick actions</h3>
                  <div className="formRow">
                    <button className="btn" onClick={() => setTab('download')}>Download a map</button>
                    <button className="btn light" onClick={() => setTab('map')}>Open offline map</button>
                    <button className="btn light" onClick={() => setTab('journeys')}>View journeys</button>
                  </div>
                </div>
              </>
            )}

            {tab === 'download' && (
              <>
                <h1 className="pageTitle">Get your offline map</h1>
                <p className="muted">Search for a destination while online and save its map and place data to this device.</p>
                <div className="panel">
                  <form onSubmit={searchDestination}>
                    <div className="formRow">
                      <div className="field">
                        <label>Destination name</label>
                        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Example: Jog Falls" required />
                      </div>
                      <button className="btn" disabled={busy}>Search destination</button>
                    </div>
                  </form>
                  <form onSubmit={downloadRegion}>
                    <div className="formRow">
                      <div className="field">
                        <label>Latitude</label>
                        <input value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Latitude" required />
                      </div>
                      <div className="field">
                        <label>Longitude</label>
                        <input value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Longitude" required />
                      </div>
                      <div className="field">
                        <label>Download radius</label>
                        <select value={radius} onChange={e => setRadius(Number(e.target.value))}>
                          {[1,2,5,10,15,20,30,40,50].map(n => <option key={n} value={n}>{n} km</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="small">Maximum allowed radius: 50 km. Larger areas and higher zoom levels require more storage.</p>
                    <button className="btn" disabled={busy || !online}>{busy ? 'Working…' : 'Download map and places'}</button>
                  </form>
                  {progress && (
                    <div style={{marginTop:20}}>
                      <p className="muted">{progress.phase}: {progress.done || 0} / {progress.total || 1} {progress.failed ? ` · ${progress.failed} failed` : ''}</p>
                      <progress value={progress.done || 0} max={progress.total || 1} style={{width:'100%'}} />
                    </div>
                  )}
                  {!online && <p className="error">You are offline. Previously downloaded maps remain available, but new maps cannot be downloaded.</p>}
                </div>
                <div className="panel">
                  <h3>Estimated download size</h3>
                  {Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && latitude !== '' && longitude !== '' ? (
                    <p className="muted">{plan(Number(latitude), Number(longitude), radius).tiles.length.toLocaleString()} map tiles estimated. Actual size may vary.</p>
                  ) : <p className="muted">Search for a destination to see the map area and estimated tile count.</p>}
                </div>
              </>
            )}

            {tab === 'map' && (
              <>
                <h1 className="pageTitle">Offline map</h1>
                <p className="muted">Your saved map tiles are loaded from this device's browser cache.</p>
                <div className="panel">
                  <div className="formRow">
                    <div className="field">
                      <label>Choose downloaded region</label>
                      <select value={selectedRegion?.id || ''} onChange={e => setSelectedRegion(regions.find(r => String(r.id) === e.target.value) || null)}>
                        <option value="">All saved map data</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name || r.region_name}</option>)}
                      </select>
                    </div>
                    <button className="btn light" onClick={() => mapInstance?.invalidateSize()}>Refresh map</button>
                  </div>
                  <LeafMap
                    regions={regions}
                    places={selectedPlaces}
                    gps={gps}
                    selectedRegion={selectedRegion}
                    tracking={tracking}
                    trackPoints={trackPoints}
                    onMapReady={mapReady}
                  />
                  <p className="small" style={{marginTop:12}}>Map tiles not previously downloaded may appear blank while offline. GPS requires location permission and a usable GPS signal.</p>
                </div>
              </>
            )}

            {tab === 'nearby' && (
              <>
                <h1 className="pageTitle">Nearby places</h1>
                <p className="muted">Places from your downloaded region data, sorted by straight-line distance from your GPS position.</p>
                <div className="panel">
                  {!gps.pos ? (
                    <>
                      <p className="muted">{gps.err || 'Enable GPS to calculate distances from your current position.'}</p>
                      <button className="btn" onClick={() => setGpsEnabled(true)}>Enable GPS</button>
                    </>
                  ) : nearbyPlaces.length === 0 ? (
                    <p className="muted">No saved places are available. Download a region first.</p>
                  ) : nearbyPlaces.map((p, i) => (
                    <div className="listItem" key={p.key || p.id || i}>
                      <div><strong>{p.name || 'Tourist place'}</strong><div className="small">{p.category || 'Place'} · {p.description || ''}</div></div>
                      <span className="badge">{fmt(p.distance)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'journeys' && (
              <>
                <h1 className="pageTitle">My journeys</h1>
                <p className="muted">Record your GPS path and review journeys saved on this device.</p>
                <div className="panel">
                  <h3>Journey recording</h3>
                  <p className="muted">{tracking ? `Recording · ${trackPoints.length} GPS points` : 'Not recording'}</p>
                  {!tracking
                    ? <button className="btn" onClick={startTracking}>Start journey</button>
                    : <button className="btn danger" onClick={stopTracking}>Stop and save journey</button>}
                  {!gpsEnabled && <button className="btn light" style={{marginLeft:8}} onClick={() => setGpsEnabled(true)}>Enable GPS</button>}
                  {gps.err && <p className="error">{gps.err}</p>}
                </div>
                <div className="panel">
                  <h3>Saved journeys ({journeys.length})</h3>
                  {journeys.length === 0 ? <p className="muted">No journeys saved yet.</p> : journeys.map(j => (
                    <div className="listItem" key={j.uuid}>
                      <div>
                        <strong>{j.title || 'Recorded journey'}</strong>
                        <div className="small">{j.startedAt ? new Date(j.startedAt).toLocaleString() : ''} · {j.pointCount || j.points?.length || 0} points · {fmt(j.distance || j.distance_m || 0)}</div>
                      </div>
                      <button className="btn danger" onClick={() => deleteJourney(j)}>Delete</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'regions' && (
              <>
                <h1 className="pageTitle">Saved maps</h1>
                <p className="muted">Manage map regions stored on this device.</p>
                <div className="gridCards">
                  <div className="stat">Saved regions<strong>{regions.length}</strong></div>
                  <div className="stat">Saved places<strong>{places.length}</strong></div>
                  <div className="stat">Estimated map storage<strong>{(totalBytes / 1e6).toFixed(1)} MB</strong></div>
                </div>
                <div className="panel">
                  {regions.length === 0 ? <p className="muted">No maps downloaded yet.</p> : regions.map(r => (
                    <div className="listItem" key={r.id}>
                      <div>
                        <strong>{r.name || r.region_name || 'Saved region'}</strong>
                        <div className="small">Radius: {r.radiusKm || r.radius_km || '?'} km · {r.tileCount || r.tile_count || 0} tiles</div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button className="btn light" onClick={() => {setSelectedRegion(r);setTab('map');}}>Open</button>
                        <button className="btn danger" onClick={() => deleteRegion(r)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
