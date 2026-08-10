import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ text, children, position = 'top', style = {}, interactive = false, theme = 'light' }) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const hideTimeout = useRef(null);

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#000000' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#374151';
    const borderColor = isDark ? '#000000' : '#e5e7eb';

    const handleMouseEnter = () => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        if (interactive) {
            // Give user more time to move mouse into tooltip
            hideTimeout.current = setTimeout(() => {
                setIsVisible(false);
            }, 500);
        } else {
            setIsVisible(false);
        }
    };

    useLayoutEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let top = 0;
            let left = 0;

            // Base distance from element
            const offset = 12;

            switch (position) {
                case 'top':
                    top = rect.top - offset + window.scrollY;
                    left = rect.left + rect.width / 2 + window.scrollX;
                    break;
                case 'bottom':
                    top = rect.bottom + offset + window.scrollY;
                    left = rect.left + rect.width / 2 + window.scrollX;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 + window.scrollY;
                    left = rect.left - offset + window.scrollX;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2 + window.scrollY;
                    left = rect.right + offset + window.scrollX;
                    break;
                default:
                    top = rect.top - offset + window.scrollY;
                    left = rect.left + rect.width / 2 + window.scrollX;
            }

            setCoords({ top, left });
        }
    }, [isVisible, position]);

    const getTransform = () => {
        switch (position) {
            case 'top': return 'translate(-50%, -100%)';
            case 'bottom': return 'translate(-50%, 0)';
            case 'left': return 'translate(-100%, -50%)';
            case 'right': return 'translate(0, -50%)';
            default: return 'translate(-50%, -100%)';
        }
    };

    const getArrowStyle = () => {
        const base = {
            position: 'absolute',
            borderWidth: '6px',
            borderStyle: 'solid',
        };
        switch (position) {
            case 'top':
                return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', borderColor: `${bgColor} transparent transparent transparent` };
            case 'bottom':
                return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', borderColor: `transparent transparent ${bgColor} transparent` };
            case 'left':
                return { ...base, left: '100%', top: '50%', transform: 'translateY(-50%)', borderColor: `transparent transparent transparent ${bgColor}` };
            case 'right':
                return { ...base, right: '100%', top: '50%', transform: 'translateY(-50%)', borderColor: `transparent ${bgColor} transparent transparent` };
            default:
                return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', borderColor: `${bgColor} transparent transparent transparent` };
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="tooltip-trigger"
                style={{
                    display: 'inline-block', // default
                    ...style
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>

            {isVisible && text && createPortal(
                <div style={{
                    position: 'absolute',
                    top: coords.top,
                    left: coords.left,
                    transform: getTransform(),
                    padding: '6px 10px',
                    background: bgColor,
                    color: textColor,
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    whiteSpace: 'nowrap',
                    zIndex: 20000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: `1px solid ${borderColor}`,
                    pointerEvents: interactive ? 'auto' : 'none',
                    animation: 'tooltipFadeIn 0.15s ease-out',
                }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <style>{`
                        @keyframes tooltipFadeIn {
                            from { opacity: 0; transform: ${getTransform()} scale(0.95); }
                            to { opacity: 1; transform: ${getTransform()} scale(1); }
                        }
                    `}</style>
                    {text}
                    {/* Arrow */}
                    <div style={getArrowStyle()} />
                    {/* Subtle Arrow Border */}
                    <div style={{
                        ...getArrowStyle(),
                        borderWidth: '7px',
                        zIndex: -1,
                        borderColor: position === 'top' ? '#e5e7eb transparent transparent transparent' :
                            position === 'bottom' ? 'transparent transparent #e5e7eb transparent' :
                                position === 'left' ? 'transparent transparent transparent #e5e7eb' :
                                    'transparent #e5e7eb transparent transparent',
                        [position === 'top' ? 'top' : position === 'bottom' ? 'bottom' : position === 'left' ? 'left' : 'right']: '100%'
                    }} />
                </div>,
                document.body
            )}
        </>
    );
}
