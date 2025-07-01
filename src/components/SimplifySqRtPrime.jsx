import React, { useState, useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import './SimplifySqRtPrime.css';
import FlexiWave from '../assets/All Flexi Poses/PNG/Flexi_Wave.png';
import FlexiTelescope from '../assets/All Flexi Poses/PNG/Flexi_Telescope.png';

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

// Component for individual clickable numbers
const ClickableNumber = ({ number, index, isHighlighted, onClick, isRemoved }) => {
	return (
		<span
			className={`clickable-number ${isHighlighted ? 'highlighted' : ''} ${isRemoved ? 'removed' : ''}`}
			onClick={isRemoved ? undefined : () => onClick(index)}
			style={{ pointerEvents: isRemoved ? 'none' : 'auto', opacity: isRemoved ? 0.3 : 1 }}
		>
			{number}
		</span>
	);
};

const SimplifySqRtPrime = () => {
	const [number, setNumber] = useState(null);
	const [showFactors, setShowFactors] = useState(false);
	const [animate, setAnimate] = useState(false);
	const [fadeOut, setFadeOut] = useState(false);
	const [highlightedIndices, setHighlightedIndices] = useState([]);
	const [removedIndices, setRemovedIndices] = useState([]);
	const [outsideNumbers, setOutsideNumbers] = useState([]);
	const [history, setHistory] = useState([]);
	const lastMovedPair = useRef([]);

	useEffect(() => {
		setNumber(getRandomNumber());
		setRemovedIndices([]);
		setOutsideNumbers([]);
	}, []);

	const handleRandomClick = () => {
		setNumber((prev) => getRandomNumber(prev));
		setShowFactors(false);
		setAnimate(false);
		setFadeOut(false);
		setHighlightedIndices([]);
		setRemovedIndices([]);
		setOutsideNumbers([]);
		setHistory([]);
	};

	const handleNextClick = () => {
		setAnimate(true);
		setFadeOut(true);
		setTimeout(() => {
			setShowFactors(true);
			setFadeOut(false);
		}, 350); // match fade out duration
	};

	const handleBackClick = () => {
		if (showFactors) {
			if (history.length > 0) {
				const prev = history[history.length - 1];
				setOutsideNumbers(prev.outsideNumbers);
				setRemovedIndices(prev.removedIndices);
				setHistory(hist => hist.slice(0, -1));
			} else {
				// No more pairs to undo, immediately go back to original sqrt step
				setShowFactors(false);
				setAnimate(false);
				setFadeOut(false);
				setHighlightedIndices([]);
			}
		}
		// If showFactors is false, do nothing (button should be disabled)
	};

	let factors = number ? getPrimeFactors(number) : [];

	const handleNumberClick = (index) => {
		if (removedIndices.includes(index)) return;
		setHighlightedIndices(prev => {
			// Remove highlight if already highlighted
			if (prev.includes(index)) {
				lastMovedPair.current = []; // reset on deselect
				return prev.filter(i => i !== index);
			}
			// Only run move-out logic if this is the second highlight and both are not removed
			if (prev.length === 1) {
				const firstIdx = prev[0];
				if (
					factors[firstIdx] === factors[index] &&
					firstIdx !== index &&
					!removedIndices.includes(firstIdx) &&
					!removedIndices.includes(index)
				) {
					// Check if this pair was just moved out
					const pairKey = [firstIdx, index].sort().join('-');
					if (lastMovedPair.current[0] === pairKey) {
						return [];
					}
					lastMovedPair.current[0] = pairKey;
					setRemovedIndices(prevInds => [...prevInds, firstIdx, index]);
					setOutsideNumbers(prevNums => [...prevNums, factors[index]]);
					setHistory(hist => [
						...hist,
						{
							outsideNumbers: [...outsideNumbers, factors[index]],
							removedIndices: [...removedIndices, firstIdx, index]
						}
					]);
					// Clear highlights so this can't run again for the same pair
					return [];
				}
			}
			// Otherwise, add this index to highlights and reset lastMovedPair
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
		return visibleIndices.map((i, idx) => (
			<React.Fragment key={i}>
				<ClickableNumber
					number={factors[i]}
					index={i}
					isHighlighted={highlightedIndices.includes(i)}
					onClick={handleNumberClick}
					isRemoved={removedIndices.includes(i)}
				/>
				{idx < visibleIndices.length - 1 && <span className="times-symbol"> × </span>}
			</React.Fragment>
		));
	};

	const renderOutsideNumbers = () => {
		if (outsideNumbers.length === 0) return null;
		// Show every number moved out, in order, with duplicates (one per pair)
		return (
			<span className="outside-radical">
				{outsideNumbers.map((value, idx) => (
					<React.Fragment key={idx}>
						{value}
						{idx < outsideNumbers.length - 1 && <span className="times-symbol"> × </span>}
					</React.Fragment>
				))}
			</span>
		);
	};

	return (
		<div className="prime-factorization-outer">
			<div className="prime-factorization-title">Prime Factorization</div>
			<button className="prime-factorization-random-btn" onClick={handleRandomClick}>Random</button>
			<div className="prime-factorization-inner center-content">
				{number && !showFactors && (
					<div className={`center-content sqrt-animate${animate ? ' sqrt-animate-up-fade' : ''}${fadeOut ? ' sqrt-fade-out' : ''}`}>
						<BlockMath math={`\\sqrt{${number}}`} />
					</div>
				)}
				{number && !showFactors && (
					<div className="flexi-wave-bubble-container">
						<img src={FlexiWave} alt="Flexi Wave" className="flexi-wave-bottom-left" />
						<div className="speech-bubble">
							Split the number into its prime factors.
						</div>
					</div>
				)}
				{showFactors && (
					<div className="prime-factors-fade-in center-content">
						<div className="factor-string-container custom-sqrt-radical">
							{renderOutsideNumbers()}
							<span className="sqrt-visible">√</span>
							<span className="factor-string">
								{renderFactorString()}
							</span>
						</div>
					</div>
				)}
				{showFactors && (
					<div className="flexi-wave-bubble-container">
						<img src={FlexiTelescope} alt="Flexi Telescope" className="flexi-wave-bottom-left" />
						<div className="speech-bubble">
							Find all the matching pairs.
						</div>
					</div>
				)}
				{/* Back arrow button */}
				<button
					className={`prime-factorization-back-btn ${!showFactors ? 'disabled' : ''}`}
					onClick={handleBackClick}
					disabled={!showFactors}
				>
					&lt;
				</button>
				{/* Next button */}
				<button
					className="prime-factorization-next-btn"
					onClick={handleNextClick}
					disabled={animate || showFactors}
					style={{ left: 'calc(50% + 48px)', transform: 'translateX(-50%)' }}
				>
					{'>'}
				</button>
			</div>
		</div>
	);
};

export default SimplifySqRtPrime;