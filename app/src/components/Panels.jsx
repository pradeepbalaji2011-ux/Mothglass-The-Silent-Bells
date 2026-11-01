import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, Compass, Feather, Heart, LockKey, MapTrifold, SpeakerHigh, Sparkle, Sword, X } from '@phosphor-icons/react';
import { BENCHES, REGIONS, SHRINES, TOOLS } from '../game/world';
import { BellMark, Mask, Prism, Ornament, Rosary, LumenSpool, Thread } from './Emblems';

export function ControlsPanel() {
  const controls = [
    { keys: ['A', 'D'], alt: 'or arrow keys', name: 'Move', detail: 'Follow the pilgrim’s road to the right.' },
    { keys: ['SPACE'], alt: 'press again in the air', name: 'Leap & double jump', detail: 'Hold for a higher leap. Jump again to reach distant ledges.' },
    { keys: ['J'], alt: 'or X / click', name: 'Prism strike', detail: 'Face your foe and strike. Hits replenish your lumen.' },
    { keys: ['SHIFT'], alt: 'or K', name: 'Sprint / lumen dash', detail: 'Burst forward and slip through danger, even in the air.' },
    { keys: ['Q'], alt: '33 lumen', name: 'Bind', detail: 'Weave lumen to restore two health lantern panes.' },
    { keys: ['F'], alt: '20 lumen', name: 'Thread cast', detail: 'Send a piercing prism across the room.' },
    { keys: ['E'], alt: 'near a bell, bench, or pilgrim', name: 'Interact', detail: 'Ring bells, listen to travellers, and rest to save.' },
  ];
  return <>
    <p className="panel-intro">Wake the three bells. Challenge the guardian. Find your way to the High Lantern.</p>
    <div className="controls-list">{controls.map(control => <div className="control-row" key={control.name}>
      <div className="control-keys">{control.keys.map(key => <kbd key={key}>{key}</kbd>)}</div>
      <div><h3>{control.name} <span>{control.alt}</span></h3><p>{control.detail}</p></div>
    </div>)}</div>
    <div className="panel-note"><Feather size={17} weight="light" /><span>There’s no hurry. Benches and awakened bells restore your health and save your journey.</span></div>
  </>;
}

export function MapPanel({ state, onTrack }) {
  const [selected, setSelected] = useState(state.region);
  const region = REGIONS[selected];
  const rooms = [
    'M35 111 68 111 68 74 168 74 168 95 206 95 206 161 177 161 177 197 100 197 100 176 35 176Z',
    'M228 95 268 95 268 50 323 50 323 72 365 72 365 161 331 161 331 183 249 183 249 155 228 155Z',
    'M388 74 430 74 430 38 484 38 484 58 520 58 520 137 489 137 489 164 416 164 416 143 388 143Z',
    'M546 57 579 57 579 23 640 23 640 57 674 57 674 148 647 148 647 168 579 168 579 139 546 139Z',
  ];
  const positions = [[112, 141], [294, 124], [453, 103], [609, 100]];
  return <>
    <div className="map-canvas">
      <span className="map-north">N<span>↑</span></span>
      <svg viewBox="0 0 710 244" role="img" aria-label={`Map of The Aerial Conservatory. You are in ${REGIONS[state.region].name}.`}>
        <defs><pattern id="map-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#a391a8" strokeOpacity=".045" /></pattern></defs>
        <rect width="710" height="244" fill="url(#map-grid)" />
        <path d="M205 129H229M365 121H389M520 102H546" stroke="#8f7d94" strokeWidth="2" strokeDasharray="3 5" />
        {rooms.map((d, i) => <g key={i}>
          <path d={d} fill={selected === i ? '#94749c1b' : '#19111b0c'} stroke={i === selected ? '#ceb8d4' : '#6c5a71'} strokeWidth={i === selected ? 1.6 : 1} opacity={i <= Math.max(state.region, state.bells.filter(Boolean).length) ? 1 : 0.35} />
          <text x={positions[i][0]} y="226" textAnchor="middle" fill={i === selected ? '#dedec9' : '#788675'} fontSize="9" letterSpacing="1.3">{REGIONS[i].name.toUpperCase()}</text>
          {i < 3 ? <g transform={`translate(${positions[i][0] - 6},${positions[i][1] - 12})`} fill="none" stroke={state.bells[i] ? '#dace9b' : '#ab99af'} strokeWidth="1.2"><path d="M3 4Q7-3 11 4Q9 10 15 15Q7 20-1 15Q5 10 3 4ZM7 18V22" />{state.bells[i] && <circle cx="7" cy="10" r="20" strokeOpacity=".2" />}</g> : <path d="m601 90 5 4 4-11 4 11 5-4-2 17h-14Z" stroke="#ab99af" fill="none" />}
        </g>)}
        <circle cx={positions[state.region][0] - 35 + ((state.x - REGIONS[state.region].from) / (REGIONS[state.region].to - REGIONS[state.region].from)) * 65} cy={positions[state.region][1] + 22} r="4.5" fill="#cd7970" />
        <circle cx={positions[state.region][0] - 35 + ((state.x - REGIONS[state.region].from) / (REGIONS[state.region].to - REGIONS[state.region].from)) * 65} cy={positions[state.region][1] + 22} r="10" fill="none" stroke="#cd7970" strokeOpacity=".3" />
      </svg>
      <div className="map-legend"><span><i className="you-dot" />You are here</span><span><BellMark />Pilgrim’s bell</span><span><span className="map-dashed" />Untraveled path</span></div>
    </div>
    <div className="map-tabs" role="tablist" aria-label="Select a region">{REGIONS.map((r, i) => <button key={r.name} role="tab" aria-selected={selected === i} onClick={() => setSelected(i)} className={selected === i ? 'selected' : ''}><span>0{i + 1}</span>{r.name}</button>)}</div>
    <div className="map-detail"><div><span className="eyebrow">{selected < 3 ? state.bells[selected] ? 'BELL AWAKENED' : 'A SONG YET TO BE HEARD' : state.bells.every(Boolean) ? 'THE WAY IS OPEN' : 'SEALED BY LUMEN'}</span><h3>{region.subtitle}</h3><p>{region.description}</p></div><button className="secondary-button" onClick={() => onTrack(selected)}><Compass size={17} />Track path<ArrowRight size={16} /></button></div>
  </>;
}

