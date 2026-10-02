/* XLR8 archive preview adapter. Original code, 0BSD. */
(() => {
  'use strict';
  const bindings = [];
  const changes = new Set();
  class Tweak {
    constructor({container, onChange}) { this.container = container; this.onChange = onChange || (() => {}); }
    register(type, object, property, options = {}) {
      const key = 's' + bindings.length + property[0].toUpperCase() + property.slice(1);
      const choices = (options.options || []).map(option => typeof option === 'object' ? option : {label:String(option),value:option});
      const definition = {key, label:options.label || property, type, default:object[property]};
      if (type === 'enum') { definition.choices = choices.map(option => option.label); definition.default = choices.find(option => option.value === object[property])?.label || choices[0].label; }
      if (type === 'number') Object.assign(definition, {min:options.min, max:options.max, step:options.step || 1});
      bindings.push({definition, object, property, choices, container:this.container, change:this.onChange});
      return this;
    }
    addSlider(o,k,c) { return this.register('number',o,k,c); }
    addToggle(o,k,c) { return this.register('boolean',o,k,c); }
    addSelect(o,k,c) { return this.register('enum',o,k,c); }
    addColorPicker(o,k,c) { return this.register('color',o,k,c); }
  }
  window.Tweak = Tweak;
  function set(binding, value) {
    binding.object[binding.property] = binding.definition.type === 'enum' ? binding.choices.find(option => option.label === value)?.value : value;
    changes.add(binding.change);
  }
  function flush() { for (const change of changes) change(); changes.clear(); }
  window.XLR8Archive = {
    finish(config) {
      for (const selection of config.select || []) {
        const element = document.querySelector(selection.selector);
        if (!element) throw new Error('Missing archive selection: ' + selection.selector);
        if (selection.value !== undefined) { element.value = selection.value; element.dispatchEvent(new Event('change', {bubbles:true})); }
        else element.click();
      }
      for (const [label,value] of Object.entries(config.fixed || {})) {
        const binding = bindings.find(item => item.definition.label === label);
        if (!binding) throw new Error('Missing archive setting: ' + label);
        set(binding,value); binding.fixed = true;
      }
      flush();
      for (const selector of config.remove || []) document.querySelectorAll(selector).forEach(element => element.remove());
      for (const selector of config.hide || []) document.querySelectorAll(selector).forEach(element => { element.dataset.archiveOmitted = ''; element.inert = true; });
      for (const selector of config.single || []) document.querySelectorAll(selector).forEach(element => { element.style.setProperty('grid-template-columns','minmax(0,1fr)'); });
      const visible = bindings.filter(binding => !binding.fixed && !binding.container?.closest('[data-archive-omitted]'));
      window.XLR8Archive.settings = visible.map(binding => binding.definition);
      // Static graphic studies expose their original tuning controls within the widget.
      if (config.controls && visible.length) {
        const panel = document.createElement('details'); panel.className='archive-settings'; panel.open=true;
        const title = document.createElement('summary'); title.textContent='Preview controls'; panel.append(title);
        for (const binding of visible) {
          const label = document.createElement('label'); const caption = document.createElement('span'); caption.textContent=binding.definition.label; label.append(caption);
          const type=binding.definition.type; const input=document.createElement(type==='enum'?'select':'input'); input.setAttribute('aria-label',binding.definition.label);
          if(type==='enum') for(const choice of binding.definition.choices) { const option=document.createElement('option');option.textContent=choice;input.append(option); }
          else input.type=type==='boolean'?'checkbox':type==='number'?'range':'color';
          if(type==='number') { input.min=binding.definition.min;input.max=binding.definition.max;input.step=binding.definition.step; }
          if(type==='boolean') input.checked=binding.definition.default; else input.value=binding.definition.default;
          const value=document.createElement('output'); if(type==='number') value.textContent=input.value;
          input.addEventListener('input',()=> { const v=type==='boolean'?input.checked:type==='number'?Number(input.value):input.value;set(binding,v);flush();if(type==='number')value.textContent=String(v); });
          binding.input=input; binding.output=value;label.append(input,value);panel.append(label);
        }
        document.body.append(panel);
      }
      window.XLR8Preview.connect(settings => {
        for (const binding of visible) {
          if (!(binding.definition.key in settings)) continue;
          const value=settings[binding.definition.key];set(binding,value);
          if(binding.input) { if(binding.definition.type==='boolean')binding.input.checked=value;else binding.input.value=value;if(binding.definition.type==='number')binding.output.textContent=String(value); }
        }
        flush();
      });
      document.documentElement.dataset.archiveReady='true';
    }
  };
})();
/* Local SVG marks for archive controls, drawn for XLR8 under 0BSD. */
(() => {
  const paths = {
    'x':'M6 6l12 12M18 6L6 18','plus':'M12 4v16M4 12h16','minus':'M4 12h16',
    'arrow-left':'M20 12H4m6-6-6 6 6 6','arrow-right':'M4 12h16m-6-6 6 6-6 6','arrow-up-right':'M5 19 19 5M5 5h14v14',
    'chevron-right':'m9 5 7 7-7 7','chevron-up':'m5 15 7-7 7 7','arrow-left-right':'M3 7h18M7 3 3 7l4 4M21 17H3m14-4 4 4-4 4',
    'corner-down-left':'M20 4v10H4m6-6-6 6 6 6','play':'m7 4 14 8-14 8Z','pause':'M7 4v16M17 4v16',
    'skip-back':'M4 4v16m16-16L6 12l14 8Z','skip-forward':'M20 4v16M4 4l14 8-14 8Z',
    'volume-2':'M3 9h4l5-5v16l-5-5H3Zm13-1q4 4 0 8m3-11q7 7 0 14','volume-x':'M3 9h4l5-5v16l-5-5H3Zm13 0 5 6m0-6-5 6',
    'headphones':'M4 15v-3a8 8 0 0 1 16 0v3M4 13h4v8H4Zm12 0h4v8h-4Z','speaker':'M6 3h12v18H6Zm6 7v.01M9 16a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
    'monitor':'M3 4h18v13H3Zm5 17h8m-4-4v4','terminal':'M3 4h18v16H3Zm3 4 4 4-4 4m7 0h5','code-2':'m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18',
    'folder':'M3 5h7l3 3h8v12H3Z','folder-open':'M3 17V5h7l3 3h8v3H7l-4 9h16l3-9',
    'file-text':'M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8m-8 4h8',
    'search':'M3 10a7 7 0 1 0 14 0 7 7 0 1 0-14 0m12 5 6 6','image':'M3 3h18v18H3Zm0 14 6-6 12 10M15 7h.01',
    'pin':'m9 2 8 2-2 7 4 5-7-1-5 7 2-9-4-3 4-1Z','trash-2':'M4 6h16M8 6V3h8v3M6 6l1 15h10l1-15m-8 4v7m4-7v7',
    'lock-keyhole':'M6 10h12v11H6Zm2 0V6a4 4 0 0 1 8 0v4m-4 4v3','power':'M12 2v10M6 5a9 9 0 1 0 12 0',
    'rotate-cw':'M20 4v6h-6m6 0A8 8 0 1 0 20 16','rotate-ccw':'M4 4v6h6m-6 0a8 8 0 1 1 0 6',
    'wifi':'M2 8q10-10 20 0M5 12q7-7 14 0m-11 4q4-4 8 0m-4 4h.01','bell':'M5 17h14l-2-4V8a5 5 0 0 0-10 0v5Zm5 4h4',
    'send':'m2 2 20 10-20 10 4-10Zm4 10h16','sun':'M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
    'list-music':'M3 5h10M3 10h10M3 15h6m9-10v13m0-13 4-1v5m-4 9a3 2 0 1 0-6 0 3 2 0 1 0 6 0',
    'sliders-horizontal':'M3 6h18M3 12h18M3 18h18M7 3v6m10 0v6m-7 0v6',
    'crosshair':'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0M12 1v7m0 8v7M1 12h7m8 0h7',
    'focus':'M2 8V2h6m8 0h6v6M2 16v6h6m8 0h6v-6M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
    'cpu':'M6 6h12v12H6Zm3 3h6v6H9ZM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4',
    'memory-stick':'M3 6h18v12H3ZM6 9v5m4-5v5m4-5v5m4-5v5M5 18v4m4-4v4m4-4v4m4-4v4',
    'hard-drive':'M3 15l3-11h12l3 11v6H3Zm0 0h18M6 18h.01m4 0h.01','usb':'M12 22V3m-4 4 4-4 4 4M12 18l-6-4V9m6 5 6-4V6',
    'eject':'m4 14 8-10 8 10ZM4 20h16','archive':'M3 3h18v5H3Zm2 5v13h14V8m-10 4h6',
    'globe':'M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0m0 0h20M12 2q-9 10 0 20 9-10 0-20',
    'scissors':'M3 5a3 3 0 1 0 6 0 3 3 0 1 0-6 0m0 14a3 3 0 1 0 6 0 3 3 0 1 0-6 0M8 7l13 14M8 17 21 3'
  };
  window.lucide = {createIcons({attrs={}}={}) {
    document.querySelectorAll('i[data-lucide]').forEach(element => {
      const name=element.dataset.lucide;const d=paths[name];if(!d)return;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      for(const attribute of element.attributes)svg.setAttribute(attribute.name,attribute.value);
      for(const [key,value] of Object.entries({viewBox:'0 0 24 24',width:18,height:18,fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',...attrs}))svg.setAttribute(key,String(value));
      const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);element.replaceWith(svg);
    });
  }};
})();
