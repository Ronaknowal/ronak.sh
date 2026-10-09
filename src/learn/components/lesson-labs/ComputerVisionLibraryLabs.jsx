import { useState } from 'react';
import { NeuralLab, NeuralNumber, NeuralSelect, formatNeural as format } from './NeuralLessonElements.jsx';
import { initialPixels, imageKernels, validPixelFilter, cropFlipRectangle } from '../../data/vision-library-model.js';
import './neural-lesson-neutral.css';
import './framework-data-contracts.css';

function PixelImage({ left = 0, width = 6, flip = false, crop = null, box, label }) {
  return <svg className="contract-image" style={{maxWidth:width*40}} viewBox={`0 0 ${width * 40} 160`} role="img" aria-label={label}>
    {Array.from({length: 4 * width}, (_,index) => {
      const y = Math.floor(index / width), localX = index % width;
      const x = left + (flip ? width - 1 - localX : localX);
      const inside = x >= 1 && x < 4 && y >= 1 && y < 3;
      return <rect key={index} x={localX*40} y={y*40} width="40" height="40" fill={inside ? '#ff4000' : '#151515'} stroke="#666" strokeWidth=".6" />;
    })}
    {crop && <rect x={crop[0]*40 + 2} y="2" width={crop[1]*40-4} height="156" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="5 4" />}
    {box && <rect x={box[0]*40 + 1} y={box[1]*40 + 1} width={(box[2]-box[0])*40-2} height={(box[3]-box[1])*40-2} fill="none" stroke="#f6cf77" strokeWidth="3" />}
  </svg>;
}

export function ImageContractFigure() {
  return <figure className="contract-figure"><figcaption>One image, explicit pixel and axis meanings</figcaption><div className="contract-grid"><div><PixelImage box={[1,1,4,3]} label="Six columns and four rows. Orange object covers rows 1 to 2 and columns 1 to 3; amber outline shows box edges." /><p>Row y=1, column x=1 is inside the rectangle. Amber outline: box [1,1,4,3].</p></div><div><p><strong>RGB</strong> [255,64,0]</p><p><strong>BGR</strong> [0,64,255]</p><p><strong>Float RGB</strong> [1,0.2509804,0]</p><p>HWC [4,6,3]<br />↓ permute axes<br />CHW [3,4,6]<br />↓ add batch axis<br />NCHW [1,3,4,6]</p></div></div><p>Each cell represents one pixel. The orange color is the example's data; surrounding controls retain the site's neutral/amber theme.</p></figure>;
}

