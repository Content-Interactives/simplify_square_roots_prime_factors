import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import './SimplifySqRtPrime.css';
import FlexiWave from '../assets/All Flexi Poses/PNG/Flexi_Wave.png';
import FlexiTelescope from '../assets/All Flexi Poses/PNG/Flexi_Telescope.png';
import FlexiWoah from '../assets/All Flexi Poses/PNG/Flexi_Woah.png';
import FlexiStars from '../assets/All Flexi Poses/PNG/Flexi_Stars.png';

const SIMPLIFIABLE_NUMBERS = [4, 8, 9, 12, 16, 18, 20, 24, 25, 27, 28, 32, 36, 40, 44, 45, 48, 49, 50, 52, 54, 56, 60, 63, 64, 72, 75, 76, 80, 81, 84, 88, 90, 96, 98, 100, 104, 108, 112, 116, 117, 120, 121, 124, 125, 126, 128, 132, 135, 136, 140, 144, 147, 148, 150, 152, 153, 156, 160, 162, 164, 168, 169, 171, 172, 176, 180, 184, 188, 189, 192, 196, 198, 200];

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
function renderSVGStepRadical({ coefficient, numbers, highlightable = false, highlightedIndices = [], handleNumberClick = null, visibleIndices = [], animatingPairIndices = [], combineAnim = null, factors = [], color = '#000', radicalColor = '#000' }) {
  // Build expression array
  const expression = [];
  numbers.forEach((value, idx) => {
    expression.push({ type: 'number', value, id: idx });
    if (idx < numbers.length - 1) {
      expression.push({ type: 'symbol', value: '×', id: `x-${idx}` });
    }
  });
  const numberFontSize = 30; // new font size for numbers under the radical
  const numberWidth = 30; // adjust width per number or symbol to match font size
  const radicalBuffer = 0; // no extra left buffer
  const radicalHeight = 150; // SVG height
  const verticalOffset = 30; // move content lower in the box
  const radicalYOffset = -10 + verticalOffset; // move numbers up by another 5px
  const radicalTop = 50 + verticalOffset; // radical bar position
  const radicalBottom = radicalHeight - 10;
  const radicalHook = radicalTop + 25;
  const radicalHookEnd = radicalTop + 45;
  const radicalBarY = radicalTop;
  // Dynamically adjust radicalStart for single, double, triple digit numbers
  let radicalStart;
  if (numbers.length === 1) {
    // Use measureTextWidth to get the width of the number
    const numStr = String(numbers[0]);
    const numWidth = measureTextWidth(numStr, numberFontSize);
    // For single/double/triple digit, align left edge of number with radical hook
    radicalStart = Math.max(18, 38 - (numWidth / 2) + 10); // 38 is default, 18 is min, 10 is fudge factor
  } else {
    radicalStart = 38 + radicalBuffer;
  }
  // Now calculate radicalEnd after all dependencies are defined
  const radicalEnd = radicalStart + (expression.length * numberWidth);
  const radicalBarXStart = radicalStart - 14;
  const radicalBarXEnd = radicalEnd + 10;
  const getSquareRootWidth = () => radicalEnd;
  // Calculate the total width needed for the expression
  const expressionWidth = (numbers.length * numberWidth) + ((numbers.length - 1) * numberWidth); // numbers + symbols
  // Calculate the width for the radical and coefficients
  let coeffArray = [];
  if (Array.isArray(coefficient)) {
    coeffArray = coefficient;
  } else if (typeof coefficient === 'number' && coefficient > 1) {
    coeffArray = [coefficient];
  }
  const coeffFontSize = numberFontSize;
  const coeffSpacing = 32;
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
  const svgWidth = radicalStart + radicalOffset + (expression.length * numberWidth) + 60;
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
  coeffArray.forEach((n, i) => {
    const nStr = String(n);
    const nWidth = numberWidth; // use same width as numbers under radical
    coeffElements.push(
      <text
        key={`coeff-${i}`}
        x={coeffXLocal + nWidth / 2}
        y={radicalTop + radicalYOffset + 24}
        textAnchor="middle"
        fontFamily="Proxima Nova"
        fontSize={numberFontSize}
        fontWeight="400"
        fill={color}
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
          fill={color}
        >
          ×
        </text>
      );
      coeffXLocal += timesWidth;
    }
  });
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

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
      <svg
        width={svgWidth}
        height={radicalHeight}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Coefficient numbers to the left of the radical, spaced dynamically */}
        {/* Center the radical and numbers group, including coefficients */}
        {(() => {
          // Calculate extra space if more than one coefficient
          const extraCoeffSpace = coeffArray.length > 1 ? (coeffArray.length - 1) * 10 : 0;
          return (
            <g transform={`translate(${centerOffset},0)`}>
              {/* Move coefficients left so they don't overlap the radical, with extra space for multiple coefficients */}
              <g transform={`translate(${-24 - extraCoeffSpace},0)`}>{coeffElements}</g>
              {/* Radical and numbers, shifted right if coefficient present */}
              {/* Calculate radical shift for new coefficient */}
              {(() => {
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
                // let radicalShiftX = totalCoeffWidth;
                // let radicalShiftClass = '';
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
                return (
                  <>
                    {/* Render survivor outside the radical group during moveLeft, radicalShift and dropDown phases */}
                    {combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'radicalShift' || combineAnim.phase === 'dropDown') && (() => {
                      const survivorItem = expression.find(item => item.type === 'number' && visibleIndices[item.id] === combineAnim.survivor);
                      if (survivorItem) {
                        // For moveLeft phase, calculate from current position
                        // For radicalShift and dropDown phases, use the final coefficient position
                        let survivorX, targetX;
                        
                        if (combineAnim.phase === 'moveLeft') {
                          // Calculate the survivor's position based on its current position in the expression
                          const survivorExprIdx = expression.findIndex(e => e.type === 'number' && visibleIndices[e.id] === combineAnim.survivor);
                          survivorX = radicalStart + (survivorExprIdx * numberWidth);
                        } else {
                          // For radicalShift and dropDown, use the final coefficient position
                          survivorX = 0; // Will be overridden by targetX
                        }
                        
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
                        
                        if (combineAnim.phase === 'moveLeft') {
                          // Calculate target position: move left from current position to coefficient position
                          targetX = -(survivorX - coeffX + 28);
                        } else {
                          // For radicalShift and dropDown, use the final coefficient position
                          targetX = -(0 - coeffX + 28);
                        }
                        const numStr = String(survivorItem.value);
                        const rectWidth = Math.max(20, numStr.length * 22);
                        let combineClass = '';
                        let combineStyle = { '--move-left-x': `${targetX}px` };
                        if (combineAnim.phase === 'moveLeft') {
                          combineClass = 'number-move-left-after-combine';
                        } else if (combineAnim.phase === 'radicalShift') {
                          // During radicalShift, the survivor should stay at the coefficient position
                          combineClass = 'number-stay-in-position';
                          // Use the final target position for radicalShift and dropDown phases
                          combineStyle = { '--move-left-x': `${targetX}px` };
                        } else if (combineAnim.phase === 'dropDown') {
                          combineClass = 'number-move-down-after-left';
                          // Use the final target position for dropDown phase
                          combineStyle = { '--move-left-x': `${targetX}px` };
                        }
                        
                        return (
                          <g 
                            key={`survivor-${combineAnim.survivor}`} 
                            style={{ ...combineStyle }} 
                            className={combineClass}
                            // REVERT: Remove radicalOffset from the translate below
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
                      }
                      return null;
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
                        stroke={radicalColor}
                        strokeWidth="4"
                        fill="none"
                        strokeLinejoin="round"
                      />
                      {expression.map((item, index) => {
                        let xPosition = radicalStart + (index * numberWidth);
                        if (item.type === 'number') {
                          const factorIdx = visibleIndices[index / 2 | 0];
                          const isHighlighted = highlightable && highlightedIndices.includes(factorIdx);
                          
                          // Skip rendering survivor during moveLeft, radicalShift and dropDown phases (it's rendered separately)
                          if (combineAnim && (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'radicalShift' || combineAnim.phase === 'dropDown') && factorIdx === combineAnim.survivor) {
                            return null;
                          }
                          
                          // Combine animation logic
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
                                  combineClass = 'number-slide-to-combine';
                                  combineStyle = { '--combine-x': `${slideX}px` };
                                } else {
                                  combineClass = 'number-move-up-combine';
                                }
                              } else {
                                combineClass = 'number-move-up-combine';
                              }
                            } else if (combineAnim.phase === 'moveLeft' || combineAnim.phase === 'radicalShift' || combineAnim.phase === 'dropDown') {
                              // Hide non-survivor and handle survivor separately
                              if (factorIdx !== survivor) {
                                combineStyle = { display: 'none' };
                              } else {
                                combineStyle = { display: 'none' }; // Survivor is handled separately
                              }
                            }
                          }
                          // Calculate rect width based on number of digits
                          const numStr = String(item.value);
                          const rectWidth = Math.max(20, numStr.length * 22); // 22px per digit, min 20px
                          return (
                            <g key={item.id} style={{ cursor: highlightable ? 'pointer' : 'default', ...combineStyle }} className={combineClass}>
                              <rect
                                x={xPosition}
                                y={radicalTop + radicalYOffset}
                                width={rectWidth}
                                height="32"
                                fill={isHighlighted ? '#fef08a' : 'transparent'}
                                onClick={highlightable && handleNumberClick ? () => handleNumberClick(factorIdx) : undefined}
                              />
                              <text
                                x={xPosition + rectWidth / 2}
                                y={radicalTop + radicalYOffset + 24}
                                textAnchor="middle"
                                fontFamily="Proxima Nova"
                                fontSize={numberFontSize}
                                fontWeight="400"
                                fill={color}
                                style={{ pointerEvents: 'none' }}
                              >
                                {item.value}
                              </text>
                            </g>
                          );
                        } else if (item.type === 'symbol') {
                          return (
                            <text
                              key={item.id}
                              x={xPosition + 10}
                              y={radicalTop + radicalYOffset + 24}
                              textAnchor="middle"
                              fontFamily="Proxima Nova"
                              fontSize={numberFontSize - 6}
                              fontWeight="400"
                              fill={color}
                            >
                              {item.value}
                            </text>
                          );
                        }
                        return null;
                      })}
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

	useEffect(() => {
		setNumber(144); // For testing, always start with 144
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
	const handleNumberHover = (id, isHover) => {};
	// --- End reference logic ---

	const handleRandomClick = () => {
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
	};

	const handleNextClick = () => {
		if (showFactors && countAvailablePairs() === 0 && !showSimplified) {
			setShowSimplified(true);
			return;
		}
		setAnimate(true);
		setFadeOut(true);
		setFadeOutFirstStep(true);
		setTelescopeLoaded(false);
		setTimeout(() => {
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
					setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'up' });
					setTimeout(() => {
						setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'combine' });
						setTimeout(() => {
							// Add a pause before moveLeft
							setTimeout(() => {
								setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'moveLeft' });
								setTimeout(() => {
									setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'radicalShift' });
									setTimeout(() => {
										setCombineAnim({ indices: [firstIdx, index], survivor, phase: 'dropDown' });
										setTimeout(() => {
											// Update state only after all animations complete
											setRemovedIndices(prevInds => [...prevInds, firstIdx, index]);
											setOutsideNumbers(prevNums => [...prevNums, factors[survivor]]);
											setHistory(hist => [
												...hist,
												{
													outsideNumbers: [...outsideNumbers, factors[survivor]],
													removedIndices: [...removedIndices, firstIdx, index]
												}
											]);
											setCombineAnim(null);
										}, 400);
									}, 400);
								}, 400);
							}, 400); // Pause after combine
						}, 500);
					}, 400);
					return [];
				}
			}
			if (prev.length >= 2) {
				lastMovedPair.current = [];
				return [prev[1], index];
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

	const nextDisabled = animate || (showFactors && (countAvailablePairs() > 0 || showSimplified));
	console.log('nextDisabled:', nextDisabled, 'countAvailablePairs:', countAvailablePairs(), 'removedIndices:', removedIndices);

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
			console.log('All available pairs have been selected!');
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
						{renderSVGStepRadical({ coefficient: 1, numbers: [number], factors })}
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
									const coefficient = outsideNumbers.length > 0 ? outsideNumbers.reduce((a, b) => a * b, 1) : 1;
									const remainingIndices = factors.map((_, i) => i).filter(i => !removedIndices.includes(i));
									const radicand = remainingIndices.length > 0 ? remainingIndices.map(i => factors[i]).reduce((a, b) => a * b, 1) : 1;
									if (radicand === 1) {
										return <span style={{ fontSize: 38, fontFamily: 'Proxima Nova, Arial, sans-serif', fontWeight: 400, color: '#008545', lineHeight: '1.1', verticalAlign: 'middle', display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>{coefficient}</span>;
									}
									return renderSVGStepRadical({ coefficient, numbers: [radicand], animatingPairIndices, combineAnim, factors, color: '#008545', radicalColor: '#008545' });
								})()}
							</div>
						</div>
						<div className="flexi-wave-bubble-container">
							<img
								src={FlexiStars}
								alt="Flexi Stars"
								className="flexi-wave-bottom-left flexi-telescope-fade-in"
							/>
							<div className="speech-bubble speech-bubble-fade-in">
								It's simplified!
							</div>
						</div>
					</>
				) : showFactors && (
					<>
						<div className="prime-factors-fade-in center-content">
							<div className="factor-string-container custom-sqrt-radical">
								{visibleIndices.length === 0 ? (
									<span style={{ fontFamily: 'Proxima Nova, Arial, sans-serif', fontWeight: 400, fontSize: 38, color: '#000', lineHeight: '1.1', verticalAlign: 'middle', display: 'inline-block', minWidth: '32px', textAlign: 'center' }}>
										{outsideNumbers.length > 0 ? outsideNumbers.join(' × ') : ''}
									</span>
								) : (
									renderSVGStepRadical({
										coefficient: outsideNumbers.length > 0 ? outsideNumbers : [],
										numbers: visibleIndices.map(i => factors[i]),
										highlightable: showFactors && countAvailablePairs() > 0,
										highlightedIndices,
										handleNumberClick: showFactors && countAvailablePairs() > 0 ? handleNumberClick : null,
										visibleIndices,
										animatingPairIndices,
										combineAnim,
										factors
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
					className={`prime-factorization-back-btn ${!(showFactors || showSimplified) ? 'disabled' : ''}`}
					onClick={handleBackClick}
					disabled={!(showFactors || showSimplified)}
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