export function InventoryPanel({ state, onCraft }) {
  return <>
    <div className="inventory-summary"><span><Rosary /> <strong>{state.shells.toString().padStart(3, '0')}</strong> glass beads</span><span>{state.tools.length} / 3 tools crafted</span></div>
    <div className="inventory-layout">
      <div className="prism-display">
        <span className="eyebrow">YOUR FAITHFUL COMPANION</span>
        <div className="prism-art"><svg viewBox="0 0 260 265" fill="none" aria-hidden="true"><path d="M49 218 172 66 183 74Z" fill="#cbb9d0" /><path d="m51 216 124-145M166 74l21 14M176 66l28-30" stroke="#e1cee6" strokeWidth="1.5" /><ellipse cx="205" cy="35" rx="7" ry="11" transform="rotate(37 205 35)" stroke="#d4bfd9" strokeWidth="3" /><path d="M181 84C124 57 82 114 116 140C171 183 240 123 201 99C177 82 134 157 155 192C172 221 223 201 202 181C178 158 119 230 82 212" stroke="#a18da6" strokeOpacity=".4" strokeWidth="1" /><path d="m165 88-28 6 10 32 8-14 10 7-3-26 10-7" fill="#a6514e" /><path d="M173 69 180 75" stroke="#897b8d" strokeWidth="5" /></svg></div>
        <h3>{state.tools.includes('prism') ? 'Honed Prism' : 'Old Prism'}</h3>
        <p>A slender blade, a familiar weight.<br />Some things cannot be taken from you.</p>
        <div className="weapon-stat"><span>PRISM DAMAGE</span><strong>{state.tools.includes('prism') ? 'II' : 'I'}</strong></div>
      </div>
      <div className="crafting-tools"><div className="crafting-heading"><span className="eyebrow">THE CRAFTING BENCH</span><h3>Make the journey your own.</h3></div>
        {TOOLS.map(tool => { const owned = state.tools.includes(tool.id), afford = state.shells >= tool.cost; return <div className={`craft-row ${owned ? 'crafted' : ''}`} key={tool.id}>
          <div className="craft-icon">{tool.icon === 'prism' ? <Prism /> : tool.icon === 'heart' ? <Heart size={28} weight="light" /> : <LumenSpool />}</div>
          <div className="craft-info"><h4>{tool.name}</h4><p>{tool.description}</p><button className={`craft-button ${owned ? 'owned' : ''}`} disabled={owned || !afford} onClick={() => onCraft(tool.id)}>{owned ? <><Check size={13} />Equipped</> : <>Craft <Rosary />{tool.cost}</>}</button>{!owned && !afford && <span className="craft-shortfall">{tool.cost - state.shells} more glass beads needed</span>}</div>
        </div>; })}
      </div>
    </div>
    <div className="panel-note"><Feather size={17} weight="light" />Gather glass beads on hidden ledges and from fallen foes. Crafted tools stay with you.</div>
  </>;
}

