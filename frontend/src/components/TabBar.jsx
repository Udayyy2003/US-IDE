import React, { useRef, useEffect } from 'react';
import { useTabs } from '../contexts/TabContext';
import Tab from './Tab';

const TabBar = () => {
  const { tabs, activeTabIndex } = useTabs();
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll to active tab
  useEffect(() => {
    if (scrollRef.current && activeTabIndex !== -1) {
      const activeTab = scrollRef.current.children[activeTabIndex];
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTabIndex]);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      background: '#1a1a28', 
      borderBottom: '1px solid #2a2a3d',
      position: 'relative',
      height: 42, // Slightly taller for scrollbar
    }}>
      {/* Left Scroll Button */}
      <button 
        onClick={() => scroll('left')}
        style={{
          background: '#1a1a28',
          border: 'none',
          color: '#aaaacc',
          cursor: 'pointer',
          padding: '0 8px',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid #2a2a3d',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#e8e8f0'}
        onMouseLeave={e => e.currentTarget.style.color = '#aaaacc'}
      >
        ◀
      </button>

      {/* Tabs Container */}
      <div 
        ref={scrollRef}
        style={{ 
          display: 'flex', 
          flex: 1, 
          overflowX: 'auto', // Enable scrolling
          height: '100%',
          scrollBehavior: 'smooth',
        }}
        className="tab-scrollbar"
      >
        {tabs.map((tab, index) => (
          <Tab key={tab.path} tab={tab} index={index} />
        ))}
        {/* Custom IDE Scrollbar Styling */}
        <style>{`
          .tab-scrollbar::-webkit-scrollbar {
            height: 3px;
          }
          .tab-scrollbar::-webkit-scrollbar-track {
            background: #1a1a28;
          }
          .tab-scrollbar::-webkit-scrollbar-thumb {
            background: #2a2a4a;
            border-radius: 10px;
          }
          .tab-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #7c6df580;
          }
          /* Hide buttons for non-hover states if needed */
          .tab-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #2a2a4a #1a1a28;
          }
        `}</style>
      </div>

      {/* Right Scroll Button */}
      <button 
        onClick={() => scroll('right')}
        style={{
          background: '#1a1a28',
          border: 'none',
          color: '#aaaacc',
          cursor: 'pointer',
          padding: '0 8px',
          height: '100%',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '1px solid #2a2a3d',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#e8e8f0'}
        onMouseLeave={e => e.currentTarget.style.color = '#aaaacc'}
      >
        ▶
      </button>
    </div>
  );
};

export default TabBar;