export function PixelFilterLab() {
  const [pixels,setPixels] = useState([...initialPixels]), [selected,setSelected] = useState(0), [output,setOutput] = useState(0), [kernel,setKernel] = useState('mean');
  const results = validPixelFilter(pixels,kernel), current = results[output], weights = imageKernels[kernel];
  const reset = () => { setPixels([...initialPixels]); setSelected(0); setOutput(0); setKernel('mean'); };
  return <NeuralLab id="pixel-filter" title="Move from a pixel neighborhood to its weighted result">
    <p>Select an input pixel to edit its value; select an output cell to expose its 3×3 neighborhood. Input cells outlined in amber contribute to the selected output. The double outline marks the input being edited.</p>
    <div className="neural-controls"><NeuralNumber label={`Input pixel row ${Math.floor(selected/4)}, column ${selected%4}`} value={pixels[selected]} min={0} max={15} step={1} integer onChange={value => setPixels(previous => previous.map((v,i) => i === selected ? value : v))} /><NeuralSelect label="Kernel" value={kernel} onChange={setKernel} options={[["mean","3×3 mean"],["difference","Horizontal signed difference"]]} /></div>
    <div className="contract-grid"><div><h4>Input: 4 rows × 4 columns</h4><div className="contract-pixel-grid">{pixels.map((value,index) => { const shade = Math.round(25+value/15*190); return <button key={index} type="button" aria-label={`Select input row ${Math.floor(index/4)}, column ${index%4}, value ${value}`} aria-pressed={index === selected} data-patch={current.indices.includes(index)} style={{background:`rgb(${shade},${shade},${shade})`,color:shade>130?'#080808':'#fff'}} onClick={() => setSelected(index)}>{value}</button>; })}</div></div>
    <div><h4>Valid output: 2 × 2</h4><div className="contract-pixel-grid" style={{'--pixel-columns':2,maxWidth:180}}>{results.map((result,index) => <button type="button" key={index} aria-pressed={index===output} aria-label={`Inspect output row ${result.y}, column ${result.x}, value ${format(result.value,3)}`} onClick={() => setOutput(index)}>{format(result.value,3)}</button>)}</div><p>At output ({current.y},{current.x}), sum = <strong>{format(current.value,6)}</strong>. Signed values are kept; nothing is clipped to an unsigned image.</p></div></div>
    <div className="contract-grid"><div><h4>Kernel weights</h4><div className="contract-pixel-grid" style={{'--pixel-columns':3,maxWidth:220}}>{weights.map((weight,i)=><span key={i}>{kernel==='mean'?'1/9':weight}</span>)}</div></div><div><h4>Nine contributions</h4><ol className="contract-products">{current.indices.map((source,i)=><li key={i}>{pixels[source]} × {kernel==='mean'?'1/9':weights[i]} = {format(current.products[i],4)}</li>)}</ol></div></div>
    <p className="contract-result">{kernel === 'mean' ? 'The neighborhood shares its intensity: changing one included pixel by 9 changes this output by 1.' : 'Left pixels subtract, right pixels add, and the center column has zero weight. A constant patch has zero response.'}</p>
    <div className="neural-actions"><button type="button" onClick={()=>setPixels(Array(16).fill(0))}>Zero image</button><button type="button" onClick={()=>setPixels(Array(16).fill(6))}>Constant image: 6</button><button type="button" onClick={reset}>Reset pixels and kernel</button></div>
  </NeuralLab>;
}

export function ImageGeometryLab() {
  const [left,setLeft]=useState(2),[width,setWidth]=useState(3),[flip,setFlip]=useState(false);
  const box = cropFlipRectangle(left,width,flip), area = box ? (box[2]-box[0])*(box[3]-box[1]) : 0;
  const editLeft = value => { setLeft(value); setWidth(old => Math.min(old,6-value)); };
  return <NeuralLab id="image-geometry" title="Crop the pixels; transform the annotation in the same frame">
    <p>White dashed outline is the crop. Amber solid outline is the object's box. The original image has six columns; row/column coordinates count pixel edges from zero.</p>
    <div className="neural-controls"><NeuralNumber label="Crop left edge" value={left} min={0} max={5} step={1} integer onChange={editLeft} /><NeuralNumber label="Crop width" value={width} min={1} max={6-left} step={1} integer onChange={setWidth} /><NeuralSelect label="After cropping" value={flip?'flip':'keep'} onChange={value=>setFlip(value==='flip')} options={[["keep","Keep horizontal direction"],["flip","Flip horizontally"]]} /></div>
    <p>Moving the crop start past its current width limit reduces the width to keep the crop inside the image. The new width is shown in both controls.</p>
    <div className="contract-grid"><div><h4>Source: 6 × 4</h4><PixelImage crop={[left,width]} box={[1,1,4,3]} label={`Original object box 1,1,4,3. Crop starts at x ${left} with width ${width}.`} /><p>Source box: [1,1,4,3], area 6.</p></div><div><h4>Result: {width} × 4</h4><PixelImage left={left} width={width} flip={flip} box={box} label={box ? `Transformed object box ${box.join(',')}.` : 'No object remains in the cropped image.'} /><p>Result box: <strong>{box ? `[${box.join(',')}]` : 'removed'}</strong> · visible area {area}.</p></div></div>
    <p className="contract-result">Subtract crop left={left}, clip x edges to [0,{width}]{flip ? `, then map (x₁,x₂) to (${width}−x₂,${width}−x₁)` : ''}. {box ? `The retained object covers ${area} pixels; preserve its label with this box.` : 'The intersection has zero area. Remove the box and its corresponding label together.'}</p>
    <button type="button" onClick={()=>{setLeft(2);setWidth(3);setFlip(false);}}>Reset crop and direction</button>
  </NeuralLab>;
}
