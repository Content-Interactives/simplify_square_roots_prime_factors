import React, { useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import './SimplifySqRtPrime.css';

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
const ClickableNumber = ({ number, index, isHighlighted, onClick }) => {
	return (
		<span 
			className={`clickable-number ${isHighlighted ? 'highlighted' : ''}`}
			onClick={() => onClick(index)}
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
			if (prev.includes(index)) {
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
					// Store history for back navigation
					setHistory(hist => [...hist, { outsideNumbers: [...outsideNumbers], removedIndices: [...removedIndices] }]);
					// Add only the value of the first number in the pair
					setOutsideNumbers(nums => [...nums, factors[firstIdx]]);
					setRemovedIndices(inds => [...inds, firstIdx, index]);
					return [];
				}
			}
			if (prev.length >= 2) {
				return [prev[1], index];
			}
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
				/>
				{idx < visibleIndices.length - 1 && <span className="times-symbol"> × </span>}
			</React.Fragment>
		));
	};

	const renderOutsideNumbers = () => {
		if (removedIndices.length === 0 || outsideNumbers.length === 0) return null;
		// Only deduplicate for display, not for state/history
		const uniqueValues = [];
		outsideNumbers.forEach(val => {
			if (!uniqueValues.includes(val)) uniqueValues.push(val);
		});
		return (
			<span className="outside-radical">
				{uniqueValues.map((value, idx) => (
					<React.Fragment key={idx}>
						{value}
						{idx < uniqueValues.length - 1 && <span className="times-symbol"> × </span>}
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
				{/* Back arrow button */}
				<button
					className="prime-factorization-next-btn"
					onClick={handleBackClick}
					disabled={!showFactors}
					style={{ left: 'calc(50% - 48px)', transform: 'translateX(-50%)' }}
				>
					{'<'}
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