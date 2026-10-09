import {useLayoutEffect,useRef,useState} from 'react';

// Geometry can fit the reader while labels keep the reader's actual text size.
// Widths here are SVG logical units; sixteen logical units equal one rem.
export function useDrawingWidth(desktopWidth){
 const ref=useRef(null),[width,setWidth]=useState(desktopWidth);
 useLayoutEffect(()=>{const element=ref.current;if(!element)return;const update=()=>{const root=parseFloat(getComputedStyle(document.documentElement).fontSize);setWidth(Math.min(desktopWidth,Math.max(120,(element.clientWidth-16)*16/root)));};update();const observer=new ResizeObserver(update);observer.observe(element);document.fonts?.ready.then(update);return()=>observer.disconnect();},[desktopWidth]);
 return [ref,width];
}
export function DomainLabels({xDomain,yDomain,xLabel,yLabel,format}){
 return <div className="rmt-domain-labels"><p><strong>Horizontal: {xLabel}</strong><br/>Left {format(xDomain[0],3)}; right {format(xDomain[1],3)}{xDomain[0]<=0&&xDomain[1]>=0?'; axis at 0':''}.</p><p><strong>Vertical: {yLabel}</strong><br/>Bottom {format(yDomain[0],3)}; top {format(yDomain[1],3)}{yDomain[0]<=0&&yDomain[1]>=0?'; axis at 0':''}.</p></div>;
}
export function MarkLegend({items}){return <ul className="rmt-mark-legend">{items.map((item,index)=><li key={index}><span style={{color:item.color}}>●</span> {item.label}</li>)}</ul>;}
