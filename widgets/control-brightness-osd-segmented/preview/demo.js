
(() => {
  const root = document.getElementById('ts-level-preview');
  const state = { volume:68, brightness:45, meter:'Segmented', corners:true };
  for (const kind of ['volume','brightness']) {
    const meter = root.querySelector(`[data-${kind}-meter]`);
    for (let i=0; i<30; i++) { const segment=document.createElement('span'); segment.setAttribute('aria-hidden','true'); meter.appendChild(segment); }
  }
  function render() {
    root.dataset.meter=state.meter;
    root.dataset.corners=String(state.corners);
    for (const kind of ['volume','brightness']) {
      const value=Math.max(0,Math.min(100,Math.round(state[kind])));
      root.querySelector(`[data-${kind}-value]`).textContent=String(value);
      const meter=root.querySelector(`[data-${kind}-meter]`);
      meter.setAttribute('aria-valuenow',String(value));
      const filled=Math.round(value/100*30);
      Array.from(meter.children).forEach((segment,i) => { segment.dataset.filled=String(i<filled); segment.dataset.tip=String(filled>0 && i===filled-1); });
    }
  }
  render();
  if (globalThis.Tweak) {
    const tweak = new Tweak({container:root,onChange:render});
    tweak.addSlider(state,'volume',{label:'Preview volume',min:0,max:100,unit:'%'});
    tweak.addSlider(state,'brightness',{label:'Preview brightness',min:0,max:100,unit:'%'});
    tweak.addSelect(state,'meter',{label:'Meter style',options:['Segmented','Continuous']});
    tweak.addToggle(state,'corners',{label:'Corner brackets'});
  }
})();


window.XLR8Archive.finish({"fixed": {"Meter style": "Segmented"}, "hide": [".ts-osd:nth-of-type(1)"], "controls": true, "omit": ["Preview volume"]});
