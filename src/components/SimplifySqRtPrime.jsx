import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import './SimplifySqRtPrime.css';
import FlexiWave from '../assets/All Flexi Poses/PNG/Flexi_Wave.png';
import FlexiTelescope from '../assets/All Flexi Poses/PNG/Flexi_Telescope.png';
import FlexiWoah from '../assets/All Flexi Poses/PNG/Flexi_Woah.png';
import FlexiStars from '../assets/All Flexi Poses/PNG/Flexi_Stars.png';
import FlexiWizard from '../assets/All Flexi Poses/GIF/Flexi_Wizard-large.gif';

const SIMPLIFIABLE_NUMBERS = [4, 8, 9, 12, 16, 18, 20, 24, 25, 27, 28, 32, 36, 40, 44, 45, 48, 49, 50, 52, 54, 56, 60, 63, 72, 75, 76, 80, 81, 84, 88, 90, 96, 98, 100, 104, 108, 112, 116, 117, 120, 121, 124, 125, 126, 132, 135, 136, 140, 147, 148, 150, 152, 153, 156, 160, 162, 164, 168, 169, 171, 172, 176, 180, 184, 188, 189, 196, 198, 200];

const getRandomNumber = (exclude) => {
	let idx, num;
	do {
		idx = Math.floor(Math.random() * SIMPLIFIABLE_NUMBERS.length);
		num = SIMPLIFIABLE_NUMBERS[idx];
	} while (num === exclude && SIMPLIFIABLE_NUMBERS.length > 1);
	return num;
};

// Helper to get prime factors as an array
function getPrimeFactors(n) {
	const factors = [];
	let d = 2;
	while (n > 1) {
		while (n % d === 0) {
			factors.push(d);
			n /= d;
		}
		d++;
		if (d * d > n && n > 1) {
			factors.push(n);
			break;
		}
	}
	return factors;
}