const JOURNAL = [
  { title: 'A thread of hope', label: 'THE PILGRIMAGE', image: 'grotto', text: 'Taken from a familiar world, carried deep beneath a kingdom of lumen. Yet even here, among roots and broken stone, there is a path. Three bells sleep along the pilgrim’s road. Three voices that might break the silence.', note: 'Ring the Root, Petal, and Pilgrim bells, then face the guardian of the High Lantern.' },
  { title: 'The quiet below', label: 'MOSS GROTTO', image: 'grotto', text: 'The grotto breathes in shades of green. Its roots wind around the remains of a gilded cage, and its smallest creatures carry entire gardens on their backs. Someone has left a bench beside the road. Perhaps you are not the first to pass this way.', note: 'Mosslings are slow, but their shells are sturdy. Strike, step back, and strike again.' },
  { title: 'Petals in the dark', label: 'CORAL FOREST', image: 'coral', text: 'What looks like blossom is something older. Pale shapes drift between the branches while the forest answers every footstep with a faint, glassy sound. Follow it. The second bell waits where the boughs grow thin.', note: 'Wandering moths stay above the road. A well-timed jump or thread cast will reach them.' },
  { title: 'A crown of silence', label: 'THE BELLHART', image: 'peak', text: 'Long ago, the lamplighters gave every pilgrim a light to follow. Their lamps remain, though their keepers have fallen quiet. Beyond them stands the Condensation Engine, sworn to guard a kingdom that no longer remembers his name.', note: 'Watch the Warden’s stance. Leap over his charge, strike while he recovers, and jump the ripples after his landing.' },
];

export function JournalPanel({ state }) {
  const [entry, setEntry] = useState(0);
  const item = JOURNAL[entry];
  return <div className="journal-layout">
    <aside className="journal-index"><span className="eyebrow">PAGES FROM AERIAL CONSERVATORY</span>{JOURNAL.map((j, i) => <button key={j.title} className={entry === i ? 'selected' : ''} onClick={() => setEntry(i)}><span>0{i + 1}</span><span>{j.title}</span><ArrowRight size={14} /></button>)}<div className="journal-tally"><span><strong>{state.bells.filter(Boolean).length}</strong> bells awakened</span><span><strong>{state.kills}</strong> creatures bested</span><span><strong>{state.tools.length}</strong> tools crafted</span></div></aside>
    <article className="journal-page"><div className="journal-image" style={{ backgroundImage: 'url(/art/original-scene.png)' }} /><span className="eyebrow">{item.label}</span><h3>{item.title}</h3><p>{item.text}</p><blockquote><Feather size={18} weight="light" /><span>{item.note}</span></blockquote></article>
  </div>;
}

export function SettingsPanel({ sound, volume, motion, onSound, onVolume, onMotion, onRestart, onCredits, hasWon }) {
  const [confirm, setConfirm] = useState(false);
  return <>
    <div className="setting-row"><div><h3>Sound of the kingdom</h3><p>Ambient melodies and the sound of your journey.</p></div><button className={`toggle ${sound ? 'on' : ''}`} role="switch" aria-checked={sound} aria-label="Sound enabled" onClick={onSound}><span /></button></div>
    <div className="setting-row"><div><label htmlFor="volume">Master volume</label><p>Find your own quiet.</p></div><div className="volume-slider"><input id="volume" type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={event => onVolume(Number(event.target.value) / 100)} /><span>{Math.round(volume * 100)}%</span></div></div>
    <div className="setting-row"><div><h3>Gentle motion</h3><p>Reduce camera shake and ambient movement.</p></div><button className={`toggle ${motion ? 'on' : ''}`} role="switch" aria-checked={motion} aria-label="Reduce motion" onClick={onMotion}><span /></button></div>
    <div className="restart-section"><div><h3>A new beginning</h3><p>Your current bells, tools, and glass beads will reset.</p></div>{confirm ? <div className="restart-confirm"><button className="danger-button" onClick={() => onRestart(false)}>Begin again</button><button className="text-button" onClick={() => setConfirm(false)}>Keep my journey</button></div> : <button className="secondary-button" onClick={() => setConfirm(true)}>New journey<ArrowRight size={16} /></button>}</div>
    {hasWon && <div className="setting-row"><div><h3>Clear Glass</h3><p>A harder journey. Foes hit twice as hard, and defeat costs more.</p></div><button className="secondary-button" onClick={() => onRestart(true)}>Enter Clear Glass<Sword size={16} /></button></div>}
    <button className="text-button credits-link" onClick={onCredits}>About this adventure <ArrowRight size={14} /></button>
  </>;
}

export function CreditsPanel() {
  return <div className="credits-content"><Mask /><h3>Mothglass Ascent</h3><p>Vela is a lantern-headed paper moth tending the suspended conservatories above an apricot sea of clouds. Reopen the dew bells before the high lantern dims.</p><p>Original glasshouse illustration and independently designed canvas characters, prism tools and condensation mechanisms. Terrain, creatures, effects and ambient sound are generated in code.</p><p>The display typeface is DM Serif Display, distributed under the SIL Open Font License. Software and font notices are included in the project.</p></div>;
}
