<div className="w-[464px] mx-auto mt-8 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Demo: Clickable Numbers in Square Root</h3>
                <div className="w-[320px] mx-auto bg-white border border-gray-300 rounded-md p-4 relative">
                    <svg
                        width="300"
                        height="60"
                        viewBox="0 0 300 60"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Square root symbol - dynamic width */}
                        <polyline
                            points={10,35 16,45 24,20 ${getSquareRootWidth()},20}
                            stroke="#000"
                            strokeWidth="2"
                            fill="none"
                            strokeLinejoin="round"
                        />
                        
                        {/* Dynamic expression rendering */}
                        {expression.map((item, index) => {
                            const xPosition = 28 + (index * 20);
                            
                            if (item.type === 'number') {
                                return (
                                    <g key={item.id}>
                                        <rect
                                            x={xPosition}
                                            y="30"
                                            width="12"
                                            height="16"
                                            fill={highlightedNumbers[item.id] ? "#fef08a" : "transparent"}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleNumberClick(item.id)}
                                            onMouseEnter={() => handleNumberHover(item.id, true)}
                                            onMouseLeave={() => handleNumberHover(item.id, false)}
                                        />
                                        <text
                                            x={xPosition + 6}
                                            y="42"
                                            textAnchor="middle"
                                            fontFamily="system-ui, -apple-system, sans-serif"
                                            fontWeight="bold"
                                            fontSize="16"
                                            fill="#000"
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
                                        x={xPosition + 6}
                                        y="42"
                                        textAnchor="middle"
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                        fontWeight="bold"
                                        fontSize="16"
                                        fill="#000"
                                    >
                                        {item.value}
                                    </text>
                                );
                            }
                            return null;
                        })}
                    </svg>
                    
                    <div className="text-xs text-gray-500 mt-2 text-center">
                        Click to highlight numbers (max 2 at a time). Matching numbers will be removed!
                    </div>
                </div>
            </div>