
    (()=>{
      const root=document.getElementById('ts-menu-researched');
      const apps=[
        {id:1,name:'1Password',command:'1password',category:'OFFICE',glyph:'≡'},
        {id:2,name:'Aether',command:'aether',category:'SYSTEM',glyph:'◇'},
        {id:3,name:'Alacritty',command:'alacritty',category:'SYSTEM',glyph:'▸'},
        {id:4,name:'Avahi SSH Server Browser',command:'bssh',category:'NETWORK',glyph:'○'},
        {id:5,name:'Avahi VNC Server Browser',command:'bvnc',category:'NETWORK',glyph:'○'},
        {id:6,name:'Avahi Zeroconf Browser',command:'avahi-discover',category:'NETWORK',glyph:'○'},
        {id:7,name:'Brave',command:'brave-browser',category:'NETWORK',glyph:'○'},
        {id:8,name:'btop++',command:'btop',category:'SYSTEM',glyph:'▲'},
        {id:9,name:'Calculator',command:'gnome-calculator',category:'OFFICE',glyph:'≡'},
        {id:10,name:'ChatGPT',command:'chatgpt',category:'NETWORK',glyph:'⌥'}
      ];
      const cats=['ALL','DEVELOP','SYSTEM','NETWORK','OFFICE','GRAPHICS','GAMES','OTHER'];
      const state={style:'a',selected:5,category:'ALL',query:'',grid:10};
      const list=root.querySelector('.mr-list');
      const live=root.querySelector('.mr-live');
      const num=id=>String(id).padStart(2,'0');
      const esc=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const shown=()=>apps.filter(app=>(state.category==='ALL'||app.category===state.category)&&`${app.name} ${app.command}`.toLowerCase().includes(state.query.toLowerCase()));
      const count=cat=>cat==='ALL'?apps.length:apps.filter(app=>app.category===cat).length;
      root.querySelector('.mr-sidebar').innerHTML=cats.map(cat=>`<button type="button" class="mr-category" data-category="${cat}" aria-pressed="${cat==='ALL'}" ${count(cat)?'':'disabled'}><span class="mr-category-label">${cat}</span><span class="mr-category-count">${num(count(cat))}</span></button>`).join('')+'<div class="mr-node-count"><span>10/10 NODES</span><div class="mr-nodes-line" aria-hidden="true"></div></div>';
      function select(id,announce=false){
        state.selected=id;
        list.querySelectorAll('[data-app]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.app)===id)));
        if(announce){const app=apps.find(item=>item.id===id);live.textContent=app?`${app.name} selected`:'No matching applications';}
      }
      function renderList(){
        const filtered=shown();
        if(!filtered.some(app=>app.id===state.selected))state.selected=filtered[0]?.id??null;
        list.innerHTML=filtered.length?filtered.map(app=>`<button type="button" class="mr-row" data-app="${app.id}" aria-label="Preview launch ${esc(app.name)}" aria-pressed="${app.id===state.selected}" style="--mr-x:${[0,-6,-3,-10,-1,-7,-4,-9,-2][app.id%9]}px;--mr-y:${[-1,-3,2,3,-2,2,-3,1,0][app.id%9]}px;--mr-tag-spacing:${[1.2,.6,1.3,.7,1.5,.9,1.1,.6,1.4][app.id%9]}px"><span class="mr-number">${num(app.id)}</span><span class="mr-icon" aria-hidden="true">${app.glyph}</span><span class="mr-copy"><span class="mr-name">${esc(app.name)}</span><span class="mr-command">${esc(app.command)}</span></span><span class="mr-tag">${app.category}</span><span class="mr-diamond" aria-hidden="true"></span></button>`).join(''):'<p class="mr-empty">No matching applications.</p>';
        root.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===state.category)));
        root.querySelector('.mr-node-count span').textContent=`${num(filtered.length)}/10 NODES`;
      }
      function renderStyle(){
        root.dataset.style=state.style;
        root.querySelectorAll('[data-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.choice===state.style)));
        root.style.setProperty('--mr-grid',`rgba(204,21,21,${state.grid/100})`);
      }
      root.addEventListener('click',event=>{
        const choice=event.target.closest('[data-choice]');
        if(choice){state.style=choice.dataset.choice;renderStyle();return;}
        const category=event.target.closest('[data-category]');
        if(category){state.category=category.dataset.category;renderList();live.textContent=`${shown().length} applications in ${state.category.toLowerCase()}`;return;}
        const row=event.target.closest('[data-app]');
        if(row){select(Number(row.dataset.app));live.textContent=`Preview only. ${apps.find(app=>app.id===state.selected).name} would launch.`;return;}
        const action=event.target.closest('[data-action]');
        if(action)live.textContent=`Preview only. ${action.dataset.action} was not executed.`;
      });
      list.addEventListener('pointerover',event=>{
        if(event.pointerType!=='mouse')return;
        const row=event.target.closest('[data-app]');
        if(row&&Number(row.dataset.app)!==state.selected)select(Number(row.dataset.app));
      });
      root.querySelector('input').addEventListener('input',event=>{state.query=event.target.value;renderList();live.textContent=`${shown().length} matching applications`;});
      root.querySelector('.mr-main').addEventListener('keydown',event=>{
        const filtered=shown();if(!filtered.length)return;
        if(event.key==='Enter'&&event.target.matches('input')){event.preventDefault();live.textContent=`Preview only. ${apps.find(app=>app.id===state.selected).name} would launch.`;return;}
        if(!['ArrowUp','ArrowDown'].includes(event.key))return;
        event.preventDefault();const at=filtered.findIndex(app=>app.id===state.selected);select(filtered[(at+(event.key==='ArrowDown'?1:-1)+filtered.length)%filtered.length].id,true);
        if(!event.target.matches('input'))list.querySelector(`[data-app="${state.selected}"]`).focus({preventScroll:true});
      });
      renderList();renderStyle();
      if(globalThis.Tweak){const tweak=new Tweak({container:root.querySelector('.mr-menu'),onChange:renderStyle});tweak.addSlider(state,'grid',{label:'Grid visibility',min:6,max:16,step:1,unit:'%'});}
    })();


window.XLR8Archive.finish({"select": [{"selector": "button[data-choice=\"a\"]"}], "remove": ["button[data-choice]"], "controls": false});
