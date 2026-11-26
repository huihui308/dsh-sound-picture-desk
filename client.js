window.__ModuleLoader__.load({
  id: 'dsh-sound-picture-desk',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const API = '/sound-picture-desk'
    const MAIN_KEY = 'sound-picture-desk'
    const PANEL_ID = 'sound-picture-desk'

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
.sd-stop{flex:0 0 auto;margin-left:auto;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;padding:2px 10px;border-radius:5px;cursor:pointer;line-height:1.7}
.sd-stop:hover:not(:disabled){border-color:var(--dsw-alias-state-error-base, #c0392b);color:var(--dsw-alias-state-error-primary, #c0392b)}
.sd-stop:disabled{opacity:.55;cursor:default}
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
.sd-cover-preview{width:150px;border-radius:8px;display:block;background:var(--dsw-alias-bg-layer-2)}
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
/* 自绘下拉：原生弹层在深色主题下常是浅底，分组标题（模型提供商）亮得刺眼，各平台还不一致 */
.sd-picker{position:relative}
.sd-picker-trigger{display:flex;align-items:center;gap:8px;text-align:left;cursor:pointer}
.sd-picker-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-picker-caret{flex:0 0 auto;font-size:10px;line-height:1;color:var(--dsw-alias-label-tertiary)}
.sd-picker-menu{position:fixed;z-index:75;box-sizing:border-box;overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(24px) saturate(150%));box-shadow:0 12px 32px rgba(0,0,0,.38);color:var(--dsw-alias-label-primary)}
.sd-picker-group{padding:8px 8px 3px;font-size:10.5px;font-weight:600;letter-spacing:.05em;color:var(--dsw-alias-label-tertiary)}
.sd-picker-opt{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;font-size:12.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap}
.sd-picker-opt-label{min-width:0;overflow:hidden;text-overflow:ellipsis}
.sd-picker-opt[data-active="1"]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.sd-picker-opt[data-selected="1"]{color:var(--dsw-alias-label-primary)}
.sd-picker-check{flex:0 0 12px;font-size:11px;color:var(--dsw-alias-brand-primary)}

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
.sd-tabnav{display:flex;flex-wrap:wrap;gap:2px;row-gap:0;border-bottom:1px solid var(--dsw-alias-border-l1);margin-top:2px}
.sd-tabnav-btn{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12.5px;padding:8px 13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;line-height:1.4;white-space:nowrap}
.sd-tabnav-btn:hover{color:var(--dsw-alias-label-primary)}
.sd-tabnav-btn:disabled{opacity:.45;cursor:not-allowed}
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
/* ---------------- 发布页 ---------------- */
.sd-pub-head{display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap}
.sd-pub-kicker{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.sd-pub-title{font-size:15px;font-weight:650;margin-top:3px}
.sd-pub-sub{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-top:3px}
.sd-pub-chip{font-size:10.5px;padding:2px 8px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.sd-pub-chip[data-tone="ok"]{color:var(--dsw-alias-state-success-primary)}
.sd-pub-chip[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.sd-pub-chip[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}
.sd-pub-tabs{display:flex;gap:8px;margin-top:12px}
.sd-pub-tab{flex:1;display:flex;align-items:center;gap:9px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:9px 12px;cursor:pointer;text-align:left;font:inherit;color:inherit;min-width:0}
.sd-pub-tab[data-on="1"]{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 6%,var(--dsw-alias-bg-layer-1))}
.sd-pub-taberr{margin-left:auto;min-width:18px;height:18px;border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 18%,transparent);color:var(--dsw-alias-state-error-primary);font-size:10.5px;display:flex;align-items:center;justify-content:center;padding:0 5px}
.sd-pub-tabwarn{margin-left:auto;color:var(--dsw-alias-state-warn-primary);font-size:11px}
.sd-pub-picon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex:0 0 auto;letter-spacing:.02em;text-align:center;line-height:1.1}
.sd-pub-picon[data-platform="xiaohongshu"]{background:#ff2442}
.sd-pub-picon[data-platform="x"]{background:#000;font-size:14px}
.sd-pub-pname{font-size:12px;font-weight:600;display:block}
.sd-pub-pmeta{font-size:10.5px;color:var(--dsw-alias-label-tertiary);margin-top:1px;display:block}
.sd-pub-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:12px;margin-top:12px;align-items:start}
.sd-pub-col{display:flex;flex-direction:column;gap:10px;min-width:0}
.sd-pub-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:11px;display:flex;flex-direction:column;gap:8px;min-width:0}
.sd-pub-card-head{display:flex;align-items:center;gap:8px;min-height:20px}
.sd-pub-card-title{font-size:12.5px;font-weight:600}
.sd-pub-counter{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap}
.sd-pub-tags{display:flex;flex-wrap:wrap;gap:5px;align-items:center;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:6px;padding:5px 7px;min-height:32px}
.sd-pub-tags input{border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11px;min-width:120px;flex:1;padding:2px 0}
.sd-pub-tagx{border:none;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;font-size:11px;padding:0 0 0 2px;line-height:1}
.sd-pub-coverrow{display:flex;gap:10px;align-items:flex-start}
.sd-pub-coverbox{width:132px;height:176px;flex:0 0 132px;border-radius:7px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);position:relative}
.sd-pub-coverbox img{width:100%;height:100%;object-fit:cover;display:block}
.sd-pub-cover-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);font-size:10.5px;text-align:center;padding:8px;line-height:1.5}
.sd-pub-checkrow{display:flex;align-items:center;gap:8px;min-height:22px;font-size:11px;border-top:1px solid var(--dsw-alias-border-l1)}
.sd-pub-checkrow:first-of-type{border-top:none}
.sd-pub-checkmark{width:12px;flex:0 0 12px;text-align:center}
.sd-pub-checkname{color:var(--dsw-alias-label-secondary);white-space:nowrap}
.sd-pub-checkval{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:10.5px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62%}
.sd-pub-checkval[data-state="warn"]{color:var(--dsw-alias-state-warn-primary)}
.sd-pub-checkval[data-state="error"]{color:var(--dsw-alias-state-error-primary)}
.sd-pub-tree{background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:7px 8px;display:flex;flex-direction:column;gap:1px;max-height:180px;overflow:auto}
.sd-pub-treerow{display:flex;align-items:center;gap:8px;min-height:19px;font-size:10.5px}
.sd-pub-treepath{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-pub-treelink{margin-left:auto;color:var(--dsw-alias-link);text-decoration:none;font-size:10px;white-space:nowrap}
.sd-pub-records{display:flex;flex-wrap:wrap;gap:12px;margin-top:2px}
.sd-pub-record{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.sd-pub-record .sd-btn{padding:2px 7px;font-size:10px}
.sd-pub-foot{margin-top:12px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;justify-content:space-between;gap:12px;font-size:10.5px;color:var(--dsw-alias-label-tertiary);flex-wrap:wrap}
.sd-tabnav-sep{width:1px;height:14px;background:var(--dsw-alias-border-l2);margin:0 8px;flex:0 0 auto;align-self:center}
.sd-pub-error{color:var(--dsw-alias-state-error-primary);font-size:11.5px;line-height:1.6}
.sd-pub-ok{color:var(--dsw-alias-state-success-primary);font-size:11.5px;line-height:1.6;word-break:break-all}
.sd-pub-note{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.sd-pub-head-actions{margin-left:auto;padding-bottom:2px}
.sd-pub-labelrow{display:flex;align-items:center;gap:8px}
.sd-pub-ask{margin-left:auto;border:none;background:transparent;color:var(--dsw-alias-brand-primary);font:inherit;font-size:10.5px;cursor:pointer;padding:0;line-height:1.6}
.sd-pub-ask:hover{text-decoration:underline}
.sd-pub-ask:disabled{opacity:.45;cursor:not-allowed;text-decoration:none}
.sd-rev-scopes{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 2px}
.sd-rev-scope{font-size:10.5px;padding:3px 9px;border-radius:99px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer}
.sd-rev-scope[data-on="1"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}
.sd-rev-quick{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.sd-rev-quick button{font-size:10.5px;padding:3px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer}
.sd-rev-quick button:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.sd-rev-quick button[data-on="1"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}
.sd-rev-old{font-size:11.5px;line-height:1.7;color:var(--dsw-alias-label-tertiary);text-decoration:line-through;white-space:pre-wrap;max-height:120px;overflow:auto}
.sd-rev-new{font-size:11.5px;line-height:1.7;color:var(--dsw-alias-label-primary);white-space:pre-wrap;max-height:180px;overflow:auto;border-left:2px solid var(--dsw-alias-state-success-primary);padding-left:8px;margin-top:4px}
.sd-rev-proposal{display:flex;flex-direction:column;gap:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-base)}
.sd-rev-proposal-head{display:flex;align-items:center;gap:8px;font-size:11.5px}
.sd-rev-proposal-head span{margin-left:auto;font-size:10px;color:var(--dsw-alias-state-warn-primary)}
.sd-rev-row{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.7;color:var(--dsw-alias-label-secondary)}
.sd-rev-row b{flex:0 0 38px;font-weight:400;color:var(--dsw-alias-label-tertiary)}
.sd-rev-choice{display:flex;gap:7px;align-items:center;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:6px 8px;margin-top:5px;cursor:pointer;font-size:11.5px}
.sd-rev-choice[data-on="1"]{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 6%,transparent)}
.sd-rev-choice input{margin:0}
.sd-rev-actions{display:flex;gap:7px;margin-top:4px}
.sd-rev-actions .sd-btn{flex:1}
.sd-rev-sources{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.sd-rev-source{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:7px;padding:3px;cursor:pointer;display:flex;flex-direction:column;gap:3px;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:9.5px;text-align:left}
.sd-rev-source[data-on="1"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.sd-rev-source img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:4px;display:block;background:var(--dsw-alias-bg-layer-2)}
.sd-rev-history{border-top:1px solid var(--dsw-alias-border-l1);padding-top:8px;margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow:auto}
.sd-rev-history-row{display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--dsw-alias-label-tertiary)}
.sd-rev-history-row b{font-weight:400;color:var(--dsw-alias-label-secondary);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-rev-history-row .sd-btn{margin-left:auto;padding:2px 7px;font-size:10px}
.sd-rev-tabs{display:flex;gap:4px;border-bottom:1px solid var(--dsw-alias-border-l1);margin:2px 0 1px}
.sd-rev-tab{border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;padding:4px 9px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.sd-rev-tab[data-on="1"]{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}

/* ---- 工作台导航（左栏） ---- */
.sd-rail{width:258px;flex:0 0 258px;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-layer-1));display:flex;flex-direction:column;min-height:0;padding:0 12px 10px}
.sd-brand{display:flex;align-items:center;gap:10px;padding:16px 6px 12px}
.sd-brand-t{display:flex;flex-direction:column;gap:3px}
.sd-brand-t b{font-size:14px;font-weight:600;letter-spacing:.02em}
.sd-brand-t s{font-size:10px;color:var(--dsw-alias-label-tertiary);text-decoration:none;letter-spacing:.16em}
.sd-group{font-size:10px;color:var(--dsw-alias-label-tertiary);letter-spacing:.16em;padding:10px 8px 6px}
.sd-navrow{display:flex;align-items:center;gap:8px;height:32px;padding:0 8px;border-radius:7px;font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.sd-navrow[data-on="1"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sd-navrow em{font-style:normal;font-size:10.5px;color:var(--dsw-alias-label-tertiary)}
.sd-nav-add{margin-left:auto;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:13px;cursor:pointer;padding:0 2px;line-height:1}
.sd-nav-add:hover{color:var(--dsw-alias-brand-primary)}
.sd-projlist{overflow:auto;padding:2px 0 4px;display:flex;flex-direction:column;gap:1px;min-height:0}
.sd-proj{display:flex;gap:9px;padding:6px 8px;border-radius:8px;cursor:pointer;position:relative;align-items:flex-start}
.sd-proj:hover{background:var(--dsw-alias-bg-layer-2)}
.sd-proj[data-on="1"]{background:var(--dsw-alias-bg-layer-2)}
.sd-proj[data-on="1"]::before{content:'';position:absolute;left:-12px;top:9px;bottom:9px;width:2px;border-radius:0 2px 2px 0;background:var(--dsw-alias-brand-primary)}
.sd-proj-thumb{width:30px;height:52px;flex:0 0 30px;border-radius:3px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}
.sd-proj-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.sd-proj-x{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.sd-proj-x b{font-size:12px;font-weight:400;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-proj[data-on="1"] .sd-proj-x b{color:var(--dsw-alias-label-primary);font-weight:600}
.sd-proj-x s{font-size:9.5px;color:var(--dsw-alias-label-tertiary);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-proj-x em{font-style:normal;font-size:9.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-proj-x em[data-kind="run"]{color:var(--dsw-alias-brand-primary)}
.sd-proj-del{position:absolute;right:3px;top:3px;border:none;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-size:12px;line-height:1;padding:2px 5px;opacity:0;border-radius:4px}
.sd-proj:hover .sd-proj-del{opacity:1}
.sd-proj-del:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-3)}
.sd-side-foot{margin-top:auto;border-top:1px solid var(--dsw-alias-border-l1);padding-top:8px;display:flex;flex-direction:column;gap:1px}

/* ---- 左栏：品牌 + 分组 + 图标行 ---- */
.sd-brand{display:flex;align-items:center;gap:10px;padding:16px 14px 14px}
.sd-blogo{width:34px;height:34px;flex:0 0 34px;border-radius:9px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-brand-primary)}
.sd-brandtext b{display:block;font-size:14px;letter-spacing:.04em}
.sd-brandtext s{display:block;font-size:9.5px;color:var(--dsw-alias-label-tertiary);text-decoration:none;letter-spacing:.18em;margin-top:3px}
.sd-group{font-size:10px;color:var(--dsw-alias-label-tertiary);letter-spacing:.16em;padding:14px 14px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-nav{display:flex;align-items:center;gap:10px;height:34px;margin:0 8px;padding:0 9px;border-radius:7px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.sd-nav i{display:flex;color:var(--dsw-alias-label-tertiary)}
.sd-nav[data-on="1"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sd-nav[data-on="1"] i{color:var(--dsw-alias-brand-primary)}
.sd-nav em{font-style:normal;margin-left:auto;font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:92px}
.sd-nav b{font-weight:400;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-nav .sd-step{width:16px;height:16px;flex:0 0 16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8.5px;line-height:1;border:1.2px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);margin-left:1px}
.sd-nav .sd-step[data-state="done"]{background:var(--dsw-alias-brand-primary);border:1.2px solid var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:700}
.sd-nav .sd-step[data-state="now"]{border:1.2px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);background:transparent}
.sd-nav[data-state="now"] b{font-weight:600;color:var(--dsw-alias-label-primary)}


/* ---- 选题池 ---- */
.sd-ideaform{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sd-ideaform .sd-input{flex:1;min-width:180px}
.sd-ideas{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.sd-idea{display:flex;align-items:center;gap:14px;padding:11px 13px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}
.sd-idea-x{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.sd-idea-x b{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-idea-x s{font-size:11px;color:var(--dsw-alias-label-secondary);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-idea-x em{font-size:10px;color:var(--dsw-alias-label-tertiary);font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-idea-ops{display:flex;gap:6px;flex:0 0 auto}


/* ---- 选题池：矩阵 + 抽屉 ---- */
.sd-idea-pane{position:relative}
.sd-idea-pane:has(.sd-drawer) .sd-body{padding-right:446px}
.sd-quick{display:flex;gap:8px;align-items:center;margin-bottom:12px}
.sd-quick .sd-input{flex:1}
.sd-mx{display:grid;grid-template-columns:64px repeat(6,1fr);gap:6px}
.sd-mx-colf{text-align:center;font-size:10px;color:var(--dsw-alias-label-tertiary);padding-bottom:2px}
.sd-mx-row{display:flex;align-items:center;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.sd-mx-cell{height:46px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);font:inherit;font-size:14px;font-variant-numeric:tabular-nums;cursor:pointer}
.sd-mx-cell:hover{border-color:var(--dsw-alias-brand-primary)}
.sd-mx-cell[data-empty="1"]{background:transparent;border:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.sd-mx-cell[data-hot="1"]{color:var(--dsw-alias-brand-primary)}
.sd-mx-cell[data-on="1"]{border:1.5px solid var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary)}
.sd-thin{display:flex;gap:8px;flex-wrap:wrap}
.sd-thin-item{display:flex;align-items:center;gap:7px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-layer-1);padding:7px 11px;font:inherit;font-size:11px;color:var(--dsw-alias-label-primary);cursor:pointer}
.sd-thin-item span{color:var(--dsw-alias-label-tertiary)}
.sd-thin-item em{font-style:normal;color:var(--dsw-alias-label-tertiary);font-size:10px}
.sd-thin-item b{color:var(--dsw-alias-brand-primary);font-weight:400;font-size:10.5px}
.sd-drawer{position:absolute;top:0;right:0;bottom:0;width:430px;background:var(--dsw-alias-bg-layer-1);border-left:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;z-index:5;box-shadow:-16px 0 32px rgba(0,0,0,.28)}
.sd-dw-head{display:flex;align-items:flex-start;gap:10px;padding:14px 16px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.sd-dw-head b{font-size:14px}
.sd-dw-head p{font-size:10.5px;color:var(--dsw-alias-label-tertiary);margin-top:4px;line-height:1.6}
.sd-dw-head .sd-btn{margin-left:auto}
.sd-dw-body{padding:12px 16px;overflow:auto;flex:1}
.sd-dw-label{font-size:10.5px;color:var(--dsw-alias-label-tertiary);margin-bottom:8px}
.sd-hooks{display:flex;flex-wrap:wrap;gap:6px}
.sd-hook{height:27px;padding:0 11px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;cursor:pointer}
.sd-hook[data-on="1"]{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary)}
.sd-cands{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.sd-cand{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);padding:10px 12px;display:flex;flex-direction:column;gap:4px}
.sd-cand b{font-size:12.5px;font-weight:600;line-height:1.5}
.sd-cand s{font-size:10.5px;color:var(--dsw-alias-label-tertiary);text-decoration:none;line-height:1.6}
.sd-cand-row{display:flex;gap:5px;align-items:center;margin-top:3px;flex-wrap:wrap}
.sd-cand-row .sd-tag[data-src="1"]{color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 30%,transparent);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-cand-row .sd-tag[data-warn="1"]{color:var(--dsw-alias-state-warning-primary)}
.sd-dw-tip{font-size:10px;color:var(--dsw-alias-label-tertiary);line-height:1.7;margin-top:10px}


/* ---- 选题池：下拉找题 ---- */
.sd-find{border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;padding:12px 14px;margin-bottom:4px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 3%,transparent)}
.sd-find-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.sd-find-lb{font-size:10.5px;color:var(--dsw-alias-label-tertiary)}
.sd-find-hint{font-size:10px;color:var(--dsw-alias-label-tertiary);margin-left:auto}
.sd-select{height:30px;padding:0 8px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;flex:0 0 auto;width:138px}
.sd-pick-chips{display:flex;gap:6px;flex-wrap:wrap}
.sd-pick-chip{height:27px;padding:0 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;cursor:pointer}
.sd-pick-chip[data-on="1"]{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary)}
.sd-sec-title{font-size:10.5px;color:var(--dsw-alias-label-tertiary);margin:16px 0 9px}
.sd-idea-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.sd-icard{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:11px 12px;display:flex;flex-direction:column;gap:5px}
.sd-icard[data-used="1"]{opacity:.62}
.sd-icard b{font-size:12.5px;font-weight:600;line-height:1.5}
.sd-icard s{font-size:10.5px;color:var(--dsw-alias-label-tertiary);text-decoration:none;line-height:1.6}
.sd-icard-ops{display:flex;gap:6px;margin-top:3px}

/* ---- 主页项目墙 ---- */
.sd-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:18px}
.sd-pcard{display:flex;flex-direction:column;padding:0;border-radius:10px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);font:inherit;color:inherit;text-align:left;cursor:pointer}
.sd-pcard:hover{border-color:var(--dsw-alias-brand-primary)}
.sd-ph{position:relative;display:block;aspect-ratio:9/16;overflow:hidden;background:var(--dsw-alias-bg-layer-2)}
.sd-ph img{width:100%;height:100%;object-fit:cover;display:block}
.sd-ph::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,5,3,0) 45%,rgba(8,5,3,.92) 100%)}
.sd-tag{position:absolute;right:9px;top:9px;z-index:2;font-size:9.5px;padding:2px 7px;border-radius:5px;background:rgba(12,9,7,.72);color:var(--dsw-alias-label-secondary)}
.sd-tag[data-k="done"]{color:var(--dsw-alias-brand-primary);background:rgba(12,9,7,.66)}
.sd-tag[data-k="run"]{color:#e9c98d}
.sd-pt{position:absolute;left:13px;right:13px;bottom:12px;z-index:2}
.sd-pt b{display:block;font-size:15px;font-weight:600;color:#f4ead9}
.sd-pt s{display:block;font-size:10.5px;color:rgba(241,230,211,.72);text-decoration:none;margin-top:4px}
.sd-bar{display:block;height:3px;background:rgba(255,255,255,.14);margin-top:9px;border-radius:2px;overflow:hidden}
.sd-bar i{display:block;height:100%;background:var(--dsw-alias-brand-primary)}
.sd-pn{padding:9px 13px 11px;font-size:10.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ---- 全局页：人物库 / 发布 / 数据 ---- */
.sd-facegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:12px}
.sd-facecard{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);font:inherit;color:inherit;cursor:pointer;text-align:left}
.sd-facecard:hover{border-color:var(--dsw-alias-brand-primary)}
.sd-faceimg{width:100%;aspect-ratio:1;border-radius:7px;overflow:hidden;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;margin-bottom:5px;color:var(--dsw-alias-label-tertiary)}
.sd-faceimg img{width:100%;height:100%;object-fit:cover;display:block}
.sd-facecard b{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.sd-facecard s{font-size:10.5px;color:var(--dsw-alias-label-tertiary);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.sd-facecard em{font-style:normal;font-size:10px;color:var(--dsw-alias-label-tertiary)}
.sd-rows{display:flex;flex-direction:column;gap:6px}
.sd-rowitem{display:flex;align-items:center;gap:12px;padding:9px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}
.sd-rowitem-t{flex:1;font-size:12.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-rowitem-m{font-size:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.sd-statgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:16px}
.sd-stat{padding:11px 13px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}
.sd-stat b{display:block;font-size:10px;font-weight:400;color:var(--dsw-alias-label-tertiary);letter-spacing:.1em;margin-bottom:6px}
.sd-stat s{font-size:18px;text-decoration:none;font-variant-numeric:tabular-nums}

/* ---- 阶段轨道 ---- */
.sd-stage{display:flex;align-items:flex-start;padding:2px 0 0;border-bottom:1px solid var(--dsw-alias-border-l1);margin-top:2px}
.sd-stage-i{display:flex;align-items:flex-start;gap:9px;border:none;background:transparent;font:inherit;cursor:pointer;padding:6px 0 10px;width:126px;flex:0 0 auto;text-align:left}
.sd-stage-i:disabled{cursor:not-allowed;opacity:.5}
.sd-stage-i:hover .sd-stage-x b{color:var(--dsw-alias-label-secondary)}
.sd-stage-dot{width:22px;height:22px;border-radius:50%;flex:0 0 22px;display:flex;align-items:center;justify-content:center;font-size:11px;border:1.5px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);line-height:1}
.sd-stage-i[data-done="1"] .sd-stage-dot{background:var(--dsw-alias-brand-primary);border:1.5px solid var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:700}
.sd-stage-i[data-on="1"] .sd-stage-dot{border-style:solid;border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.sd-stage-i[data-on="1"][data-done="1"] .sd-stage-dot{color:var(--dsw-alias-bg-base)}
.sd-stage-x{display:flex;flex-direction:column;gap:2px;padding-top:1px;min-width:0}
.sd-stage-x b{font-size:12.5px;font-weight:400;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.sd-stage-i[data-done="1"] .sd-stage-x b{color:var(--dsw-alias-label-secondary)}
.sd-stage-i[data-on="1"] .sd-stage-x b{color:var(--dsw-alias-label-primary);font-weight:600}
.sd-stage-x s{font-size:10px;color:var(--dsw-alias-label-tertiary);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px}
.sd-stage-l{flex:1;height:1px;background:var(--dsw-alias-border-l2);margin:17px 4px 0 0;min-width:10px}

/* ---- 底部任务带 ---- */
.sd-job{display:flex;align-items:center;gap:12px;padding:9px 22px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-size:11.5px;flex:0 0 auto}
.sd-job[data-kind="error"]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}
.sd-job-t{color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}
.sd-job-bar{width:240px;height:4px;border-radius:2px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;flex:0 0 auto}
.sd-job-bar i{display:block;height:100%;background:var(--dsw-alias-brand-primary);transition:width .3s ease}
.sd-job-m{color:var(--dsw-alias-label-tertiary);white-space:nowrap}

/* ---- 界面配色：工作台暖调（墨褐 + 暖金） ---- */
.sd-root[data-theme="warm"]{
  --dsw-alias-bg-base:#16110d;
  --dsw-alias-bg-layer-1:#1c1611;
  --dsw-alias-bg-layer-2:#261e16;
  --dsw-alias-bg-layer-3:#31271c;
  --dsw-alias-bg-overlay:#1f1813;
  --dsw-alias-label-primary:#f1e6d3;
  --dsw-alias-label-secondary:#b6a48c;
  --dsw-alias-label-tertiary:#82725f;
  --dsw-alias-border-l1:#3a2d22;
  --dsw-alias-border-l2:#2b2219;
  --dsw-alias-brand-primary:#d9a441;
  --dsw-alias-link:#d9a441;
  --dsw-alias-button-primary-fill:#d9a441;
  --dsw-alias-button-primary-hover:#e3b357;
  --dsw-alias-interactive-bg-hover:#2d241a;
  --dsw-alias-state-success-primary:#7fa46f;
  --dsw-alias-state-error-primary:#d4614a;
  --dsw-alias-state-error-base:#c9442d;
  --dsw-alias-state-warn-primary:#d9a441;
  --dsw-alias-state-idle-primary:#82725f;
  --dsw-specific-sidebar-fill:#1c1611;
  --dsw-specific-menu:#251e17
}
.sd-root[data-theme="warm"] .sd-btn[data-kind="primary"]{color:#1a130c}
.sd-root[data-theme="warm"] .sd-danger,
.sd-root[data-theme="warm"] .sd-error{color:#e0836b}

/* ---- 界面配色：跟随 DSH（宿主变量没传进插件，这里按 DSH 深色中性配色给一套） ---- */
.sd-root[data-theme="dsh"]{
  --dsw-alias-bg-base:#1b1c20;
  --dsw-alias-bg-layer-1:#202227;
  --dsw-alias-bg-layer-2:#262a31;
  --dsw-alias-bg-layer-3:#2e333b;
  --dsw-alias-bg-overlay:#202227;
  --dsw-alias-label-primary:#e9eaee;
  --dsw-alias-label-secondary:#a9aeb7;
  --dsw-alias-label-tertiary:#7b818b;
  --dsw-alias-border-l1:#343941;
  --dsw-alias-border-l2:#2a2f36;
  --dsw-alias-brand-primary:#6c9dff;
  --dsw-alias-link:#6c9dff;
  --dsw-alias-button-primary-fill:#4f8bf5;
  --dsw-alias-button-primary-hover:#6299f7;
  --dsw-alias-interactive-bg-hover:#2b3038;
  --dsw-alias-state-success-primary:#63bf85;
  --dsw-alias-state-error-primary:#e0725f;
  --dsw-alias-state-error-base:#d4553f;
  --dsw-alias-state-warn-primary:#d9a441;
  --dsw-alias-state-idle-primary:#7b818b;
  --dsw-specific-sidebar-fill:#202227;
  --dsw-specific-menu:#262a31
}
.sd-root[data-theme="dsh"] .sd-btn[data-kind="primary"]{color:#fff}
.sd-root[data-theme="dsh"] .sd-danger,
.sd-root[data-theme="dsh"] .sd-error{color:#ef8a76}


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

    /** 成片版本号：重合成后 URL 要变，否则 <video> 会继续放旧片。 */
    function renderStamp(item) {
      return item.render?.at ? Date.parse(item.render.at) : undefined
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
      // 场记板线稿：侧栏 16px / 页头 17px 共用；实心 currentColor，小尺寸不靠细描边
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor',
        'aria-hidden': true, style: { display: 'block' },
      },
      h('rect', { x: 2.5, y: 4.2, width: 17.6, height: 2.9, rx: 1.3, transform: 'rotate(-15 11.3 5.7)' }),
      h('path', {
        fillRule: 'evenodd',
        d: 'M5.5 9.6 H18.5 C19.66 9.6 20.6 10.54 20.6 11.7 V18.3 C20.6 19.46 19.66 20.4 18.5 20.4 H5.5 C4.34 20.4 3.4 19.46 3.4 18.3 V11.7 C3.4 10.54 4.34 9.6 5.5 9.6 Z M9.3 12.3 H10.7 V16.6 H9.3 Z M11.7 11.3 H13.1 V17.6 H11.7 Z M14.1 12.3 H15.5 V16.6 H14.1 Z',
      }))
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
      const [view, setView] = useState('home')
      // 从选题池点「用它开项目」时，把标题带进新建弹窗
      const [newTopic, setNewTopic] = useState('')
      const [chatOpen, setChatOpen] = useState(true)
      const [chatInput, setChatInput] = useState('')
      const [sending, setSending] = useState(false)
      const timer = useRef(null)
      // 轮询和手动刷新会同时存在：只让最后一次请求的响应落到页面上，旧响应晚回来不能盖新数据
      const loadSeq = useRef(0)

      const load = useCallback(async () => {
        const seq = ++loadSeq.current
        try {
          const next = await api('state')
          if (seq !== loadSeq.current) return null
          setData(next)
          setError(null)
          setCurrentId(prev => {
            if (prev && next.items.some(row => row.id === prev)) return prev
            return next.items[0]?.id ?? null
          })
          return next
        } catch (err) {
          if (seq !== loadSeq.current) return null
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

      // 界面配色：点一下立即生效。localStorage 优先——host 没重启时不认这个键，写进 state 也被过滤
      const [theme, setTheme] = useState('warm')
      const chooseTheme = useCallback(value => {
        const next = value === 'dsh' ? 'dsh' : 'warm'
        setTheme(next)
        try { window.localStorage.setItem('spd-theme', next) } catch { /* 存不进也不影响本次 */ }
      }, [])
      useEffect(() => {
        let stored = null
        try { stored = window.localStorage.getItem('spd-theme') } catch { stored = null }
        if (stored === 'warm' || stored === 'dsh') { setTheme(stored); return }
        const fromSettings = data?.settings?.theme
        if (fromSettings === 'warm' || fromSettings === 'dsh') setTheme(fromSettings)
      }, [data?.settings?.theme])

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

      // 从主页/人物库/发布/数据点回某个项目：切到它并回到项目视图
      const openItem = useCallback(id => {
        setNotice(null)
        setCurrentId(id)
        setView('project')
      }, [])

      const clearChat = useCallback(async () => {
        try {
          await post('chat/clear', {})
          await load()
        } catch {
          // 清空失败不影响使用
        }
      }, [load])

      if (error) {
        return h('div', { className: 'sd-root', 'data-theme': theme },
          h('div', { className: 'sd-pane' },
            h('div', { className: 'sd-head' }, h('div', { className: 'sd-h1' }, '声画工作台')),
            h('div', { className: 'sd-body' },
              h('div', { className: 'sd-empty' },
                h('div', null, `工作台加载失败：${error}`),
                h('div', { style: { marginTop: 12 } },
                  h('button', { className: 'sd-btn', onClick: () => load() }, '重试'))))))
      }

      if (!data) {
        return h('div', { className: 'sd-root', 'data-theme': theme },
          h('div', { className: 'sd-pane' },
            h('div', { className: 'sd-body', style: { paddingTop: 48, color: 'var(--dsw-alias-label-tertiary)' } }, '正在打开工作台…')))
      }

      return h(React.Fragment, null,
        h('style', null, STYLE),
        h('div', { className: 'sd-root', 'data-theme': theme },
          h(Rail, {
            items: data.items, view, onView: setView,
            onCreate: () => { setNotice(null); setCreating(true) },
            trashCount: data.trashCount ?? 0,
            onOpenTrash: () => setTrashOpen(true),
            onSettings: () => setSettingsOpen(true),
          }),
          h('div', { className: 'sd-pane' },
            view === 'home'
              ? h(HomeView, {
                items: data.items, onOpen: openItem,
                onCreate: () => { setNotice(null); setCreating(true) },
              })
              : view === 'ideas' ? h(IdeasView, {
                onUse: title => { setNotice(null); setNewTopic(title); setCreating(true) },
              })
              : view === 'anchors' ? h(AnchorLibrary, { items: data.items, onOpen: openItem })
                : view === 'assets' ? h(AssetLibrary, null)
                  : view === 'publish' ? h(PublishOverview, { items: data.items, onOpen: openItem })
                    : view === 'data' ? h(DataOverview, { items: data.items, onOpen: openItem })
                      : current
                        ? h(Project, {
                          // key 用项目 id：切项目时整棵子树重挂，各页本地状态（草稿/封面大字/大图）不残留
                          key: current.id, item: current, data, busy, notice,
                          onAction: run, onReload: load, onSettings: () => setSettingsOpen(true),
                        })
                        : h(EmptyState, { onCreate: () => setCreating(true), model: data.model })),
          // 助手栏已按需求移除：chat 相关逻辑保留，界面不再渲染
          pendingDelete ? h(ConfirmDelete, {
            item: pendingDelete,
            days: data.trashDays ?? 7,
            busy: deletingBusy,
            // 失败提示就地显示：Project 头部的 notice 会被遮罩盖住
            error: notice?.tone === 'error' ? notice.text : null,
            onCancel: () => setPendingDelete(null),
            onConfirm: async () => {
              setDeletingBusy(true)
              try {
                await post('remove', { id: pendingDelete.id })
                setPendingDelete(null)
                // 删的正好是当前打开的项目，就回到空状态
                if (pendingDelete.id === currentId) setCurrentId(null)
                await load()
                setNotice(`已移入回收站，${data.trashDays ?? 7} 天内可还原`)
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
            data, theme, onTheme: chooseTheme,
            onClose: () => setSettingsOpen(false),
            onSaved: async () => { await load(); setSettingsOpen(false) },
          }) : null,
          creating ? h(NewDialog, {
            // 创建失败时就地提示，不用去头部找被遮罩盖住的 notice
            error: notice?.tone === 'error' ? notice.text : null,
            initialTopic: newTopic,
            onClose: () => { setCreating(false); setNewTopic('') },
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

    const NAV_ICONS = {
      home: ['M3 3.5h5.5v5.5H3z', 'M11.5 3.5H17v5.5h-5.5z', 'M3 13h5.5v5.5H3z', 'M11.5 13H17v5.5h-5.5z'],
      people: ['M7.5 4.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 1 0 0-5.6', 'M2.5 16.6c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8', 'M14.6 6.1a2 2 0 1 0 0 4 2 2 0 1 0 0-4', 'M13.3 12.4c2.1.3 3.8 2 3.8 4.2'],
      audio: ['M6 11.9a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 1 0 0-4.4', 'M8.2 16.3V6.3l8.4-1.6v8', 'M14.6 10.3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 1 0 0-4.4'],
      send: ['M10 16.5V4', 'M5.2 8.8 10 4l4.8 4.8'],
      chart: ['M3 16.5V9', 'M8 16.5V4', 'M13 16.5v-6', 'M18 16.5H2'],
      trash: ['M3.5 5.5h13', 'M8 5.5V3.8h4v1.7', 'M5.5 5.5l.8 11h7.4l.8-11'],
      idea: ['M4.5 3.5h11v13l-5.5-3.6-5.5 3.6z'],
    }

    function NavIcon({ name }) {
      const paths = NAV_ICONS[name]
      if (!paths) return null
      return h('svg', {
        width: 17, height: 17, viewBox: '0 0 20 20', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true,
        style: { display: 'block' },
      }, paths.map(d => h('path', { key: d, d })))
    }

    // ------------------------------------------------------------------ 左栏

    function Rail({ items, view, onView, onCreate, trashCount, onOpenTrash, onSettings }) {
      const navRow = (key, label, count, icon) => h('div', {
        key, className: 'sd-nav', 'data-on': view === key ? '1' : '0',
        role: 'button', tabIndex: 0,
        onClick: () => onView(key),
        onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') onView(key) },
      },
      icon ? h('i', null, h(NavIcon, { name: icon })) : null,
      h('b', null, label),
      count === null || count === undefined ? null : h('em', null, String(count)))

      const anchors = items.reduce((n, item) => n + ((item.anchors ?? []).length), 0)

      return h('div', { className: 'sd-rail' },
        h('div', { className: 'sd-brand' },
          h('span', { className: 'sd-blogo' }, h(DeskIcon, { size: 18 })),
          h('div', { className: 'sd-brandtext' },
            h('b', null, '声画工作台'),
            h('s', null, '发现 · 讲述 · 成片'))),

        h('div', { className: 'sd-group' }, '管理工作台'),
        navRow('home', '主页', null, 'home'),
        navRow('ideas', '选题池', null, 'idea'),
        navRow('anchors', '人物库', anchors, 'people'),
        navRow('assets', '素材库', null, 'audio'),

        h('div', { className: 'sd-group' }, '产出'),
        navRow('publish', '发布', null, 'send'),
        navRow('data', '数据', null, 'chart'),

        h('div', { className: 'sd-side-foot' },
          h('button', { className: 'sd-trash-link', type: 'button', onClick: onOpenTrash },
            '回收站',
            trashCount ? h('span', { className: 'sd-trash-count' }, String(trashCount)) : null),
          h('button', { className: 'sd-trash-link', type: 'button', onClick: onSettings }, '设置')))
    }

    // ------------------------------------------------------------------ 选题池

    // ------------------------------------------------------------------ 选题池（下拉找题 + 生成）

    const IDEA_REGIONS = {
      中国: ['先秦', '秦汉', '魏晋', '隋唐', '宋', '元', '明', '清', '近代'],
      日本: ['绳文·弥生', '古坟·飞鸟', '奈良·平安', '镰仓·室町', '战国·江户', '明治·昭和'],
      欧洲: ['古希腊', '古罗马', '中世纪', '文艺复兴', '大航海', '近代'],
      中东: ['古埃及', '两河', '波斯', '阿拉伯', '奥斯曼'],
      美洲: ['玛雅', '阿兹特克', '印加', '殖民期'],
      全球: ['古代', '中世纪', '近代', '现代'],
    }
    const IDEA_FIELDS = ['军事', '政治', '经济', '制度', '人物', '科技']
    const IDEA_HOOKS = ['反常', '因果', '数字', '消失', '对照', '逆袭']

    /** 选题池：选地域/时代/领域，让模型按范围补题；候选带出处才收。 */
    function IdeasView({ onUse }) {
      const [ideas, setIdeas] = useState(null)
      const [error, setError] = useState(null)
      const [notice, setNotice] = useState(null)
      const [busy, setBusy] = useState(false)
      const [region, setRegion] = useState('中国')
      const [era, setEra] = useState('')
      const [field, setField] = useState('')
      const [hook, setHook] = useState('')
      const [cands, setCands] = useState(null)
      const [quick, setQuick] = useState('')
      const [quickOpen, setQuickOpen] = useState(false)

      const load = useCallback(async () => {
        try {
          const out = await post('ideas', { op: 'list' })
          setIdeas(out.ideas ?? [])
          setError(null)
        } catch (err) {
          setIdeas([])
          setError(/接口不存在|404/.test(err.message)
            ? '选题池要重启 dsh-web 之后才启用：systemctl --user restart dsh-web.service'
            : err.message)
        }
      }, [])
      useEffect(() => { load() }, [load])

      const act = async (op, payload) => {
        setBusy(true)
        try {
          const out = await post('ideas', { op, ...payload })
          if (Array.isArray(out.ideas)) setIdeas(out.ideas)
          setError(null)
          return out
        } catch (err) {
          setError(err.message)
          return null
        } finally {
          setBusy(false)
        }
      }

      const eras = IDEA_REGIONS[region] ?? []
      const all = ideas ?? []
      const used = all.filter(row => row.status === 'used').length
      const pending = all.filter(row => row.status !== 'used').length

      const generate = async () => {
        if (busy) return
        setBusy(true)
        setCands(null)
        try {
          const out = await post('ideas', { op: 'generate', region, era, field, hook })
          setCands(out.candidates ?? [])
          setError(null)
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      }

      const take = async cand => {
        const out = await act('add', {
          title: cand.title, angle: cand.angle, source: cand.source,
          region, era, field, hook,
        })
        if (out) setNotice(`收进池子：${cand.title}`)
      }

      const quickAdd = async () => {
        const title = quick.trim()
        if (!title || busy) return
        const out = await act('add', { title, region, era, field, hook })
        if (out) { setQuick(''); setQuickOpen(false); setNotice('记下了') }
      }

      const chip = (list, value, onPick) => list.map(name => h('button', {
        key: name, className: 'sd-pick-chip', type: 'button',
        'data-on': value === name ? '1' : '0',
        onClick: () => onPick(value === name ? '' : name),
      }, name))

      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('div', { className: 'sd-head-row' },
            h('div', { className: 'sd-head-title' },
              h('h1', { className: 'sd-h1' }, '选题池'),
              h('div', { className: 'sd-sub' }, `${all.length} 条 · 待用 ${pending} · 已用 ${used}`)),
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button',
              onClick: () => setQuickOpen(v => !v),
            }, quickOpen ? '收起' : '＋ 记一条'))),

        h('div', { className: 'sd-body' },
          quickOpen ? h('div', { className: 'sd-quick' },
            h('input', {
              className: 'sd-input', autoFocus: true,
              placeholder: '想到什么就写一句，回车进池子',
              value: quick,
              onChange: event => setQuick(event.target.value),
              onKeyDown: event => { if (event.key === 'Enter') quickAdd() },
            }),
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button',
              disabled: busy || !quick.trim(), onClick: quickAdd,
            }, '加进池子')) : null,

          error ? h('div', { className: 'sd-error', style: { marginBottom: 10 } }, error) : null,
          notice ? h('div', { className: 'sd-sub', style: { marginBottom: 8 } }, notice) : null,

          h('div', { className: 'sd-find' },
            h('div', { className: 'sd-find-row' },
              h('span', { className: 'sd-find-lb' }, '地域'),
              h('select', {
                className: 'sd-select', value: region,
                onChange: event => { setRegion(event.target.value); setEra('') },
              }, Object.keys(IDEA_REGIONS).map(name => h('option', { key: name, value: name }, name))),
              h('span', { className: 'sd-find-lb' }, '时代'),
              h('select', {
                className: 'sd-select', value: era,
                onChange: event => setEra(event.target.value),
              },
              h('option', { value: '' }, '不限'),
              eras.map(name => h('option', { key: name, value: name }, name))),
              h('span', { className: 'sd-find-lb' }, '领域'),
              h('div', { className: 'sd-pick-chips' }, chip(IDEA_FIELDS, field, setField)),
              h('button', {
                className: 'sd-btn', 'data-kind': 'primary', type: 'button',
                style: { marginLeft: 'auto' },
                disabled: busy, onClick: generate,
              }, busy ? '生成中…' : '给我 5 个')),
            h('div', { className: 'sd-find-row', style: { marginTop: 10 } },
              h('span', { className: 'sd-find-lb' }, '钩子'),
              h('div', { className: 'sd-pick-chips' }, chip(IDEA_HOOKS, hook, setHook)),
              h('span', { className: 'sd-find-hint' }, '可不选，选了会让标题自带开头钩子'))),

          cands && cands.length
            ? [
              h('div', { className: 'sd-sec-title', key: 't' }, '推荐 · 已避开池子里已有的题'),
              h('div', { className: 'sd-cands', key: 'c' },
                cands.map((cand, index) => h('div', { className: 'sd-cand', key: `${cand.title}-${index}` },
                  h('b', null, cand.title),
                  cand.angle ? h('s', null, cand.angle) : null,
                  h('div', { className: 'sd-cand-row' },
                    region ? h('span', { className: 'sd-tag' }, region) : null,
                    era ? h('span', { className: 'sd-tag' }, era) : null,
                    field ? h('span', { className: 'sd-tag' }, field) : null,
                    hook ? h('span', { className: 'sd-tag' }, hook) : null,
                    cand.source
                      ? h('span', { className: 'sd-tag', 'data-src': '1' }, cand.source)
                      : h('span', { className: 'sd-tag', 'data-warn': '1' }, '无出处'),
                    h('button', {
                      className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
                      style: { marginLeft: 'auto', height: 24, padding: '0 9px' },
                      disabled: busy, onClick: () => take(cand),
                    }, '收进池子'),
                    h('button', {
                      className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
                      style: { height: 24, padding: '0 9px' },
                      onClick: () => onUse(cand.title),
                    }, '直接开工'))))),
            ]
            : null,

          h('div', { className: 'sd-sec-title' }, `池子里 · ${all.length} 条`),
          all.length
            ? h('div', { className: 'sd-idea-grid' },
              all.map(row => h('div', { className: 'sd-icard', key: row.id, 'data-used': row.status === 'used' ? '1' : '0' },
                h('b', null, row.title),
                row.angle ? h('s', null, row.angle) : null,
                h('div', { className: 'sd-cand-row' },
                  row.region ? h('span', { className: 'sd-tag' }, row.region) : null,
                  row.era ? h('span', { className: 'sd-tag' }, row.era) : null,
                  row.field ? h('span', { className: 'sd-tag' }, row.field) : null,
                  row.hook ? h('span', { className: 'sd-tag' }, row.hook) : null,
                  row.source ? h('span', { className: 'sd-tag', 'data-src': '1' }, row.source) : null),
                h('div', { className: 'sd-icard-ops' },
                  row.status !== 'used'
                    ? h('button', {
                      className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
                      style: { height: 24, padding: '0 9px' },
                      onClick: () => onUse(row.title),
                    }, '用它开项目')
                    : null,
                  h('button', {
                    className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
                    style: { height: 24, padding: '0 9px' },
                    disabled: busy,
                    onClick: () => act('update', { id: row.id, patch: { status: row.status === 'used' ? 'new' : 'used' } }),
                  }, row.status === 'used' ? '放回待用' : '标为已用'),
                  h('button', {
                    className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
                    style: { height: 24, padding: '0 9px' },
                    disabled: busy, onClick: () => act('remove', { id: row.id }),
                  }, '删')))))
            : h('div', { className: 'sd-empty' }, '池子是空的。上面选个范围，让模型出几条；或者点「＋ 记一条」自己写。'))
      )
    }

    function ProjectCard({ item, onOpen }) {
      // 用第一张分镜图做封面：成片封面自带标题大字，压到卡片上会和卡片标题打架
      const cover = item.counts.imaged ? 'images/s001.png' : (item.cover?.path ?? '')
      const done = Boolean(item.render)
      const pct = done
        ? 100
        : item.counts.segments
          ? Math.round(((item.counts.voiced + item.counts.imaged) / (item.counts.segments * 2)) * 100)
          : 0
      const tag = item.task?.running ? '进行中' : done ? '已成片' : item.counts.segments ? item.stageLabel : '草稿'
      const note = item.task?.running
        ? (item.task.message || '处理中…')
        : done
          ? `成片 ${formatSecs(item.render.secs || item.totalSecs || 0)}`
          : item.counts.segments
            ? `${item.counts.imaged}/${item.counts.segments} 张图`
            : '还没写稿'
      return h('button', { className: 'sd-pcard', type: 'button', onClick: () => onOpen(item.id) },
        h('span', { className: 'sd-ph' },
          cover ? h('img', { src: mediaUrl(item.id, cover, item.counts.imaged || 1), alt: '', loading: 'lazy' }) : null,
          h('span', { className: 'sd-tag', 'data-k': item.task?.running ? 'run' : done ? 'done' : '' }, tag),
          h('span', { className: 'sd-pt' },
            h('b', null, item.title || '未命名'),
            h('s', null, item.counts.segments ? `${item.counts.segments} 段 · ${formatSecs(item.totalSecs || 0)}` : '草稿'),
            h('span', { className: 'sd-bar' }, h('i', { style: { width: `${pct}%` } })))),
        h('span', { className: 'sd-pn' }, note))
    }

    function HomeView({ items, onOpen, onCreate }) {
      const done = items.filter(item => item.render).length
      const secs = items.reduce((n, item) => n + (item.totalSecs || 0), 0)
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('div', { className: 'sd-head-row' },
            h('div', { className: 'sd-head-title' },
              h('h1', { className: 'sd-h1' }, '我的项目'),
              h('div', { className: 'sd-sub' },
                `${items.length} 个项目 · ${done} 条已成片 · 总旁白 ${formatSecs(secs)}`)),
            h('button', { className: 'sd-btn', 'data-kind': 'primary', type: 'button', onClick: onCreate }, '新建项目'))),
        h('div', { className: 'sd-body' },
          items.length
            ? h('div', { className: 'sd-wall' }, items.map(item => h(ProjectCard, { key: item.id, item, onOpen })))
            : h('div', { className: 'sd-empty' },
              h('div', null, '还没有项目。'),
              h('div', null, '给它一个主题（比如「九子夺嫡」「安史之乱怎么爆的」），剩下的它自己往下做。'))))
    }

    // ------------------------------------------------------------------ 全局页（人物 / 素材 / 发布 / 数据）

    /** 人物库：跨项目聚合定稿锚点。锚点本身属于项目，点一个回到那个项目去改。 */
    function AnchorLibrary({ items, onOpen }) {
      const rows = []
      for (const item of items) {
        for (const row of (item.anchors ?? [])) rows.push({ ...row, itemId: item.id, itemTitle: item.title })
      }
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('h1', { className: 'sd-h1' }, '人物库'),
          h('div', { className: 'sd-sub' },
            rows.length
              ? `${items.length} 个项目共 ${rows.length} 条锚点 · 点一个回到它所在的项目去改`
              : '还没有人物锚点')),
        h('div', { className: 'sd-body' },
          rows.length
            ? h('div', { className: 'sd-facegrid' }, rows.map(row => {
              // 锚点的图在候选列表里，定稿的优先；没有候选就是还没画过
              const pic = row.approved || (row.candidates ?? []).slice(-1)[0] || ''
              return h('button', {
                key: `${row.itemId}-${row.id ?? row.name}`,
                className: 'sd-facecard', type: 'button',
                title: row.desc || '',
                onClick: () => onOpen(row.itemId),
              },
              h('span', { className: 'sd-faceimg' },
                pic
                  ? h('img', { src: mediaUrl(row.itemId, pic), alt: '', loading: 'lazy' })
                  : h(DeskIcon, { size: 18 })),
              h('b', null, row.name || '未命名'),
              h('s', null, row.itemTitle || ''),
              h('em', null, row.approved ? '已定稿' : pic ? '待确认' : '未画'))
            }))
            : h('div', { className: 'sd-empty' },
              h('div', null, '还没有人物锚点。'),
              h('div', null, '进任意项目 → 参考图，抽一次人物和场景，定稿之后这里就会汇总。'))))
    }

    /** 素材库：还没接后端，说明清楚要做什么，别放个白页。 */
    function AssetLibrary() {
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('h1', { className: 'sd-h1' }, '素材库'),
          h('div', { className: 'sd-sub' }, 'BGM · 音效 · 片头模板')),
        h('div', { className: 'sd-body' },
          h('div', { className: 'sd-empty' },
            h('div', null, '这一页还没接。'),
            h('div', null, '要放的是：按情绪分类的 BGM、转场音效、片头模板。合成时直接挑，BGM 自动压在旁白底下。'),
            h('div', { className: 'sd-hint', style: { marginTop: 14 } },
              '现在成片只有旁白，没有背景音。接口做好之后素材从这里进，不用每次翻目录。'))))
    }

    /** 发布：把所有已成片的项目列出来，点进去到那一条的发布页。 */
    function PublishOverview({ items, onOpen }) {
      const ready = items.filter(item => item.render)
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('h1', { className: 'sd-h1' }, '发布'),
          h('div', { className: 'sd-sub' },
            ready.length ? `${ready.length} 条已成片，可以生成发布包` : '还没有成片')),
        h('div', { className: 'sd-body' },
          ready.length
            ? h('div', { className: 'sd-rows' }, ready.map(item => h('div', { className: 'sd-rowitem', key: item.id },
              h('span', { className: 'sd-rowitem-t' }, item.title || '未命名'),
              h('span', { className: 'sd-rowitem-m' }, `${item.counts.segments} 段 · ${formatSecs(item.render.secs || item.totalSecs || 0)}`),
              h('span', { className: 'sd-rowitem-m' }, item.cover?.path ? '有封面' : '无封面'),
              h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', onClick: () => onOpen(item.id) }, '去发布'))))
            : h('div', { className: 'sd-empty' },
              h('div', null, '还没有成片。'),
              h('div', null, '先去项目里合成一条，这里才会出现可发布的东西。'))))
    }

    /** 数据：本地账本。播放量还没有回流通道，这里只算它真能算的。 */
    function DataOverview({ items, onOpen }) {
      const segs = items.reduce((n, item) => n + (item.counts.segments || 0), 0)
      const secs = items.reduce((n, item) => n + (item.totalSecs || 0), 0)
      const done = items.filter(item => item.render).length
      const imaged = items.reduce((n, item) => n + (item.counts.imaged || 0), 0)
      const voiced = items.reduce((n, item) => n + (item.counts.voiced || 0), 0)
      const people = items.reduce((n, item) => n + ((item.anchors ?? []).length), 0)
      const cards = [
        ['项目', String(items.length)],
        ['已成片', String(done)],
        ['旁白总长', formatSecs(secs)],
        ['段落', String(segs)],
        ['已配音', `${voiced}/${segs}`],
        ['已出图', `${imaged}/${segs}`],
        ['人物锚点', String(people)],
        ['出图成本', '¥0.00'],
      ]
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('h1', { className: 'sd-h1' }, '数据'),
          h('div', { className: 'sd-sub' }, '本地账本 · 播放数据还没有回流通道，这一页只算工作台自己的账')),
        h('div', { className: 'sd-body' },
          h('div', { className: 'sd-statgrid' }, cards.map(([label, value]) => h('div', { className: 'sd-stat', key: label },
            h('b', null, label), h('s', null, value)))),
          h('div', { className: 'sd-rows' }, items.map(item => h('div', { className: 'sd-rowitem', key: item.id },
            h('span', { className: 'sd-rowitem-t' }, item.title || '未命名'),
            h('span', { className: 'sd-rowitem-m' }, `${item.counts.segments} 段`),
            h('span', { className: 'sd-rowitem-m' }, formatSecs(item.totalSecs || 0)),
            h('span', { className: 'sd-rowitem-m' }, `配音 ${item.counts.voiced}/${item.counts.segments}`),
            h('span', { className: 'sd-rowitem-m' }, item.render ? '已成片' : item.stageLabel),
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', onClick: () => onOpen(item.id) }, '打开'))))))
    }

    function EmptyState({ onCreate, model }) {
      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('div', { className: 'sd-head-row' },
            h('div', { className: 'sd-head-title' },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 9 } },
                h(DeskIcon, { size: 24 }),
                h('h1', { className: 'sd-h1' }, '声画工作台')),
              h('div', { className: 'sd-sub' }, '一个主题或一本书 → 稿子 → 旁白 → 分镜图 → 竖屏成片')),
            h('button', { className: 'sd-btn', 'data-kind': 'primary', onClick: onCreate }, '新建项目'))),
        h('div', { className: 'sd-body' },
          h('div', { className: 'sd-empty' },
            h('div', null, '还没有项目。'),
            h('div', null, '给它一个主题（比如「九子夺嫡」「安史之乱怎么爆的」「一场暴雨是怎么形成的」），或者贴一段原文，剩下的它自己往下做。'),
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

    /** 下载用的文件名：用项目标题，去掉文件系统不认的字符，留个兜底名。 */
    function downloadName(item, suffix = '') {
      const raw = String(item?.title ?? '').trim()
      // / \ : * ? " < > | 在 Windows/macOS/Linux 上至少有一个不认，统一换掉
      const clean = raw.replace(/[\\/:*?"<>|\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
      return `${clean || '成片'}${suffix}`
    }

    /** 并行档位：1、2、4、8，以及不超过本机核数上限的值。 */
    function workerOptions(data) {
      const cores = Number(data?.cpuCores) || 8
      const all = [1, 2, 4, 8, 16]
      return all.filter(n => n <= Math.max(2, cores))
    }

    /** 按当前画面比例给一组常用出图尺寸。 */
    function resolutionPresets(settings) {
      const portrait = Number(settings.imageHeight) >= Number(settings.imageWidth)
      // 服务端会把长边 clamp 到 2048：预设不能超，否则保存后被夹住、下拉也选不回来
      return portrait
        ? [
          { w: 720, h: 1280, note: '快' },
          { w: 1024, h: 1792, note: '标准' },
          { w: 1080, h: 1920, note: '高清' },
          { w: 1152, h: 2048, note: '最高' },
        ]
        : [
          { w: 1280, h: 720, note: '快' },
          { w: 1792, h: 1024, note: '标准' },
          { w: 1920, h: 1080, note: '高清' },
          { w: 2048, h: 1152, note: '最高' },
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
      const [stopping, setStopping] = useState(false)
      const [picked, setPicked] = useState(null)
      // 换项目时回到自动落页
      useEffect(() => { setPicked(null) }, [item.id])

      // 稿件生成完就带用户去看稿子，不用自己再点一下阶段
      const wasRunning = useRef(false)
      useEffect(() => {
        const running = Boolean(item.task?.running)
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
      const pages = { item, data, busy, notice, onAction, onReload, onSettings, onGoTab: setPicked }

      // 阶段轨道：圆点表示完成/当前，下面那行小字只写这一阶段真实的产物
      const stageNodes = []
      TAB_KEYS.forEach((key, index) => {
        const stage = data.stages.find(row => row.id === key)
        const done = tabDone(item, key)
        const on = active === key
        stageNodes.push(h('button', {
          key, type: 'button', className: 'sd-stage-i',
          'data-on': on ? '1' : '0', 'data-done': done ? '1' : '0',
          onClick: () => setPicked(key),
        },
          h('span', { className: 'sd-stage-dot' }, done ? '✓' : on ? '●' : ''),
          h('span', { className: 'sd-stage-x' },
            h('b', null, stage?.label ?? key),
            h('s', null, stageHint(item, key)))))
        if (index < TAB_KEYS.length - 1) {
          stageNodes.push(h('span', { key: `${key}-l`, className: 'sd-stage-l' }))
        }
      })

      return h('div', { className: 'sd-pane' },
        h('div', { className: 'sd-head' },
          h('div', { className: 'sd-head-row' },
            h('div', { className: 'sd-head-title' },
              h('h1', { className: 'sd-h1' }, item.title || '未命名'),
              h('div', { className: 'sd-sub' },
                item.angle || `主题：${item.topic}`,
                item.counts.segments ? ` · ${item.counts.segments} 段 · 约 ${formatSecs(item.totalSecs || 0)}` : '')),
            // 发布是独立入口，不进六阶段派生；没成片时置灰
            h('button', {
              className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
              disabled: !item.render,
              'data-on': active === 'publish' ? '1' : '0',
              title: item.render ? '生成发布包' : '先合成成片',
              onClick: () => setPicked('publish'),
            }, '发布'),
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', onClick: onSettings, title: '设置' }, h(GearIcon))),

          h('div', { className: 'sd-stage' }, stageNodes),

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
                  : active === 'publish' ? h(PublishPage, pages)
                    : h(RenderPage, pages)),

        // 任务条固定在底部：切阶段、滚页面都不丢进度
        task && (task.running || task.error)
          ? h('div', { className: 'sd-job', 'data-kind': task.error ? 'error' : 'idle' },
            h('span', { className: 'sd-job-t' }, task.message || '处理中…'),
            task.total > 1 ? h('span', { className: 'sd-job-bar' }, h('i', { style: { width: `${pct}%` } })) : null,
            task.total > 1 ? h('span', { className: 'sd-job-m' }, `${task.done}/${task.total}`) : null,
            // 慢模型写稿可能好几分钟，让用户看见它还在动
            task.running && task.startedAt ? h('span', { className: 'sd-job-m' }, elapsedLabel(task.startedAt)) : null,
            task.error ? h('span', { className: 'sd-job-m', style: { color: 'var(--dsw-alias-state-error-primary)' } }, task.error) : null,
            task.running
              ? h('button', {
                className: 'sd-stop', type: 'button',
                disabled: stopping,
                onClick: async () => {
                  setStopping(true)
                  try {
                    await post('cancel', { id: item.id })
                  } catch {
                    // 已经结束了也无所谓
                  } finally {
                    setTimeout(() => setStopping(false), 1500)
                  }
                },
              }, stopping ? '正在停止…' : '停止')
              : null)
          : null)
    }

    /** 轨道节点下面那行小字：只写这一阶段真实的产物量，不写文案。 */
    function stageHint(item, key) {
      const n = item.counts.segments
      if (key === 'idea') return item.topic ? String(item.topic).slice(0, 9) : '未定'
      if (key === 'scripted') return n ? `${n} 段 · ${formatSecs(item.totalSecs || 0)}` : '待写稿'
      if (key === 'anchors') return item.anchors?.length ? `${item.anchors.length} 条` : '未抽'
      if (key === 'voiced') return n ? `${item.counts.voiced}/${n}` : '—'
      if (key === 'imaged') return n ? `${item.counts.imaged}/${n}` : '—'
      return item.render ? formatSecs(item.render.secs || 0) : '待合成'
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

    // ------------------------------------------------------------------ 自绘下拉

    /**
     * 原生 <select> 的弹层由浏览器自己画：深色主题下常常是浅色底，option/optgroup 只认一部分样式，
     * 分组标题（模型提供商）会亮得刺眼，各平台还不一致。这里自绘一个：弹层用面板自己的底色，
     * 分组标题压成三级文字色，键盘上下、回车、Esc 都能走。
     * rows = [{ kind: 'group', key, label } | { kind: 'option', value, label }]，由上层拼好。
     */
    function DropSelect({ value, rows, label, onChange, disabled }) {
      const [open, setOpen] = useState(false)
      const [active, setActive] = useState(-1)
      const [rect, setRect] = useState(null)
      const triggerRef = useRef(null)
      const menuRef = useRef(null)

      const selectable = useMemo(() => rows.filter(row => row.kind === 'option'), [rows])
      const current = selectable.find(row => row.value === value)
      const currentLabel = current ? current.label : (value ? String(value).split('|').pop() : '未选择')

      const close = useCallback(() => { setOpen(false) }, [])

      const openMenu = useCallback(() => {
        const node = triggerRef.current
        if (!node) return
        const box = node.getBoundingClientRect()
        const below = window.innerHeight - box.bottom - 12
        const above = box.top - 12
        // 下面塞不下就翻到上面；都以 320 封顶
        const flip = below < 180 && above > below
        const limit = Math.min(320, Math.max(140, flip ? above : below))
        setRect({
          left: Math.round(box.left),
          width: Math.round(Math.max(box.width, 240)),
          top: flip ? Math.round(box.top - limit - 4) : Math.round(box.bottom + 4),
          maxHeight: Math.round(limit),
        })
        const start = Math.max(0, selectable.indexOf(selectable.find(row => row.value === value) ?? selectable[0] ?? { value: null }))
        setActive(selectable.length ? start : -1)
        setOpen(true)
      }, [selectable, value])

      const commit = useCallback(row => {
        setOpen(false)
        triggerRef.current?.focus()
        if (row && row.value !== value) onChange(row.value)
      }, [onChange, value])

      useEffect(() => {
        if (!open) return undefined
        const onDown = event => {
          if (menuRef.current?.contains(event.target)) return
          if (triggerRef.current?.contains(event.target)) return
          close()
        }
        const onScroll = event => {
          if (menuRef.current?.contains(event.target)) return
          close()
        }
        const onResize = () => close()
        document.addEventListener('mousedown', onDown, true)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onResize)
        return () => {
          document.removeEventListener('mousedown', onDown, true)
          window.removeEventListener('scroll', onScroll, true)
          window.removeEventListener('resize', onResize)
        }
      }, [open, close])

      useEffect(() => {
        if (!open) return
        menuRef.current?.querySelector('[data-active="1"]')?.scrollIntoView({ block: 'center' })
      }, [open, active])

      const onKeyDown = event => {
        if (!open) {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu()
          }
          return
        }
        if (event.key === 'Escape') { event.preventDefault(); close(); return }
        if (event.key === 'Tab') { close(); return }
        if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => Math.min(selectable.length - 1, i + 1)); return }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(0, i - 1)); return }
        if (event.key === 'Home') { event.preventDefault(); setActive(0); return }
        if (event.key === 'End') { event.preventDefault(); setActive(selectable.length - 1); return }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          commit(selectable[active])
        }
      }

      const menu = open && rect
        ? h('div', {
          ref: menuRef, className: 'sd-picker-menu', role: 'listbox', 'aria-label': label,
          style: { left: rect.left, top: rect.top, width: rect.width, maxHeight: rect.maxHeight },
        }, rows.map(row => {
          if (row.kind === 'group') {
            return h('div', { key: `g:${row.key}`, className: 'sd-picker-group', role: 'presentation' }, row.label)
          }
          return h('div', {
            key: `o:${row.value}`, className: 'sd-picker-opt', role: 'option',
            'aria-selected': row.value === value ? 'true' : 'false',
            'data-selected': row.value === value ? '1' : undefined,
            'data-active': selectable[active] === row ? '1' : undefined,
            onMouseDown: event => event.preventDefault(),
            onMouseEnter: () => setActive(selectable.indexOf(row)),
            onClick: () => commit(row),
          },
            h('span', { className: 'sd-picker-check', 'aria-hidden': 'true' }, row.value === value ? '✓' : ''),
            h('span', { className: 'sd-picker-opt-label' }, row.label))
        }))
        : null

      return h('div', { className: 'sd-picker' },
        h('button', {
          type: 'button', ref: triggerRef, className: 'sd-select sd-picker-trigger',
          'aria-haspopup': 'listbox', 'aria-expanded': open ? 'true' : 'false', 'aria-label': label,
          disabled, onClick: () => (open ? close() : openMenu()), onKeyDown,
        },
          h('span', { className: 'sd-picker-label' }, currentLabel),
          h('span', { className: 'sd-picker-caret', 'aria-hidden': 'true' }, '▾')),
        menu)
    }

    // ------------------------------------------------------------------ ① 选题

    function IdeaPage({ item, data, busy, onAction, onReload }) {
      // 这个组件的父级是 Project，拿不到它的局部变量，设置要自己算一份
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const segSeconds = Math.max(12, Math.min(90, Number(settings.segmentSeconds) || 40))
      const [topic, setTopic] = useState(item.topic ?? '')
      const [minutes, setMinutes] = useState(item.targetMinutes ?? 5)
      const [raw, setRaw] = useState(item.rawText ?? '')
      const [refs, setRefs] = useState(() => (item.references ?? []).map(row => row.url).join('\n'))
      const [modelKey, setModelKey] = useState(item.model ? `${item.model.provider}|${item.model.model}` : '')
      const [saving, setSaving] = useState(false)
      const [error, setError] = useState(null)
      // 原始材料可能有 20 万字，不进 /state：打开页面时单独拉；没拉到之前不能拿空串去覆盖服务端
      const [rawLoaded, setRawLoaded] = useState(false)
      // 原始材料拉取失败时给个提示：本次保存不带 rawText，不会拿空串冲掉服务端材料
      const [rawLoadError, setRawLoadError] = useState(null)
      const [rawBase, setRawBase] = useState('')
      const savePromiseRef = useRef(null)
      const running = Boolean(item.task?.running)

      // 服务端每次轮询都返回新数组/新对象：依赖它们的身份会把用户正在输入的内容重置回旧值，改成稳定字符串
      const serverRefsKey = (item.references ?? []).map(row => row.url).join('\n')
      const serverModelKey = item.model ? `${item.model.provider}|${item.model.model}` : ''

      useEffect(() => { setTopic(item.topic ?? '') }, [item.topic])
      useEffect(() => { setMinutes(item.targetMinutes ?? 5) }, [item.targetMinutes])
      useEffect(() => { setRefs(serverRefsKey) }, [serverRefsKey])
      useEffect(() => { setModelKey(serverModelKey) }, [serverModelKey])

      // 原始材料不在 /state 里（材料可能有 20 万字），按项目单独拉一次
      useEffect(() => {
        let alive = true
        setRawLoadError(null)
        post('item-raw', { id: item.id })
          .then(body => {
            if (!alive) return
            setRaw(body?.rawText ?? '')
            setRawBase(body?.rawText ?? '')
            setRawLoaded(true)
            setRawLoadError(null)
          })
          .catch(() => {
            // 拉不到就保持未加载：保存时不提交 rawText，免得用空串把服务端材料冲掉
            if (!alive) return
            setRawLoadError('原始材料加载失败，本次保存不会改动服务端已存材料；刷新页面重试')
          })
        return () => { alive = false }
      }, [item.id])

      // 模型列表：第一项跟随默认，其余按提供商分组；分组标题只是标题，选不中
      const modelRows = useMemo(() => {
        const rows = [{ kind: 'option', value: '', label: '跟随 DSH 当前默认模型' }]
        for (const provider of data.engines ?? []) {
          const models = provider.models ?? []
          if (!models.length) continue
          rows.push({ kind: 'group', key: provider.provider, label: provider.name || provider.provider })
          for (const row of models) rows.push({ kind: 'option', value: `${provider.provider}|${row.id}`, label: row.name })
        }
        return rows
      }, [data.engines])

      const parseRefs = () => [...new Set(
        String(refs).split(/\n+/).map(line => line.trim()).filter(line => /^https?:\/\//i.test(line)),
      )].slice(0, 12)

      const saveInfo = async () => {
        // 同一时刻只留一个保存请求：输入框失焦和点「生成稿件」会连着触发，后者等前者回来再按最新输入存一次
        if (savePromiseRef.current) {
          try {
            await savePromiseRef.current
          } catch {
            // 上一次失败也继续按最新输入重试
          }
          if (savePromiseRef.current) return false
        }
        const run = (async () => {
          setSaving(true)
          setError(null)
          try {
            const [provider, model] = modelKey ? modelKey.split('|') : [null, null]
            const urls = parseRefs()
            // 链接没变就沿用它抓到的标题，别每次保存都重新抓
            const references = urls.map(url => {
              const known = (item.references ?? []).find(row => row.url === url)
              return known ?? { url, title: '', desc: '', error: null }
            })
            const payload = {
              id: item.id,
              topic,
              targetMinutes: Number(minutes) || 5,
              references,
              model: provider && model ? { provider, model } : null,
            }
            // 没拉到原始材料时不要带 rawText：空串会把服务端的长材料冲掉
            if (rawLoaded) payload.rawText = raw
            await post('item-info', payload)
            // 新链接抓一次标题；抓不到也要把 error 落下来，否则每次保存都会重抓失败链接
            const fresh = references.filter(row => !row.title && !row.error)
            for (const row of fresh) {
              try {
                const info = await post('reference-inspect', { url: row.url })
                row.title = info?.title || ''
                row.desc = info?.desc || ''
                row.error = info?.error || null
              } catch (err) {
                row.error = err.message || '抓取失败'
              }
            }
            if (fresh.length) await post('item-info', { id: item.id, references })
            setRawBase(raw)
            await onReload()
            return true
          } catch (err) {
            setError(err.message)
            return false
          } finally {
            setSaving(false)
          }
        })()
        savePromiseRef.current = run
        try {
          return await run
        } finally {
          savePromiseRef.current = null
        }
      }

      const dirty = topic !== (item.topic ?? '')
        || Number(minutes) !== (item.targetMinutes ?? 5)
        || (rawLoaded && raw !== rawBase) // 材料没拉到时不计入，免得把空串当成改动
        || refs !== serverRefsKey
        || modelKey !== serverModelKey

      // 离开输入框就自动保存：切页/切项目时不会把这一页的改动静默丢掉
      const autoSave = () => { if (dirty && !running) saveInfo() }
      const done = tabDone(item, 'idea')
      const refRows = item.references ?? []

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '这一期讲什么'),
          h('div', { className: 'sd-field' },
            h('label', null, '主题 / 书名'),
            h('input', {
              className: 'sd-input', value: topic,
              placeholder: '例：九子夺嫡 / 安史之乱 / 一场暴雨是怎么形成的',
              onChange: event => setTopic(event.target.value),
              onBlur: autoSave,
            })),
          h('div', { className: 'sd-row', style: { gap: 12 } },
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '目标时长（分钟）'),
              h('input', {
                className: 'sd-input', type: 'number', min: 1, max: 30, value: minutes,
                onChange: event => setMinutes(event.target.value),
                onBlur: autoSave,
              })),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '写稿用哪个模型'),
              h(DropSelect, {
                value: modelKey, rows: modelRows, label: '写稿用哪个模型',
                onChange: async value => {
                  setModelKey(value)
                  const [provider, model] = value ? value.split('|') : [null, null]
                  setError(null)
                  try {
                    // 只提交 model 一个字段：item-info 是增量更新，不会碰主题/材料等其他字段
                    await post('item-info', { id: item.id, model: provider && model ? { provider, model } : null })
                    await onReload()
                  } catch (err) {
                    setError(err.message)
                  }
                },
              })),
            h('div', { className: 'sd-field', style: { flex: '0 0 118px' } },
              h('label', null, '稿子口吻'),
              // 口吻是按项目存的设置，改完立刻生效于下一次写稿；老项目没存过就落回说书人
              h('select', {
                className: 'sd-select', value: settings.tone ?? 'storyteller',
                onChange: async event => {
                  try {
                    await post('item-settings', { id: item.id, settings: { tone: event.target.value } })
                    await onReload()
                  } catch (err) {
                    setError(err.message)
                  }
                },
              }, (data.tones ?? [{ id: 'storyteller', label: '说书人' }]).map(row =>
                h('option', { key: row.id, value: row.id }, row.label)))),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '每一段多长（秒）'),
              h('input', {
                key: `idea-seg-${item.id}-${segSeconds}`,
                className: 'sd-input', type: 'number', min: 12, max: 90,
                defaultValue: segSeconds,
                onBlur: async event => {
                  const value = Math.max(12, Math.min(90, Number(event.target.value) || 40))
                  if (value === segSeconds) return
                  try {
                    await post('item-settings', { id: item.id, settings: { segmentSeconds: value } })
                    await onReload()
                  } catch (err) {
                    setError('保存设置失败：' + err.message)
                  }
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
              onBlur: autoSave,
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
              onBlur: autoSave,
            }),
            rawLoadError
              ? h('div', { className: 'sd-hint', style: { paddingTop: 5, color: 'var(--dsw-alias-state-warn-primary)' } }, rawLoadError)
              : null),

          error ? h('div', { className: 'sd-hint', style: { marginTop: 8, color: 'var(--dsw-alias-state-error-primary)' } }, error.startsWith('保存') ? error : '保存失败：' + error) : null,

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
                // 保存失败就别往下跑，否则会拿服务端的旧材料写稿
                if (dirty && !(await saveInfo())) return
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
              ' · 完成后自动切到「稿子」确认稿件'))
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

    // ------------------------------------------------------------------ ② 稿子

    function ScriptPage({ item, data, busy, onAction, onReload }) {
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const words = item.segments.reduce((sum, row) => sum + String(row.text ?? '').length, 0)
      const estimate = Math.round(words / 4.2)

      if (!item.counts.segments) {
        return h(NeedPrev, {
          text: '还没有稿子。先去「① 选题」定主题并写稿。',
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

        // 不传 onZoom：稿子页不渲染图，点开放大没有对象
        item.segments.map(seg => h(SegmentCard, {
          key: seg.id, item, seg, mode: 'script', disabled: busy, onAction, onReload,
        })),
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

      const patch = async next => {
        setError(null)
        try {
          await post('item-settings', { id: item.id, settings: next })
          await onReload()
        } catch (err) {
          setError(err.message)
        }
      }

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
      const [error, setError] = useState(null)
      const task = item.task
      const drawing = task?.running && task.kind === 'anchor'
      const approvedCount = anchors.filter(row => row.approved).length

      const call = async (path, payload, id) => {
        setBusyId(id ?? 'extract')
        setError(null)
        try {
          await post(path, payload)
          await onReload()
        } catch (err) {
          setError(err.message)
        } finally {
          setBusyId(null)
        }
      }

      return h(React.Fragment, null,
        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '人物与场景参考'),
          h('div', { className: 'sd-hint' },
            `关键形象先定一张标准像，之后每段分镜都会照着它画${item.counts.segments ? '' : '。建议先在「② 稿子」确认稿件，再来抽角色'}。`),
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
          error ? h('div', { className: 'sd-hint', style: { marginTop: 8, color: 'var(--dsw-alias-state-error-primary)' } }, '操作失败：' + error) : null,

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
      const candidates = row.candidates ?? []
      const [picked, setPicked] = useState(row.approved || candidates.slice(-1)[0] || null)
      const pending = busyId === row.id

      // 候选数组每轮轮询都是新身份：用字符串键，只在内容真变时才重置选择
      const candidatesKey = candidates.join('|')

      useEffect(() => { setDesc(row.desc) }, [row.desc])
      useEffect(() => {
        setPicked(row.approved || candidates.slice(-1)[0] || null)
      }, [row.approved, candidatesKey])

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
      const presetKey = resolutionKey(settings)
      const [viewed, setViewed] = useState(null)
      const [error, setError] = useState(null)
      const task = item.task
      const drawing = task?.running && task.kind === 'style-samples'
      const missing = item.counts.segments - item.counts.imaged

      if (!item.counts.segments) {
        return h(NeedPrev, { text: '还没有稿子，先写稿再来出图。', label: '去写稿', onGo: () => goTab('scripted') })
      }

      const patch = async next => {
        setError(null)
        try {
          await post('item-settings', { id: item.id, settings: next })
          await onReload()
        } catch (err) {
          setError('保存设置失败：' + err.message)
        }
      }

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
                value: presetKey,
                onChange: event => {
                  const [w, hh] = event.target.value.split('x').map(Number)
                  if (!w || !hh) return
                  patch({ imageWidth: w, imageHeight: hh })
                },
              },
                resolutionPresets(settings).map(row => h('option', {
                  key: `${row.w}x${row.h}`, value: `${row.w}x${row.h}`,
                }, `${row.w}×${row.h}${row.note ? `（${row.note}）` : ''}`)),
                // 当前尺寸不命中预设时给一条对应项，否则下拉是空白
                presetKey ? null : h('option', { key: 'custom', value: '' }, `自定义 ${settings.imageWidth}×${settings.imageHeight}`),
                h('option', { key: 'custom-hint', value: 'custom', disabled: true }, '—— 自定义 ——'))),
            h('div', { className: 'sd-field', style: { flex: 1 } },
              h('label', null, '宽 × 高'),
              h('div', { className: 'sd-row', style: { gap: 6 } },
                h('input', {
                  key: `iw-${item.id}-${settings.imageWidth}`,
                  className: 'sd-input', type: 'number', min: 256, max: 2048, step: 8,
                  defaultValue: settings.imageWidth,
                  onBlur: async event => {
                    const w = Math.max(256, Math.min(2048, Number(event.target.value) || 1024))
                    if (w === settings.imageWidth) return
                    setError(null)
                    try {
                      await post('item-settings', { id: item.id, settings: { imageWidth: w } })
                      await onReload()
                    } catch (err) {
                      setError('保存设置失败：' + err.message)
                    }
                  },
                }),
                h('span', { className: 'sd-hint', style: { alignSelf: 'center' } }, '×'),
                h('input', {
                  key: `ih-${item.id}-${settings.imageHeight}`,
                  className: 'sd-input', type: 'number', min: 256, max: 2048, step: 8,
                  defaultValue: settings.imageHeight,
                  onBlur: async event => {
                    const hh = Math.max(256, Math.min(2048, Number(event.target.value) || 1792))
                    if (hh === settings.imageHeight) return
                    setError(null)
                    try {
                      await post('item-settings', { id: item.id, settings: { imageHeight: hh } })
                      await onReload()
                    } catch (err) {
                      setError('保存设置失败：' + err.message)
                    }
                  },
                }))),
            h('div', { style: { flex: 2, paddingBottom: 6 } },
              h('div', { className: 'sd-hint' },
                `改分辨率只影响之后出的图，已出的 ${item.counts.imaged} 张不会自动重画。`))),
          error ? h('div', { className: 'sd-hint', style: { marginTop: 8, color: 'var(--dsw-alias-state-error-primary)' } }, error) : null,

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
      const [coverRefValue, setCoverRef] = useState(null)
      const [coverTitle, setCoverTitle] = useState(item.title ?? '')
      const [makingCover, setMakingCover] = useState(false)
      const [coverError, setCoverError] = useState(null)
      const [settingsError, setSettingsError] = useState(null)
      // 没手动选过（或选回默认项的空串）就用默认：优先定稿参考图，其次第一张分镜图
      const coverRef = obj => coverRefValue || (obj.anchors?.length
        ? `anchor:${(obj.anchors.find(a => a.approved) ?? obj.anchors[0]).id}`
        : (obj.segments.find(seg => seg.imagePath) ? `segment:${obj.segments.find(seg => seg.imagePath).id}` : ''))
      const settings = { ...data.settings, ...(item.settings ?? {}) }
      const [dir, setDir] = useState('')
      const [exporting, setExporting] = useState(false)
      const [result, setResult] = useState(null)

      const missingAudio = item.counts.segments - item.counts.voiced
      const missingImage = item.counts.segments - item.counts.imaged
      // 音由这一步自己补，只有图必须先在分镜图页出好
      const ready = item.counts.segments > 0 && missingImage === 0
      const needDub = missingAudio > 0

      const patch = async next => {
        setSettingsError(null)
        try {
          await post('item-settings', { id: item.id, settings: next })
          await onReload()
        } catch (err) {
          setSettingsError('保存设置失败：' + err.message)
        }
      }

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
          settingsError ? h('div', { className: 'sd-hint', style: { marginTop: 4, color: 'var(--dsw-alias-state-error-primary)' } }, settingsError) : null,
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
                h('option', { value: 'none' }, '硬切（秒级）'),
                h('option', { value: 'fade' }, '淡入淡出（要重编码全片）'),
                h('option', { value: 'fadeblack' }, '经过黑场（要重编码全片）'),
                h('option', { value: 'dissolve' }, '溶解（要重编码全片）'),
                h('option', { value: 'wipeleft' }, '向左擦除（要重编码全片）'),
                h('option', { value: 'circleopen' }, '圆形展开（要重编码全片）'))),
            h('div', { className: 'sd-field', style: { flex: 1, minWidth: 150 } },
              h('label', null, '同时渲染'),
              h('select', {
                className: 'sd-select',
                value: String(settings.renderWorkers ?? 0),
                onChange: event => patch({ renderWorkers: Number(event.target.value) }),
              },
                h('option', { value: '0' }, `自动 · ${data.autoWorkers ?? 2} 个镜头`),
                ...workerOptions(data).map(n => h('option', { key: n, value: String(n) }, `${n} 个镜头`)))),
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
          settings.transition && settings.transition !== 'none'
            ? h('div', {
              className: 'sd-hint',
              style: { marginTop: 6, color: 'var(--dsw-alias-state-warn-primary, #b7791f)' },
            },
              `转场要把整片重编码一遍，${item.segments.length} 段、约 ${formatSecs(item.segments.reduce((a, s2) => a + (Number(s2.audioSecs) || 0), 0))} 的片子，`
              + `拼接大概要 ${Math.max(1, Math.round(item.segments.reduce((a, s2) => a + (Number(s2.audioSecs) || 0), 0) / 60))} 分钟；`
              + '换成「硬切」是几秒。')
            : null,
          h('div', { className: 'sd-hint', style: { marginTop: 4, opacity: .8 } },
            `该怎么理解这个数：它指的是「同时渲染几个镜头」，不是用几个核。每个镜头的滤镜大约吃掉 2–4 个逻辑核，这台机器 ${data.cpuCores ?? '?'} 核，自动档给 ${data.autoWorkers ?? 2} 个镜头一起跑；同时跑着别的活（本地模型、生图）就往下调。`,
            data.maxWorkers && data.maxWorkers < 100
              ? ` 当前是硬件编码，最多只能同时开 ${data.maxWorkers} 路（显卡的并发会话限制），填更大的值会自动收回到 ${data.maxWorkers}。`
              : ''),
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

        h('div', { className: 'sd-card-block' },
          h('div', { className: 'sd-block-title' }, '封面'),
          h('div', { className: 'sd-row', style: { gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' } },
            h('div', { className: 'sd-field', style: { flex: 2, minWidth: 200 } },
              h('label', null, '底图'),
              h('select', {
                className: 'sd-select',
                value: coverRef(item),
                onChange: event => setCoverRef(event.target.value),
              },
                h('option', { value: '' }, item.anchors?.length ? '用定稿参考图' : '用第一张分镜图'),
                (item.anchors ?? []).filter(a => a.approved || a.candidates?.length).map(a =>
                  h('option', { key: a.id, value: `anchor:${a.id}` }, `参考图 · ${a.name}`)),
                item.segments.filter(seg => seg.imagePath).map(seg =>
                  h('option', { key: seg.id, value: `segment:${seg.id}` }, `分镜图 · 第 ${seg.idx + 1} 段`)))),
            h('div', { className: 'sd-field', style: { flex: 3, minWidth: 220 } },
              h('label', null, '标题文字'),
              h('input', {
                className: 'sd-input', value: coverTitle, maxLength: 40,
                placeholder: item.title || '封面标题',
                onChange: event => setCoverTitle(event.target.value),
              })),
            h('button', {
              className: 'sd-btn', 'data-kind': item.cover ? undefined : 'primary', type: 'button',
              disabled: busy || makingCover || !(item.segments.some(seg => seg.imagePath) || (item.anchors ?? []).some(a => a.approved || a.candidates?.length)),
              onClick: async () => {
                setMakingCover(true)
                try {
                  await post('cover', { id: item.id, ref: coverRef(item), title: coverTitle.trim() || item.title })
                  await onReload()
                } catch (err) {
                  setCoverError(err.message)
                } finally {
                  setMakingCover(false)
                }
              },
            }, makingCover ? '生成中…' : item.cover ? '重新生成封面' : '生成封面')),
          coverError ? h('div', { className: 'sd-hint', style: { marginTop: 6, color: 'var(--dsw-alias-state-error-primary)' } }, coverError) : null,
          item.cover
            ? h('div', { className: 'sd-row', style: { gap: 14, marginTop: 12, alignItems: 'flex-start' } },
              h('img', {
                className: 'sd-cover-preview',
                src: mediaUrl(item.id, item.cover.path, item.cover.at ? Date.parse(item.cover.at) : undefined),
                alt: '封面预览',
              }),
              h('div', { style: { flex: 1, minWidth: 0 } },
                h('div', { className: 'sd-hint' }, `标题：${item.cover.title}`),
                h('div', { className: 'sd-hint', style: { marginTop: 4 } }, `${item.cover.width}×${item.cover.height} · 平台竖版`),
                h('div', { className: 'sd-row', style: { gap: 8, marginTop: 10 } },
                  h('a', {
                    className: 'sd-btn', 'data-kind': 'ghost',
                    href: mediaUrl(item.id, item.cover.path), download: `${downloadName(item, ' 封面')}.png`, target: '_blank', rel: 'noreferrer',
                  }, '下载封面')),
                h('label', { className: 'sd-hint', style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', marginTop: 12 } },
                  h('input', {
                    type: 'checkbox', checked: settings.coverInVideo !== false,
                    onChange: event => patch({ coverInVideo: event.target.checked }),
                  }),
                  '合成时放进视频开头（平台抓第一帧当封面）')))
            : h('div', { className: 'sd-hint', style: { marginTop: 8 } },
              '选一张底图，标题会自动压在画面底部。勾选下面那项就会作为视频第一帧；不勾则只导出独立图片，单独上传给平台。')),

        item.render
          ? h('div', { className: 'sd-render' },
            h('video', { className: 'sd-video', controls: true, preload: 'metadata', src: mediaUrl(item.id, item.render.path, renderStamp(item)) }),
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
                  href: mediaUrl(item.id, item.render.path, renderStamp(item)), download: `${downloadName(item)}.mp4`, target: '_blank', rel: 'noreferrer',
                }, '下载成片'),
                item.render.srtPath ? h('a', {
                  className: 'sd-btn', 'data-kind': 'ghost',
                  href: mediaUrl(item.id, item.render.srtPath, renderStamp(item)), download: `${downloadName(item)}.srt`, target: '_blank', rel: 'noreferrer',
                }, '下载 SRT') : null)))
          : h('div', { className: 'sd-empty' }, ready ? '素材齐了，点「合成成片」。' : '音画还不齐，先去③④补上。'))
    }

    // ------------------------------------------------------------------ 发布页

    /** 与 src/publish/rules.js 同一口径；改规则时两边一起改。 */
    function xWeightedLength(value) {
      const text = String(value ?? '')
      // URL 遇到空白与中日韩/全角字符就截断，否则紧跟中文的链接会把后面的字吞进 23 里
      const urlPattern = /https?:\/\/[^\s\u3000-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]+/g
      // 中日韩文字与全角标点按 2 计重
      const cjkPattern = /[\u1100-\u11FF\u2E80-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]/
      const weight = chunk => {
        let sum = 0
        for (const ch of String(chunk)) {
          sum += ch.codePointAt(0) > 0xffff ? 2 : cjkPattern.test(ch) ? 2 : 1
        }
        return sum
      }
      let total = 0
      let last = 0
      for (const match of text.matchAll(urlPattern)) {
        // 链接尾部紧贴的 ASCII 标点不属于 URL：URL 仍按 23 计，标点留给普通字符计权
        const url = match[0].replace(/[.,;:!?'")\]]+$/, '')
        total += weight(text.slice(last, match.index)) + 23
        last = match.index + url.length
      }
      return total + weight(text.slice(last))
    }

    function formatFileSize(bytes) {
      const size = Number(bytes) || 0
      if (size < 1024) return size + ' B'
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
      if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + ' MB'
      return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    }

    function composeVariantText(platformId, variant) {
      if (platformId === 'xiaohongshu') {
        const parts = []
        const title = String(variant?.title ?? '').trim()
        const body = String(variant?.body ?? '').trim()
        const tags = (Array.isArray(variant?.tags) ? variant.tags : []).map(tag => '#' + String(tag).trim())
        if (title) parts.push(title)
        if (body) parts.push(body)
        if (tags.length) parts.push(tags.join(' '))
        return parts.join('\n\n')
      }
      const posts = Array.isArray(variant?.posts) && variant.posts.length
        ? variant.posts.map(post => String(post ?? ''))
        : (String(variant?.text ?? '').trim() ? [String(variant.text)] : [])
      if (posts.length <= 1) return String(posts[0] ?? '').trim()
      return posts.map((post, index) => (index === 0 ? '【主帖】\n' : '【回复 ' + index + '】\n') + String(post ?? '').trim()).join('\n\n')
    }

    async function copyPlainText(text) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        // 局域网 http 不是安全上下文，clipboard 用不了，退回 execCommand
      }
      try {
        const area = document.createElement('textarea')
        area.value = text
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        return ok
      } catch {
        return false
      }
    }

    function PublishPage({ item, data, busy, onAction, onReload, onGoTab }) {
      const [view, setView] = useState(null)
      const [loadError, setLoadError] = useState(null)
      const [drafts, setDrafts] = useState(null)
      const [tagInput, setTagInput] = useState('')
      const [coverTitle, setCoverTitle] = useState('')
      const [note, setNote] = useState(null)
      const [saving, setSaving] = useState(false)
      const [makingCover, setMakingCover] = useState(false)
      const [clipBusy, setClipBusy] = useState(false)
      const [clipStart, setClipStart] = useState(0)
      const [cardsBusy, setCardsBusy] = useState(false)
      const [exporting, setExporting] = useState(false)
      const [dir, setDir] = useState('')
      const [exportResult, setExportResult] = useState(null)
      const [copyNote, setCopyNote] = useState('')
      const [activePlatform, setActivePlatform] = useState('xiaohongshu')
      const [feedbackOpen, setFeedbackOpen] = useState(false)
      const [feedbackText, setFeedbackText] = useState('')
      const [feedbackScopes, setFeedbackScopes] = useState([])
      const [revisionBusy, setRevisionBusy] = useState(false)
      const [revisionPending, setRevisionPending] = useState(false)
      const [coverTab, setCoverTab] = useState('text')
      const [coverBusy, setCoverBusy] = useState(false)
      const [coverChoice, setCoverChoice] = useState(0)
      const [historyOpen, setHistoryOpen] = useState(false)
      const [proposalHidden, setProposalHidden] = useState(false)
      const coverTouchedRef = useRef(false)
      const saveTimerRef = useRef(null)
      const dirtyRef = useRef(false)
      const draftsRef = useRef(null)
      // 这批草稿属于哪个项目：卸载兜底保存只能写回它，不能写进切换后的项目
      const draftsOwnerRef = useRef(item.id)
      const prevVariantsRef = useRef(null)
      const generatingRef = useRef(false)
      const task = item.task
      const generating = Boolean(task?.running && task.kind === 'publish-copy')
      const revising = Boolean(task?.running && task.kind === 'publish-revise')
      generatingRef.current = generating
      const taskRunning = Boolean(task?.running)
      // 生成/修订期间输入会被服务端结果覆盖，先锁住，完成后再让用户确认改
      const inputsLocked = generating || revising || taskRunning

      const refresh = useCallback(async () => {
        try {
          const body = await post('publish/read', { id: item.id })
          setView(body.publish)
          if (!coverTouchedRef.current) {
            setCoverTitle(body.publish.cover?.title || body.publish.variants?.xiaohongshu?.title || item.title || '')
          }
          setLoadError(null)
        } catch (err) {
          setLoadError(err.message)
        }
      }, [item.id, item.title])

      useEffect(() => { refresh() }, [refresh, item.render?.at])

      // 已有切片时把起点同步到下拉，重新切不会默默从 0 开始
      useEffect(() => {
        if (view?.clip) setClipStart(Number(view.clip.start) || 0)
      }, [view?.clip?.path])

      // 文案生成 / 封面生成这类任务跑完，刷新一次发布数据
      const wasRunning = useRef(false)
      useEffect(() => {
        const running = Boolean(item.task?.running)
        const had = wasRunning.current
        wasRunning.current = running
        if (!running) setRevisionPending(false)
        if (had && !running) refresh()
      }, [item.task?.running, item.task?.finishedAt, refresh])

      // 只合并服务端真正变了的平台；单平台生成完成时，另一平台没保存的草稿要留着
      const variantsKey = view ? JSON.stringify(view.variants ?? {}) : ''
      useEffect(() => {
        if (!view) return
        const next = view.variants ?? {}
        const prev = prevVariantsRef.current
        prevVariantsRef.current = JSON.parse(JSON.stringify(next))
        const current = draftsRef.current
        if (!current || draftsOwnerRef.current !== item.id) {
          // 还没草稿（或换了项目）：直接以这个项目的服务端数据为准，并记下草稿归属
          draftsOwnerRef.current = item.id
          setDrafts(JSON.parse(JSON.stringify(next)))
          return
        }
        const merged = JSON.parse(JSON.stringify(current))
        const keptLabels = []
        for (const platformId of Object.keys(next)) {
          const nextKey = JSON.stringify(next[platformId] ?? {})
          const localKey = JSON.stringify(current[platformId] ?? {})
          if (localKey === nextKey) continue // 本地和服务端一致，不用动
          const changed = !prev || JSON.stringify(prev[platformId] ?? {}) !== nextKey
          if (!changed) continue // 服务端没变，本地草稿保留
          if (prev && JSON.stringify(prev[platformId] ?? {}) !== localKey) {
            // 服务端这个平台变了、本地也还有未保存修改：保留本地并提示，不能一覆盖了之
            const label = (view.platforms ?? []).find(row => row.id === platformId)?.label ?? platformId
            keptLabels.push(label)
            continue
          }
          merged[platformId] = JSON.parse(JSON.stringify(next[platformId]))
        }
        setDrafts(merged)
        if (keptLabels.length) {
          setNote({
            tone: 'warn',
            text: `生成结果已更新；本次保留你对「${keptLabels.join('、')}」的未保存修改，确认后可点「保存」覆盖服务端。`,
          })
        }
      }, [variantsKey])

      const draftsSafe = drafts ?? {}
      const dirty = Boolean(view && drafts && JSON.stringify(drafts) !== JSON.stringify(view.variants ?? {}))
      dirtyRef.current = dirty
      draftsRef.current = drafts
      const targets = view?.targets ?? []
      const platformById = id => (view?.platforms ?? []).find(row => row.id === id) ?? { id, label: id, summary: '', composeUrl: '' }
      const platformLabel = id => platformById(id).label
      const countsOf = platformId => platformId === 'xiaohongshu'
        ? {
          title: [...String(draftsSafe.xiaohongshu?.title ?? '')].length,
          body: [...String(draftsSafe.xiaohongshu?.body ?? '')].length,
          tags: (Array.isArray(draftsSafe.xiaohongshu?.tags) ? draftsSafe.xiaohongshu.tags : []).length,
          comment: [...String(draftsSafe.xiaohongshu?.comment ?? '')].length,
        }
        : (() => {
          const posts = Array.isArray(draftsSafe.x?.posts) && draftsSafe.x.posts.length
            ? draftsSafe.x.posts.map(post => String(post ?? ''))
            : (String(draftsSafe.x?.text ?? '').trim() ? [String(draftsSafe.x.text)] : [])
          const weights = posts.map(post => xWeightedLength(post))
          return { weighted: weights.length ? Math.max(...weights) : 0, posts: weights, count: posts.length }
        })()

      const scheduleSave = () => {
        if (inputsLocked) return
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        // 让检查/页签徽标跟着输入走：停止输入 900ms 后自动存一次，不再等 onBlur
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null
          if (dirtyRef.current && !generatingRef.current) save()
        }, 900)
      }

      const patchDraft = (platformId, patch) => {
        setDrafts(prev => {
          const next = JSON.parse(JSON.stringify(prev ?? {}))
          next[platformId] = { ...(next[platformId] ?? {}), ...patch }
          return next
        })
        scheduleSave()
      }

      // 服务端已经采用/回滚了提案：本地草稿与「上一次服务端值」都对齐到新版本。
      // 不这样做的话，合并 effect 会把旧草稿当成「本地未保存修改」保留，
      // 切页时的卸载兜底保存又会把旧草稿写回服务端，覆盖刚采用的修订。
      const syncDraftsFromServer = publish => {
        const synced = JSON.parse(JSON.stringify(publish?.variants ?? {}))
        prevVariantsRef.current = synced
        setDrafts(synced)
      }

      const save = async () => {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        if (saving || taskRunning) return null
        setSaving(true)
        setNote(null)
        try {
          // 两个平台都提交；从 ref 取最新草稿，避免 900ms 自动保存拿到上一次渲染的旧快照
          const payload = draftsRef.current ?? {}
          const body = await post('publish/save', {
            id: item.id,
            targets: ['xiaohongshu', 'x'],
            variants: payload,
          })
          setView(body.publish)
          setDrafts(JSON.parse(JSON.stringify(body.publish.variants ?? {})))
          setNote({ tone: 'ok', text: '已保存' })
          return body.publish
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
          return null
        } finally {
          setSaving(false)
        }
      }

      const autoSave = () => {
        if (dirty && !saving && !generating && !taskRunning) save()
      }

      // 切走页签/切项目时兜底保存，兜住「打了字直接切页」的常见路径。
      // 草稿只写回它所属的项目：切项目时项目树整棵重挂，A 的草稿绝不能写进 B 的 publish.json
      useEffect(() => () => {
        if (draftsOwnerRef.current !== item.id) return
        if (!dirtyRef.current || generatingRef.current) return
        const payload = draftsRef.current
        if (!payload) return
        post('publish/save', { id: item.id, targets: ['xiaohongshu', 'x'], variants: payload }).catch(() => {})
      }, [item.id])

      // 服务端出现新提案时重新弹出；用户点「稍后处理」后本轮不再自动弹
      useEffect(() => {
        const pending = (view?.revisions ?? []).some(row => row.status === 'proposed')
        if (pending) setProposalHidden(false)
      }, [view?.revisions])

      // 换项目后旧的 dirty 标记作废，避免新项目首帧被误判成有未保存改动
      useEffect(() => { dirtyRef.current = false }, [item.id])

      // 卸载时清掉自动保存定时器，避免组件已卸载还发请求
      useEffect(() => () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      }, [])

      const addTag = () => {
        const tag = tagInput.trim().replace(/^#+/, '').trim()
        if (!tag) return
        const xhs = draftsSafe.xiaohongshu ?? { tags: [] }
        const tags = Array.isArray(xhs.tags) ? xhs.tags : []
        const max = platformById('xiaohongshu').tags?.max ?? 10
        if (tags.includes(tag)) { setTagInput(''); return }
        if (tags.length >= max) { setNote({ tone: 'error', text: '话题最多 ' + max + ' 个' }); return }
        patchDraft('xiaohongshu', { tags: [...tags, tag] })
        setTagInput('')
      }

      const generate = async () => {
        if (generating || taskRunning) return
        const has = Boolean(composeVariantText(activePlatform, draftsSafe[activePlatform] ?? {}))
        if (has && !window.confirm('会覆盖「' + platformLabel(activePlatform) + '」当前文案，继续？')) return
        // 先落盘再生成：否则模型按服务端旧文案写，完成后又会把刚编辑的内容覆盖掉
        const saved = await save()
        if (!saved) return
        onAction('publish/generate', { id: item.id, targets: [activePlatform] }, null)
      }

      const makeCover = async () => {
        if (makingCover || taskRunning) return
        setMakingCover(true)
        setNote(null)
        try {
          const saved = await save({})
          if (!saved) return
          const body = await post('publish/cover', {
            id: item.id,
            title: coverTouchedRef.current ? coverTitle.trim() : '',
            textSource: coverTouchedRef.current ? 'manual' : (view.cover?.textSource || 'auto'),
          })
          coverTouchedRef.current = false
          setView(body.publish)
          setNote({ tone: 'ok', text: '封面已生成' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setMakingCover(false)
        }
      }

      const makeCards = async () => {
        if (cardsBusy || taskRunning) return
        setCardsBusy(true)
        setNote(null)
        try {
          const saved = await save()
          if (!saved) return
          const body = await post('publish/cards', { id: item.id, count: 10 })
          setView(body.publish)
          setNote({ tone: 'ok', text: '图文卡片已生成' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setCardsBusy(false)
        }
      }

      const makeClip = async () => {
        if (clipBusy || taskRunning) return
        setClipBusy(true)
        setNote(null)
        try {
          const body = await post('publish/clip', { id: item.id, start: Number(clipStart) || 0 })
          setView(body.publish)
          setNote({ tone: 'ok', text: 'X 主帖切片已生成' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setClipBusy(false)
        }
      }

      const doExport = async () => {
        if (exporting || taskRunning) return
        setExporting(true)
        setNote(null)
        setExportResult(null)
        try {
          const saved = await save({})
          if (!saved) return
          const body = await post('publish/export', { id: item.id, dir })
          setExportResult(body.export)
          setView(body.publish)
          setNote({ tone: 'ok', text: '发布包已生成' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setExporting(false)
        }
      }

      const markPublished = async platformId => {
        const record = (view?.records ?? []).find(row => row.platform === platformId)
        const url = window.prompt('作品链接（可留空）：', record?.url ?? '')
        if (url === null) return
        try {
          const body = await post('publish/record', {
            id: item.id, platform: platformId, status: 'published', url: url.trim(),
          })
          setView(body.publish)
          setNote({ tone: 'ok', text: '已标记发布' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        }
      }

      const unmarkPublished = async platformId => {
        try {
          const body = await post('publish/record', { id: item.id, platform: platformId, status: 'pending' })
          setView(body.publish)
          setNote({ tone: 'ok', text: '已取消标记' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        }
      }

      const doCopy = async platformId => {
        const ok = await copyPlainText(composeVariantText(platformId, draftsSafe[platformId] ?? {}))
        setCopyNote(ok ? platformLabel(platformId) + '文案已复制' : '复制失败，请手动选中复制')
        setTimeout(() => setCopyNote(''), 2500)
      }

      const copyComment = async () => {
        const text = String(draftsSafe.xiaohongshu?.comment ?? '').trim()
        if (!text) { setNote({ tone: 'warn', text: '先写置顶评论，发布后再贴' }); return }
        const ok = await copyPlainText(text)
        setCopyNote(ok ? '置顶评论已复制' : '复制失败，请手动选中复制')
        setTimeout(() => setCopyNote(''), 2500)
      }

      const head = h('div', { className: 'sd-pub-head' },
        h('div', null,
          h('div', { className: 'sd-pub-kicker' }, '发布准备'),
          h('div', { className: 'sd-pub-title' }, '小红书 / X · 生成文案和发布包，自己上传'),
          h('div', { className: 'sd-pub-sub' }, '不登录平台、不代发；文案可改，检查通过后导出。')),
        view && (view.revisions ?? []).length
          ? h('div', { className: 'sd-pub-head-actions' },
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', onClick: () => setHistoryOpen(true) }, '修改历史'))
          : null)

      if (!item.render) {
        return h(React.Fragment, null,
          head,
          h('div', { className: 'sd-empty', style: { marginTop: 14 } },
            h('div', null, '还没有成片，先在「⑥ 成片」合成一条，再来做发布包。'),
            h('div', { style: { marginTop: 12 } },
              h('button', { className: 'sd-btn', type: 'button', onClick: () => onGoTab('rendered') }, '去成片页'))))
      }

      if (loadError) {
        return h(React.Fragment, null,
          head,
          h('div', { className: 'sd-empty', style: { marginTop: 14 } },
            h('div', null, '发布数据加载失败：' + loadError),
            h('div', { style: { marginTop: 12 } },
              h('button', { className: 'sd-btn', type: 'button', onClick: refresh }, '重试'))))
      }

      if (!view) {
        return h(React.Fragment, null, head, h('div', { className: 'sd-hint', style: { paddingTop: 24 } }, '正在读取发布数据…'))
      }

      const revisions = view.revisions ?? []
      let proposed = null
      for (let index = revisions.length - 1; index >= 0; index -= 1) {
        if (revisions[index].status === 'proposed') { proposed = revisions[index]; break }
      }
      const scopeLabel = id => ({ title: '标题', body: '正文', coverText: '封面大字' }[id] ?? id)
      const quickChips = {
        title: ['更短', '更有冲突', '别用问句', '更口语', '突出数字'],
        body: ['开头更抓人', '少一点史料', '多讲人物', '结尾加互动', '压缩到 400 字内'],
        coverText: ['字再少一点', '更口语', '换一个角度', '别用问句', '更有画面感'],
      }

      const openFeedback = scope => {
        setFeedbackScopes([scope])
        setFeedbackText('')
        setFeedbackOpen(true)
      }
      const toggleScope = scopeId => {
        setFeedbackScopes(prev => (prev.includes(scopeId)
          ? (prev.length > 1 ? prev.filter(row => row !== scopeId) : prev)
          : [...prev, scopeId]))
      }
      const submitFeedback = async () => {
        if (revisionBusy || taskRunning) return
        const text = feedbackText.trim()
        if (!feedbackScopes.length) { setNote({ tone: 'error', text: '至少选择一个要修改的字段' }); return }
        if (text.length < 2) { setNote({ tone: 'error', text: '修改意见太短，至少写两个字' }); return }
        setRevisionBusy(true)
        setRevisionPending(true)
        setProposalHidden(false)
        setNote(null)
        try {
          const saved = await save()
          if (!saved) { setRevisionPending(false); return }
          await post('publish/revise', { id: item.id, scope: feedbackScopes, feedback: text })
          // 本地先隐藏旧提案，等新任务完成后 refresh 再显示新提案
          setView(prev => (prev ? {
            ...prev,
            revisions: (prev.revisions ?? []).map(row => (row.status === 'proposed' ? { ...row, status: 'rejected' } : row)),
          } : prev))
          await onReload()
          setFeedbackOpen(false)
          setCoverChoice(0)
          setNote({ tone: 'ok', text: '已提交意见，正在生成修改提案…' })
        } catch (err) {
          setRevisionPending(false)
          setNote({ tone: 'error', text: err.message })
        } finally {
          setRevisionBusy(false)
        }
      }

      const applyRevision = async () => {
        if (!proposed || revisionBusy || taskRunning) return
        const localVariant = draftsSafe.xiaohongshu ?? {}
        const serverVariant = view.variants?.xiaohongshu ?? {}
        const dirtyScopes = []
        if (proposed.scope.includes('title') && String(localVariant.title ?? '') !== String(serverVariant.title ?? '')) dirtyScopes.push('标题')
        if (proposed.scope.includes('body') && String(localVariant.body ?? '') !== String(serverVariant.body ?? '')) dirtyScopes.push('正文')
        if (proposed.scope.includes('coverText') && coverTouchedRef.current && coverTitle.trim() !== String(view.cover?.title ?? '')) dirtyScopes.push('封面大字')
        if (dirtyScopes.length && !window.confirm('你在提案生成后又改过' + dirtyScopes.join('、') + '，采用会覆盖这些未保存的修改，继续？')) return
        setRevisionBusy(true)
        setNote(null)
        let coverWarn = null
        try {
          const payload = { id: item.id, revisionId: proposed.id }
          if (proposed.scope.includes('coverText')) payload.coverTextIndex = coverChoice
          let body
          try {
            body = await post('publish/revise/apply', payload)
          } catch (err) {
            if (/已经改过/.test(err.message)) {
              if (!window.confirm(err.message + '，仍要采用吗？')) return
              // 409 后强制重试：成功同样走下面的「对齐草稿」
              body = await post('publish/revise/apply', { ...payload, force: true })
            } else {
              throw err
            }
          }
          let next = body.publish
          const nextTitle = next?.variants?.xiaohongshu?.title
          // 到这一步提案已经写回服务端了。封面同步失败不能把整个「采用」算失败：
          // 否则弹窗还挂着旧提案，再点「采用」只会收到「已经处理过了」（死锁）
          if (proposed.scope.includes('title') && nextTitle && next?.cover?.path && next?.cover?.textSource !== 'manual') {
            if (window.confirm('标题已改，要把封面大字同步成新标题吗？')) {
              try {
                const coverBody = await post('publish/cover', { id: item.id, title: nextTitle, textSource: 'auto' })
                next = coverBody.publish
              } catch (err) {
                coverWarn = '提案已采用，但封面同步失败：' + err.message
              }
            }
          }
          if (proposed.scope.includes('coverText')) {
            coverTouchedRef.current = false
            if (next?.cover?.title) setCoverTitle(next.cover.title)
          } else if (next?.cover?.title && !coverTouchedRef.current) {
            setCoverTitle(next.cover.title)
          }
          setView(next)
          // 本地草稿与合并基线一起对齐到采用后的服务端版本：
          // 否则合并 effect 会把旧草稿当「本地未保存」保留，卸载兜底保存再写回服务端覆盖修订
          syncDraftsFromServer(next)
          setCoverChoice(0)
          setNote(coverWarn ? { tone: 'warn', text: coverWarn } : { tone: 'ok', text: '已采用修改提案' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setRevisionBusy(false)
        }
      }

      const discardRevision = async () => {
        if (!proposed || revisionBusy) return
        setRevisionBusy(true)
        try {
          const body = await post('publish/revise/discard', { id: item.id, revisionId: proposed.id })
          setView(body.publish)
          syncDraftsFromServer(body.publish)
          setNote({ tone: 'ok', text: '已保留原样' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setRevisionBusy(false)
        }
      }

      const reviseAgain = () => {
        if (!proposed) return
        setFeedbackScopes(proposed.scope)
        setFeedbackText(proposed.feedback)
        setCoverChoice(0)
        setFeedbackOpen(true)
      }

      const revertRevision = async revisionId => {
        if (revisionBusy || !window.confirm('回滚到这次修改前的版本？')) return
        setRevisionBusy(true)
        try {
          const body = await post('publish/revise/revert', { id: item.id, revisionId })
          setView(body.publish)
          syncDraftsFromServer(body.publish)
          setHistoryOpen(false)
          setNote({ tone: 'ok', text: '已回滚' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setRevisionBusy(false)
        }
      }

      const applyCover = async patch => {
        if (coverBusy || taskRunning || makingCover) return
        setCoverBusy(true)
        setNote(null)
        try {
          // 换底图/排版时带上正在编辑的封面大字，别用旧的 view.cover.title 把刚改的字顶回去
          const edited = coverTitle.trim()
          const body = await post('publish/cover', {
            id: item.id,
            title: coverTouchedRef.current ? edited : (view.cover?.title || edited),
            textSource: coverTouchedRef.current ? 'manual' : (view.cover?.textSource || 'auto'),
            ...patch,
          })
          setView(body.publish)
          setNote({ tone: 'ok', text: '封面已更新' })
        } catch (err) {
          setNote({ tone: 'error', text: err.message })
        } finally {
          setCoverBusy(false)
        }
      }

      const platformTabs = h('div', { className: 'sd-pub-tabs', role: 'tablist', 'aria-label': '发布平台' },
        ['xiaohongshu', 'x'].map(platformId => {
          const info = platformById(platformId)
          const active = activePlatform === platformId
          const errors = view.checks.filter(check => check.platform === platformId && check.state === 'error').length
          const warns = view.checks.filter(check => check.platform === platformId && check.state === 'warn').length
          return h('button', {
            key: platformId, type: 'button', className: 'sd-pub-tab',
            role: 'tab', id: 'sd-pub-tab-' + platformId, 'aria-controls': 'sd-pub-panel',
            'aria-selected': active ? 'true' : 'false',
            'data-on': active ? '1' : '0',
            onClick: () => setActivePlatform(platformId),
          },
            h('span', { className: 'sd-pub-picon', 'data-platform': platformId },
              platformId === 'xiaohongshu' ? '小红书' : 'X'),
            h('span', { style: { minWidth: 0, textAlign: 'left' } },
              h('span', { className: 'sd-pub-pname' }, info.label),
              h('span', { className: 'sd-pub-pmeta' },
                platformId === 'xiaohongshu' ? '标题 · 正文 · 置顶评论 · 3:4 封面' : '2–4 条 thread · 每条 ≤280 加权')),
            errors ? h('span', { className: 'sd-pub-taberr' }, errors)
              : warns ? h('span', { className: 'sd-pub-tabwarn' }, '!') : null)
        }))

      const xhsInfo = platformById('xiaohongshu')
      const xhs = draftsSafe.xiaohongshu ?? { title: '', body: '', tags: [] }
      const xhsCount = countsOf('xiaohongshu')
      const xhsCard = h('div', { className: 'sd-pub-card' },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-picon', 'data-platform': 'xiaohongshu', style: { width: 20, height: 20, fontSize: 5.5, borderRadius: 5 } }, '小红书'),
          h('span', { className: 'sd-pub-card-title' }, '小红书文案'),
          h('span', { className: 'sd-pub-counter' },
            '标题 ' + xhsCount.title + '/' + (xhsInfo.title?.max ?? 20)
            + ' · 正文 ' + xhsCount.body + '/' + (xhsInfo.body?.max ?? 1000)
            + ' · 话题 ' + xhsCount.tags + '/' + (xhsInfo.tags?.max ?? 10)
            + ' · 评论 ' + xhsCount.comment + '/' + (xhsInfo.comment?.max ?? 1000)),
          dirty ? h('span', { className: 'sd-pub-chip', 'data-tone': 'warn' }, '未保存') : null),
        h('div', { className: 'sd-field', style: { marginTop: 0 } },
          h('div', { className: 'sd-pub-labelrow' },
            h('label', null, '标题'),
            h('button', {
              className: 'sd-pub-ask', type: 'button',
              disabled: taskRunning || saving || revising || generating,
              onClick: () => openFeedback('title'),
            }, '提意见')),
          h('input', {
            className: 'sd-input', value: xhs.title ?? '', maxLength: 120,
            placeholder: '20 字以内，带钩子',
            disabled: inputsLocked,
            style: inputsLocked ? { opacity: .6 } : undefined,
            onChange: event => patchDraft('xiaohongshu', { title: event.target.value }),
            onBlur: autoSave,
          })),
        h('div', { className: 'sd-field', style: { marginTop: 0 } },
          h('div', { className: 'sd-pub-labelrow' },
            h('label', null, '正文'),
            h('button', {
              className: 'sd-pub-ask', type: 'button',
              disabled: taskRunning || saving || revising || generating,
              onClick: () => openFeedback('body'),
            }, '提意见')),
          h('textarea', {
            className: 'sd-text', value: xhs.body ?? '', rows: 6,
            style: { minHeight: 132, ...(inputsLocked ? { opacity: .6 } : null) },
            placeholder: '300–600 字，分段写',
            disabled: inputsLocked,
            onChange: event => patchDraft('xiaohongshu', { body: event.target.value }),
            onBlur: autoSave,
          })),
        h('div', { className: 'sd-field', style: { marginTop: 0 } },
          h('label', null, '话题'),
          h('div', { className: 'sd-pub-tags' },
            (Array.isArray(xhs.tags) ? xhs.tags : []).map((tag, index) => h('span', {
              key: String(tag) + index, className: 'sd-tag',
              style: { display: 'inline-flex', alignItems: 'center', gap: 3 },
            },
              '#' + tag,
              h('button', {
                type: 'button', className: 'sd-pub-tagx', title: '移除', disabled: inputsLocked,
                onClick: () => patchDraft('xiaohongshu', {
                  tags: (Array.isArray(xhs.tags) ? xhs.tags : []).filter((row, i) => i !== index),
                }),
              }, '×'))),
            h('input', {
              value: tagInput,
              placeholder: '输入话题，回车添加',
              disabled: inputsLocked,
              style: inputsLocked ? { opacity: .6 } : undefined,
              onChange: event => setTagInput(event.target.value),
              onBlur: autoSave,
              onKeyDown: event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag()
                }
              },
            }))),
        h('div', { className: 'sd-field', style: { marginTop: 0 } },
          h('div', { className: 'sd-pub-labelrow' },
            h('label', null, '置顶评论'),
            h('span', { className: 'sd-pub-counter' }, xhsCount.comment + '/' + (xhsInfo.comment?.max ?? 1000))),
          h('textarea', {
            className: 'sd-text', value: xhs.comment ?? '', rows: 4,
            style: { minHeight: 92, ...(inputsLocked ? { opacity: .6 } : null) },
            placeholder: '发布后贴到第一条评论并置顶；定时发布时评论入口要等发布后才开',
            disabled: inputsLocked,
            onChange: event => patchDraft('xiaohongshu', { comment: event.target.value }),
            onBlur: autoSave,
          })),
        h('div', { className: 'sd-card-foot' },
          h('button', {
            className: 'sd-btn', 'data-kind': 'primary', type: 'button',
            disabled: generating || saving || taskRunning, onClick: generate,
          }, generating ? '生成中…' : '一键生成'),
          h('button', { className: 'sd-btn', type: 'button', disabled: saving || taskRunning, onClick: () => save() },
            saving ? '保存中…' : '保存'),
          h('span', { style: { flex: 1 } }),
          h('button', {
            className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
            disabled: saving || !String(xhs.comment ?? '').trim(), onClick: copyComment,
          }, '复制置顶评论'),
          h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: saving, onClick: () => doCopy('xiaohongshu') },
            '复制文案')))

      const xInfo = platformById('x')
      const xDraft = draftsSafe.x ?? { text: '', posts: [] }
      const xMaxWeighted = xInfo.text?.maxWeighted ?? 280
      const xMaxPosts = xInfo.thread?.maxPosts ?? 5
      const xPostsSafe = Array.isArray(xDraft.posts) && xDraft.posts.length
        ? xDraft.posts.map(post => String(post ?? ''))
        : (String(xDraft.text ?? '').trim() ? [String(xDraft.text)] : [''])
      const xWeights = xPostsSafe.map(post => xWeightedLength(post))
      const patchXPost = (index, value) => {
        const next = [...xPostsSafe]
        while (next.length <= index) next.push('')
        next[index] = value
        patchDraft('x', { posts: next, text: next[0] ?? '' })
      }
      const addXPost = () => {
        if (xPostsSafe.length >= xMaxPosts) return
        const next = [...xPostsSafe, '']
        patchDraft('x', { posts: next, text: next[0] ?? '' })
      }
      const removeXPost = index => {
        if (xPostsSafe.length <= 1) return
        const next = xPostsSafe.filter((_, i) => i !== index)
        patchDraft('x', { posts: next, text: next[0] ?? '' })
      }
      const xCard = h('div', { className: 'sd-pub-card' },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-picon', 'data-platform': 'x', style: { width: 20, height: 20, fontSize: 11, borderRadius: 5 } }, 'X'),
          h('span', { className: 'sd-pub-card-title' }, 'X thread'),
          h('span', { className: 'sd-pub-counter' }, '主帖 ' + (xWeights[0] ?? 0) + '/' + xMaxWeighted + ' · ' + xPostsSafe.length + ' 条'),
          dirty ? h('span', { className: 'sd-pub-chip', 'data-tone': 'warn' }, '未保存') : null),
        h('div', { className: 'sd-hint' }, '主帖先发，回复按顺序挂在前一条下；每条都按 280 加权字符检查。'),
        xPostsSafe.map((post, index) => h('div', { key: 'x-post-' + index, className: 'sd-field', style: { marginTop: 0 } },
          h('div', { className: 'sd-pub-labelrow' },
            h('label', null, index === 0 ? '主帖' : '回复 ' + index),
            h('span', { className: 'sd-pub-counter' }, (xWeights[index] ?? 0) + '/' + xMaxWeighted),
            xPostsSafe.length > 1
              ? h('button', {
                className: 'sd-pub-tagx', type: 'button', title: '删除这条', disabled: inputsLocked,
                onClick: () => removeXPost(index),
              }, '×')
              : null),
          h('textarea', {
            className: 'sd-text', value: post, rows: index === 0 ? 4 : 3,
            style: { minHeight: index === 0 ? 92 : 72, ...(inputsLocked ? { opacity: .6 } : null) },
            placeholder: index === 0 ? '主帖：钩子 + 结果 + 关键数字' : '回复：补全片、装法或口径',
            disabled: inputsLocked,
            onChange: event => patchXPost(index, event.target.value),
            onBlur: autoSave,
          }),
          h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
            h('button', {
              className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
              disabled: !String(post).trim(),
              onClick: async () => {
                const ok = await copyPlainText(String(post).trim())
                setCopyNote(ok ? (index === 0 ? '主帖已复制' : '回复 ' + index + ' 已复制') : '复制失败，请手动选中复制')
                setTimeout(() => setCopyNote(''), 2500)
              },
            }, index === 0 ? '复制主帖' : '复制这条')))),
        h('div', { className: 'sd-field', style: { marginTop: 0 } },
          h('div', { className: 'sd-pub-labelrow' },
            h('label', null, 'X 主帖切片'),
            h('span', { className: 'sd-pub-counter' }, view.clip ? Math.round(view.clip.secs) + ' 秒' : '未切')),
          h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
            h('select', {
              className: 'sd-input', value: clipStart, disabled: inputsLocked || clipBusy,
              style: { maxWidth: 230 },
              onChange: event => setClipStart(Number(event.target.value) || 0),
            }, (Array.isArray(view.clipOptions) && view.clipOptions.length ? view.clipOptions : [{ sec: 0, label: '从开头切' }])
              .map(option => h('option', { key: String(option.sec), value: option.sec }, option.label))),
            h('input', {
              className: 'sd-input', type: 'number', min: 0, step: 0.1, value: clipStart,
              disabled: inputsLocked || clipBusy, style: { maxWidth: 96 },
              title: '也可以手填起点秒数', placeholder: '起点秒',
              onChange: event => setClipStart(Math.max(0, Number(event.target.value) || 0)),
            }),
            h('button', {
              className: 'sd-btn', 'data-kind': view.clip ? 'ghost' : 'primary', type: 'button',
              disabled: clipBusy || saving || taskRunning, onClick: makeClip,
            }, clipBusy ? '切…' : view.clip ? '重新切' : '切 60 秒')),
          h('div', { className: 'sd-hint' }, '主帖发 ≤60 秒切片，回复 1 再发全片；导出包会带 x/video-60s.mp4。'),
          view.clip?.path
            ? h('a', {
              className: 'sd-btn', 'data-kind': 'ghost',
              href: mediaUrl(item.id, view.clip.path, view.clip.at ? Date.parse(view.clip.at) : undefined),
              download: 'x-main-60s.mp4', target: '_blank', rel: 'noreferrer', style: { alignSelf: 'flex-start' },
            }, '下载切片')
            : null),
        h('div', { className: 'sd-card-foot' },
          h('button', {
            className: 'sd-btn', 'data-kind': 'primary', type: 'button',
            disabled: generating || saving || taskRunning, onClick: generate,
          }, generating ? '生成中…' : '一键生成'),
          h('button', { className: 'sd-btn', type: 'button', disabled: saving || taskRunning, onClick: () => save() },
            saving ? '保存中…' : '保存'),
          h('button', {
            className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
            disabled: saving || inputsLocked || xPostsSafe.length >= xMaxPosts, onClick: addXPost,
          }, '加一条回复'),
          h('span', { style: { flex: 1 } }),
          h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: saving, onClick: () => doCopy('x') },
            '复制全部')))

      const guideCard = h('div', { className: 'sd-pub-card', style: { gap: 6 } },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-card-title' }, '复制文案，自己去发'),
          h('span', { className: 'sd-pub-counter' }, '不调用平台接口')),
        h('div', { className: 'sd-hint' }, '打开平台投稿页 → 上传视频 → 回来勾一下「已发布」。'),
        h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
          h('button', {
            className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
            onClick: () => window.open(platformById(activePlatform).composeUrl, '_blank', 'noopener,noreferrer'),
          }, '打开' + platformLabel(activePlatform))))

      const coverTabs = h('div', { className: 'sd-rev-tabs', role: 'tablist', 'aria-label': '封面设置' },
        [['text', '文字'], ['source', '底图'], ['layout', '排版']].map(([id, label]) => h('button', {
          key: id, type: 'button', role: 'tab', className: 'sd-rev-tab',
          'aria-selected': coverTab === id ? 'true' : 'false',
          'data-on': coverTab === id ? '1' : '0',
          onClick: () => setCoverTab(id),
        }, label)))

      const coverBusyNow = coverBusy || makingCover || taskRunning || revising || saving
      const coverCard = h('div', { className: 'sd-pub-card' },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-card-title' }, '小红书封面'),
          h('span', { className: 'sd-pub-counter' }, view.cover
            ? view.cover.width + '×' + view.cover.height + ' · 3:4'
            : '1080×1440 · 3:4'),
          h('button', {
            className: 'sd-pub-ask', type: 'button',
            disabled: taskRunning || revising || makingCover,
            onClick: () => openFeedback('coverText'),
          }, '提意见')),
        coverTabs,
        coverTab === 'text'
          ? h('div', { className: 'sd-pub-coverrow' },
            h('div', { className: 'sd-pub-coverbox' },
              view.cover?.path
                ? h('img', {
                  src: mediaUrl(item.id, view.cover.path, view.cover.at ? Date.parse(view.cover.at) : undefined),
                  alt: '封面预览',
                })
                : h('div', { className: 'sd-pub-cover-empty' }, '还没有封面')),
            h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 } },
              h('div', { className: 'sd-hint' }, '封面大字单独出图，导出时按 3:4 带上。'),
              h('div', { className: 'sd-field', style: { marginTop: 0 } },
                h('label', null, '封面大字'),
                h('input', {
                  className: 'sd-input', value: coverTitle, maxLength: 40,
                  onChange: event => { coverTouchedRef.current = true; setCoverTitle(event.target.value) },
                }),
                coverTouchedRef.current && coverTitle.trim() !== (view.cover?.title ?? '')
                  ? h('div', { className: 'sd-hint', style: { color: 'var(--dsw-alias-state-warn-primary)' } },
                    '封面大字还没生成：改完要点上面的「重新生成」才会生效，预览里仍是旧大字。')
                  : null),
              h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                h('button', {
                  className: 'sd-btn', 'data-kind': view.cover?.path ? undefined : 'primary', type: 'button',
                  disabled: coverBusyNow,
                  onClick: makeCover,
                }, makingCover ? '生成中…' : view.cover?.path ? '重新生成' : '生成封面'),
                view.cover?.path ? h('a', {
                  className: 'sd-btn', 'data-kind': 'ghost',
                  href: mediaUrl(item.id, view.cover.path, view.cover.at ? Date.parse(view.cover.at) : undefined),
                  download: 'cover-3x4.png', target: '_blank', rel: 'noreferrer',
                }, '下载封面') : null)))
          : coverTab === 'source'
            ? h('div', null,
              h('div', { className: 'sd-hint' }, '从已有分镜图或参考图里换一张底图，文字位置不变。'),
              (view.coverSources ?? []).length
                ? h('div', { className: 'sd-rev-sources' }, view.coverSources.map(src => h('button', {
                  key: src.ref, type: 'button', className: 'sd-rev-source',
                  'data-on': view.cover?.sourceRef === src.ref ? '1' : '0',
                  disabled: coverBusyNow,
                  onClick: () => applyCover({ ref: src.ref }),
                },
                  h('img', { src: mediaUrl(item.id, src.path), alt: src.label }),
                  h('span', null, src.label))))
                : h('div', { className: 'sd-empty', style: { marginTop: 8 } }, '还没有可用底图，先去分镜图页出几张图。'))
            : h('div', null,
              h('div', { className: 'sd-hint' }, '文字位置'),
              h('div', { className: 'sd-rev-quick' },
                [['bottom', '底部'], ['top', '顶部']].map(([value, label]) => h('button', {
                  key: value, type: 'button',
                  'data-on': (view.cover?.layout || 'bottom') === value ? '1' : '0',
                  disabled: coverBusyNow,
                  onClick: () => applyCover({ layout: value }),
                }, label))),
              h('div', { className: 'sd-hint', style: { marginTop: 8 } }, '字号'),
              h('div', { className: 'sd-rev-quick' },
                [[0.85, '小'], [1, '中'], [1.15, '大']].map(([value, label]) => h('button', {
                  key: String(value), type: 'button',
                  'data-on': Math.abs((view.cover?.fontScale ?? 1) - value) < 0.01 ? '1' : '0',
                  disabled: coverBusyNow,
                  onClick: () => applyCover({ fontScale: value }),
                }, label)))))

      const xhsCards = Array.isArray(view.cards) ? view.cards : []
      const cardsCard = h('div', { className: 'sd-pub-card' },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-card-title' }, '小红书图文卡片'),
          h('span', { className: 'sd-pub-counter' }, xhsCards.length ? xhsCards.length + ' 张 · 3:4' : '未生成')),
        h('div', { className: 'sd-hint' }, '封面 + 分镜说明，1080×1440；发图文笔记时按 01… 顺序上传，导出包写到 xiaohongshu/cards/。'),
        xhsCards.length
          ? h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 } },
            xhsCards.map((card, index) => h('a', {
              key: String(card.path) + index,
              href: mediaUrl(item.id, card.path),
              download: 'xhs-card-' + String(index + 1).padStart(2, '0') + '.png',
              target: '_blank', rel: 'noreferrer',
              style: { display: 'block', minWidth: 0, color: 'inherit', textDecoration: 'none' },
              title: card.title || '卡片 ' + (index + 1),
            },
              h('img', {
                src: mediaUrl(item.id, card.path),
                alt: card.title || '图文卡片',
                loading: 'lazy',
                style: { width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 6, display: 'block' },
              }),
              h('span', { className: 'sd-hint', style: { display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                String(index + 1).padStart(2, '0') + ' · ' + (card.title || '卡片')))))
          : null,
        h('button', {
          className: 'sd-btn', 'data-kind': xhsCards.length ? 'ghost' : 'primary', type: 'button',
          disabled: cardsBusy || saving || taskRunning,
          onClick: makeCards, style: { alignSelf: 'flex-start' },
        }, cardsBusy ? '生成中…' : xhsCards.length ? '重新生成' : '生成 10 张卡片'))

      const stateColor = state => state === 'error'
        ? 'var(--dsw-alias-state-error-primary)'
        : state === 'warn'
          ? 'var(--dsw-alias-state-warn-primary)'
          : 'var(--dsw-alias-state-success-primary)'
      const activeChecks = view.checks.filter(check => check.platform === activePlatform)
      const activeBlocking = activeChecks.filter(check => check.state === 'error').length
      const otherBlocking = view.blocking - activeBlocking
      const checksCard = h('div', { className: 'sd-pub-card' },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-card-title' }, '发布前检查 · ' + platformLabel(activePlatform)),
          h('span', {
            className: 'sd-pub-chip', 'data-tone': activeBlocking ? 'error' : 'ok', style: { marginLeft: 'auto' },
          }, activeBlocking ? activeBlocking + ' 项要改' : '本页通过')),
        activeChecks.length
          ? activeChecks.map(check => h('div', { key: check.platform + ':' + check.id, className: 'sd-pub-checkrow' },
            h('span', { className: 'sd-pub-checkmark', style: { color: stateColor(check.state) } },
              check.state === 'ok' ? '✓' : check.state === 'warn' ? '!' : '×'),
            h('span', { className: 'sd-pub-checkname' }, check.label),
            h('span', {
              className: 'sd-pub-checkval', 'data-state': check.state,
              title: [check.detail, check.fix].filter(Boolean).join(' · '),
            }, check.detail)))
          : h('div', { className: 'sd-hint' }, '还没有检查项'),
        otherBlocking > 0
          ? h('div', { className: 'sd-pub-error' }, '另一个平台还有 ' + otherBlocking + ' 项要改，导出会被挡住。')
          : null,
        h('div', { className: 'sd-hint' }, '输入停止约 1 秒后会自动保存，检查与本页徽标会跟着更新。'))

      const exportCard = h('div', { className: 'sd-pub-card' },
        h('div', { className: 'sd-pub-card-head' },
          h('span', { className: 'sd-pub-card-title' }, '发布包'),
          h('span', { className: 'sd-pub-counter' }, '写到项目 exports/')),
        h('div', { className: 'sd-field', style: { marginTop: 0 } },
          h('label', null, '复制到指定目录（可留空）'),
          h('input', {
            className: 'sd-input', value: dir, spellCheck: false,
            placeholder: '留空就只生成在项目里',
            onChange: event => setDir(event.target.value),
          })),
        h('button', {
          className: 'sd-btn', 'data-kind': 'primary', type: 'button',
          disabled: exporting || saving || taskRunning || !view.canExport || view.blocking > 0,
          onClick: doExport,
        }, exporting ? '导出中…' : '导出发布包（' + targets.length + ' 个平台）'),
        view.blocking ? h('div', { className: 'sd-pub-error' }, '先改掉 ' + view.blocking + ' 项超限才能导出。') : null,
        exportResult ? h('div', null,
          h('div', { className: 'sd-pub-ok' },
            '已生成 ' + exportResult.relDir
            + (exportResult.copied && !exportResult.copied.error ? '，并复制到 ' + exportResult.copied : '')),
          exportResult.copied && exportResult.copied.error
            ? h('div', { className: 'sd-pub-error' }, '复制到目录失败：' + exportResult.copied.error)
            : null,
          h('div', { className: 'sd-pub-tree' },
            exportResult.files.map(file => h('div', { key: file.path, className: 'sd-pub-treerow' },
              h('span', { className: 'sd-pub-treepath', title: file.path + ' · ' + formatFileSize(file.bytes) }, file.name),
              h('a', {
                className: 'sd-pub-treelink',
                href: mediaUrl(item.id, file.path),
                download: String(file.name || '').split('/').pop() || 'download',
                target: '_blank', rel: 'noreferrer',
              }, '下载')))))
          : view.exports?.length
            ? h('div', { className: 'sd-hint' }, '上次导出：' + view.exports[view.exports.length - 1].dir)
            : null,
        h('div', { className: 'sd-pub-records' },
          targets.map(platformId => {
            const record = (view.records ?? []).find(row => row.platform === platformId)
            const published = record?.status === 'published'
            return h('div', { key: platformId, className: 'sd-pub-record' },
              h('span', null, platformLabel(platformId)),
              h('span', { className: 'sd-pub-chip', 'data-tone': published ? 'ok' : undefined },
                published ? '已发布' : '待发布'),
              h('button', {
                className: 'sd-btn', 'data-kind': 'ghost', type: 'button',
                onClick: () => (published ? unmarkPublished(platformId) : markPublished(platformId)),
              }, published ? '取消标记' : '标记已发布'))
          })))

      const revisionStatusLabel = status => ({
        proposed: '待采用', accepted: '已采用', rejected: '已放弃', reverted: '已回滚',
      }[status] ?? status)
      const quickForScope = () => {
        const rows = []
        for (const scopeId of feedbackScopes) {
          for (const chip of quickChips[scopeId] ?? []) {
            if (!rows.includes(chip)) rows.push(chip)
          }
        }
        return rows
      }

      const feedbackModal = feedbackOpen ? h('div', { className: 'sd-mask', ...maskHandlers(() => setFeedbackOpen(false)) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '按意见修改', style: { maxWidth: 580 } },
          h('h3', null, '按意见修改'),
          h('div', { className: 'sd-hint' }, '只改勾选的字段；生成提案后先预览，采用后才写回。'),
          note && note.tone === 'error' ? h('div', { className: 'sd-pub-error', style: { marginTop: 6 } }, note.text) : null,
          h('div', { className: 'sd-rev-scopes' },
            ['title', 'body', 'coverText'].map(scopeId => h('button', {
              key: scopeId, type: 'button', className: 'sd-rev-scope',
              'data-on': feedbackScopes.includes(scopeId) ? '1' : '0',
              onClick: () => toggleScope(scopeId),
            }, scopeLabel(scopeId)))),
          quickForScope().length
            ? h('div', { className: 'sd-field', style: { marginTop: 8 } },
              h('label', null, '快捷意见'),
              h('div', { className: 'sd-rev-quick' },
                quickForScope().map(chip => h('button', {
                  key: chip, type: 'button',
                  onClick: () => setFeedbackText(chip),
                }, chip))))
            : null,
          h('div', { className: 'sd-field' },
            h('label', null, '直接说想怎么改'),
            h('textarea', {
              className: 'sd-text', value: feedbackText, rows: 4,
              placeholder: '例：标题不要用问句，改成陈述式，控制在 16 字内，突出「一杯酒」。',
              onChange: event => setFeedbackText(event.target.value),
            })),
          h('div', { className: 'sd-card-foot' },
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', onClick: () => setFeedbackOpen(false) }, '取消'),
            h('span', { style: { flex: 1 } }),
            h('button', {
              className: 'sd-btn', 'data-kind': 'primary', type: 'button',
              disabled: revisionBusy || feedbackText.trim().length < 2 || !feedbackScopes.length,
              onClick: submitFeedback,
            }, revisionBusy ? '提交中…' : '生成修改提案')))) : null

      const proposalModal = proposed && !feedbackOpen && !revisionPending && !revising && !proposalHidden ? h('div', { className: 'sd-mask', ...maskHandlers(() => setProposalHidden(true)) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '修改提案', style: { maxWidth: 620 } },
          h('h3', null, '修改提案'),
          h('div', { className: 'sd-hint' }, '意见：' + (proposed.feedback || '（无）')),
          note && note.tone === 'error' ? h('div', { className: 'sd-pub-error', style: { marginTop: 6 } }, note.text) : null,
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 } },
            proposed.scope.includes('title') ? h('div', { className: 'sd-rev-proposal' },
              h('div', { className: 'sd-rev-proposal-head' }, '标题', h('span', null, '提案 · 未采用')),
              h('div', { className: 'sd-rev-old' }, proposed.before?.title || '（空）'),
              h('div', { className: 'sd-rev-new' }, proposed.after?.title || '（空）')) : null,
            proposed.scope.includes('body') ? h('div', { className: 'sd-rev-proposal' },
              h('div', { className: 'sd-rev-proposal-head' }, '正文', h('span', null, '提案 · 未采用')),
              h('div', { className: 'sd-rev-old' }, proposed.before?.body || '（空）'),
              h('div', { className: 'sd-rev-new' }, proposed.after?.body || '（空）')) : null,
            proposed.scope.includes('coverText') ? h('div', { className: 'sd-rev-proposal' },
              h('div', { className: 'sd-rev-proposal-head' }, '封面大字', h('span', null, '提案 · 未采用')),
              h('div', { className: 'sd-rev-old' }, proposed.before?.coverText || '（还没有封面大字）'),
              (proposed.after?.coverTexts ?? []).map((text, index) => h('label', {
                key: String(index), className: 'sd-rev-choice',
                'data-on': coverChoice === index ? '1' : '0',
              },
                h('input', {
                  type: 'radio', name: 'sd-cover-choice', checked: coverChoice === index,
                  onChange: () => setCoverChoice(index),
                }),
                h('span', null, text)))) : null),
          proposed.note ? h('div', { className: 'sd-hint', style: { marginTop: 8 } }, '模型说明：' + proposed.note) : null,
          h('div', { className: 'sd-rev-actions' },
            h('button', { className: 'sd-btn', 'data-kind': 'primary', type: 'button', disabled: revisionBusy, onClick: applyRevision }, revisionBusy ? '处理中…' : '采用'),
            h('button', { className: 'sd-btn', type: 'button', disabled: revisionBusy, onClick: reviseAgain }, '再改一版'),
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: revisionBusy, onClick: () => setProposalHidden(true) }, '稍后处理'),
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: revisionBusy, onClick: discardRevision }, '保留原样')))) : null

      const historyModal = historyOpen ? h('div', { className: 'sd-mask', ...maskHandlers(() => setHistoryOpen(false)) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '修改历史', style: { maxWidth: 620 } },
          h('h3', null, '修改历史'),
          h('div', { className: 'sd-hint' }, '采用过的提案可以回滚；生成中的提案会显示在上一个弹窗。'),
          revisions.length
            ? h('div', { className: 'sd-rev-history' }, revisions.slice().reverse().map(row => h('div', { key: row.id, className: 'sd-rev-history-row' },
              h('span', null, (row.scope ?? []).map(scopeLabel).join(' / ') + ' · ' + revisionStatusLabel(row.status)),
              h('b', { title: row.feedback }, row.feedback || '（无意见）'),
              row.status === 'accepted'
                ? h('button', { className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: revisionBusy, onClick: () => revertRevision(row.id) }, '回滚')
                : null)))
            : h('div', { className: 'sd-hint', style: { marginTop: 8 } }, '还没有修改记录。'),
          h('div', { className: 'sd-card-foot', style: { marginTop: 12 } },
            h('span', { style: { flex: 1 } }),
            h('button', { className: 'sd-btn', type: 'button', onClick: () => setHistoryOpen(false) }, '关闭')))) : null

      return h(React.Fragment, null,
        head,
        platformTabs,
        note ? h('div', {
          className: note.tone === 'error' ? 'sd-pub-error' : note.tone === 'warn' ? 'sd-pub-note' : 'sd-pub-ok',
          style: { marginTop: 8, ...(note.tone === 'warn' ? { color: 'var(--dsw-alias-state-warn-primary)' } : null) },
        }, note.text) : null,
        (generating || revising) && task ? h('div', { className: 'sd-pub-note', style: { marginTop: 6 } },
          (task.message || '正在处理…') + (task.total > 1 ? '（' + task.done + '/' + task.total + '）' : '')) : null,
        generating ? h('div', { className: 'sd-pub-note', style: { marginTop: 4, color: 'var(--dsw-alias-state-warn-primary)' } },
          '生成中：完成后会覆盖「' + platformLabel(activePlatform) + '」当前文案，先别改输入框。') : null,
        revising ? h('div', { className: 'sd-pub-note', style: { marginTop: 4, color: 'var(--dsw-alias-state-warn-primary)' } },
          '修订提案生成中：结果先预览，采用后才会写回文案。') : null,
        taskRunning && !generating && !revising
          ? h('div', { className: 'sd-pub-note', style: { marginTop: 4, color: 'var(--dsw-alias-state-warn-primary)' } },
            '项目正在跑任务，发布页文案暂时只能看不能改，等任务结束再编辑。')
          : null,
        !task?.running && task?.error && (task.kind === 'publish-copy' || task.kind === 'publish-revise')
          ? h('div', { className: 'sd-pub-error', style: { marginTop: 6 } }, '处理失败：' + task.error)
          : null,
        copyNote ? h('div', { className: 'sd-pub-ok', style: { marginTop: 6 } }, copyNote) : null,
        h('div', {
          className: 'sd-pub-grid', role: 'tabpanel', id: 'sd-pub-panel',
          'aria-label': platformLabel(activePlatform) + ' 发布页',
        },
          h('div', { className: 'sd-pub-col' },
            activePlatform === 'xiaohongshu' ? xhsCard : xCard,
            guideCard),
          h('div', { className: 'sd-pub-col' },
            activePlatform === 'xiaohongshu' ? coverCard : null,
            activePlatform === 'xiaohongshu' ? cardsCard : null,
            checksCard,
            exportCard)),
        proposalModal,
        feedbackModal,
        historyModal,
        h('div', { className: 'sd-pub-foot' },
          h('span', null, '发布包写到项目 exports/ 目录，可随时删除'),
          h('span', null, '数据只在本机 · 不上传云端')))
    }

    // ------------------------------------------------------------------ 分段卡片

    /** mode：script 改字、voice 听音、image 看图。只显示这一页用得上的控件。 */
    function SegmentCard({ item, seg, mode, disabled, onAction, onReload, onZoom }) {
      const [text, setText] = useState(seg.text)
      const [prompt, setPrompt] = useState(seg.imagePrompt)
      const [note, setNote] = useState('')
      const [saveError, setSaveError] = useState(null)
      const dirty = mode === 'script' && (text !== seg.text || prompt !== seg.imagePrompt)
      // 图页没有保存按钮：输入框里的提示词和上次保存的不同，就还算未保存
      const imageDirty = mode === 'image' && prompt !== seg.imagePrompt

      useEffect(() => { setText(seg.text) }, [seg.text])
      useEffect(() => { setPrompt(seg.imagePrompt) }, [seg.imagePrompt])

      const save = useCallback(async () => {
        if (!dirty) return
        try {
          // 只提交本段，避免两段连着保存时用旧快照盖掉前一段的改动
          await post('segments', { id: item.id, segment: { id: seg.id, text, imagePrompt: prompt } })
          setSaveError(null)
          await onReload()
        } catch (err) {
          // 保存失败时保留输入，不闪回旧稿；但错误得让用户看见
          setSaveError('保存失败：' + err.message + '，请重试')
        }
      }, [dirty, item, seg.id, text, prompt, onReload])

      const voiced = Boolean(seg.audioPath && seg.audioSecs > 0)
      return h('div', { className: 'sd-card', 'data-mode': mode },
        // 图只在分镜图页出现：稿子页、旁白页只管自己的事，不渲染缩略图也不占位。
        // 分镜图页保留「无图」空位——那页就是管图的，没画出来得看得见。
        mode !== 'image'
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
            // 「未出图」同样是分镜图页的事，别的页不挂这个状态
            mode === 'image' && !seg.imagePath ? h('span', { className: 'sd-tag', 'data-tone': 'warn' }, '未出图') : null,
            dirty || imageDirty ? h('span', { className: 'sd-tag' }, '未保存') : null,
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
                try {
                  await post('segments', { id: item.id, segment: { id: seg.id, imagePrompt: prompt } })
                  setSaveError(null)
                  await onReload()
                } catch (err) {
                  // 失败也保留「未保存」提示，别让用户以为已经存上了
                  setSaveError('保存失败：' + err.message + '，请重试')
                }
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

          saveError
            ? h('div', { className: 'sd-hint', style: { marginTop: 6, color: 'var(--dsw-alias-state-error-primary)', wordBreak: 'break-word' } }, saveError)
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

    function NewDialog({ error, onClose, onCreate, initialTopic = '' }) {
      const [topic, setTopic] = useState(initialTopic)
      const [minutes, setMinutes] = useState(5)
      const [rawText, setRawText] = useState('')
      const [showRaw, setShowRaw] = useState(false)
      const [busy, setBusy] = useState(false)
      const [formError, setFormError] = useState(null)
      const boxRef = useRef(null)
      useDialog(onClose, boxRef)

      const submit = async () => {
        if (!topic.trim()) { setFormError('先写一个主题或书名'); return }
        setBusy(true)
        setFormError(null)
        try {
          await onCreate({ topic: topic.trim(), targetMinutes: Number(minutes) || 5, rawText })
        } catch (err) {
          setFormError(err.message)
        } finally {
          setBusy(false)
        }
      }

      return h('div', { className: 'sd-mask', ...maskHandlers(onClose) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '新建项目', 'aria-modal': 'true', ref: boxRef },
          h('h3', null, '新建项目'),
          h('div', { className: 'sd-hint' }, '给一个主题就行。有现成材料就展开贴上，稿子会照着材料写。'),
          h('div', { className: 'sd-field' },
            h('label', { htmlFor: 'sd-topic' }, '主题 / 书名'),
            h('input', {
              id: 'sd-topic', className: 'sd-input', value: topic, autoFocus: true,
              placeholder: '例：九子夺嫡 / 安史之乱 / 一场暴雨是怎么形成的',
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
          (error || formError) ? h('div', { className: 'sd-error' }, error || formError) : null,
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

    /**
     * 遮罩关闭守卫：按下和松开都落在遮罩上才算「点空白关闭」。
     * 在对话框里按下、拖到遮罩上松开（编辑时框选文字很常见）不算，避免误关丢输入。
     */
    function maskHandlers(onClose) {
      let downOnMask = false
      let upOnMask = false
      return {
        onMouseDown: event => { downOnMask = event.target === event.currentTarget },
        onMouseUp: event => { upOnMask = event.target === event.currentTarget },
        onClick: event => {
          if (downOnMask && upOnMask && event.target === event.currentTarget) onClose()
        },
      }
    }

    /**
     * 弹窗通用交互：打开时把焦点放进第一个可操作控件，Esc 关闭，Tab 焦点圈在弹窗里。
     * onClose 用 ref 存：父组件每轮轮询都会重渲染，不能因此把焦点重置一遍。
     */
    function useDialog(onClose, boxRef) {
      const closeRef = useRef(onClose)
      closeRef.current = onClose
      useEffect(() => {
        const node = boxRef.current
        if (!node) return undefined
        const selector = 'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]'
        const first = node.querySelector(selector)
        if (first) first.focus()
        const onKey = event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeRef.current?.()
            return
          }
          if (event.key !== 'Tab') return
          const rows = [...node.querySelectorAll(selector)].filter(row => row.offsetParent !== null)
          if (!rows.length) return
          const head = rows[0]
          const tail = rows[rows.length - 1]
          const active = document.activeElement
          if (event.shiftKey && (active === head || !node.contains(active))) {
            event.preventDefault()
            tail.focus()
          } else if (!event.shiftKey && (active === tail || !node.contains(active))) {
            event.preventDefault()
            head.focus()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [boxRef])
    }

    /** 删除前的确认。文案说清「进回收站还能找回」，免得用户以为是彻底删除。 */
    function ConfirmDelete({ item, days, error, onCancel, onConfirm, busy }) {
      const boxRef = useRef(null)
      useDialog(onCancel, boxRef)
      return h('div', { className: 'sd-mask', ...maskHandlers(onCancel) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '删除项目', 'aria-modal': 'true', ref: boxRef, style: { width: 'min(420px,92vw)' } },
          h('h3', null, '删除这个项目？'),
          h('div', { className: 'sd-hint', style: { marginTop: 6, lineHeight: 1.8 } },
            '「', item.title || '未命名', '」会移进回收站，',
            h('b', null, `${days} 天内可以还原`),
            '，到期自动彻底删除。'),
          error ? h('div', { className: 'sd-error' }, error) : null,
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
      const boxRef = useRef(null)
      useDialog(onClose, boxRef)

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

      return h('div', { className: 'sd-mask', ...maskHandlers(onClose) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '回收站', 'aria-modal': 'true', ref: boxRef, style: { width: 'min(520px,94vw)' } },
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
                  onClick: () => {
                    // 彻底删除不可恢复，必须先确认
                    if (!window.confirm(`彻底删除「${row.title || '未命名'}」？文件会从磁盘删掉，不可恢复。`)) return
                    act('trash-purge', { id: row.id })
                  },
                }, '彻底删除')))
              : h('div', { className: 'sd-hint', style: { padding: '14px 0' } }, '回收站是空的。')),
          h('div', { className: 'sd-dialog-foot' },
            items.length
              ? h('button', {
                className: 'sd-btn', 'data-kind': 'ghost', type: 'button', disabled: busy !== null,
                onClick: () => {
                  if (!window.confirm(`清空回收站？里面的 ${items.length} 个项目会被连文件一起删掉，不可恢复。`)) return
                  act('trash-purge', { all: true })
                },
              }, '清空回收站')
              : null,
            h('button', { className: 'sd-btn', 'data-kind': 'primary', type: 'button', onClick: onClose }, '关闭'))))
    }

    function SettingsDialog({ data, theme = 'warm', onTheme, onClose, onSaved }) {
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

      // 有未保存改动时点遮罩/取消要先确认，别一声不吭把填的东西全丢了
      const dirty = useMemo(() => {
        const base = settings ?? {}
        const changed = Object.keys({ ...base, ...form }).some(key => JSON.stringify(form[key]) !== JSON.stringify(base[key]))
        return changed || Boolean(ttsKey.trim() || imageKey.trim())
      }, [form, settings, ttsKey, imageKey])
      const requestClose = useCallback(() => {
        if (!dirty || window.confirm('设置有改动还没保存，确定关闭？')) onClose()
      }, [dirty, onClose])
      const boxRef = useRef(null)
      useDialog(requestClose, boxRef)

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
          // 每段时长统一按 12–90 秒这一档走，和选题页、服务端口径一致
          const segmentSeconds = Math.max(12, Math.min(90, Number(form.segmentSeconds) || 40))
          await post('settings', { settings: { ...form, segmentSeconds, theme } })
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

      return h('div', { className: 'sd-mask', ...maskHandlers(requestClose) },
        h('div', { className: 'sd-dialog', role: 'dialog', 'aria-label': '声画工作台设置', 'aria-modal': 'true', ref: boxRef },
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
                h('div', { className: 'sd-section-title' }, '外观'),
                h('div', { className: 'sd-field' },
                  h('label', null, '界面配色'),
                  h('div', { className: 'sd-row', style: { gap: 8 } },
                    h('button', {
                      className: 'sd-btn', type: 'button',
                      'data-kind': theme === 'warm' ? 'primary' : 'ghost',
                      onClick: () => onTheme?.('warm'),
                    }, '工作台暖调'),
                    h('button', {
                      className: 'sd-btn', type: 'button',
                      'data-kind': theme === 'dsh' ? 'primary' : 'ghost',
                      onClick: () => onTheme?.('dsh'),
                    }, '跟随 DSH')),
                  h('div', { className: 'sd-hint', style: { marginTop: 6 } },
                    '暖调是墨褐底配暖金强调，跟片子的调性一致；跟随 DSH 用中性深灰底配蓝强调，跟宿主界面一个调子。点一下立即生效，不用保存。')),
                h('div', { className: 'sd-section-title', style: { marginTop: 18 } }, '回收站'),
                h('div', { className: 'sd-field' },
                  h('label', null, '保留天数'),
                  h('input', {
                    className: 'sd-input', type: 'number', min: 1, max: 365,
                    value: form.trashDays ?? 7,
                    onChange: event => set('trashDays', Math.max(1, Math.min(365, Number(event.target.value) || 7))),
                  }),
                  h('div', { className: 'sd-hint', style: { marginTop: 5 } },
                    '删掉的项目先进回收站，超过这个天数自动彻底删除。改小之后，回收站里已过期的项目下次启动会被清掉。')),
                h('div', { className: 'sd-section-title', style: { marginTop: 18 } }, '成片'),
                h('div', { className: 'sd-row', style: { gap: 18, flexWrap: 'wrap' } },
                  h('label', { className: 'sd-hint', style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' } },
                    h('input', { type: 'checkbox', checked: Boolean(form.burnSubtitles), onChange: event => set('burnSubtitles', event.target.checked) }),
                    '字幕压进画面'),
                  h('label', { className: 'sd-hint', style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' } },
                    h('input', { type: 'checkbox', checked: Boolean(form.kenBurns), onChange: event => set('kenBurns', event.target.checked) }),
                    '默认开启推近运镜')),
                h('div', { className: 'sd-hint', style: { marginTop: 6 } },
                  '运镜方向、调色、转场、片头在「成片」页逐个项目调，这里只给新项目定个默认。'))
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
              : tab === 'tts'
                ? h('div', { className: 'sd-section' },
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
                  onChange: event => set('segmentSeconds', Math.max(12, Math.min(90, Number(event.target.value) || 40))),
                }))),
            h('div', { className: 'sd-row', style: { marginTop: 10, gap: 8 } },
              h('button', {
                className: 'sd-btn', type: 'button',
                disabled: test.tts?.busy, onClick: () => runTest('tts'),
              }, test.tts?.busy ? '检测中…' : '检测连接')),
            h(TestResult, { state: test.tts }))
              : null),

          // ------------------------------------------------------ 装配开关
          error ? h('div', { className: 'sd-error' }, error) : null,

          h('div', { className: 'sd-dialog-foot' },
            h('button', { className: 'sd-btn', 'data-kind': 'ghost', onClick: requestClose, disabled: busy }, '取消'),
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
          label: () => '声画工作台',
        }, () => h(DeskIcon, { size: 16 })))
      },
    }
  },
})