// Helper for SVG radical rendering (shared by both steps)
function renderSVGStepRadical({ coefficient, numbers, highlightable = false, highlightedIndices = [], handleNumberClick = null, visibleIndices = [], animatingPairIndices = [], combineAnim = null, factors = [], color = '#000', radicalColor = '#000', disabled = false, coefficientSlideAnim = false, coefficientFadeOutAnim = false, showProductAnim = false, radicalCombineAnim = null, radicalFadeOut = false, radicalShowProduct = false, noSimplificationNeeded = false, radicalAnimationStep = 0, numberIndices = [] }) {
  // Defensive: ensure coefficient is always an array
  let coeffArray = [];
  if (Array.isArray(coefficient)) {
    coeffArray = coefficient;
  } else if (typeof coefficient === 'number' && coefficient > 1) {
    coeffArray = [coefficient];
  } else if (coefficient == null) {
    coeffArray = [];
  }
  
  // Build expression array
  const expression = [];
  if (numbers.length > 0) {
    numbers.forEach((value, idx) => {
      expression.push({ type: 'number', value, id: idx });
      if (idx < numbers.length - 1) {
        expression.push({ type: 'symbol', value: '×', id: `x-${idx}` });
      }
    });
  }
  const numberFontSize = 30; // new font size for numbers under the radical
  const numberWidth = 30; // adjust width per number or symbol to match font size
  const radicalBuffer = 0; // no extra left buffer
  const radicalHeight = 150; // SVG height
  const verticalOffset = 20; // move content lower in the box
  const radicalYOffset = -10 + verticalOffset; // move numbers up by another 5px
  const radicalTop = 50 + verticalOffset; // radical bar position
  const radicalBottom = radicalHeight - 10;
  const radicalHook = radicalTop + 25;
  const radicalHookEnd = radicalTop + 45;
  const radicalBarY = radicalTop;
  
  // Use green color for everything when no simplification is needed
  const finalColor = noSimplificationNeeded ? '#008545' : color;
  const finalRadicalColor = noSimplificationNeeded ? '#008545' : radicalColor;
  // Dynamically adjust radicalStart for single, double, triple digit numbers
  let radicalStart;
  if (numbers.length === 0) {
    // No numbers under radical, use default position
    radicalStart = 38 + radicalBuffer;
  } else if (numbers.length === 1) {
    // Use measureTextWidth to get the width of the number
    const numStr = String(numbers[0]);
    const numWidth = measureTextWidth(numStr, numberFontSize);
    // For single/double/triple digit, align left edge of number with radical hook
    radicalStart = Math.max(18, 38 - (numWidth / 2) + 10); // 38 is default, 18 is min, 10 is fudge factor
  } else {
    radicalStart = 38 + radicalBuffer;
  }
  // Now calculate radicalEnd after all dependencies are defined
  const radicalEnd = numbers.length > 0 ? radicalStart + (expression.length * numberWidth) : radicalStart + 30; // Minimum width when no numbers
  const radicalBarXStart = radicalStart - 14;
  const radicalBarXEnd = radicalEnd + 10;
  // Calculate the width for the radical and coefficients
  const coeffFontSize = numberFontSize;
  let coeffX = 0;
  coeffArray.forEach((n, i) => {
    const nStr = String(n);
    coeffX += nStr.length * coeffFontSize * 0.6;
    if (i < coeffArray.length - 1) {
      coeffX += coeffFontSize * 0.5;
    }
  });
  const radicalOffset = coeffArray.length > 0 ? coeffX + 8 : 0;
  // Calculate the total SVG width
  const svgWidth = 480;
  // Calculate the content width (radical + numbers + symbols)
  const contentWidth = radicalOffset + (expression.length * numberWidth) + radicalStart;
  // Calculate the offset to center the content
  const centerOffset = Math.max(0, (svgWidth - contentWidth) / 2);
  

  // Set the viewBox to match the new height
  const viewBox = `0 0 ${svgWidth} ${radicalHeight}`;
  // Render coefficient as array or single value
  // Helper to measure text width for proper spacing
  function measureTextWidth(text, fontSize = coeffFontSize, fontFamily = 'Proxima Nova, Arial, sans-serif', fontWeight = '400') {
    if (typeof document === 'undefined') return text.length * fontSize * 0.6; // fallback for SSR
    const canvas = measureTextWidth._canvas || (measureTextWidth._canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return context.measureText(text).width;
  }

  // Calculate x positions for each coefficient and symbol
  let coeffElements = [];
  let coeffXLocal = 0;
  

        // Coefficient rendering with animation
  if (coefficientSlideAnim && coeffArray.length === 2) {
    // Handle coefficient animation - left number slides into right number
    const [leftNum, rightNum] = coeffArray;
    const leftX = coeffXLocal;
    const rightX = coeffXLocal + numberWidth + numberWidth; // Skip the × symbol
    
    // Left coefficient slides right to overlap with right coefficient
    coeffElements.push(
      <text
        key="coeff-left"
        x={leftX + numberWidth / 2}
        y={radicalTop + radicalYOffset + 24}
        textAnchor="middle"
        fontFamily="Proxima Nova"
        fontSize={numberFontSize}
        fontWeight="400"
        fill={finalColor}
        style={{
          transform: 'translateX(0px)',
          opacity: coefficientFadeOutAnim ? 0 : 1,
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
          '--slide-distance': `${rightX - leftX}px`
        }}
        className={coefficientSlideAnim ? 'coefficient-slide-animation' : ''}
      >
        {leftNum}
      </text>
    );
    
    // Right coefficient stays in place
    coeffElements.push(
      <text
        key="coeff-right"
        x={rightX + numberWidth / 2}
        y={radicalTop + radicalYOffset + 24}
        textAnchor="middle"
        fontFamily="Proxima Nova"
        fontSize={numberFontSize}
        fontWeight="400"
        fill={finalColor}
        style={{
          opacity: coefficientFadeOutAnim ? 0 : 1,
          transition: 'opacity 0.4s ease'
        }}
      >
        {rightNum}
      </text>
    );
    
    // Show product after fade out
    if (showProductAnim) {
      const product = leftNum * rightNum;
      coeffElements.push(
        <text
          key="coeff-product"
          x={rightX + numberWidth / 2}
          y={radicalTop + radicalYOffset + 24}
          textAnchor="middle"
          fontFamily="Proxima Nova"
          fontSize={numberFontSize}
          fontWeight="400"
          fill="#008545"
          style={{
            opacity: 1,
            transition: 'opacity 0.4s ease'
          }}
        >
          {product}
        </text>
      );
    }
    
    // Hide × symbol during animation
    coeffElements.push(
      <text
        key="coeff-times"
        x={coeffXLocal + numberWidth + numberWidth / 2}
        y={radicalTop + radicalYOffset + 24}
        textAnchor="middle"
        fontFamily="Proxima Nova"
        fontSize={numberFontSize - 6}
        fontWeight="400"
        fill={finalColor}
        style={{
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        ×
      </text>
    );
  } else {
    // Normal coefficient rendering (no animation)
    coeffArray.forEach((n, i) => {
      const nStr = String(n);
      const nWidth = numberWidth; // use same width as numbers under radical
      const textColor = finalColor;
      coeffElements.push(
        <text
          key={`coeff-${i}`}
          x={coeffXLocal + nWidth / 2}
          y={radicalTop + radicalYOffset + 24}
          textAnchor="middle"
          fontFamily="Proxima Nova"
          fontSize={numberFontSize}
          fontWeight="400"
          fill={textColor}
        >
          {n}
        </text>
      );
      coeffXLocal += nWidth;
      if (i < coeffArray.length - 1) {
        const timesWidth = numberWidth; // use same width for ×
        coeffElements.push(
          <text
            key={`coeff-times-${i}`}
            x={coeffXLocal + timesWidth / 2}
            y={radicalTop + radicalYOffset + 24}
            textAnchor="middle"
            fontFamily="Proxima Nova"
            fontSize={numberFontSize - 6}
            fontWeight="400"
            fill={textColor}
          >
            ×
          </text>
        );
        coeffXLocal += timesWidth;
      }
    });
  }
  // Calculate the total width of all coefficients (coefficient)
  let totalCoeffWidth = 0;
  coeffArray.forEach((n, i) => {
    const nStr = String(n);
    const nWidth = measureTextWidth(nStr, coeffFontSize);
    totalCoeffWidth += nWidth;
    if (i < coeffArray.length - 1) {
      const timesWidth = measureTextWidth('×', coeffFontSize - 6);
      totalCoeffWidth += timesWidth + 4;
    }
  });
  // During moveLeft and radicalShift phases, add the width of the new coefficient for the animation
  let radicalShiftX = totalCoeffWidth;
  let radicalShiftClass = '';
  if (combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'radicalShift' || combineAnim.phase === 'dropDown')) {
    let radicalShiftValid = false;
    let newCoeffWidth = 0;
    if (
      typeof combineAnim.survivor === 'number' &&
      combineAnim.survivor >= 0 &&
      combineAnim.survivor < factors.length
    ) {
      const newCoeff = factors[combineAnim.survivor];
      newCoeffWidth = measureTextWidth(String(newCoeff), coeffFontSize);
      radicalShiftValid = true;
    }
    // Only apply radical shift during radicalShift and dropDown phases
    if (combineAnim.phase === 'radicalShift' || combineAnim.phase === 'dropDown') {
      radicalShiftX += radicalShiftValid ? newCoeffWidth + 12 : 0; // 12px buffer
    }
  }
  if (radicalShiftX > 0) radicalShiftClass = 'radical-shift-right';

  // Add a 'number-settle-into-place' class to all numbers and coefficients during the 'settle' phase
  let settleClass = '';
  if (combineAnim && combineAnim.phase === 'settle') {
    settleClass = 'number-settle-into-place';
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
      <svg
        width={svgWidth}
        height={radicalHeight}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: 'translateZ(0)'
        }}
      >
        {/* Coefficient numbers to the left of the radical, spaced dynamically */}
        {/* Center the radical and numbers group, including coefficients */}
        {(() => {
          // Calculate extra space if more than one coefficient
          const extraCoeffSpace = coeffArray.length > 1 ? (coeffArray.length - 1) * 10 : 0;
          // --- Animate coefficient shift during radicalShift phase ---
          let coeffShiftX = 0;
          let coeffShiftClass = '';
          if (combineAnim && combineAnim.phase === 'dropDown') {
            // Keep the coefficients shifted left during dropDown (combines radical shift and drop down)
            let coeffsSoFar = Array.isArray(coeffArray) ? [...coeffArray] : [];
            if (
              typeof combineAnim.survivor === 'number' &&
              combineAnim.survivor >= 0 &&
              combineAnim.survivor < factors.length
            ) {
              const newCoeff = factors[combineAnim.survivor];
              coeffsSoFar.push(newCoeff);
            }
            let totalNewCoeffWidth = 0;
            coeffsSoFar.forEach(n => {
              totalNewCoeffWidth += measureTextWidth(String(n), coeffFontSize) + 12;
            });
            coeffShiftClass = 'coeff-shift-left';
            coeffShiftX = totalNewCoeffWidth;
          }
          
          return (
            <g transform={`translate(${centerOffset},0)`}>
              {/* Move coefficients left so they don't overlap the radical, with extra space for multiple coefficients */}
              <g
                transform={`translate(${-24 - extraCoeffSpace},0)`}
                className={`${coeffShiftClass} ${settleClass}`}
                style={coeffShiftX ? { '--coeff-shift-x': `-${coeffShiftX}px` } : {}}
              >
        {coeffElements}
              </g>
        {/* Radical and numbers, shifted right if coefficient present */}
        {/* Calculate radical shift for new coefficient */}
        {(() => {
          // Only render radical if there are numbers under it
          if (numbers.length === 0) {
            return null;
          }
          
          // Calculate the total width of all coefficients (coefficient)
                // REVERT: Remove radicalOffset from the translate below so radical is not shifted by coefficient width
                // let totalCoeffWidth = 0;
                // coeffArray.forEach((n, i) => {
                //   const nStr = String(n);
                //   const nWidth = measureTextWidth(nStr, coeffFontSize);
                //   totalCoeffWidth += nWidth;
                //   if (i < coeffArray.length - 1) {
                //     const timesWidth = measureTextWidth('×', coeffFontSize - 6);
                //     totalCoeffWidth += timesWidth + 4;
                //   }
                // });
                let radicalShiftX = totalCoeffWidth;
                let radicalShiftClass = '';
                if (combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'dropDown')) {
            let radicalShiftValid = false;
            let newCoeffWidth = 0;
            if (
              typeof combineAnim.survivor === 'number' &&
              combineAnim.survivor >= 0 &&
              combineAnim.survivor < factors.length
            ) {
              const newCoeff = factors[combineAnim.survivor];
              newCoeffWidth = measureTextWidth(String(newCoeff), coeffFontSize);
              radicalShiftValid = true;
            }
                  // Apply radical shift during dropDown phase (combines radical shift and drop down)
                  if (combineAnim.phase === 'dropDown') {
            radicalShiftX += radicalShiftValid ? newCoeffWidth + 12 : 0; // 12px buffer
                  }
          }
          if (radicalShiftX > 0) radicalShiftClass = 'radical-shift-right';
          
          return (
                  <>
                    {/* Render survivor outside the radical group during moveLeft and dropDown phases */}
                    {combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'dropDown') && (() => {
                      const survivorItem = expression.find(item => item.type === 'number' && visibleIndices[item.id] === combineAnim.survivor);
                      if (!survivorItem) return null; // GUARD: Prevent crash if survivorItem is not found
                      
                      // Calculate the final coefficient position for all phases
                      let coeffX = 0;
                      coeffArray.forEach((n, i) => {
                        const nStr = String(n);
                        const nWidth = measureTextWidth(nStr, coeffFontSize);
                        coeffX += nWidth;
                        if (i < coeffArray.length - 1) {
                          const timesWidth = measureTextWidth('×', coeffFontSize - 6);
                          coeffX += timesWidth + 4;
                        }
                      });
                      // Add the width of the new coefficient being added
                      const newCoeff = factors[combineAnim.survivor];
                      const newCoeffWidth = measureTextWidth(String(newCoeff), coeffFontSize);
                      coeffX += newCoeffWidth;
                      
                      // Calculate the final target position (coefficient position)
                      const finalTargetX = -(0 - coeffX + 28);
                      
                      // For moveLeft phase, start from current position and animate to final position
                      // For dropDown phase, stay at the final position
                      let survivorX, targetX;
                      // Calculate survivor's position based on its original index in factors array
                      // This ensures consistent positioning regardless of visibleIndices changes
                      survivorX = radicalStart + (combineAnim.survivor * numberWidth);
                      // Calculate the width of all current coefficients (coefficient)
                      let coeffs = Array.isArray(coeffArray) ? coeffArray : [];
                      let finalCoeffX = 0;
                      coeffs.forEach((n, i) => {
                        const nStr = String(n);
                        finalCoeffX += measureTextWidth(nStr, coeffFontSize);
                        if (i < coeffs.length - 1) {
                          finalCoeffX += measureTextWidth('×', coeffFontSize - 6) + 4;
                        }
                      });
                      if (coeffs.length > 0) {
                        finalCoeffX += measureTextWidth('×', coeffFontSize - 6) + 4;
                      }
                      // Calculate the target position
                      // (move from current radical position to end of coefficient list)
                      targetX = -(survivorX - finalCoeffX);
                      
                      const numStr = String(survivorItem.value);
                      const rectWidth = Math.max(20, numStr.length * 22);
                      let combineClass = '';
                      let combineStyle = { '--move-left-x': `${targetX}px` };
                      
                      if (combineAnim.phase === 'moveLeft') {
                        combineClass = 'number-move-left-after-combine';
                      } else if (combineAnim.phase === 'dropDown') {
                        combineClass = 'number-move-down-after-left';
                      }
                      
                      return (
                        <g 
                          key={`survivor-${combineAnim.survivor}`} 
                          style={{ ...combineStyle }} 
                          className={combineClass}
                          transform={`translate(0,0)`}
                        >
                          <rect
                            x={survivorX}
                            y={radicalTop + radicalYOffset}
                            width={rectWidth}
                            height="32"
                            fill="transparent"
                          />
                          <text
                            x={survivorX + rectWidth / 2}
                            y={radicalTop + radicalYOffset + 24}
                            textAnchor="middle"
                            fontFamily="Proxima Nova"
                            fontSize={numberFontSize}
                            fontWeight="400"
                            fill={color}
                            style={{ pointerEvents: 'none' }}
                          >
                            {survivorItem.value}
                          </text>
                        </g>
                      );
                    })()}
                    

                    
                    {/* Radical group - excludes survivor during radicalShift and dropDown phases */}
                    <g
                      // REVERT: Remove radicalOffset from the translate below
                      transform={`translate(0,0)`}
              className={radicalShiftClass}
              style={{ '--radical-shift-x': `${radicalShiftX}px` }}
            >
              <polyline
                points={`10,${radicalHook} 18,${radicalHookEnd} 32,${radicalTop} ${radicalBarXEnd},${radicalBarY}`}
                stroke={finalRadicalColor}
                strokeWidth="4"
                fill="none"
                strokeLinejoin="round"
                style={{ 
                  transform: 'translateZ(0)'
                }}
              />
              {expression.length > 0 && expression.map((item, index) => {
                let xPosition = radicalStart + (index * numberWidth);
                if (item.type === 'number') {
                  const factorIdx = visibleIndices[index / 2 | 0];
                  const isHighlighted = highlightable && highlightedIndices.includes(factorIdx);
                  
                  console.log('Rendering - index:', index, 'item:', item, 'factorIdx:', factorIdx);
                          
                  // Skip rendering survivor during moveLeft and dropDown phases (it's rendered separately)
                  // Also skip rendering the non-survivor number during moveLeft and dropDown phases (after combine animation ends)
                  if (combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'dropDown') && factorIdx === combineAnim.survivor) {
                    return null;
                  }
                  if (combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'dropDown') && combineAnim.indices.includes(factorIdx) && factorIdx !== combineAnim.survivor) {
                    return null;
                  }
                          
                  // Combine animation logic (for prime factorization step)
                  let combineClass = '';
                  let combineStyle = {};
                  if (combineAnim && combineAnim.indices.includes(factorIdx)) {
                    const [i1, i2] = combineAnim.indices;
                    const survivor = combineAnim.survivor;
                    if (combineAnim.phase === 'up') {
                      combineClass = 'number-move-up-combine';
                    } else if (combineAnim.phase === 'combine') {
                      if (factorIdx !== survivor) {
                        // Only the rightmost slides left to the leftmost
                        if (factorIdx === Math.max(i1, i2)) {
                          const survivorIdx = expression.findIndex(e => e.type === 'number' && visibleIndices[e.id] === survivor);
                          const slideX = (survivorIdx - index) * numberWidth;
                          combineClass = 'number-slide-to-combine-up';
                          combineStyle = { '--combine-x': `${slideX}px` };
                        } else {
                          combineClass = 'number-move-up-combine';
                        }
                      } else {
                        combineClass = 'number-move-up-combine';
                      }
                    } else if (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'radicalShift' || combineAnim.phase === 'dropDown' || combineAnim.phase === 'settle') {
                      // Handle survivor during all phases after combine
                      if (factorIdx === survivor) {
                        if (combineAnim.phase === 'moveLeft') {
                          combineClass = 'number-move-left-after-combine';
                          // Calculate the slide distance from combine phase
                          const survivorIdx = expression.findIndex(e => e.type === 'number' && visibleIndices[e.id] === survivor);
                          const rightmostIdx = expression.findIndex(e => e.type === 'number' && visibleIndices[e.id] === Math.max(i1, i2));
                          const slideX = (rightmostIdx - survivorIdx) * numberWidth;
                          combineStyle = { 
                            '--combine-x': `${slideX}px`,
                            '--move-left-x': `${slideX - 90}px`
                          };
                        } else if (combineAnim.phase === 'dropDown') {
                          combineClass = 'number-move-down-after-left';
                          const survivorIdx = expression.findIndex(e => e.type === 'number' && visibleIndices[e.id] === survivor);
                          const rightmostIdx = expression.findIndex(e => e.type === 'number' && visibleIndices[e.id] === Math.max(i1, i2));
                          const slideX = (rightmostIdx - survivorIdx) * numberWidth;
                          combineStyle = { 
                            '--combine-x': `${slideX}px`,
                            '--move-left-x': `${slideX - 90}px`
                          };
                        } else {
                          combineStyle = { display: 'none' };
                        }
                      } else {
                        combineStyle = { display: 'none' };
                      }
                    }
                  }
                  
                  // Radical simplification animation logic (for simplify step)
                  if (radicalCombineAnim && radicalCombineAnim.indices.includes(index)) {
                    const survivor = radicalCombineAnim.survivor;
                    
                    console.log('Radical animation - processing index:', index, 'survivor:', survivor, 'step:', radicalAnimationStep);
                    
                    if (radicalCombineAnim.phase === 'combine') {
                      if (index !== survivor) {
                        // Check if this number should be animated based on current step
                        const numberPosition = numberIndices.indexOf(index);
                        const shouldAnimate = numberPosition <= radicalAnimationStep;
                        
                        if (shouldAnimate) {
                          // All numbers to the right of the survivor slide left to the leftmost position
                          const slideX = (survivor - index) * numberWidth;
                          combineClass = 'number-slide-to-combine';
                          combineStyle = { '--combine-x': `${slideX}px` };
                          console.log('Radical animation - sliding index:', index, 'slideX:', slideX, 'step:', radicalAnimationStep);
                        } else {
                          // Keep this number in its original position for now
                          combineClass = '';
                          combineStyle = {};
                          console.log('Radical animation - keeping index:', index, 'in original position');
                        }
                      } else {
                        combineClass = 'number-move-up-combine-simplify';
                        console.log('Radical animation - survivor moving up:', index);
                      }
                    }
                  }
                  
                  // Apply fade out for radical numbers
                  if (radicalFadeOut) {
                    combineStyle = { ...combineStyle, opacity: 0, transition: 'opacity 0.4s ease' };
                  }
                  
                  // Show radical product after fade out
                  if (radicalShowProduct) {
                    // Hide the original numbers and show the product
                    combineStyle = { ...combineStyle, display: 'none' };
                  }
                  
                  // Calculate rect width based on number of digits
                  const numStr = String(item.value);
                  const rectWidth = Math.max(20, numStr.length * 22); // 22px per digit, min 20px
                  
                  return (
                    <g key={item.id} style={{ cursor: highlightable ? 'pointer' : 'default', ...combineStyle }} className={`${combineClass} ${settleClass}`}>
                      <rect
                        x={xPosition}
                        y={radicalTop + radicalYOffset - 2}
                        width={rectWidth}
                        height="32"
                        rx="4"
                        fill={isHighlighted ? '#008545' : 'transparent'}
                        onClick={highlightable && handleNumberClick ? () => handleNumberClick(factorIdx) : undefined}
                      />
                      <text
                        x={xPosition + rectWidth / 2}
                        y={radicalTop + radicalYOffset + 24}
                        textAnchor="middle"
                        fontFamily="Proxima Nova"
                        fontSize={numberFontSize}
                        fontWeight="400"
                        fill={isHighlighted ? '#ffffff' : finalColor}
                        style={{ 
                          pointerEvents: 'none',
                          transform: 'translateZ(0)'
                        }}
                      >
                        {item.value}
                      </text>
                    </g>
                  );
                } else if (item.type === 'symbol') {
                  // Hide multiplication symbols when radical product is shown
                  if (radicalShowProduct) {
                    return null;
                  }
                  
                  return (
                    <text
                      key={item.id}
                      x={xPosition + 10}
                      y={radicalTop + radicalYOffset + 24}
                      textAnchor="middle"
                      fontFamily="Proxima Nova"
                      fontSize={numberFontSize - 6}
                      fontWeight="400"
                      fill={finalColor}
                      style={{
                        transform: 'translateZ(0)'
                      }}
                    >
                      {item.value}
                    </text>
                  );
                }
                return null;
              })}
              
              {/* Render radical product after fade out */}
              {radicalShowProduct && numbers.length > 0 && (() => {
                // Calculate the product of all numbers under the radical
                const product = numbers.reduce((acc, num) => acc * num, 1);
                const productStr = String(product);
                const productWidth = Math.max(20, productStr.length * 22);
                const productX = radicalStart + (productWidth / 2);
                
                return (
                  <text
                    key="radical-product"
                    x={productX}
                    y={radicalTop + radicalYOffset + 24}
                    textAnchor="middle"
                    fontFamily="Proxima Nova"
                    fontSize={numberFontSize}
                    fontWeight="400"
                    fill="#008545"
                    style={{
                      opacity: 0,
                      animation: 'radicalProductFadeIn 0.4s ease forwards'
                    }}
                  >
                    {product}
                  </text>
                );
              })()}
                    </g>
                  </>
                );
              })()}
            </g>
          );
        })()}
      </svg>
    </span>
  );
}



