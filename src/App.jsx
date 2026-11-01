import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowsOutSimple, BookOpen, Check, Compass, DotsThree, Feather, GameController, GearSix, MapTrifold, Pause, Play, SpeakerHigh, SpeakerSlash, Sword, X } from '@phosphor-icons/react';
import { GameEngine, readSave } from './game/engine';
import { REGIONS, SHRINES, World } from './game/world';
import { BellMark, Mask, Prism, Ornament, Rosary, LumenSpool, Thread } from './components/Emblems';
import Modal from './components/Modal';
import { ControlsPanel, CreditsPanel, InventoryPanel, JournalPanel, MapPanel, SettingsPanel } from './components/Panels';

const SETTINGS_KEY = 'mothglass-settings-v1';
function initialSettings() {
  try {
    const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    return { sound: data?.sound !== false, volume: typeof data?.volume === 'number' ? Math.max(0, Math.min(1, data.volume)) : 0.45, motion: typeof data?.motion === 'boolean' ? data.motion : window.matchMedia('(prefers-reduced-motion: reduce)').matches };
  } catch { return { sound: true, volume: 0.45, motion: false }; }
}

function MiniMap({ region, bells, onClick }) {
  return <button className="mini-map" onClick={onClick} aria-label="Open map of The Aerial Conservatory">
    <div className="mini-map-label"><span>AERIAL CONSERVATORY</span><kbd>M</kbd></div>
    <svg viewBox="0 0 156 64" fill="none" aria-hidden="true">
      <path d="M9 37h11V26h23v8h9v18H35v5H14V48H9Zm48-3h8V19h22v8h10v17H84v9H64V43h-7Zm46-7h7V13h18v7h13v22h-16v7h-15V37h-7Z" stroke="#8f7c94" strokeWidth="1" strokeOpacity=".7" />
      <path d="M51 40h8m37-8h8M140 29h8V12" stroke="#8d7792" strokeDasharray="2 3" />
      {[0, 1, 2].map((i) => <path key={i} d={`m${31 + i * 43} ${i === 0 ? 37 : i === 1 ? 30 : 24} 2-4 2 4-2 2Z`} fill={bells[i] ? '#d9cda4' : '#8f7d93'} />)}
      <circle cx={[27, 74, 119, 148][region]} cy={[46, 39, 33, 13][region]} r="3" fill="#d8867a" />
      <circle cx={[27, 74, 119, 148][region]} cy={[46, 39, 33, 13][region]} r="7" stroke="#d8867a" strokeOpacity=".23" />
    </svg>
  </button>;
}

function TouchControls({ onPress, onRelease }) {
  const touch = action => ({ onPointerDown: e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onPress(action); }, onPointerUp: () => onRelease(action), onPointerCancel: () => onRelease(action), onLostPointerCapture: () => onRelease(action) });
  return <div className="touch-controls" aria-label="Touch game controls"><div className="touch-movement"><button aria-label="Move left" {...touch('left')}><ArrowLeft size={22} /></button><button aria-label="Move right" {...touch('right')}><ArrowRight size={22} /></button></div><div className="touch-actions"><button className="touch-secondary" aria-label="Sprint dash" {...touch('dash')}>Sprint</button><button aria-label="Attack" {...touch('attack')}><Sword size={22} /></button><button className="touch-jump" aria-label="Jump" {...touch('jump')}>Jump</button></div></div>;
}

