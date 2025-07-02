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

// Component for individual clickable numbers
const ClickableNumber = ({ number, index, isHighlighted, onClick, isRemoved, disabled }) => (
	<span
		className={`clickable-number ${isHighlighted ? 'highlighted' : ''} ${isRemoved ? 'removed' : ''} ${disabled ? 'disabled' : ''}`}
		onClick={disabled || isRemoved ? undefined : () => onClick(index)}
		style={{
			pointerEvents: disabled || isRemoved ? 'none' : 'auto',
			opacity: isRemoved ? 0.3 : 1
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
		if (showFactors) {
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

	let factors = number ? getPrimeFactors(number) : [];

	const handleNumberClick = (index) => {
		if (removedIndices.includes(index)) return;
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
					setRemovedIndices(prevInds => [...prevInds, firstIdx, index]);
					setOutsideNumbers(prevNums => [...prevNums, factors[index]]);
					setHistory(hist => [
						...hist,
						{
							outsideNumbers: [...outsideNumbers, factors[index]],
							removedIndices: [...removedIndices, firstIdx, index]
						}
					]);
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
						<BlockMath math={`\\sqrt{${number}}`} />
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
									return (
										<span style={{ fontSize: 45 }}>
											{coefficient !== 1 ? coefficient : ''}
											{radicand !== 1 ? <span>√{radicand}</span> : ''}
											{coefficient === 1 && radicand === 1 ? '1' : ''}
										</span>
									);
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
								{renderOutsideNumbers()}
								<span className="sqrt-visible">√</span>
								<span className="factor-string">
									{renderFactorString()}
								</span>
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
					className={`prime-factorization-back-btn ${!showFactors ? 'disabled' : ''}`}
					onClick={handleBackClick}
					disabled={!showFactors}
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