// Component for individual clickable numbers
const ClickableNumber = ({ number, index, isHighlighted, onClick, isRemoved, disabled }) => (
	<span
		className={`clickable-number ${isHighlighted ? 'highlighted' : ''} ${isRemoved ? 'removed' : ''} ${disabled ? 'disabled' : ''}`}
		onClick={disabled || isRemoved ? undefined : () => onClick(index)}
		style={{
			pointerEvents: disabled || isRemoved ? 'none' : 'auto',
			opacity: isRemoved ? 0.3 : 1,
			fontFamily: 'Proxima Nova, Arial, sans-serif',
			fontWeight: 400,
			fontSize: 38,
			color: '#000',
			lineHeight: '1.1',
			verticalAlign: 'middle',
			display: 'inline-block',
			minWidth: '32px',
			textAlign: 'center',
		}}
	>
		{number}
	</span>
);

const SimplifySqRtPrime = () => {
	const [number, setNumber] = useState(null);
	const [showFactors, setShowFactors] = useState(false);
	const [animate, setAnimate] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);
	const [fadeOutFirstStep, setFadeOutFirstStep] = useState(false);
	const [highlightedIndices, setHighlightedIndices] = useState([]);
	const [removedIndices, setRemovedIndices] = useState([]);
	const [outsideNumbers, setOutsideNumbers] = useState([]);
	const [history, setHistory] = useState([]);
	const [telescopeLoaded, setTelescopeLoaded] = useState(false);
	const lastMovedPair = useRef([]);
	const [showSimplified, setShowSimplified] = useState(false);
	const [animatingPairIndices, setAnimatingPairIndices] = useState([]); // NEW: indices of pair being animated
	// --- Combine Animation State ---
	const [combineAnim, setCombineAnim] = useState(null); // { indices: [i1, i2], survivor, phase: 'up'|'combine'|'moveLeft'|null }
	
	// --- Simplify Step Animation State ---
	const [coefficientSlideAnim, setCoefficientSlideAnim] = useState(false); // Coefficient overlap animation
	const [coefficientFadeOutAnim, setCoefficientFadeOutAnim] = useState(false); // Coefficient fade out
	const [showProductAnim, setShowProductAnim] = useState(false); // Show coefficient product
	const [radicalCombineAnim, setRadicalCombineAnim] = useState(null); // Radical numbers overlap animation
	const [radicalFadeOut, setRadicalFadeOut] = useState(false); // Radical numbers fade out
	const [radicalShowProduct, setRadicalShowProduct] = useState(false); // Show radical product
	const [noSimplificationNeeded, setNoSimplificationNeeded] = useState(false); // Already simplified
	const [radicalAnimationStep, setRadicalAnimationStep] = useState(0); // Track animation step



	useEffect(() => {
		setNumber(120); // Start with 120 for testing
		setRemovedIndices([]);
		setOutsideNumbers([]);
	}, []);

	let factors = number ? getPrimeFactors(number) : [];

	// --- Reference-style SVG radical logic ---
	// Build the expression array for SVG rendering
	const visibleIndices = factors.map((_, i) => i).filter(i => !removedIndices.includes(i));
	const expression = [];
	visibleIndices.forEach((i, idx) => {
	  expression.push({ type: 'number', value: factors[i], id: i });
	  if (idx < visibleIndices.length - 1) {
	    expression.push({ type: 'symbol', value: '×', id: `x-${i}` });
	  }
	});
	// Highlighted numbers as an object for fast lookup
	const highlightedNumbers = {};
	highlightedIndices.forEach(i => { highlightedNumbers[i] = true; });
	// SVG layout constants
	const numberWidth = 20;
	const radicalStart = 28;
	// Hover logic (optional, for demo parity)

	// --- End reference logic ---

	const handleRandomClick = () => {
		// Complete any pending animations and reset to very beginning
		
		// Clear any pending timeouts by setting a flag
		window.randomClicked = true;
		
		// If there's an active combine animation, complete it immediately
		if (combineAnim) {
			// Complete the animation by updating state as if it finished
			if (combineAnim.indices && combineAnim.indices.length === 2) {
				const [firstIdx, secondIdx] = combineAnim.indices;
				const survivor = combineAnim.survivor;
				setRemovedIndices(prev => [...prev, firstIdx, secondIdx]);
				setOutsideNumbers(prev => [...prev, factors[survivor]]);
			}
		}
		
		// If we're in the middle of a next animation, complete it
		if (animate) {
			setShowFactors(true);
			setAnimate(false);
			setFadeOut(false);
			setFadeOutFirstStep(false);
		}
		
		// Reset all state to beginning
		setNumber((prev) => getRandomNumber(prev));
		setShowFactors(false);
		setShowSimplified(false);
		setAnimate(false);
		setFadeOut(false);
		setFadeOutFirstStep(false);
		setHighlightedIndices([]);
		setRemovedIndices([]);
		setOutsideNumbers([]);
		setHistory([]);
		setCombineAnim(null);
		setAnimatingPairIndices([]);
		lastMovedPair.current = [];
		setTelescopeLoaded(false);
		// Reset simplify step animation states
		setCoefficientSlideAnim(false);
		setCoefficientFadeOutAnim(false);
		setShowProductAnim(false);
		setRadicalCombineAnim(null);
		setRadicalFadeOut(false);
		setRadicalShowProduct(false);
		setNoSimplificationNeeded(false);
		setRadicalAnimationStep(0);

		
		// Clear the flag after a short delay
		setTimeout(() => {
			window.randomClicked = false;
		}, 100);
	};

	const handleNextClick = () => {
		// If we're at the simplified step, stay there
		if (showSimplified) {
			return;
		}
		
		// If we're at the prime factorization step and no pairs are available, go to simplified step
		if (showFactors && countAvailablePairs() === 0) {
			setShowSimplified(true);
			// Start coefficient animation after a short delay
			setTimeout(() => {
				if (window.randomClicked) return;
				startCoefficientAnimation();
			}, 500);
			return;
		}
		
		// If there are any outside numbers or removed indices, we're in the middle of something
		// Force a complete reset and start fresh
		if (outsideNumbers.length > 0 || removedIndices.length > 0 || combineAnim) {
			setShowFactors(false);
			setShowSimplified(false);
			setAnimate(false);
			setFadeOut(false);
			setFadeOutFirstStep(false);
			setHighlightedIndices([]);
			setRemovedIndices([]);
			setOutsideNumbers([]);
			setHistory([]);
			setCombineAnim(null);
			setAnimatingPairIndices([]);
			lastMovedPair.current = [];
			setTelescopeLoaded(false);
			// Reset simplify step animation states
			setCoefficientSlideAnim(false);
			setCoefficientFadeOutAnim(false);
			setShowProductAnim(false);
			setRadicalCombineAnim(null);
			setRadicalFadeOut(false);
			setRadicalShowProduct(false);
			setNoSimplificationNeeded(false);
			
			// Then go to prime factorization step
			setTimeout(() => {
				// Check if random was clicked during animation
				if (window.randomClicked) {
					return;
				}
				
				setAnimate(true);
				setFadeOut(true);
				setFadeOutFirstStep(true);
				setTelescopeLoaded(false);
				setTimeout(() => {
					// Check if random was clicked during animation
					if (window.randomClicked) {
						return;
					}
					
					setShowFactors(true);
					setFadeOut(false);
					setFadeOutFirstStep(false);
					setAnimate(false);
					setShowSimplified(false);
				}, 350);
			}, 100);
			return;
		}
		
		// Otherwise, go to the prime factorization step (from the initial square root view)
		setAnimate(true);
		setFadeOut(true);
		setFadeOutFirstStep(true);
		setTelescopeLoaded(false);
		setTimeout(() => {
			// Check if random was clicked during animation
			if (window.randomClicked) {
				return;
			}
			
			setShowFactors(true);
			setFadeOut(false);
			setFadeOutFirstStep(false);
			setAnimate(false);
			setShowSimplified(false);
		}, 350);
	};

	const handleBackClick = () => {
		if (showSimplified) {
			// If we're at the simplified step, go back to prime factorization step
			setShowSimplified(false);
			// Reset all simplify step animation states so they can play again
			setCoefficientSlideAnim(false);
			setCoefficientFadeOutAnim(false);
			setShowProductAnim(false);
			setRadicalCombineAnim(null);
			setRadicalFadeOut(false);
			setRadicalShowProduct(false);
			setNoSimplificationNeeded(false);
		} else if (showFactors) {
			// If we're at the prime factorization step, go back to beginning
			setShowFactors(false);
			setAnimate(false);
			setFadeOut(false);
			setFadeOutFirstStep(false);
			setHighlightedIndices([]);
			setRemovedIndices([]);
			setOutsideNumbers([]);
			setHistory([]);
		}
	};

	const handleNumberClick = (index) => {
		if (removedIndices.includes(index) || animatingPairIndices.length > 0) return; // Prevent click during animation
		setHighlightedIndices(prev => {
			if (prev.includes(index)) {
				lastMovedPair.current = [];
				return prev.filter(i => i !== index);
			}
			if (prev.length === 1) {
				const firstIdx = prev[0];
				if (
					factors[firstIdx] === factors[index] &&
					firstIdx !== index &&
					!removedIndices.includes(firstIdx) &&
					!removedIndices.includes(index)
				) {
					const pairKey = [firstIdx, index].sort().join('-');
					if (lastMovedPair.current[0] === pairKey) {
						return [];
					}
					lastMovedPair.current[0] = pairKey;
					// --- Combine Animation Sequence ---
					// Pick survivor (leftmost by default)
					const survivor = Math.min(firstIdx, index);
					
					// Calculate base positions
					const radicalStart = 38;
					const radicalTop = 80;
					const numberWidth = 30;
					
					setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'up' });
					
					setTimeout(() => {
						if (window.randomClicked) return;
						setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'combine' });
						
						setTimeout(() => {
							if (window.randomClicked) return;
							setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'moveLeft' });
							
							setTimeout(() => {
								if (window.randomClicked) return;
								setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'dropDown' });
								
								setTimeout(() => {
									if (window.randomClicked) return;
									setRemovedIndices(prev => [...prev, firstIdx, index]);
									setOutsideNumbers(prev => [...prev, factors[survivor]]);
									setCombineAnim(null);
								}, 400);
							}, 400);
						}, 500);
					}, 400);
					return [];
				}
			}
			if (prev.length >= 2) {
				lastMovedPair.current = [];
				return [index];
			}
			lastMovedPair.current = [];
			return [...prev, index];
		});
	};

	const renderFactorString = () => {
		const visibleIndices = factors.map((_, i) => i).filter(i => !removedIndices.includes(i));
		if (visibleIndices.length === 0) return '';
		const disableNumbers = showFactors && countAvailablePairs() === 0;
		return visibleIndices.map((i, idx) => (
			<React.Fragment key={i}>
				<ClickableNumber
					number={factors[i]}
					index={i}
					isHighlighted={highlightedIndices.includes(i)}
					onClick={handleNumberClick}
					isRemoved={removedIndices.includes(i)}
					disabled={disableNumbers}
				/>
				{idx < visibleIndices.length - 1 && <span className="times-symbol"> × </span>}
			</React.Fragment>
		));
	};

	const renderOutsideNumbers = () => {
		if (outsideNumbers.length === 0) return null;
		return (
			<span className="outside-radical" style={{ fontFamily: 'Proxima Nova, Arial, sans-serif', fontWeight: 400, fontSize: 38, color: '#000', lineHeight: '1.1', verticalAlign: 'middle', display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>
				{outsideNumbers.map((value, idx) => (
					<React.Fragment key={idx}>
						{value}
						{idx < outsideNumbers.length - 1 && <span className="times-symbol" style={{ fontWeight: 400, fontSize: 32, color: '#666', margin: '0 4px' }}> × </span>}
					</React.Fragment>
				))}
			</span>
		);
	};





	const startCoefficientAnimation = () => {
		// Use the raw outsideNumbers instead of processing them
		const coefficients = outsideNumbers;
		const numbersUnderRadical = visibleIndices.map(i => factors[i]);
		
		// Check if already simplified (1 coefficient and 1 number under radical, or just 1 number under radical)
		const isAlreadySimplified = (coefficients.length === 1 && numbersUnderRadical.length === 1) || // One coefficient and one number under radical
									(coefficients.length === 0 && numbersUnderRadical.length === 1) ||   // Just one number under radical
									(coefficients.length === 1 && numbersUnderRadical.length === 0) ||   // Just one coefficient
									(coefficients.length === 0 && numbersUnderRadical.length === 0);   // No coefficients and no radical numbers
		
		if (isAlreadySimplified) {
			setNoSimplificationNeeded(true);
			return;
		}
		
		// If there are coefficients that need to simplify (2 or more coefficients)
		if (coefficients.length >= 2) {
			// Start coefficient overlap animation
			setCoefficientSlideAnim(true);
			
			// After overlap, fade out coefficients
			setTimeout(() => {
				if (window.randomClicked) return;
				setCoefficientFadeOutAnim(true);
				
				// Show product after fade out
				setTimeout(() => {
					if (window.randomClicked) return;
					setShowProductAnim(true);
					
					// Check if there are more than 1 number under radical after coefficient simplification
					setTimeout(() => {
						if (window.randomClicked) return;
						// If there are no radical numbers left, we're done
						const remainingRadicalNumbers = visibleIndices.map(i => factors[i]);
						if (remainingRadicalNumbers.length <= 1) {
							setNoSimplificationNeeded(true);
						} else {
							startRadicalSimplificationAnimation();
						}
					}, 400);
				}, 400);
			}, 600);
		} else {
			// No coefficient simplification needed (0 or 1 coefficient)
			// Check if radical simplification is needed (more than 1 number under radical)
			setTimeout(() => {
				if (window.randomClicked) return;
				// If there are no radical numbers or only 1, we're done
				const remainingRadicalNumbers = visibleIndices.map(i => factors[i]);
				if (remainingRadicalNumbers.length <= 1) {
					setNoSimplificationNeeded(true);
				} else {
					startRadicalSimplificationAnimation();
				}
			}, 100);
		}
	};

	// Function to start radical simplification animation
	const startRadicalSimplificationAnimation = () => {
		// In the simplified step, we need to look at the actual numbers under the radical
		// These are the numbers that are still visible in the simplified step
		const numbersUnderRadical = visibleIndices.map(i => factors[i]);
		
		console.log('Radical animation - numbers under radical:', numbersUnderRadical);
		console.log('Radical animation - visibleIndices:', visibleIndices);
		
		// If there are no numbers under the radical, no simplification needed
		if (numbersUnderRadical.length === 0) {
			setNoSimplificationNeeded(true);
			return;
		}
		
		// If there's only 1 number under the radical, no simplification needed
		if (numbersUnderRadical.length <= 1) {
			setNoSimplificationNeeded(true);
			return;
		}
		
		// Animate all numbers to the leftmost position
		// Get the actual expression indices for numbers (skip multiplication symbols)
		const numberIndices = expression
			.map((item, index) => item.type === 'number' ? index : null)
			.filter(index => index !== null);
		const survivor = 0; // Keep the first one
		
		console.log('Radical animation - numberIndices:', numberIndices);
		console.log('Radical animation - survivor:', survivor);
		console.log('Radical animation - expression length:', expression.length);
		console.log('Radical animation - expression:', expression);
		
		// Start sequential radical combine animation
		setRadicalAnimationStep(1); // Start with step 1 (second number)
		setRadicalCombineAnim({ indices: [numberIndices[0], numberIndices[1]], survivor: 0, phase: 'combine' });
		
		// After first overlap, animate the third number
		setTimeout(() => {
			if (window.randomClicked) return;
			if (numberIndices.length > 2) {
				setRadicalAnimationStep(2); // Step 2 (third number)
				setRadicalCombineAnim({ indices: [numberIndices[0], numberIndices[1], numberIndices[2]], survivor: 0, phase: 'combine' });
			}
			
			// After second overlap, animate the fourth number
			setTimeout(() => {
				if (window.randomClicked) return;
				if (numberIndices.length > 3) {
					setRadicalAnimationStep(3); // Step 3 (fourth number)
					setRadicalCombineAnim({ indices: [numberIndices[0], numberIndices[1], numberIndices[2], numberIndices[3]], survivor: 0, phase: 'combine' });
				}
				
				// After third overlap, animate the fifth number
				setTimeout(() => {
					if (window.randomClicked) return;
					if (numberIndices.length > 4) {
						setRadicalAnimationStep(4); // Step 4 (fifth number)
						setRadicalCombineAnim({ indices: [numberIndices[0], numberIndices[1], numberIndices[2], numberIndices[3], numberIndices[4]], survivor: 0, phase: 'combine' });
					}
					
					// After all overlaps, fade out
					setTimeout(() => {
						if (window.randomClicked) return;
						setRadicalFadeOut(true);
						
						// Show product after fade out
						setTimeout(() => {
							if (window.randomClicked) return;
							setRadicalShowProduct(true);
							
							// Set simplified state when animation is complete
							setTimeout(() => {
								if (window.randomClicked) return;
								setNoSimplificationNeeded(true);
							}, 400);
						}, 400);
					}, 400);
				}, 400);
			}, 400);
		}, 400);
	};

	const nextDisabled = animate || (showFactors && countAvailablePairs() > 0) || showSimplified;

	// Function to count all available same-number pairs under the radical
	function countAvailablePairs() {
		const remainingFactors = factors.filter((_, i) => !removedIndices.includes(i));
		const factorCounts = {};
		remainingFactors.forEach(factor => {
			factorCounts[factor] = (factorCounts[factor] || 0) + 1;
		});
		return Object.values(factorCounts).reduce((sum, count) => sum + Math.floor(count / 2), 0);
	}

	const prevPairCount = useRef(countAvailablePairs());

	useEffect(() => {
		const currentCount = countAvailablePairs();
		if (prevPairCount.current > 0 && currentCount === 0) {
			// All available pairs have been selected
		}
		prevPairCount.current = currentCount;
	}, [removedIndices, factors]);



	return (
		<div className="prime-factorization-outer">
			<div className="prime-factorization-title">Prime Factorization</div>
			<button className="prime-factorization-random-btn" onClick={handleRandomClick}>Random</button>
			<div className="prime-factorization-inner center-content">
				{number && !showFactors && (
					<div className={`center-content sqrt-animate${animate ? ' sqrt-animate-up-fade' : ''}${fadeOut ? ' sqrt-fade-out' : ''}`}>
						{renderSVGStepRadical({ coefficient: 1, numbers: [number], factors, coefficientSlideAnim: false, coefficientFadeOutAnim: false, showProductAnim: false, radicalCombineAnim: null, radicalFadeOut: false, radicalShowProduct: false, noSimplificationNeeded: false, radicalAnimationStep: 0, numberIndices: [] })}
					</div>
				)}
				{number && !showFactors && (
					<div className={`flexi-wave-bubble-container ${fadeOutFirstStep ? 'flexi-first-step-fade-out' : ''}`}>
						<img src={FlexiWave} alt="Flexi Wave" className="flexi-wave-bottom-left" />
						<div className="speech-bubble">
							Split the number into its prime factors.
						</div>
					</div>
				)}
				{showFactors && showSimplified ? (
					<>
						<div className="prime-factors-fade-in center-content">
							<div className="factor-string-container custom-sqrt-radical">
								{(() => {
									if (visibleIndices.length === 0) {
										// No numbers under radical - use simple span
										const textColor = noSimplificationNeeded ? '#008545' : '#000';
										return (
											<span style={{ fontFamily: 'Proxima Nova, Arial, sans-serif', fontWeight: 400, fontSize: 38, color: textColor, lineHeight: '1.1', verticalAlign: 'middle', display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>
												{outsideNumbers && outsideNumbers.length > 0 ? outsideNumbers.join(' × ') : '1'}
											</span>
										);
									} else {
										// There are numbers under the radical - use the SVG rendering
										return renderSVGStepRadical({
											coefficient: outsideNumbers.length > 0 ? outsideNumbers : [],
											numbers: visibleIndices.map(i => factors[i]),
											highlightable: false, // Disable clicking in simplified step
											highlightedIndices: [],
											handleNumberClick: null,
											visibleIndices,
											animatingPairIndices,
											combineAnim,
											factors,
											disabled: true,
											coefficientSlideAnim,
											coefficientFadeOutAnim,
											showProductAnim,
											radicalCombineAnim,
											radicalFadeOut,
											radicalShowProduct,
											noSimplificationNeeded,
											radicalAnimationStep,
											numberIndices: expression.map((item, index) => item.type === 'number' ? index : null).filter(index => index !== null)
										});
									}
								})()}
							</div>
						</div>
						<div className="flexi-wave-bubble-container">
							<img
								src={noSimplificationNeeded ? FlexiStars : FlexiWizard}
								alt={noSimplificationNeeded ? "Flexi Stars" : "Flexi Wizard"}
								className="flexi-wave-bottom-left flexi-telescope-fade-in"
							/>
							<div className="speech-bubble speech-bubble-fade-in">
								{noSimplificationNeeded ? 'Simplified!' : 'Simplifying...'}
							</div>
						</div>
					</>
				) : showFactors && (
					<>
						<div className="prime-factors-fade-in center-content">
							<div className="factor-string-container custom-sqrt-radical">
								{visibleIndices.length === 0 && !combineAnim ? (
									<span style={{ fontFamily: 'Proxima Nova, Arial, sans-serif', fontWeight: 400, fontSize: 38, color: '#000', lineHeight: '1.1', verticalAlign: 'middle', display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>
										{outsideNumbers && outsideNumbers.length > 0 ? outsideNumbers.join(' × ') : '1'}
									</span>
								) : (
									renderSVGStepRadical({
										coefficient: outsideNumbers.length > 0 ? outsideNumbers : [],
										numbers: visibleIndices.map(i => factors[i]),
										highlightable: showFactors && countAvailablePairs() > 0,
										highlightedIndices,
										handleNumberClick: showFactors && countAvailablePairs() > 0 && !combineAnim ? handleNumberClick : null,
										visibleIndices,
										animatingPairIndices,
										combineAnim,
										factors,
										disabled: !!combineAnim,
										coefficientSlideAnim: false,
										coefficientFadeOutAnim: false,
										showProductAnim: false,
										radicalCombineAnim: null,
										radicalFadeOut: false,
										radicalShowProduct: false,
										noSimplificationNeeded: false,
										radicalAnimationStep: 0,
										numberIndices: expression.map((item, index) => item.type === 'number' ? index : null).filter(index => index !== null)
									})
								)}
							</div>
						</div>
						<div className="flexi-wave-bubble-container">
							<img
								src={countAvailablePairs() === 0 ? FlexiWoah : FlexiTelescope}
								alt={countAvailablePairs() === 0 ? "Flexi Woah" : "Flexi Telescope"}
								className="flexi-wave-bottom-left flexi-telescope-fade-in"
								onLoad={() => setTelescopeLoaded(true)}
							/>
							{telescopeLoaded && (
								<div className="speech-bubble speech-bubble-fade-in">
									{countAvailablePairs() === 0
										? "You found all matching pairs!"
										: "Find all the matching pairs."}
								</div>
							)}
						</div>
					</>
				)}
				<button
					className={`prime-factorization-back-btn ${!(showFactors || showSimplified) || combineAnim ? 'disabled' : ''}`}
					onClick={handleBackClick}
					disabled={!(showFactors || showSimplified) || combineAnim}
				>
					&lt;
				</button>
				<button
					className={`prime-factorization-next-btn${nextDisabled ? ' disabled' : ''}`}
					onClick={handleNextClick}
					disabled={nextDisabled}
					style={{ left: 'calc(50% + 48px)', transform: 'translateX(-50%)' }}
				>
					{'>'}
				</button>
			</div>
		</div>
	);
};

export default SimplifySqRtPrime;