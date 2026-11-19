window.__ModuleLoader__.load({
  id: 'dsh-story-desk',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const API = '/story-desk'
    const MAIN_KEY = 'story-desk'
    const PANEL_ID = 'story-desk'

    const STYLE = `
.sd-root{display:flex;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.sd-rail{width:228px;flex:0 0 228px;display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-layer-1))}
.sd-rail-head{display:flex;align-items:center;gap:8px;padding:14px 12px 10px}
.sd-rail-title{flex:1;font-weight:600;font-size:13px;letter-spacing:.01em}
.sd-rail-list{flex:1;overflow:auto;padding:0 8px 12px;display:flex;flex-direction:column;gap:4px}
.sd-item{display:block;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:inherit;border-radius:8px;padding:8px 9px;cursor:pointer;font:inherit}
.sd-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.sd-item[data-on="1"]{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}
.sd-item-title{font-weight:550;line-height:1.35;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-item-meta{display:flex;gap:6px;align-items:center;margin-top:3px;color:var(--dsw-alias-label-tertiary);font-size:11px}
.sd-pane{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}
.sd-head{padding:16px 22px 0;display:flex;flex-direction:column;gap:12px}
.sd-head-row{display:flex;align-items:flex-start;gap:12px}
.sd-head-title{flex:1;min-width:0}
.sd-h1{font-size:17px;font-weight:650;margin:0;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;margin-top:4px;line-height:1.5}
.sd-stages{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.sd-stage{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);background:transparent}
.sd-stage[data-state="done"]{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 40%,transparent)}
.sd-stage[data-state="now"]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 9%,transparent)}
.sd-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sd-btn{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex:0 0 auto;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:7px;padding:6px 11px;font:inherit;font-size:12px;cursor:pointer;line-height:1.4}
.sd-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.sd-btn:disabled{opacity:.45;cursor:not-allowed}
.sd-btn[data-kind="primary"]{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));border-color:transparent;color:#fff}
.sd-btn[data-kind="primary"]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary))}
.sd-btn[data-kind="ghost"]{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.sd-btn[data-kind="ghost"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.sd-body{flex:1;min-height:0;overflow:auto;padding:16px 22px 28px}
.sd-progress{height:3px;border-radius:2px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.sd-progress-bar{height:100%;background:var(--dsw-alias-brand-primary);transition:width .3s ease}
.sd-taskline{display:flex;align-items:center;gap:10px;margin-top:8px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.sd-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:11px;display:flex;gap:12px;margin-bottom:9px}
.sd-thumb{width:84px;height:147px;flex:0 0 84px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);object-fit:cover;display:block}
.sd-thumb-empty{width:84px;height:147px;flex:0 0 84px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);font-size:11px}
.sd-card-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.sd-card-top{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.sd-idx{font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsw-alias-label-secondary)}
.sd-text{width:100%;box-sizing:border-box;resize:vertical;min-height:56px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;padding:7px 8px;font:inherit;font-size:12.5px;line-height:1.65}
.sd-text:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.sd-prompt{width:100%;box-sizing:border-box;resize:vertical;min-height:34px;border:1px dashed var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:6px;padding:6px 8px;font:inherit;font-size:11.5px;line-height:1.55}
.sd-prompt:focus{outline:none;border-color:var(--dsw-alias-border-l2)}
.sd-card-foot{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.sd-audio{height:28px;flex:1;min-width:150px;max-width:320px}
.sd-tag{font-size:10.5px;padding:1px 6px;border-radius:4px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary)}
.sd-tag[data-tone="ok"]{color:var(--dsw-alias-state-success-primary)}
.sd-tag[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.sd-empty{border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;padding:28px 20px;text-align:center;color:var(--dsw-alias-label-tertiary);line-height:1.7}
.sd-video{width:100%;max-width:290px;border-radius:10px;display:block;background:#000}
.sd-render{display:flex;gap:16px;align-items:flex-start;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:13px;margin-bottom:14px}
.sd-render-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.sd-kicker{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.sd-mask{position:fixed;inset:0;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;z-index:60}
.sd-dialog{width:min(560px,92vw);max-height:86vh;overflow:auto;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:18px;box-shadow:0 18px 48px rgba(0,0,0,.28)}
.sd-dialog h3{margin:0 0 4px;font-size:14px;font-weight:650}
.sd-field{display:flex;flex-direction:column;gap:5px;margin-top:12px}
.sd-field label{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.sd-input,.sd-select{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;padding:7px 8px;font:inherit;font-size:12.5px}
.sd-input:focus,.sd-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
/* 原生下拉的弹层不继承 select 的背景，只继承文字色：不显式给 option 上色就是白底白字 */
.sd-select option{background-color:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px}

.sd-textarea{min-height:96px;resize:vertical;line-height:1.6}
.sd-row{display:flex;gap:10px;align-items:flex-start}
.sd-row>.sd-field{align-self:flex-start;width:100%}
.sd-row>*{min-width:0}
.sd-hint{font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.6}
.sd-section{margin-top:16px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1)}
.sd-section:first-of-type{margin-top:12px;padding-top:0;border-top:none}
.sd-section-title{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);margin-bottom:8px;font-weight:600}
.sd-imgzoom{cursor:zoom-in;transition:opacity .15s}
.sd-imgzoom:hover{opacity:.88}
.sd-lightbox{position:fixed;inset:0;z-index:80;background:rgba(8,10,14,.965);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none}
.sd-lightbox img{max-width:none;max-height:none;width:auto;height:auto;max-width:92vw;max-height:88vh;user-select:none;-webkit-user-drag:none;will-change:transform;box-shadow:0 16px 48px rgba(0,0,0,.55);background:#0d1017;border-radius:4px}
.sd-lb-bar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:12px;padding:11px 16px;color:#fff;font-size:12px;background:rgba(8,10,14,.92);border-bottom:1px solid rgba(255,255,255,.08)}
.sd-lb-title{font-weight:600}
.sd-lb-meta{color:rgba(255,255,255,.55);font-size:11px}
.sd-lb-close{margin-left:auto;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;border-radius:6px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer}
.sd-lb-close:hover{background:rgba(255,255,255,.18)}
.sd-lb-hint{position:absolute;bottom:14px;left:0;right:0;text-align:center;color:rgba(255,255,255,.5);font-size:11px;pointer-events:none}
.sd-tabnav{display:flex;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l1);margin-top:2px}
.sd-tabnav-btn{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12.5px;padding:8px 13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;line-height:1.4;white-space:nowrap}
.sd-tabnav-btn:hover{color:var(--dsw-alias-label-primary)}
.sd-tabnav-btn[data-on="1"]{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.sd-tabnav-btn[data-done="1"]{color:var(--dsw-alias-state-success-primary)}
.sd-tabnav-btn[data-on="1"][data-done="1"]{color:var(--dsw-alias-brand-primary)}
.sd-tabnav-mark{font-size:11px;opacity:.9}
.sd-card-block{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:13px 14px;margin-bottom:14px}
.sd-block-title{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);font-weight:600;margin-bottom:10px}
.sd-voices{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.sd-voice-row{display:flex;align-items:center;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:7px 10px;background:var(--dsw-alias-bg-layer-1)}
.sd-voice-row[data-on="1"]{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,transparent)}
.sd-voice-row{cursor:pointer}
.sd-voice-row[data-blocked="1"]{cursor:default;opacity:.65}
.sd-voice-row:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 5%,transparent)}
.sd-voice-pick{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
.sd-voice-name{font-size:13px;font-weight:600;flex:0 0 auto}
.sd-voice-note{font-size:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-voice-audio{width:220px;height:30px;flex:0 0 220px}
.sd-anchor{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px 13px;margin-bottom:12px}
.sd-anchor[data-approved="1"]{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 42%,transparent)}
.sd-anchor-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.sd-anchor-name{font-weight:600;font-size:13px}
.sd-anchor-body{display:flex;gap:14px;align-items:flex-start}
.sd-anchor-figure{width:132px;flex:0 0 132px}
.sd-anchor-img{width:132px;height:232px;object-fit:cover;border-radius:8px;display:block;background:var(--dsw-alias-bg-layer-2)}
.sd-anchor-empty{width:132px;height:232px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dsw-alias-label-tertiary);text-align:center}
.sd-anchor-thumbs{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
.sd-anchor-thumb{width:38px;height:66px;border:2px solid transparent;border-radius:5px;overflow:hidden;padding:0;background:none;cursor:pointer;flex:0 0 38px;line-height:0}
.sd-anchor-thumb[data-on="1"]{border-color:var(--dsw-alias-brand-primary)}
.sd-anchor-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.sd-anchor-main{flex:1;min-width:0}
.sd-refs{margin-top:8px;display:flex;flex-direction:column;gap:5px}
.sd-ref{display:flex;gap:8px;align-items:baseline;font-size:11.5px;border-left:2px solid var(--dsw-alias-border-l2);padding-left:8px;line-height:1.5}
.sd-ref-title{color:var(--dsw-alias-label-primary);flex:0 1 auto;max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-ref-url{color:var(--dsw-alias-label-tertiary);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-ref-err{color:var(--dsw-alias-state-warn-primary);font-size:10.5px;white-space:nowrap}
.sd-card[data-mode="script"] .sd-thumb,.sd-card[data-mode="script"] .sd-thumb-empty{width:132px;height:232px;flex:0 0 132px}
.sd-readtext{font-size:12.5px;line-height:1.75;color:var(--dsw-alias-label-primary);white-space:pre-wrap}
.sd-readprompt.sd-editable{width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);padding:7px 9px;font:inherit;font-size:11.5px;line-height:1.65;color:var(--dsw-alias-label-secondary);resize:vertical;margin-top:4px}
.sd-readprompt.sd-editable:focus{outline:none;border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.sd-lastprompt{margin-top:6px;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.sd-lastprompt summary{cursor:pointer;user-select:none}
.sd-lastprompt>div{margin-top:4px;padding:6px 8px;background:var(--dsw-alias-bg-layer-2);border-radius:6px;line-height:1.6;word-break:break-word;white-space:pre-wrap;max-height:120px;overflow:auto}
.sd-fixrow{display:flex;gap:6px;align-items:center;margin-top:7px}
.sd-fixrow .sd-input{flex:1;min-width:0}
.sd-fixrow .sd-btn{flex:0 0 auto}
.sd-readprompt{font-size:11.5px;line-height:1.65;color:var(--dsw-alias-label-tertiary);border-left:2px solid var(--dsw-alias-border-l2);padding-left:8px;margin-top:2px}
.sd-config{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:12px 13px}
.sd-config-title{font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary);font-weight:600;margin-bottom:10px}
.sd-config-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:10px 14px;align-items:start}
.sd-config .sd-field{margin-top:0}
.sd-config .sd-hint{margin-top:2px}
.sd-samples{margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}
.sd-style-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.sd-style{flex:0 0 82px;width:82px;border:2px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;cursor:pointer;background:transparent;padding:0;line-height:0}
.sd-style[data-on="1"]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent)}
.sd-style img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block}
.sd-style-name{font-size:10.5px;text-align:center;padding:4px 2px;line-height:1.3;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}
.sd-style[data-on="1"] .sd-style-name{color:var(--dsw-alias-brand-primary)}
.sd-voice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:7px}
.sd-voice{display:flex;align-items:center;gap:7px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:5px 8px;background:transparent;color:inherit;font:inherit;font-size:11.5px;cursor:pointer;text-align:left}
.sd-voice:hover{border-color:var(--dsw-alias-border-l2)}
.sd-voice[data-on="1"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.sd-voice audio{height:24px;flex:1;min-width:0}
.sd-item{position:relative}
.sd-item-del{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:20px;height:20px;padding:0;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:15px;line-height:1;cursor:pointer;opacity:0;transition:opacity .12s}
.sd-item:hover .sd-item-del,.sd-item-del:focus-visible{opacity:1}
.sd-item-del:hover{background:var(--dsw-alias-state-error-base, #c0392b);color:#fff}
.sd-item:hover .sd-item-meta{padding-right:22px}
.sd-rail-foot{margin-top:auto;padding:8px 10px;border-top:1px solid var(--dsw-alias-border-l1)}
.sd-trash-link{width:100%;display:flex;align-items:center;gap:6px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;padding:5px 2px;cursor:pointer;border-radius:5px}
.sd-trash-link:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sd-trash-count{margin-left:auto;min-width:17px;height:17px;line-height:17px;text-align:center;border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);font-size:10px;padding:0 5px}
.sd-trash-row{display:flex;align-items:center;gap:10px;padding:9px 2px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.sd-trash-row:last-child{border-bottom:none}
.sd-trash-main{flex:1;min-width:0}
.sd-trash-name{font-size:12.5px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-trash-meta{font-size:11px;color:var(--dsw-alias-label-tertiary);margin-top:3px}
.sd-chat{width:300px;flex:0 0 300px;display:flex;flex-direction:column;min-height:0;border-left:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.sd-chat[data-open="0"]{width:40px;flex:0 0 40px}
.sd-chat-railbtn{width:100%;height:100%;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:14px;font:inherit;font-size:11px;writing-mode:vertical-rl}
.sd-chat-railbtn:hover{color:var(--dsw-alias-label-primary)}
.sd-chat-head{display:flex;align-items:center;gap:8px;padding:11px 12px 9px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.sd-chat-title{flex:1;font-weight:600;font-size:12.5px}
.sd-chat-model{font-size:10.5px;color:var(--dsw-alias-label-tertiary);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-chat-log{flex:1;min-height:0;overflow:auto;padding:12px}
.sd-msg{padding:7px 9px;border-radius:8px;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin-bottom:8px;max-width:94%}
.sd-msg[data-role="user"]{margin-left:auto;background:var(--dsw-alias-interactive-bg-hover)}
.sd-msg[data-role="assistant"]{background:var(--dsw-alias-bg-layer-2)}
.sd-chat-empty{color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:1.8}
.sd-chat-foot{border-top:1px solid var(--dsw-alias-border-l1);padding:9px 10px;display:flex;flex-direction:column;gap:7px}
.sd-chat-input{width:100%;box-sizing:border-box;resize:none;min-height:58px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:7px;padding:7px 8px;font:inherit;font-size:12px;line-height:1.6}
.sd-chat-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.sd-chat-actions{display:flex;align-items:center;gap:8px}
.sd-tabs{display:flex;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l1);margin:14px 0 12px}
.sd-tab{border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12.5px;padding:7px 13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;line-height:1.5}
.sd-tab:hover{color:var(--dsw-alias-label-primary)}
.sd-tab[data-on="1"]{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.sd-tabpanel{min-height:320px}
.sd-dialog-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
.sd-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.6;margin-top:8px;word-break:break-word}
.sd-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-idle-primary);flex:0 0 auto}
.sd-dot[data-on="1"]{background:var(--dsw-alias-state-success-primary)}
`

    // ------------------------------------------------------------------ 工具

    async function api(path, options) {
      const response = await fetch(`${API}/${path}`, {
        headers: { 'content-type': 'application/json' },
        ...options,
      })
      let body = null
      try {
        body = await response.json()
      } catch {
        body = null
      }
      if (!response.ok) throw new Error(body?.error || `请求失败（HTTP ${response.status}）`)
      return body
    }

    const post = (path, payload) => api(path, { method: 'POST', body: JSON.stringify(payload ?? {}) })

    /** version 用来破缓存：同名图片重出后 URL 跟着变，浏览器才会真去重新取。 */
    function mediaUrl(itemId, rel, version) {
      const url = `${API}/media/${itemId}/${String(rel).split('/').map(encodeURIComponent).join('/')}`
      return version ? `${url}?v=${version}` : url
    }

    function formatSecs(value) {
      const total = Math.max(0, Math.round(Number(value) || 0))
      const minutes = Math.floor(total / 60)
      const secs = total % 60
      return minutes ? `${minutes} 分 ${secs} 秒` : `${secs} 秒`
    }

    function stageIndex(stageId, stages) {
      const index = stages.findIndex(row => row.id === stageId)
      return index < 0 ? 0 : index
    }

    // ------------------------------------------------------------------ 图标

    function DeskIcon({ size = 18 }) {
      // 卷轴 + 声波：说书
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { display: 'block' },
      },
      h('path', { d: 'M4 5.5h11a2.5 2.5 0 0 1 0 5H4z' }),
      h('path', { d: 'M4 10.5h9v8H4z' }),
      h('path', { d: 'M13 14.5c1.4 1.6 1.4 3.4 0 5' }),
      h('path', { d: 'M16 13c2.6 2.6 2.6 5.4 0 8' }))
    }

    function GearIcon() {
      return h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true, style: { display: 'block' } },
        h('circle', { cx: 12, cy: 12, r: 3 }),
        h('path', { d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }))
    }

    // ------------------------------------------------------------------ 主组件

    function StoryDesk() {
      const [data, setData] = useState(null)
      const [error, setError] = useState(null)
      const [currentId, setCurrentId] = useState(null)
      const [creating, setCreating] = useState(false)
      const [settingsOpen, setSettingsOpen] = useState(false)
      const [busy, setBusy] = useState(false)
      const [notice, setNotice] = useState(null)
      const [pendingDelete, setPendingDelete] = useState(null)
      const [deletingBusy, setDeletingBusy] = useState(false)
      const [trashOpen, setTrashOpen] = useState(false)
      const [chatOpen, setChatOpen] = useState(true)
      const [chatInput, setChatInput] = useState('')
      const [sending, setSending] = useState(false)
      const timer = useRef(null)

      const load = useCallback(async () => {
        try {
          const next = await api('state')
          setData(next)
          setError(null)
          setCurrentId(prev => {
            if (prev && next.items.some(row => row.id === prev)) return prev
            return next.items[0]?.id ?? null
          })
          return next
        } catch (err) {
          setError(err.message)
          return null
        }
      }, [])

      useEffect(() => { load() }, [load])

      const anyRunning = Boolean(data?.items?.some(row => row.task?.running))
      useEffect(() => {
        if (!anyRunning) {
          if (timer.current) { clearInterval(timer.current); timer.current = null }
          return undefined
        }
        if (timer.current) return undefined
        timer.current = setInterval(() => { load() }, 1500)
        return () => {
          if (timer.current) { clearInterval(timer.current); timer.current = null }
        }
      }, [anyRunning, load])

      const current = useMemo(
        () => data?.items?.find(row => row.id === currentId) ?? null,
        [data, currentId],
      )

      const run = useCallback(async (path, payload, label) => {
        setBusy(true)
        setNotice(null)
        try {
          await post(path, payload)
          if (label) setNotice(label)
          await load()
        } catch (err) {
          setNotice({ tone: 'error', text: err.message })
        } finally {
          setBusy(false)
        }
      }, [load])

      const sendChat = useCallback(async () => {
        const text = chatInput.trim()
        if (!text || sending) return
        setChatInput('')
        setSending(true)
        setNotice(null)
        // 先把用户这句显示出来，别让它等请求回来才出现
        setData(prev => (prev
          ? { ...prev, chat: [...(prev.chat ?? []), { id: `local-${Date.now()}`, role: 'user', text, at: new Date().toISOString() }] }
          : prev))
        try {
          const result = await post('chat', { itemId: currentId, message: text })
          await load()
          if (result.applied) setNotice(`助手改了 ${result.applied} 段，改过文字的段需要重新配音`)
        } catch (err) {
          setNotice({ tone: 'error', text: err.message })
          await load()
        } finally {
          setSending(false)
        }
      }, [chatInput, sending, currentId, load])

      const clearChat = useCallback(async () => {
        try {
          await post('chat/clear', {})
          await load()
        } catch {
          // 清空失败不影响使用
        }
      }, [load])

      if (error) {
        return h('div', { className: 'sd-root' },
          h('div', { className: 'sd-pane' },
            h('div', { className: 'sd-head' }, h('div', { className: 'sd-h1' }, '说书工作台')),
            h('div', { className: 'sd-body' },
              h('div', { className: 'sd-empty' },
                h('div', null, `工作台加载失败：${error}`),
                h('div', { style: { marginTop: 12 } },
                  h('button', { className: 'sd-btn', onClick: () => load() }, '重试'))))))
      }

      if (!data) {
        return h('div', { className: 'sd-root' },
          h('div', { className: 'sd-pane' },
            h('div', { className: 'sd-body', style: { paddingTop: 48, color: 'var(--dsw-alias-label-tertiary)' } }, '正在打开工作台…')))
      }

      return h(React.Fragment, null,
        h('style', null, STYLE),
        h('div', { className: 'sd-root' },
          h(Rail, {
            items: data.items, currentId, onPick: setCurrentId,
            onCreate: () => setCreating(true),
            onDelete: item => setPendingDelete(item),
            trashCount: data.trashCount ?? 0,
            onOpenTrash: () => setTrashOpen(true),
          }),
          h('div', { className: 'sd-pane' },
            current
              ? h(Project, {
                  item: current, data, busy, notice,
                  onAction: run, onReload: load, onSettings: () => setSettingsOpen(true),
                })
              : h(EmptyState, { onCreate: () => setCreating(true), model: data.model })),
          // 助手栏已按需求移除：chat 相关逻辑保留，界面不再渲染
          pendingDelete ? h(ConfirmDelete, {
            item: pendingDelete,
            days: data.trashDays ?? 7,
            busy: deletingBusy,
            onCancel: () => setPendingDelete(null),
            onConfirm: async () => {
              setDeletingBusy(true)
              try {
                await post('remove', { id: pendingDelete.id })
                setPendingDelete(null)
                // 删的正好是当前打开的项目，就回到空状态
                if (pendingDelete.id === currentId) setCurrentId(null)
                await load()
                setNotice('已移入回收站，7 天内可还原')
              } catch (err) {
                setNotice({ tone: 'error', text: err.message })
              } finally {
                setDeletingBusy(false)
              }
            },
          }) : null,
          trashOpen ? h(TrashDialog, {
            onClose: () => setTrashOpen(false),
            onChanged: load,
          }) : null,
          settingsOpen ? h(SettingsDialog, {
            data, onClose: () => setSettingsOpen(false),
            onSaved: async () => { await load(); setSettingsOpen(false) },
          }) : null,
          creating ? h(NewDialog, {
            onClose: () => setCreating(false),
            onCreate: async payload => {
              try {
                const result = await post('create', payload)
                setCreating(false)
                await load()
                if (result?.id) setCurrentId(result.id)
                setNotice('项目建好了，点「写稿」开始')
              } catch (err) {
                setNotice({ tone: 'error', text: err.message })
              }
            },
          }) : null))
    }

    // ------------------------------------------------------------------ 右侧助手

    function ChatPanel({ data, itemId, open, onToggle, input, setInput, sending, onSend, onClear }) {
      const logRef = useRef(null)
      const messages = data.chat ?? []

      useEffect(() => {
        const node = logRef.current
        if (node) node.scrollTop = node.scrollHeight
      }, [messages.length, sending])

      if (!open) {
        return h('div', { className: 'sd-chat', 'data-open': '0' },
          h('button', { className: 'sd-chat-railbtn', type: 'button', onClick: onToggle, title: '打开助手' },
            h(DeskIcon, { size: 15 }), '助手'))
      }

      const submit = () => { if (!sending && input.trim()) onSend() }

      return h('div', { className: 'sd-chat', 'data-open': '1' },
        h('div', { className: 'sd-chat-head' },
          h('span', { className: 'sd-chat-title' }, '助手'),
          h('span', { className: 'sd-chat-model', title: data.model ? `${data.model.provider} · ${data.model.model}` : '没有可用模型' },
            data.model ? data.model.model : '无模型'),
          messages.length ? h('button', {
            className: 'sd-btn', 'data-kind': 'ghost', style: { padding: '2px 6px', fontSize: 11 },
            title: '清空对话', onClick: onClear,
          }, '清空') : null,
          h('button', {
            className: 'sd-btn', 'data-kind': 'ghost', style: { padding: '2px 6px', fontSize: 11 },
            title: '收起', onClick: onToggle,
          }, '›')),
        h('div', { className: 'sd-chat-log', ref: logRef },
          messages.length
            ? messages.map(row => h('div', {
                key: row.id, className: 'sd-msg', 'data-role': row.role === 'user' ? 'user' : 'assistant',
              }, row.text))
            : h('div', { className: 'sd-chat-empty' },
                itemId
                  ? '问它改稿就行，比如：第三段太长，砍到一百字以内；第二段画面换成夜里的玄武门。改完那几段会自动标成需要重配音。'
                  : '先选一个项目，再让它改稿。'),
          sending ? h('div', { className: 'sd-msg', 'data-role': 'assistant', style: { opacity: 0.7 } }, '正在想…') : null),
        h('div', { className: 'sd-chat-foot' },
          h('textarea', {
            className: 'sd-chat-input', value: input, rows: 2,
            placeholder: itemId ? '说说要改哪一段…（Enter 发送，Shift+Enter 换行）' : '先选一个项目',
            onChange: event => setInput(event.target.value),
            onKeyDown: event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            },
          }),
          h('div', { className: 'sd-chat-actions' },
            h('span', { style: { flex: 1 } }),
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button',
              disabled: sending || !input.trim() || !itemId, onClick: submit,
            }, sending ? '发送中…' : '发送'))))
    }

    // ------------------------------------------------------------------ 左栏

    function Rail({ items, currentId, onPick, onCreate, onDelete, trashCount, onOpenTrash }) {
      return h('div', { className: 'sd-rail' },
        h('div', { className: 'sd-rail-head' },
          h(DeskIcon, { size: 17 }),
          h('span', { className: 'sd-rail-title' }, '说书工作台'),
          h('button', { className: 'sd-btn', 'data-kind': 'ghost', onClick: onCreate, title: '新建一个说书项目' }, '＋')),
        h('div', { className: 'sd-rail-list' },
          items.length
            ? items.map(item => h('div', {
                key: item.id, className: 'sd-item',
                'data-on': item.id === currentId ? '1' : '0',
                role: 'button', tabIndex: 0,
                onClick: () => onPick(item.id),
                onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') onPick(item.id) },
              },
              h('span', { className: 'sd-item-title' }, item.title || '未命名'),
              h('span', { className: 'sd-item-meta' },
                h('span', { className: 'sd-dot', 'data-on': item.stage === 'rendered' ? '1' : '0' }),
                h('span', null, item.stageLabel),
                item.counts.segments ? h('span', null, `· ${item.counts.segments} 段`) : null),
              // 删除入口：平时藏着，鼠标移到这一行才出现
              h('button', {
                className: 'sd-item-del', type: 'button', title: '删除这个项目',
                onClick: event => { event.stopPropagation(); onDelete(item) },
              }, '×')))
            : h('div', { className: 'sd-hint', style: { padding: '10px 6px' } }, '还没有项目。点上面的 ＋ 建一个。')),
        h('div', { className: 'sd-rail-foot' },
          h('button', {
            className: 'sd-trash-link', type: 'button', onClick: onOpenTrash,
          },
            '回收站',
            trashCount ? h('span', { className: 'sd-trash-count' }, String(trashCount)) : null)))
    }

    // ------------------------------------------------------------------ 空状态

    function EmptyState({ onCreate, model }) {
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('div', { className: 'sd-head-row' },
            h('div', { className: 'sd-head-title' },
              h('h1', { className: 'sd-h1' }, '说书工作台'),
              h('div', { className: 'sd-sub' }, '一个题材或一本书 → 说书稿 → 旁白 → 分镜图 → 竖屏成片')),
            h('button', { className: 'sd-btn', 'data-kind': 'primary', onClick: onCreate }, '新建项目'))),
        h('div', { className: 'sd-body' },
          h('div', { className: 'sd-empty' },
            h('div', null, '还没有项目。'),
            h('div', null, '给它一个题材（比如「九子夺嫡」「安史之乱怎么爆的」），或者贴一段原文，剩下的它自己往下做。'),
            h('div', { className: 'sd-hint', style: { marginTop: 14 } },
              model ? `文案模型：${model.provider} · ${model.model}` : '还没有可用模型：先去设置里接一个，否则写不了稿'))))
    }

    // ------------------------------------------------------------------ 项目详情

    /** 任务跑了多久，省得用户以为卡死。 */
    function elapsedLabel(startedAt) {
      const started = new Date(startedAt).getTime()
      if (!Number.isFinite(started)) return ''
      const secs = Math.max(0, Math.round((Date.now() - started) / 1000))
      if (secs < 60) return `已用 ${secs} 秒`
      return `已用 ${Math.floor(secs / 60)} 分 ${secs % 60} 秒`
    }

    /** 按当前画面比例给一组常用出图尺寸。 */
    function resolutionPresets(settings) {
      const portrait = Number(settings.imageHeight) >= Number(settings.imageWidth)
      return portrait
        ? [
          { w: 720, h: 1280, note: '快' },
          { w: 1024, h: 1792, note: '标准' },
          { w: 1152, h: 2048, note: '更清晰' },
          { w: 1440, h: 2560, note: '高清，慢' },
        ]
        : [
          { w: 1280, h: 720, note: '快' },
          { w: 1792, h: 1024, note: '标准' },
          { w: 2048, h: 1152, note: '更清晰' },
          { w: 2560, h: 1440, note: '高清，慢' },
        ]
    }

    /** 当前尺寸命中预设就返回它，否则返回空串（下拉显示为自定义）。 */
    function resolutionKey(settings) {
      const hit = resolutionPresets(settings).find(row =>
        row.w === Number(settings.imageWidth) && row.h === Number(settings.imageHeight))
      return hit ? `${hit.w}x${hit.h}` : ''
    }

    /** 一句话说清现在用哪家在出图，省得去设置里翻。 */
    function providerLabel(settings) {
      let host = settings.imageEndpoint || ''
      try { host = new URL(host).host } catch { /* 保持原文 */ }
      const model = settings.imageModel ? ` · ${settings.imageModel}` : ''
      return `${host || '未设置地址'}${model}`
    }

    // ------------------------------------------------------------------ 阶段页
    // 五个阶段各是一页，点 Tab 切换。配置放在它真正生效的那一页：
    // 音色在「旁白」，画面风格在「分镜图」，不再是集中一堆让人猜影响谁。

    const TAB_MARK = { idea: '①', scripted: '②', anchors: '③', voiced: '④', imaged: '⑤', rendered: '⑥' }
    const TAB_KEYS = ['idea', 'scripted', 'anchors', 'voiced', 'imaged', 'rendered']

    /** 这一页做完了没有。判定只认产物，不认用户点过什么。 */
    function tabDone(item, key) {
      const segments = item.segments ?? []
      if (key === 'idea') return segments.length > 0
      if (key === 'scripted') return segments.length > 0 && segments.every(row => String(row.text ?? '').trim())
      if (key === 'voiced') return segments.length > 0 && segments.every(row => row.audioPath)
      // 参考图是可选的：没建过就算完成，建了但没全定稿才拦
      if (key === 'anchors') {
        const list = item.anchors ?? []
        return list.length === 0 ? true : list.every(row => row.approved)
      }
      if (key === 'imaged') return segments.length > 0 && segments.every(row => row.imagePath)
      return Boolean(item.render)
    }

    /** 打开项目时落在第一个没做完的页，而不是永远从①开始。 */
    function defaultTab(item) {
      return TAB_KEYS.find(key => !tabDone(item, key)) ?? 'rendered'
    }

    function Project({ item, data, busy, notice, onAction, onReload, onSettings }) {
      const [picked, setPicked] = useState(null)
      // 换项目时回到自动落页
      useEffect(() => { setPicked(null) }, [item.id])

      // 稿件生成完就带用户去看稿子，不用自己再点一下页签
      const wasRunning = useRef(false)
      useEffect(() => {
        const running = Boolean(item.task?.running)
      const segSeconds = item.settings?.segmentSeconds ?? data.settings.segmentSeconds ?? 40
        const had = wasRunning.current
        wasRunning.current = running
        // 只有「生成稿件」跑完才该带用户去看稿子；出图、配音、合成都在当前页继续看结果
        if (had && !running && item.task?.kind === 'script' && !item.task?.error && item.segments.length) {
          setPicked('scripted')
        }
      }, [item.task?.running, item.task?.error, item.task?.kind, item.segments.length])
      const active = picked ?? defaultTab(item)
      const task = item.task
      const running = Boolean(task?.running)
      const pct = task && task.total ? Math.min(100, Math.round((task.done / task.total) * 100)) : 0
      const pages = { item, data, busy, notice, onAction, onReload, onSettings }

      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('div', { className: 'sd-head-row' },
            h('div', { className: 'sd-head-title' },
              h('h1', { className: 'sd-h1' }, item.title || '未命名'),
              h('div', { className: 'sd-sub' },
                item.angle || `题材：${item.topic}`,
                item.counts.segments ? ` · ${item.counts.segments} 段 · 约 ${formatSecs(item.totalSecs || 0)}` : '')),
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', onClick: onSettings, title: '设置' }, h(GearIcon))),

          // 阶段导航
          h('div', { className: 'sd-tabnav' },
            TAB_KEYS.map((key, index) => {
              const stage = data.stages.find(row => row.id === key)
              const done = tabDone(item, key)
              return h('button', {
                key, type: 'button', className: 'sd-tabnav-btn',
                'data-on': active === key ? '1' : '0',
                'data-done': done ? '1' : '0',
                onClick: () => setPicked(key),
              },
                h('span', { className: 'sd-tabnav-mark' }, TabMark({ key, done, index, active })),
                h('span', null, stage?.label ?? key))
            })),

          task ? h('div', null,
            h('div', { className: 'sd-progress' },
              h('div', { className: 'sd-progress-bar', style: { width: `${pct}%` } })),
            h('div', { className: 'sd-taskline' },
              h('span', null, task.message || '处理中…'),
              task.total > 1 ? h('span', null, `${task.done}/${task.total}`) : null,
              // 慢模型写稿可能好几分钟，让用户看见它还在动
              task.running && task.startedAt
                ? h('span', { style: { opacity: .7 } }, `${elapsedLabel(task.startedAt)}`)
                : null,
              task.error ? h('span', { style: { color: 'var(--dsw-alias-state-error-primary)' } }, task.error) : null))
            : null,

          notice ? h('div', {
            className: 'sd-error',
            style: notice.tone === 'error' ? undefined : { color: 'var(--dsw-alias-state-success-primary)' },
          }, typeof notice === 'string' ? notice : notice.text) : null),

        h('div', { className: 'sd-body' },
          active === 'idea' ? h(IdeaPage, pages)
            : active === 'scripted' ? h(ScriptPage, pages)
              : active === 'voiced' ? h(VoicePage, pages)
                : active === 'anchors' ? h(AnchorPage, pages)
                  : active === 'imaged' ? h(ImagePage, pages)
                  : h(RenderPage, pages)))
    }

    function TabMark({ key, done, index, active }) {
      if (done) return '✓'
      if (active === key) return '●'
      return TAB_MARK[key] ?? String(index + 1)
    }

    /** 还没到这一步时给的提示，带一个跳过去的按钮。 */
    function NeedPrev({ text, onGo, label }) {
      return h('div', { className: 'sd-empty' },
        h('div', null, text),
        onGo ? h('div', { style: { marginTop: 12 } },
          h('button', { className: 'sd-btn', type: 'button', onClick: onGo }, label)) : null)
    }

    // ------------------------------------------------------------------ 大图查看

    /**
     * 分镜大图：滚轮以光标为中心缩放，拖动平移，双击在 1x / 2.4x 之间切换。
     * 原生滚轮事件必须自己挂（React 的 onWheel 是 passive，拦不住页面滚动）。
     */
    function ImageViewer({ src, caption, meta, onClose }) {
      const [scale, setScale] = useState(1)
      const [offset, setOffset] = useState({ x: 0, y: 0 })
      const [dragging, setDragging] = useState(false)
      const boxRef = useRef(null)
      const scaleRef = useRef(1)
      const dragRef = useRef(null)

      useEffect(() => { scaleRef.current = scale }, [scale])

      useEffect(() => {
        const node = boxRef.current
        if (!node) return undefined
        const onWheel = event => {
          event.preventDefault()
          const rect = node.getBoundingClientRect()
          const cx = event.clientX - rect.left - rect.width / 2
          const cy = event.clientY - rect.top - rect.height / 2
          const current = scaleRef.current
          const next = Math.min(8, Math.max(0.4, current * (event.deltaY < 0 ? 1.12 : 1 / 1.12)))
          const ratio = next / current
          setOffset(prev => ({ x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio }))
          setScale(next)
        }
        node.addEventListener('wheel', onWheel, { passive: false })
        return () => node.removeEventListener('wheel', onWheel)
      }, [])

      useEffect(() => {
        const onKey = event => {
          if (event.key === 'Escape') onClose()
          if (event.key === '0') { setScale(1); setOffset({ x: 0, y: 0 }) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])

      const startDrag = event => {
        event.currentTarget.setPointerCapture?.(event.pointerId)
        dragRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y }
        setDragging(true)
      }
      const moveDrag = event => {
        if (!dragRef.current) return
        setOffset({ x: event.clientX - dragRef.current.x, y: event.clientY - dragRef.current.y })
      }
      const endDrag = () => { dragRef.current = null; setDragging(false) }

      return h('div', {
        className: 'sd-lightbox',
        ref: boxRef,
        onClick: event => { if (event.target === event.currentTarget) onClose() },
      },
        h('div', { className: 'sd-lb-bar' },
          h('span', { className: 'sd-lb-title' }, caption || '画面'),
          meta ? h('span', { className: 'sd-lb-meta' }, meta) : null,
          h('span', { className: 'sd-lb-meta' }, `${Math.round(scale * 100)}%`),
          h('button', { className: 'sd-lb-close', type: 'button', onClick: onClose }, '关闭')),

        h('img', {
          src,
          alt: caption || '',
          draggable: false,
          onPointerDown: startDrag,
          onPointerMove: moveDrag,
          onPointerUp: endDrag,
          onPointerCancel: endDrag,
          onDoubleClick: () => {
            if (scale > 1.2) { setScale(1); setOffset({ x: 0, y: 0 }) } else { setScale(2.4); setOffset({ x: 0, y: 0 }) }
          },
          style: {
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? 'none' : 'transform .12s ease-out',
            cursor: dragging ? 'grabbing' : 'grab',
          },
        }),

        h('div', { className: 'sd-lb-hint' }, '滚轮缩放 · 拖动平移 · 双击放大 · 0 复位 · Esc 关闭'))
    }

    // ------------------------------------------------------------------ ① 选题

    function IdeaPage({ item, data, busy, onAction, onReload }) {
      const [topic, setTopic] = useState(item.topic ?? '')
      const [minutes, setMinutes] = useState(item.targetMinutes ?? 5)
      const [raw, setRaw] = useState(item.rawText ?? '')
      const [refs, setRefs] = useState(() => (item.references ?? []).map(row => row.url).join('\n'))
      const [modelKey, setModelKey] = useState(item.model ? `${item.model.provider}|${item.model.model}` : '')
      const [saving, setSaving] = useState(false)
      const running = Boolean(item.task?.running)

      useEffect(() => { setTopic(item.topic ?? '') }, [item.topic])
      useEffect(() => { setMinutes(item.targetMinutes ?? 5) }, [item.targetMinutes])
      useEffect(() => { setRaw(item.rawText ?? '') }, [item.rawText])
      useEffect(() => { setRefs((item.references ?? []).map(row => row.url).join('\n')) }, [item.references])
      useEffect(() => { setModelKey(item.model ? `${item.model.provider}|${item.model.model}` : '') }, [item.model])

      const parseRefs = () => [...new Set(
        String(refs).split(/\n+/).map(line => line.trim()).filter(line => /^https?:\/\//i.test(line)),
      )].slice(0, 12)

      const saveInfo = async () => {
        setSaving(true)
        try {
          const [provider, model] = modelKey ? modelKey.split('|') : [null, null]
          const base = (item.references ?? []).map(row => row.url)
          const urls = parseRefs()
          // 链接没变就沿用它抓到的标题，别每次保存都重新抓
          const references = urls.map(url => {
            const known = (item.references ?? []).find(row => row.url === url)
            return known ?? { url, title: '', desc: '', error: null }
          })
          await post('item-info', {
            id: item.id,
            topic,
            targetMinutes: Number(minutes) || 5,
            rawText: raw,
            references,
            model: provider && model ? { provider, model } : null,
          })
          // 新加的链接抓一次标题，抓到就补上
          const fresh = references.filter(row => !row.title && !row.error)
          for (const row of fresh) {
            try {
              const info = await post('reference-inspect', { url: row.url })
              if (info?.title || info?.desc) {
                row.title = info.title || ''
                row.desc = info.desc || ''
                row.error = info.error || null
              }
            } catch {
              // 抓不到不影响使用
            }
          }
          if (fresh.length) await post('item-info', { id: item.id, references })
          await onReload()
        } finally {
          setSaving(false)
        }
      }

      const dirty = topic !== (item.topic ?? '')
        || Number(minutes) !== (item.targetMinutes ?? 5)
        || raw !== (item.rawText ?? '')
        || refs !== (item.references ?? []).map(row => row.url).join('\n')
        || modelKey !== (item.model ? `${item.model.provider}|${item.model.model}` : '')
      const done = tabDone(item, 'idea')
      const refRows = item.references ?? []

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '这一期讲什么'),
          h('div', { className: 'sd-field' },
            h('label', null, '题材 / 书名'),
            h('input', {
              className: 'sd-input', value: topic,
              placeholder: '例：九子夺嫡 / 安史之乱 / 《万历十五年》',
              onChange: event => setTopic(event.target.value),
            })),
          h('div', { className: 'sd-row', style: { gap: 12 } },
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '目标时长（分钟）'),
              h('input', {
                className: 'sd-input', type: 'number', min: 1, max: 30, value: minutes,
                onChange: event => setMinutes(event.target.value),
              })),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '写稿用哪个模型'),
              h('select', {
                className: 'sd-select', value: modelKey,
                onChange: event => setModelKey(event.target.value),
              },
                h('option', { value: '' }, '跟随 DSH 当前默认模型'),
                (data.engines ?? []).map(provider => h('optgroup', { key: provider.provider, label: provider.name },
                  provider.models.map(row => h('option', {
                    key: `${provider.provider}|${row.id}`,
                    value: `${provider.provider}|${row.id}`,
                  }, row.name)))))),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '每一段多长（秒）'),
              h('input', {
                key: `idea-seg-${item.id}-${segSeconds}`,
                className: 'sd-input', type: 'number', min: 12, max: 90,
                defaultValue: segSeconds,
                onBlur: async event => {
                  const value = Math.max(12, Math.min(90, Number(event.target.value) || 40))
                  if (value === segSeconds) return
                  await post('item-settings', { id: item.id, settings: { segmentSeconds: value } })
                  await onReload()
                },
              }),
              h('div', { className: 'sd-hint', style: { paddingTop: 5 } },
                `约 ${Math.max(1, Math.round((Number(minutes) || 5) * 60 / segSeconds))} 段`))),

          h('div', { className: 'sd-field' },
            h('label', null, `参考视频${refRows.length ? `（已登记 ${refRows.length} 条）` : '（可选）'}`),
            h('textarea', {
              className: 'sd-input sd-textarea', value: refs, rows: 4,
              placeholder: '一行一个链接。写稿时会照着它们的选题角度、开场节奏学，不会照搬内容。\n例：https://www.douyin.com/video/xxxx',
              onChange: event => setRefs(event.target.value),
            }),
            refRows.length
              ? h('div', { className: 'sd-refs' },
                refRows.map(row => h('div', { key: row.url, className: 'sd-ref' },
                  h('span', { className: 'sd-ref-title' }, row.title || '（未抓到标题）'),
                  h('span', { className: 'sd-ref-url' }, row.url),
                  row.error ? h('span', { className: 'sd-ref-err' }, row.error) : null)))
              : null),

          h('div', { className: 'sd-field' },
            h('label', null, `原始材料${raw.trim() ? '' : '（可选）'}`),
            h('textarea', {
              className: 'sd-input sd-textarea', value: raw, rows: 5,
              placeholder: '有现成的稿子、笔记或资料就贴进来，它会照着这份材料写，不照抄原句。',
              onChange: event => setRaw(event.target.value),
            })),

          h('div', { className: 'sd-row', style: { marginTop: 12, gap: 8 } },
            h('button', {
              className: 'sd-btn', type: 'button', disabled: saving || !dirty, onClick: saveInfo,
            }, saving ? '保存中…' : dirty ? '保存改动' : '已保存'),
            h('span', { style: { flex: 1 } }),
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button',
              disabled: busy || running,
              title: running ? '这个项目正在跑任务，等它结束' : undefined,
              onClick: async () => {
                if (dirty) await saveInfo()
                onAction('script', { id: item.id }, null)
              },
            }, '生成稿件'))),

        running
          ? h('div', { className: 'sd-card-block' },
            h('div', { className: 'sd-block-title' }, '正在生成'),
            h('div', { className: 'sd-hint' }, item.task?.message || '正在生成稿件…'),
            h('div', { className: 'sd-progress', style: { marginTop: 8 } },
              h('div', { className: 'sd-progress-bar', style: { width: `${taskPct(item.task)}%` } })),
            h('div', { className: 'sd-hint', style: { marginTop: 6 } },
              item.task?.total > 1 ? `${item.task.done}/${item.task.total} · ` : '',
              elapsedLabel(item.task?.startedAt),
              ' · 完成后自动切到「说书稿」确认稿件'))
          : null)
    }

        /** 按阶段 id 跳到对应页签，顺序改了也不会指错地方。 */
    function goTab(key) {
      const index = TAB_KEYS.indexOf(key)
      document.querySelectorAll('.sd-tabnav-btn')[index]?.click()
    }

    /** 任务进度百分比，没有任务就是 0。 */
    function taskPct(task) {
      if (!task || !task.total) return 0
      return Math.min(100, Math.round((task.done / task.total) * 100))
    }

    // ------------------------------------------------------------------ ② 说书稿

    function ScriptPage({ item, data, busy, onAction, onReload }) {
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const [viewed, setViewed] = useState(null)
      const words = item.segments.reduce((sum, row) => sum + String(row.text ?? '').length, 0)
      const estimate = Math.round(words / 4.2)

      if (!item.counts.segments) {
        return h(NeedPrev, {
          text: '还没有稿子。先去「① 选题」定题材并写稿。',
          label: '去选题',
          onGo: () => {
            const btn = document.querySelector('.sd-tabnav-btn')
            if (btn) btn.click()
          },
        })
      }

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '分段稿'),
          h('div', { className: 'sd-row', style: { gap: 12, alignItems: 'center' } },
            h('div', { className: 'sd-hint', style: { flex: 1 } },
              `共 ${item.segments.length} 段 · ${words} 字 · 念出来约 ${formatSecs(estimate)}`),
            h('button', {
              className: 'sd-btn', type: 'button', disabled: busy || Boolean(item.task?.running),
              title: item.task?.running ? '这个项目正在跑任务，等它结束' : undefined,
              onClick: () => onAction('script', { id: item.id }, '正在生成稿件…'),
            }, '生成稿件'))),

        item.segments.map(seg => h(SegmentCard, {
          key: seg.id, item, seg, mode: 'script', disabled: busy, onAction, onReload,
          onZoom: seg.imagePath ? () => setViewed({ src: mediaUrl(item.id, seg.imagePath, seg.imageAt), caption: `第 ${seg.idx + 1} 段` }) : undefined,
        })),
        viewed ? h(ImageViewer, { ...viewed, onClose: () => setViewed(null) }) : null,
        h('div', { className: 'sd-hint', style: { marginTop: 4 } },
          '直接改文字或画面描述，离开输入框就保存。改过文字的段落需要重新配音。'))
    }

    // ------------------------------------------------------------------ ③ 旁白

    function VoicePage({ item, data, busy, onAction, onReload }) {
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const samples = item.samples?.voice ?? {}
      const task = item.task
      const recording = task?.running && task.kind === 'tts'
      const missing = item.counts.segments - item.counts.voiced
      const ready = item.counts.segments > 0 && missing === 0
      const pickedLabel = data.voices.find(row => row.id === settings.voice)?.label ?? settings.voice
      const [loadingVoice, setLoadingVoice] = useState(null)
      const [error, setError] = useState(null)

      if (!item.counts.segments) {
        return h(NeedPrev, { text: '还没有稿子，先写稿再来配音。', label: '去写稿', onGo: () => goTab('scripted') })
      }

      const patch = async next => { await post('item-settings', { id: item.id, settings: next }); await onReload() }

      // 点一个音色：没试听档就现场合成这一个，然后直接放；有就只选中
      const audition = async voice => {
        setError(null)
        if (!samples[voice]) {
          setLoadingVoice(voice)
          try {
            const result = await post('voice-sample-one', { id: item.id, voice })
            await onReload()
            if (result?.path) {
              const audio = new Audio(mediaUrl(item.id, result.path))
              audio.play().catch(() => {})
            }
          } catch (err) {
            setError(err.message)
          } finally {
            setLoadingVoice(null)
          }
        }
        await patch({ voice })
      }

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '第一步：挑声音'),
          h('div', { className: 'sd-hint' },
            `用这期稿子的开头（约 15 秒）。点名字就选中并试听，没听过的现场生成，不用等全部。推荐从「白桦」开始。`),

          h('div', { className: 'sd-voices' },
            data.voices.map((row, index) => {
              const isPicked = settings.voice === row.id
              const loading = loadingVoice === row.id
              const has = Boolean(samples[row.id])
              const blocked = Boolean(loadingVoice) || Boolean(task?.running)
              return h('div', {
                key: row.id, className: 'sd-voice-row', role: 'button', tabIndex: 0,
                'data-on': isPicked ? '1' : '0',
                'data-blocked': blocked ? '1' : '0',
                title: `用「${row.label}」`,
                // 整行都能点：以前只有名字那一小块响应，点行里其他地方像坏了
                onClick: () => { if (!blocked) audition(row.id) },
                onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!blocked) audition(row.id) } },
              },
                h('span', { className: 'sd-voice-pick' },
                  h('span', { className: 'sd-voice-name' }, row.label),
                  index === 0 ? h('span', { className: 'sd-tag', 'data-tone': 'ok' }, '推荐') : null,
                  row.note ? h('span', { className: 'sd-voice-note' }, row.note) : null,
                  isPicked ? h('span', { className: 'sd-tag' }, '当前') : null,
                  loading ? h('span', { className: 'sd-hint' }, '合成中…') : null),
                has
                  ? h('audio', {
                    className: 'sd-voice-audio', controls: true, preload: 'none',
                    src: mediaUrl(item.id, samples[row.id]),
                    // 点播放器不该顺手切音色
                    onClick: event => event.stopPropagation(),
                  })
                  : h('span', { className: 'sd-hint', style: { flex: '0 0 auto' } }, '未试听'))
            })),

          error ? h('div', { className: 'sd-hint', style: { marginTop: 8, color: 'var(--dsw-alias-state-error-primary)' } }, error) : null),

        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '第二步：进入下一步'),
          h('div', { className: 'sd-hint' },
            `音色定为「${pickedLabel}」。整片配音统一放到最后一步的「配音并合成」，那里缺多少补多少，不用现在等。`),
          h('div', { className: 'sd-row', style: { marginTop: 10, gap: 8, alignItems: 'center' } },
            h('button', { className: 'sd-btn', 'data-kind': 'primary', type: 'button', onClick: () => goTab('imaged') }, '去分镜图出画面'),
            item.totalSecs ? h('span', { style: { flex: 1 } }) : null,
            item.totalSecs ? h('span', { className: 'sd-hint' }, `已配 ${item.counts.voiced}/${item.counts.segments} 段`) : null)),

        item.segments.map(seg => h(SegmentCard, {
          key: seg.id, item, seg, mode: 'voice', disabled: busy, onAction, onReload,
        })))
    }

    // ------------------------------------------------------------------ ④ 参考图

    /**
     * 关键参考：把反复出现的人物和场景先定成一张标准像。
     * 定稿后它的形象描述会拼进每段分镜的 prompt，人物才不会一张一个样。
     */
    function AnchorPage({ item, data, busy, onAction, onReload }) {
      const anchors = item.anchors ?? []
      const [busyId, setBusyId] = useState(null)
      const [viewed, setViewed] = useState(null)
      const task = item.task
      const drawing = task?.running && task.kind === 'anchor'
      const approvedCount = anchors.filter(row => row.approved).length

      const call = async (path, payload, id) => {
        setBusyId(id ?? 'extract')
        try {
          await post(path, payload)
          await onReload()
        } finally {
          setBusyId(null)
        }
      }

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '人物与场景参考'),
          h('div', { className: 'sd-hint' },
            `关键形象先定一张标准像，之后每段分镜都会照着它画${item.counts.segments ? '' : '。建议先在「② 说书稿」确认稿件，再来抽角色'}。`),
          h('div', { className: 'sd-row', style: { marginTop: 10, gap: 8 } },
            h('button', {
              className: 'sd-btn', 'data-kind': anchors.length ? undefined : 'primary', type: 'button',
              disabled: busy || Boolean(busyId),
              onClick: () => call('anchors/extract', { id: item.id }),
            }, busyId === 'extract' ? '正在分析…' : anchors.length ? '重新提取' : '提取人物和场景'),
            anchors.length
              ? h('span', { className: 'sd-hint' }, `已定稿 ${approvedCount}/${anchors.length}`)
              : null,
            drawing ? h('span', { className: 'sd-hint' }, `正在画 ${task.done}/${task.total}`) : null)),

        !anchors.length
          ? h('div', { className: 'sd-empty' },
            h('div', null, '还没有提取。点上面的按钮，它会读完稿子，把需要考虑形象一致的人物与场景列出来。'))
          : anchors.map(row => h(AnchorCard, {
            key: row.id, item, row, busy: busy || drawing, busyId, call, drawing,
            onZoom: viewed => setViewed(viewed),
          })),
        viewed ? h(ImageViewer, { ...viewed, onClose: () => setViewed(null) }) : null)
    }

    function AnchorCard({ item, row, busy, busyId, call, drawing, onZoom }) {
      const [desc, setDesc] = useState(row.desc)
      const [note, setNote] = useState('')
      const [picked, setPicked] = useState(row.approved || (row.candidates ?? []).slice(-1)[0] || null)
      const pending = busyId === row.id

      useEffect(() => { setDesc(row.desc) }, [row.desc])
      useEffect(() => {
        setPicked(row.approved || (row.candidates ?? []).slice(-1)[0] || null)
      }, [row.approved, row.candidates])

      const candidates = row.candidates ?? []

      return h('div', { className: 'sd-anchor', 'data-approved': row.approved ? '1' : '0' },
        h('div', { className: 'sd-anchor-head' },
          h('span', { className: 'sd-anchor-name' }, row.name),
          h('span', { className: 'sd-tag' }, row.kind === 'scene' ? '场景' : '人物'),
          row.approved ? h('span', { className: 'sd-tag', 'data-tone': 'ok' }, '已定稿') : null,
          h('span', { style: { flex: 1 } }),
          h('button', {
            className: 'sd-btn', 'data-kind': 'ghost', style: { fontSize: 11, padding: '2px 8px' },
            disabled: busy,
            onClick: () => call('anchors/remove', { id: item.id, anchorId: row.id }),
          }, '移除')),

        h('div', { className: 'sd-anchor-body' },
          h('div', { className: 'sd-anchor-figure' },
            picked
              ? h('img', {
                className: 'sd-anchor-img sd-imgzoom',
                src: mediaUrl(item.id, picked),
                alt: row.name,
                title: '点开看大图',
                onClick: () => onZoom?.({ src: mediaUrl(item.id, picked), caption: row.name, meta: row.kind === 'scene' ? '场景' : '人物' }),
              })
              : h('div', { className: 'sd-anchor-empty' }, '还没有图'),

            candidates.length > 1
              ? h('div', { className: 'sd-anchor-thumbs' },
                candidates.map(path => h('button', {
                  key: path, type: 'button', className: 'sd-anchor-thumb',
                  'data-on': picked === path ? '1' : '0',
                  onClick: () => setPicked(path),
                }, h('img', { src: mediaUrl(item.id, path), alt: '' }))))
              : null),

          h('div', { className: 'sd-anchor-main' },
            h('textarea', {
              className: 'sd-text', value: desc, rows: 3,
              onChange: event => setDesc(event.target.value),
              onBlur: () => {
                if (desc.trim() && desc !== row.desc) {
                  call('anchors/save', { id: item.id, anchorId: row.id, desc })
                }
              },
            }),
            h('div', { className: 'sd-row', style: { gap: 6, marginTop: 6 } },
              h('input', {
                className: 'sd-input', value: note, placeholder: '哪里不对？例如：太年轻、甲胄太亮、要更瘦',
                onChange: event => setNote(event.target.value),
                onKeyDown: event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    call('anchors/draw', { id: item.id, anchorId: row.id, instruction: note }, row.id)
                    setNote('')
                  }
                },
              }),
              h('button', {
                className: 'sd-btn', type: 'button', disabled: busy || drawing,
                onClick: () => {
                  call('anchors/draw', { id: item.id, anchorId: row.id, instruction: note }, row.id)
                  setNote('')
                },
              }, pending ? '重画中…' : candidates.length ? '按这条重画' : '画一张')),

            h('div', { className: 'sd-row', style: { marginTop: 8, gap: 8 } },
              h('button', {
                className: 'sd-btn', 'data-kind': row.approved === picked ? undefined : 'primary', type: 'button',
                disabled: !picked || busy || row.approved === picked,
                onClick: () => call('anchors/approve', { id: item.id, anchorId: row.id, candidate: picked }),
              }, row.approved === picked ? '已定稿' : '用这张定稿'),
              row.approved && row.approved !== picked
                ? h('span', { className: 'sd-hint' }, '当前定稿是另一张')
                : null))))
    }

    // ------------------------------------------------------------------ ⑤ 分镜图

    function ImagePage({ item, data, busy, onAction, onReload, onSettings }) {
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const samples = item.samples?.style ?? {}
      const styleKeys = Object.keys(samples)
      const [viewed, setViewed] = useState(null)
      const task = item.task
      const drawing = task?.running && task.kind === 'style-samples'
      const missing = item.counts.segments - item.counts.imaged

      if (!item.counts.segments) {
        return h(NeedPrev, { text: '还没有稿子，先写稿再来出图。', label: '去写稿', onGo: () => goTab('scripted') })
      }

      const patch = async next => { await post('item-settings', { id: item.id, settings: next }); await onReload() }

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '画面长什么样'),
          h('div', { className: 'sd-row', style: { gap: 12, alignItems: 'flex-end' } },
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '画面风格'),
              h('select', {
                className: 'sd-select', value: settings.visualStyle,
                onChange: event => patch({ visualStyle: event.target.value }),
              }, data.styles.map(row => h('option', { key: row.id, value: row.id }, row.label)))),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '画面比例'),
              h('select', {
                className: 'sd-select', value: `${settings.width}x${settings.height}`,
                onChange: event => {
                  const [w, hh] = event.target.value.split('x').map(Number)
                  patch({ width: w, height: hh, imageWidth: hh >= w ? 1024 : 1792, imageHeight: hh >= w ? 1792 : 1024 })
                },
              },
                h('option', { value: '1080x1920' }, '9:16 竖屏'),
                h('option', { value: '1920x1080' }, '16:9 横屏'))),
            h('button', {
              className: 'sd-btn', type: 'button', disabled: busy || drawing,
              onClick: () => onAction('style-samples', { id: item.id }, null),
            }, drawing ? `试画 ${task.done}/${task.total}` : styleKeys.length ? '换风格重看' : '看 5 种')),

          // 出图分辨率：不同通道支持的尺寸不一样，给常用档 + 自定义
          h('div', { className: 'sd-row', style: { gap: 12, marginTop: 10, alignItems: 'flex-end' } },
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '出图分辨率'),
              h('select', {
                className: 'sd-select',
                value: resolutionKey(settings),
                onChange: event => {
                  const [w, hh] = event.target.value.split('x').map(Number)
                  if (!w || !hh) return
                  patch({ imageWidth: w, imageHeight: hh })
                },
              },
                resolutionPresets(settings).map(row => h('option', {
                  key: `${row.w}x${row.h}`, value: `${row.w}x${row.h}`,
                }, `${row.w}×${row.h}${row.note ? `（${row.note}）` : ''}`)),
                h('option', { value: `custom`, disabled: true }, '—— 自定义 ——'))),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '宽 × 高'),
              h('div', { className: 'sd-row', style: { gap: 6 } },
                h('input', {
                  key: `iw-${item.id}-${settings.imageWidth}`,
                  className: 'sd-input', type: 'number', min: 256, max: 4096, step: 8,
                  defaultValue: settings.imageWidth,
                  onBlur: async event => {
                    const w = Math.max(256, Math.min(4096, Number(event.target.value) || 1024))
                    if (w === settings.imageWidth) return
                    await post('item-settings', { id: item.id, settings: { imageWidth: w } })
                    await onReload()
                  },
                }),
                h('span', { className: 'sd-hint', style: { alignSelf: 'center' } }, '×'),
                h('input', {
                  key: `ih-${item.id}-${settings.imageHeight}`,
                  className: 'sd-input', type: 'number', min: 256, max: 4096, step: 8,
                  defaultValue: settings.imageHeight,
                  onBlur: async event => {
                    const hh = Math.max(256, Math.min(4096, Number(event.target.value) || 1792))
                    if (hh === settings.imageHeight) return
                    await post('item-settings', { id: item.id, settings: { imageHeight: hh } })
                    await onReload()
                  },
                }))),
            h('div', { style: { flex: 2, paddingBottom: 6 } },
              h('div', { className: 'sd-hint' },
                `改分辨率只影响之后出的图，已出的 ${item.counts.imaged} 张不会自动重画。`))),

          h('div', { className: 'sd-hint', style: { marginTop: 8 } },
            '出图通道：', providerLabel(settings), ' · ',
            h('span', {
              style: { cursor: 'pointer', color: 'var(--dsw-alias-link)' },
              onClick: onSettings,
            }, '改设置')),

          styleKeys.length
            ? h('div', { className: 'sd-samples' },
              h('div', { className: 'sd-hint', style: { marginBottom: 7 } }, '同一段文字，五种画法。点一张定风格；已经出过的分镜图不会自动重画。'),
              h('div', { className: 'sd-style-row' },
                data.styles.map(row => h('button', {
                  key: row.id, type: 'button', className: 'sd-style',
                  'data-on': settings.visualStyle === row.id ? '1' : '0',
                  disabled: !samples[row.id],
                  onClick: () => patch({ visualStyle: row.id }),
                  title: row.label,
                },
                  samples[row.id]
                    ? h('img', { src: mediaUrl(item.id, samples[row.id]), alt: row.label })
                    : h('div', { style: { aspectRatio: '9/16', background: 'var(--dsw-alias-bg-layer-2)' } }),
                  h('div', { className: 'sd-style-name' }, row.label)))))
            : null,

          h('div', { className: 'sd-row', style: { marginTop: 12, gap: 8 } },
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button', disabled: busy || Boolean(item.task?.running),
              onClick: () => onAction('image', { id: item.id }, null),
            }, missing > 0 ? `出图 ${missing} 张` : '全部重出图'),
            styleKeys.length ? h('span', { className: 'sd-hint' }, '换风格后如果旧图不满意，点这里全部重出') : null)),

        item.segments.map(seg => h(SegmentCard, {
          key: seg.id, item, seg, mode: 'image', disabled: busy, onAction, onReload,
          onZoom: () => setViewed({ src: mediaUrl(item.id, seg.imagePath, seg.imageAt), caption: `第 ${seg.idx + 1} 段`, meta: `${seg.audioSecs ? formatSecs(seg.audioSecs) : '未配音'}` }),
        })),

        viewed ? h(ImageViewer, { ...viewed, onClose: () => setViewed(null) }) : null)
    }

    // ------------------------------------------------------------------ ⑤ 成片

    function RenderPage({ item, data, busy, onAction, onReload, onSettings }) {
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const [dir, setDir] = useState('')
      const [exporting, setExporting] = useState(false)
      const [result, setResult] = useState(null)

      const missingAudio = item.counts.segments - item.counts.voiced
      const missingImage = item.counts.segments - item.counts.imaged
      // 音由这一步自己补，只有图必须先在分镜图页出好
      const ready = item.counts.segments > 0 && missingImage === 0
      const needDub = missingAudio > 0

      const patch = async next => { await post('item-settings', { id: item.id, settings: next }); await onReload() }

      const doExport = async () => {
        setExporting(true)
        setResult(null)
        try {
          const response = await post('export', { id: item.id, dir })
          setResult(response)
        } catch (err) {
          setResult({ error: err.message })
        } finally {
          setExporting(false)
        }
      }

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '特效'),
          h('div', { className: 'sd-row', style: { gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' } },
            h('div', { className: 'sd-field', style: { flex: 1, minWidth: 150 } },
              h('label', null, '运镜'),
              h('select', {
                className: 'sd-select', value: settings.motion || 'zoom-in',
                onChange: event => patch({ motion: event.target.value }),
              },
                h('option', { value: 'zoom-in' }, '缓慢推近'),
                h('option', { value: 'zoom-out' }, '缓慢拉远'),
                h('option', { value: 'none' }, '固定不动'))),
            h('div', { className: 'sd-field', style: { flex: 1, minWidth: 150 } },
              h('label', null, '调色'),
              h('select', {
                className: 'sd-select', value: settings.grade || 'none',
                onChange: event => patch({ grade: event.target.value }),
              },
                h('option', { value: 'none' }, '原色'),
                h('option', { value: 'warm' }, '暖调'),
                h('option', { value: 'cool' }, '冷调'),
                h('option', { value: 'film' }, '胶片（带暗角）'))),
            h('div', { className: 'sd-field', style: { flex: 1, minWidth: 150 } },
              h('label', null, '转场'),
              h('select', {
                className: 'sd-select', value: settings.transition || 'none',
                onChange: event => patch({ transition: event.target.value }),
              },
                h('option', { value: 'none' }, '硬切（最快）'),
                h('option', { value: 'fade' }, '淡入淡出'),
                h('option', { value: 'fadeblack' }, '经过黑场'),
                h('option', { value: 'dissolve' }, '溶解'),
                h('option', { value: 'wipeleft' }, '向左擦除'),
                h('option', { value: 'circleopen' }, '圆形展开'))),
            h('div', { className: 'sd-field', style: { flex: 1, minWidth: 150 } },
              h('label', null, '片头'),
              h('select', {
                className: 'sd-select', value: settings.intro || 'none',
                onChange: event => patch({ intro: event.target.value }),
              },
                h('option', { value: 'none' }, '不加'),
                h('option', { value: 'title' }, '标题卡（HyperFrames 渲染）')))),

          h('div', { className: 'sd-row', style: { gap: 18, flexWrap: 'wrap', marginTop: 10 } },
            h('label', { className: 'sd-hint', style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' } },
              h('input', { type: 'checkbox', checked: Boolean(settings.burnSubtitles), onChange: event => patch({ burnSubtitles: event.target.checked }) }),
              '字幕压进画面')),
          h('div', { className: 'sd-hint', style: { marginTop: 6 } },
            `${settings.intro === 'title' ? '片头用 HyperFrames 渲染，首次约 25 秒；' : ''}${settings.transition && settings.transition !== 'none' ? '转场需要逐段重编码（有硬件编码时很快）。' : ''}`.trim() || '特效在合成时生效，改完重新合成即可。'),
          h('div', { className: 'sd-hint', style: { marginTop: 4, opacity: .8 } },
            '渲染引擎：',
            data.encoder?.hardware
              ? h('span', { style: { color: 'var(--dsw-alias-state-success-primary)' } }, `${data.encoder.label} · 硬件加速`)
              : `${data.encoder?.label ?? 'CPU'} · 未检测到可用的硬件编码器`),
          !ready
            ? h('div', { className: 'sd-hint', style: { marginTop: 8, color: 'var(--dsw-alias-state-warn-primary)' } },
              missingImage > 0 ? `还有 ${missingImage} 张没出图，先去「分镜图」。` : '')
            : h('div', { className: 'sd-hint', style: { marginTop: 8 } },
              needDub
                ? `还有 ${missingAudio} 段没配音，点下面的按钮会先用「${settings.voice}」补齐再合成。`
                : '音画都齐了，直接合成。'),
          h('div', { className: 'sd-row', style: { marginTop: 12, gap: 8 } },
            h('button', {
              className: 'sd-btn', 'data-kind': ready ? 'primary' : undefined, type: 'button',
              disabled: busy || !ready || Boolean(item.task?.running),
              onClick: () => onAction('finish', { id: item.id }, null),
            }, item.task?.running && item.task.kind === 'finish'
              ? `${item.task.done}/${item.task.total}`
              : needDub ? `配音并合成（${missingAudio} 段）` : item.render ? '重新合成' : '合成成片'))),

        item.render
          ? h('div', { className: 'sd-render' },
            h('video', { className: 'sd-video', controls: true, preload: 'metadata', src: mediaUrl(item.id, item.render.path) }),
            h('div', { className: 'sd-render-side' },
              h('div', { className: 'sd-kicker' }, '成片'),
              h('div', { className: 'sd-h1', style: { fontSize: 14 } },
                `${formatSecs(item.render.secs)} · ${item.render.subtitles ? '已压字幕' : '字幕在 SRT'}`),
              h('div', { className: 'sd-hint' },
                '原始文件在项目目录 renders/ 下，同目录还有一份 video.srt。'),
              h('div', { className: 'sd-field', style: { marginTop: 6 } },
                h('label', null, '导出到'),
                h('div', { className: 'sd-row', style: { gap: 6 } },
                  h('input', {
                    className: 'sd-input', value: dir, spellCheck: false,
                    placeholder: '留空导出到 ~/Downloads',
                    onChange: event => setDir(event.target.value),
                  }),
                  h('button', { className: 'sd-btn', type: 'button', disabled: exporting, onClick: doExport },
                    exporting ? '导出中…' : '导出'))),
              result
                ? h('div', { className: 'sd-hint', style: { marginTop: 6, color: result.error ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-state-success-primary)', wordBreak: 'break-all' } },
                  result.error ? `导出失败：${result.error}` : `已导出 ${result.video}${result.srt ? ' 与 .srt' : ''}`)
                : null,
              h('div', { className: 'sd-card-foot', style: { marginTop: 6 } },
                h('a', {
                  className: 'sd-btn', 'data-kind': 'ghost',
                  href: mediaUrl(item.id, item.render.path), download: '', target: '_blank', rel: 'noreferrer',
                }, '下载成片'),
                item.render.srtPath ? h('a', {
                  className: 'sd-btn', 'data-kind': 'ghost',
                  href: mediaUrl(item.id, item.render.srtPath), target: '_blank', rel: 'noreferrer',
                }, '下载 SRT') : null)))
          : h('div', { className: 'sd-empty' }, ready ? '素材齐了，点「合成成片」。' : '音画还不齐，先去③④补上。'))
    }

    // ------------------------------------------------------------------ 分段卡片

    /** mode：script 改字、voice 听音、image 看图。只显示这一页用得上的控件。 */
    function SegmentCard({ item, seg, mode, disabled, onAction, onReload, onZoom }) {
      const [text, setText] = useState(seg.text)
      const [prompt, setPrompt] = useState(seg.imagePrompt)
      const [note, setNote] = useState('')
      const dirty = mode === 'script' && (text !== seg.text || prompt !== seg.imagePrompt)

      useEffect(() => { setText(seg.text) }, [seg.text])
      useEffect(() => { setPrompt(seg.imagePrompt) }, [seg.imagePrompt])

      const save = useCallback(async () => {
        if (!dirty) return
        const next = item.segments.map(row => (row.id === seg.id ? { ...row, text, imagePrompt: prompt } : row))
        try {
          await post('segments', { id: item.id, segments: next })
          await onReload()
        } catch {
          // 保存失败时保留输入，不闪回旧稿
        }
      }, [dirty, item, seg.id, text, prompt, onReload])

      const voiced = Boolean(seg.audioPath && seg.audioSecs > 0)
      return h('div', { className: 'sd-card', 'data-mode': mode },
        // 说书稿页还没出图时别占一块「无图」空位，文字占满更好读
        mode === 'script' && !seg.imagePath
          ? null
          : seg.imagePath
            ? h('img', {
              className: onZoom ? 'sd-thumb sd-imgzoom' : 'sd-thumb',
              src: mediaUrl(item.id, seg.imagePath, seg.imageAt),
              alt: `第 ${seg.idx + 1} 段画面`,
              title: onZoom ? '点开看大图' : undefined,
              onClick: onZoom,
            })
            : h('div', { className: 'sd-thumb-empty' }, '无图'),
        h('div', { className: 'sd-card-main' },
          h('div', { className: 'sd-card-top' },
            h('span', { className: 'sd-idx' }, String(seg.idx + 1).padStart(2, '0')),
            voiced ? h('span', { className: 'sd-tag', 'data-tone': 'ok' }, formatSecs(seg.audioSecs)) : h('span', { className: 'sd-tag', 'data-tone': 'warn' }, '未配音'),
            seg.imagePath ? null : h('span', { className: 'sd-tag', 'data-tone': 'warn' }, '未出图'),
            dirty ? h('span', { className: 'sd-tag' }, '未保存') : null,
            seg.error ? h('span', { className: 'sd-tag', 'data-tone': 'warn', title: seg.error }, '出错了') : null),

          mode === 'script'
            ? h(React.Fragment, null,
              h('textarea', {
                className: 'sd-text', value: text, rows: 3,
                onChange: event => setText(event.target.value),
                onBlur: save,
                'aria-label': `第 ${seg.idx + 1} 段旁白`,
              }),
              h('textarea', {
                className: 'sd-prompt', value: prompt, rows: 2, placeholder: '这一段的画面描述',
                onChange: event => setPrompt(event.target.value),
                onBlur: save,
                'aria-label': `第 ${seg.idx + 1} 段画面描述`,
              }))
            : h('div', { className: 'sd-readtext' }, seg.text),

          mode === 'image'
            ? h('textarea', {
              className: 'sd-readprompt sd-editable',
              value: prompt, rows: 3,
              placeholder: '这一段的画面描述，直接改，离开输入框保存',
              onChange: event => setPrompt(event.target.value),
              onBlur: async () => {
                if (prompt === seg.imagePrompt) return
                const next = item.segments.map(row => (row.id === seg.id ? { ...row, imagePrompt: prompt } : row))
                await post('segments', { id: item.id, segments: next })
                await onReload()
              },
            })
            : null,

          // 把真正发给模型的提示词摊开，方便核对意见有没有被用上
          mode === 'image' && seg.lastPrompt
            ? h('details', { className: 'sd-lastprompt' },
              h('summary', null, '上次实际发给模型的提示词'),
              h('div', null, seg.lastPrompt))
            : null,

          mode === 'image'
            ? h('div', { className: 'sd-fixrow' },
              h('input', {
                className: 'sd-input', value: note, spellCheck: false,
                placeholder: '这张哪里不对？例：太暗、人物太年轻、要更空旷',
                onChange: event => setNote(event.target.value),
                onKeyDown: event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    onAction('image', { id: item.id, only: [seg.id], note }, null)
                    setNote('')
                  }
                },
              }),
              h('button', {
                className: 'sd-btn', 'data-kind': seg.imagePath ? undefined : 'primary', type: 'button',
                disabled: disabled || (!seg.imagePrompt && !seg.text),
                onClick: () => {
                  onAction('image', { id: item.id, only: [seg.id], note }, null)
                  setNote('')
                },
              }, seg.imagePath ? '按这条重出图' : '出这一张'))
            : null,

          seg.error
            ? h('div', { className: 'sd-hint', style: { marginTop: 6, color: 'var(--dsw-alias-state-warn-primary)', wordBreak: 'break-word' } }, seg.error)
            : null,

          mode === 'image' && seg.imageSize
            ? h('div', { className: 'sd-hint', style: { marginTop: 4, opacity: .7 } }, `实际尺寸 ${seg.imageSize}`)
            : null,

          h('div', { className: 'sd-card-foot' },
            mode !== 'image' && seg.audioPath
              ? h('audio', { className: 'sd-audio', controls: true, preload: 'none', src: mediaUrl(item.id, seg.audioPath) })
              : null,
            h('span', { style: { flex: 1 } }),
            mode !== 'image'
              ? h('button', {
                className: 'sd-btn', 'data-kind': 'ghost', disabled,
                onClick: () => onAction('tts', { id: item.id, only: [seg.id] }, null),
              }, seg.audioPath ? '重配音' : '配音')
              : null,
            null)))
    }

    // ------------------------------------------------------------------ 新建

    function NewDialog({ onClose, onCreate }) {
      const [topic, setTopic] = useState('')
      const [minutes, setMinutes] = useState(5)
      const [rawText, setRawText] = useState('')
      const [showRaw, setShowRaw] = useState(false)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)

      const submit = async () => {
        if (!topic.trim()) { setError('先写一个题材或书名'); return }
        setBusy(true)
        setError(null)
        try {
          await onCreate({ topic: topic.trim(), targetMinutes: Number(minutes) || 5, rawText })
        } finally {
          setBusy(false)
        }
      }

      return h('div', { className: 'sd-mask', onClick: event => { if (event.target === event.currentTarget) onClose() } },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '新建说书项目' },
          h('h3', null, '新建说书项目'),
          h('div', { className: 'sd-hint' }, '给一个题材就行。有现成材料就展开贴上，稿子会照着材料写。'),
          h('div', { className: 'sd-field' },
            h('label', { htmlFor: 'sd-topic' }, '题材 / 书名'),
            h('input', {
              id: 'sd-topic', className: 'sd-input', value: topic, autoFocus: true,
              placeholder: '例：九子夺嫡 / 安史之乱 / 《万历十五年》',
              onChange: event => setTopic(event.target.value),
              onKeyDown: event => { if (event.key === 'Enter') submit() },
            })),
          h('div', { className: 'sd-field' },
            h('label', { htmlFor: 'sd-minutes' }, '目标时长（分钟）'),
            h('input', {
              id: 'sd-minutes', className: 'sd-input', type: 'number', min: 1, max: 30, value: minutes,
              onChange: event => setMinutes(event.target.value),
            })),
          h('div', { className: 'sd-field' },
            h('label', { style: { cursor: 'pointer', color: 'var(--dsw-alias-link)' }, onClick: () => setShowRaw(v => !v) },
              showRaw ? '收起原始材料' : '有原始材料？贴进来（可选）'),
            showRaw ? h('textarea', {
              className: 'sd-input sd-textarea', value: rawText,
              placeholder: '贴一段原文、笔记或资料。它会照着这份材料写，不照抄原句。',
              onChange: event => setRawText(event.target.value),
            }) : null),
          error ? h('div', { className: 'sd-error' }, error) : null,
          h('div', { className: 'sd-dialog-foot' },
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', onClick: onClose, disabled: busy }, '取消'),
            h('button', { className: 'sd-btn', 'data-kind': 'primary', onClick: submit, disabled: busy },
              busy ? '正在建…' : '建项目'))))
    }

    // ------------------------------------------------------------------ 设置

    /** 检测结果的一行小字：绿=通、红=不通、灰=还没测。 */
    function TestResult({ state }) {
      if (!state) return null
      const tone = state.busy ? 'var(--dsw-alias-label-tertiary)'
        : state.ok ? 'var(--dsw-alias-state-success-primary)'
          : 'var(--dsw-alias-state-error-primary)'
      return h('div', { className: 'sd-hint', style: { color: tone, marginTop: 6 } },
        `${state.busy ? '· ' : state.ok ? '✓ ' : '✕ '}${state.detail}`)
    }

    /** 按当前地址+模型反查是哪家服务商；改过地址就自然变成「自定义」。 */
    function presetIdOf(presets, endpoint, model) {
      const hit = (presets ?? []).find(row => row.endpoint === (endpoint ?? '') && (row.model ?? '') === (model ?? ''))
      return hit ? hit.id : 'custom'
    }

    /** 删除前的确认。文案说清「进回收站还能找回」，免得用户以为是彻底删除。 */
    function ConfirmDelete({ item, days, onCancel, onConfirm, busy }) {
      return h('div', { className: 'sd-mask', onClick: event => { if (event.target === event.currentTarget) onCancel() } },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '删除项目', style: { width: 'min(420px,92vw)' } },
          h('h3', null, '删除这个项目？'),
          h('div', { className: 'sd-hint', style: { marginTop: 6, lineHeight: 1.8 } },
            '「', item.title || '未命名', '」会移进回收站，',
            h('b', null, `${days} 天内可以还原`),
            '，到期自动彻底删除。'),
          h('div', { className: 'sd-dialog-foot' },
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', onClick: onCancel, disabled: busy }, '取消'),
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button', disabled: busy,
              style: { background: 'var(--dsw-alias-state-error-base, #c0392b)' },
              onClick: onConfirm,
            }, busy ? '删除中…' : '删除'))))
    }

    /** 回收站：列出来、能还原、也能提前彻底删。 */
    function TrashDialog({ onClose, onChanged }) {
      const [data, setData] = useState(null)
      const [busy, setBusy] = useState(null)
      const [error, setError] = useState(null)

      const load = useCallback(async () => {
        try {
          setData(await post('trash-list', {}))
          setError(null)
        } catch (err) {
          setError(err.message)
        }
      }, [])

      useEffect(() => { load() }, [load])

      const act = async (path, payload) => {
        setBusy(payload.id ?? 'all')
        try {
          await post(path, payload)
          await load()
          await onChanged()
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(null)
        }
      }

      const left = iso => {
        const ms = Date.parse(iso) - Date.now()
        if (!Number.isFinite(ms) || ms <= 0) return '即将删除'
        const days = Math.floor(ms / 86400_000)
        const hours = Math.floor((ms % 86400_000) / 3600_000)
        return days > 0 ? `还剩 ${days} 天` : `还剩 ${hours} 小时`
      }

      const items = data?.items ?? []

      return h('div', { className: 'sd-mask', onClick: event => { if (event.target === event.currentTarget) onClose() } },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '回收站', style: { width: 'min(520px,94vw)' } },
          h('h3', null, '回收站'),
          h('div', { className: 'sd-hint', style: { marginTop: 4 } },
            `保留 ${data?.days ?? 7} 天，到期自动彻底删除。天数可在设置里改。`),
          error ? h('div', { className: 'sd-hint', style: { color: 'var(--dsw-alias-state-error-primary, #c0392b)', marginTop: 8 } }, error) : null,
          h('div', { style: { marginTop: 12 } },
            items.length
              ? items.map(row => h('div', { className: 'sd-trash-row', key: row.id },
                h('div', { className: 'sd-trash-main' },
                  h('div', { className: 'sd-trash-name' }, row.title || '未命名'),
                  h('div', { className: 'sd-trash-meta' }, `${row.segments} 段 · 删除于 ${String(row.deletedAt).slice(5, 16).replace('T', ' ')} · ${left(row.expiresAt)}`)),
                h('button', {
                  className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: busy !== null,
                  onClick: () => act('trash-restore', { id: row.id }),
                }, '还原'),
                h('button', {
                  className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: busy !== null,
                  style: { color: 'var(--dsw-alias-state-error-primary, #c0392b)' },
                  onClick: () => act('trash-purge', { id: row.id }),
                }, '彻底删除')))
              : h('div', { className: 'sd-hint', style: { padding: '14px 0' } }, '回收站是空的。')),
          h('div', { className: 'sd-dialog-foot' },
            items.length
              ? h('button', {
                className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: busy !== null,
                onClick: () => act('trash-purge', { all: true }),
              }, '清空回收站')
              : null,
            h('button', { className: 'sd-btn', 'data-kind': 'primary', type: 'button', onClick: onClose }, '关闭'))))
    }

    function SettingsDialog({ data, onClose, onSaved }) {
      const settings = data.settings
      const [form, setForm] = useState(() => ({ ...settings }))
      const [ttsKey, setTtsKey] = useState('')
      const [imageKey, setImageKey] = useState('')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)
      const [test, setTest] = useState({ image: null, tts: null })
      const [tab, setTab] = useState('image')
      const [modelManual, setModelManual] = useState(false)

      const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
      const keyFor = target => (target === 'image' ? imageKey.trim() : ttsKey.trim())

      const imageModels = test.image?.models ?? []
      // 候选 = 服务端返回 + 当前值（图像模型常常不在 /models 里，当前值必须保住）
      const imageModelChoices = [...new Set([form.imageModel || '', ...imageModels].filter(Boolean))]
      const imagePresetId = presetIdOf(data.imagePresets, form.imageEndpoint, form.imageModel)
      const ttsPresetId = presetIdOf(data.ttsPresets, form.ttsEndpoint, form.ttsModel)
      const imagePreset = (data.imagePresets ?? []).find(row => row.id === imagePresetId)

      // 选服务商就把地址和模型填好；选「自定义」只把地址留给用户改，不动已经填的内容
      const changeImagePreset = id => {
        setTest(prev => ({ ...prev, image: null }))
        const preset = (data.imagePresets ?? []).find(row => row.id === id)
        if (!preset) return
        setForm(prev => ({ ...prev, imageEndpoint: preset.endpoint, imageModel: preset.model }))
      }

      const changeTtsPreset = id => {
        setTest(prev => ({ ...prev, tts: null }))
        const preset = (data.ttsPresets ?? []).find(row => row.id === id)
        if (!preset) return
        setForm(prev => ({ ...prev, ttsEndpoint: preset.endpoint, ttsModel: preset.model }))
      }

      const runTest = async target => {
        setTest(prev => ({ ...prev, [target]: { busy: true, ok: null, detail: '正在打一次真实请求…' } }))
        try {
          const payload = target === 'image'
            ? { target: 'image', endpoint: form.imageEndpoint, model: form.imageModel, key: keyFor('image') }
            : { target: 'tts', endpoint: form.ttsEndpoint, model: form.ttsModel, key: keyFor('tts'), voice: form.voice }
          const result = await post('test', payload)
          setTest(prev => ({
            ...prev,
            [target]: { busy: false, ok: Boolean(result.ok), detail: result.detail || '', models: result.models ?? [] },
          }))
        } catch (err) {
          setTest(prev => ({ ...prev, [target]: { busy: false, ok: false, detail: err.message } }))
        }
      }

      const save = async () => {
        setBusy(true)
        setError(null)
        try {
          await post('settings', { settings: form })
          if (ttsKey.trim()) await post('secrets', { ttsKey: ttsKey.trim() })
          if (imageKey.trim()) await post('secrets', { imageKey: imageKey.trim() })
          await onSaved()
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      }

      // 服务商下拉：预设 + 自定义
      const providerOptions = (presets, currentId) => [
        ...(presets ?? []).map(row => h('option', { key: row.id, value: row.id }, row.label)),
        h('option', { key: 'custom', value: 'custom' }, '自定义（自己填地址）'),
      ]

      return h('div', { className: 'sd-mask', onClick: event => { if (event.target === event.currentTarget) onClose() } },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '说书工作台设置' },
          h('h3', null, '设置'),
          h('div', { className: 'sd-hint' },
            data.model ? `文案模型跟随当前默认模型：${data.model.provider} · ${data.model.model}` : '当前没有默认模型，写稿会失败，先去接一个模型'),

          // 两块内容做成页签：点一个只显示对应的，避免一个长表单要滚半天
          h('div', { className: 'sd-tabs', role: 'tablist' },
            h('button', {
              className: 'sd-tab', type: 'button', role: 'tab',
              'data-on': tab === 'image' ? '1' : '0', 'aria-selected': tab === 'image' ? 'true' : 'false',
              onClick: () => setTab('image'),
            }, '生成图片'),
            h('button', {
              className: 'sd-tab', type: 'button', role: 'tab',
              'data-on': tab === 'tts' ? '1' : '0', 'aria-selected': tab === 'tts' ? 'true' : 'false',
              onClick: () => setTab('tts'),
            }, '生成声音'),
            h('button', {
              className: 'sd-tab', type: 'button', role: 'tab',
              'data-on': tab === 'general' ? '1' : '0', 'aria-selected': tab === 'general' ? 'true' : 'false',
              onClick: () => setTab('general'),
            }, '通用')),
          h('div', { className: 'sd-tabpanel' },
            tab === 'general'
              ? h('div', { className: 'sd-section' },
                h('div', { className: 'sd-section-title' }, '回收站'),
                h('div', { className: 'sd-field' },
                  h('label', null, '保留天数'),
                  h('input', {
                    className: 'sd-input', type: 'number', min: 1, max: 365,
                    value: form.trashDays ?? 7,
                    onChange: event => set('trashDays', Math.max(1, Math.min(365, Number(event.target.value) || 7))),
                  }),
                  h('div', { className: 'sd-hint', style: { marginTop: 5 } },
                    '删掉的项目先进回收站，超过这个天数自动彻底删除。改小之后，回收站里已过期的项目下次启动会被清掉。')))
              : null,
            tab === 'image'
              ? h('div', { className: 'sd-section' },
                h('div', { className: 'sd-section-title' }, '生成图片'),
            h('div', { className: 'sd-field' },
              h('label', null, '服务商'),
              h('select', {
                className: 'sd-select', value: imagePresetId,
                onChange: event => changeImagePreset(event.target.value),
              }, providerOptions(data.imagePresets))),
            h('div', { className: 'sd-field' },
              h('label', null, '地址'),
              h('input', {
                className: 'sd-input', value: form.imageEndpoint, spellCheck: false,
                placeholder: 'https://xxx/v1（本机填 http://127.0.0.1:30021/v1）',
                onChange: event => { set('imageEndpoint', event.target.value); setTest(prev => ({ ...prev, image: null })) },
              })),
            h('div', { className: 'sd-field' },
              h('label', null, '模型'),
              (!imageModels.length || modelManual)
                ? h(React.Fragment, null,
                  h('input', {
                    className: 'sd-input', value: form.imageModel, placeholder: 'qwen-image-2.1-turbo',
                    onChange: event => { set('imageModel', event.target.value); setTest(prev => ({ ...prev, image: null })) },
                  }),
                  imageModels.length
                    ? h('div', {
                        className: 'sd-hint', style: { cursor: 'pointer', color: 'var(--dsw-alias-link)' },
                        onClick: () => setModelManual(false),
                      }, '从检测到的列表里选')
                    : null)
                : h(React.Fragment, null,
                  h('select', {
                    className: 'sd-select',
                    value: imageModelChoices.includes(form.imageModel) ? form.imageModel : '__custom__',
                    onChange: event => {
                      const value = event.target.value
                      if (value === '__custom__') { setModelManual(true); return }
                      set('imageModel', value)
                      setTest(prev => ({ ...prev, image: null }))
                    },
                  },
                    imageModelChoices.map(name => h('option', { key: name, value: name }, name)),
                    h('option', { key: '__custom__', value: '__custom__' }, '自定义模型名…')),
                  h('div', { className: 'sd-hint' }, `检测到 ${imageModels.length} 个模型。图像模型常常不在这个列表里，可以选「自定义模型名」直接填。`))),
            h('div', { className: 'sd-field' },
              h('label', null, `密钥${data.secrets.imageKey ? '（已配置，留空不改）' : ''}`),
              h('input', {
                className: 'sd-input', type: 'password', value: imageKey, spellCheck: false,
                placeholder: '本机服务可留空；其余填 Bearer key',
                onChange: event => { setImageKey(event.target.value); setTest(prev => ({ ...prev, image: null })) },
              })),
            imagePreset?.note ? h('div', { className: 'sd-hint', style: { marginTop: 4 } }, imagePreset.note) : null,
            h('div', { className: 'sd-row', style: { gap: 12, marginTop: 4 } },
              h('div', { className: 'sd-field', style: { flex: 1 } },
                h('label', null, '画面风格'),
                h('select', { className: 'sd-select', value: form.visualStyle, onChange: event => set('visualStyle', event.target.value) },
                  data.styles.map(row => h('option', { key: row.id, value: row.id }, row.label)))),
              h('div', { className: 'sd-field', style: { flex: 1 } },
                h('label', null, '画面比例'),
                h('select', {
                  className: 'sd-select', value: `${form.width}x${form.height}`,
                  onChange: event => {
                    const [w, hh] = event.target.value.split('x').map(Number)
                    set('width', w); set('height', hh)
                    // 生图长边固定 1792，另一条边按画幅推，保证落在本机服务认的档位上
                    set('imageWidth', hh >= w ? 1024 : 1792)
                    set('imageHeight', hh >= w ? 1792 : 1024)
                  },
                },
                  h('option', { value: '1080x1920' }, '9:16 竖屏'),
                  h('option', { value: '1920x1080' }, '16:9 横屏')))),
            h('div', { className: 'sd-row', style: { marginTop: 10, gap: 8 } },
              h('button', {
                className: 'sd-btn', type: 'button',
                disabled: test.image?.busy, onClick: () => runTest('image'),
              }, test.image?.busy ? '检测中…' : '检测连接')),
            h(TestResult, { state: test.image }))
              : h('div', { className: 'sd-section' },
                h('div', { className: 'sd-section-title' }, '生成声音'),
            h('div', { className: 'sd-field' },
              h('label', null, '服务商'),
              h('select', {
                className: 'sd-select', value: ttsPresetId,
                onChange: event => changeTtsPreset(event.target.value),
              }, providerOptions(data.ttsPresets))),
            h('div', { className: 'sd-field' },
              h('label', null, '地址'),
              h('input', {
                className: 'sd-input', value: form.ttsEndpoint, spellCheck: false,
                placeholder: 'https://token-plan-cn.xiaomimimo.com/v1',
                onChange: event => { set('ttsEndpoint', event.target.value); setTest(prev => ({ ...prev, tts: null })) },
              })),
            h('div', { className: 'sd-field' },
              h('label', null, '模型'),
              h('input', {
                className: 'sd-input', value: form.ttsModel, placeholder: 'mimo-v2.5-tts',
                onChange: event => { set('ttsModel', event.target.value); setTest(prev => ({ ...prev, tts: null })) },
              })),
            h('div', { className: 'sd-field' },
              h('label', null, `密钥${data.secrets.ttsKey ? '（已配置，留空不改）' : ''}`),
              h('input', {
                className: 'sd-input', type: 'password', value: ttsKey, spellCheck: false,
                placeholder: '只写不读，保存后不回显',
                onChange: event => { setTtsKey(event.target.value); setTest(prev => ({ ...prev, tts: null })) },
              })),
            h('div', { className: 'sd-row', style: { gap: 12, marginTop: 4 } },
              h('div', { className: 'sd-field', style: { flex: 1 } },
                h('label', null, '音色'),
                h('select', { className: 'sd-select', value: form.voice, onChange: event => set('voice', event.target.value) },
                  data.voices.map(row => h('option', { key: row.id, value: row.id }, row.label)))),
              h('div', { className: 'sd-field', style: { flex: 1 } },
                h('label', null, '每段时长（秒）'),
                h('input', {
                  className: 'sd-input', type: 'number', min: 12, max: 90, value: form.segmentSeconds,
                  onChange: event => set('segmentSeconds', Number(event.target.value) || 40),
                }))),
            h('div', { className: 'sd-row', style: { marginTop: 10, gap: 8 } },
              h('button', {
                className: 'sd-btn', type: 'button',
                disabled: test.tts?.busy, onClick: () => runTest('tts'),
              }, test.tts?.busy ? '检测中…' : '检测连接')),
            h(TestResult, { state: test.tts }))),

          // ------------------------------------------------------ 装配开关
          h('div', { className: 'sd-row', style: { gap: 18, marginTop: 14, flexWrap: 'wrap' } },
            h('label', { className: 'sd-hint', style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' } },
              h('input', { type: 'checkbox', checked: Boolean(form.kenBurns), onChange: event => set('kenBurns', event.target.checked) }),
              '画面缓慢推近'),
            h('label', { className: 'sd-hint', style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' } },
              h('input', { type: 'checkbox', checked: Boolean(form.burnSubtitles), onChange: event => set('burnSubtitles', event.target.checked) }),
              '字幕压进画面')),

          error ? h('div', { className: 'sd-error' }, error) : null,

          h('div', { className: 'sd-dialog-foot' },
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', onClick: onClose, disabled: busy }, '取消'),
            h('button', { className: 'sd-btn', 'data-kind': 'primary', onClick: save, disabled: busy },
              busy ? '保存中…' : '保存'))))
    }

    // ------------------------------------------------------------------ 注册

    return {
      inject: ['slots'],
      apply(ctx) {
        // 中央面板：侧栏条目 id 就是 main 的 key
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: MAIN_KEY }, StoryDesk))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 6,
          label: () => '说书工作台',
        }, () => h(DeskIcon, { size: 16 })))
      },
    }
  },
})