export default function App() {
  const engine = useRef(null), canvas = useRef(null), gameWindow = useRef(null), toastTimer = useRef(null), regionTimer = useRef(null);
  const [state, setState] = useState(() => new World(readSave()).snapshot());
  const [settings, setSettings] = useState(initialSettings);
  const [panel, setPanel] = useState(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(null);
  const [toast, setToast] = useState(null), [regionReveal, setRegionReveal] = useState(null);
  const [dialogue, setDialogue] = useState(null);
  const [started, setStarted] = useState(Boolean(readSave()));
  const [tracked, setTracked] = useState(null);
  const [saveStatus, setSaveStatus] = useState(readSave() ? 'Journey saved' : 'A new journey');
  const [fullscreen, setFullscreen] = useState(false);
  const [entered, setEntered] = useState(false);
  const panelRef = useRef(panel), enteredRef = useRef(false);
  panelRef.current = panel;

  const showToast = useCallback(text => {
    setToast({ text, id: Date.now() });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3800);
  }, []);

  const openPanel = useCallback(next => {
    engine.current?.setPaused(Boolean(next) || !enteredRef.current);
    setPanel(next);
    if (!next && enteredRef.current) canvas.current?.focus({ preventScroll: true });
  }, []);

  const startJourney = useCallback(() => {
    enteredRef.current = true;
    setEntered(true);
    setPanel(null);
    engine.current?.setPaused(false);
    engine.current?.sound.start();
    canvas.current?.focus({ preventScroll: true });
  }, []);

  const onEvent = useCallback(event => {
    if (event.type === 'toast') showToast(event.text);
    else if (event.type === 'bell') {
      const count = engine.current?.world.bells.filter(Boolean).length || 0;
      showToast(event.first ? `${SHRINES[event.id].name} awakens. ${count} of 3 bells are singing.` : 'A familiar song. Health and lumen restored.');
    } else if (event.type === 'region') {
      setRegionReveal(event.name); window.clearTimeout(regionTimer.current);
      regionTimer.current = window.setTimeout(() => setRegionReveal(null), 3800);
    } else if (event.type === 'dialogue') { setDialogue(event); openPanel('dialogue'); }
    else if (event.type === 'dead') { openPanel('dead'); }
    else if (event.type === 'won') { openPanel('won'); }
    else if (event.type === 'boss') { showToast('The Condensation Engine wakes. Watch. Leap. Strike.'); }
    else if (event.type === 'boss-defeated') { showToast('The guardian yields. The High Lantern is yours to reach.'); }
    else if (event.type === 'rest') { showToast('A moment of quiet. Health and lumen restored.'); }
    else if (event.type === 'crafted') { showToast(`${event.name} crafted and equipped.`); }
    else if (event.type === 'saved') { setSaveStatus('Journey saved'); }
    else if (event.type === 'save-unavailable') { setSaveStatus('Session only'); }
    else if (event.type === 'blur' && enteredRef.current && !panelRef.current) { openPanel('pause'); }
  }, [showToast, openPanel]);

  useEffect(() => {
    const instance = new GameEngine(canvas.current, {
      onState: snapshot => { setState(snapshot); if (Math.abs(snapshot.x - 635) > 24) setStarted(true); },
      onEvent,
      onReady: () => setReady(true),
      onError: message => { setError(message); setReady(false); },
    });
    engine.current = instance;
    instance.setPaused(true);
    if (import.meta.env.DEV) window.__MOTHGLASS__ = instance;
    return () => { window.clearTimeout(toastTimer.current); window.clearTimeout(regionTimer.current); instance.dispose(); engine.current = null; if (import.meta.env.DEV) delete window.__MOTHGLASS__; };
  }, [onEvent]);

  useEffect(() => {
    if (engine.current) {
      engine.current.sound.setEnabled(settings.sound);
      engine.current.sound.setVolume(settings.volume);
      if (engine.current.renderer) engine.current.renderer.reducedMotion = settings.motion;
    }
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Preferences still work in memory. */ }
  }, [settings]);

  useEffect(() => {
    const shortcuts = event => {
      if (event.metaKey || event.ctrlKey || event.altKey || (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) && event.code !== 'Escape')) return;
      if (event.code === 'Space' && !enteredRef.current && !panelRef.current) {
        event.preventDefault(); startJourney(); return;
      }
      if (event.code === 'Escape' || event.code === 'KeyP') {
        event.preventDefault();
        if (['dead', 'won'].includes(panelRef.current) || (!enteredRef.current && !panelRef.current)) return;
        openPanel(panelRef.current ? null : 'pause');
      } else if (['KeyM', 'KeyI', 'KeyL', 'KeyH'].includes(event.code)) {
        if (['dead', 'won', 'dialogue'].includes(panelRef.current)) return;
        event.preventDefault();
        const next = { KeyM: 'map', KeyI: 'inventory', KeyL: 'journal', KeyH: 'controls' }[event.code];
        openPanel(panelRef.current === next ? null : next);
      } else if (event.code === 'Enter' && panelRef.current === 'dead') {
        event.preventDefault(); engine.current?.respawn(); openPanel(null);
      }
    };
    const handleFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', shortcuts);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => { window.removeEventListener('keydown', shortcuts); document.removeEventListener('fullscreenchange', handleFullscreen); };
  }, [openPanel, startJourney]);

  const toggleSound = () => setSettings(current => ({ ...current, sound: !current.sound }));
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (gameWindow.current.requestFullscreen) await gameWindow.current.requestFullscreen(); else showToast('Your browser does not support full screen here.'); }
    catch { showToast('Full screen is unavailable in this browser window.'); }
  };
  const restart = steel => { engine.current?.restart(steel); setStarted(false); setTracked(null); openPanel(null); showToast(steel ? 'Clear Glass. A new thread, a greater challenge.' : 'Every journey begins with a single thread.'); };
  const bells = state.bells.filter(Boolean).length;
  const nextBell = tracked !== null && tracked < 3 && !state.bells[tracked] ? tracked : state.bells.findIndex(b => !b);
  const questTitle = nextBell >= 0 ? ['Seek the first bell', 'Find the Petal Bell', 'Wake the Pilgrim Bell'][nextBell] : state.status === 'won' ? 'A kingdom sings again' : state.boss ? 'Vanquish the guardian' : 'Ascend to the High Lantern';
  const questDetail = nextBell >= 0 ? ['Follow the path beyond the grotto.', 'Let the forest hear your song.', 'A final echo along the bell road.'][nextBell] : 'Follow the light at the end of the pilgrim’s road.';
  const region = REGIONS[state.region];
  const action = name => { if (panel || !entered) return; engine.current?.tap(name); canvas.current?.focus({ preventScroll: true }); };

  const modalDetails = {
    map: ['A kingdom of paths', 'THE MAP OF AERIAL CONSERVATORY'],
    inventory: ['The things we carry', 'TOOLS & KEEPSAKES'],
    journal: ['Notes from the journey', 'THE PILGRIM’S JOURNAL'],
    controls: ['A prism. A thread. A way forward.', 'HOW TO PLAY'],
    settings: ['Make yourself at home', 'A MOMENT OF QUIET'],
    pause: ['Even a lamplighter needs a moment.', 'JOURNEY PAUSED'],
    dialogue: [dialogue?.name || 'Olli the Glazier', 'A VOICE IN THE GROTTO'],
    dead: ['A thread, unbroken.', 'THE JOURNEY CONTINUES'],
    won: ['And the kingdom sang.', 'MOTHGLASS ASCENT'],
    credits: ['Made of lumen and song', 'ABOUT THIS ADVENTURE'],
  };

  return <div className={`app-shell ${settings.motion ? 'gentle-motion' : ''}`}>
    <header className="app-header">
      <a className="brand" href="#" aria-label="Mothglass Ascent, return to journey" onClick={event => { event.preventDefault(); if (!['dead', 'won'].includes(panel)) openPanel(null); }}>
        <span className="mothglass-wordmark">MOTHGLASS<br/><b>ASCENT</b></span>
      </a>
      <div className="brand-divider" />
      <span className="edition-label">A THREAD<br /><span>OF HOPE</span></span>
      <nav className="main-nav" aria-label="Game navigation">
        <button aria-label="Journey" className={!panel || panel === 'pause' ? 'active' : ''} onClick={() => { if (!['dead', 'won'].includes(panel)) openPanel(null); }}><Compass size={16} weight="light" /><span>Journey</span></button>
        <button aria-label="Journal" className={panel === 'journal' ? 'active' : ''} onClick={() => openPanel(panel === 'journal' ? null : 'journal')}><BookOpen size={16} weight="light" /><span>Journal</span></button>
        <button aria-label="Inventory" className={panel === 'inventory' ? 'active' : ''} onClick={() => openPanel(panel === 'inventory' ? null : 'inventory')}><Thread /><span>Inventory</span></button>
      </nav>
      <div className="header-actions"><span className="save-status"><i />{saveStatus}</span><button className="icon-button" aria-label={settings.sound ? 'Mute sound' : 'Enable sound'} title={settings.sound ? 'Mute sound' : 'Enable sound'} onClick={toggleSound}>{settings.sound ? <SpeakerHigh size={19} weight="light" /> : <SpeakerSlash size={19} weight="light" />}</button><button className="icon-button" aria-label="Open settings" title="Settings" onClick={() => openPanel('settings')}><GearSix size={19} weight="light" /></button></div>
    </header>

    <main>
      <div className="game-window" ref={gameWindow}>
        <div className="game-stage">
          <canvas ref={canvas} className="game-canvas" aria-label="Mothglass Ascent game. Move with A and D, jump with Space, attack with J. Press H for all controls." tabIndex={0} onPointerDown={event => { if (event.button === 0) action('attack'); }} onContextMenu={event => { event.preventDefault(); action('dash'); }} />
          <div className="scene-vignette" />
          <div className="frame-corner top-left" /><div className="frame-corner top-right" /><div className="frame-corner bottom-left" /><div className="frame-corner bottom-right" />

          {ready && <>
            <div className="game-hud">
              <div className="vitals"><LumenSpool value={state.lumen} className="lumen-spool" /><div className="health-and-lumen"><div className="health-panes" role="img" aria-label={`${state.health} of ${state.maxHealth} health lantern panes`}>{Array.from({ length: state.maxHealth }, (_, i) => <Mask key={i} filled={i < state.health} className={i < state.health ? '' : 'empty'} />)}</div><div className="lumen-meter" aria-label={`${state.lumen} lumen`}><span>LUMEN</span><div className="lumen-track"><i style={{ transform: `scaleX(${state.lumen / 100})` }} /></div><span>{state.lumen}</span></div></div></div>
              <div className="rosary-count"><Rosary /><span>{state.shells.toString().padStart(3, '0')}</span><span className="rosary-label">GLASS BEADS</span></div>
            </div>
            <div className="scene-top-right"><div className="chapter-tag"><span className="small-diamond" /><span>{state.steel ? 'CLEAR GLASS' : 'THE DEWKEEPER’S PATH'}</span></div><div className="scene-buttons"><button className="scene-icon-button" aria-label="Toggle full screen" title={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}><ArrowsOutSimple size={16} weight="light" /></button><button className="scene-icon-button" aria-label="Pause journey" title="Pause (Esc)" onClick={() => openPanel('pause')}><Pause size={16} weight="fill" /></button></div></div>
            <div className="scene-top-ornament"><Ornament /></div>

            <div className="equipped-tools"><div className="tool-slots"><button className="tool-slot selected" title="Prism strike (J)" aria-label="Prism strike" onClick={() => action('attack')}><Prism /><kbd>J</kbd></button><button className="tool-slot" title="Thread cast (F) · 20 lumen" aria-label="Cast thread, costs 20 lumen" onClick={() => action('tool')}><Thread /><kbd>F</kbd></button><button className="tool-slot" title="Bind (Q) · Restore two lantern panes for 33 lumen" aria-label="Bind and heal, costs 33 lumen" onClick={() => action('heal')}><LumenSpool /><kbd>Q</kbd></button></div><span className="equipped-caption">{state.tools.includes('prism') ? 'HONED PRISM' : 'OLD PRISM'}<span> & LUMEN ARTS</span></span></div>
            {!started && !state.context && <div className="first-step"><div><kbd>A</kbd><kbd>D</kbd></div><span>The glasshouses await.<br /><strong>Take your first step.</strong></span></div>}
            {state.context && state.status === 'playing' && <button className="interact-prompt" onClick={() => action('interact')}><span>{state.context.name}</span><div><kbd>E</kbd>{state.context.label}</div></button>}
            {state.boss && <div className="boss-hud"><span>CONDENSATION ENGINE</span><div className="boss-health"><i style={{ transform: `scaleX(${state.boss.health / state.boss.max})` }} /></div></div>}
            <MiniMap region={state.region} bells={state.bells} onClick={() => openPanel('map')} />
            <TouchControls onPress={name => engine.current?.press(name)} onRelease={name => engine.current?.release(name)} />
          </>}

          {ready && !entered && !panel && <div className="title-screen">
            <div className="title-copy">
              <span className="title-kicker"><span className="small-diamond" /> AN AERIAL GLASSHOUSE ADVENTURE</span>
              <h2>Mothglass<br /><em>Ascent</em></h2>
              <p>Above an apricot sea of clouds, three silent bells keep a magical kingdom waiting. Cross the dewlit glasshouses, gather lumen, and wake the world with song.</p>
              <div className="title-actions"><button className="primary-button" onClick={startJourney}><Play size={16} weight="fill" />{readSave() ? 'Continue the ascent' : 'Enter the glasshouse'}<ArrowRight size={18} /></button><button className="title-help" onClick={() => openPanel('controls')}><GameController size={17} />How to play</button></div>
              <div className="title-footnote"><span><kbd>A</kbd><kbd>D</kbd> Move</span><span><kbd>SPACE</kbd> Jump</span><span><kbd>J</kbd> Strike</span><span className="title-begin">or press Space to begin</span></div>
            </div>
            <div className="title-sigil" aria-hidden="true"><Ornament /><BellMark /><span>THREE BELLS<br />ONE UNBROKEN THREAD</span></div>
          </div>}
          {regionReveal && <div className="region-reveal" key={regionReveal}><Ornament /><span>AERIAL CONSERVATORY</span><h2>{regionReveal}</h2><Ornament /></div>}
          {toast && <div className="game-toast" role="status" key={toast.id}><Feather size={16} weight="light" /><span>{toast.text}</span></div>}
          {!ready && <div className="loading-scene">{error ? <><Mask /><h2>The thread slipped.</h2><p>The world couldn’t load. Please reload to begin again.</p><button className="primary-button" onClick={() => window.location.reload()}>Reload adventure<ArrowRight size={16} /></button></> : <><LumenSpool /><span>GATHERING THE THREADS</span><div className="loading-line"><i /></div></>}</div>}
        </div>

        <div className="keyboard-bar"><div className="keyboard-controls"><span className="control-hint"><kbd>A</kbd><kbd>D</kbd><span>Move</span></span><span className="control-hint"><kbd>SPACE</kbd><span>Jump</span></span><span className="control-hint"><kbd>J</kbd><span>Attack</span></span><span className="control-hint"><kbd>SHIFT</kbd><span>Sprint</span></span><span className="control-hint"><kbd>Q</kbd><span>Bind</span></span><span className="control-hint"><kbd>E</kbd><span>Interact</span></span></div><button className="controls-help" onClick={() => openPanel('controls')}><GameController size={16} weight="light" /><span>How to play</span><span className="help-key">H</span></button></div>
      </div>

      <section className="journey-strip" aria-label="Current journey">
        <div className="current-location"><span className="location-number">0{state.region + 1}<i /></span><div><div className="location-eyebrow"><span className="eyebrow">THE KINGDOM OF AERIAL CONSERVATORY</span><span className="exploring-indicator"><i />{!entered ? 'AWAITING' : panel ? 'AT REST' : 'EXPLORING'}</span></div><h1>{region.name}<span> / </span><em>{region.subtitle}</em></h1></div></div>
        <div className="current-quest"><div className="quest-icon"><BellMark filled={bells > 0} /></div><div><span className="eyebrow">MOTHGLASS ASCENT</span><h2>{questTitle}<ArrowRight size={15} weight="light" /></h2><p>{questDetail}</p></div></div>
        <button className="bell-progress" onClick={() => openPanel('map')} aria-label={`${bells} of 3 bells awakened. Open map.`}><div className="bell-dots">{state.bells.map((b, i) => <React.Fragment key={i}>{i > 0 && <span className="bell-connector" />}<span className={`bell-node ${b ? 'rung' : ''}`}>{b ? <Check size={10} weight="bold" /> : <span />}</span></React.Fragment>)}</div><span><strong>{bells} <span>/ 3</span></strong> BELLS AWAKENED</span></button>
      </section>
    </main>
    <footer className="app-footer"><span><span className="footer-diamond" />A SMALL ADVENTURE IN A VAST KINGDOM</span><button onClick={() => openPanel('credits')}>An original glasshouse expedition<ArrowRight size={12} /></button><span className="footer-shortcut"><kbd>ESC</kbd>Pause. Breathe. Begin again.</span></footer>

    {panel && <Modal title={modalDetails[panel][0]} eyebrow={modalDetails[panel][1]} onClose={['dead', 'won'].includes(panel) ? undefined : () => openPanel(null)} className={`panel-${panel}`}>
      {panel === 'controls' && <ControlsPanel />}
      {panel === 'map' && <MapPanel state={state} onTrack={index => { setTracked(index); openPanel(null); showToast(`${REGIONS[index].name} marked on your map.`); }} />}
      {panel === 'inventory' && <InventoryPanel state={state} onCraft={id => engine.current?.craft(id)} />}
      {panel === 'journal' && <JournalPanel state={state} />}
      {panel === 'settings' && <SettingsPanel {...settings} onSound={toggleSound} onVolume={volume => setSettings(current => ({ ...current, volume }))} onMotion={() => setSettings(current => ({ ...current, motion: !current.motion }))} onRestart={restart} onCredits={() => openPanel('credits')} hasWon={state.hasWon} />}
      {panel === 'credits' && <CreditsPanel />}
      {panel === 'pause' && <div className="pause-content"><p>The world can wait. Your thread is still here.</p><button className="primary-button" onClick={() => openPanel(null)}><Play size={16} weight="fill" />Continue the journey<ArrowRight size={18} /></button><div className="pause-links"><button onClick={() => openPanel('map')}><MapTrifold size={17} />Unfold the map<ArrowRight size={15} /></button><button onClick={() => openPanel('controls')}><GameController size={17} />Remember your moves<ArrowRight size={15} /></button><button onClick={() => openPanel('settings')}><GearSix size={17} />Settings<ArrowRight size={15} /></button></div><span className="pause-save"><i />Your progress is saved at your last resting place.</span></div>}
      {panel === 'dialogue' && <div className="dialogue-content"><Feather className="dialogue-feather" size={40} weight="light" /><p>“{dialogue?.text}”</p><button className="primary-button" onClick={() => openPanel(null)}>Carry the words with you<ArrowRight size={17} /></button></div>}
      {panel === 'dead' && <div className="ending-content"><Mask filled={false} className="ending-mask" /><p>Even the strongest lumen can fray.<br />Rest, gather yourself, and follow the song again.</p><div className="ending-stats"><div><strong>{bells}<span>/ 3</span></strong><span>BELLS STILL SINGING</span></div><div><strong>{state.deaths}</strong><span>TIMES RISEN</span></div></div><button className="primary-button" onClick={() => { engine.current?.respawn(); openPanel(null); }}>Rise at your last rest<ArrowRight size={18} /></button><span className="ending-note">Your bells and crafted tools are safe. Press Enter to rise.</span></div>}
      {panel === 'won' && <div className="ending-content"><div className="ending-bells">{[0, 1, 2].map(i => <BellMark filled key={i} />)}</div><p>Three bells. One unbroken thread.<br />You gave the silent kingdom a song to remember.</p><div className="ending-stats"><div><strong>{Math.floor(state.time / 60)}<span>:{Math.floor(state.time % 60).toString().padStart(2, '0')}</span></strong><span>YOUR JOURNEY</span></div><div><strong>{state.kills}</strong><span>FOES BESTED</span></div><div><strong>{state.deaths}</strong><span>TIMES RISEN</span></div></div><button className="primary-button" onClick={() => restart(false)}>Follow a new thread<ArrowRight size={18} /></button><button className="secondary-button steel-soul-button" onClick={() => restart(true)}><Sword size={16} />Enter Clear Glass</button><span className="ending-note">Clear Glass is unlocked. A more demanding pilgrimage awaits.</span></div>}
    </Modal>}
  </div>;
}
