/* No collection or network until Claude's confirmed transport is connected. */
(function () {
  'use strict';
  var transport=null, queue=[], sending=false, sessionId=null, interval=null, previousArea=null, clicks=new Map(), tracked=new Map();
  var areas=['home','dream','copa','radio','coins','midia'];
  function uuid(){return crypto.randomUUID();}
  function area(){return areas.includes(document.body.dataset.area)?document.body.dataset.area:'home';}
  function emit(type,target,seconds){if(!transport)return;var event={event_id:uuid(),session_id:sessionId,type:type,area:area(),target:target,occurred_at:new Date().toISOString()};if(seconds!==undefined)event.seconds=Math.round(seconds*1000)/1000;if(queue.length<200)queue.push(event);}
  async function flush(){if(!transport||sending||!queue.length)return;sending=true;var batch=queue.slice(0,30);try{await transport({schema:1,events:batch});queue.splice(0,batch.length);}catch(_){/* Keep the same IDs for bounded retry; never report success locally. */}finally{sending=false;}}
  function route(){if(!transport)return;var current=area();if(current!==previousArea){emit('area_view',current);previousArea=current;}}
  function targetFor(element){var action=element.closest('a,button');if(!action)return null;var custom=action.dataset.activity;if(custom&&/^[a-z][a-z0-9_-]{0,47}$/.test(custom))return custom;
    var ids=['btn-login','mini-ouvir','radio-crm','radio-live','copiar-pix','kinguin-loja','shop-explore','midia-atualizar','midia-mais'];if(ids.includes(action.id))return action.id;
    if(action.dataset.midiaFilter)return 'midia_filter_'+action.dataset.midiaFilter;
    if(action.matches('.menu a,.area-nav a'))return 'navigation';if(action.closest('.midia-actions'))return 'media_post_action';if(action.closest('.midia-social'))return null;if(action.closest('#radio-tracks'))return 'radio_track';if(action.closest('#planos'))return 'service_plan';if(action.closest('#carrossel'))return 'carousel';return null;
  }
  document.addEventListener('click',function(e){if(!transport||!e.isTrusted)return;var target=targetFor(e.target);if(!target)return;var now=performance.now();if(now-(clicks.get(target)||-Infinity)<500)return;clicks.set(target,now);emit('action_click',target);});
  function audible(media){return !media.paused&&!media.ended&&!media.seeking&&!media.muted&&media.volume>0&&media.readyState>=2&&(media.tagName==='AUDIO'||!document.hidden);}
  function mediaTarget(media){var post=media.closest('[id^="midia-post-"]');var track=(media.currentSrc||media.src||'').match(/\/assets\/radio\/(\d+)\.mp3(?:[?#]|$)/);return media.tagName==='AUDIO'?(track?'faixa-'+track[1]:'radio'):post?post.id:'video';}
  function attach(media){if(tracked.has(media))return;var state={time:media.currentTime||0,clock:performance.now(),eligible:false,seconds:0,started:false,target:mediaTarget(media)};tracked.set(media,state);
    function finish(){sample(media,state);if(state.seconds>0){emit(media.tagName==='AUDIO'?'audio_time':'video_time',state.target,state.seconds);state.seconds=0;}state.started=false;}
    media.addEventListener('playing',function(){if(transport&&!state.started&&audible(media)){state.started=true;emit(media.tagName==='AUDIO'?'audio_start':'video_start',mediaTarget(media));}state.time=media.currentTime;state.clock=performance.now();state.eligible=audible(media);});
    ['pause','ended','emptied','error'].forEach(function(name){media.addEventListener(name,finish);});
    ['waiting','seeking','volumechange','ratechange'].forEach(function(name){media.addEventListener(name,function(){sample(media,state);state.eligible=false;});});
  }
  function sample(media,state){var target=mediaTarget(media);if(target!==state.target){if(state.seconds>0)emit(media.tagName==='AUDIO'?'audio_time':'video_time',state.target,state.seconds);state.seconds=0;state.eligible=false;state.target=target;}var now=performance.now(),wall=(now-state.clock)/1000,delta=media.currentTime-state.time,rate=media.playbackRate||1;
    if(transport&&state.eligible&&audible(media)&&wall>0&&wall<3&&delta>0&&delta<=wall*rate+0.35){state.seconds+=Math.min(wall,delta/rate);}
    state.time=media.currentTime;state.clock=now;state.eligible=audible(media);
    if(state.seconds>=15){emit(media.tagName==='AUDIO'?'audio_time':'video_time',state.target,state.seconds);state.seconds=0;}
  }
  function tick(){document.querySelectorAll('audio,video').forEach(attach);tracked.forEach(function(state,media){sample(media,state);if(!media.isConnected){if(state.seconds>0)emit(media.tagName==='AUDIO'?'audio_time':'video_time',state.target,state.seconds);tracked.delete(media);}});}
  window.addEventListener('hashchange',route);document.addEventListener('visibilitychange',function(){if(!transport)return;tick();if(document.hidden){tracked.forEach(function(state,media){if(state.seconds>0){emit(media.tagName==='AUDIO'?'audio_time':'video_time',state.target,state.seconds);state.seconds=0;}});flush();}});
  window.addEventListener('pagehide',function(){if(!transport)return;tick();tracked.forEach(function(state,media){if(state.seconds>0){emit(media.tagName==='AUDIO'?'audio_time':'video_time',state.target,state.seconds);state.seconds=0;}});flush();});
  window.CRM_ACTIVITY={connect:function(send){if(typeof send!=='function'||transport)throw Error('Transporte já ligado ou inválido');transport=send;try{sessionId=sessionStorage.getItem('crm_visit_session');if(!/^[\da-f-]{36}$/i.test(sessionId||'')){sessionId=uuid();sessionStorage.setItem('crm_visit_session',sessionId);}}catch(_){sessionId=uuid();}emit('site_entry','site');route();tick();var ticks=0;interval=setInterval(function(){tick();if(++ticks%15===0)flush();},1000);flush();},flush:flush};
})();
