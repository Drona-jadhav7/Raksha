import React, { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { request, wsUrl } from "./api";

const defaultCenter = [19.9975, 73.7898];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Shell({ children, title = "Raksha" }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-black text-xl text-red-700">Raksha</Link>
          <nav className="flex gap-2 text-sm">
            <Link className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/woman">Woman App</Link>
            <Link className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/volunteer">Volunteer</Link>
            <Link className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/response">Response</Link>
            <Link className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/analytics">Analytics</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const styles = {
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${styles[tone]}`}>{children}</span>;
}

function Landing() {
  return (
    <Shell>
      <section className="rounded-3xl bg-gradient-to-br from-red-700 via-red-600 to-rose-700 text-white p-7 md:p-12 overflow-hidden">
        <Badge tone="red">PROTOTYPE / SIMULATION</Badge>
        <div className="max-w-3xl mt-5">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Safety response, demonstrated end to end.</h1>
          <p className="mt-5 text-red-50 text-lg leading-8">
            Raksha connects an emergency activation with live location, simulated AI indicators,
            verified demo volunteers, and a response operator dashboard.
          </p>
          <Link to="/woman" className="inline-block mt-8 bg-white text-red-700 font-black px-6 py-3 rounded-xl shadow-lg">
            Launch Prototype
          </Link>
        </div>
      </section>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {[
          ["01", "Emergency activation", "One clear action starts the demo emergency session."],
          ["02", "Coordinated response", "Volunteers and the response dashboard receive live updates."],
          ["03", "Preventive analytics", "Simulated incident data demonstrates risk-area analysis."],
        ].map(([n, t, d]) => <div key={n} className="bg-white rounded-2xl border p-5">
          <div className="text-red-600 font-black">{n}</div><h2 className="font-bold text-lg mt-2">{t}</h2><p className="text-slate-600 mt-2 text-sm">{d}</p>
        </div>)}
      </div>
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
        AI analysis is experimental and does not determine whether a crime has occurred. Police, CCTV, and incident datasets in this prototype are simulated.
      </div>
    </Shell>
  );
}

function useRealtime(onMessage) {
  useEffect(() => {
    const ws = new WebSocket(wsUrl());
    ws.onmessage = (event) => onMessage(JSON.parse(event.data));
    return () => ws.close();
  }, [onMessage]);
}

function MapView({ position = defaultCenter, volunteers = [] }) {
  return <div className="h-[360px]">
    <MapContainer center={position} zoom={14} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position} icon={markerIcon}><Popup>Current demo location</Popup></Marker>
      <Circle center={position} radius={650} pathOptions={{ color: "#ef4444", fillOpacity: .08 }} />
      {volunteers.map(v => <Circle key={v.id} center={[position[0] + v.distance_km / 110, position[1]]} radius={80} pathOptions={{ color: "#2563eb" }} />)}
    </MapContainer>
  </div>;
}

function WomanApp() {
  const [emergency, setEmergency] = useState(null);
  const [detail, setDetail] = useState(null);
  const [voice, setVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simLocation, setSimLocation] = useState(0);
  const navigate = useNavigate();

  const load = async (id) => {
    if (!id) return;
    const d = await request(`/api/emergencies/${id}`);
    setDetail(d);
    setEmergency(d.emergency);
  };

  const activate = async () => {
    setLoading(true);
    let position = { latitude: defaultCenter[0], longitude: defaultCenter[1] };
    if (navigator.geolocation) {
      try {
        const p = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }));
        position = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      } catch {}
    }
    const data = await request("/api/emergencies", { method: "POST", body: JSON.stringify({ ...position, demo: true }) });
    setEmergency(data);
    setRecording(true);
    await load(data.emergency_id);
    setLoading(false);
  };

  useRealtime((msg) => {
    if (msg.emergency?.emergency_id === emergency?.emergency_id) load(emergency.emergency_id);
  });

  useEffect(() => {
    if (emergency) load(emergency.emergency_id);
  }, [simLocation]);

  const simulateRoute = async () => {
    const points = [
      [19.9975, 73.7898], [19.999, 73.792], [20.001, 73.795], [20.003, 73.798]
    ];
    const p = points[simLocation % points.length];
    setSimLocation(simLocation + 1);
    await request(`/api/emergencies/${emergency.emergency_id}/location`, { method: "PATCH", body: JSON.stringify({ latitude: p[0], longitude: p[1] }) });
  };

  const end = async () => {
    await request(`/api/emergencies/${emergency.emergency_id}/status`, { method: "PATCH", body: JSON.stringify({ status: "RESOLVED" }) });
    setRecording(false);
    await load(emergency.emergency_id);
  };

  if (emergency) return <Shell title="Emergency">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Badge tone="red">EMERGENCY ACTIVE</Badge><h1 className="text-3xl font-black mt-2">You are in Demo Emergency Mode</h1></div>
      <Badge tone="amber">Prototype/Simulation</Badge>
    </div>
    <div className="grid lg:grid-cols-[1.4fr_.8fr] gap-5 mt-5">
      <div className="bg-white border rounded-2xl p-4"><MapView position={[emergency.latitude, emergency.longitude]} volunteers={detail?.volunteers || []}/></div>
      <div className="space-y-3">
        <Info title="Emergency ID" value={emergency.emergency_id}/>
        <Info title="Risk level" value={detail?.ai?.risk_level || emergency.risk_level}/>
        <Info title="Recording" value={recording ? "● Recording simulation active" : "Stopped"}/>
        <Info title="Audio monitoring" value="Prototype indicator active"/>
        <Info title="Police response" value={emergency.police_status}/>
        <Info title="AI analysis" value="Experimental — not crime detection"/>
        <button onClick={simulateRoute} className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold">Simulate Location Update</button>
        <button onClick={end} className="w-full border border-red-200 text-red-700 rounded-xl py-3 font-bold">End / Resolve Emergency</button>
      </div>
    </div>
    <Timeline items={detail?.timeline || []}/>
    <div className="grid md:grid-cols-2 gap-4 mt-5">
      <div className="bg-white border rounded-2xl p-5"><h2 className="font-black">Nearby verified volunteers</h2>{(detail?.volunteers || []).map(v => <div key={v.id} className="flex justify-between py-3 border-b last:border-0"><span>{v.name} <Badge tone="green">Verified</Badge></span><span className="text-sm">{v.distance_km} km · {v.status}</span></div>)}</div>
      <div className="bg-white border rounded-2xl p-5"><h2 className="font-black">AI distress analysis</h2><p className="text-sm text-slate-500 mt-1">Experimental prototype only.</p>{detail?.ai?.indicators?.map(x => <div key={x} className="mt-3"><Badge tone="amber">{x}</Badge></div>)}<p className="mt-4 font-bold">Confidence: {Math.round((detail?.ai?.confidence || 0) * 100)}%</p></div>
    </div>
  </Shell>;

  return <Shell>
    <div className="max-w-xl mx-auto text-center py-8 md:py-14">
      <Badge tone="red">PROTOTYPE / SIMULATION</Badge>
      <h1 className="text-4xl font-black mt-5">Raksha</h1>
      <p className="text-slate-600 mt-2">Your demo safety response companion.</p>
      <button disabled={loading} onClick={activate} className="ring-pulse mt-10 w-64 h-64 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl font-black text-3xl disabled:opacity-60">
        {loading ? "STARTING..." : "I'M NOT SAFE"}
      </button>
      <div className="grid sm:grid-cols-2 gap-3 mt-8 text-left">
        <div className="bg-white border rounded-2xl p-4"><b>Voice trigger</b><p className="text-sm text-slate-500 mt-1">Say HELP three times — prototype.</p><button onClick={() => setVoice(!voice)} className="mt-3 text-sm font-bold text-red-700">{voice ? "Microphone enabled" : "Enable microphone"}</button></div>
        <div className="bg-white border rounded-2xl p-4"><b>Location</b><p className="text-sm text-slate-500 mt-1">Browser permission is requested. Demo fallback is used if unavailable.</p></div>
      </div>
      {voice && <button onClick={activate} className="mt-4 border border-red-200 text-red-700 px-5 py-3 rounded-xl font-bold">Simulate: HELP ×3</button>}
      <p className="mt-6 text-xs text-slate-500">No secret recording. No real police/CCTV connection. Demo data only.</p>
    </div>
  </Shell>;
}

function Info({title,value}) { return <div className="bg-white border rounded-2xl p-4"><div className="text-xs uppercase tracking-wide text-slate-500">{title}</div><div className="font-bold mt-1">{value}</div></div> }
function Timeline({items}) { return <div className="bg-white border rounded-2xl p-5 mt-5"><h2 className="font-black">Evidence / response timeline</h2><div className="mt-3 space-y-3">{items.map((x,i)=><div key={i} className="flex gap-3"><div className="w-2 h-2 rounded-full bg-red-500 mt-2"/><div><b className="text-sm">{x.type}</b><p className="text-sm text-slate-600">{x.message}</p></div></div>)}</div></div>}

function Volunteer() {
  const [emergencies, setEmergencies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [me, setMe] = useState({ id: 1, name: "Aarohi Sharma" });
  const refresh = async () => setEmergencies(await request("/api/emergencies"));
  useEffect(() => { refresh(); }, []);
  useRealtime(() => refresh());

  const update = async (status) => {
    await request(`/api/emergencies/${selected.emergency_id}/volunteers/${me.id}`, { method:"PATCH", body: JSON.stringify({status}) });
    refresh();
  };
  return <Shell><div className="flex justify-between items-end"><div><Badge>PROTOTYPE / SIMULATION</Badge><h1 className="text-3xl font-black mt-2">Volunteer Dashboard</h1><p className="text-slate-500">Fictional verified volunteers for demonstration.</p></div></div>
    <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5 mt-5">
      <div className="bg-white border rounded-2xl p-4"><h2 className="font-black mb-3">Active requests</h2>{emergencies.filter(e=>e.status==="ACTIVE").map(e=><button key={e.emergency_id} onClick={()=>setSelected(e)} className="w-full text-left border rounded-xl p-4 mb-2 hover:border-red-300"><b>{e.emergency_id}</b><div className="text-sm mt-1"><Badge tone="red">{e.risk_level}</Badge> <span className="text-slate-500 ml-2">Live demo request</span></div></button>)}</div>
      <div className="bg-white border rounded-2xl p-5">{selected ? <><h2 className="text-xl font-black">{selected.emergency_id}</h2><p className="text-slate-500 mt-1">Minimum necessary location information shown.</p><div className="mt-5 grid sm:grid-cols-3 gap-2">{["ACCEPTED","ON_THE_WAY","REACHED"].map(s=><button key={s} onClick={()=>update(s)} className="border rounded-xl py-3 font-bold hover:bg-slate-50">{s.replaceAll("_"," ")}</button>)}</div><div className="mt-5"><MapView position={[selected.latitude, selected.longitude]}/></div></> : <div className="text-slate-500">Select a demo emergency.</div>}</div>
    </div>
  </Shell>;
}

function Response() {
  const [emergencies,setEmergencies]=useState([]);
  const [selected,setSelected]=useState(null);
  const refresh=async()=>setEmergencies(await request("/api/emergencies"));
  useEffect(()=>{refresh()},[]);
  useRealtime((msg)=>{refresh(); if(msg.emergency?.emergency_id===selected?.emergency_id)setSelected(msg.emergency)});
  useEffect(()=>{if(selected)request(`/api/emergencies/${selected.emergency_id}`).then(setSelected)},[selected?.emergency_id]);
  return <Shell><Badge>PROTOTYPE / SIMULATION</Badge><h1 className="text-3xl font-black mt-2">Response Operations</h1><p className="text-slate-500">Simulated operator dashboard — no real police dispatch connection.</p>
    <div className="grid lg:grid-cols-[.75fr_1.25fr] gap-5 mt-5"><div className="bg-white border rounded-2xl p-4"><h2 className="font-black mb-3">Active emergencies</h2>{emergencies.map(e=><button key={e.emergency_id} onClick={()=>setSelected(e)} className="w-full text-left border rounded-xl p-4 mb-2"><div className="flex justify-between"><b>{e.emergency_id}</b><Badge tone={e.risk_level==="HIGH"?"red":"amber"}>{e.risk_level}</Badge></div><div className="text-xs text-slate-500 mt-2">{e.status} · {e.police_status}</div></button>)}</div>
    <div className="bg-white border rounded-2xl p-4 min-h-[420px]">{selected ? <><h2 className="font-black text-xl">{selected.emergency_id}</h2><div className="grid sm:grid-cols-3 gap-3 my-4"><Info title="Severity" value={selected.risk_level}/><Info title="Status" value={selected.status}/><Info title="Police" value="SIMULATED ALERT"/></div><MapView position={[selected.latitude,selected.longitude]}/><Timeline items={selected.timeline||[]}/></> : <div className="h-full flex items-center justify-center text-slate-400">Select an emergency to inspect.</div>}</div></div>
  </Shell>;
}

function Analytics() {
  const [data,setData]=useState(null);
  useEffect(()=>{request("/api/analytics").then(setData)},[]);
  if(!data)return <Shell><p>Loading analytics…</p></Shell>;
  return <Shell><Badge>PROTOTYPE / SIMULATION</Badge><h1 className="text-3xl font-black mt-2">Safety Analytics</h1><p className="text-slate-500">{data.note}</p>
    <div className="grid lg:grid-cols-2 gap-5 mt-5"><div className="bg-white border rounded-2xl p-5 h-[360px]"><h2 className="font-black mb-4">Simulated incidents by area</h2><ResponsiveContainer width="100%" height="90%"><BarChart data={data.areas}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="incidents" fill="#dc2626"/></BarChart></ResponsiveContainer></div>
    <div className="bg-white border rounded-2xl p-5 h-[360px]"><h2 className="font-black mb-4">Simulated incident categories</h2><ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={data.categories} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{data.categories.map((_,i)=><Cell key={i}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">{data.areas.map(a=><div key={a.name} className="bg-white border rounded-2xl p-4"><b>{a.name}</b><div className="mt-2"><Badge tone={a.risk==="HIGH"?"red":a.risk==="MODERATE"?"amber":"green"}>{a.risk} RISK</Badge></div><p className="text-sm text-slate-500 mt-2">{a.incidents} simulated incidents</p></div>)}</div>
  </Shell>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/woman" element={<WomanApp/>}/>
    <Route path="/volunteer" element={<Volunteer/>}/>
    <Route path="/response" element={<Response/>}/>
    <Route path="/analytics" element={<Analytics/>}/>
  </Routes>
}
