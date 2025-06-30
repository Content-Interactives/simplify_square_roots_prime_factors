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
	const [pairOrder, setPairOrder] = useState([]);

	useEffect(() => {
		setNumber(getRandomNumber());
		setRemovedIndices([]);
		setPairOrder([]);
	}, []);

	const handleRandomClick = () => {
		setNumber((prev) => getRandomNumber(prev));
		setShowFactors(false);
		setAnimate(false);
		setFadeOut(false);
		setHighlightedIndices([]);
		setRemovedIndices([]);
		setPairOrder([]);
	};

	const handleNextClick = () => {
		setAnimate(true);
		setFadeOut(true);
		setTimeout(() => {
			setShowFactors(true);
			setFadeOut(false);
		}, 350); // match fade out duration
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
					// Only add the number to pairOrder if not already present
					setPairOrder(order => order.includes(factors[index]) ? order : [...order, factors[index]]);
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
		if (removedIndices.length === 0 || pairOrder.length === 0) return null;
		// Count how many times each number was removed
		const removedCounts = {};
		removedIndices.forEach(i => {
			const n = factors[i];
			removedCounts[n] = (removedCounts[n] || 0) + 1;
		});
		// For each number in pairOrder (in order of appearance), if at least one pair, show it once
		const seen = new Set();
		const outside = [];
		pairOrder.forEach(n => {
			if (!seen.has(n) && Math.floor((removedCounts[n] || 0) / 2) > 0) {
				outside.push(n);
				seen.add(n);
			}
		});
		if (outside.length === 0) return null;
		return (
			<span className="outside-radical">
				{outside.map((n, idx) => (
					<React.Fragment key={idx}>
						{n}
						{idx < outside.length - 1 && <span className="times-symbol"> × </span>}
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
				<button className="prime-factorization-next-btn" onClick={handleNextClick} disabled={animate || showFactors}>
					&gt;
				</button>
			</div>
		</div>
	);
};

export default SimplifySqRtPrime;